/**
 * DramaRecs static site builder.
 * Reads editorial data from /data, enriches it from TMDB, writes plain HTML to /dist.
 * Zero dependencies. Runs on Node 20+. Production blocks catastrophic metadata loss.
 */
import { readFile, writeFile, mkdir, readdir, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { preserveEditorial, secondaryPicks, relatedLists, providerRecords, assertProductionQuality } from './lib/data-quality.mjs';
import { findTmdbIdentity } from './lib/tmdb-identity.mjs';
import './src/core.js';
const PRODUCTION = process.env.VERCEL_ENV === 'production' || process.env.BUILD_MODE === 'production';
if (PRODUCTION && process.env.BUILD_MODE === 'fixture') throw new Error('Fixture mode cannot be deployed to production');
// Monetization stays disabled until certified CMP integration and its browser matrix are reviewed.
// Existing environment variables cannot accidentally activate ads, analytics or affiliate tracking.
if (process.env.ADSENSE_CLIENT || process.env.GA_ID || process.env.AMAZON_TAG || process.env.RAKUTEN_ID) console.warn('Repair release: ads, analytics and affiliate tracking are intentionally disabled. See RELEASE-NOTES.md.');

const OUT = 'dist';
const TOKEN = (process.env.TMDB_TOKEN || '').trim();
const SITE_URL = (process.env.SITE_URL || 'https://dramarecs.com').replace(/\/$/, '');

/* The named human behind every judgement on the site. Referenced by the About page byline,
   the Person and Organization JSON-LD, and the per-page byline. Change it in one place.
   RULE: this must be a real person, you. A pen name is fine as long as it is yours and the
   site presents it as an editor. Never an invented biography, never an age, never a sameAs
   link that does not already carry this name. */
const AUTHOR = {
  name: 'Yuna',
  role: 'Editor',
  url: '/about/',
  image: '/assets/editor.svg'
};
const ADSENSE = ''; // DR-29/31: fail closed until consent integration is independently tested
/* Google Funding Choices / Privacy & messaging. Set FC_ID once the message is published in the
   AdSense UI (Privacy & messaging -> GDPR). Without a certified CMP you may not serve
   personalised ads to the EEA, the UK or Switzerland, and the privacy policy on this site
   promises a prompt, so the promise and the tag ship together. */
const FC_ID = '';
const ADS_LIVE_DATE = (process.env.ADS_LIVE_DATE || '').trim();
const GA_ID = '';

/* ---------------- affiliate ids ----------------
   The where-to-watch rows are the highest-intent clicks on the site and until now they were plain
   spans that went nowhere. Every id below is optional. With none set, the rows still become real
   outbound links, just unmonetised, and nothing on the site claims to earn anything. The moment
   one is set, that provider routes through the network and every disclosure switches on from the
   same flag, so a live affiliate link and a page saying "no affiliate links" can never ship on the
   same day. Same trick ADSENSE_CLIENT already plays on the privacy policy.

   RAKUTEN_ID              Rakuten Advertising publisher id, the `id` in a linksynergy deeplink.
   RAKUTEN_MID_VIKI        Viki advertiser mid, issued when the programme is approved.
   RAKUTEN_MID_KOCOWA      Kocowa advertiser mid.
   AMAZON_TAG              Amazon Associates tracking tag, appended as tag= on the store URL.
   AFF_LIVE_DATE           optional override for the /privacy/ date, like ADS_LIVE_DATE.
   Netflix, Disney+, Apple TV+ and Hulu have no programme worth taking here. Plain on purpose. */
const RAKUTEN_ID = '';
const RAKUTEN_MID = {
  Viki: (process.env.RAKUTEN_MID_VIKI || '').trim(),
  Kocowa: (process.env.RAKUTEN_MID_KOCOWA || '').trim()
};
const AMAZON_TAG = ''; // Do not reuse a US tracking tag across regional storefronts.
const AFF_LIVE_DATE = (process.env.AFF_LIVE_DATE || '').trim();
const IMG = 'https://image.tmdb.org/t/p/';
const CACHE = '.tmdb-cache.json';
/* Set from data/site.json in main(). It is the region a first-time visitor sees before they
   choose one, and the region every page is rendered with for crawlers and no-JS readers. */
let DEFAULT_REGION = 'US';

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
const esc = (s) => String(s ?? '').replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const strip = (s) => String(s ?? '').replace(/<[^>]+>/g, '');

/* Meta descriptions used to be .slice(0, 155), which cut words in half in the SERP
   ("...two people at the bottom of their lives, one middle a"). Clip on the last word
   boundary under the limit, drop dangling punctuation, then mark the cut with an ellipsis.
   Any page or drama entry can override the generated text with a hand-written "meta" field. */
const clip = (s, max = 155) => {
  const t = strip(s).replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  const out = (space > 60 ? cut.slice(0, space) : cut).replace(/[\s,;:.!?\u2013\u2014-]+$/, '');
  return out + '\u2026';
};

/* ---------------- streaming regions ----------------
   TMDB returns watch/providers for every country in a single response, so eight regions cost
   exactly the same number of API calls as one. Korean drama traffic is not US traffic: India,
   the Philippines, Indonesia and Brazil are enormous for this genre, and telling those readers
   "not streaming in the US right now" about a show that is on Viki where they live is worse
   than telling them nothing. Readers pick a region, app.js stores it, the row swaps. */
const REGIONS = [
  { code: 'US', label: 'the United States' },
  { code: 'GB', label: 'the United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'IN', label: 'India' },
  { code: 'PH', label: 'the Philippines' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'BR', label: 'Brazil' }
];
const REGION_LABEL = Object.fromEntries(REGIONS.map((r) => [r.code, r.label]));

/* "Netflix" and "Netflix Standard with Ads" are one service, and showing both burned two of the
   four provider slots on the same brand. Collapse ad tiers and reseller channels into the parent
   brand, then keep the first four distinct brands with flatrate ranked ahead of ad-supported. */
function brandOf(name) {
  let n = String(name || '').trim();
  n = n.replace(/\s*\((?:with )?ads?\)$/i, '');
  n = n.replace(/\s+(?:Standard|Basic|Premium|Essential)?\s*with\s+Ads?$/i, '');
  // Retain reseller/channel identity; it is not the standalone subscription.
  if (/^amazon prime video$/i.test(n)) n = 'Prime Video';
  if (/^rakuten viki$/i.test(n)) n = 'Viki';
  if (/^kocowa\+?$/i.test(n)) n = 'Kocowa';
  if (/^disney plus$/i.test(n)) n = 'Disney+';
  if (/^apple tv\+?$/i.test(n)) n = 'Apple TV+';
  return n.trim();
}

function pickProviders(region) {
  const seen = new Set();
  const out = [];
  for (const bucket of ['flatrate', 'free', 'ads']) {
    const rows = [...(region?.[bucket] || [])].sort((a, b) => (a.display_priority ?? 99) - (b.display_priority ?? 99));
    for (const p of rows) {
      const brand = brandOf(p.provider_name);
      if (!brand || seen.has(brand)) continue;
      seen.add(brand);
      out.push(brand);
    }
  }
  return out;
}

/* ---------------- affiliate links ----------------
   TMDB hands back ONE link per region, not one per provider, and it points at a JustWatch-backed
   page on themoviedb.org. That is useless as an affiliate target: the click lands on TMDB and the
   network sees nothing. So each monetisable brand gets a title-scoped URL on its own domain.
   For a catalogue that is only ever Korean drama, a title search lands on the show, and a search
   URL on the advertiser's own domain is a valid deeplink target for both networks. Brands with no
   entry here keep the TMDB link and stay plain, which is still better than the span they were.
   {q} is the placeholder for the url-encoded title. */

/* Amazon runs a different storefront per country and has no store at all in the Philippines or
   Indonesia, where Prime Video still streams. Those two fall back to the .com store, which is
   what Prime Video itself does there. */
const AMAZON_STORE = {
  US: 'amazon.com', GB: 'amazon.co.uk', CA: 'amazon.ca', AU: 'amazon.com.au',
  IN: 'amazon.in', BR: 'amazon.com.br', PH: 'amazon.com', ID: 'amazon.com'
};

function providerTarget(brand, code) {
  if (brand === 'Viki') return 'https://www.viki.com/search?q={q}';
  if (brand === 'Kocowa') return 'https://www.kocowa.com/search?keyword={q}';
  if (brand === 'Prime Video') return 'https://www.' + (AMAZON_STORE[code] || 'amazon.com') + '/s?i=instant-video&k={q}';
  if (brand === 'Netflix') return 'https://www.netflix.com/search?q={q}';
  return '';
}

/* THE wrapper. One function, one place, and the only thing in the build that knows what an
   affiliate URL looks like. Give it a brand and a plain provider URL, get back the URL that
   actually ships. Nothing configured means the plain URL comes straight back out, so the build
   is correct on a laptop with no env vars at all.

   `paid` is what drives rel="sponsored" and every disclosure on the site, so a link can never be
   monetised without also being declared.

   Rakuten carries the whole destination url-encoded inside murl, which means the title inside it
   ends up encoded twice. That is what {qq} is for. */
function affiliate(brand, target) {
  if (!target) return { href: '', paid: false };
  const mid = RAKUTEN_MID[brand];
  if (RAKUTEN_ID && mid) {
    const murl = encodeURIComponent(target).replace('%7Bq%7D', '{qq}');
    return {
      href: 'https://click.linksynergy.com/deeplink?id=' + encodeURIComponent(RAKUTEN_ID) +
            '&mid=' + encodeURIComponent(mid) + '&murl=' + murl,
      paid: true
    };
  }
  if (brand === 'Prime Video' && AMAZON_TAG) {
    return { href: target + '&tag=' + encodeURIComponent(AMAZON_TAG), paid: true };
  }
  return { href: target, paid: false };
}

const AFF_BRANDS = ['Viki', 'Kocowa', 'Prime Video', 'Netflix'];
const AFF_LIVE = Boolean((RAKUTEN_ID && (RAKUTEN_MID.Viki || RAKUTEN_MID.Kocowa)) || AMAZON_TAG);

/* Resolved once at build time, then shipped to app.js as-is. The client used to be the only place
   that turned a provider chip into a link, using the TMDB link and its own markup, so a US visitor
   got plain spans and a visitor with a stored region got links. Now both sides read this one table
   and there is no second implementation to drift. Only Prime Video varies by region, so everything
   else collapses to a single row. */
const WATCH_TABLE = (() => {
  const table = {};
  for (const brand of AFF_BRANDS) {
    const cells = {};
    for (const r of REGIONS) {
      const a = affiliate(brand, providerTarget(brand, r.code));
      cells[r.code] = { h: a.href, s: a.paid ? 1 : 0 };
    }
    const first = cells[REGIONS[0].code];
    const uniform = REGIONS.every((r) => cells[r.code].h === first.h && cells[r.code].s === first.s);
    table[brand] = uniform ? first : { r: cells };
  }
  return table;
})();

/* The policy pages must never hardcode which networks we are on. The ADSENSE_CLIENT lesson was
   that prose about money and the switch that turns the money on have to be the same variable, or
   the day one changes the other becomes a lie printed next to it. These two lists are what the
   privacy policy, the terms and /how-we-pick/ read from. */
const PAID_BRANDS = AFF_BRANDS.filter((b) => (WATCH_TABLE[b].r ? WATCH_TABLE[b].r[DEFAULT_REGION] : WATCH_TABLE[b]).s === 1);
const FREE_BRANDS = AFF_BRANDS.filter((b) => !PAID_BRANDS.includes(b));
const andList = (xs) => xs.length < 2 ? (xs[0] || '') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1];

/* One title, one region, one brand -> the href that ships, or null to leave the chip plain. */
function watchHref(brand, code, title) {
  const row = WATCH_TABLE[brand];
  if (!row) return null;
  const cell = row.r ? row.r[code] : row;
  if (!cell || !cell.h) return null;
  return {
    href: cell.h
      .replace('{qq}', encodeURIComponent(encodeURIComponent(title || '')))
      .replace('{q}', encodeURIComponent(title || '')),
    paid: cell.s === 1
  };
}

let cache = {};
if (existsSync(CACHE)) { try { cache = await readJson(CACHE); } catch { cache = {}; } }

const TTL = 24 * 60 * 60 * 1000;
async function tmdb(pathname, params = {}) {
  const url = new URL('https://api.themoviedb.org/3' + pathname);
  for (const [k,v] of Object.entries(params)) url.searchParams.set(k,v);
  const key = url.toString(), cached = cache[key];
  const saved = cached?.data && cached?.fetchedAt ? cached : null;
  if (saved && Date.now() - Date.parse(saved.fetchedAt) < TTL) return saved.data;
  if (!TOKEN) return saved?.data || null;
  for (let attempt=0; attempt<2; attempt++) {
    try {
      const res = await fetch(key, {headers:{Authorization:'Bearer ' + TOKEN,accept:'application/json'},signal:AbortSignal.timeout(10000)});
      if (!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json(); cache[key] = {data,fetchedAt:new Date().toISOString()}; return data;
    } catch (e) { console.warn('TMDB request failed for '+pathname+': '+e.message); if (!attempt) await new Promise(r=>setTimeout(r,400)); }
  }
  return saved?.data || null;
}
let lastGood = {};
if (existsSync('data/metadata-snapshot.json')) { try { lastGood = await readJson('data/metadata-snapshot.json'); } catch {} }

async function enrich(d, country, catalog) {
  let id = d.tmdb_id;
  if (!id) {
    id = await findTmdbIdentity(d, tmdb, catalog);
    if (id) console.log('  candidate identity (needs review): ' + d.slug + ' -> ' + id);
  }
  const previous = lastGood[d.slug];
  const safePrevious = previous && (!id || previous.tmdb_id === id) ? previous : {};
  const out = { poster: null, backdrop: null, overview: '', genres: [], providers: [], providersByRegion: {}, watchLinks: {}, tmdbRating: null, ...safePrevious, ...d, tmdb_id: id || safePrevious.tmdb_id, metadataStatus: d.identity?.status === 'verified' ? 'verified' : 'unverified', availabilityStatus: safePrevious.availabilityCheckedAt ? 'stale' : 'unconfirmed' };
  id = out.tmdb_id;
  if (!id) { console.warn('  ! no TMDB match for ' + d.slug + ' (using editorial data only)'); return out; }

  const details = await tmdb('/tv/' + id, { language: 'en-US', append_to_response: 'watch/providers' });
  if (details && Number(details.id) === Number(id)) {
    if (details.poster_path) out.poster = IMG + 'w500' + details.poster_path;
    if (details.backdrop_path) out.backdrop = IMG + 'w1280' + details.backdrop_path;
    out.overview = details.overview || '';
    out.genres = (details.genres || []).map((g) => g.name);
    out.tmdbRating = details.vote_average ? Math.round(details.vote_average * 10) / 10 : null;
    Object.assign(out, preserveEditorial(d, details));
    if (Array.isArray(details.networks) && details.networks[0]?.name) out.network = details.networks[0].name;
    const results = details['watch/providers']?.results;
    if (results && typeof results === 'object') {
    const record = cache[new URL('https://api.themoviedb.org/3/tv/' + id + '?language=en-US&append_to_response=watch%2Fproviders').toString()];
    out.availabilityCheckedAt = record?.fetchedAt || safePrevious.availabilityCheckedAt || null;
    out.availabilityStatus = out.availabilityCheckedAt && Date.now()-Date.parse(out.availabilityCheckedAt)<TTL ? 'checked' : 'stale';
    out.providerRecordsByRegion = {};
    out.providersByRegion = {};
    out.watchLinks = {};
    for (const r of REGIONS) {
      const row = results[r.code];
      out.providerRecordsByRegion[r.code] = providerRecords(row);
      const list = pickProviders(row);
      if (list.length) out.providersByRegion[r.code] = list;
      if (row?.link) out.watchLinks[r.code] = row.link;
    }
    out.providers = out.providersByRegion[country] || [];
    out.watchLink = out.watchLinks[country] || null;
    }
  }

  // Season entries (see "Later-season entries" in EDITORIAL.md 3b) pull episode count,
  // poster and air date from the season endpoint rather than the whole series.
  if (d.season) {
    const season = await tmdb('/tv/' + id + '/season/' + d.season, { language: 'en-US' });
    if (season) {
      if (!d.episodes && Array.isArray(season.episodes) && season.episodes.length) out.episodes = season.episodes.length;
      if (season.poster_path) out.poster = IMG + 'w500' + season.poster_path;
      if (season.overview) out.overview = season.overview;
      if (season.air_date) out.seasonAired = season.air_date;
    } else {
      console.warn('  ! no TMDB season ' + d.season + ' for ' + d.slug + ' (using editorial data only)');
    }
  }
  return out;
}

/* ---------------- layout ---------------- */
const PACE = ['Glacial', 'Slow', 'Steady', 'Brisk', 'Fast'];
const ROM = ['None', 'Background', 'Present', 'Central', 'The whole point'];
const HEAVY = ['Light', 'Easy', 'Moderate', 'Heavy', 'Devastating'];
const COMFORT = ['No', 'Rarely', 'Sometimes', 'Often', 'Always'];

function meter(label, value, n) {
  const bars = [1, 2, 3, 4, 5].map((i) => '<span class="' + (i <= n ? 'on' : '') + '"></span>').join('');
  return `<div class="attr"><span class="k">${label}</span><span class="meter" role="img" aria-label="${attr(label + ': ' + value + ', ' + n + ' of 5')}">${bars}</span><span class="v">${esc(value)}</span></div>`;
}

const humanDate = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const PERSON_NODE = () => ({
  '@type': 'Person', '@id': SITE_URL + '/#author', name: AUTHOR.name, url: SITE_URL + AUTHOR.url,
  image: SITE_URL + AUTHOR.image, jobTitle: AUTHOR.role, worksFor: { '@id': SITE_URL + '/#org' },
  knowsAbout: ['Korean drama', 'Asian drama', 'television criticism']
});
const ORG_NODE = () => ({ '@type': 'Organization', '@id': SITE_URL + '/#org', name: 'DramaRecs', url: SITE_URL + '/', founder: { '@id': SITE_URL + '/#author' } });

function byline(dateStr, extra) {
  const d = dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return `<span class="byline">${extra ? esc(extra) + ' &middot; ' : ''}Written by <a href="${attr(AUTHOR.url)}" rel="author">${esc(AUTHOR.name)}</a>${d ? ' &middot; reviewed ' + esc(d) : ''}</span>`;
}

function seasonNav(d) {
  if (!d.seasons || d.seasons.length < 2) return '';
  const items = d.seasons.map((s) => s.slug === d.slug
    ? `<span class="on" aria-current="page">${esc(s.seasonLabel)}</span>`
    : `<a href="/dramas/${s.slug}/">${esc(s.seasonLabel)}</a>`).join('');
  return `<nav class="seasons" aria-label="Seasons of ${attr(d.seasonTitle || d.title)}"><span class="k">Reviewed by season</span>${items}</nav>`;
}

/* The plate: a poster on a flat block of the drama's own hue, offset like a
   mis-registered print layer. Degrades to a titled colour block with no image. */
function plate(d, { link = true, lazy = true, cls = '' } = {}) {
  const inner = d.poster
    ? `<img class="pix" src="${attr(d.poster)}" ${d.poster.includes('/w500/') ? `srcset="${attr(d.poster.replace('/w500/', '/w185/'))} 185w, ${attr(d.poster.replace('/w500/', '/w342/'))} 342w, ${attr(d.poster)} 500w" sizes="(min-width: 1024px) 296px, (min-width: 640px) 200px, 42vw"` : ''} alt="${attr(d.title + ' poster')}" width="500" height="750"${lazy ? ' loading="lazy"' : ''} decoding="async">`
    : `<div class="pix"><span class="fallback">${esc(d.title)}<br><span class="tnum">${d.year}</span></span></div>`;
  const tag = link ? 'a' : 'div';
  const href = link ? ` href="/dramas/${d.slug}/"` : '';
  const label = link ? ` aria-label="${attr(d.title)}"` : '';
  return `<${tag} class="plate ${cls}"${href}${label}>${inner}</${tag}>`;
}

/* A drama page earns indexation by carrying an original verdict of its own.
   No verdict, no index: noindex,follow keeps it crawlable, linked and out of sitemap.xml. */
const hasVerdict = (d) => Boolean(d && d.verdict && String(d.verdict).trim());

/* ---------------- internal linking ----------------
   Filled in by main() before any page renders. A drama recommended on sixteen lists used to
   link back to none of them, so the pages that earn the traffic had no inbound links from the
   pages Google crawls first. Every map below exists to close one of those loops. */
const LISTS_BY_PICK = new Map();    // pick slug -> the lists that recommend it
const CATALOG_BY_TITLE = new Map(); // normalised title -> catalog entry, for free-text anti-picks
const RELATED_LISTS = new Map();    // seed slug -> lists whose taste overlaps
const normTitle = (v) => String(v || '').toLowerCase().replace(/\(\d{4}\)/g, '').replace(/[^a-z0-9]+/g, '');
/* Same normalisation on both sides of the search box: build writes it, app.js types against it. */
const searchKey = (v) => String(v || '').toLowerCase().replace(/[\u2019'`.,:;!?]/g, '').replace(/\s+/g, ' ').trim();

/* The hook callout. It used to read "Gets good at episode 1" for 85 of 195 entries, which is
   both a contradiction and a signal that never varies. The slow-start flag is now reserved for
   episode 3 and later, and everything faster is labelled for what it is. */
function hookLine(d) {
  const note = esc(d.hookNote || '');
  return d.hook >= 3
    ? `<p class="hooknote"><span class="hooktag">Slow start</span> ${note}</p>`
    : `<p class="hooknote"><span class="hooktag hooktag--now">Hooks early</span> ${note}</p>`;
}

/* ---------------- social cards ----------------
   twitter:card was `summary`, a small square, and og:image was a raw portrait poster with no
   dimensions and no alt, so a link posted to Reddit or Pinterest showed a thumbnail with nothing
   branded on it. Landscape backdrops make a proper large card; posters do not (they get
   centre-cropped to a strip), so anything without a backdrop falls back to the branded card. */
const OG_FALLBACK = { url: '/assets/og-default.png', w: 1200, h: 630 };
function card(d, alt) {
  if (d && d.backdrop) return { url: d.backdrop, w: 1280, h: 720, alt: alt || ((d.title || '') + ' backdrop') };
  return { ...OG_FALLBACK, alt: alt || 'DramaRecs: K-drama recommendations, reviewed by a human' };
}

/* Visible breadcrumbs and BreadcrumbList markup from one source, so they can never drift.
   items: [{ name, path }], the last entry is the current page. */
function crumbTrail(items) {
  const html = '<div class="wrap crumbs">' + items.map((it, i) => {
    const last = i === items.length - 1;
    const el = last ? `<span>${esc(it.name)}</span>` : `<a href="${attr(it.path)}">${esc(it.name)}</a>`;
    return (i ? '<span class="sep">/</span>' : '') + el;
  }).join('') + '</div>';
  const node = {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE_URL + it.path }))
  };
  return { html, node };
}

function regionSelect(id, cls) {
  return `<label class="regionpick ${cls || ''}"><span class="k">Region</span><select id="${attr(id)}" class="regionsel" aria-label="Streaming region">${
    REGIONS.map((r) => `<option value="${r.code}">${esc(r.label.replace(/^the /, ''))}</option>`).join('')
  }</select></label>`;
}

/* Google Fonts used to be a render-blocking stylesheet on the critical path: two extra DNS
   lookups and two TLS handshakes before a single character painted, on mobile, which is where all
   of this traffic comes from. Both families are now self-hosted latin woff2 subsets in
   /assets/fonts, declared with font-display:swap in styles.css and preloaded here. No third party
   sits in front of first paint, and one more external dependency is gone. */
const FONT_CSS = `<link rel="preload" href="/assets/fonts/schibsted-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/bricolage-grotesque-latin.woff2" as="font" type="font/woff2" crossorigin>`;

function layout({ title, description, canonical, body, jsonld, nav = '', ogImage, mobilebar = '', robots = '', ogType = 'website' }) {
  const og = ogImage && ogImage.url ? ogImage : (typeof ogImage === 'string' && ogImage ? { url: ogImage, w: 1280, h: 720, alt: title } : { ...OG_FALLBACK, alt: title });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(title)}</title>
<meta name="description" content="${attr(description)}">
<meta name="theme-color" content="#f7f1e4">
<link rel="canonical" href="${attr(canonical)}">
${robots ? `<meta name="robots" content="${attr(robots)}">` : ''}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="/assets/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:type" content="${attr(ogType)}">
<meta property="og:site_name" content="DramaRecs">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${attr(canonical)}">
<meta property="og:image" content="${attr(og.url.startsWith('http') ? og.url : SITE_URL + og.url)}">
<meta property="og:image:secure_url" content="${attr(og.url.startsWith('http') ? og.url : SITE_URL + og.url)}">
<meta property="og:image:width" content="${og.w}">
<meta property="og:image:height" content="${og.h}">
<meta property="og:image:alt" content="${attr(og.alt || title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(description)}">
<meta name="twitter:image" content="${attr(og.url.startsWith('http') ? og.url : SITE_URL + og.url)}">
<meta name="twitter:image:alt" content="${attr(og.alt || title)}">
<link rel="alternate" type="application/rss+xml" title="DramaRecs: new and revised lists" href="/feed.xml">
<link rel="preconnect" href="https://image.tmdb.org">
<link rel="stylesheet" href="/assets/styles.css">
${FONT_CSS}
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</scr` + `ipt>` : ''}
${ADSENSE ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${attr(ADSENSE)}" crossorigin="anonymous"></scr` + `ipt>` : ''}
${FC_ID ? `<script async src="https://fundingchoicesmessages.google.com/i/${attr(FC_ID)}?ers=1"></scr` + `ipt>
<script>(function(){function s(){window.__tcfapi&&window.__tcfapi('addEventListener',2,function(){})}window.googlefc=window.googlefc||{};window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];s()})()</scr` + `ipt>` : ''}
${GA_ID ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${attr(GA_ID)}"></scr` + `ipt>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${attr(GA_ID)}')</scr` + `ipt>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap bar">
  <a class="mark" href="/" aria-label="DramaRecs home">DramaRecs<span class="dot" aria-hidden="true"></span></a>
  <nav class="top" aria-label="Main">
    <a href="/dramas/"${nav === 'browse' ? ' aria-current="page"' : ''}>Browse</a>
    <a href="/collections/"${nav === 'moods' ? ' aria-current="page"' : ''}>Moods</a>
    <a href="/how-we-pick/"${nav === 'method' ? ' aria-current="page"' : ''}>Method</a>
    <a href="/my-shelf/"${nav === 'shelf' ? ' aria-current="page"' : ''}>Shelf</a>
  </nav>
</div></header>
<main id="main">
${body}
</main>
${mobilebar}
<footer class="site"><div class="wrap fgrid">
  <div>
    <span class="mark">DramaRecs<span class="dot" aria-hidden="true"></span></span>
    <p>Curated drama recommendations with reasons to watch and honest tradeoffs. No autoplay or recommendations generated on request.</p>
  </div>
  <div><h5>Start here</h5><ul>
    <li><a href="/dramas-like/my-liberation-notes/">Like My Liberation Notes</a></li>
    <li><a href="/dramas/reply-1988/">Reply 1988 review</a></li>
    <li><a href="/collections/">Collections by mood</a></li>
    <li><a href="/dramas/">All dramas</a></li>
    <li><a href="/my-shelf/">Your shelf</a></li>
  </ul></div>
  <div><h5>Site</h5><ul>
    <li><a href="/how-we-pick/">How we pick</a></li>
    <li><a href="/about/">About</a></li>
    <li><a href="/privacy/">Privacy</a></li>
    <li><a href="/terms/">Terms</a></li>
    <li><a href="/contact/">Contact</a></li>
    <li><a href="/feed.xml">RSS feed</a></li>
    ${ADSENSE ? '<li><button class="linkbtn" type="button" id="cookiechoices">Cookie choices</button></li>' : ''}
  </ul></div>
</div>
<div class="wrap fbot">
  <span>&copy; ${new Date().getFullYear()} DramaRecs</span>
  <span>Metadata and artwork from <a href="https://www.themoviedb.org/">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB. Streaming availability powered by <a href="https://www.justwatch.com/">JustWatch</a>. Coverage can be incomplete.</span>
  <span class="regionfoot">Streaming availability shown for <b class="regionname">${esc(REGION_LABEL[DEFAULT_REGION] || 'the United States')}</b>. ${regionSelect('regionfooter', 'regionpick--foot')}</span>
</div>${AFF_LIVE ? `<div class="wrap fbot fbot--aff"><span>Some links to streaming services are affiliate links and DramaRecs may earn a commission if you subscribe. It costs you nothing extra, and it never buys a pick, a score or a place on a list. <a href="/privacy/">More in the privacy policy</a>.</span></div>` : ''}</footer>
<script>window.DR_WATCH=${JSON.stringify(WATCH_TABLE)};window.DR_AFF=${AFF_LIVE ? 'true' : 'false'}</scr` + `ipt>
<script src="/assets/core.js" defer></scr` + `ipt>
<script src="/assets/app.js" defer></scr` + `ipt>
</body>
</html>`;
}

function searchField(placeholder = 'the drama you can\u2019t get over\u2026') {
  return `<div class="searchblock">
  <div class="searchfield">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>
    <input id="q" type="text" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="sug" aria-label="Search for a drama" placeholder="${attr(placeholder)}">
    <button class="go" id="gobtn" type="button">Find similar</button>
  </div>
  <div class="suggest" id="sug" role="listbox"></div>
  <p class="hint">Start with <a href="/dramas-like/my-liberation-notes/">My Liberation Notes</a>, <a href="/dramas/reply-1988/">Reply 1988</a> or <a href="/dramas/the-glory/">The Glory</a>.</p>
</div>`;
}

/* Reserve the height in CSS (.adslot has a min-height) so an ad landing does not shove the
   article down and trade Core Web Vitals for revenue. */
function adRow(slotId) {
  if (!ADSENSE || !slotId) return '';
  return `<div class="adslot adslot--inrow"><span class="adlabel">Advertisement</span><ins class="adsbygoogle" style="display:block" data-ad-client="${attr(ADSENSE)}" data-ad-slot="${attr(slotId)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({})</scr` + `ipt></div>`;
}

