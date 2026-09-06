import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {sourceUrl,checkedDate,evidenceErrors} from '../lib/editorial-evidence.mjs';
const now=new Date('2026-09-06T09:00:00Z');
const claim={claim:'Documented sample claim',sources:['https://example.com/credits'],checked:'2026-09-06'};
test('source URLs require a well-formed HTTPS authority without credentials',()=>{for(const value of [null,{},'', 'https://','https:///example.com','https://?x','http://example.com','javascript:alert(1)','https://user:pass@example.com','https://example.com/a b',' https://example.com','https://example.com\n','https://example.com\\path','https://example.com/%zz','https://-example.com','https://localhost'])assert.equal(sourceUrl(value),false,String(value));for(const value of ['https://www.netflix.com/title/81677629','https://example.com/a%20b?q=x#credits','https://en.wikipedia.org/wiki/My_Mister'])assert.equal(sourceUrl(value),true,value);});
test('review dates require real calendar dates and reject nonsense or impossible days',()=>{for(const value of [null,true,{},'yesterday','not-a-date','2026-2-3','2026-02-30','2025-02-29','2026-13-01','2026-00-01','2026-09-06T24:00:00Z','2026-09-06T06:00:00','2026-09-06T06:00:00+14:01','2099-01-01'])assert.equal(checkedDate(value,now),false,String(value));for(const value of ['2024-02-29','2026-09-06','2026-09-06T08:59:00Z','2026-09-06T13:00:00+05:30'])assert.equal(checkedDate(value,now),true,value);});
test('date-only time-zone allowance is bounded and timestamps cannot be future-dated',()=>{assert.equal(checkedDate('2026-09-07',now),false);assert.equal(checkedDate('2026-09-07',new Date('2026-09-06T12:00:00Z')),true);assert.equal(checkedDate('2026-09-08',new Date('2026-09-06T12:00:00Z')),false);assert.equal(checkedDate('2026-09-06T09:00:01Z',now),false);});
test('legacy prose without structured claims stays explicitly outside evidence certification',()=>{assert.deepEqual(evidenceErrors({slug:'a',verdict:'Legacy prose'},now),[]);});
test('well-formed evidence passes without claiming the underlying statement is true',()=>{assert.deepEqual(evidenceErrors({slug:'a',factualClaims:[claim],tmdb_id:1,identity:{status:'verified',source:'https://example.com/title/1',checked:'2026-09-06'},episodes:8,episodeSource:{url:'https://example.com/season/1',checked:'2026-09-06',episodes:8}},now),[]);});
test('bad structured claims return actionable errors instead of throwing',()=>{for(const factualClaims of [{},'text',[null],[{}],[{...claim,claim:' '}],[{...claim,sources:['https://']}],[{...claim,sources:[]}],[{...claim,sources:[1]}],[{...claim,checked:'nonsense'}]]){const errors=evidenceErrors({seed:'sample-list',factualClaims},now);assert.ok(errors.length);assert.match(errors[0],/sample-list: factual/);}});
test('verified identity requires valid ID, source and date',()=>{const identity={status:'verified',source:'https://example.com/credits',checked:'2026-09-06'};for(const row of [{tmdb_id:0,identity},{tmdb_id:1.5,identity},{tmdb_id:1,identity:{...identity,source:'https://'}},{tmdb_id:1,identity:{...identity,checked:'2026-02-30'}}])assert.match(evidenceErrors({slug:'a',...row},now)[0],/verified identity/);assert.deepEqual(evidenceErrors({slug:'a',identity:{status:'candidate'}},now),[]);});
test('episode evidence requires matching whole count and a valid date',()=>{const source={url:'https://example.com/season',checked:'2026-09-06',episodes:8};for(const episodeSource of ['bad',[],{}, {...source,episodes:9},{...source,checked:'nonsense'},{...source,url:'https://'}])assert.match(evidenceErrors({slug:'a',episodes:8,episodeSource},now)[0],/episode source/);});
function runValidator(drama,pages=[]) {
 const root=mkdtempSync(path.join(tmpdir(),'dr-evidence-'));
 try {
  for(const directory of ['lib','tools','data/pages'])mkdirSync(path.join(root,directory),{recursive:true});
  for(const file of ['lib/editorial-evidence.mjs','tools/validate-data.mjs'])copyFileSync(file,path.join(root,file));
  writeFileSync(path.join(root,'data/dramas.json'),JSON.stringify([{slug:'the-trauma-code',episodes:8,runtime:50},drama]));
  pages.forEach((page,i)=>writeFileSync(path.join(root,'data/pages',i+'.json'),JSON.stringify(page)));
  return spawnSync(process.execPath,['tools/validate-data.mjs'],{cwd:root,encoding:'utf8'});
 }finally{rmSync(root,{recursive:true,force:true});}
}
test('real validator rejects fractional catalog episodes before building',()=>{const result=runValidator({slug:'a',episodes:8.5,runtime:60});assert.notEqual(result.status,0);assert.match(result.stderr,/a: episodes must be a whole number/);});
test('real validator rejects invalid evidence in catalog and recommendation lists',()=>{const result=runValidator({slug:'a',episodes:8,runtime:60,factualClaims:[{...claim,sources:['https://']}]},[{seed:'list-a',factualClaims:[{...claim,checked:'nonsense'}]}]);assert.notEqual(result.status,0);assert.match(result.stderr,/a: factual claim 1/);assert.match(result.stderr,/list-a: factual claim 1/);});
test('real validator accepts legacy entries without fabricated citations',()=>{const result=runValidator({slug:'a',episodes:8,runtime:60});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/not certified fact/);});
