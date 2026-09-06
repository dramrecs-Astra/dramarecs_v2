import { resolveIdentity } from './data-quality.mjs';

// Broaden discovery, not acceptance: exact name, premiere year and KR origin
// are still required. No guessed IDs or first-result fallback.
export function identitySearchTarget(drama, catalog = []) {
  if (!drama.season || !drama.seasonOf || drama.seasonOf === drama.slug) return drama;
  const base = catalog.find(d => d.slug === drama.seasonOf);
  if (!base || (drama.seriesYear && Number(drama.seriesYear) !== Number(base.seriesYear || base.year))) return drama;
  return {
    ...drama,
    title: base.title,
    query: base.query || base.title,
    native: base.native,
    seriesYear: base.seriesYear || base.year,
    aliases: [...new Set([...(base.aliases || []), drama.title, drama.query, drama.native, ...(drama.aliases || [])].filter(Boolean))]
  };
}

export async function findTmdbIdentity(drama, request, catalog = []) {
  if (Number.isInteger(drama.tmdb_id) && drama.tmdb_id > 0) return drama.tmdb_id;
  const target = identitySearchTarget(drama, catalog);
  const year = String(target.seriesYear || target.year || '');
  const queries = [...new Set([target.query, target.title, target.native, ...(target.aliases || [])]
    .filter(q => typeof q === 'string' && q.trim()).map(q => q.trim()))];
  const candidates = new Map();
  async function collect(query) {
    // The API year parameter helps short titles find the right results page;
    // resolveIdentity independently enforces the year on every candidate.
    const response = await request('/search/tv', {
      query, include_adult: 'false', language: 'en-US',
      ...(year ? { first_air_date_year: year } : {})
    });
    for (const row of Array.isArray(response?.results) ? response.results : []) {
      if (row && Number.isInteger(row.id) && row.id > 0 && resolveIdentity(target, [row]) === row.id) candidates.set(row.id, row);
    }
  }
  if (!queries.length) return null;
  await collect(queries[0]);
  if (candidates.size > 1) return null;
  if (candidates.size === 1) return [...candidates.keys()][0];
  // A verbose/stale query can miss entirely. Try the real English/Korean
  // titles and supplied aliases, and merge by ID so duplicate hits are safe.
  for (const query of queries.slice(1)) {
    await collect(query);
    if (candidates.size > 1) return null;
  }
  return candidates.size === 1 ? [...candidates.keys()][0] : null;
}
