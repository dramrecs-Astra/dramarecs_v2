/* Optional real Chromium checks. Not executed in the authoring sandbox (browser unavailable).
   After building: npm install --no-save playwright && npx playwright install chromium
   Then: node tests/browser-smoke.mjs
   Test image responses are fixtures, never catalog artwork or production requests. */
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('dist');
const server=createServer((req,res)=>{
 let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 let file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
 if(existsSync(file)&&statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!existsSync(file)){res.writeHead(404);res.end('Not found');return;}
 const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2'})[ext]||'application/octet-stream');res.end(readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
let browser;
try {
 browser=await chromium.launch();
 const index=JSON.parse(readFileSync('dist/assets/search.json','utf8'));
 for(const width of [360,390,768,1366,1440]) for(const count of [0,1,2,6,30]){
  const context=await browser.newContext({viewport:{width,height:1000}});
  await context.addInitScript(saved=>localStorage.setItem('dr.state.v1',JSON.stringify({version:1,saved,watched:[],hideWatched:false,showEndingTones:false})),index.slice(0,count).map(x=>x.slug));
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/my-shelf/');
  if(count)await page.locator('.shelfitem').first().waitFor();else await page.getByRole('heading',{name:'Your shelf is empty.'}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow: ${width}/${count}`);
  if(count){const w=await page.locator('#shelfmount .plate').first().evaluate(e=>e.getBoundingClientRect().width);assert(w<=191,`poster too wide: ${w}`);if(width>=768)assert(w>=160);}
  assert.deepEqual(errors,[]);await context.close();
 }
 const context=await browser.newContext({viewport:{width:1366,height:900}});const page=await context.newPage();
 await page.route('**/assets/search.json',async route=>{await new Promise(r=>setTimeout(r,700));await route.continue();});
 await page.goto(base+'/');await page.locator('#q').fill('dramas like my liberation notes');
 await page.locator('#sug').getByRole('option').first().waitFor();await page.locator('#q').press('ArrowDown');assert.equal(await page.locator('#q').getAttribute('aria-activedescendant'),'suggestion-0');await page.locator('#q').press('Escape');assert.equal(await page.locator('#q').getAttribute('aria-expanded'),'false');
 await page.goto(base+'/dramas-like/my-liberation-notes/');const row=page.locator('.rec[data-slug="my-mister"]');await row.locator('.shelf').click();await row.locator('.watched').click();await page.locator('#hidewatched').click();assert.equal(await row.isVisible(),false);await page.reload();assert.equal(await row.isVisible(),false);await page.locator('#hidewatched').click();assert.equal(await row.isVisible(),true);assert.equal(await row.locator('.shelf').getAttribute('aria-pressed'),'true');
 const ending=row.locator('.spoiler');assert.match(await ending.innerText(),/Reveal ending/);await ending.click();assert.equal(await ending.getAttribute('aria-expanded'),'true');await ending.click();assert.equal(await ending.getAttribute('aria-expanded'),'false');
 await page.locator('#reasonchoice').selectOption('romance');assert.equal(await page.locator('.rec:visible').count(),1);await page.locator('#reasonchoice').selectOption('');assert.equal(await page.locator('.rec:visible').count(),6);
 await page.goto(base+'/my-shelf/');await page.locator('.shelfitem .shelf').click();await page.getByRole('button',{name:'Undo',exact:true}).click();await page.locator('.shelfitem').waitFor();
 await context.close();console.log('Chromium smoke matrix passed. Screen-reader and consent/CWV field checks remain separate.');
} finally {if(browser)await browser.close();server.close();}
