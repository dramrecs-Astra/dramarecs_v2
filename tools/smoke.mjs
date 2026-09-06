import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
const files=[];
function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(p.endsWith('.html'))files.push(p);}}
walk('dist');
const fail=[];
for(const file of files){
 const html=readFileSync(file,'utf8');
 if(/pagead2\.googlesyndication|googletagmanager\.com\/gtag|fundingchoicesmessages\.google|click\.linksynergy/.test(html))fail.push(`${file}: monetization/tracking must be disabled`);
 if(/\d+% match/.test(html))fail.push(`${file}: decorative match percentage`);
 if(/>Ending: [^<]+<\/button>/.test(html))fail.push(`${file}: visible default ending outcome`);
 if(!html.includes('/assets/core.js')||!html.includes('/assets/app.js'))fail.push(`${file}: missing browser module`);
 for(const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[^" ]*)"/g)){
  let p=m[1];if(p.startsWith('//'))continue;
  const local=path.join('dist',decodeURIComponent(p));
  if(!existsSync(local) && !existsSync(path.join(local,'index.html')))fail.push(`${file}: broken local destination ${p}`);
 }
}
const detail=readFileSync('dist/dramas/the-trauma-code/index.html','utf8');
if(detail.indexOf('class="detailmain"')>detail.indexOf('class="detailside"'))fail.push('Mobile source order regression');
if(!detail.includes('8</span> ep'))fail.push('Trauma Code episode regression');
const rec=readFileSync('dist/dramas-like/my-liberation-notes/index.html','utf8');
if(!rec.includes('class="watched"')||!rec.includes('class="difference"'))fail.push('Missing watched/decision controls');
const shelf=readFileSync('dist/my-shelf/index.html','utf8');if(!shelf.includes('<noscript>'))fail.push('Shelf has no no-JS fallback');
const netflix=readFileSync('dist/collections/best-k-dramas-on-netflix/index.html','utf8');if(!netflix.includes('fixed United States'))fail.push('Netflix region labeling regression');
if(fail.length){console.error([...new Set(fail)].join('\n'));process.exit(1);}
console.log(`Smoke checks passed across ${files.length} HTML files. No live advertising or analytics tags. Not a visual-browser test.`);
