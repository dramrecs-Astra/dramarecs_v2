import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
const dramas=JSON.parse(readFileSync('data/dramas.json','utf8'));
const pages=readdirSync('data/pages').filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync('data/pages/'+f,'utf8')));
const report={generatedAt:new Date().toISOString(),sourceRevision:'be2d867d9c2125918beb85dac901e8193e2bfc8b',dramas:dramas.length,recommendationLists:pages.length,verifiedIdentityMappings:dramas.filter(d=>d.identity?.status==='verified').length,datedEpisodeSources:dramas.filter(d=>d.episodeSource).length,sitemapEntries:existsSync('dist/sitemap.xml')?(readFileSync('dist/sitemap.xml','utf8').match(/<loc>/g)||[]).length:null,notes:['Generated counts supersede the historical 152-list audit.','Researching is not personally watching. Legacy completion claims are unverified.','No traffic, bot, conversion or revenue conclusions can be made without source exports.']};
writeFileSync('INVENTORY.json',JSON.stringify(report,null,2)+'\n');
const queue=[];
for(const d of dramas){
 if(!d.identity?.source)queue.push({type:'identity',slug:d.slug,status:'needs-human-review'});
 for(const field of ['verdict','endingText','hookNote']) if(/\b(?:ratings?|most|lowest|highest|same (?:writer|director)|episodes?|finale|ending|ends|dies|death)\b/i.test(d[field]||''))queue.push({type:'prose-review-hint',slug:d.slug,field,status:'not-a-confirmed-error'});
}
for(const p of pages) for(const pick of p.picks) if(/\b(?:same (?:writer|director|actor)|ratings?|finale|ending|resolution)\b/i.test(pick.why))queue.push({type:'relationship-review-hint',seed:p.seed,slug:pick.slug,status:'not-a-confirmed-error'});
writeFileSync('EDITORIAL-REVIEW-QUEUE.json',JSON.stringify(queue,null,2)+'\n');
console.log('Generated INVENTORY.json and EDITORIAL-REVIEW-QUEUE.json.');
