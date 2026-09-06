/* Checks citation syntax, not factual truth, link reachability or human approval. */
export function sourceUrl(value) {
  if(typeof value!=='string'||/[\s\\]/.test(value)||!/^https:\/\/[^/?#]+(?:[/?#]|$)/i.test(value)||/%(?![a-f0-9]{2})/i.test(value))return false;
  try {
    const u=new URL(value);
    return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!u.hostname.endsWith('.')&&
      u.hostname.split('.').every(part=>/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(part));
  }catch{return false;}
}
export function checkedDate(value,now=new Date()) {
  if(typeof value!=='string')return false;
  const match=/^(\d{4}-\d{2}-\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00)))?$/.exec(value);
  if(!match)return false;
  const day=new Date(match[1]+'T00:00:00Z'),time=Date.parse(value);
  if(!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==match[1]||!Number.isFinite(time))return false;
  // Date-only citations may be recorded in any time zone (up to UTC+14).
  // Timestamps must include a zone and must not be in the future.
  return value.length===10?time<=now.getTime()+14*3600000:time<=now.getTime();
}
export function evidenceErrors(item,now=new Date()) {
  const errors=[],label=item.slug||item.seed||'Unknown item';
  const fail=message=>errors.push(`${label}: ${message}`);
  if(item.identity?.status==='verified'&&
    (!Number.isInteger(item.tmdb_id)||item.tmdb_id<1||!sourceUrl(item.identity.source)||!checkedDate(item.identity.checked,now)))
    fail('verified identity needs a positive TMDB ID, valid HTTPS source and valid checked date');
  if(item.episodeSource!=null){
    const source=item.episodeSource;
    if(!source||typeof source!=='object'||Array.isArray(source)||!sourceUrl(source.url)||!checkedDate(source.checked,now)||
      !Number.isInteger(source.episodes)||source.episodes<1||source.episodes!==item.episodes)
      fail('episode source needs a valid HTTPS URL, valid checked date and matching whole episode count');
  }
  if(item.factualClaims!=null){
    if(!Array.isArray(item.factualClaims))fail('factualClaims must be an array');
    else item.factualClaims.forEach((claim,index)=>{
      if(!claim||typeof claim!=='object'||typeof claim.claim!=='string'||!claim.claim.trim()||
        !Array.isArray(claim.sources)||!claim.sources.length||claim.sources.some(source=>!sourceUrl(source))||
        !checkedDate(claim.checked,now))fail(`factual claim ${index+1} needs text, valid HTTPS sources and a valid checked date`);
    });
  }
  return errors;
}
