#!/usr/bin/env node
/**
 * mdl-fetch.mjs
 * Pulls MyDramaList data for a list of drama titles through the Kuryana
 * unofficial API (https://github.com/tbdsux/kuryana) and writes two files:
 *
 *   data/mdl-cache.json   full raw responses (big, stays in the repo, resumable)
 *   data/mdl-digest.json  slim signal file (small, this is the one you hand to Brain)
 *
 * Zero dependencies. Needs Node 18+ (built-in fetch). No API key.
 *
 * Usage:
 *   node tools/mdl-fetch.mjs              # reads data/mdl-titles.txt, skips already-cached
 *   node tools/mdl-fetch.mjs --force      # re-scrape everything
 *   node tools/mdl-fetch.mjs --limit 20   # only the first 20 uncached titles
 *
 * Env:
 *   MDL_API    base URL of a Kuryana instance (default https://kuryana.tbdh.app)
 *   RECS_API   base URL of a B1PL0B MyDramaList-Unofficial-API instance. If set,
 *              also pulls /api/id/{slug}/recs (user recommendations with written
 *              reasons + vote counts).
 *   MDL_DELAY  ms between requests (default 1500). Be polite, it live-scrapes.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const API = (process.env.MDL_API || "https://kuryana.tbdh.app").replace(/\/$/, "");
const RECS_API = (process.env.RECS_API || "").replace(/\/$/, "");
const DELAY = Number(process.env.MDL_DELAY || 1500);
const FORCE = process.argv.includes("--force");
const LIMIT = (() => {
  const i = process.argv.indexOf("--limit");
  return i > -1 ? Number(process.argv[i + 1]) : Infinity;
})();

const TITLES_FILE = "data/mdl-titles.txt";
const CACHE_FILE = "data/mdl-cache.json";
const DIGEST_FILE = "data/mdl-digest.json";
const EXCERPT_CHARS = 900;
const REVIEWS_PER_DRAMA = 5;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path) {
  const url = `${API}${path}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "dramarecs-editorial-research/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(DELAY * attempt * 2);
    }
  }
}

/* ---------- input ---------- */

