# Pearlascope

Live analytics for **Pearl**, the proof-of-useful-work L1 where mining is the matrix maths AI runs on.

**Site:** https://pearlascope.com · **The maths:** https://pearlascope.com/math

Price, supply and dilution, network hashrate, who mines the blocks, how much of the mining is actually useful, a mining calculator with payback, a thesis with bear/base/bull cases, and a wall of the hottest Pearl posts on X. Every derived number is recomputed from first principles on the [maths page](https://pearlascope.com/math), straight from Pearl's own source code.

Not financial advice. The thesis section is the maintainer's opinion, and he holds PEARL.

## How it works

No framework, no build step, no dependencies.

| File | What it does |
|---|---|
| `index.html` | The whole site: markup, styles and rendering |
| `math.html` | The maths behind Pearl, with a live audit of every site figure |
| `team.js` | Team profiles, every claim sourced |
| `build-data.js` | Pulls free public APIs (CoinGecko, prlscan) into `data.json` |
| `api/data.js` | Vercel function: rebuilds the live data on a cache miss (~15 min) |
| `sources/` | prlscan adapters for hashrate, pools and block winners |
| `fetch-tweets.js` | Maintainer-only: refreshes the curated tweet wall |
| `scripts/check.js` | The safety check CI runs on every pull request |

## Run it locally

```
node build-data.js        # refresh data.json from public APIs
npx serve .               # or any static server, then open http://localhost:3000
```

The page tries `/api/data` first and falls back to `data.json`, so a plain static server works.

## Contributing

Yes please: wrong numbers, new panels, better charts, new free data sources. Read [CONTRIBUTING.md](CONTRIBUTING.md) first, it's short. Security issues go through [SECURITY.md](SECURITY.md), never a public issue.

## Data sources

CoinGecko (`pearl-2`), prlscan.com, prlstats.com, CoinMetrics Community (BTC and ZEC early hashrate), the Pearl node source (`validate.go`, `params.go`), and hand-curated rows with links.

## License

MIT. See [LICENSE](LICENSE).