function adSlot(slotId) {
  if (!ADSENSE || !slotId) return '';
  return `<div class="wrap"><div class="adslot"><ins class="adsbygoogle" style="display:block" data-ad-client="${attr(ADSENSE)}" data-ad-slot="${attr(slotId)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({})</scr` + `ipt></div></div>`;
}

/* A chip is a link when we have somewhere honest to send it: the brand's own title search where
   we know the pattern, otherwise the TMDB region link, otherwise nothing and it stays a span.
   rel="sponsored" is only on the ones that actually pay, which is what Google asks for and also
   the only version of this that is true. */
function provChips(list, code, d) {
  if (!list || !list.length) {
    return `<span class="prov prov--none">Availability unconfirmed in ${esc(REGION_LABEL[code] || 'your region')}</span>`;
  }
  const fallback = (d && d.watchLinks && d.watchLinks[code]) || '';
  const title = (d && d.title) || '';
  return list.map((pv) => {
    const hit = watchHref(pv, code, title);
    const href = hit ? hit.href : fallback;
    if (!href) return `<span class="prov">${esc(pv)}</span>`;
    const paid = Boolean(hit && hit.paid);
    const rel = paid ? 'sponsored nofollow noopener' : 'nofollow noopener';
    const label = `${title ? title + ' on ' : ''}${pv}${paid ? ', affiliate link' : ''}, opens in a new tab`;
    return `<a class="prov prov--link${paid ? ' prov--aff' : ''}" href="${attr(href)}" rel="${rel}" target="_blank" aria-label="${attr((hit ? 'Search ' : 'Check availability: ') + pv + ', opens in a new tab')}">${hit ? 'Search ' : 'Check availability: '}${esc(pv)}</a>`;
  }).join('');
}