function readTitles() {
  if (!existsSync(TITLES_FILE)) {
    console.error(`Missing ${TITLES_FILE}. One drama per line, e.g. "Flower of Evil (2020)".`);
    process.exit(1);
  }
  return readFileSync(TITLES_FILE, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((line) => {
      const piped = line.split("|").map((s) => s.trim());
      let title = piped[0];
      let year = piped[1] ? Number(piped[1]) : null;
      const paren = title.match(/^(.*)\((\d{4})\)\s*$/);
      if (paren) {
        title = paren[1].trim();
        year = year || Number(paren[2]);
      }
      return { input: line, title, year: year || null };
    });
}

/* ---------- matching ---------- */

function pickMatch(searchResults, want) {
  const dramas = searchResults?.results?.dramas || [];
  if (!dramas.length) return null;
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(want.title);
  const scored = dramas.map((d) => {
    let score = 0;
    const n = norm(d.title);
    if (n === target) score += 100;
    else if (n.startsWith(target) || target.startsWith(n)) score += 60;
    else if (n.includes(target) || target.includes(n)) score += 30;
    if (/Korean/i.test(d.type || "")) score += 25;
    if (/Drama/i.test(d.type || "")) score += 10;
    if (want.year && d.year) score += Math.abs(d.year - want.year) <= 1 ? 30 : -25;
    if (typeof d.rating === "number") score += Math.min(d.rating, 10) / 2;
    return { d, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].score > 0 ? scored[0].d : null;
}

/* ---------- signal extraction ---------- */

const numFrom = (s) => {
  const m = String(s ?? "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
};

function episodeSignals(episodesData) {
  const eps = (episodesData?.data?.episodes || []).map((e, i) => ({
    n: i + 1,
    rating: numFrom(e.rating),
  }));
  const rated = eps.filter((e) => e.rating != null);
  let hook = null;
  if (rated.length > 3) {
    const window = rated.slice(0, Math.max(4, Math.ceil(rated.length * 0.6)));
    let best = null;
    for (let i = 1; i < window.length; i++) {
      const delta = +(window[i].rating - window[i - 1].rating).toFixed(2);
      if (!best || delta > best.delta) best = { episode: window[i].n, delta };
    }
    const first = rated[0].rating;
    const peak = Math.max(...rated.map((e) => e.rating));
    hook = {
      biggest_jump_episode: best?.episode ?? null,
      jump_size: best?.delta ?? null,
      first_episode_rating: first,
      peak_rating: peak,
      climb: +(peak - first).toFixed(2),
      note: "Signal only. Read it with the review text before committing a hook episode.",
    };
  }
  // compact: index 0 = episode 1, null where MDL has no rating yet
  return { episode_ratings: eps.map((e) => e.rating), hook_signal: hook };
}

function reviewSignals(reviewsData) {
  const reviews = reviewsData?.data?.reviews || [];
  const avg = (key) => {
    const vals = reviews.map((r) => r.ratings?.[key]).filter((v) => typeof v === "number");
    return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
  };
  const digest = reviews.slice(0, REVIEWS_PER_DRAMA).map((r) => {
    const parts = Array.isArray(r.review) ? r.review : [String(r.review || "")];
    const spoiler = parts.some((p) => /this review may contain spoilers/i.test(p));
    const clean = parts.filter((p) => !/this review may contain spoilers/i.test(p));
    const headline = clean.length > 1 ? clean[0] : null;
    const body = (clean.length > 1 ? clean.slice(1).join("\n\n") : clean[0] || "").trim();
    return {
      reviewer: r.reviewer?.name || null,
      helpful: numFrom(r.reviewer?.info),
      spoiler_flagged: spoiler,
      headline,
      excerpt: body.slice(0, EXCERPT_CHARS),
      truncated: body.length > EXCERPT_CHARS,
      ratings: r.ratings || null,
    };
  });
  return {
    review_count_scraped: reviews.length,
    averages: {
      overall: avg("overall"),
      story: avg("Story"),
      acting: avg("Acting/Cast"),
      music: avg("Music"),
      rewatch_value: avg("Rewatch Value"),
    },
    reviews: digest,
  };
}

function buildDigestEntry(raw) {
  const d = raw.details?.data || {};
  const o = d.others || {};
  const det = d.details || {};
  return {
    query: raw.query,
    matched_title: d.title || raw.match?.title || null,
    slug: raw.slug,
    mdl_url: d.link || null,
    year: d.year || raw.match?.year || null,
    native_title: (o.native_title || [])[0] || null,
    also_known_as: (o.also_known_as || []).slice(0, 12),
    country: det.country || null,
    type: det.type || null,
    episodes: numFrom(det.episodes),
    duration: det.duration || null,
    network: det.original_network || null,
    aired: det.aired || null,
    content_rating: det.content_rating || null,
    mdl_score: d.rating ?? numFrom(det.score),
    scored_by: numFrom(String(det.score || "").split("by")[1]),
    ranked: det.ranked || null,
    popularity: det.popularity || null,
    watchers: numFrom(det.watchers),
    genres: o.genres || [],
    tags: (o.tags || []).map((t) => t.replace(/\s*\(Vote tags\)$/, "")),
    director: o.director || [],
    screenwriter: o.screenwriter || [],
    main_cast: (d.casts || []).slice(0, 6).map((c) => c.name),
    synopsis: (d.synopsis || "").slice(0, 700),
    ...episodeSignals(raw.episodes),
    ...reviewSignals(raw.reviews),
    mdl_recommendations: raw.recs
      ? (raw.recs.recommendations || []).slice(0, 10).map((r) => ({
          title: r.title,
          year: r.year,
          votes: numFrom(r.votes),
          reasons: r.reasons || [],
        }))
      : null,
    scraped_at: raw.scraped_at,
  };
}

/* ---------- main ---------- */

const titles = readTitles();
const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf8")) : {};
const failures = [];
let done = 0;

for (const want of titles) {
  const key = want.input;
  if (!FORCE && cache[key]?.details) continue;
  if (done >= LIMIT) break;
  done++;
  console.log(`\n[${done}] ${want.title}${want.year ? ` (${want.year})` : ""}`);
  try {
    const search = await get(`/search/q/${encodeURIComponent(want.title)}`);
    await sleep(DELAY);
    const match = pickMatch(search, want);
    if (!match) throw new Error("no search match");
    console.log(`    -> ${match.title} (${match.year}) ${match.slug}`);

    const details = await get(`/id/${match.slug}`);
    await sleep(DELAY);

    let episodes = null;
    try {
      episodes = await get(`/id/${match.slug}/episodes`);
      await sleep(DELAY);
    } catch {
      console.log("    (no episode page)");
    }

    let reviews = null;
    try {
      reviews = await get(`/id/${match.slug}/reviews`);
      await sleep(DELAY);
    } catch {
      console.log("    (no reviews)");
    }

    let recs = null;
    if (RECS_API) {
      try {
        const res = await fetch(`${RECS_API}/api/id/${match.slug}/recs`);
        if (res.ok) recs = await res.json();
        await sleep(DELAY);
      } catch {
        console.log("    (recs instance unreachable)");
      }
    }

    cache[key] = {
      query: want,
      slug: match.slug,
      match,
      details,
      episodes,
      reviews,
      recs,
      scraped_at: new Date().toISOString(),
    };
    console.log(
      `    ok: ${(details?.data?.others?.tags || []).length} tags, ` +
        `${(episodes?.data?.episodes || []).length} eps, ` +
        `${(reviews?.data?.reviews || []).length} reviews`
    );
  } catch (err) {
    console.log(`    FAILED: ${err.message}`);
    failures.push({ ...want, error: err.message });
  }
  mkdirSync("data", { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

const digest = {
  generated_at: new Date().toISOString(),
  source: { api: API, recs_api: RECS_API || null, upstream: "mydramalist.com via kuryana" },
  title_count: Object.keys(cache).length,
  failures,
  dramas: Object.values(cache).map(buildDigestEntry),
};

mkdirSync("data", { recursive: true });
writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
writeFileSync(DIGEST_FILE, JSON.stringify(digest, null, 2));

console.log(`\nCached titles: ${Object.keys(cache).length}`);
console.log(`Failures: ${failures.length}${failures.length ? " -> " + failures.map((f) => f.title).join(", ") : ""}`);
console.log(`Wrote ${CACHE_FILE} and ${DIGEST_FILE}`);
