/* Real Chromium checks, run by .github/workflows/validate.yml after the fixture build.
   Locally: npm install --no-save --package-lock=false playwright@1.58.2
   npx --no-install playwright install chromium && node tests/browser-smoke.mjs
   External traffic is blocked. Synthetic artwork is test-only, never catalog metadata.
   Passing this suite does not certify Safari, Firefox, screen readers, native IMEs or CWV. */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('dist'),artifacts=path.resolve('test-artifacts/browser');
mkdirSync(artifacts,{recursive:true});
const report={startedAt:new Date().toISOString(),status:'running',browser:'Chromium',data:'fixture build; synthetic shelf images; no live upstream requests',checks:[]};
const saveReport=()=>writeFileSync(path.join(artifacts,'report.json'),JSON.stringify(report,null,2)+'\n');
saveReport();
const server=createServer((req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
  if(existsSync(file)&&statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!existsSync(file)){res.writeHead(404);res.end('Not found');return;}
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png'};
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(readFileSync(file));
 }catch{res.writeHead(400);res.end('Bad request');}
});
let browser;
try {
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const base='http://127.0.0.1:'+server.address().port;
 const index=JSON.parse(readFileSync('dist/assets/search.json','utf8'));
 const picturedIndex=index.map(it=>({...it,img:'https://image.tmdb.org/t/p/w500/test-fixture.jpg'}));
 browser=await chromium.launch();report.browserVersion=browser.version();
 async function run(name,fn,{width=1366,saved=null,images=false}={}) {
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin===base){
    if(images&&url.pathname==='/assets/search.json')return route.fulfill({json:picturedIndex});
    return route.continue();
   }
   if(url.hostname==='image.tmdb.org')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><rect width="500" height="750" fill="#62514c"/><text x="30" y="70" fill="#f5eee8" font-size="25">TEST ARTWORK</text></svg>'});
   return route.abort();
  });
  if(saved)await context.addInitScript(saved=>{
   if(!localStorage.getItem('dr.state.v1'))localStorage.setItem('dr.state.v1',JSON.stringify({version:1,saved,watched:[],hideWatched:false,showEndingTones:false}));
  },saved);
  const errors=[];context.on('page',p=>{p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));});
  const page=await context.newPage(),file=name.replace(/[^a-z0-9-]/gi,'-');
  let failed=false;
  try {
   await fn(page,context,base);assert.deepEqual(errors,[],name+': unexpected client exception');
   report.checks.push({name,status:'passed'});console.log('PASS '+name);
  }catch(error){
   failed=true;report.checks.push({name,status:'failed',error:error.stack});
   await page.screenshot({path:path.join(artifacts,file+'.png'),fullPage:true}).catch(()=>{});
   writeFileSync(path.join(artifacts,file+'.html'),await page.content().catch(()=>''));
   throw error;
  }finally{
   await context.tracing.stop(failed?{path:path.join(artifacts,file+'-trace.zip')}:{});
   await context.close();saveReport();
  }
 }
 const focus=async(page,selector)=>page.waitForFunction(s=>document.activeElement===document.querySelector(s),selector);
 for(const width of [360,390,768,1366,1440])for(const count of [0,1,2,6,30]){
  await run('shelf-'+width+'px-'+count+'-titles',async(page,context,base)=>{
   await page.goto(base+'/my-shelf/');
   if(count)await page.locator('.shelfitem').first().waitFor();else await page.getByRole('heading',{name:'Your shelf is empty.'}).waitFor();
   await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'horizontal overflow');
   if(count){
    const plate=await page.locator('#shelfmount .plate').first().boundingBox();assert(plate.width<=191,'poster cap');
    if(width>=768)assert(plate.width>=160,'desktop poster width');
    assert(Math.abs(plate.height/plate.width-1.5)<.02,'poster aspect ratio');
    await page.waitForFunction(()=>{const img=document.querySelector('.shelfitem img');return img.complete&&img.naturalWidth>0;});
    if(width<=480&&count>=2){const second=await page.locator('#shelfmount .plate').nth(1).boundingBox();assert(Math.abs(second.y-plate.y)<1,'two mobile columns');}
   }
  },{width,saved:index.slice(0,count).map(it=>it.slug),images:true});
 }
 await run('search-delayed-load-keyboard-and-escape',async(page,context,base)=>{
  await context.route('**/assets/search.json',async route=>{await new Promise(r=>setTimeout(r,700));await route.fulfill({json:index});});
  await page.goto(base+'/');await page.locator('#q').fill('dramas like my liberation notes');
  await page.locator('#sug [role="option"]').first().waitFor();await page.locator('#q').press('ArrowDown');
  assert.equal(await page.locator('#q').getAttribute('aria-activedescendant'),'suggestion-0');
  await page.locator('#q').press('Escape');assert.equal(await page.locator('#q').getAttribute('aria-expanded'),'false');
 });
 await run('watched-persistence-undo-ending-controls-and-reason-pilot',async(page,context,base)=>{
  await page.goto(base+'/dramas-like/my-liberation-notes/');const row=page.locator('.rec[data-slug="my-mister"]');
  await row.locator('.shelf').click();await row.locator('.watched').click();await page.locator('#hidewatched').click();assert.equal(await row.isVisible(),false);
  await page.reload();assert.equal(await row.isVisible(),false);await page.locator('#hidewatched').click();assert.equal(await row.isVisible(),true);assert.equal(await row.locator('.shelf').getAttribute('aria-pressed'),'true');
  const ending=row.locator('.spoiler');assert.match(await ending.innerText(),/Reveal ending/);await ending.click();assert.equal(await ending.getAttribute('aria-expanded'),'true');await ending.click();assert.equal(await ending.getAttribute('aria-expanded'),'false');
  await page.locator('#reasonchoice').selectOption('romance');assert.equal(await page.locator('.rec:visible').count(),1);await page.locator('#reasonchoice').selectOption('');assert.equal(await page.locator('.rec:visible').count(),6);
  await page.goto(base+'/my-shelf/');await page.locator('.shelfitem .shelf').click();await focus(page,'#shelfmount .empty a');
  await page.getByRole('button',{name:'Undo',exact:true}).click();await focus(page,'.shelfitem .shelf');
 });
 await run('shelf-retry-focus-and-cross-tab-link-focus',async(page,context,base)=>{
  let attempts=0;await context.route('**/assets/search.json',route=>++attempts===1?route.fulfill({status:503,body:'Test failure'}):route.fulfill({json:index}));
  await page.goto(base+'/my-shelf/');await page.locator('#shelfretry').click();await focus(page,'.shelfitem .shelf');
  const slug=index[0].slug;await page.locator('.shelfitem .gitem').focus();
  const other=await context.newPage();await other.goto(base+'/my-shelf/');
  await other.evaluate(slug=>{const next=JSON.parse(localStorage.getItem('dr.state.v1'));next.watched=[slug];localStorage.setItem('dr.state.v1',JSON.stringify(next));},slug);
  await page.waitForFunction(()=>document.querySelector('.shelfitem .watched').getAttribute('aria-pressed')==='true');await focus(page,'.shelfitem .gitem');
  await other.evaluate(()=>{const next=JSON.parse(localStorage.getItem('dr.state.v1'));next.saved=[];localStorage.setItem('dr.state.v1',JSON.stringify(next));});
  await page.locator('#shelfmount .empty a').waitFor();await focus(page,'#shelfmount .empty a');
 },{saved:[index[0].slug]});
 await run('clear-filters-visible-focus',async(page,context,base)=>{
  await page.goto(base+'/dramas-like/my-liberation-notes/');await page.locator('.chip[data-f="short"]').click();
  await page.locator('.clearall').click();await focus(page,'.refine .chip');
  await page.locator('.chip[data-f="netflix"]').click();await page.locator('#emptyclear').click();await focus(page,'.refine .chip');
 });
 await run('capacity-is-not-false-save-or-partial-import',async(page,context,base)=>{
  await page.goto(base+'/dramas-like/my-liberation-notes/');await page.locator('.rec .shelf').first().click();
  assert.match(await page.locator('.toast').innerText(),/500.*Nothing changed/);
  assert.equal(await page.locator('.toast button').count(),0);
  await page.goto(base+'/my-shelf/#s='+index[0].slug);await page.locator('#keepshelf').click();
  assert.match(await page.locator('.toast').innerText(),/500.*Nothing changed/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dr.state.v1')).saved.length),500);
 },{saved:Array.from({length:500},(_,i)=>'capacity-fixture-'+i)});
 await run('shared-fragment-back-forward',async(page,context,base)=>{
  await page.goto(base+'/my-shelf/#s='+index[0].slug);await page.locator('.shelfitem[data-item="'+index[0].slug+'"]').waitFor();
  await page.evaluate(slug=>location.hash='s='+slug,index[1].slug);await page.locator('.shelfitem[data-item="'+index[1].slug+'"]').waitFor();
  await page.goBack();await page.locator('.shelfitem[data-item="'+index[0].slug+'"]').waitFor();
  await page.goForward();await page.locator('.shelfitem[data-item="'+index[1].slug+'"]').waitFor();
 });
 report.status='passed';console.log('Chromium smoke checks passed: '+report.checks.length+'. Native IME, screen-reader, other browser and live API checks remain separate.');
}catch(error){report.status='failed';report.error=error.stack;console.error(error);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();saveReport();if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