/* Every region this drama streams in travels with the row, so switching region is instant and
   costs no request. Rendered with the default region so crawlers and no-JS readers see a row.
   data-title travels too, because the affiliate targets are title searches and the client has to
   build the same href this function just built. */
function watchRow(d, cls) {
  const byRegion = d.providersByRegion || {};
  const payload = attr(JSON.stringify({ p: byRegion, l: d.watchLinks || {} }));
  return `<span class="watch${cls ? ' ' + cls : ''}" data-watch="${payload}" data-title="${attr(d.title || '')}" data-region="${DEFAULT_REGION}">${provChips(byRegion[DEFAULT_REGION], DEFAULT_REGION, d)}</span><small class="availabilitynote">${d.availabilityCheckedAt ? `Availability data: ${esc(humanDate(d.availabilityCheckedAt))}${d.availabilityStatus === 'stale' ? ' (may be outdated)' : ''}. ` : 'Availability not verified. '}<a href="https://www.justwatch.com/" target="_blank" rel="noopener">Check JustWatch</a>.</small>`;
}

/* The disclosure. FTC wants it near the click, not only in the footer, so it ships in both places
   and both are gated on AFF_LIVE. With no ids set the links earn nothing and printing this would
   be a false statement in the other direction. */
const AFF_NOTE = AFF_LIVE
  ? '<p class="affnote">Some streaming links earn us a commission. It never changes a pick, a score or an order.</p>'
  : '';

function attrPanel(d) {
  return `<div class="attrs">
      ${meter('Pace', PACE[Math.max(0, d.pace - 1)], d.pace)}
      ${meter('Romance', ROM[d.romance], d.romance)}
      ${meter('Emotional load', HEAVY[Math.max(0, d.heavy - 1)], d.heavy)}
      ${meter('Comfort rewatch', COMFORT[Math.max(0, d.comfort - 1)], d.comfort)}
    </div>`;
}

/* One full-width row per recommendation at every viewport. A grid would
   truncate the explanation, and the explanation is the whole product. */
function decisionCopy(why) {
  const [fit, ...rest] = String(why || '').split(/Difference:/i);
  const first = text => strip(text).match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || strip(text);
  const difference = rest.join('Difference:').trim();
  return `<p class="why"><b>Why it fits:</b> ${esc(first(fit))}</p>${difference ? `<p class="difference"><b>Main difference:</b> ${esc(first(difference))}</p>` : ''}<details class="fullreason"><summary>Read the full comparison (may discuss the ending)</summary><p>${why}</p></details>`;
}
function watchedButton(d) { return `<button class="watched" type="button" data-slug="${d.slug}" aria-pressed="false">Already watched</button>`; }
function commitment(d) { return `${d.seasonLabel ? esc(d.seasonLabel) + ': ' : ''}${d.episodes} episodes${d.runtime ? `, approximately ${Math.round(d.episodes*d.runtime/60*10)/10} hours in total` : ''}`; }
function recRow(d, pick, rank, i, seedTitle) {
  return `<article class="rec" style="--hue:${d.hue || 40};--i:${i}" data-slug="${d.slug}" data-heavy="${d.heavy}" data-eps="${d.episodes}" data-pace="${d.pace}" data-romance="${d.romance}" data-provs="${attr(d.providers.join(','))}">
  ${plate(d)}
  <div class="rectop">
    <span class="rank tnum" aria-hidden="true">${String(rank).padStart(2, '0')}</span>
    <h3 class="rectitle"><a href="/dramas/${d.slug}/">${esc(d.title)}</a></h3>
    ${d.native ? `<span class="native" lang="ko">${esc(d.native)}</span>` : ''}
    <p class="recmeta"><span class="tnum">${d.year}</span><span class="dot" aria-hidden="true">/</span>${esc(d.network || 'Korea')}<span class="dot" aria-hidden="true">/</span><span class="tnum">${d.episodes}</span> ep<span class="dot" aria-hidden="true">/</span><span class="tnum">~${d.runtime}</span> min</p>
    <p class="commitment">${commitment(d)}</p>
  </div>
  <div class="recbody">
    ${decisionCopy(pick.why)}
    ${attrPanel(d)}
    <div class="recfoot">
      <button class="spoiler" type="button" data-label="${attr(d.ending)}" data-text="${attr(d.endingText)}" aria-expanded="false">Reveal ending (spoiler)</button>
      ${watchRow(d)}
      <button class="shelf" type="button" data-slug="${d.slug}" data-title="${attr(d.title)}" aria-pressed="false">Save for later</button>${watchedButton(d)}
      ${d.hasLikePage ? `<a class="reclink" href="/dramas-like/${d.slug}/">Dramas like ${esc(d.title)} &rarr;</a>` : `<a class="reclink reclink--quiet" href="/dramas/${d.slug}/">Full write-up &rarr;</a>`}
      <a class="argue" href="mailto:hello@dramarecs.com?subject=${encodeURIComponent('Wrong pick: ' + d.title + (seedTitle ? ' on the ' + seedTitle + ' list' : ''))}&body=${encodeURIComponent('This pick does not hold up because:')}" title="Tell us why this pick is wrong">Wrong pick?</a>
    </div>
    ${hookLine(d)}
  </div>
</article>`;
}

/* ---------------- collections (teardown 9 and 17) ----------------
   There used to be nothing between the homepage and 285 detail pages: /dramas/ was a single wall
   of 195 links, and every attribute that gets hand-set on an entry (pace, emotional load,
   romance, comfort, ending, hook, episode count, providers) was structured data being used for
   nothing. Each collection below is a filtered view of data that already exists, it is a real
   search people type, and it is also the mood matcher the About page has been promising: someone
   who cannot name a show still knows how they want to feel. Add one by adding an object here. */
