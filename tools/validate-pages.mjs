#!/usr/bin/env node
/**
 * validate-pages.mjs
 * Run from the repo root:  node tools/validate-pages.mjs
 *
 * Checks every file in data/pages/ against the house rules before you commit,
 * so a broken page never reaches Vercel:
 *   - the seed exists in data/dramas.json
 *   - every pick slug exists in data/dramas.json
 *   - 5 to 7 picks, 3 anti-picks
 *   - match scores strictly descending, none above 96
 *   - no em dashes or en dashes anywhere
 *   - no banned AI filler words
 *   - critic voice: no sourced opinions ("viewers say", "every thread", "fans describe")
 *   - never two seasons of the same show as picks on one page
 *   - catalog blurbs obey the same voice, dash and filler rules as the pages do
 *   - season entries carry their own label, meters, hook, ending and verdict
 *   - no duplicate picks, no pick that is also the seed
 *   - a pick is never also listed in that page's `against`
 *   - reciprocity warning: if page A picks B, B should not anti-pick A
 * Exits 1 on any error. Warnings do not fail the run.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";

// Reported voice. The research happens upstream of the writing, not inside it.
// A critic writes "the pacing drags", never "viewers say the pacing drags". See VOICE.md.
const ATTRIBUTION = [
  "viewers", "fans ", "fans,", "fans.", "fandom", "the audience", "reddit", "subreddit",
  "in threads", "every thread", "threads are", "the threads", "thread about", "in a thread",
  "in these threads", "commenters", "reviewers", "mydramalist", "the internet", "regulars call", "regulars make", "regulars say", "regulars reach", "regulars admit", "regulars tell", "regulars still", "plenty of regulars",
  "most people", "a lot of people", "many people", "some people", "people will tell you", "people are saying",
  "people describe", "people call", "people report", "people complain", "everyone says",
  "everyone names", "routinely", "widely described", "often described", "commonly described",
  "is said to", "reportedly", "the consensus", "critics have", "critics say",
  "is praised for", "is criticised for", "is criticized for", "the complaint", "complaints",
  "is often called", "is widely considered", "is generally considered", "named constantly",
  "most-repeated", "the crowd"
];

const BANNED = ["masterpiece","tapestry","rollercoaster","delves into","delve into","testament to","seamlessly","captivating","navigates","poignant reminder","a must-watch","in today's fast-paced"];
const SEASON_OWN = ["pace","romance","heavy","comfort","hook","hookNote","ending","endingText","verdict"];
const DASHES = /[\u2014\u2013]/;

if (!existsSync("data/dramas.json")) { console.error("Run this from the repo root."); process.exit(1); }
const catalog = new Set(JSON.parse(readFileSync("data/dramas.json","utf8")).map(d => d.slug));
const files = readdirSync("data/pages").filter(f => f.endsWith(".json")).sort();
const rawCatalog = JSON.parse(readFileSync("data/dramas.json","utf8"));
const titles = new Map(rawCatalog.map(d => [d.slug, d.title]));
const catalogTitle = (slug) => titles.get(slug);
const seasonOf = new Map(rawCatalog.filter(d => d.seasonOf).map(d => [d.slug, d.seasonOf]));

const errors = [], warnings = [];
const pagesBySeed = new Map();

for (const file of files) {
  const path = `data/pages/${file}`;
  let page;
  try { page = JSON.parse(readFileSync(path,"utf8")); }
  catch (e) { errors.push(`${file}: invalid JSON (${e.message})`); continue; }
  pagesBySeed.set(page.seed, page);

  const expected = file.replace(/\.json$/, "");
  if (page.seed !== expected) errors.push(`${file}: seed "${page.seed}" does not match filename`);
  if (!catalog.has(page.seed)) errors.push(`${file}: seed "${page.seed}" is not in dramas.json`);

  const picks = page.picks || [];
  if (picks.length < 5 || picks.length > 7) errors.push(`${file}: ${picks.length} picks (need 5 to 7)`);
  if ((page.against || []).length !== 3) errors.push(`${file}: ${(page.against||[]).length} anti-picks (need exactly 3)`);
  if (!page.standfirst || page.standfirst.length < 120) warnings.push(`${file}: standfirst is short`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(page.reviewed || "")) errors.push(`${file}: missing or malformed "reviewed" date`);

  const seen = new Set();
  let last = Infinity;
  const againstTitles = new Set((page.against || []).map(a => (a.title || "").toLowerCase()));

  picks.forEach((p, i) => {
    if (!catalog.has(p.slug)) errors.push(`${file}: pick "${p.slug}" is NOT in dramas.json`);
    if (seen.has(p.slug)) errors.push(`${file}: duplicate pick "${p.slug}"`);
    seen.add(p.slug);
    if (p.slug === page.seed) errors.push(`${file}: pick "${p.slug}" is the seed itself`);
    if (typeof p.match !== "number") errors.push(`${file}: pick ${i+1} has no numeric match`);
    else {
      if (p.match > 96) errors.push(`${file}: pick "${p.slug}" match ${p.match} exceeds 96`);
      if (p.match >= last) errors.push(`${file}: match order breaks at "${p.slug}" (${p.match} after ${last})`);
      last = p.match;
    }
    if (!p.why || p.why.length < 120) warnings.push(`${file}: "${p.slug}" why is thin (${(p.why||"").length} chars)`);
    if (!/difference:/i.test(p.why || "")) warnings.push(`${file}: "${p.slug}" has no explicit honest difference`);
    const bad = (p.why || "").match(/<(?!\/?(b|i|em|strong)\b)[^>]+>/g);
    if (bad) errors.push(`${file}: "${p.slug}" uses disallowed HTML ${[...new Set(bad)].join(" ")}`);
  });

  for (const slug of seen) {
    const t = (catalogTitle(slug) || "").toLowerCase();
    if (t && againstTitles.has(t)) errors.push(`${file}: "${slug}" is both a pick and an anti-pick`);
  }

  // Critic voice. Checked on the prose fields only, so an ending label such as
  // "May divide viewers" over in dramas.json never trips it by accident.
  const prose = [["standfirst", page.standfirst || ""]]
    .concat(picks.map(p => [`pick "${p.slug}"`, p.why || ""]))
    .concat((page.against || []).map(a => [`anti-pick "${a.title}"`, a.why || ""]));
  for (const [where, text] of prose) {
    const low = text.toLowerCase();
    for (const phrase of ATTRIBUTION) {
      if (low.includes(phrase)) errors.push(`${file}: ${where} sources the opinion ("${phrase.trim()}"). State it flat, as ours.`);
    }
  }

  // Never stack two seasons of the same show on one page.
  const groups = new Map();
  for (const p of picks) {
    const g = seasonOf.get(p.slug);
    if (!g) continue;
    if (groups.has(g)) errors.push(`${file}: picks "${groups.get(g)}" and "${p.slug}" are two seasons of the same show`);
    else groups.set(g, p.slug);
  }

  const blob = JSON.stringify(page);
  if (DASHES.test(blob)) errors.push(`${file}: contains an em dash or en dash`);
  for (const w of BANNED) {
    if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(blob)) errors.push(`${file}: banned phrase "${w}"`);
  }
}

// The same voice rule applies to catalog prose, plus the dash and filler rules that
// pages already get. Only free-text fields are checked, so the "May divide viewers"
// ending label is never flagged.
const PROSE_FIELDS = ["endingText", "hookNote", "verdict"];
for (const d of rawCatalog) {
  for (const field of PROSE_FIELDS) {
    const text = d[field] || "";
    const low = text.toLowerCase();
    for (const phrase of ATTRIBUTION) {
      if (low.includes(phrase)) errors.push(`dramas.json: ${d.slug} ${field} sources the opinion ("${phrase.trim()}"). State it flat, as ours.`);
    }
    if (DASHES.test(text)) errors.push(`dramas.json: ${d.slug} ${field} contains an em dash or en dash`);
    for (const w of BANNED) {
      if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(text)) errors.push(`dramas.json: ${d.slug} ${field} uses banned phrase "${w}"`);
    }
  }
  if (d.verdict && d.verdict.length < 200) warnings.push(`dramas.json: ${d.slug} verdict is thin (${d.verdict.length} chars, want 3 to 5 sentences)`);
  if (d.season && !d.seasonOf) errors.push(`dramas.json: ${d.slug} has "season" but no "seasonOf" group`);
  if (d.seasonOf && !d.season) errors.push(`dramas.json: ${d.slug} has "seasonOf" but no "season" number`);
  if (d.seasonOf && !rawCatalog.some(x => x.slug === d.seasonOf)) errors.push(`dramas.json: ${d.slug} points seasonOf at "${d.seasonOf}", which is not in the catalog`);
  if (d.season && !d.seasonLabel) errors.push(`dramas.json: ${d.slug} is a season entry with no "seasonLabel" for the switcher`);
  if (d.season > 1) {
    if (!d.seriesYear) warnings.push(`dramas.json: ${d.slug} has no "seriesYear", so TMDB matches on the season year`);
    if (!d.verdict) warnings.push(`dramas.json: ${d.slug} is a later season with no verdict, which is the reason it exists as its own entry`);
    const one = rawCatalog.find(x => x.slug === d.seasonOf);
    if (one) {
      const same = SEASON_OWN.filter(k => one[k] !== undefined && JSON.stringify(one[k]) === JSON.stringify(d[k]));
      const copied = same.filter(k => k === "hookNote" || k === "endingText" || k === "verdict");
      if (copied.length) errors.push(`dramas.json: ${d.slug} copies ${copied.join(", ")} straight from ${one.slug}. Every season writes its own.`);
      if (same.length >= 7) warnings.push(`dramas.json: ${d.slug} is nearly identical to ${one.slug} (${same.length} fields match). Re-derive its meters.`);
    }
  }
}

// reciprocity: A picks B while B anti-picks A is a contradiction across the site
for (const [seed, page] of pagesBySeed) {
  for (const p of page.picks || []) {
    const other = pagesBySeed.get(p.slug);
    if (!other) continue;
    const seedTitle = (catalogTitle(seed) || "").toLowerCase();
    if ((other.against || []).some(a => (a.title || "").toLowerCase() === seedTitle)) {
      warnings.push(`contradiction: ${seed} picks ${p.slug}, but ${p.slug} lists ${catalogTitle(seed)} as an anti-pick`);
    }
  }
}

console.log(`Checked ${files.length} pages against ${catalog.size} catalog entries.\n`);
if (warnings.length) { console.log(`WARNINGS (${warnings.length}):`); warnings.forEach(w => console.log("  - " + w)); console.log(""); }
if (errors.length) { console.log(`ERRORS (${errors.length}):`); errors.forEach(e => console.log("  - " + e)); process.exit(1); }
console.log("All pages pass.");
