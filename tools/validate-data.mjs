import {readFileSync,readdirSync} from 'node:fs';
const dramas=JSON.parse(readFileSync('data/dramas.json','utf8'));
const pages=readdirSync('data/pages').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync('data/pages/'+f,'utf8')));
const errors=[],ids=new Set();
for(const d of dramas) {
  if(ids.has(d.slug)) errors.push('Duplicate drama '+d.slug);ids.add(d.slug);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug)) errors.push('Invalid slug '+d.slug);
  for(const k of ['episodes','runtime']) if(!Number.isFinite(d[k]) || d[k]<=0) errors.push(`${d.slug}: invalid ${k}`);
  if(d.tmdb_id && (!Number.isInteger(d.tmdb_id)||d.tmdb_id<1)) errors.push(`${d.slug}: invalid TMDB ID`);
  if(d.identity?.status==='verified' && (!d.tmdb_id || !d.identity.source || !d.identity.checked)) errors.push(`${d.slug}: verified identity needs ID, source and checked date`);
  if(d.episodeSource && (!/^https:\/\//.test(d.episodeSource.url||'')||d.episodeSource.episodes!==d.episodes)) errors.push(`${d.slug}: episode source mismatch`);
}
// Structured factual claims are an explicit review gate, not automated proof of truth.
for(const item of [...dramas,...pages]) for(const claim of item.factualClaims||[]) {
  if(!claim.claim || !Array.isArray(claim.sources) || !claim.sources.length || claim.sources.some(s=>!/^https:\/\//.test(s)) || !claim.checked) errors.push(`${item.slug||item.seed}: factual claim missing dated sources`);
}
const trauma=dramas.find(d=>d.slug==='the-trauma-code');
if(trauma?.episodes!==8) errors.push('Trauma Code regression: Netflix Season 1 has 8 episodes');
const mln=pages.find(p=>p.seed==='my-liberation-notes');
if(mln?.against?.some(p=>p.title==='Something in the Rain' && /same director/i.test(p.why))) errors.push('Director correction regressed');
if(JSON.stringify([...dramas,...pages]).includes('in this batch')) errors.push('Internal batch wording leaked into content');
if(errors.length) {console.error(errors.join('\n'));process.exit(1);}
console.log(`Data checks passed: ${dramas.length} dramas, ${pages.length} lists. Legacy claim provenance remains review debt, not certified fact.`);
