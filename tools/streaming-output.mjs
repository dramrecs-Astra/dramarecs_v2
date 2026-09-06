/* Enrich generated HTML, not editorial source. One shared renderer for build and browser. */
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import '../src/core.js';
const core=globalThis.DRCore;
export const regions={US:'the United States',GB:'the United Kingdom',CA:'Canada',AU:'Australia',IN:'India',PH:'the Philippines',ID:'Indonesia',BR:'Brazil'};
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const escape=s=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export function renderStreamingPage(html,catalog,snapshot={},fromCurrentBuild=false,now=Date.now()) {
  const byTitle=new Map(catalog.map(d=>[d.title,d]));
  if(byTitle.size!==catalog.length)throw new Error('Duplicate catalog titles require explicit streaming row IDs.');
  const tableMatch=html.match(/window\.DR_WATCH=(.*?);window\.DR_AFF=/);
  const table=tableMatch?JSON.parse(tableMatch[1]):{};
  let count=0;
  const expected=(html.match(/class="watch[^"]*" data-watch=/g)||[]).length;
  const result=html.replace(/<span class="(watch[^"]*)" data-watch="([^"]*)" data-title="([^"]*)" data-region="([^"]*)">[\s\S]*?<\/span><small class="availabilitynote">[\s\S]*?<\/small>/g,(_,cls,payload,titleEncoded,code)=>{
    if(!regions[code])throw new Error('Unsupported streaming region: '+code);
    const title=decode(titleEncoded),d=byTitle.get(title);if(!d)throw new Error('Unknown streaming row title: '+title);
    const old=JSON.parse(decode(payload)),metadata=snapshot[d.slug]||{};
    const data={p:old.p||{},l:old.l||{},r:metadata.providerRecordsByRegion||{},checkedAt:metadata.availabilityCheckedAt||null,status:fromCurrentBuild?metadata.availabilityStatus:'stale'};
    count++;
    return `<span class="${escape(cls)}" data-watch="${escape(JSON.stringify(data))}" data-title="${escape(title)}" data-region="${code}">${core.streamingHtml(data,code,title,table,regions[code])}</span><small class="availabilitynote">${escape(core.availabilityText(data,code,regions[code],now))} <a href="https://www.justwatch.com/" target="_blank" rel="noopener">Check JustWatch</a>.</small>`;
  });
  if(count!==expected)throw new Error(`Streaming template changed: expected ${expected} rows, updated ${count}.`);
  return {html:result,rows:count};
}
export function updateStreamingOutput(root,catalog,snapshot={},fromCurrentBuild=false) {
  let pages=0,rows=0;
  function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(file.endsWith('.html')){const source=readFileSync(file,'utf8'),result=renderStreamingPage(source,catalog,snapshot,fromCurrentBuild);if(result.html!==source)writeFileSync(file,result.html);pages++;rows+=result.rows;}}}
  walk(root);if(!rows)throw new Error('No streaming rows found in generated output.');
  console.log(`Streaming output checked: ${rows} rows across ${pages} HTML files.`);return {pages,rows};
}
