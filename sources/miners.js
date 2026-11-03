// Who won Pearl's blocks in the last 24h, from api.prlscan.com (free, public).
// Retail pools (Kryptex, PearlHash...) = miners running mining software for the reward.
// An AI provider mining as a side effect of paid inference would most likely mine to its
// own address, so the solo share is a ceiling on duplex ("useful") mining, not a measure of it.
module.exports = async function (get) {
  const B = 'https://api.prlscan.com/v1/blocks?limit=100';
  const since = Date.now() - 24 * 36e5;
  const rows = [];
  let cursor = null;
  for (let i = 0; i < 10; i++) {
    const d = await get(B + (cursor ? `&cursor=${cursor}` : ''));
    rows.push(...d.items);
    cursor = d.next_cursor;
    if (!cursor || Date.parse(d.items.at(-1).time) < since) break;
  }
  const day = rows.filter((r) => r.canonical !== false && Date.parse(r.time) >= since);
  const pools = {};
  const soloAddrs = new Set();
  let pool = 0;
  for (const r of day) {
    if (r.miner_label_kind === 'pool') { pool++; pools[r.miner_label] = (pools[r.miner_label] || 0) + 1; }
    else soloAddrs.add(r.miner_address);
  }
  const n = day.length;
  return {
    at: new Date().toISOString(),
    blocks: n,
    pool, solo: n - pool,
    poolShare: n ? pool / n : null,
    soloShare: n ? (n - pool) / n : null,
    soloAddresses: soloAddrs.size,
    topPools: Object.entries(pools).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, k]) => ({ name, share: k / n })),
    source: 'api.prlscan.com /v1/blocks (miner_label_kind)',
  };
};
