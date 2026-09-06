#!/usr/bin/env node
/** Validate catalog/page structure before prose lint and relationship checks.
 * Legacy scores stay internal. Citation syntax does not certify factual truth.
 * Zero to three conditional anti-picks are allowed; attributed reporting is allowed.
 * Existing catalog titles are exempt from filler lint only as whole-title spans.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { checkedDate } from "../lib/editorial-evidence.mjs";
const ATTRIBUTION = [];

const BANNED = ["masterpiece","tapestry","rollercoaster","delves into","delve into","testament to","seamlessly","captivating","navigates","poignant reminder","a must-watch","in today's fast-paced"];
const SEASON_OWN = ["pace","romance","heavy","comfort","hook","hookNote","ending","endingText","verdict"];
const DASHES = /[\u2014\u2013]/;

if (!existsSync("data/dramas.json")) { console.error("Run this from the repo root."); process.exit(1); }
const files = readdirSync("data/pages").filter(f => f.endsWith(".json")).sort();
const rawCatalog = JSON.parse(readFileSync("data/dramas.json","utf8"));
const errors = [], warnings = [];
const object = value => value!==null && typeof value==='object' && !Array.isArray(value);
if(!Array.isArray(rawCatalog)){console.error('dramas.json: catalog must be an array');process.exit(1);}
for(const [i,d] of rawCatalog.entries()){
  if(!object(d)){errors.push(`dramas.json: entry ${i+1} must be an object`);continue;}
  for(const key of ['slug','title'])if(typeof d[key]!=='string'||!d[key].trim())errors.push(`dramas.json: entry ${i+1} ${key} must be a non-empty string`);
  for(const key of ['endingText','hookNote','verdict','seasonOf','seasonLabel'])if(d[key]!==undefined&&typeof d[key]!=='string')errors.push(`dramas.json: ${d.slug} ${key} must be a string`);
  if(Object.prototype.hasOwnProperty.call(d,'season')&&(!Number.isSafeInteger(d.season)||d.season<1))errors.push(`dramas.json: ${d.slug} season must be a positive whole number`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
const catalog = new Set(rawCatalog.map(d=>d.slug));
const titles = new Map(rawCatalog.map(d => [d.slug, d.title]));
const catalogTitle = (slug) => titles.get(slug);
const seasonOf = new Map(rawCatalog.filter(d => d.seasonOf).map(d => [d.slug, d.seasonOf]));
// Mask only complete catalog titles. Banned words outside those spans still fail.
const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const titlePattern = new RegExp('(?<![\\p{L}\\p{N}_])(?:'+[...new Set(titles.values())].sort((a,b)=>b.length-a.length).map(escapePattern).join('|')+')(?![\\p{L}\\p{N}_])','giu');
const proseForLint = text => text.replace(titlePattern,' ');
const pagesBySeed = new Map();

for (const file of files) {
  const path = `data/pages/${file}`;
  let page;
  try { page = JSON.parse(readFileSync(path,"utf8")); }
  catch (e) { errors.push(`${file}: invalid JSON (${e.message})`); continue; }
  if(!object(page)){errors.push(`${file}: page must be an object`);continue;}
  const before=errors.length;
  if(typeof page.seed!=='string'||!page.seed.trim())errors.push(`${file}: seed must be a non-empty string`);
  if(typeof page.standfirst!=='string')errors.push(`${file}: standfirst must be a string`);
  if(!Array.isArray(page.picks))errors.push(`${file}: picks must be an array`);
  if(page.against!==undefined&&!Array.isArray(page.against))errors.push(`${file}: against must be an array`);
  for(const key of ['picks','against'])if(Array.isArray(page[key]))page[key].forEach((entry,i)=>{
    if(!object(entry)){errors.push(`${file}: ${key} ${i+1} must be an object`);return;}
    const id=key==='picks'?'slug':'title';
    if(typeof entry[id]!=='string'||!entry[id].trim())errors.push(`${file}: ${key} ${i+1} ${id} must be a non-empty string`);
    if(typeof entry.why!=='string')errors.push(`${file}: ${key} ${i+1} why must be a string`);
  });
  if(errors.length>before)continue;
  pagesBySeed.set(page.seed, page);

  const expected = file.replace(/\.json$/, "");
  if (page.seed !== expected) errors.push(`${file}: seed "${page.seed}" does not match filename`);
  if (!catalog.has(page.seed)) errors.push(`${file}: seed "${page.seed}" is not in dramas.json`);

  const picks = page.picks || [];
  if (picks.length < 5 || picks.length > 7) errors.push(`${file}: ${picks.length} picks (need 5 to 7)`);
  if ((page.against || []).length > 3) errors.push(`${file}: ${(page.against||[]).length} anti-picks (allow zero to three)`);
  if (!page.standfirst || page.standfirst.length < 120) warnings.push(`${file}: standfirst is short`);
  if (typeof page.reviewed!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(page.reviewed) || !checkedDate(page.reviewed)) errors.push(`${file}: reviewed must be a real, non-future YYYY-MM-DD date`);

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

  const blob = prose.map(([,text]) => text).join(" ");
  const lintBlob = proseForLint(blob);
  if (DASHES.test(blob)) errors.push(`${file}: contains an em dash or en dash`);
  for (const w of BANNED) {
    if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(lintBlob)) errors.push(`${file}: banned phrase "${w}"`);
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
      if (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(proseForLint(text))) errors.push(`dramas.json: ${d.slug} ${field} uses banned phrase "${w}"`);
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
