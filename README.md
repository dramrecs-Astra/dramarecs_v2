# DramaRecs

A static website. No database, no server, nothing that can break at 2am. Every push to GitHub makes
Vercel rebuild the whole site: it pulls fresh data from TMDB, drops it into the pages, and publishes
plain HTML.

**Repo:** `github.com/PapayaOfficial/Dramarecs`, branch `main`, **private**. The old
`similardramas` repo is deleted. Because the repo is private, a chat cannot read it: download the
zip from GitHub and attach it, and the session works from that.

---

## The four documents, and when to use each

There are exactly four. If you find a fifth, it is stale and should be deleted.

| File | What it is | When you share it |
|---|---|---|
| `README.md` | This. How to deploy, how to publish, where things live | Rarely. It is for you, not for a session |
| `PROJECT-STATE.json` | Single source of truth. Counts, settled decisions, open items, research findings | **Every session.** Always start here |
| `EDITORIAL.md` | The writing workflow, voice, schemas, meter derivation, research method, the write queue | Whenever the session is about content: new titles, verdicts, pages |
| `PLANS.md` | Roadmap, monetization, features, infrastructure, dead plans | Whenever the session is about anything else |

**The handoff rule.** Every batch that comes back to you carries an updated `PROJECT-STATE.json` and
an updated `EDITORIAL.md` inside the zip. If a batch arrives without them, it is incomplete: the next
chat starts blind and rediscovers problems that were already solved.

**Never add a new notes file.** Findings go into the file that owns them. The old habit of one
`BATCH-N-NOTES.md` per batch is what produced fourteen markdown files that disagreed with each other.

---

## Publishing content

Everything you will ever edit lives in `data/`. Nothing else.

```
data/
  site.json                       site name, country, the popular list on the homepage
  dramas.json                     one entry per drama: meters, ending, hook episode, verdict
  pages/
    my-liberation-notes.json      one file = one "dramas like X" page
    reply-1988.json
```

To publish a page: add any missing dramas to `data/dramas.json`, add a file in `data/pages/` named
after the seed slug, commit on GitHub, and Vercel rebuilds in about two minutes. `EDITORIAL.md`
section 3 has the exact shape of both files.

TMDB fills in posters, artwork, overviews, genres, episode counts, ratings and streaming rows
automatically. You never type any of that.

---

## Deployment settings, already done

Vercel, importing this repo from `main`:

- Framework preset: **Other**
- Build command: `node build.mjs`
- Output directory: `dist`

Environment variables:

| Name | Value |
|---|---|
| `SITE_URL` | `https://dramarecs.com` |
| `TMDB_TOKEN` | your TMDB API Read Access Token, the long one starting `eyJ` |
| `GA_ID` | `G-XXXXXXXXXX` |
| `ADSENSE_CLIENT` | not set yet. Setting it is the entire ad activation |
| `ADSENSE_SLOT_INLINE` | not set yet |
| `RAKUTEN_ID` | not set yet. Your Rakuten Advertising publisher id |
| `RAKUTEN_MID_VIKI` | not set yet. The Viki advertiser mid, from the approval email |
| `RAKUTEN_MID_KOCOWA` | not set yet. Same, for Kocowa |
| `AMAZON_TAG` | not set yet. Your Amazon Associates tag, for Prime Video |

Ads only appear once `ADSENSE_CLIENT` is set. Until then there is no ad code on the site and no empty
grey boxes.

**Affiliate links work the same way.** With none of those four set, the where-to-watch rows are
ordinary outbound links and no page mentions commission. Set `RAKUTEN_ID` plus a mid and that brand
starts earning, the links get `rel="sponsored"`, and the disclosure turns itself on in the footer,
beside every row, on `/privacy/` and on `/how-we-pick/`. You never edit that wording, and the build
log prints which brands went live so you can see the variable landed.

---

## Running it locally, optional

```bash
node build.mjs            # builds into dist/, works without a TMDB token
npx serve dist            # local preview
node tools/validate-pages.mjs   # run this before every commit
```

---

## Things worth knowing

- **Never commit the TMDB token**, or an affiliate id. They live in Vercel env vars only. Rotate the
  TMDB token if it has ever been pasted into a chat.
- **The repo is private.** Nothing and nobody outside Vercel can read it, which is the point. It also
  means a chat has to be given the zip.
- A failed build leaves the live site exactly as it was, so a broken commit cannot take the site down.
- The build never fails because of TMDB. Worst case a page shows a coloured tile instead of a poster.
- Deleting `.tmdb-cache.json` forces a fully fresh pull on the next build.
- The repo zip downloads at about 8MB while the checkout is about 27MB. That is JSON compressing
  roughly 3 to 1, not a failed upload.