const HUBS = [
  {
    slug: 'slow-burn-korean-dramas', nav: 'moods',
    word: 'Slow and quiet', line: 'Nothing hurries. The payoff is cumulative.',
    h1: 'Slow burn K-dramas', title: 'Slow burn K-dramas that earn the wait',
    standfirst: 'Dramas set to glacial or slow by hand, where the pleasure is accumulation rather than plot. Each one names the episode it stops being work, so you know what you are signing up for before you lose an evening.',
    criterion: 'Pace hand-set to 1 or 2 out of 5.',
    where: (d) => d.pace <= 2,
    sort: (a, b) => a.pace - b.pace || (b.comfort || 0) - (a.comfort || 0)
  },
  {
    slug: 'k-dramas-with-happy-endings', nav: 'moods',
    word: 'Ends kindly', line: 'You can commit twenty hours without dread.',
    h1: 'K-dramas with happy endings', title: 'K-dramas with happy or hopeful ending labels',
    standfirst: 'These titles carry happy or hopeful ending labels in our catalog. Collection membership reveals the ending tone; legacy review prose may discuss plot outcomes.',
    criterion: 'Ending labelled happy or hopeful.',
    where: (d) => /happy|hopeful/i.test(d.ending || ''),
    sort: (a, b) => (b.comfort || 0) - (a.comfort || 0) || (b.year || 0) - (a.year || 0)
  },
  {
    slug: 'k-dramas-with-sad-endings', nav: 'moods',
    word: 'Ends hard', line: 'Bittersweet or tragic, and worth it anyway.',
    h1: 'K-dramas with sad endings', title: 'K-dramas with sad endings: bittersweet, tragic, still worth it',
    standfirst: 'Bittersweet and tragic endings, flagged in advance. Some nights that is exactly what you want, and it is a terrible surprise on any other night.',
    criterion: 'Ending labelled bittersweet or tragic.',
    where: (d) => /bittersweet|tragic/i.test(d.ending || ''),
    sort: (a, b) => (b.heavy || 0) - (a.heavy || 0) || (b.year || 0) - (a.year || 0)
  },
  {
    slug: 'short-k-dramas', nav: 'moods',
    word: 'Fewer episodes', line: 'Twelve episodes or fewer. Runtime still matters.',
    h1: 'Short K-dramas', title: 'K-dramas with 12 episodes or fewer',
    standfirst: 'Twelve episodes or fewer. Episode lengths vary, so use the approximate total hours on each detail page to judge the commitment. This is an episode-count filter, not a promise of a weekend watch.',
    criterion: '12 episodes or fewer.',
    where: (d) => globalThis.DRCore.shortEpisodes(d.episodes),
    sort: (a, b) => (a.episodes || 99) - (b.episodes || 99) || (b.year || 0) - (a.year || 0)
  },
  {
    slug: 'k-dramas-worth-the-slow-start', nav: 'moods',
    word: 'Push through', line: 'Slow first hours, then it clicks.',
    h1: 'K-dramas worth the slow start', title: 'K-dramas worth the slow start, with the exact episode it clicks',
    standfirst: 'These need patience in the first hours and then they land. Each entry names the episode where it stops being work, so you know how much faith to bring.',
    criterion: 'Hook flagged at episode 3 or later.',
    where: (d) => (d.hook || 0) >= 3,
    sort: (a, b) => (a.hook || 0) - (b.hook || 0) || (b.comfort || 0) - (a.comfort || 0)
  },
  {
    slug: 'feel-good-k-dramas', nav: 'moods',
    word: 'Nothing heavy', line: 'For when you cannot take one more sad show.',
    h1: 'Feel-good K-dramas', title: 'Feel-good K-dramas for when you cannot handle anything heavy',
    standfirst: 'Light emotional load and high rewatch comfort: the shows you can put on while cooking, that will not ambush you, and that you can restart from any episode.',
    criterion: 'Emotional load 2 or lower, comfort rewatch 4 or higher.',
    where: (d) => (d.heavy || 3) <= 2 && (d.comfort || 0) >= 4,
    sort: (a, b) => (b.comfort || 0) - (a.comfort || 0) || (a.heavy || 0) - (b.heavy || 0)
  },
  {
    slug: 'k-dramas-that-will-wreck-you', nav: 'moods',
    word: 'Wreck me', line: 'Heavy on purpose. Clear your evening.',
    h1: 'K-dramas that will wreck you', title: 'K-dramas that will wreck you: heavy, and worth the damage',
    standfirst: 'Emotional load 4 or 5. These are the ones people talk about for years, and none of them are background viewing. Ending details are available behind a spoiler button on each detail page.',
    criterion: 'Emotional load hand-set to 4 or 5 out of 5.',
    where: (d) => (d.heavy || 0) >= 4,
    sort: (a, b) => (b.heavy || 0) - (a.heavy || 0) || (b.year || 0) - (a.year || 0)
  },
  {
    slug: 'romance-k-dramas', nav: 'moods',
    word: 'Romance first', line: 'The couple is the plot, not the subplot.',
    h1: 'Romance-forward K-dramas', title: 'Romance K-dramas where the couple is actually the plot',
    standfirst: 'Romance rated 4 or 5, which means the relationship carries the story rather than decorating a case-of-the-week. Filed by how much it will cost you emotionally.',
    criterion: 'Romance hand-set to 4 or 5 out of 5.',
    where: (d) => (d.romance || 0) >= 4,
    sort: (a, b) => (b.romance || 0) - (a.romance || 0) || (a.heavy || 0) - (b.heavy || 0)
  },
  {
    slug: 'comfort-rewatch-k-dramas', nav: 'moods',
    word: 'Put it on again', line: 'Rewatchable at any episode, any mood.',
    h1: 'Comfort rewatch K-dramas', title: 'Comfort K-dramas you can rewatch at any episode',
    standfirst: 'High comfort rewatch: shows that hold up on a second run, that you can drop into halfway, and that do not depend on a twist you already know.',
    criterion: 'Comfort rewatch 4 or higher.',
    where: (d) => (d.comfort || 0) >= 4,
    sort: (a, b) => (b.comfort || 0) - (a.comfort || 0) || (b.year || 0) - (a.year || 0)
  },
  {
    slug: 'best-k-dramas-on-netflix', nav: 'moods',
    word: 'On Netflix', line: 'Already in the subscription you pay for.',
    h1: 'K-dramas on Netflix US', title: 'K-dramas on Netflix US, from the DramaRecs catalog',
    standfirst: 'A fixed United States catalog snapshot, not a live availability guarantee or an overall best-to-worst ranking. Changing the streaming region elsewhere does not change membership here. Confirm availability before subscribing.',
    criterion: 'Netflix United States (US) subscription availability in the available metadata snapshot.',
    where: (d) => (d.providersByRegion?.US || []).some((x) => /^Netflix(?: |$)/i.test(x)),
    sort: (a, b) => (b.year || 0) - (a.year || 0)
  }
];
const HUB_MIN = 6; // a collection with five entries is a thin page, and thin pages hurt the site

const FILTERS = [
  ['light', 'Easier on me'], ['short', '12 ep or fewer'], ['netflix', 'On Netflix'],
  ['romance', 'Romance-forward'], ['slow', 'Very slow burn']
];

/* ---------------- pages ---------------- */
function pageLike(page, seed, picks, related = []) {
  const title = `Dramas like ${seed.title}: ${picks.length} picks that actually feel the same`;
  const desc = clip(page.meta || page.standfirst);
  const canonical = `${SITE_URL}/dramas-like/${seed.slug}/`;
  const trail = crumbTrail([{ name: 'Home', path: '/' }, { name: 'Dramas', path: '/dramas/' }, { name: 'Like ' + seed.title, path: `/dramas-like/${seed.slug}/` }]);
  const body = `
${trail.html}
<div class="seedhead"><div class="wrap">
  <div class="seedgrid" style="--hue:${seed.hue || 40}">
    <h1>Dramas like<br>${esc(seed.title)}</h1>
    ${plate(seed, { lazy: false })}
    <div class="seedmeta">
      <span class="eyebrow eyebrow--flare">Because you loved</span>
      ${seed.native ? `<span class="native" lang="ko">${esc(seed.native)}</span>` : ''}
      <span><span class="tnum">${seed.year}</span> &middot; ${esc(seed.network || 'Korea')} &middot; <span class="tnum">${seed.episodes}</span> episodes</span>
      ${seed.genres.length ? `<span>${esc(seed.genres.join(', '))}</span>` : ''}
      ${seed.providers.length ? `<span>Streaming: <b>${esc(seed.providers.join(', '))}</b></span>` : ''}
      <a class="change" href="/#main">Change drama</a>
    </div>
    <p class="standfirst">${page.standfirst}</p>
  </div>
  <div style="margin-top:var(--s4)">${byline(page.reviewed, picks.length + ' picks')}</div>
  ${seasonNav(seed)}
</div></div>
${page.reasons?.length ? `<div class="wrap reasonpicker" data-reasons="${attr(JSON.stringify(page.reasons))}"><label for="reasonchoice">What did you want more of?</label><select id="reasonchoice"><option value="">Original editorial order</option>${page.reasons.map(r=>`<option value="${attr(r.id)}">${esc(r.label)}</option>`).join('')}</select><p>Experimental pilot: focuses the existing comparisons on a specific connection. Other pages keep their original order.</p></div>` : ''}
<div class="refine"><div class="wrap refine-in">
  <span class="lbl">Narrow it down</span>
  ${FILTERS.map(([id, label]) => `<button class="chip" type="button" data-f="${id}" aria-pressed="false">${label}</button>`).join('')}
  <button class="clearall" type="button" hidden>Clear all</button>
  <span class="count tnum">${picks.length} of ${picks.length}</span>
</div></div>
<div class="wrap"><p class="matchnote">An editorial shortlist, not a statistical match score. Read the shared thread and the main difference before choosing.</p></div>
<div class="wrap">
  <div class="recs">${picks.map((p, i) => {
    const row = recRow(p.drama, p, i + 1, i, seed.title);
    if (i === 1) return row + adRow(process.env.ADSENSE_SLOT_INLINE);
    if (i === 4) return row + adRow(process.env.ADSENSE_SLOT_LIST_MID);
    return row;
  }).join('')}</div>
  <div class="empty" id="nofilterhits" hidden>
    <h2>Nothing survives all of those.</h2>
    <p>That combination does not exist in this set. Drop one filter and we will get you back to something honest.</p>
    <div class="actions"><button class="btn btn--ghost" type="button" id="emptyclear">Clear the filters</button><a class="btn" href="/dramas/">Browse everything</a></div>
  </div>
</div>
${(page.against || []).length ? `<div class="band band--ink"><div class="wrap">
  <span class="eyebrow">Different tradeoffs</span>
  <div class="sechead" style="margin-top:var(--s3)"><h2>Less suitable for the feeling described above</h2></div>
  ${(page.against || []).map((a) => {
    const hosted = CATALOG_BY_TITLE.get(normTitle(a.title));
    /* If we host the title, say so and link it. Telling someone to skip a show and then hiding
       our own page on it is a dead end for them and a dead end for the crawler. */
    const head = hosted ? `<a href="/dramas/${hosted.slug}/">${esc(a.title)}</a>` : esc(a.title);
    return `<div class="notrow"><h4>${head}</h4><p>${a.why}</p></div>`;
  }).join('')}
</div></div>` : ''}
${adSlot(process.env.ADSENSE_SLOT_LIST_FOOT)}
${related.length ? `<div class="wrap"><div class="sechead" style="margin-top:var(--s7)"><h2>Lists that overlap this one</h2><a class="more" href="/dramas/">All dramas &rarr;</a></div>
  <div class="gridlist">${related.map((r) => `<a class="gitem" href="/dramas-like/${r.slug}/" style="--hue:${r.drama.hue || 40}">${plate(r.drama, { link: false })}<h3>Dramas like ${esc(r.drama.title)}</h3><p class="m tnum">${r.shared} picks in common</p></a>`).join('')}</div></div>` : ''}
<div class="wrap"><div class="note">
  <span class="eyebrow eyebrow--flare">A note on method</span>
  <p>Matching starts from attributes we set by hand: pace, how much romance drives the plot, emotional weight, comfort. Each relationship needs an explanation and a meaningful difference. Historical research coverage varies; title-by-title provenance is being reviewed. <a href="/how-we-pick/">Full method</a>.</p>
  <p>Disagree with a pick? <a href="/contact/">Tell us and we will revisit it.</a></p>
</div></div>`;
  const mobilebar = `<div class="mobilebar"><a class="secondary" href="#main">Back to top</a><a class="primary" href="/#main">Change drama</a></div>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList', name: title, url: canonical,
        author: { '@type': 'Person', '@id': SITE_URL + '/#author', name: AUTHOR.name, url: SITE_URL + AUTHOR.url },
        publisher: { '@type': 'Organization', '@id': SITE_URL + '/#org', name: 'DramaRecs', url: SITE_URL + '/' },
        dateModified: page.reviewed,
        numberOfItems: picks.length,
        itemListElement: picks.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/dramas/${p.drama.slug}/`, name: p.drama.title }))
      },
      trail.node
    ]
  };
  return layout({ title: title + ' | DramaRecs', description: desc, canonical, body, jsonld, nav: 'browse', ogImage: card(seed, 'Dramas like ' + seed.title), mobilebar, ogType: 'article' });
}

