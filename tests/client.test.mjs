/* DOM-mock integration tests, NOT browser rendering/accessibility certification. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function fixture(kind='search',fetcher,seed={}) {
 const nodes=new Map(),events={};
 class Element {
  constructor(id=''){this.id=id;this.attrs={};this.listeners={};this.dataset={};this.hidden=false;this.value='';this.children=[];this._html='';this.textContent='';this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};if(id)nodes.set('#'+id,this);}
  set id(v){this._id=v;if(v)nodes.set('#'+v,this);}
  get id(){return this._id;}
  set innerHTML(s){this._html=s;for(const match of s.matchAll(/id="([^"]+)"/g))new Element(match[1]);}
  get innerHTML(){return this._html;}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='id'){this.id=v;nodes.set('#'+v,this);}}
  getAttribute(k){return this.attrs[k]??null;}
  removeAttribute(k){delete this.attrs[k];}
  addEventListener(k,f){this.listeners[k]=f;}
  querySelector(){return null;} querySelectorAll(){return [];}
  closest(s){return s==='.searchblock'&&this.id==='q'?nodes.get('.searchblock'):null;}
  appendChild(n){this.children.push(n);return n;} append(n){this.appendChild(n);} prepend(n){this.children.unshift(n);} after(){}
  replaceChildren(...n){this.children=n;} focus(){document.activeElement=this;} select(){} insertAdjacentHTML(){}
 }
 const main=new Element('main');const input=kind==='search'?new Element('q'):null;const box=kind==='search'?new Element('sug'):null;
 if(kind==='search'){nodes.set('.searchblock',new Element());new Element('gobtn');}
 if(kind==='shelf')new Element('shelfmount');
 const document={body:new Element(),activeElement:input,querySelector:s=>nodes.get(s)||null,querySelectorAll:()=>[],createElement:()=>new Element(),createTextNode:s=>({textContent:s}),addEventListener:(k,f)=>{events[k]=f;}};
 const data={...seed};const context={document,console,AbortController,setTimeout,clearTimeout,fetch:fetcher,location:{hash:'',origin:'https://example.test'},navigator:{},localStorage:{getItem:k=>data[k]??null,setItem:(k,v)=>data[k]=v},addEventListener(){}};
 context.window=context;context.globalThis=context;
 vm.createContext(context);vm.runInContext(readFileSync('src/core.js','utf8'),context);vm.runInContext(readFileSync('src/app.js','utf8'),context);
 return {nodes,input,box,context,document,events,async flush(){await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));}};
}
const entries=[{slug:'my-liberation-notes',t:'My Liberation Notes',n:'my liberation notes',a:'mln',page:1,y:2022}];
test('typing before delayed index load redraws without another keystroke',async()=>{let resolve;const f=fixture('search',()=>new Promise(r=>resolve=r));f.input.value='dramas like my liberation notes';f.input.listeners.input();assert.equal(f.input.getAttribute('aria-expanded'),'false');resolve({ok:true,json:async()=>entries});await f.flush();assert.match(f.box.innerHTML,/My Liberation Notes/);assert.equal(f.input.getAttribute('aria-expanded'),'true');});
test('arrow selection and Escape keep ARIA synchronized',async()=>{const f=fixture('search',async()=>({ok:true,json:async()=>entries}));await f.flush();f.input.value='mln';f.input.listeners.input();f.input.listeners.keydown({key:'ArrowDown',preventDefault(){}});assert.equal(f.input.getAttribute('aria-activedescendant'),'suggestion-0');assert.match(f.box.innerHTML,/aria-selected="true"/);f.input.listeners.keydown({key:'Escape'});assert.equal(f.input.getAttribute('aria-expanded'),'false');assert.equal(f.input.getAttribute('aria-activedescendant'),null);});
test('Escape before network completion does not reopen suggestions',async()=>{let resolve;const f=fixture('search',()=>new Promise(r=>resolve=r));f.input.value='mln';f.input.listeners.input();f.input.listeners.keydown({key:'Escape'});resolve({ok:true,json:async()=>entries});await f.flush();assert.equal(f.input.getAttribute('aria-expanded'),'false');});
test('failed search provides retry, not a false no-match claim',async()=>{const f=fixture('search',async()=>({ok:false}));f.input.value='mln';f.input.listeners.input();await f.flush();assert.match(f.nodes.get('#searchstatus').innerHTML,/Retry search/);assert.equal(typeof f.nodes.get('#searchretry').onclick,'function');});
test('explicit title searches keep watched titles visible and labeled',async()=>{const f=fixture('search',async()=>({ok:true,json:async()=>entries}),{'dr.state.v1':JSON.stringify({version:1,saved:[],watched:['my-liberation-notes'],hideWatched:true})});await f.flush();f.input.value='mln';f.input.listeners.input();assert.match(f.box.innerHTML,/Watched/);assert.match(f.box.innerHTML,/Recommendations/);});
test('shelf HTTP failure replaces loading with a retry and preserves saved IDs',async()=>{const f=fixture('shelf',async()=>({ok:false}),{'sd.shelf':'["my-mister"]'});await f.flush();assert.match(f.nodes.get('#shelfmount').innerHTML,/Your saved titles are unchanged/);assert.equal(typeof f.nodes.get('#shelfretry').onclick,'function');assert.equal(f.context.localStorage.getItem('sd.shelf'),'["my-mister"]');});
