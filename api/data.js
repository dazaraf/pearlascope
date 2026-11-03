// Live data for the deployed site: rebuilds market, supply, hashrate and pools from free APIs on each
// cache miss, carrying tweets and the early-days series over from the bundled snapshot.
const build = require('../build-data.js');
const snap = require('../data.json');

module.exports = async (req, res) => {
  try {
    const out = await build(snap, false);
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    res.status(200).json(out);
  } catch (e) {
    console.error('build failed:', e.message);
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    res.status(200).json(snap);
  }
};