function pageDetail(d, likeExists, alsoLike, onLists = []) {
  const canonical = `${SITE_URL}/dramas/${d.slug}/`;
  const indexable = hasVerdict(d);
  const title = `${d.title} (${d.year}): pace, ending, and where to watch`;
  const desc = clip(d.meta || d.verdict || d.overview || d.hookNote);
  const reviewedOn = d.verdictUpdated || d.reviewed || null;
  const trail = crumbTrail([{ name: 'Home', path: '/' }, { name: 'Dramas', path: '/dramas/' }, { name: d.title, path: `/dramas/${d.slug}/` }]);
  const facts = [
    ['Year', `<span class="tnum">${d.year}</span>`],
    ['Network', esc(d.network || 'Korea')],
    ['Episodes', `<span class="tnum">${d.episodes}</span>`],
    ['Runtime', `<span class="tnum">~${d.runtime}</span> min`],
    ['Commitment', commitment(d)],
    ['Metadata identity', d.metadataStatus === 'verified' ? 'Reviewed mapping' : 'Mapping needs review'],
    d.tmdbRating ? ['TMDB', `<span class="tnum">${d.tmdbRating}</span> / 10`] : null,
    d.genres.length ? ['Genres', esc(d.genres.join(', '))] : null
  ].filter(Boolean);
  const body = `
${trail.html}
<div class="wrap"><div class="detail" style="--hue:${d.hue || 40}">

  <div class="detailtitle">
    <span class="eyebrow eyebrow--flare">${esc(d.genres.join(' &middot; ') || 'Korean drama')}</span>
    <h1>${esc(d.title)}</h1>
    ${d.native ? `<span class="native" lang="ko">${esc(d.native)}</span>` : ''}
    <p class="recmeta"><span class="tnum">${d.year}</span><span class="dot" aria-hidden="true">/</span>${esc(d.network || 'Korea')}<span class="dot" aria-hidden="true">/</span><span class="tnum">${d.episodes}</span> ep<span class="dot" aria-hidden="true">/</span><span class="tnum">~${d.runtime}</span> min</p>
    ${reviewedOn ? `<p class="upd">Checked and re-read <time datetime="${attr(reviewedOn)}">${esc(humanDate(reviewedOn))}</time></p>` : ''}
  </div>

  <div class="detailmain">
    ${seasonNav(d)}
    ${d.verdict ? `<div class="verdict"><span class="eyebrow eyebrow--flare">Is it worth it</span><p>${d.verdict}</p>${byline(reviewedOn)}</div>` : ''}
    ${d.overview ? `<details><summary>Premise from TMDB (may contain spoilers)</summary><p class="overview">${esc(d.overview)}</p></details>` : ''}
    ${adRow(process.env.ADSENSE_SLOT_DETAIL)}
    <div class="feel"><span class="eyebrow">The feel of it</span>${attrPanel(d)}</div>
    <div class="recfoot">
      <button class="spoiler" type="button" data-label="${attr(d.ending)}" data-text="${attr(d.endingText)}" aria-expanded="false">Reveal ending (spoiler)</button>
    </div>
    ${hookLine(d)}
  </div>

  <aside class="detailside">
    ${plate(d, { link: false, lazy: false })}
    <div class="sidewatch">
      <span class="eyebrow">Where to watch</span>
      ${watchRow(d)}
      ${regionSelect('regiondetail')}
      ${AFF_NOTE}
    </div>
    ${likeExists ? `<a class="btn" href="/dramas-like/${d.slug}/">Dramas like this &rarr;</a>` : ''}
    <button class="shelf" type="button" data-slug="${d.slug}" data-title="${attr(d.title)}" aria-pressed="false">Save for later</button>${watchedButton(d)}
    <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  </aside>


</div></div>
${onLists.length ? `<div class="band band--rule"><div class="wrap">
  <div class="sechead"><h2>Where we recommend it</h2><span class="more">${onLists.length === 1 ? 'On one list' : 'On ' + onLists.length + ' lists'}</span></div>
  <ul class="onlists">${onLists.slice(0, 12).map((l) => `<li><a href="/dramas-like/${l.seed}/">Dramas like ${esc(l.title)}</a><span class="pct">Editorial recommendation</span></li>`).join('')}</ul>
</div></div>` : ''}
${alsoLike.length ? `<div class="band band--rule"><div class="wrap">
  <div class="sechead"><h2>Recommended alongside</h2><a class="more" href="/dramas/">All dramas &rarr;</a></div>
  <div class="gridlist">${alsoLike.map((x) => `<a class="gitem" href="/dramas/${x.slug}/" style="--hue:${x.hue || 40}">${plate(x, { link: false })}<h3>${esc(x.title)}</h3><p class="m tnum">${x.year}</p><p>${esc(x.reason || '')}</p></a>`).join('')}</div>
</div></div>` : ''}`;
  /* The verdict is the most distinctive thing on the page and it used to be marked up as nothing
     at all. It is a Review now, by a named Person, about this TVSeries. reviewRating is only
     emitted when the entry carries an explicit "score" (1-10) written by hand: inventing a star
     rating out of the pace and comfort meters would be a rating of the wrong thing. */
  const show = {
    '@type': d.season ? 'TVSeason' : 'TVSeries', '@id': canonical + '#show', name: d.title, alternateName: d.native,
    url: canonical, image: d.poster || undefined, description: d.overview || undefined,
    numberOfEpisodes: d.episodes, inLanguage: 'ko', datePublished: String(d.year),
    genre: d.genres && d.genres.length ? d.genres : undefined,
    countryOfOrigin: { '@type': 'Country', name: 'South Korea' },
    seasonNumber: d.season || undefined,
    review: d.verdict ? { '@id': canonical + '#review' } : undefined
  };
  const review = d.verdict ? {
    '@type': 'Review', '@id': canonical + '#review',
    name: `Is ${d.title} worth watching?`,
    reviewBody: strip(d.verdict),
    datePublished: reviewedOn || undefined,
    dateModified: reviewedOn || undefined,
    author: { '@id': SITE_URL + '/#author' },
    publisher: { '@id': SITE_URL + '/#org' },
    itemReviewed: { '@id': canonical + '#show' },
    reviewRating: typeof d.score === 'number' ? { '@type': 'Rating', ratingValue: d.score, bestRating: 10, worstRating: 1 } : undefined
  } : null;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [show, review, PERSON_NODE(), ORG_NODE(), trail.node].filter(Boolean)
  };
  return layout({ title: title + ' | DramaRecs', description: desc, canonical, body, jsonld, nav: 'browse', ogImage: card(d, d.title + ': is it worth watching'), robots: indexable ? '' : 'noindex,follow', ogType: 'article' });
}

function pageHome(site, dramas, pages, built = []) {
  const bySlug = Object.fromEntries(dramas.map((d) => [d.slug, d]));
  const popular = site.popular.filter((p) => bySlug[p.slug]);
  const mosaic = popular.slice(0, 4).map((p) => bySlug[p.slug]);
  const body = `
<div class="hero"><div class="wrap">
  <div class="herogrid">
    <div>
      <span class="eyebrow eyebrow--flare">K-drama recommendations, reviewed by a human</span>
      <h1 style="margin-top:var(--s4)">You finished it. Now <span class="hi">nothing</span> else measures up.</h1>
      <p class="lead">Tell us the one that wrecked you. We hand you the ones that carry the same feeling, with the reason spelled out, a flag when a show needs patience before it starts working, and whether the ending will do you dirty.</p>
      ${searchField()}
    </div>
    <div class="mosaic" aria-label="Most asked for dramas">
      ${mosaic.map((d, i) => `<a class="pm" href="${d.hasLikePage ? `/dramas-like/${d.slug}/` : `/dramas/${d.slug}/`}" style="--hue:${d.hue || 40};--i:${i}">${plate(d, { link: false, lazy: false })}<span class="cap">${d.hasLikePage ? 'Like ' : 'Review: '}${esc(d.title)}</span></a>`).join('')}
    </div>
  </div>
</div></div>

<section class="band"><div class="wrap">
  <div class="sechead"><h2>Most asked for</h2><a class="more" href="/dramas/">All ${dramas.length} dramas &rarr;</a></div>
  <div class="poplist">
  ${popular.map((p) => {
    const written = pages.some((pg) => pg.seed === p.slug);
    const href = written ? `/dramas-like/${p.slug}/` : `/dramas/${p.slug}/`;
    return `<a class="poprow" href="${href}"><span class="q">${written ? 'Dramas like ' : 'Review: '}${esc(bySlug[p.slug].title)}</span><span class="tag">${written ? 'Recommendations' : 'Review'}</span><span class="c tnum">${bySlug[p.slug].year}</span></a>`;
  }).join('')}
  </div>
</div></section>

${built.length ? `<section class="band band--tint"><div class="wrap">
  <span class="eyebrow eyebrow--flare">Cannot name a show</span>
  <div class="sechead" style="margin-top:var(--s3)"><h2>Then start from how you want to feel</h2><a class="more" href="/collections/">All collections &rarr;</a></div>
  <div class="moods" style="margin-top:var(--s4)">${built.slice(0, 8).map(({ hub, entries }) => `<a class="mood" href="/collections/${hub.slug}/"><span class="w">${esc(hub.word)}</span><span class="l">${esc(hub.line)}</span><span class="l tnum">${entries.length} titles</span></a>`).join('')}</div>
</div></section>` : ''}

<section class="band band--ink"><div class="wrap">
  <span class="eyebrow">The difference</span>
  <div class="sechead" style="margin-top:var(--s3)"><h2>Why not just ask an AI</h2></div>
  <div class="steps">
    <div class="step"><span class="n tnum">01</span><div><h3 style="font-size:1.1875rem">It answers, we commit</h3><p>Every pick here is written down, dated, and revised when readers push back. Ask a chatbot twice and you get two different lists.</p></div></div>
    <div class="step"><span class="n tnum">02</span><div><h3 style="font-size:1.1875rem">Ending reveal controls</h3><p>Ending buttons stay hidden until you choose to reveal them. Legacy review prose is still being checked for spoilers.</p></div></div>
    <div class="step"><span class="n tnum">03</span><div><h3 style="font-size:1.1875rem">The stuff only fans track</h3><p>Which episode it stops being slow. How much it will cost you emotionally. Where availability has been reported, with a source check.</p></div></div>
  </div>
</div></section>

<section class="band band--tint"><div class="wrap trust">
  <span class="eyebrow eyebrow--flare">Hand-checked, then signed off</span>
  <p>Titles, posters and streaming rows come from TMDB. Every meter, hook, ending label and verdict is written here and signed off before it publishes. We never invent titles.</p>
  <a class="btn btn--ghost" href="/how-we-pick/">How we pick &rarr;</a>
</div></section>

<section class="band"><div class="wrap">
  <div class="sechead"><h2>Newest releases</h2><a class="more" href="/dramas/">All ${dramas.length} &rarr;</a></div>
  <div class="gridlist">${[...dramas].sort((a, b) => (b.year || 0) - (a.year || 0) || a.title.localeCompare(b.title)).slice(0, 12).map((d) => `<a class="gitem" href="/dramas/${d.slug}/" style="--hue:${d.hue || 40}">${plate(d, { link: false })}<h3>${esc(d.title)}</h3><p class="m tnum">${d.year}</p></a>`).join('')}</div>
</div></section>`;
  return layout({
    title: 'DramaRecs | Find your next K-drama by how the last one felt',
    description: 'Explore K-drama recommendations by pacing, emotional tone and shared themes. Read fit notes, tradeoffs and regional streaming information; review coverage varies.',
    canonical: SITE_URL + '/', body, nav: '', ogImage: card(mosaic[0], 'DramaRecs: find your next K-drama by how the last one felt'),
    jsonld: {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': SITE_URL + '/#website', name: 'DramaRecs', url: SITE_URL + '/', publisher: { '@id': SITE_URL + '/#org' } },
        { '@type': 'Organization', '@id': SITE_URL + '/#org', name: 'DramaRecs', url: SITE_URL + '/', founder: { '@id': SITE_URL + '/#author' } },
        { '@type': 'Person', '@id': SITE_URL + '/#author', name: AUTHOR.name, url: SITE_URL + AUTHOR.url, image: SITE_URL + AUTHOR.image, jobTitle: AUTHOR.role, worksFor: { '@id': SITE_URL + '/#org' }, knowsAbout: ['Korean drama', 'Asian drama', 'film criticism'] }
      ]
    }
  });
}

