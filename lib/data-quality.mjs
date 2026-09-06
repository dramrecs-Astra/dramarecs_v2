/* Pure functions shared by production builder and regression tests. */
export function resolveIdentity(drama, results = []) {
  const key = v => String(v || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const names = [drama.title, drama.query, drama.native, ...(drama.aliases || [])].filter(Boolean).map(key);
  const year = String(drama.seriesYear || drama.year || '');
  const candidates = results.filter(r => names.some(n => n === key(r.name) || n === key(r.original_name)) &&
    (!year || String(r.first_air_date || '').startsWith(year)) && (r.origin_country || []).includes('KR'));
  return candidates.length === 1 ? candidates[0].id : null;
}
export function preserveEditorial(drama, details, season) {
  return {
    episodes: drama.episodes || (drama.season ? season?.episodes?.length : details?.number_of_episodes) || null,
    runtime: drama.runtime || details?.episode_run_time?.[0] || null
  };
}
export function relatedLists(page, pages) {
  const mine = new Set(page.picks.map(p => p.slug));
  return pages.filter(p => p.seed !== page.seed).map(p => {
    const theirs = new Set(p.picks.map(x => x.slug));
    const shared = [...theirs].filter(s => mine.has(s)).length;
    const score = shared + (mine.has(p.seed) ? 1 : 0) + (theirs.has(page.seed) ? 1 : 0);
    return { slug: p.seed, shared, score };
  }).filter(p => p.score >= 2).sort((a,b) => b.score - a.score || a.slug.localeCompare(b.slug)).slice(0,6);
}
export function secondaryPicks(slug, pages) {
  const own = pages.find(p => p.seed === slug);
  if (own) return own.picks.slice(0,6).map(p => ({slug:p.slug, reason:'From this drama’s curated recommendation list.'}));
  const scores = new Map();
  for (const p of pages) if (p.picks.some(x => x.slug === slug)) {
    for (const pick of p.picks) if (pick.slug !== slug) scores.set(pick.slug, (scores.get(pick.slug) || 0) + 1);
  }
  return [...scores].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,6).map(([s,n]) => ({slug:s,reason:`Appears alongside this title in ${n} curated ${n === 1 ? 'list' : 'lists'}. This is editorial overlap, not a personalized match.`}));
}
export function providerRecords(region) {
  const out = [], seen = new Set();
  for (const model of ['flatrate','free','ads','rent','buy']) {
    for (const p of [...(region?.[model] || [])].sort((a,b)=>(a.display_priority ?? 99)-(b.display_priority ?? 99))) {
      const key = `${p.provider_id}:${model}`;
      if (!p.provider_name || seen.has(key)) continue;
      seen.add(key); out.push({id:p.provider_id,name:p.provider_name,model});
    }
  }
  return out;
}
export function assertProductionQuality(dramas, previous = []) {
  const coverage = dramas.filter(d => d.poster).length / Math.max(1,dramas.length);
  if (coverage < .95) throw new Error(`Production blocked: poster coverage ${(coverage*100).toFixed(1)}%, minimum 95%. Use npm run build:fixture for intentional preview builds.`);
  const oldPosters = previous.filter(d => d.poster).length;
  if (oldPosters && dramas.filter(d=>d.poster).length < oldPosters * .95) throw new Error('Production blocked: poster coverage dropped more than 5%.');
  const oldProviders = previous.filter(d => Object.keys(d.providersByRegion || {}).length).length;
  const newProviders = dramas.filter(d => Object.keys(d.providersByRegion || {}).length).length;
  if (oldProviders && newProviders < oldProviders * .8) throw new Error('Production blocked: provider coverage dropped more than 20%. Review upstream data before release.');
}
