#!/bin/zsh
# Maintainer-only deploy: refresh tweets + data snapshot, run the safety check, ship to Vercel production.
# Deploys come from the maintainer's machine only. The GitHub repo is NOT connected to Vercel, so merging a PR
# never deploys anything by itself, and fork PRs never get preview builds.
# Usage: zsh scripts/deploy.sh            add --no-tweets to skip the twitterapi.io pull (~$0.01)
set -eu
cd ${0:A:h:h}
[[ ${1:-} == --no-tweets ]] || node fetch-tweets.js
node build-data.js
node scripts/check.js
[ -d .vercel ] || vercel link --yes --project pearlascope
vercel deploy --prod --yes
