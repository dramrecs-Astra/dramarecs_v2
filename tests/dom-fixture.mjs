/* Minimal DOM for interaction regression tests. Not a rendering engine or browser certification. */
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const unescape=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const camel=s=>s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
export async function clientFixture({html='',saved=[],watched=[],hideWatched=false,index=[],hash='',region=null}={}) {
  let document;
  class TextNode {constructor(text){this.textContent=text;this.parentNode=null;}get outerHTML(){return escape(this.textContent);}get children(){return [];}contains(el){return this===el;}}
  class Element {
    constructor(tag='div'){this.tagName=tag.toLowerCase();this.attrs={};this.dataset={};this.children=[];this.parentNode=null;this.listeners={};this.hidden=false;this.value='';this.className='';this.id='';this.classList={contains:c=>this.className.split(/\s+/).includes(c),add:c=>{if(!this.classList.contains(c))this.className=(this.className+' '+c).trim();},remove:c=>{this.className=this.className.split(/\s+/).filter(v=>v!==c).join(' ');},toggle:(c,on)=>{if(on===undefined)on=!this.classList.contains(c);on?this.classList.add(c):this.classList.remove(c);return on;}};}
    setAttribute(k,v){v=String(v);this.attrs[k]=v;if(k==='id')this.id=v;else if(k==='class')this.className=v;else if(k==='hidden')this.hidden=true;else if(k.startsWith('data-'))this.dataset[camel(k.slice(5))]=v;}
    getAttribute(k){if(k==='id')return this.id||null;if(k==='class')return this.className||null;if(k==='hidden')return this.hidden?'':null;if(k.startsWith('data-'))return this.dataset[camel(k.slice(5))]??null;return this.attrs[k]??null;}
    removeAttribute(k){delete this.attrs[k];if(k==='hidden')this.hidden=false;}
    get textContent(){return this.children.map(c=>c.textContent).join('');}set textContent(v){this.replaceChildren(new TextNode(String(v)));}
    get innerHTML(){return this.children.map(c=>c.outerHTML).join('');}
    set innerHTML(html){this.replaceChildren();const stack=[this];for(const match of String(html).matchAll(/<\/?[^>]+>|[^<]+/g)){const token=match[0];if(token.startsWith('</')){if(stack.length>1)stack.pop();}else if(token.startsWith('<')){const tag=/^<([\w-]+)/.exec(token)?.[1];if(!tag)continue;const el=new Element(tag);for(const a of token.slice(tag.length+1).matchAll(/([\w:-]+)(?:="([^"]*)"|='([^']*)')?/g))el.setAttribute(a[1],unescape(a[2]??a[3]??''));stack.at(-1).appendChild(el);if(!['img','input','br','hr','meta','link'].includes(tag)&&!token.endsWith('/>'))stack.push(el);}else stack.at(-1).appendChild(new TextNode(unescape(token)));}}
    get outerHTML(){const attrs={...this.attrs};if(this.id)attrs.id=this.id;if(this.className)attrs.class=this.className;for(const[k,v]of Object.entries(this.dataset))attrs['data-'+k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]=v;if(this.hidden)attrs.hidden='';return '<'+this.tagName+Object.entries(attrs).map(([k,v])=>' '+k+'="'+escape(v)+'"').join('')+'>'+this.innerHTML+'</'+this.tagName+'>';}
    appendChild(el){if(el.parentNode)el.parentNode.children=el.parentNode.children.filter(c=>c!==el);el.parentNode=this;this.children.push(el);return el;}
    append(el){this.appendChild(el);}prepend(el){this.appendChild(el);this.children.unshift(this.children.pop());}
    after(el){if(!this.parentNode)return;const p=this.parentNode;p.appendChild(el);p.children.pop();p.children.splice(p.children.indexOf(this)+1,0,el);}
    replaceChildren(...els){if(document&&this.children.some(c=>c.contains(document.activeElement)))document.activeElement=document.body;for(const c of this.children)c.parentNode=null;this.children=[];els.forEach(el=>this.appendChild(el));}
    contains(el){return this===el||this.children.some(c=>c.contains(el));}
    remove(){if(this.parentNode){if(this.contains(document.activeElement))document.activeElement=document.body;this.parentNode.children=this.parentNode.children.filter(c=>c!==this);this.parentNode=null;}}
    get nextElementSibling(){if(!this.parentNode)return null;return this.parentNode.children.slice(this.parentNode.children.indexOf(this)+1).find(c=>c instanceof Element)||null;}
    matchesOne(s){let valid=true;s=s.replace(/\[([^=\]]+)(?:="([^"]*)")?\]/g,(_,k,v)=>{if(v===undefined?this.getAttribute(k)===null:this.getAttribute(k)!==v)valid=false;return '';});s=s.replace(/#([\w-]+)/g,(_,id)=>{if(this.id!==id)valid=false;return '';});s=s.replace(/\.([\w-]+)/g,(_,c)=>{if(!this.classList.contains(c))valid=false;return '';});return valid&&(!s||s==='*'||s===this.tagName);}
    matches(s){return s.split(',').some(branch=>{const parts=branch.trim().split(/\s+/);if(!this.matchesOne(parts.pop()))return false;let node=this.parentNode;while(parts.length){const part=parts.pop();while(node&&!node.matchesOne(part))node=node.parentNode;if(!node)return false;node=node.parentNode;}return true;});}
    closest(s){for(let el=this;el;el=el.parentNode)if(el.matches(s))return el;return null;}
    querySelectorAll(s){const found=[];function walk(el){for(const c of el.children)if(c instanceof Element){if(c.matches(s))found.push(c);walk(c);}}walk(this);return found;}
    querySelector(s){return this.querySelectorAll(s)[0]||null;}
    addEventListener(k,fn){(this.listeners[k]||=[]).push(fn);}
    focus(){document.activeElement=this;}
    select(){}
    click(){this.focus();const event={target:this,preventDefault(){}};if(this.onclick)this.onclick(event);for(const fn of this.listeners.click||[])fn(event);for(const fn of document.listeners.click||[])fn(event);}
    insertAdjacentHTML(where,html){const holder=new Element();holder.innerHTML=html;for(const el of [...holder.children])this.appendChild(el);}
  }
  document={body:new Element('body'),activeElement:null,listeners:{},querySelector(s){return this.body.querySelector(s);},querySelectorAll(s){return this.body.querySelectorAll(s);},createElement:t=>new Element(t),createTextNode:t=>new TextNode(t),addEventListener(k,fn){(this.listeners[k]||=[]).push(fn);}};
  document.activeElement=document.body;document.body.innerHTML='<main id="main">'+html+'</main>';
  const data={'dr.state.v1':JSON.stringify({version:1,saved,watched,hideWatched,showEndingTones:false})};if(region)data['sd.region']=region;
  const events={};const context={document,URL,console,AbortController,setTimeout:(fn,n)=>{const t=setTimeout(fn,n);t.unref();return t;},clearTimeout,location:{hash,origin:'https://example.test'},navigator:{},localStorage:{getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=v;}},fetch:async()=>({ok:true,json:async()=>index}),addEventListener:(k,fn)=>{events[k]=fn;}};
  context.window=context;context.globalThis=context;vm.createContext(context);vm.runInContext(readFileSync('src/core.js','utf8'),context);vm.runInContext(readFileSync('src/app.js','utf8'),context);
  await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));
  return {document,context,$:s=>document.querySelector(s),$$:s=>document.querySelectorAll(s),state:()=>JSON.parse(data['dr.state.v1']),storageEvent(next){data['dr.state.v1']=JSON.stringify({version:1,saved:[],watched:[],hideWatched:false,showEndingTones:false,...next});events.storage({key:'dr.state.v1'});}};
}
