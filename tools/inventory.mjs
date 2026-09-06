/* Current evidence. Historic planning and research notes are not silently rewritten. */
import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
export function sourceRevision(env=process.env,git=()=>spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'})) {
  for(const key of ['VERCEL_GIT_COMMIT_SHA','GITHUB_SHA'])if(/^[a-f0-9]{40,64}$/i.test(env[key]||''))return {value:env[key],source:key};
  const result=git(),sha=result?.status===0?result.stdout?.trim():'';
  return /^[a-f0-9]{40,64}$/i.test(sha||'')?{value:sha,source:'git HEAD (may have local edits; see source fingerprint)'}:{value:null,source:'unavailable; ZIPs do not prove a commit revision'};
}
export function sourceFingerprint(root='.') {
  const files=[];
  function walk(relative){const location=path.join(root,relative);if(!existsSync(location))return;for(const e of readdirSync(location,{withFileTypes:true})){const name=path.posix.join(relative,e.name);if(e.isDirectory())walk(name);else if(e.isFile()&&!['data/metadata-snapshot.json','data/.metadata-snapshot.pending.json'].includes(name))files.push(name);}}
  for(const dir of ['src','lib','tools','tests','data','.github'])walk(dir);
  for(const file of ['build.mjs','package.json','package-lock.json','vercel.json','.node-version','.nvmrc','.npmrc','.gitignore','.vercelignore'])if(existsSync(path.join(root,file)))files.push(file);
  const hash=createHash('sha256');for(const file of files.sort()){hash.update(file+'\0');hash.update(readFileSync(path.join(root,file)));hash.update('\0');}return hash.digest('hex');
}
export function generateInventory() {
  const dramas=JSON.parse(readFileSync('data/dramas.json','utf8'));
  const pages=readdirSync('data/pages').filter(f=>f.endsWith('.json')).sort().map(f=>JSON.parse(readFileSync('data/pages/'+f,'utf8')));
  const revision=sourceRevision();let htmlFiles=0;
  function countHtml(dir){if(!existsSync(dir))return;for(const e of readdirSync(dir,{withFileTypes:true})){if(e.isDirectory())countHtml(path.join(dir,e.name));else if(e.name.endsWith('.html'))htmlFiles++;}}
  countHtml('dist');
  const report={generatedAt:new Date().toISOString(),sourceRevision:revision.value,sourceRevisionEvidence:revision.source,sourceFingerprint:sourceFingerprint(),sourceFingerprintAlgorithm:'sha256 v2, sorted source paths plus bytes; includes CI, deployment and runtime configuration; excludes only generated data/metadata-snapshot.json and data/.metadata-snapshot.pending.json within source trees',dramas:dramas.length,recommendationLists:pages.length,generatedHtmlFiles:htmlFiles,verifiedIdentityMappings:dramas.filter(d=>d.identity?.status==='verified'&&d.tmdb_id&&d.identity.source&&d.identity.checked).length,datedEpisodeSources:dramas.filter(d=>d.episodeSource?.url&&d.episodeSource?.checked).length,sitemapEntries:existsSync('dist/sitemap.xml')?(readFileSync('dist/sitemap.xml','utf8').match(/<loc>/g)||[]).length:null,notes:['Generated counts supersede historical inventory claims.','This inventory does not claim that tests, editorial certification or a live deployment passed. See the release output and latest repair report.','Researching is not personally watching. Legacy completion claims remain unverified.','No traffic, bot, conversion or revenue conclusions can be made without source exports.','Fingerprint v2 includes source configuration, not remote secrets, branch protection, hosting settings or a verified deployment.']};
  writeFileSync('INVENTORY.json',JSON.stringify(report,null,2)+'\n');
  const queue=[];
  for(const d of dramas){if(!(d.identity?.status==='verified'&&d.identity.source&&d.identity.checked&&d.tmdb_id))queue.push({type:'identity',slug:d.slug,status:'needs-human-review'});for(const field of ['verdict','endingText','hookNote'])if(/\b(?:ratings?|most|lowest|highest|same (?:writer|director)|episodes?|finale|ending|ends|dies|death)\b/i.test(d[field]||''))queue.push({type:'prose-review-hint',slug:d.slug,field,status:'not-a-confirmed-error'});}
  for(const p of pages)for(const pick of p.picks)if(/\b(?:same (?:writer|director|actor)|ratings?|finale|ending|resolution)\b/i.test(pick.why))queue.push({type:'relationship-review-hint',seed:p.seed,slug:pick.slug,status:'not-a-confirmed-error'});
  writeFileSync('EDITORIAL-REVIEW-QUEUE.json',JSON.stringify(queue,null,2)+'\n');console.log('Generated current INVENTORY.json and EDITORIAL-REVIEW-QUEUE.json.');return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)generateInventory();
