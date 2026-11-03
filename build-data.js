#!/usr/bin/env node
// Pearlascope data puller. Free sources only. Writes data.json.
// Run: node build-data.js
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'data.json');
const RAW = path.join(__dirname, 'data', 'raw'); // CoinMetrics Community early-days hashrate, pulled once
const CG = 'https://api.coingecko.com/api/v3/coins/pearl-2';

// Emission curve from node/blockchain/validate.go CalcBlockSubsidy
const MAX = 2.1e9, K = 650226, BLOCK_S = 194;
const supplyAt = h => MAX * h / (h + K);
const heightFor = s => (s * K) / (MAX - s);

async function get(url) {
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

function readJSON(f) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
}

// local=true reads the static files (early hashrate, tweets); the Vercel function passes false and carries them over from the bundled snapshot.
async function build(prev = {}, local = true) {
  const out = { updated: new Date().toISOString(), sources: {} };

  // Price + market
  try {
    const c = await get(`${CG}?localization=false&tickers=true&community_data=false&developer_data=false`);
    const m = c.market_data;
    out.market = {
      price: m.current_price.usd, mcap: m.market_cap.usd, fdv: m.fully_diluted_valuation.usd,
      volume24h: m.total_volume.usd, chg24h: m.price_change_percentage_24h, chg7d: m.price_change_percentage_7d,
      chg30d: m.price_change_percentage_30d, ath: m.ath.usd, athDate: m.ath_date.usd,
      circulating: m.circulating_supply,
    };
    const h = heightFor(m.circulating_supply);
    const perBlock = supplyAt(h + 1) - supplyAt(h);
    out.supply = {
      heightImplied: Math.round(h), rewardPerBlock: perBlock,
      perDay: perBlock * 86400 / BLOCK_S,
      pctMined: m.circulating_supply / MAX,
      growth12m: supplyAt(h + 365 * 86400 / BLOCK_S) / m.circulating_supply - 1,
    };
    const vol = {};
    for (const t of c.tickers || []) {
      if (t.is_stale || t.is_anomaly) continue;
      const k = t.market.name + '|' + t.base + '/' + t.target;
      vol[k] = { venue: t.market.name, pair: `${t.base}/${t.target}`, usd: t.converted_volume.usd, url: t.trade_url };
    }
    out.venues = Object.values(vol).sort((a, b) => b.usd - a.usd).slice(0, 6);
    out.sources.market = 'CoinGecko /coins/pearl-2';
  } catch (e) { console.error('market:', e.message); out.market = prev.market; out.supply = prev.supply; out.venues = prev.venues; }

  // Neighbours for the thesis valuation ladder
  try {
    const r = await get('https://api.coingecko.com/api/v3/simple/price?ids=zcash,bittensor,bitcoin&vs_currencies=usd&include_market_cap=true');
    out.refs = { zec: r.zcash.usd_market_cap, tao: r.bittensor.usd_market_cap, btc: r.bitcoin.usd_market_cap };
  } catch (e) { console.error('refs:', e.message); out.refs = prev.refs; }

  try {
    const ch = await get(`${CG}/market_chart?vs_currency=usd&days=365`);
    out.priceSeries = ch.prices.map(([t, p]) => [t, +p.toFixed(4)]);
    out.sources.priceSeries = 'CoinGecko /market_chart days=365';
  } catch (e) { console.error('chart:', e.message); out.priceSeries = prev.priceSeries; }

  // Hashrate: filled by hashrate source once confirmed (see README)
  out.hashrate = prev.hashrate || null;
  try {
    const hr = require('./sources/hashrate.js');
    out.hashrate = await hr(get);
    out.sources.hashrate = out.hashrate.source;
  } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') console.error('hashrate:', e.message); }

  // Pool vs solo blocks, last 24h, plus one point a day of history (the duplex ceiling over time)
  out.miners = prev.miners || null;
  out.minerHistory = prev.minerHistory || [];
  try {
    out.miners = await require('./sources/miners.js')(get);
    const day = out.miners.at.slice(0, 10);
    out.minerHistory = out.minerHistory.filter((p) => p[0] !== day).concat([[day, +out.miners.soloShare.toFixed(4), out.miners.blocks]]).slice(-365);
    out.sources.miners = out.miners.source;
  } catch (e) { console.error('miners:', e.message); }

  // Early-days comparison (static, pulled once into research/pearl/raw)
  const cm = f => { const d = readJSON(path.join(RAW, f)); return d ? { series: d.coinmetrics.map(r => [Date.parse(r.time), +r.HashRate]).filter(p => p[1] > 0) } : null; };
  out.early = local ? { btc: cm('btc-early-hashrate.json'), zec: cm('zec-early-hashrate.json') } : prev.early;

  // Curated: tweets + useful work
  out.tweets = local ? readJSON(path.join(__dirname, 'tweets.json')) || [] : prev.tweets || [];
  out.usefulWork = local ? readJSON(path.join(__dirname, 'useful-work.json')) || [] : prev.usefulWork || [];
  return out;
}
module.exports = build;

if (require.main === module) build(readJSON(OUT) || {}).then(out => {
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log(`wrote ${OUT} · price $${out.market?.price} · ${out.priceSeries?.length || 0} price pts · hashrate ${out.hashrate ? 'yes' : 'no'}`);
});
