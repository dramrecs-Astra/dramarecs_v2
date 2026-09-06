/* Integration tests exercise the real release orchestrator with a tiny simulated builder. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,copyFileSync,existsSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
const poster='https://image.tmdb.org/t/p/w500/old.jpg';
const baseline={a:{slug:'a',tmdb_id:1,poster,episodes:8,runtime:51,providersByRegion:{US:['Netflix']},providerRecordsByRegion:{US:[{id:8,name:'Netflix',model:'flatrate'}]},availabilityCheckedAt:'2026-01-01T00:00:00Z',availabilityStatus:'checked'}};
function fixture(before=JSON.stringify(baseline)) {
 const root=mkdtempSync(path.join(tmpdir(),'dr-release-'));for(const dir of ['src','lib','tools','tests','data'])mkdirSync(path.join(root,dir));
 for(const file of ['src/core.js','lib/data-quality.mjs','tools/release-build.mjs','tools/streaming-output.mjs'])copyFileSync(file,path.join(root,file));
 writeFileSync(path.join(root,'data/dramas.json'),JSON.stringify([{slug:'a',title:'Title A',episodes:8,runtime:51}]));
 if(before!==null)writeFileSync(path.join(root,'data/metadata-snapshot.json'),before);
 for(const tool of ['validate-pages','validate-data','inventory'])writeFileSync(path.join(root,'tools',tool+'.mjs'),'console.log("simulated '+tool+'");');
 writeFileSync(path.join(root,'tools/smoke.mjs'),'if(process.env.SIM_FAIL_SMOKE)process.exit(1);');
 writeFileSync(path.join(root,'tests/tiny.test.mjs'),'import test from "node:test"; test("tiny builder fixture",()=>{});');
 writeFileSync(path.join(root,'build.mjs'),`
 import{mkdirSync,writeFileSync}from'node:fs';
 mkdirSync('dist',{recursive:true});writeFileSync('build-ran','yes');
 const metadata=${JSON.stringify(baseline)};metadata.a.poster=process.env.SIM_NO_POSTERS?null:'https://image.tmdb.org/t/p/w500/new.jpg';
 metadata.a.availabilityCheckedAt=new Date().toISOString();metadata.a.unrelatedEditorial='must not persist';
 if(process.env.SIM_BAD_SNAPSHOT)metadata.a.overview={invalid:true};
 writeFileSync('data/metadata-snapshot.json',JSON.stringify(metadata));
 const payload=JSON.stringify({p:{US:['Netflix']},l:{}}).replace(/"/g,'&quot;');
 writeFileSync('dist/index.html','<script>window.DR_WATCH={};window.DR_AFF=false</script><span class="watch" data-watch="'+payload+'" data-title="Title A" data-region="US"><span class="prov">Old</span></span><small class="'+(process.env.SIM_BAD_TEMPLATE?'changed':'availabilitynote')+'">Old</small>');
 `);
 return {root,run(mode='production',env={}){const cleanEnv={...process.env};delete cleanEnv.BUILD_MODE;delete cleanEnv.VERCEL_ENV;delete cleanEnv.TMDB_TOKEN;return spawnSync(process.execPath,['tools/release-build.mjs',...(mode?[mode]:[])],{cwd:root,env:{...cleanEnv,TMDB_TOKEN:'simulated-not-a-secret',...env},encoding:'utf8'});},bytes(){return existsSync(path.join(root,'data/metadata-snapshot.json'))?readFileSync(path.join(root,'data/metadata-snapshot.json'),'utf8'):null;},close(){rmSync(root,{recursive:true,force:true});}};
}
test('release promotes a healthy snapshot only after all downstream checks',()=>{const f=fixture();try{const r=f.run();assert.equal(r.status,0,r.stdout+r.stderr);const next=JSON.parse(f.bytes());assert.match(next.a.poster,/new.jpg$/);assert.equal(next.a.unrelatedEditorial,undefined);assert.match(readFileSync(path.join(f.root,'dist/index.html'),'utf8'),/Subscription: Netflix/);}finally{f.close();}});
test('failed smoke check restores exact previous snapshot bytes',()=>{const before=JSON.stringify(baseline,null,4)+'\n';const f=fixture(before);try{const r=f.run('production',{SIM_FAIL_SMOKE:'1'});assert.notEqual(r.status,0);assert.equal(f.bytes(),before);}finally{f.close();}});
test('streaming template failure restores last-good snapshot',()=>{const before=JSON.stringify(baseline);const f=fixture(before);try{const r=f.run('production',{SIM_BAD_TEMPLATE:'1'});assert.notEqual(r.status,0);assert.match(r.stderr,/template changed/);assert.equal(f.bytes(),before);}finally{f.close();}});
test('fixture builds never replace a real snapshot with simulated data',()=>{const before=JSON.stringify(baseline);const f=fixture(before);try{const r=f.run('fixture');assert.equal(r.status,0,r.stdout+r.stderr);assert.equal(f.bytes(),before);}finally{f.close();}});
test('unhealthy preview builds keep their old snapshot rather than poisoning last-good',()=>{const before=JSON.stringify(baseline);const f=fixture(before);try{const r=f.run(null,{VERCEL_ENV:'preview',SIM_NO_POSTERS:'1'});assert.equal(r.status,0,r.stdout+r.stderr);assert.equal(f.bytes(),before);assert.match(r.stderr,/snapshot not saved/);}finally{f.close();}});
test('production quality failure preserves last-good metadata',()=>{const before=JSON.stringify(baseline);const f=fixture(before);try{const r=f.run('production',{SIM_NO_POSTERS:'1'});assert.notEqual(r.status,0);assert.match(r.stderr,/minimum 95%/);assert.equal(f.bytes(),before);}finally{f.close();}});
test('invalid baseline blocks before the builder can silently discard it',()=>{const f=fixture('[]');try{const r=f.run();assert.notEqual(r.status,0);assert.equal(f.bytes(),'[]');assert.equal(existsSync(path.join(f.root,'build-ran')),false);}finally{f.close();}});
test('first failed build does not leave behind an unverified snapshot',()=>{const f=fixture(null);try{const r=f.run('production',{SIM_FAIL_SMOKE:'1'});assert.notEqual(r.status,0);assert.equal(f.bytes(),null);}finally{f.close();}});
test('fixture flag remains prohibited in Vercel production',()=>{const f=fixture();try{const r=f.run('fixture',{VERCEL_ENV:'production'});assert.notEqual(r.status,0);assert.match(r.stderr,/Fixture builds cannot/);assert.equal(existsSync(path.join(f.root,'build-ran')),false);}finally{f.close();}});

test('malformed candidate metadata fails release and restores exact last-good bytes',()=>{const before=JSON.stringify(baseline,null,4)+'\n';const f=fixture(before);try{const r=f.run('production',{SIM_BAD_SNAPSHOT:'1'});assert.notEqual(r.status,0);assert.match(r.stderr,/invalid overview/);assert.equal(f.bytes(),before);}finally{f.close();}});
test('malformed hydrated fields in a baseline block before generation',()=>{const before=JSON.stringify({a:{...baseline.a,genres:{}}});const f=fixture(before);try{const r=f.run();assert.notEqual(r.status,0);assert.match(r.stderr,/invalid genres/);assert.equal(f.bytes(),before);assert.equal(existsSync(path.join(f.root,'build-ran')),false);}finally{f.close();}});
