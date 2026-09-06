/* DramaRecs browser interactions. Static pages, independent saved/watched state, no tracking. */
(function () {
  'use strict';
  var core=window.DRCore,notice,catalog,catalogPromise;
  var $=function(s){return document.querySelector(s);},$$=function(s){return Array.from(document.querySelectorAll(s));};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function toast(text,undo){
    if(!notice){notice=document.createElement('div');notice.className='toast up';notice.setAttribute('role','status');document.body.appendChild(notice);}
    notice.replaceChildren(document.createTextNode(text));notice.classList.add('up');
    if(undo){var b=document.createElement('button');b.type='button';b.textContent='Undo';b.addEventListener('click',function(){undo();notice.replaceChildren(document.createTextNode('Undone.'));if(document.activeElement===b||document.activeElement===document.body){notice.tabIndex=-1;notice.focus();}});notice.appendChild(b);}
    clearTimeout(notice._timer);if(!undo)notice._timer=setTimeout(function(){notice.classList.remove('up');},6000);
  }
  window.__sdToast=toast;
  function storageWarning(text){var el=$('#storagewarning');if(!el){el=document.createElement('p');el.id='storagewarning';el.className='wrap storagewarning';el.setAttribute('role','status');$('#main').prepend(el);}el.textContent=text;}
  var storage;try{storage=window.localStorage;}catch(_){storage={getItem:function(){throw new Error('Denied');}};}
  var state=core.createState(storage,storageWarning);
  function loadIndex(){if(catalog)return Promise.resolve(catalog);if(!catalogPromise)catalogPromise=core.fetchIndex(window.fetch.bind(window)).then(function(data){catalog=data;return data;}).catch(function(e){catalogPromise=null;throw e;});return catalogPromise;}
  function snapshotAction(field,slug,button){
    var before=state.read()[field].includes(slug),beforeOrder=state.read()[field].slice();
    var origin=button&&button.closest('#comparison')?'#comparison':button&&button.closest('#shelfmount')?'#shelfmount':'.recs';
    state.toggle(field,slug);sync();
    if(button&&button.closest('[hidden]')&&!button.closest('#comparison')){var f=$('#hidewatched');if(f)f.focus();}
    toast((field==='watched'?(before?'Marked unwatched.':'Marked watched. Your bookmark is unchanged.'):(before?'Removed from your shelf.':'Saved to your shelf.'))+(state.sessionOnly()?' This page session only.':''),function(){
      var next=state.read();next[field]=next[field].filter(function(s){return s!==slug;});
      if(before){var following=beforeOrder.slice(beforeOrder.indexOf(slug)+1).find(function(s){return next[field].includes(s);});next[field].splice(following?next[field].indexOf(following):next[field].length,0,slug);}
      state.write(next);sync();
      var root=$(origin),restored=root&&root.querySelector('[data-slug="'+slug+'"].'+(field==='watched'?'watched':'shelf'));
      if(restored&&!restored.closest('[hidden]'))restored.focus();else if($('#hidewatched')&&origin==='.recs')$('#hidewatched').focus();
    });
  }
  function actionButtons(slug){return '<button type="button" class="shelf" data-slug="'+esc(slug)+'" aria-pressed="false">Save for later</button> <button type="button" class="watched" data-slug="'+esc(slug)+'" aria-pressed="false">Already watched</button>';}
  document.addEventListener('click',function(e){var b=e.target.closest('button.shelf,button.watched');if(b)snapshotAction(b.classList.contains('watched')?'watched':'saved',b.dataset.slug,b);});
  var input=$('#q'),box=$('#sug'),resultList=[],cursor=-1,searchState='loading',searchWanted=false,searchStatus;
  function target(it){return(it.page?'/dramas-like/':'/dramas/')+it.slug+'/';}
  function closeSearch(){searchWanted=false;box.classList.remove('open');box.innerHTML='';input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');cursor=-1;if(searchStatus)searchStatus.hidden=true;}
  function drawSearch(){
    if(!input)return;var q=input.value.trim();if(!q||!searchWanted){closeSearch();return;}
    input.removeAttribute('aria-activedescendant');resultList=searchState==='ready'?core.search(catalog,q):[];
    box.innerHTML='';box.classList.remove('open');input.setAttribute('aria-expanded','false');searchStatus.hidden=false;
    if(searchState==='loading'){searchStatus.textContent='Loading titles...';return;}
    if(searchState==='error'){searchStatus.innerHTML='Could not load titles. <button type="button" id="searchretry">Retry search</button>';$('#searchretry').onclick=startSearch;return;}
    if(!resultList.length){searchStatus.innerHTML='No matching title. <a href="/collections/">Browse collections</a> or <a href="/contact/">request a title</a>.';return;}
    searchStatus.textContent=resultList.length+' suggestions. Use the arrow keys to choose.';if(cursor>=resultList.length)cursor=-1;
    box.innerHTML=resultList.map(function(it,i){return '<a id="suggestion-'+i+'" role="option" aria-selected="'+(i===cursor)+'" href="'+target(it)+'" class="'+(i===cursor?'cursor':'')+'"><span class="t">'+esc(it.t)+'</span><span class="tag">'+(it.page?'Recommendations':'Review')+(state.read().watched.includes(it.slug)?' · Watched':'')+'</span><span class="y tnum">'+esc(it.y)+'</span></a>';}).join('');
    box.classList.add('open');input.setAttribute('aria-expanded','true');if(cursor>=0)input.setAttribute('aria-activedescendant','suggestion-'+cursor);
  }
  function startSearch(){searchState='loading';drawSearch();loadIndex().then(function(){searchState='ready';drawSearch();}).catch(function(){searchState='error';drawSearch();});}
  if(input){
    input.maxLength=160;input.setAttribute('aria-autocomplete','list');searchStatus=document.createElement('div');searchStatus.className='searchstatus';searchStatus.id='searchstatus';searchStatus.setAttribute('role','status');box.after(searchStatus);input.setAttribute('aria-describedby','searchstatus');
    input.addEventListener('input',function(){searchWanted=true;cursor=-1;drawSearch();});input.addEventListener('focus',function(){searchWanted=true;drawSearch();});
    function submit(){if(resultList.length&&searchState==='ready'&&searchWanted)location.href=target(resultList[Math.max(0,cursor)]);else{searchWanted=true;drawSearch();}}
    input.addEventListener('keydown',function(e){if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();searchWanted=true;cursor=Math.max(0,Math.min(cursor+(e.key==='ArrowDown'?1:-1),resultList.length-1));drawSearch();}else if(e.key==='Enter'){e.preventDefault();submit();}else if(e.key==='Escape')closeSearch();});
    if($('#gobtn'))$('#gobtn').onclick=submit;
    document.addEventListener('click',function(e){if(!e.target.closest('.searchblock'))closeSearch();});document.addEventListener('focusin',function(e){if(!e.target.closest('.searchblock'))closeSearch();});startSearch();
  }
  var rows=$$('.rec'),filterChips=$$('.refine .chip'),refine=$('.refine-in');
  if(refine){var hide=document.createElement('button');hide.type='button';hide.id='hidewatched';hide.className='chip';hide.textContent="Hide dramas I've watched";hide.setAttribute('aria-pressed','false');refine.appendChild(hide);hide.onclick=function(){var next=state.read();next.hideWatched=!next.hideWatched;state.write(next);sync();};}
  var activeReason=null;
  function applyFilters(){
    var prefs=state.read(),on=filterChips.filter(function(c){return c.getAttribute('aria-pressed')==='true';}).map(function(c){return c.dataset.f;});
    var tests={light:function(d){return +d.heavy<=3;},short:function(d){return core.shortEpisodes(d.eps);},netflix:function(d){return(d.provs||'').split(',').some(function(p){return /^Netflix(?: |$)/i.test(p);});},romance:function(d){return +d.romance>=3;},slow:function(d){return +d.pace<=2;}};
    var visible=0;rows.forEach(function(r){r.hidden=(activeReason&&!activeReason.picks.some(function(p){return p.slug===r.dataset.slug;}))||(prefs.hideWatched&&prefs.watched.includes(r.dataset.slug))||!on.every(function(f){return tests[f]&&tests[f](r.dataset);});if(!r.hidden)visible++;});
    var count=$('.refine .count');if(count){count.textContent=visible+' of '+rows.length;count.setAttribute('role','status');}
    if($('.clearall'))$('.clearall').hidden=on.length===0&&!activeReason;if($('#nofilterhits'))$('#nofilterhits').hidden=visible!==0;if($('#hidewatched'))$('#hidewatched').setAttribute('aria-pressed',String(prefs.hideWatched));
  }
  var reasonPicker=$('.reasonpicker');
  if(reasonPicker){var reasons=[];try{reasons=JSON.parse(reasonPicker.dataset.reasons);}catch(_){}$('#reasonchoice').onchange=function(){activeReason=reasons.find(function(r){return r.id===$('#reasonchoice').value;})||null;var order=activeReason?activeReason.picks.map(function(p){return rows.find(function(r){return r.dataset.slug===p.slug;});}).filter(Boolean):rows;rows.forEach(function(r){var old=r.querySelector('.reasonfit');if(old)old.remove();});order.concat(rows.filter(function(r){return !order.includes(r);})).forEach(function(r,i){$('.recs').appendChild(r);r.querySelector('.rank').textContent=String(i+1).padStart(2,'0');});if(activeReason)activeReason.picks.forEach(function(p){var r=rows.find(function(r){return r.dataset.slug===p.slug;});if(r){var note=document.createElement('p');note.className='reasonfit';note.textContent=p.why;r.querySelector('.recbody').prepend(note);}});applyFilters();};}
  filterChips.forEach(function(c){c.onclick=function(){c.setAttribute('aria-pressed',String(c.getAttribute('aria-pressed')!=='true'));applyFilters();};});
  function clearFilters(){if($('#reasonchoice')){$('#reasonchoice').value='';$('#reasonchoice').onchange();}filterChips.forEach(function(c){c.setAttribute('aria-pressed','false');});applyFilters();}
  if($('.clearall'))$('.clearall').onclick=clearFilters;if($('#emptyclear'))$('#emptyclear').onclick=clearFilters;
  if($('#nofilterhits'))$('#nofilterhits').insertAdjacentHTML('beforeend','<p>Already watched everything? Turn off “Hide dramas I\'ve watched” above, or <a href="/collections/">try a different collection</a>. Your watched history is kept.</p>');
  var mount=$('#shelfmount'),sharedSlugs=null,shareError='',shelfReady=false;
  if(mount){try{sharedSlugs=core.shared(location.hash);}catch(e){shareError=e.message;}}
  function renderShelf(){
    if(!mount||!shelfReady)return;
    if(shareError){mount.innerHTML='<div class="empty"><h2>Cannot open this shared shelf</h2><p>'+esc(shareError)+'</p><a href="/my-shelf/">Open your own shelf</a></div>';return;}
    var ids=sharedSlugs===null?state.read().saved:sharedSlugs,items=ids.map(function(slug){return catalog.find(function(it){return it.slug===slug;});}).filter(Boolean),missing=ids.length-items.length;
    mount.innerHTML=(sharedSlugs!==null?'<div class="sharedbar"><p><b>Shared shelf.</b> These titles do not replace your own shelf.</p><button class="btn" id="keepshelf" type="button">Add these to my shelf</button> <a href="/my-shelf/">Back to mine</a></div>':'')+(missing?'<p role="status">'+missing+' saved titles are not in this catalog version. Their saved IDs are retained.</p>':'')+
      (!items.length?'<div class="empty"><h2>'+(sharedSlugs!==null?'No recognized shared titles.':'Your shelf is empty.')+'</h2><p>Save something you want to come back to.</p><a class="btn" href="/">Find a drama</a></div>':'<div class="gridlist shelfgrid">'+items.map(function(it){
        var img=/^https:\/\/image\.tmdb\.org\/t\/p\//.test(it.img||'')?'<img class="pix" src="'+esc(it.img)+'" srcset="'+esc(it.img.replace('/w500/','/w185/'))+' 185w, '+esc(it.img.replace('/w500/','/w342/'))+' 342w, '+esc(it.img)+' 500w" sizes="(max-width: 480px) 42vw, 190px" alt="" loading="lazy" width="500" height="750">':'<div class="pix"><span class="fallback">'+esc(it.t)+'</span></div>';
        return '<article class="shelfitem" data-item="'+it.slug+'" style="--hue:'+(Number(it.hue)||40)+'"><a class="gitem" href="/dramas/'+it.slug+'/"><div class="plate">'+img+'</div><h3>'+esc(it.t)+'</h3><p class="m tnum">'+esc(it.y)+'</p></a><div class="shelfactions">'+actionButtons(it.slug)+'</div></article>';
      }).join('')+'</div>');
    if($('#keepshelf'))$('#keepshelf').onclick=function(){var next=state.read();next.saved=core.slugs(next.saved.concat(items.map(function(it){return it.slug;})));state.write(next);syncButtons();toast('Shared titles added.'+(state.sessionOnly()?' This page session only.':''));};
  }
  function startShelf(){mount.innerHTML='<p role="status">Loading your shelf...</p>';loadIndex().then(function(){shelfReady=true;renderShelf();syncButtons();}).catch(function(){mount.innerHTML='<div class="empty"><h2>Could not load your shelf</h2><p>Your saved titles are unchanged.</p><button type="button" class="btn" id="shelfretry">Retry</button></div>';$('#shelfretry').onclick=startShelf;});}
  if(mount)startShelf();
  if($('#shelfshare'))$('#shelfshare').onclick=function(){if(shareError){toast(shareError);return;}var ids=sharedSlugs===null?state.read().saved:sharedSlugs;if(!ids.length){toast('Nothing to share yet.');return;}var url=location.origin+'/my-shelf/#s='+encodeURIComponent(ids.join(','));if(url.length>16000){toast('This shelf is too large for a share link. Share a smaller selection.');return;}var field=$('#sharelink');if(!field){var label=document.createElement('label');label.className='sharecopy';label.textContent='Anyone with this link can see these titles. Copy the link:';field=document.createElement('input');field.id='sharelink';field.readOnly=true;label.appendChild(field);$('.shelfbar').appendChild(label);}field.value=url;field.focus();field.select();if(navigator.clipboard)navigator.clipboard.writeText(url).then(function(){toast('Link copied. Anyone with it can see the shared titles.');}).catch(function(){toast('Select and copy the link shown beside Share.');});};
  var spoilerButtons=$$('.spoiler');
  if(spoilerButtons.length){var label=document.createElement('label');label.className='endingpref wrap';label.innerHTML='<input type="checkbox" id="endingtones"> Show ending tone labels (spoilers)';$('#main').prepend(label);$('#endingtones').onchange=function(){var next=state.read();next.showEndingTones=this.checked;state.write(next);spoilerButtons.forEach(function(b){b.dataset.open='false';});syncSpoilers();};}
  function syncSpoilers(){var show=state.read().showEndingTones;if($('#endingtones'))$('#endingtones').checked=show;spoilerButtons.forEach(function(b){var open=b.dataset.open==='true';b.classList.toggle('shown',open);b.setAttribute('aria-expanded',String(open));b.textContent=open?b.dataset.label+'. '+b.dataset.text+' (Hide ending)':(show?'Ending: '+b.dataset.label+' (reveal details)':'Reveal ending (spoiler)');});}
  spoilerButtons.forEach(function(b){b.onclick=function(){b.dataset.open=b.dataset.open==='true'?'false':'true';syncSpoilers();};});
  var regions={US:'the United States',GB:'the United Kingdom',CA:'Canada',AU:'Australia',IN:'India',PH:'the Philippines',ID:'Indonesia',BR:'Brazil'};
  function paintRegion(code){
    if(!regions[code])return;
    $$('.watch[data-watch]').forEach(function(el){
      var data;try{data=JSON.parse(el.dataset.watch);}catch(_){data={};}
      var providers=(data.p||{})[code]||[];el.dataset.region=code;
      el.innerHTML=core.streamingHtml(data,code,el.dataset.title||'',window.DR_WATCH,regions[code]);
      var note=el.nextElementSibling;if(note&&note.classList.contains('availabilitynote'))note.innerHTML=esc(core.availabilityText(data,code,regions[code]))+' <a href="https://www.justwatch.com/" target="_blank" rel="noopener">Check JustWatch</a>.';
      var rec=el.closest('.rec');if(rec)rec.dataset.provs=providers.join(',');
    });
    $$('.regionsel').forEach(function(s){s.value=code;});$$('.regionname').forEach(function(n){n.textContent=regions[code];});applyFilters();
  }
  var initialRegion;try{initialRegion=storage.getItem('sd.region');}catch(_){}
  var firstWatch=$('.watch[data-watch]');paintRegion(regions[initialRegion]?initialRegion:firstWatch&&firstWatch.dataset.region||'US');
  $$('.regionsel').forEach(function(s){s.onchange=function(){if(!regions[s.value])return;try{storage.setItem('sd.region',s.value);if(storage.getItem('sd.region')!==s.value)throw new Error('Not persisted');}catch(_){storageWarning('Region preference lasts for this page session only.');}paintRegion(s.value);toast('Streaming rows updated. Fixed-region collections do not change membership.');};});
  var compare=[],compareMount;
  if(rows.length){
    compareMount=document.createElement('section');compareMount.className='wrap comparison';compareMount.hidden=true;compareMount.id='comparison';compareMount.tabIndex=-1;compareMount.setAttribute('aria-label','Compare your shortlist');$('.recs').parentNode.appendChild(compareMount);
    rows.forEach(function(r){var b=document.createElement('button');b.type='button';b.className='comparebtn';b.textContent='Compare';b.setAttribute('aria-pressed','false');r.querySelector('.recfoot').appendChild(b);b.onclick=function(){var i=compare.indexOf(r);if(i>=0)compare.splice(i,1);else if(compare.length<3)compare.push(r);else{toast('Choose up to three dramas. Remove one first.');return;}b.setAttribute('aria-pressed',String(compare.includes(r)));renderCompare();toast(compare.length+' selected. Comparison is below the recommendations.');};});
  }
  function renderCompare(){
    if(!compareMount)return;compareMount.hidden=!compare.length;
    compareMount.innerHTML='<h2>Compare your shortlist</h2><p>Same catalog facts. Ending tone labels stay out of this comparison, but the existing fit and caveat text may discuss plot outcomes. Up to three titles.</p><div class="comparegrid">'+compare.map(function(r){return '<article data-compare-item="'+r.dataset.slug+'"><h3>'+r.querySelector('.rectitle').innerHTML+'</h3><p>'+esc((r.querySelector('.commitment')||r.querySelector('.recmeta')).textContent)+'</p><p>'+esc(r.querySelector('.why').textContent)+'</p><p>'+esc(r.querySelector('.difference')?r.querySelector('.difference').textContent:'Read the full comparison for tradeoffs.')+'</p><p>'+(state.read().watched.includes(r.dataset.slug)?'Watched':'Not marked watched')+'</p>'+actionButtons(r.dataset.slug)+'<button type="button" class="comparebtn compareremove" data-slug="'+r.dataset.slug+'">Remove from comparison</button></article>';}).join('')+'</div>';
    compareMount.querySelectorAll('.compareremove').forEach(function(b){b.onclick=function(){
      var index=compare.findIndex(function(r){return r.dataset.slug===b.dataset.slug;});if(index<0)return;
      var removed=compare[index];compare.splice(index,1);removed.querySelector('.comparebtn').setAttribute('aria-pressed','false');renderCompare();
      var next=compare[Math.min(index,compare.length-1)],target=next&&compareMount.querySelector('.compareremove[data-slug="'+next.dataset.slug+'"]');
      if(!target&&!removed.hidden)target=removed.querySelector('.comparebtn');if(!target)target=$('#hidewatched')||$('.clearall');if(target)target.focus();toast(compare.length+' selected for comparison.');
    };});syncButtons();
  }
  function syncButtons(){var prefs=state.read();$$('button.shelf').forEach(function(b){var saved=prefs.saved.includes(b.dataset.slug);b.setAttribute('aria-pressed',String(saved));b.textContent=saved?(b.closest('#shelfmount')?'Remove':'On your shelf'):'Save for later';});$$('button.watched').forEach(function(b){var watched=prefs.watched.includes(b.dataset.slug);b.setAttribute('aria-pressed',String(watched));b.textContent=watched?'Watched (undo)':'Already watched';});}
  function sync(){
    var focus=document.activeElement,slug=focus&&focus.dataset&&focus.dataset.slug,watchedAction=focus&&focus.classList.contains('watched');
    var focusRoot=focus&&focus.closest('#comparison')?compareMount:focus&&focus.closest('#shelfmount')?mount:null;
    var shelfOrder=mount?Array.from(mount.querySelectorAll('.shelfitem')).map(function(el){return el.dataset.item;}):[],compareRemove=focus&&focus.classList.contains('compareremove');
    renderShelf();syncButtons();applyFilters();syncSpoilers();renderCompare();
    if(focusRoot&&slug){
      var kind=compareRemove?'compareremove':watchedAction?'watched':'shelf',replacement=focusRoot.querySelector('[data-slug="'+slug+'"].'+kind);
      if(!replacement&&focusRoot===mount){var remaining=Array.from(mount.querySelectorAll('.shelfitem')),neighbor=remaining[Math.min(Math.max(0,shelfOrder.indexOf(slug)),remaining.length-1)];replacement=neighbor&&neighbor.querySelector('button.shelf');if(!replacement)replacement=mount.querySelector('.empty a');}
      if(replacement)replacement.focus();else{focusRoot.tabIndex=-1;focusRoot.focus();}
    }else if(focus&&focus.closest&&focus.closest('.rec[hidden]')&&$('#hidewatched'))$('#hidewatched').focus();
    if(input&&searchWanted)drawSearch();
  }
  window.addEventListener('storage',function(e){if(e.key==='dr.state.v1'||e.key===null){state.refresh();sync();}});sync();
})();
