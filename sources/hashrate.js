// Pearl hashrate + pool split from api.prlscan.com (free, public, CORS).
// History starts ~2026-05-01 (block 36,470); the first 4 days ran at difficulty 1.
module.exports = async function (get) {
  const B = 'https://api.prlscan.com/v1';
  const m = await get(`${B}/analytics/block-metrics?limit=100000&window=50&max_points=600`);
  const series = m.items
    .filter(p => p.estimated_hashrate_hps > 0)
    .map(p => [Date.parse(p.time), p.estimated_hashrate_hps]);
  let pools = [];
  try {
    const p = await get(`${B}/pools`);
    pools = p.items.map(x => ({ name: x.name, url: x.website_url, fee: x.fee_percent, blocks24h: x.blocks_24h, share24h: x.pool_share_24h, allTime: x.all_time_blocks }))
      .sort((a, b) => b.blocks24h - a.blocks24h);
  } catch {}
  let summary = null;
  try { summary = await get(`${B}/analytics/summary?window_blocks=50`); } catch {}
  return { source: 'prlscan.com API (block-metrics, pools, summary)', series, pools, summary };
};