function pageBrowse(dramas, pages, built = []) {
  const trail = crumbTrail([{ name: 'Home', path: '/' }, { name: 'Dramas', path: '/dramas/' }]);
  const body = `
${trail.html}
<div class="wrap" style="padding-top:var(--s5)">
  <h1 style="font-size:var(--t-2xl);letter-spacing:-.04em">Every drama in our catalog</h1>
  <p class="standfirst" style="max-width:60ch;margin-top:var(--s3)"><span class="hi tnum">${dramas.length} titles</span>, with pacing and emotional-load notes where available. Review coverage varies; ending labels require an explicit reveal on detail and recommendation pages, and legacy prose may contain spoilers. ${pages.length} have a full similar-dramas page.</p>
</div>
${built.length ? `<div class="wrap"><div class="hubstrip"><span class="lbl">Or start from a mood</span>${built.map(({ hub, entries }) => `<a class="chip chip--link" href="/collections/${hub.slug}/">${esc(hub.word)} <span class="tnum">${entries.length}</span></a>`).join('')}<a class="chip chip--link" href="/collections/">All collections &rarr;</a></div></div>` : ''}
<section class="band"><div class="wrap"><div class="gridlist">${dramas.map((d) => `<a class="gitem" href="/dramas/${d.slug}/" style="--hue:${d.hue || 40}">${plate(d, { link: false })}<h3>${esc(d.title)}</h3><p class="m tnum">${d.year} &middot; ${d.episodes} ep</p></a>`).join('')}</div></div></section>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': SITE_URL + '/dramas/', url: SITE_URL + '/dramas/', name: 'Every K-drama in our catalog', isPartOf: { '@id': SITE_URL + '/#website' }, publisher: { '@id': SITE_URL + '/#org' } },
      trail.node
    ]
  };
  return layout({ title: 'All K-dramas in our catalog | DramaRecs', description: 'Browse the K-drama catalog with pacing, emotional-load notes and regional streaming information. Review coverage varies by title.', canonical: SITE_URL + '/dramas/', body, jsonld, nav: 'browse' });
}

const PACE_WORD = (d) => PACE[Math.max(0, (d.pace || 3) - 1)];
const HEAVY_WORD = (d) => HEAVY[Math.max(0, (d.heavy || 3) - 1)];

function hubCard(d) {
  return `<a class="gitem gitem--hub" href="/dramas/${d.slug}/" style="--hue:${d.hue || 40}">${plate(d, { link: false })}
    <h3>${esc(d.title)}</h3>
    <p class="m tnum">${d.year} &middot; ${d.episodes} ep</p>
    <p class="hubmeta">${esc(PACE_WORD(d))} pace &middot; ${esc(HEAVY_WORD(d))}</p>
    ${d.hook >= 3 ? '<p class="hubflag">Slow start</p>' : ''}</a>`;
}

function pageHub(hub, entries, seeds) {
  const canonical = `${SITE_URL}/collections/${hub.slug}/`;
  const trail = crumbTrail([{ name: 'Home', path: '/' }, { name: 'Collections', path: '/collections/' }, { name: hub.h1, path: `/collections/${hub.slug}/` }]);
  const lastmod = entries.map((d) => d.verdictUpdated || d.reviewed).filter(Boolean).sort().pop() || null;
  const body = `
${trail.html}
<div class="wrap" style="padding-top:var(--s5)">
  <span class="eyebrow eyebrow--flare">${esc(hub.word)}</span>
  <h1 style="font-size:var(--t-2xl);letter-spacing:-.04em;margin-top:var(--s3)">${esc(hub.h1)}</h1>
  <p class="standfirst" style="max-width:62ch;margin-top:var(--s3)"><span class="hi tnum">${entries.length} titles</span>. ${esc(hub.standfirst)}</p>
  <p class="hubcrit">How this list is built: ${esc(hub.criterion)} Catalog attributes are editorial judgments; review coverage varies by title. <a href="/how-we-pick/">Our method</a>.</p>
  ${byline(lastmod, entries.length + ' titles')}
</div>
<section class="band"><div class="wrap">${/endings/.test(hub.slug) ? '<p class="spoilerwarning">Spoiler warning: membership in this collection reveals the type of ending.</p>' : ''}${entries.length ? '' : '<p>Availability is unconfirmed in this build. This does not mean Netflix carries no matching dramas. Check Netflix or JustWatch directly.</p>'}<div class="gridlist">${entries.map(hubCard).join('')}</div></div></section>
${adSlot(process.env.ADSENSE_SLOT_LIST_FOOT)}
${seeds.length ? `<div class="band band--rule"><div class="wrap">
  <div class="sechead"><h2>Full write-ups from this collection</h2><a class="more" href="/collections/">All collections &rarr;</a></div>
  <ul class="onlists">${seeds.slice(0, 12).map((d) => `<li><a href="/dramas-like/${d.slug}/">Dramas like ${esc(d.title)}</a><span class="pct tnum">${d.episodes} ep</span></li>`).join('')}</ul>
</div></div>` : ''}
<div class="wrap"><div class="note">
  <span class="eyebrow eyebrow--flare">Other moods</span>
  <div class="moods" style="margin-top:var(--s4)">${HUBS.filter((h) => h.slug !== hub.slug).slice(0, 8).map((h) => `<a class="mood" href="/collections/${h.slug}/"><span class="w">${esc(h.word)}</span><span class="l">${esc(h.line)}</span></a>`).join('')}</div>
</div></div>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', '@id': canonical, url: canonical, name: hub.h1, description: clip(hub.standfirst, 300),
        isPartOf: { '@id': SITE_URL + '/#website' }, author: { '@id': SITE_URL + '/#author' }, publisher: { '@id': SITE_URL + '/#org' },
        dateModified: lastmod || undefined,
        mainEntity: {
          '@type': 'ItemList', name: hub.h1, numberOfItems: entries.length,
          itemListElement: entries.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/dramas/${d.slug}/`, name: d.title }))
        }
      },
      PERSON_NODE(), ORG_NODE(), trail.node
    ]
  };
  return layout({
    title: hub.title + ' | DramaRecs', description: clip(hub.standfirst), canonical, body, jsonld, nav: hub.nav,
    ogImage: card(entries[0], hub.h1), ogType: 'article'
  });
}

function pageCollections(built) {
  const canonical = `${SITE_URL}/collections/`;
  const trail = crumbTrail([{ name: 'Home', path: '/' }, { name: 'Collections', path: '/collections/' }]);
  const body = `
${trail.html}
<div class="wrap" style="padding-top:var(--s5)">
  <span class="eyebrow eyebrow--flare">Start from a feeling</span>
  <h1 style="font-size:var(--t-2xl);letter-spacing:-.04em;margin-top:var(--s3)">Collections</h1>
  <p class="standfirst" style="max-width:62ch;margin-top:var(--s3)">Half the time you cannot name the show you want, you only know how you want the next few evenings to go. Pick the feeling. Every collection is built from attributes we set by hand, not from genre tags.</p>
</div>
<section class="band"><div class="wrap"><div class="moods">${built.map(({ hub, entries }) => `<a class="mood" href="/collections/${hub.slug}/"><span class="w">${esc(hub.word)}</span><span class="l">${esc(hub.line)}</span><span class="l tnum">${entries.length} titles</span></a>`).join('')}</div></div></section>
<div class="wrap"><div class="note">
  <p>Looking for something closer to a specific show instead? Start from the drama that wrecked you on <a href="/">the homepage</a>, or read <a href="/dramas/">every title in our catalog</a>.</p>
</div></div>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', '@id': canonical, url: canonical, name: 'K-drama collections by mood',
        isPartOf: { '@id': SITE_URL + '/#website' }, publisher: { '@id': SITE_URL + '/#org' },
        mainEntity: {
          '@type': 'ItemList', numberOfItems: built.length,
          itemListElement: built.map(({ hub }, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/collections/${hub.slug}/`, name: hub.h1 }))
        }
      },
      ORG_NODE(), trail.node
    ]
  };
  return layout({
    title: 'K-drama collections: slow burn, happy endings, short, feel-good | DramaRecs',
    description: 'Browse K-dramas by how you want to feel: slow burn, happy endings, twelve episodes or fewer, feel-good, or the ones that will wreck you.',
    canonical, body, jsonld, nav: 'moods'
  });
}

function pageProse({ slug, title, h1, description, html, nav = '', jsonld }) {
  const trail = crumbTrail([{ name: 'Home', path: '/' }, { name: h1, path: `/${slug}/` }]);
  const body = `${trail.html}
<div class="wrap wrap--prose prose"><h1>${esc(h1)}</h1>${html}</div>`;
  const graph = jsonld && jsonld['@graph'] ? [...jsonld['@graph'], trail.node] : (jsonld ? [jsonld, trail.node] : [trail.node]);
  return layout({ title: title + ' | DramaRecs', description, canonical: `${SITE_URL}/${slug}/`, body, nav, jsonld: { '@context': 'https://schema.org', '@graph': graph } });
}

/* ---------------- main ---------------- */
async function main() {
  const site = await readJson('data/site.json');
  if (site.country && REGION_LABEL[site.country]) DEFAULT_REGION = site.country;
  const raw = await readJson('data/dramas.json');
  const pageFiles = (await readdir('data/pages')).filter((f) => f.endsWith('.json'));
  const pages = [];
  for (const f of pageFiles) pages.push(await readJson(path.join('data/pages', f)));

  console.log(TOKEN ? 'TMDB token found. Enriching ' + raw.length + ' dramas...' : 'No TMDB_TOKEN set. Building with editorial data only.');
  const dramas = [];
  for (const d of raw) dramas.push(await enrich(d, site.country, raw));
  if (PRODUCTION) {
    const missing = dramas.filter(d => !d.poster);
    if (missing.length) console.warn('Poster diagnostics: ' + (dramas.length - missing.length) + '/' + dramas.length + ' covered; minimum ' + Math.ceil(dramas.length * .95) + '. Missing: ' + missing.map(d => d.slug).join(', '));
    assertProductionQuality(dramas, Object.values(lastGood));
  }

  const bySlug = Object.fromEntries(dramas.map((d) => [d.slug, d]));

  // Link every season of the same show to its siblings, ordered by season number.
  const groups = new Map();
  for (const d of dramas) if (d.seasonOf) {
    if (!groups.has(d.seasonOf)) groups.set(d.seasonOf, []);
    groups.get(d.seasonOf).push(d);
  }
  for (const [key, members] of groups) {
    members.sort((a, b) => (a.season || 0) - (b.season || 0));
    const stripItems = members.map((m) => ({ slug: m.slug, seasonLabel: m.seasonLabel || ('Season ' + m.season) }));
    const showTitle = bySlug[key]?.title || members[0].title;
    for (const m of members) { m.seasons = stripItems; m.seasonTitle = showTitle; }
  }

  /* ---- internal linking, computed once ---- */
  const seedSlugs = new Set(pages.map((p) => p.seed));
  for (const d of dramas) {
    d.hasLikePage = seedSlugs.has(d.slug);
    CATALOG_BY_TITLE.set(normTitle(d.title), d);
  }
  for (const page of pages) {
    const seed = bySlug[page.seed];
    for (const pk of page.picks) {
      if (!LISTS_BY_PICK.has(pk.slug)) LISTS_BY_PICK.set(pk.slug, []);
      LISTS_BY_PICK.get(pk.slug).push({ seed: page.seed, title: seed ? seed.title : page.seed, match: pk.match });
    }
  }
  for (const rows of LISTS_BY_PICK.values()) rows.sort((a, b) => b.match - a.match || a.title.localeCompare(b.title));
  /* Two lists that share picks are adjacent taste, so they are worth reading in sequence.
     Cross-picking each other's seed counts double, which is the strongest overlap signal there
     is, and the sort means the closest lists are the ones a reader sees. */
  const pickSets = new Map(pages.map((p) => [p.seed, new Set(p.picks.map((x) => x.slug))]));
  for (const page of pages) {
    RELATED_LISTS.set(page.seed, relatedLists(page, pages).map(r => ({...r,drama:bySlug[r.slug]})).filter(r=>r.drama));
  }

  await writeFile(CACHE, JSON.stringify(cache));

  await mkdir(path.join(OUT, 'assets'), { recursive: true });
  await copyFile('src/styles.css', path.join(OUT, 'assets/styles.css'));
  await copyFile('src/app.js', path.join(OUT, 'assets/app.js'));
  await copyFile('src/core.js', path.join(OUT, 'assets/core.js'));
  await copyFile('src/editor.svg', path.join(OUT, 'assets/editor.svg'));
  await copyFile('src/favicon.svg', path.join(OUT, 'assets/favicon.svg'));
  await copyFile('src/favicon-32.png', path.join(OUT, 'assets/favicon-32.png'));
  await copyFile('src/apple-touch-icon.png', path.join(OUT, 'assets/apple-touch-icon.png'));
  await copyFile('src/og-default.png', path.join(OUT, 'assets/og-default.png'));
  await mkdir(path.join(OUT, 'assets/fonts'), { recursive: true });
  for (const f of await readdir('src/fonts')) await copyFile(path.join('src/fonts', f), path.join(OUT, 'assets/fonts', f));

  const write = async (dir, html) => {
    const full = dir === '' ? OUT : path.join(OUT, dir);
    await mkdir(full, { recursive: true });
    await writeFile(path.join(full, 'index.html'), html);
  };

  const urls = [];
  let noindexed = 0;

  /* Collections are generated from data that already exists, so they cost nothing to keep
     current. A collection with fewer than HUB_MIN entries is skipped rather than shipped thin. */
  const built = [];
  for (const hub of HUBS) {
    const entries = dramas.filter((d) => hasVerdict(d) && hub.where(d)).sort(hub.sort || ((a, b) => a.title.localeCompare(b.title)));
    if (entries.length < HUB_MIN && hub.slug !== 'best-k-dramas-on-netflix') { console.warn('  ! collection ' + hub.slug + ' skipped, only ' + entries.length + ' entries'); continue; }
    built.push({ hub, entries });
  }

  await write('', pageHome(site, dramas, pages, built));
  urls.push({ loc: SITE_URL + '/' });

  await write('dramas', pageBrowse(dramas, pages, built));
  urls.push({ loc: SITE_URL + '/dramas/' });

  if (built.length) {
    await write('collections', pageCollections(built));
    urls.push({ loc: SITE_URL + '/collections/' });
    for (const { hub, entries } of built) {
      const seeds = entries.filter((d) => seedSlugs.has(d.slug));
      await write(path.join('collections', hub.slug), pageHub(hub, entries, seeds));
      const lastmod = entries.map((d) => d.verdictUpdated || d.reviewed).filter(Boolean).sort().pop();
      urls.push({ loc: `${SITE_URL}/collections/${hub.slug}/`, lastmod });
    }
  }

  for (const page of pages) {
    const seed = bySlug[page.seed];
    if (!seed) { console.warn('  ! page ' + page.seed + ' has no drama entry, skipped'); continue; }
    const picks = page.picks.map((p) => ({ ...p, drama: bySlug[p.slug] })).filter((p) => p.drama);
    if (picks.length !== page.picks.length) console.warn('  ! some picks in ' + page.seed + ' are missing from data/dramas.json');
    await write(path.join('dramas-like', page.seed), pageLike(page, seed, picks, RELATED_LISTS.get(page.seed) || []));
    urls.push({ loc: `${SITE_URL}/dramas-like/${page.seed}/`, lastmod: page.reviewed });
  }

  for (const d of dramas) {
    const alsoLike = secondaryPicks(d.slug, pages).map(p=>({...bySlug[p.slug],reason:p.reason})).filter(p=>p.slug);
    await write(path.join('dramas', d.slug), pageDetail(d, seedSlugs.has(d.slug), alsoLike, LISTS_BY_PICK.get(d.slug) || []));
    // Verdict-less pages stay crawlable but out of the sitemap. They join it when a verdict lands.
    if (hasVerdict(d)) urls.push({ loc: `${SITE_URL}/dramas/${d.slug}/`, lastmod: d.verdictUpdated || d.reviewed });
    else noindexed++;
  }

  /* Search used to be one indexOf against title plus native plus query, so "CLOY", "Ajusshi"
     and any typo returned nothing. n is the normalised title, a is every other string worth
     typing: MDL alternate titles, the Hangul, the search query, and the initials of the title. */
  const initials = (t) => { const w = String(t).split(/\s+/).filter(Boolean); return w.length >= 3 ? w.map((x) => x[0]).join('') : ''; };
  const searchIndex = dramas.map((d) => ({
    slug: d.slug, t: d.title, y: d.year,
    ep: d.episodes, pa: d.pace, he: d.heavy, ro: d.romance, co: d.comfort, en: d.ending,
    n: searchKey(d.title),
    a: [...(d.aliases || []), d.native, d.query, initials(d.title)].filter(Boolean).map(searchKey).filter((v, i, arr) => v && v !== searchKey(d.title) && arr.indexOf(v) === i).join('|'),
    page: seedSlugs.has(d.slug) ? 1 : 0, img: d.poster, hue: d.hue || 40
  }));
  await writeFile(path.join(OUT, 'assets/search.json'), JSON.stringify(searchIndex));

  for (const p of PROSE) { await write(p.slug, pageProse(p)); urls.push({ loc: `${SITE_URL}/${p.slug}/`, lastmod: p.updated }); }

  await write('my-shelf', layout({
    title: 'Your shelf | DramaRecs', description: 'Everything you saved, stored on your own device.',
    canonical: SITE_URL + '/my-shelf/', nav: 'shelf', robots: 'noindex,follow',
    body: `<div class="wrap crumbs"><a href="/">Home</a> / <span>Your shelf</span></div>
<div class="wrap" style="padding-top:var(--s6)"><h1 style="font-size:clamp(2rem,4.4vw,3rem)">Your shelf</h1>
<p class="standfirst" style="color:var(--ink-2);margin-top:var(--s3);max-width:56ch">Saved on this device only. Clear your browser and it goes with it.</p></div>
<div class="wrap shelfbar"><button class="btn btn--ghost" type="button" id="shelfshare">Copy a link to this shelf</button><span class="hint" style="margin:0">Your shelf lives on this device. Anyone with the link can see the titles. Sharing does not include watched history.</span></div>
<noscript><p class="wrap">Your shelf needs JavaScript to read saved titles from this browser. You can still <a href="/dramas/">browse dramas</a>.</p></noscript><section class="wrap" id="shelfmount"><div class="gridlist" aria-hidden="true"><div><div class="sk sk--plate"></div><div class="sk sk--line" style="margin-top:12px;width:80%"></div><div class="sk sk--line" style="width:40%"></div></div><div><div class="sk sk--plate"></div><div class="sk sk--line" style="margin-top:12px;width:80%"></div><div class="sk sk--line" style="width:40%"></div></div><div><div class="sk sk--plate"></div><div class="sk sk--line" style="margin-top:12px;width:80%"></div><div class="sk sk--line" style="width:40%"></div></div><div><div class="sk sk--plate"></div><div class="sk sk--line" style="margin-top:12px;width:80%"></div><div class="sk sk--line" style="width:40%"></div></div><div><div class="sk sk--plate"></div><div class="sk sk--line" style="margin-top:12px;width:80%"></div><div class="sk sk--line" style="width:40%"></div></div><div><div class="sk sk--plate"></div><div class="sk sk--line" style="margin-top:12px;width:80%"></div><div class="sk sk--line" style="width:40%"></div></div></div></section>`
  }));

  await write('404', layout({
    title: 'Page not found | DramaRecs', description: 'That page does not exist.', canonical: SITE_URL + '/404/', robots: 'noindex,follow',
    body: `<div class="wrap empty" style="padding-top:var(--s8)"><span class="eyebrow">404</span><h2 style="margin-top:var(--s3);font-size:2rem">That page does not exist.</h2><p>It may not be written yet. Search for the drama instead.</p><div class="actions"><a class="btn-solid" href="/">Back to search</a><a class="btn-ghost" href="/dramas/">Browse all dramas</a></div></div>`
  }));

  await copyFile(path.join(OUT, '404/index.html'), path.join(OUT, '404.html'));

  /* ads.txt (teardown 1.6). There is nothing to declare until AdSense issues a publisher id, and
     an ads.txt naming no publisher is worse than none at all. Set ADSENSE_CLIENT in Vercel on the
     day you are approved and the next deploy writes the file. No code change needed. */
  const pubId = (ADSENSE.match(/pub-\d+/) || [])[0];
  if (pubId) await writeFile(path.join(OUT, 'ads.txt'), `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`);
  else await rm(path.join(OUT, 'ads.txt'), { force: true });

  /* RSS (teardown 15). Every visitor arrived from Google, read one page and never came back,
     because there was no way to follow the site at all. Fifteen lines, no account, no email
     list to run, and it gets the site into readers and aggregators. */
  const xesc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const feedItems = [
    ...pages.filter((pg) => bySlug[pg.seed]).map((pg) => ({
      title: 'Dramas like ' + bySlug[pg.seed].title,
      link: `${SITE_URL}/dramas-like/${pg.seed}/`,
      date: pg.reviewed,
      desc: clip(pg.standfirst, 300)
    })),
    ...dramas.filter((d) => hasVerdict(d) && (d.verdictUpdated || d.reviewed)).map((d) => ({
      title: d.title + ' (' + d.year + '): is it worth watching',
      link: `${SITE_URL}/dramas/${d.slug}/`,
      date: d.verdictUpdated || d.reviewed,
      desc: clip(d.verdict, 300)
    }))
  ].filter((it) => it.date).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 40);
  await writeFile(path.join(OUT, 'feed.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n<channel>\n` +
    `<title>DramaRecs: new and revised K-drama lists</title>\n<link>${SITE_URL}/</link>\n` +
    `<description>Curated K-drama recommendations, with the reason spelled out. One entry per new or revised page.</description>\n` +
    `<language>en</language>\n<atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>\n` +
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n` +
    feedItems.map((it) => `<item>\n<title>${xesc(it.title)}</title>\n<link>${it.link}</link>\n<guid isPermaLink="true">${it.link}</guid>\n<pubDate>${new Date(it.date + 'T09:00:00Z').toUTCString()}</pubDate>\n<description>${xesc(it.desc)}</description>\n</item>`).join('\n') +
    `\n</channel>\n</rss>\n`);

  await writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  const today = new Date().toISOString().slice(0, 10);
  // lastmod is the date the page's own writing last changed, never the build date. A build date on
  // every URL teaches Google to ignore lastmod, which loses the one signal that gets a fix recrawled.
  await writeFile(path.join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${/^\d{4}-\d{2}-\d{2}$/.test(u.lastmod || '') ? u.lastmod : today}</lastmod></url>`).join('\n') +
    `\n</urlset>\n`);

  console.log(`\nBuilt ${urls.length + noindexed} pages into /${OUT}`);
  console.log(`  ${pages.length} similar-dramas pages, ${dramas.length} drama pages, ${built.length} collections`);
  console.log(`  feed.xml: ${feedItems.length} items`);
  console.log(`  ${urls.length} in sitemap.xml, ${noindexed} drama pages noindex,follow (no verdict yet)`);
  const reverse = [...LISTS_BY_PICK.values()].reduce((n, r) => n + Math.min(r.length, 12), 0);
  const chained = pages.reduce((n, p) => n + p.picks.filter((x) => seedSlugs.has(x.slug)).length, 0);
  const hosted = pages.reduce((n, p) => n + (p.against || []).filter((a) => CATALOG_BY_TITLE.has(normTitle(a.title))).length, 0);
  console.log(`  internal links added: ${reverse} reverse, ${chained} list-to-list, ${hosted} anti-picks linked to pages we host`);
  console.log(pubId ? `  ads.txt written for ${pubId}` : '  no ads.txt (set ADSENSE_CLIENT once AdSense approves you)');
  /* Print which brands are monetised on every build, because "did the env var actually land in
     Vercel" is otherwise invisible until someone checks a link by hand. */
  const paidBrands = AFF_BRANDS.filter((b) => (WATCH_TABLE[b].r ? WATCH_TABLE[b].r[DEFAULT_REGION] : WATCH_TABLE[b]).s === 1);
  console.log(AFF_LIVE
    ? `  affiliate live: ${paidBrands.join(', ')} (disclosure on, rel=sponsored on those links)`
    : '  no affiliate ids set: watch links ship plain, no disclosure printed');
  const noPoster = dramas.filter((d) => !d.poster).length;
  if (noPoster) console.log(`  ${noPoster} dramas have no poster (TMDB unavailable or unmatched)`);
  if (TOKEN && dramas.some(d=>d.poster)) await writeFile('data/metadata-snapshot.json', JSON.stringify(Object.fromEntries(dramas.map(d=>[d.slug,d])),null,2));
}

/* ---------------- editorial pages ----------------
   Plain HTML. Edit the wording freely, keep the tags.
---------------------------------------------------*/
const PROSE = [
{
  slug: 'how-we-pick', nav: 'method', updated: '2026-09-06',
  title: 'How we pick', h1: 'How we pick',
  description: 'Editorial recommendations, shared qualities, differences, sources and review limits.',
  html: `<p>DramaRecs publishes a curated catalog, not recommendations generated on request. A useful recommendation explains both what connects two dramas and what might disappoint you.</p>
<h2>Editorial judgments, not probabilities</h2><p>Pace, romance, emotional load and comfort are editorial descriptions. List order is a recommendation, not a measured percentage of how much you will enjoy something.</p>
<h2>Research and review scope</h2><p>The existing catalog was produced with research and editorial writing, including AI-assisted drafts. Researching a title is not the same as personally watching its entire run. Historical review dates do not certify a fresh full-series fact check. A title-by-title provenance and spoiler audit is still in progress.</p>
<h2>Different readers want different things</h2><p>Read the main difference as carefully as the shared quality. Negative comparisons describe a mismatch with the feeling a list is seeking, not a universal reason to avoid a drama.</p>
<h2>Endings</h2><p>Ending buttons start hidden and can be revealed and hidden again. You can opt in to tone labels. Legacy review prose is still being audited and may discuss endings; expandable comparisons are labeled accordingly. Collections explicitly about endings reveal their category by definition.</p>
<h2>Metadata and streaming</h2><p>TMDB supplies metadata and posters, and JustWatch supplies availability through TMDB. Editorial episode counts take precedence. Ambiguous identity matches are not resolved by taking the first search result. Availability can be missing or stale, so confirm with the provider before subscribing.</p>
<h2>Corrections</h2><p>Use <a href="/contact/">the contact page</a> to flag an error. Source URLs for checked corrections are retained in the repository. No advertising or affiliate commission changes the recommendation order.</p>`
},
{
  slug: 'about', updated: '2026-09-03',
  title: 'About', h1: 'About DramaRecs',
  description: 'DramaRecs is written and edited by one person who has spent years hunting down good stories nobody talks about.',
  jsonld: {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'AboutPage', '@id': SITE_URL + '/about/', url: SITE_URL + '/about/', name: 'About DramaRecs', about: { '@id': SITE_URL + '/#org' }, mainEntity: { '@id': SITE_URL + '/#author' } },
      { '@type': 'Organization', '@id': SITE_URL + '/#org', name: 'DramaRecs', url: SITE_URL + '/', founder: { '@id': SITE_URL + '/#author' } },
      { '@type': 'Person', '@id': SITE_URL + '/#author', name: AUTHOR.name, url: SITE_URL + '/about/', image: SITE_URL + AUTHOR.image, jobTitle: AUTHOR.role, worksFor: { '@id': SITE_URL + '/#org' }, knowsAbout: ['Korean drama', 'Asian drama', 'romantic comedy film', 'film criticism'] }
    ]
  },
  html: `
<div class="authorcard">
  <img src="${AUTHOR.image}" alt="DramaRecs editor's mark" width="96" height="96" loading="lazy">
  <div>
    <span class="eyebrow">Written and edited by</span>
    <p class="an">${esc(AUTHOR.name)}</p>
    <p class="ar">Watching, tracking and arguing about drama since I was nine. One rule: no pick ships without a reason you can check.</p>
  </div>
</div>
<p>DramaRecs exists because of a specific, familiar problem: you finish something like <em>My Liberation Notes</em>, you feel slightly hollow, and you want another one. So you search for dramas like it and get a listicle written by someone who has clearly watched none of them.</p>
<h2>Who writes this</h2>
<p>I do. One person, working through the catalogue in the order people actually search for it. Not a content agency and not a rotating pool of freelancers. I have been watching obsessively since I was nine, every page here is read and edited by me before it publishes, and nothing goes out carrying a judgement I am not willing to put my name on.</p>
<p>That is a real limit and it shows in the numbers: there is no honest way to cover thousands of titles quickly, so this site grows slowly and gets revisited instead of expanded.</p>
<h2>Where this comes from</h2>
<p>It started with old Hollywood. I spent my early teens working through romantic comedies my own generation had written off, and a lot of them were better than their reputation. Half the work back then was just finding them: out of print, unlisted, or sitting on a service nobody thought to check. I got good at tracking down where a film was actually available, and that habit is the reason every page here tells you where to watch the thing instead of only telling you to. The catalogue changed. The instinct has not.</p>
<p>After that: hundreds of films across every genre, the long American series everyone has seen, Korean cinema, then C-dramas, and now Korean television, which is in the middle of the best run it has ever had.</p>
<h2>What I am actually good at</h2>
<p>Two things.</p>
<p>The first is spotting the good story nobody is talking about. The pattern repeats everywhere: a film written off on release turns out to be the warmest thing in its year, a series arrives with no marketing and quietly outclasses the one everyone watched. Korean drama does it constantly, where a show with twenty thousand ratings is often better written than the one with two hundred thousand, and finding those is the most useful thing this site does.</p>
<p>The second is telling you when something is wrong. A recommendation that only ever says yes is worth nothing. Every page here carries picks I argue against, including the popular ones, and where a show falls apart in its back half I say so and name the episode.</p>
<h2>What this site is not</h2>
<p>Not a database. TMDB and MyDramaList already do that better. Not a review site either. The single job here is the handoff: you loved that, so watch this, and here is exactly why the two connect.</p>
<h2>How it stays free</h2>
<p>Advertising is planned but disabled in this repair release. There are no paywalls and no accounts. Nobody pays for placement and no streaming service has any say in the picks. Your shelf is stored in your own browser, not on our servers.</p>
<h2>What is coming</h2>
<p>The <a href="/collections/">mood collections</a> are live now, for the nights you cannot name a show and only know how you want to feel: quiet and slow, ends kindly, nothing heavy, twelve episodes or fewer. Next: pages for actors and for the couples people actually search for, then Chinese and Japanese dramas once the Korean catalogue is solid.</p>
<h2>Talk to me</h2>
<p>Corrections, arguments and requests all go to the same place: <a href="/contact/">the contact page</a>. If a pick is wrong, say so and say why, and the page gets fixed and re-dated. Requests for specific titles genuinely do move up the queue.</p>`
}
];

