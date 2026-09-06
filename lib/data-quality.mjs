/* Pure production gates and metadata helpers. No external services or dependencies. */
export function resolveIdentity(drama, results = []) {
  const key=v=>String(v||'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
  const names=[drama.title,drama.query,drama.native,...(drama.aliases||[])].filter(Boolean).map(key);
  const year=String(drama.seriesYear||drama.year||'');
  const candidates=results.filter(r=>names.some(n=>n===key(r.name)||n===key(r.original_name))&&(!year||String(r.first_air_date||'').startsWith(year))&&(r.origin_country||[]).includes('KR'));
  return candidates.length===1?candidates[0].id:null;
}
export function preserveEditorial(drama,details,season) {
  return {episodes:drama.episodes||(drama.season?season?.episodes?.length:details?.number_of_episodes)||null,runtime:drama.runtime||details?.episode_run_time?.[0]||null};
}
export function relatedLists(page,pages) {
  const mine=new Set(page.picks.map(p=>p.slug));
  return pages.filter(p=>p.seed!==page.seed).map(p=>{const theirs=new Set(p.picks.map(x=>x.slug)),shared=[...theirs].filter(s=>mine.has(s)).length,score=shared+(mine.has(p.seed)?1:0)+(theirs.has(page.seed)?1:0);return {slug:p.seed,shared,score};}).filter(p=>p.score>=2).sort((a,b)=>b.score-a.score||a.slug.localeCompare(b.slug)).slice(0,6);
}
export function secondaryPicks(slug,pages) {
  const own=pages.find(p=>p.seed===slug);
  if(own)return own.picks.slice(0,6).map(p=>({slug:p.slug,reason:'From this drama’s curated recommendation list.'}));
  const scores=new Map();for(const p of pages)if(p.picks.some(x=>x.slug===slug))for(const pick of p.picks)if(pick.slug!==slug)scores.set(pick.slug,(scores.get(pick.slug)||0)+1);
  return [...scores].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,6).map(([s,n])=>({slug:s,reason:`Appears alongside this title in ${n} curated ${n===1?'list':'lists'}. This is editorial overlap, not a personalized match.`}));
}
export function providerRecords(region) {
  const out=[],seen=new Set();
  for(const model of ['flatrate','free','ads','rent','buy'])for(const p of [...(Array.isArray(region?.[model])?region[model]:[])].filter(Boolean).sort((a,b)=>(a.display_priority??99)-(b.display_priority??99))){
    const key=`${p.provider_id}:${model}`;if(typeof p.provider_name!=='string'||!p.provider_name.trim()||seen.has(key))continue;
    seen.add(key);out.push({id:p.provider_id,name:p.provider_name,model});
  }
  return out;
}
export function validPoster(value) {
  if(typeof value!=='string')return false;
  try {const u=new URL(value);return u.protocol==='https:'&&u.hostname==='image.tmdb.org'&&!u.port&&!u.username&&!u.password&&/^\/t\/p\/(?:w\d+|original)\/[A-Za-z0-9_.-]+$/.test(u.pathname);}catch{return false;}
}
function plainObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function safeHttps(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}
export function validateSnapshot(snapshot,now=Date.now()) {
  const fail=message=>{throw new Error('Invalid metadata snapshot: '+message);};
  if(!plainObject(snapshot))fail('expected an object keyed by drama slug');
  const allowed=['slug','tmdb_id','poster','backdrop','overview','genres','tmdbRating','network','episodes','runtime','providers','providersByRegion','providerRecordsByRegion','watchLink','watchLinks','availabilityCheckedAt','availabilityStatus','seasonAired'];
  const clean={};
  for(const [slug,d] of Object.entries(snapshot)){
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!plainObject(d)||d.slug!==slug)fail('slug mismatch or malformed row: '+slug);
    if(d.tmdb_id!=null&&(!Number.isInteger(d.tmdb_id)||d.tmdb_id<1))fail(slug+': invalid TMDB ID');
    if(d.poster!=null&&(!d.tmdb_id||!validPoster(d.poster)))fail(slug+': invalid poster or missing identity');
    if(d.backdrop!=null&&!validPoster(d.backdrop))fail(slug+': invalid backdrop');
    if(d.availabilityCheckedAt!=null){const t=Date.parse(d.availabilityCheckedAt);if(typeof d.availabilityCheckedAt!=='string'||!Number.isFinite(t)||t>now+300000)fail(slug+': invalid/future retrieval date');}
    for(const field of ['episodes','runtime'])if(d[field]!=null&&(!Number.isFinite(d[field])||d[field]<=0||(field==='episodes'&&!Number.isInteger(d[field]))))fail(slug+': invalid '+field);
    for(const field of ['providersByRegion','providerRecordsByRegion','watchLinks'])if(d[field]!=null&&!plainObject(d[field]))fail(slug+': invalid '+field);
    for(const [code,names] of Object.entries(d.providersByRegion||{}))if(!/^[A-Z]{2}$/.test(code)||!Array.isArray(names)||names.some(n=>typeof n!=='string'||!n.trim()))fail(slug+': invalid provider list');
    for(const [code,records] of Object.entries(d.providerRecordsByRegion||{}))if(!/^[A-Z]{2}$/.test(code)||!Array.isArray(records)||records.some(p=>!p||!Number.isInteger(p.id)||p.id<1||typeof p.name!=='string'||!p.name.trim()||!['flatrate','free','ads','rent','buy'].includes(p.model)))fail(slug+': invalid provider records');
    for(const [code,link] of Object.entries(d.watchLinks||{}))if(!/^[A-Z]{2}$/.test(code)||!safeHttps(link))fail(slug+': invalid availability link');
    if(d.watchLink!=null&&!safeHttps(d.watchLink))fail(slug+': invalid default availability link');
    clean[slug]=Object.fromEntries(allowed.filter(k=>d[k]!==undefined).map(k=>[k,d[k]]));
  }
  return clean;
}
function covered(d,code,field) {
  const rows=(d[field]||{})[code];
  return Array.isArray(rows)&&rows.some(p=>field==='providersByRegion'?typeof p==='string'&&p.trim():p&&typeof p.name==='string'&&p.name.trim());
}
export function assertProductionQuality(dramas,previous=[]) {
  if(!Array.isArray(dramas)||!dramas.length)throw new Error('Production blocked: empty catalog.');
  const posters=dramas.filter(d=>validPoster(d.poster)).length,coverage=posters/dramas.length;
  if(posters<Math.ceil(dramas.length*.95))throw new Error(`Production blocked: poster coverage ${(coverage*100).toFixed(1)}%, minimum 95%. Use npm run build:fixture for intentional preview builds.`);
  const keyed=dramas.every(d=>typeof d.slug==='string')&&previous.every(d=>typeof d.slug==='string');
  const currentBySlug=new Map(dramas.map(d=>[d.slug,d]));
  const baseline=keyed?previous.filter(d=>currentBySlug.has(d.slug)):previous;
  const oldPosters=baseline.filter(d=>validPoster(d.poster));
  const retained=keyed?oldPosters.filter(d=>validPoster(currentBySlug.get(d.slug).poster)).length:posters;
  if(oldPosters.length&&retained<oldPosters.length*.95)throw new Error('Production blocked: poster coverage dropped more than 5% for retained catalog titles.');
  // Compare actual non-empty data, separately in each region. New titles/regions cannot mask a loss.
  for(const field of ['providersByRegion','providerRecordsByRegion']){
    const regions=new Set(baseline.flatMap(d=>Object.keys(d[field]||{})));
    for(const code of regions){const old=baseline.filter(d=>covered(d,code,field));if(!old.length)continue;
      const count=keyed?old.filter(d=>covered(currentBySlug.get(d.slug),code,field)).length:dramas.filter(d=>covered(d,code,field)).length;
      if(count<old.length*.8)throw new Error(`Production blocked: provider coverage dropped more than 20% in ${code} (${field}). Review upstream data before release.`);
    }
  }
}
