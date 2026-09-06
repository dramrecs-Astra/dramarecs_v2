/* Required deployment pipeline. The established TMDB builder remains unchanged. */
import {spawnSync} from 'node:child_process';
import {readdirSync,readFileSync,writeFileSync,existsSync,renameSync,rmSync} from 'node:fs';
import {validateSnapshot,assertProductionQuality} from '../lib/data-quality.mjs';
import {updateStreamingOutput} from './streaming-output.mjs';
const mode=process.argv[2];
if(mode&&!['fixture','production'].includes(mode))throw new Error('Unknown build mode: '+mode);
if(mode==='fixture'&&process.env.VERCEL_ENV==='production')throw new Error('Fixture builds cannot run in the production deployment');
const env={...process.env,...(mode?{BUILD_MODE:mode}:{})};
const production=env.VERCEL_ENV==='production'||env.BUILD_MODE==='production';
const fixture=env.BUILD_MODE==='fixture';
const snapshotPath='data/metadata-snapshot.json',pendingPath='data/.metadata-snapshot.pending.json';
function run(args){const r=spawnSync(process.execPath,args,{stdio:'inherit',env});if(r.error||r.status!==0)throw new Error(`Release step failed: ${args[0]}${r.error?': '+r.error.message:''}`);}
function atomicWrite(file,bytes){writeFileSync(pendingPath,bytes);renameSync(pendingPath,file);}
const before=existsSync(snapshotPath)?readFileSync(snapshotPath):null;
// Never silently ignore a damaged baseline and thereby disable degradation checks.
const previous=before?validateSnapshot(JSON.parse(before.toString('utf8'))):{};
let built=false,committed=false;
try {
  run(['tools/validate-pages.mjs']);run(['tools/validate-data.mjs']);
  run(['--test',...readdirSync('tests').filter(f=>f.endsWith('.test.mjs')).sort().map(f=>'tests/'+f)]);
  rmSync('dist',{recursive:true,force:true});built=true;run(['build.mjs']);
  const raw=JSON.parse(readFileSync('data/dramas.json','utf8'));
  const written=existsSync(snapshotPath)?readFileSync(snapshotPath):null;
  const currentBuild=Boolean(env.TMDB_TOKEN?.trim()&&written&&(!before||!written.equals(before)));
  const candidate=written?validateSnapshot(JSON.parse(written.toString('utf8'))):{};
  // The baseline builder writes a candidate. Restore last-good while later checks run.
  if(before)atomicWrite(snapshotPath,before);else rmSync(snapshotPath,{force:true});
  updateStreamingOutput('dist',raw,candidate,currentBuild);
  run(['tools/smoke.mjs']);run(['tools/inventory.mjs']);
  if(currentBuild&&!fixture){
    const current=raw.map(d=>candidate[d.slug]||{slug:d.slug,poster:null});
    try {assertProductionQuality(current,Object.values(previous));}
    catch(error){if(production)throw error;console.warn('Preview snapshot not saved: '+error.message);committed=true;}
    if(!committed){atomicWrite(snapshotPath,JSON.stringify(candidate,null,2)+'\n');console.log('Last-good metadata snapshot saved after all release checks.');}
  }else console.log('Metadata snapshot unchanged (fixture, no-token or no new metadata).');
  committed=true;
} catch(error) {
  if(built&&!committed){if(before)atomicWrite(snapshotPath,before);else rmSync(snapshotPath,{force:true});}
  console.error(error.message);process.exitCode=1;
} finally {rmSync(pendingPath,{force:true});}
