#!/usr/bin/env node
// Wall of Pearl: pull top Pearl posts via twitterapi.io (pay per tweet, ~$0.15/1k).
// Run: node fetch-tweets.js   → writes tweets.json
// Curation: tweets-curation.json  { "pin": ["<tweet id>"], "block": ["<tweet id>"], "blockAuthors": ["handle"] }
const fs = require('fs');
const path = require('path');

// Key: TWITTERAPI_IO_KEY from the environment, or a local .env next to this file (gitignored, never committed).
const ENV = path.join(__dirname, '.env');
const fromFile = fs.existsSync(ENV) ? (fs.readFileSync(ENV, 'utf8').match(/^TWITTERAPI_IO_KEY=(.+)$/m) || [])[1] : '';
const KEY = (process.env.TWITTERAPI_IO_KEY || fromFile || '').trim().replace(/^["']|["']$/g, '');
if (!KEY) { console.error('Set TWITTERAPI_IO_KEY (env var or .env). Maintainers only: the wall is curated, contributors never need this.'); process.exit(1); }

const OUT = path.join(__dirname, 'tweets.json');
const CUR = path.join(__dirname, 'tweets-curation.json');
const QUERIES = [
  // Top posts about Pearl, excluding the Perle ticker collision
  { q: '("pearl" ($PEARL OR $PRL OR PRL OR mining OR "useful work" OR PoUW OR matmul) OR prlnet OR "pearlresearch") -perle -$perle -"black pearl" -$CIFR -filter:replies min_faves:20 lang:en', pages: 1 },
  { q: 'from:prlnet -filter:replies', pages: 1 },
  // Fresh: the last 10 days, newest first, so new posts reach the wall before they pile up likes
  { q: `("pearl" ($PEARL OR $PRL OR PRL OR mining OR "useful work" OR PoUW OR matmul) OR prlnet) -perle -$perle -"black pearl" -$CIFR -filter:replies min_faves:5 lang:en since:${new Date(Date.now() - 10 * 864e5).toISOString().slice(0, 10)}`, pages: 2, type: 'Latest' },
];
// Cipher's "Black Pearl" data center floods the search around $CIFR earnings
const OFF_TOPIC = /black pearl|\$CIFR\b|\$ORE\b/i, ON_TOPIC = /pearl|\$prl\b|prlnet/i;
const TEAM = new Set(['prlnet', 'komargodski', 'weinsteinomri']);
const KEEP = 150; // wall pool: fresh results merged into the previous file, capped
const MAX_PAGES = 2; // hard cap per query (≈20 tweets/page)

async function search(q, cursor, type = 'Top') {
  const u = new URL('https://api.twitterapi.io/twitter/tweet/advanced_search');
  u.searchParams.set('query', q); u.searchParams.set('queryType', type);
  if (cursor) u.searchParams.set('cursor', cursor);
  const r = await fetch(u, { headers: { 'X-API-Key': KEY } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

// Recency-weighted engagement, same formula as the page: likes + 3×reposts, decayed by age (HN-style gravity)
const hot = t => (t.likes + 3 * t.reposts) / Math.pow(1 + (Date.now() - Date.parse(t.createdAt)) / 864e5 / 5, 1.5);

const media = t => (t.extendedEntities?.media || t.entities?.media || [])
  .map(m => m.media_url_https).filter(Boolean).slice(0, 1);

(async () => {
  const cur = fs.existsSync(CUR) ? JSON.parse(fs.readFileSync(CUR, 'utf8')) : { pin: [], block: [], blockAuthors: [] };
  const seen = new Map(); let calls = 0, got = 0;
  for (const { q, pages, type } of QUERIES) {
    let cursor = '';
    for (let i = 0; i < Math.min(pages, MAX_PAGES); i++) {
      const j = await search(q, cursor, type); calls++;
      for (const raw of j.tweets || []) {
        got++;
        const rt = raw.retweeted_tweet;
        const t = rt && rt.id ? rt : raw;
        const via = rt && rt.id ? raw.author?.userName : null;
        if (seen.has(t.id)) continue;
        seen.set(t.id, {
          id: t.id, url: t.url || `https://x.com/${t.author?.userName}/status/${t.id}`,
          text: t.text, createdAt: t.createdAt,
          likes: t.likeCount || 0, reposts: t.retweetCount || 0, replies: t.replyCount || 0, views: t.viewCount || 0,
          author: { handle: t.author?.userName, name: t.author?.name, avatar: t.author?.profilePicture, verified: !!(t.author?.isBlueVerified || t.author?.verified) },
          media: media(t), isQuote: !!t.quoted_tweet, via,
        });
      }
      if (!j.has_next_page || !j.next_cursor) break;
      cursor = j.next_cursor;
    }
  }
  // Keep earlier posts the searches no longer return; re-seen posts get fresh metrics
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : [];
  for (const t of prev) if (!seen.has(t.id)) seen.set(t.id, t);
  const block = new Set(cur.block || []), blockA = new Set((cur.blockAuthors || []).map(s => s.toLowerCase()));
  const pin = cur.pin || [];
  const list = [...seen.values()]
    .filter(t => !block.has(t.id) && !blockA.has((t.author.handle || '').toLowerCase()))
    .filter(t => !OFF_TOPIC.test(t.text) && (ON_TOPIC.test(t.text) || TEAM.has((t.author.handle || '').toLowerCase()) || pin.includes(t.id) || t.likes >= 1000))
    .map(t => ({ ...t, pinned: pin.includes(t.id) }))
    .sort((a, b) => (b.pinned - a.pinned) || hot(b) - hot(a))
    .slice(0, KEEP);
  fs.writeFileSync(OUT, JSON.stringify(list, null, 1));
  console.log(`${calls} calls · ${got} tweets returned (~$${(got * 0.00015).toFixed(4)}) · ${list.length} unique kept → ${OUT}`);
})().catch(e => { console.error(e.message); process.exit(1); });
