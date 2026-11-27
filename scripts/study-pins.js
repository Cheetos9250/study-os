/* Pinned formulas and note cards (Study OS, 18 Nov 2026).
   - Pins: one per line in the backed-up, synced notes (studyos.notes.v1, key "<course>:pins"), e.g.
       COGS :: Beginning inventory + Net purchases − Ending inventory
     Shown at the top of Practice (practice.html, editable) and of each course's practice tab.
   - Note cards: any line "question :: answer" in a chapter note becomes a flip card (in Cram Mode and the Notes panel).
   - Cram Mode (acc/eco/math.html?tab=prac&cram=1): the engine lists the questions to fix; this file adds the pins and
     all of the course's note cards above them.
   No new storage key; notes are only written when the owner edits pins. */
(function(root,factory){
 'use strict';const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyPins=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const KEY='studyos.notes.v1',MAX=20000,NAMES={acc:'Accounting',eco:'Economics',math:'Math'};
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 /* "title :: body" lines; other non-empty lines are pins without a title. Lines starting with // are comments. */
 function parsePins(text){
  return String(text||'').split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('//')).slice(0,60).map(l=>{
   const i=l.indexOf('::');return i>0?{title:l.slice(0,i).trim(),body:l.slice(i+2).trim()}:{title:'',body:l};});
 }
 /* "question :: answer" lines (both sides non-empty) */
 function parseCards(text){
  const out=[];for(const raw of String(text||'').split('\n')){const l=raw.trim().replace(/^[-•*]\s*/,''),i=l.indexOf('::');
   if(i>0){const q=l.slice(0,i).trim(),a=l.slice(i+2).trim();if(q&&a)out.push({q,a});}}
  return out;
 }
 if(typeof document==='undefined')return {parsePins,parseCards,KEY};

 function all(){try{const o=JSON.parse(localStorage.getItem(KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
 function pinText(c){const n=all()[c+':pins'];return n&&typeof n.text==='string'?n.text:'';}
 function savePins(c,text){const notes=all(),k=c+':pins';text=String(text).slice(0,MAX);
  const nn=(root.StudyNoteImages?root.StudyNoteImages.withText:function(o,t,u){var im=o&&Array.isArray(o.imgs)&&o.imgs.length?o.imgs:null;if(!String(t).trim()&&!im)return null;var n={text:t,updated:u};if(im)n.imgs=im;return n;})(notes[k],text,new Date().toISOString());if(nn)notes[k]=nn;else delete notes[k];
  localStorage.setItem(KEY,JSON.stringify(notes));if(root.StudyCloud&&root.StudyCloud.dirty)root.StudyCloud.dirty();}
 function courseCards(c,labelOf){const notes=all(),out=[];
  for(const k of Object.keys(notes)){if(!k.startsWith(c+':')||k===c+':pins')continue;const n=notes[k];if(!n||typeof n.text!=='string')continue;
   const ch=k.slice(c.length+1);for(const x of parseCards(n.text))out.push(Object.assign({ch:labelOf?labelOf(ch):ch},x));}
  return out;}

 const CSS=''
 +'.sp-pins{border:var(--bw,3px) solid var(--ink,#111);border-radius:var(--r,8px);background:var(--panel,var(--surface,#fff));color:var(--text,var(--ink,#111));padding:10px 14px;margin:0 0 14px}'
 +'.sp-pins summary{cursor:pointer;font-weight:900;min-height:40px;display:flex;align-items:center;gap:8px}'
 +'.sp-pins ul{list-style:none;margin:6px 0 4px;padding:0;display:grid;gap:6px}'
 +'.sp-pins li{border-left:4px solid var(--acc,#d43a2a);padding:4px 10px;font-size:15px;line-height:1.5;overflow-wrap:anywhere}'
 +'.sp-pins li b{display:block;font-size:13px}'
 +'.sp-pins .sp-none{font-size:14px;color:var(--muted,#555);margin:4px 0}'
 +'.sp-pins textarea{width:100%;min-height:150px;font-size:15px;line-height:1.6;font-family:inherit;padding:8px 10px;border:2px solid var(--ink,#111);border-radius:6px;background:var(--panel,var(--surface,#fff));color:inherit;box-sizing:border-box}'
 +'.sp-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}'
 +'.sp-b{min-height:44px;padding:0 14px;border:2.5px solid var(--ink,#111);border-radius:6px;background:var(--panel,var(--surface,#fff));color:inherit;font-weight:700;font-size:14px;font-family:inherit;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}'
 +'.sp-b.primary{background:var(--ink,#111);color:var(--accent-ink,var(--paper,#fff))}'
 +'.sp-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 6px}.sp-tabs button{min-height:40px;padding:0 14px;border-radius:999px;border:2px solid var(--ink,#111);background:var(--panel,var(--surface,#fff));color:inherit;font-weight:700;font-family:inherit;cursor:pointer}.sp-tabs button[aria-pressed="true"]{background:var(--ink,#111);color:var(--panel,var(--paper,#fff))}'
 +'.sp-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin:6px 0}'
 +'.sp-card{min-height:96px;text-align:left;border:2px solid var(--ink,#111);border-radius:8px;background:var(--panel,var(--surface,#fff));color:inherit;padding:10px 12px;font-family:inherit;font-size:15px;line-height:1.5;cursor:pointer;overflow-wrap:anywhere}'
 +'.sp-card small{display:block;font-size:12px;color:var(--muted,#555);margin-bottom:4px}.sp-card.on{background:var(--acc-soft,var(--accent-soft,#fde8e5))}'
 +'.cram-head{font-size:15px;margin:0 0 12px}.cram-head a{font-weight:700}'
 +'.cram-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}.cram-list .qmeta{display:flex;gap:10px;align-items:center}'
 +'.cram-tag{font-size:12px;border:2px solid currentColor;border-radius:4px;padding:0 6px;color:var(--bad,#b3261e)}.cram-tag.soft{color:var(--muted,#555)}'
 +'.cram-mine{font-size:14px;color:var(--bad,#b3261e);margin:4px 0}'
 +'@media print{.sp-pins .sp-row,#studyNav,#qnBtn,#calcBtn{display:none!important}}';
 function css(){if(document.getElementById('spCss'))return;const s=document.createElement('style');s.id='spCss';s.textContent=CSS;document.head.appendChild(s);}
 function pinsHTML(c){const p=parsePins(pinText(c));
  return p.length?'<ul>'+p.map(x=>'<li>'+(x.title?'<b>'+esc(x.title)+'</b>':'')+esc(x.body)+'</li>').join('')+'</ul>'
   :'<p class="sp-none">None yet.</p>';}
 const EXAMPLE={acc:'COGS :: Beginning inventory + Net purchases − Ending inventory\nGross profit :: Net sales − COGS\nAdjusted bank balance :: Bank + Deposits in transit − Outstanding checks',
  eco:'GDP (expenditure) :: C + I + G + (X − M)\nInflation rate :: (CPI now − CPI before) ÷ CPI before × 100\nMoney multiplier :: 1 ÷ reserve ratio',
  math:'Simple interest :: I = P × r × t\nCompound amount :: A = P(1 + r/n)^(nt)\nP(A or B) :: P(A) + P(B) − P(A and B)'};
 /* an editable pins box; c may change (tabs on practice.html) */
 function pinsBox(el,c,open){
  let editing=false;
  function paint(){const n=parsePins(pinText(c)).length;
   el.innerHTML='<details class="sp-pins"'+(open||editing?' open':'')+'><summary>📌 Pinned formulas · '+esc(NAMES[c]||c)+' <span style="font-weight:500">('+n+')</span></summary>'
    +(editing?'<textarea aria-label="Pinned formulas, one per line" placeholder="'+esc(EXAMPLE[c]||'Title :: formula')+'">'+esc(pinText(c))+'</textarea><div class="sp-row"><button type="button" class="sp-b primary" data-sp="save">Save</button><button type="button" class="sp-b" data-sp="cancel">Cancel</button><span style="font-size:13px">One per line · <code>title :: formula</code> · synced with your notes</span></div>'
     :pinsHTML(c)+'<div class="sp-row"><button type="button" class="sp-b" data-sp="edit">Edit</button>'+(NAMES[c]?'<a class="sp-b" href="'+c+'.html?tab=prac&cram=1">Cram Mode</a>':'')+'</div>')+'</details>';
   el.querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{const a=b.dataset.sp;
    if(a==='edit'){editing=true;paint();const t=el.querySelector('textarea');if(t)t.focus();}
    else if(a==='cancel'){editing=false;paint();}
    else if(a==='save'){try{savePins(c,el.querySelector('textarea').value);}catch(e){alert('Could not save (storage full?)');return;}editing=false;paint();}});
  }
  paint();return {set(nc){c=nc;editing=false;paint();}};
 }
 function cardsHTML(list){return '<div class="sp-cards">'+list.map((x,i)=>'<button type="button" class="sp-card" data-i="'+i+'" aria-pressed="false"><small>'+esc(x.ch||'')+' · tap to flip</small><span>'+esc(x.q)+'</span></button>').join('')+'</div>';}
 function wireCards(el,list){el.querySelectorAll('.sp-card').forEach(b=>b.onclick=()=>{const on=b.getAttribute('aria-pressed')!=='true',x=list[+b.dataset.i];
  b.setAttribute('aria-pressed',String(on));b.classList.toggle('on',on);b.querySelector('span').textContent=on?x.a:x.q;b.querySelector('small').textContent=(x.ch||'')+(on?' · answer':' · tap to flip');});}

 /* course pages (acc/eco/math, practice mode): pins on top; in Cram Mode also every note card of the course */
 function mountCourse(){
  const key=typeof D==='object'&&D&&D.key;if(!NAMES[key])return;
  const tab=document.getElementById('tab-prac');if(!tab||document.getElementById('spCourse'))return;
  css();const wrap=document.createElement('div');wrap.id='spCourse';tab.insertBefore(wrap,tab.firstChild);
  const cram=/[?&]cram=1\b/.test(location.search),pins=document.createElement('div');wrap.appendChild(pins);if(cram||parsePins(pinText(key)).length)pinsBox(pins,key,cram); /* no pins yet: nothing on the practice page (add them on Practice) */
  if(cram){const label=id=>{const c=(D.cats||[]).find(x=>x[0]===id);return id==='general'?'General':c?c[1]:id;},list=courseCards(key,label),box=document.createElement('section');
   box.className='sp-pins';box.innerHTML='<b>🃏 Note cards ('+list.length+')</b>'+(list.length?cardsHTML(list):'<p class="sp-none">Write lines like <code>Normal balance of AR :: Debit</code> in your chapter notes and they show up here as flip cards.</p>');
   wrap.appendChild(box);wireCards(box,list);document.title=(NAMES[key])+' · Cram Mode — Study OS';
   const sub=document.querySelector('header span');if(sub)sub.textContent='Cram Mode';}
 }
 /* practice.html: pins for each course with tabs */
 function mountPractice(el){css();const keys=Object.keys(NAMES);let c=keys[0];
  if(!keys.some(k=>parsePins(pinText(k)).length)){/* nothing pinned: no empty box, only the Cram Mode links */
   el.innerHTML='<div class="sp-tabs" role="group" aria-label="Cram Mode">'+keys.map(k=>'<a class="sp-b" href="'+k+'.html?tab=prac&cram=1">Cram Mode · '+NAMES[k]+'</a>').join('')+'</div>';return;}
  try{const s=sessionStorage.getItem('studyos.pins.tab');if(NAMES[s])c=s;}catch(e){}
  el.innerHTML='<div class="sp-tabs" role="group" aria-label="Subject">'+keys.map(k=>'<button type="button" data-c="'+k+'" aria-pressed="'+(k===c)+'">'+NAMES[k]+'</button>').join('')+'</div><div></div>';
  const box=pinsBox(el.lastElementChild,c,true);
  el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{c=b.dataset.c;try{sessionStorage.setItem('studyos.pins.tab',c);}catch(e){}
   el.querySelectorAll('[data-c]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));box.set(c);});}
 function auto(){const p=document.getElementById('pinsPanel');if(p)mountPractice(p);else mountCourse();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',auto);else auto();
 return {parsePins,parseCards,KEY,pinText,savePins,courseCards,cardsHTML,wireCards,css};
});
