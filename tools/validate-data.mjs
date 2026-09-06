import {readFileSync,readdirSync} from 'node:fs';
import {evidenceErrors} from '../lib/editorial-evidence.mjs';
const dramas=JSON.parse(readFileSync('data/dramas.json','utf8'));
const pages=readdirSync('data/pages').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync('data/pages/'+f,'utf8')));
const errors=[],ids=new Set();
for(const d of dramas) {
  if(ids.has(d.slug)) errors.push('Duplicate drama '+d.slug);ids.add(d.slug);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug)) errors.push('Invalid slug '+d.slug);
  for(const k of ['episodes','runtime']) if(!Number.isFinite(d[k]) || d[k]<=0) errors.push(`${d.slug}: invalid ${k}`);
  if(!Number.isInteger(d.episodes)) errors.push(`${d.slug}: episodes must be a whole number`);
  if(Object.prototype.hasOwnProperty.call(d,'tmdb_id') && (!Number.isSafeInteger(d.tmdb_id)||d.tmdb_id<1)) errors.push(`${d.slug}: invalid TMDB ID`);
}
// Explicit evidence must have usable syntax. This cannot prove factual truth or
// certify legacy prose, identity mappings, source contents or human review.
for(const item of [...dramas,...pages]) errors.push(...evidenceErrors(item));
const trauma=dramas.find(d=>d.slug==='the-trauma-code');
if(trauma?.episodes!==8) errors.push('Trauma Code regression: Netflix Season 1 has 8 episodes');
const mln=pages.find(p=>p.seed==='my-liberation-notes');
if(mln?.against?.some(p=>p.title==='Something in the Rain' && /same director/i.test(p.why))) errors.push('Director correction regressed');
if(JSON.stringify([...dramas,...pages]).includes('in this batch')) errors.push('Internal batch wording leaked into content');
if(errors.length) {console.error(errors.join('\n'));process.exit(1);}
console.log(`Data checks passed: ${dramas.length} dramas, ${pages.length} lists. Legacy claim provenance remains review debt, not certified fact.`);
