#!/usr/bin/env node
// Pearlascope safety check. Runs in CI on every pull request and locally before every deploy.
// Fails on: unknown external domains, unpinned external scripts, crypto addresses not on the allowlist,
// anything that looks like a secret, dangerous JS sinks, broken JSON/JS, and a loosened CSP.
// Usage: node scripts/check.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const allow = JSON.parse(fs.readFileSync(path.join(ROOT, 'security/allowlist.json'), 'utf8'));
const DOMAINS = new Set(allow.domains), ADDRS = new Set(allow.addresses.map(a => a.toLowerCase()));
const SKIP_DIRS = new Set(['.git', 'node_modules', '.deploy', '.vercel']);
const DATA_FILES = new Set(['data.json', 'tweets.json']); // third-party content: secret-scanned, not domain-checked
const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (SKIP_DIRS.has(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
// In a git checkout, check what git would commit (tracked + untracked, minus .gitignore), so a local .env is fine.
let files;
try { files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').filter(Boolean).filter(f => fs.existsSync(path.join(ROOT, f))); }
catch { files = walk(ROOT).map(p => path.relative(ROOT, p)); }
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const isCode = f => /\.(html|js|css|json|ya?ml|md)$/.test(f) && !DATA_FILES.has(f) && !f.startsWith('data/raw/');

// 1. Secrets. Checked in every text file, data included.
const SECRET = [
  [/sk-ant-[A-Za-z0-9_-]{20,}/, 'Anthropic key'], [/\bsk-[A-Za-z0-9]{32,}/, 'OpenAI-style key'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'GitHub token'], [/github_pat_[A-Za-z0-9_]{40,}/, 'GitHub token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS key'], [/\bxox[abposr]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/TWITTERAPI_IO_KEY\s*=\s*['"]?[A-Za-z0-9]{12,}/, 'twitterapi.io key'],
  [/\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i, 'hard-coded credential'],
];
for (const f of files) {
  if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example')) fail(f, 'env file must never be committed');
  if (fs.statSync(path.join(ROOT, f)).size > 2e6) fail(f, 'file over 2 MB');
  if (!/\.(html|js|css|json|ya?ml|md|txt|sh)$/.test(f) && !f.startsWith('.')) continue;
  const s = read(f);
  for (const [re, what] of SECRET) if (re.test(s)) fail(f, `looks like a ${what}`);
}

// 2. External domains and 3. crypto addresses, in code only (tweets and API snapshots are content).
const ADDR = /\b0x[a-fA-F0-9]{40}\b|\b(?:prl1|bc1)[02-9ac-hj-np-z]{20,}\b/g;
for (const f of files.filter(isCode)) {
  if (f === 'security/allowlist.json') continue;
  const s = read(f);
  for (const m of s.matchAll(/https?:\/\/([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g)) {
    if (!DOMAINS.has(m[1].toLowerCase())) fail(f, `domain not on the allowlist: ${m[1]}`);
  }
  for (const m of s.matchAll(ADDR)) if (!ADDRS.has(m[0].toLowerCase())) fail(f, `crypto address not on the allowlist: ${m[0]}`);
  if (/\.(html|js)$/.test(f) && f !== 'scripts/check.js') { // this file names the patterns it bans
    if (/\beval\s*\(|new Function\s*\(|document\.write\s*\(/.test(s)) fail(f, 'eval / new Function / document.write are not allowed');
    if (/javascript:/i.test(s)) fail(f, 'javascript: URLs are not allowed');
  }
}

// 4. Every external <script>/<link rel=stylesheet> is pinned with SRI, from an allowed script host.
for (const f of files.filter(f => f.endsWith('.html'))) {
  const s = read(f);
  for (const tag of s.match(/<script\b[^>]*\bsrc=["']https?:[^>]*>/gi) || []) {
    const host = tag.match(/src=["']https?:\/\/([^/"']+)/i)[1];
    if (!allow.scriptHosts.includes(host)) fail(f, `script from a non-allowed host: ${host}`);
    if (!/\bintegrity=["']sha(256|384|512)-/.test(tag)) fail(f, `external script without integrity hash: ${tag.slice(0, 90)}`);
    if (!/@\d+\.\d+\.\d+|\/\d+\.\d+\.\d+\//.test(tag)) fail(f, `external script must pin an exact version: ${tag.slice(0, 90)}`);
  }
  for (const tag of s.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi) || []) {
    const host = (tag.match(/href=["']https?:\/\/([^/"']+)/i) || [])[1];
    if (host && !allow.noIntegrity.includes(host) && !/\bintegrity=/.test(tag)) fail(f, `external stylesheet without integrity hash: ${host}`);
  }
}

// 5. The CSP stays tight: no wildcards, scripts only from allowed hosts.
try {
  const v = JSON.parse(read('vercel.json'));
  const csp = v.headers?.flatMap(h => h.headers).find(h => h.key === 'Content-Security-Policy')?.value || '';
  if (!csp) fail('vercel.json', 'Content-Security-Policy header is missing');
  const scriptSrc = (csp.match(/script-src ([^;]+)/) || [])[1] || '';
  for (const t of scriptSrc.trim().split(/\s+/)) {
    if (t.startsWith("'")) { if (/unsafe-eval/.test(t)) fail('vercel.json', "script-src must not allow 'unsafe-eval'"); continue; }
    const host = t.replace(/^https:\/\//, '');
    if (!allow.scriptHosts.includes(host)) fail('vercel.json', `script-src allows a non-allowed host: ${t}`);
  }
  if (/(^|\s)\*(\s|;|$)|https:\s*;|\bhttp:/.test(csp.replace(/img-src [^;]+;/, ''))) fail('vercel.json', 'CSP has a wildcard or bare scheme outside img-src');
  if (!/frame-ancestors 'none'/.test(csp)) fail('vercel.json', "CSP must keep frame-ancestors 'none'");
} catch (e) { fail('vercel.json', 'invalid JSON: ' + e.message); }

// 6. JSON parses, JS compiles.
for (const f of files.filter(f => f.endsWith('.json'))) { try { JSON.parse(read(f)); } catch (e) { fail(f, 'invalid JSON: ' + e.message); } }
for (const f of files.filter(f => f.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--check', path.join(ROOT, f)], { stdio: 'pipe' }); }
  catch (e) { fail(f, 'JS syntax error: ' + String(e.stderr).split('\n').slice(0, 3).join(' ')); }
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem${errors.length > 1 ? 's' : ''}:\n  ` + errors.join('\n  '));
  console.error('\nIf a new domain or address is legitimate, add it to security/allowlist.json in its own PR and say why.');
  process.exit(1);
}
console.log(`✓ ${files.length} files checked: domains, addresses, secrets, script pinning, CSP, JSON, JS syntax`);
