# Security

Pearlascope shows links and figures people use to make decisions about money. If you find a way to change what readers see, inject a link or script, or leak a key, please tell us privately.

## Reporting

Use GitHub's private vulnerability reporting: **Security → Report a vulnerability** on this repo. Please don't open a public issue. You'll get an answer within a few days.

In scope: code injection through API or tweet data, link or address tampering, bypassing the CSP or `scripts/check.js`, anything in `api/`, leaked credentials.

## How the project protects itself

- `main` is protected: every change is a reviewed pull request, merged only by the maintainer.
- CI runs `scripts/check.js` on every PR: an allowlist of external domains and crypto addresses, secret scanning, integrity-pinned external scripts, and a guarded Content-Security-Policy.
- Workflows run with read-only permissions and no secrets, and never on `pull_request_target`.
- The repo is not connected to the host. Merging deploys nothing; the maintainer deploys by hand after review.
- No API keys live in the repo or in CI. The live data comes from free public APIs.
