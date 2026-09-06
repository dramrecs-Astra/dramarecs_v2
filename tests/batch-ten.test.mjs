/* Ten-repair regression suite. Node/DOM tests are not browser certification. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import '../src/core.js';
import {clientFixture} from './dom-fixture.mjs';
const core=globalThis.DRCore;
const index=[{slug:'a',t:'A'},{slug:'b',t:'B'}];
const shelf='<div class="shelfbar"><button id="shelfshare">Share</button></div><div id="shelfmount"></div>';
const flush=async()=>{await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));};

const ids=Array.from({length:501},(_,i)=>'title-'+i);
test('shared shelf rejects 501 distinct valid titles instead of truncating',()=>assert.throws(()=>core.shared('#s='+ids.join(',')),/500/));
test('shared shelf accepts exactly 500 titles without loss',()=>assert.deepEqual(core.shared('#s='+ids.slice(0,500).join(',')),ids.slice(0,500)));
test('shared limit counts unique valid IDs rather than duplicates or rejected IDs',()=>assert.equal(core.shared('#s='+[...ids.slice(0,500),'title-0','../invalid'].join(',')).length,500));
test('oversized shared shelf produces an error without changing saved state',async()=>{const f=await clientFixture({html:shelf,index,saved:['a'],hash:'#s='+ids.join(',')});assert.match(f.$('#shelfmount').textContent,/Cannot open.*500/);assert.equal(f.$('#keepshelf'),null);assert.deepEqual(f.state().saved,['a']);});
for(const mode of ['getter','method','rejection','missing'])test('clipboard '+mode+' failure leaves manual copy usable without throwing',async()=>{
 const f=await clientFixture({html:shelf,index,saved:['a']});
 if(mode==='getter')Object.defineProperty(f.context.navigator,'clipboard',{get(){throw Error('Denied');}});
 if(mode==='method')f.context.navigator.clipboard={writeText(){throw Error('Denied');}};
 if(mode==='rejection')f.context.navigator.clipboard={writeText:()=>Promise.reject(Error('Denied'))};
 assert.doesNotThrow(()=>f.$('#shelfshare').click());await flush();
 assert.match(f.$('#sharelink').value,/#s=a$/);assert.equal(f.$('#sharelink').parentNode.hidden,false);
 assert.match(f.$('.toast').textContent,/Select and copy/);
});
for(const outcome of ['resolve','reject'])test('clipboard '+outcome+' for an old navigation cannot reappear after returning to the same hash',async()=>{
 let settle;const f=await clientFixture({html:shelf,index,hash:'#s=a'});
 f.context.navigator.clipboard={writeText:()=>new Promise((yes,no)=>settle=outcome==='resolve'?yes:no)};
 f.$('#shelfshare').click();f.hashChange('#s=b');f.hashChange('#s=a');settle(Error('Denied'));await flush();
 assert.equal(f.$('#sharelink').parentNode.hidden,true);assert.equal(f.$('.toast'),null);
});
test('older overlapping copy completion cannot overwrite newer copy feedback',async()=>{
 const pending=[];const f=await clientFixture({html:shelf,index,saved:['a']});
 f.context.navigator.clipboard={writeText:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))};
 f.$('#shelfshare').click();f.$('#shelfshare').click();pending[1].resolve();await flush();
 assert.match(f.$('.toast').textContent,/Link copied/);pending[0].reject(Error('Denied'));await flush();assert.match(f.$('.toast').textContent,/Link copied/);
});
test('current clipboard success still announces success',async()=>{const f=await clientFixture({html:shelf,index,saved:['a']});f.context.navigator.clipboard={writeText:()=>Promise.resolve()};f.$('#shelfshare').click();await flush();assert.match(f.$('.toast').textContent,/Link copied/);});

// Exercise the real serialized browser init callback, without importing Playwright.
function seedBrowser({origin='http://127.0.0.1:1234',deny=false,discard=false,record=null}={}){
 const source=readFileSync('tests/browser-smoke.mjs','utf8');
 const block=source.slice(source.indexOf('  if(saved)await context.addInitScript'),source.indexOf('  const errors=[];'));
 let callback,arg,value=record,reads=0;
 const host={saved:['a'],base:'http://127.0.0.1:1234',context:{addInitScript(fn,input){callback=fn;arg=input;}}};
 return vm.runInNewContext('(async()=>{'+block+'})()',host).then(()=>{
  const browser={location:{origin},get localStorage(){reads++;if(deny)throw Error('Storage denied');return {getItem:()=>value,setItem:(key,next)=>{if(!discard)value=next;}};}};
  browser.window=browser;
  const invoke=()=>vm.runInNewContext('('+callback.toString()+')(input)',{window:browser,location:browser.location,get localStorage(){return browser.localStorage;},input:arg});
  return {invoke,value:()=>value,reads:()=>reads};
 });
}
test('browser fixture skips opaque documents without accessing storage',async()=>{const f=await seedBrowser({origin:'null',deny:true});assert.doesNotThrow(f.invoke);assert.equal(f.reads(),0);});
test('browser fixture does not seed another origin',async()=>{const f=await seedBrowser({origin:'https://other.example'});f.invoke();assert.equal(f.value(),null);});
test('browser fixture exposes storage denial on the actual test origin',async()=>{const f=await seedBrowser({deny:true});assert.throws(f.invoke,/Storage denied/);});
test('browser fixture detects silently discarded seed writes',async()=>{const f=await seedBrowser({discard:true});assert.throws(f.invoke,/persist/);});
test('browser fixture seeds the actual test origin',async()=>{const f=await seedBrowser();f.invoke();assert.deepEqual(JSON.parse(f.value()).saved,['a']);});
test('browser fixture does not overwrite changes after navigation or in another tab',async()=>{const f=await seedBrowser({record:'{"saved":[]}'});f.invoke();assert.equal(f.value(),'{"saved":[]}');});

function validator(kind,edit=()=>{}){
 const root=mkdtempSync(path.join(tmpdir(),'dr-ten-'));
 try{
  for(const dir of ['tools','lib','data/pages'])mkdirSync(path.join(root,dir),{recursive:true});
  for(const file of ['tools/validate-pages.mjs','tools/validate-data.mjs','lib/editorial-evidence.mjs'])copyFileSync(file,path.join(root,file));
  const dramas=['seed','a','b','c','d','e','the-trauma-code'].map(slug=>({slug,title:slug,episodes:8,runtime:60}));
  const page={seed:'seed',reviewed:'2024-02-29',standfirst:'A considered comparison of these stories. '.repeat(4),picks:['a','b','c','d','e'].map((slug,i)=>({slug,match:96-i*5,why:'Shared pacing and characters. Difference: these stories use different settings. '.repeat(2)})),against:[]};
  const data={dramas,page};edit(data);
  writeFileSync(path.join(root,'data/dramas.json'),JSON.stringify(data.dramas));
  writeFileSync(path.join(root,'data/pages/seed.json'),JSON.stringify(data.page));
  const r=spawnSync(process.execPath,['tools/validate-'+kind+'.mjs'],{cwd:root,encoding:'utf8'});
  return {...r,output:r.stdout+r.stderr};
 }finally{rmSync(root,{recursive:true,force:true});}
}
function rejected(result,pattern){assert.notEqual(result.status,0,result.output);assert.doesNotMatch(result.output,/TypeError|ReferenceError/);assert.match(result.output,pattern);}
for(const field of ['picks','against'])for(const value of [{},'wrong',null,42])test('page validator diagnoses '+field+' shape '+JSON.stringify(value),()=>rejected(validator('pages',d=>d.page[field]=value),new RegExp(field+'.*array','i')));
for(const field of ['picks','against'])for(const value of [null,{},'wrong'])test('page validator diagnoses bad '+field+' entry '+JSON.stringify(value),()=>rejected(validator('pages',d=>{d.page[field]=[value];}),new RegExp(field+'|pick','i')));
test('page validator handles a non-object page without a crash',()=>rejected(validator('pages',d=>d.page=null),/page.*object/i));
test('page validator accepts absent optional anti-picks',()=>{const r=validator('pages',d=>delete d.page.against);assert.equal(r.status,0,r.output);});
for(const reviewed of ['2026-02-30','2025-02-29','2099-01-01','yesterday',{},'2024-02-29T00:00:00Z'])test('page validator rejects invalid reviewed date '+JSON.stringify(reviewed),()=>rejected(validator('pages',d=>d.page.reviewed=reviewed),/reviewed.*date/i));
test('page validator accepts a past valid leap date',()=>{const r=validator('pages');assert.equal(r.status,0,r.output);});
for(const field of ['standfirst','why','againstWhy','verdict','endingText','hookNote'])test('page validator diagnoses non-string '+field,()=>{
 rejected(validator('pages',d=>{if(field==='why')d.page.picks[0].why={};else if(field==='againstWhy')d.page.against=[{title:'Another',why:{}}];else if(field==='standfirst')d.page.standfirst={};else d.dramas[0][field]={};}),/string/i);
});
for(const season of [0,-1,1.5,'2',true,null])test('page validator rejects invalid season '+JSON.stringify(season),()=>rejected(validator('pages',d=>{d.dramas[1].season=season;d.dramas[1].seasonOf='seed';d.dramas[1].seasonLabel='Season';}),/season.*positive whole/i));
test('page validator accepts a valid whole season',()=>{const r=validator('pages',d=>{d.dramas[1].season=1;d.dramas[1].seasonOf='seed';d.dramas[1].seasonLabel='Season 1';});assert.equal(r.status,0,r.output);});
for(const tmdb_id of [0,null,false,'',1.5,-1,'12'])test('data validator rejects explicitly supplied invalid TMDB ID '+JSON.stringify(tmdb_id),()=>rejected(validator('data',d=>d.dramas[0].tmdb_id=tmdb_id),/invalid TMDB ID/));
test('data validator accepts omitted or positive integer TMDB ID',()=>{for(const value of [undefined,12]){const r=validator('data',d=>{if(value!==undefined)d.dramas[0].tmdb_id=value;});assert.equal(r.status,0,r.output);}});
for(const field of ['standfirst','why','againstWhy','verdict','endingText','hookNote'])test('catalog title is exempt from prose filler lint in '+field,()=>{
 const r=validator('pages',d=>{d.dramas[1].title='Captivating the King';const text='Captivating the King takes a different approach. '.repeat(5);if(field==='standfirst')d.page.standfirst=text;else if(field==='why')d.page.picks[0].why=text;else if(field==='againstWhy')d.page.against=[{title:'Other',why:text}];else d.dramas[0][field]=text;});assert.equal(r.status,0,r.output);
});
test('title exemption does not excuse unrelated banned prose',()=>rejected(validator('pages',d=>{d.dramas[1].title='Captivating the King';d.page.standfirst='Captivating the King is a masterpiece. '.repeat(5);}),/banned phrase "masterpiece"/));
test('title exemption uses full title boundaries, not title substrings',()=>rejected(validator('pages',d=>{d.dramas[1].title='Captivating the King';d.page.standfirst='Captivating the Kingdom. '.repeat(8);}),/banned phrase "captivating"/));
