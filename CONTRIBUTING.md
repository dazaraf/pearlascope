# Contributing to Pearlascope

Thanks for helping. Pearlascope is read by people deciding what to do with real money, so the bar is **correct, sourced and safe**.

## Good first contributions

- A number on the site is wrong or stale: open an issue or a PR with the source.
- A new chart or panel built on a **free, public** API.
- Mobile layout, accessibility and performance fixes.
- Clearer explanations on the maths page.

## The rules

1. **Small PRs.** One change per PR. Big "refactor everything" PRs get closed, however good they are, because they can't be reviewed safely.
2. **Every number has a source.** A link, a formula, or a block height. No source, no merge.
3. **No new external domains, scripts or crypto addresses without a separate PR.** If you genuinely need one, open a PR that only edits `security/allowlist.json` and explain why. Expect questions. This is the single most common way crypto sites get attacked, so it gets the most scrutiny.
4. **Don't edit generated files by hand.** `data.json` and `tweets.json` are produced by scripts.
5. **No dependencies, no build step.** Plain HTML, CSS and JS. If you think we need a library, open an issue first.
6. **Third-party data goes through `esc()` and `safeUrl()`.** Anything from an API or a tweet is untrusted. Never put it into `innerHTML` raw.
7. **No price calls, shilling or FUD in the UI.** Opinion lives in the thesis section, under the maintainer's name.

## Before you open the PR

```
node scripts/check.js
```

It checks domains, crypto addresses, secrets, script pinning, the security headers, JSON and JS syntax. CI runs the same check, and a PR can't merge while it fails.

## How review works

Only the maintainer merges. Merging does **not** deploy: deploys are done by hand after review, so nothing reaches the live site without a second look.
