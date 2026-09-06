import {spawnSync} from 'node:child_process';
import {readdirSync,rmSync} from 'node:fs';
const mode=process.argv[2];
if(mode==='fixture' && process.env.VERCEL_ENV==='production')throw Error('Fixture builds cannot run in the production deployment');
const env={...process.env,...(mode?{BUILD_MODE:mode}:{})};
function run(args){const r=spawnSync(process.execPath,args,{stdio:'inherit',env});if(r.status!==0)process.exit(r.status||1);}
run(['tools/validate-pages.mjs']);run(['tools/validate-data.mjs']);
run(['--test',...readdirSync('tests').filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+f)]);
// Only generated output is removed, never source, and only after validation succeeds.
rmSync('dist',{recursive:true,force:true});
run(['build.mjs']);run(['tools/smoke.mjs']);run(['tools/inventory.mjs']);