/* The policy used to open the advertising section with "There are no advertisements on this site
   today" as hardcoded prose. The day ADSENSE_CLIENT is set in Vercel, that sentence would have
   been a lie printed on the same page as a live ad unit. Both the wording and the date on this
   page are now driven by the same flag the ad script is, so they can never disagree. */
const ADS_LIVE = Boolean(ADSENSE);
/* Affiliate links are a money disclosure on the same page, so they move this date the same way ads
   do. Whichever switch flips first re-dates the policy, and the wording below follows the flags. */
const PRIVACY_UPDATED = (ADS_LIVE || AFF_LIVE)
  ? (ADS_LIVE_DATE || AFF_LIVE_DATE || new Date().toISOString().slice(0, 10))
  : '2026-09-06';

PROSE.push(
{
  slug: 'privacy', updated: PRIVACY_UPDATED,
  title: 'Privacy policy', h1: 'Privacy policy',
  description: 'What DramaRecs collects, what it does not, and how advertising cookies work.',
  html: `
<p class="eyebrow">Last updated ${esc(humanDate(PRIVACY_UPDATED))}</p>
<h2>The short version</h2>
<p>No account is required. Saved and watched lists stay in your browser by default. Hosting providers can process technical request information, including IP addresses, and contacting us discloses what you send. This is not a promise of anonymity.</p>
<h2>What is stored on your device</h2>
<p>Saved titles, watched titles, the hide-watched filter and ending-tone preference use browser local storage (dr.state.v1). Your older sd.shelf list is retained during migration. Region uses sd.region. These reading preferences are separate from advertising consent. Clear site data to remove both old and new records. If storage is blocked, changes last only for the current page session. The site has no recovery service.</p><p>A shared shelf URL includes saved title identifiers in its fragment. Anyone receiving that link can read and forward them. Shared links do not include watched history. The site does not send these lists to an analytics service.</p>
<h2>Analytics</h2>
<p>Google Analytics and product-event tracking are disabled in this repair release, including when an analytics environment variable is present. Hosting access logs are separate: the host may process IP addresses, request paths, timestamps and device information to deliver and secure the site.</p><h2>Contact and retention</h2><p>If you email us, your email provider and ours process your address and message. Messages may be retained to respond and track corrections. Contact us to request deletion; provider backups or legally required records may persist. Browser preferences remain until you clear them. Hosting log retention is governed by the hosting provider configuration and policy; a specific retention period has not yet been verified.</p>
<h2>Advertising</h2>
${ADS_LIVE ? `<p>This site carries advertising served by Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on a reader&rsquo;s prior visits to this and other websites. Google use of advertising cookies enables it and its partners to serve ads based on a visit to this site and other sites on the internet. You can opt out of personalised advertising at <a href="https://www.google.com/settings/ads" rel="noopener nofollow">Google Ads Settings</a>, or opt out of third-party vendor cookies at <a href="https://www.aboutads.info/choices/" rel="noopener nofollow">aboutads.info</a>.</p>
<p>Readers in the EEA, the UK and Switzerland are shown a consent prompt from a Google-certified consent management platform before any personalised advertising cookies are set. Nothing personalised is set until you choose. You can change or withdraw that choice at any time using <b>Cookie choices</b> at the bottom of any page.</p>` : `<p>There are no advertisements on this site today, and no advertising cookies are set. This section describes what will happen when advertising is introduced, so that the policy is in place before anything changes. The wording and the date at the top of this page are generated from the same setting that switches the ads on, so they change on the same day the ads do.</p>
<p>Advertising, when it arrives, will be served by Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on a reader&rsquo;s prior visits to this and other websites. You will be able to opt out of personalised advertising at <a href="https://www.google.com/settings/ads" rel="noopener nofollow">Google Ads Settings</a>, or opt out of third-party vendor cookies at <a href="https://www.aboutads.info/choices/" rel="noopener nofollow">aboutads.info</a>.</p>
<p>Before personalised advertising cookies are set for readers in the EEA, the UK or Switzerland, a consent prompt from a Google-certified consent management platform will be shown, and that choice will be changeable or withdrawable at any time from a link in the footer.</p>`}
<h2>Affiliate links</h2>
${AFF_LIVE ? `<p>Some of the links in the <b>where to watch</b> rows are affiliate links, currently ${esc(andList(PAID_BRANDS))}. If you follow one and subscribe, DramaRecs may be paid a commission by that service. You pay nothing extra, and the price you see is the price everyone sees.</p>
<p>Following one of those links means the service, and the network that handles the link, may set a cookie in your browser to attribute the visit. That happens on their site, not this one, and it is governed by their privacy policy rather than ours. We are told totals only: how many clicks and how many sign-ups. We are never told who you are, and we cannot connect a click back to a person or to anything else on this site.</p>
<p><b>Commission never buys a recommendation.</b> Every pick, every match score and every list position is written and fixed before a streaming row is built, and no service can pay to appear, to move up a list, or to change a score.${FREE_BRANDS.length ? ` Links to ${esc(andList(FREE_BRANDS))} pay us nothing whatsoever and are treated exactly the same as the ones that do.` : ''} The links that do pay are marked <code>rel="sponsored"</code> in the page source, which is the machine-readable version of this paragraph.</p>` : `<p>There are no affiliate links on this site today. The links in the <b>where to watch</b> rows go straight to the streaming service or to TMDB and earn us nothing. This section describes what will happen if that changes, so the policy is in place first, and the wording here is generated from the same setting that would switch the links on.</p>
<p>If affiliate links are introduced, they will be disclosed in the footer of every page and beside the rows themselves, links that pay will carry <code>rel="sponsored"</code>, and the rule will be the one that already applies to advertising: no service can pay to appear, to move up a list, or to change a score.</p>`}
<h2>Third-party data</h2>
<p>Drama metadata, posters and streaming availability come from the TMDB API. Poster images load from TMDB image servers, which means TMDB receives a standard web request from your browser when a page loads.</p>
<h2>Children</h2>
<p>This site is not directed at children under 13 and we do not knowingly collect any information from them.</p>
<h2>Changes</h2>
<p>If this policy changes, the date at the top changes with it. Questions go to <a href="/contact/">our contact page</a>.</p>`
},
{
  slug: 'terms', updated: '2026-08-22',
  title: 'Terms of use', h1: 'Terms of use',
  description: 'The terms covering use of DramaRecs.',
  html: `
<p class="eyebrow">Last updated 22 August 2026</p>
<h2>Use of the site</h2>
<p>DramaRecs is free to read for personal use. You are welcome to quote or link to a page with attribution. You may not scrape the site wholesale, republish our written recommendations as your own, or use them to train a commercial model.</p>
<h2>Opinions, not facts</h2>
<p>Every recommendation is a judgement call. Pacing, emotional weight and ending labels are subjective, and you may reasonably disagree. Nothing here is a guarantee that you will enjoy a given drama.</p>
<h2>Accuracy of streaming information</h2>
<p>Streaming availability is pulled from TMDB and changes without notice. Always check the service before assuming a title is there. We are not responsible for a subscription bought on the strength of an out-of-date row.</p>
<h2>Spoilers</h2>
<p>Ending labels and ending-detail buttons require an explicit reveal, except in ending-themed collections where membership discloses the ending tone. Legacy review prose may contain spoilers; a full spoiler audit remains incomplete.</p>
<h2>External links</h2>
<p>We link to streaming services, TMDB and other sites. We do not control them and are not responsible for their content or their terms.</p>
${AFF_LIVE ? `<p>Some of those links to streaming services are affiliate links, and DramaRecs may earn a commission if you subscribe through one. It costs you nothing and it does not affect what we recommend or how we rank it. The <a href="/privacy/">privacy policy</a> explains how it works.</p>` : ''}
<h2>Attribution</h2>
<p>This product uses the TMDB API but is not endorsed or certified by TMDB. Poster images and metadata remain the property of their respective owners.</p>
<h2>Liability</h2>
<p>The site is provided as it is, without warranties. We are not liable for any loss arising from your use of it, including time lost to a drama you did not like.</p>`
},
{
  slug: 'contact', updated: '2026-09-03',
  title: 'Contact', h1: 'Contact',
  description: 'Request a page, correct a mistake, or argue with a recommendation.',
  html: `
<p>One person reads everything that comes in, so replies are not instant, but they do happen.</p>
<h2>Email</h2>
<p><a href="mailto:hello@dramarecs.com">hello@dramarecs.com</a></p>
<h2>Worth writing about</h2>
<ul>
  <li><b>Request a page.</b> Name the drama you just finished. Requests genuinely reorder the queue, and the most-asked titles get written first.</li>
  <li><b>Correct a pick.</b> If a recommendation does not hold up, say which one and what it gets wrong. Pages get revised and re-dated.</li>
  <li><b>Fix streaming information.</b> Rights move constantly. Tell us the title, your country, and what is actually true.</li>
  <li><b>Flag a spoiler.</b> If a page gives away more than it should, that is a bug and it gets fixed the same week.</li>
</ul>
<h2>Not worth writing about</h2>
<p>Paid placement, guest posts, and link exchanges. Recommendations are not for sale and never will be, which is the only reason this site is worth reading.</p>`
}
);

main().catch((err) => { console.error(err); process.exit(1); });
