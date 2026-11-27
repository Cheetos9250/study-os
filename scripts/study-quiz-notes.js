/* Quiz notes: a notepad beside the quiz on course pages (?tab=prac), one note per chapter.
   Notes live in the backed-up key studyos.notes.v1 as "<course>:<chapter>" (and "<course>:general"),
   the same notes the Lessons page shows, so a chapter's note is the same in both places.
   It re-reads the stored notes before every write, so notes saved elsewhere are kept. */
(function(){
 'use strict';
 if(typeof document==='undefined')return;
 var KEY='studyos.notes.v1',MAX=20000;
 function course(){return typeof D==='object'&&D&&typeof D.key==='string'?D.key:'';}
 function cats(){return typeof CATS!=='undefined'&&Array.isArray(CATS)?CATS:(typeof D==='object'&&D&&Array.isArray(D.cats)?D.cats:[]);}
 function all(){try{var o=JSON.parse(localStorage.getItem(KEY)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
 function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 var CSS=''
 +'#qnBtn,#qn{--qn-ink:#111;--qn-paper:#fff;--qn-mute:#555;--qn-rule:#e2e2df;--qn-acc:var(--acc,#d43a2a);--qn-acc-ink:var(--acc-ink,#fff);font-family:"Zen Maru Gothic","Mali",system-ui,-apple-system,sans-serif;box-sizing:border-box}'
 +'@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) #qnBtn,:root:not([data-theme="light"]) #qn{--qn-ink:#f0f0ee;--qn-paper:#171718;--qn-mute:#a9a9a6;--qn-rule:#333335;--qn-acc:#ff8a7a;--qn-acc-ink:#0e0e0f}}'
 +':root[data-theme="dark"] #qnBtn,:root[data-theme="dark"] #qn{--qn-ink:#f0f0ee;--qn-paper:#171718;--qn-mute:#a9a9a6;--qn-rule:#333335;--qn-acc:#ff8a7a;--qn-acc-ink:#0e0e0f}'
 +'#qnBtn{position:fixed;z-index:72;right:max(16px,env(safe-area-inset-right));bottom:calc(16px + env(safe-area-inset-bottom));display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 18px;border:3px solid var(--qn-ink);border-radius:6px;background:var(--qn-acc);color:var(--qn-acc-ink);font-weight:900;font-size:15px;cursor:pointer}'
 +'#qnBtn svg{width:20px;height:20px}'
 +'#qnBtn:focus-visible,#qn button:focus-visible,#qn select:focus-visible{outline:3px solid var(--qn-ink);outline-offset:3px}'
 +'#qn{position:fixed;z-index:80;display:flex;flex-direction:column;background:var(--qn-paper);color:var(--qn-ink);border:3px solid var(--qn-ink)}'
 +'#qn[hidden]{display:none}'
 +'#qn .qn-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 12px;border-bottom:3px solid var(--qn-ink)}'
 +'#qn .qn-t{font:700 19px/1.2 "Kaisei Decol",serif;margin:0 4px 0 0}'
 +'#qn select{flex:1;min-width:0;min-height:42px;border:2.5px solid var(--qn-ink);border-radius:6px;background:var(--qn-paper);color:var(--qn-ink);font-weight:700;font-size:14px;font-family:inherit;padding:0 8px}'
 +'#qn .qn-x{min-width:44px;min-height:42px;border:2.5px solid var(--qn-ink);border-radius:6px;background:var(--qn-paper);color:var(--qn-ink);cursor:pointer;display:inline-grid;place-items:center}'
 +'#qn .qn-x svg{width:18px;height:18px}'
 +'#qn .qn-s{width:100%;font-weight:700;font-size:13px;font-family:inherit;color:var(--qn-mute)}'
 +'#qn .qn-s.err{color:#c21f2f}'
 +'#qn textarea{flex:1;min-height:0;width:100%;resize:none;border:0;margin:0;padding:6px 18px 28px;font-weight:500;font-size:16px;line-height:32px;font-family:inherit;color:var(--qn-ink);background:repeating-linear-gradient(to bottom,transparent 0 31px,var(--qn-rule) 31px 32px) 0 6px/100% 32px local,var(--qn-paper);caret-color:var(--qn-acc);box-sizing:border-box}'
 +'#qn textarea:focus{outline:none}'
 +'#qn .qn-c{min-height:42px;padding:0 12px;border:2.5px solid var(--qn-ink);border-radius:6px;background:var(--qn-paper);color:var(--qn-ink);font-weight:700;font-size:14px;font-family:inherit;cursor:pointer}'
 +'#qn .qn-c[aria-pressed="true"]{background:var(--qn-ink);color:var(--qn-paper)}'
 +'#qn .qn-cards{flex:1;min-height:0;overflow-y:auto;padding:10px 12px 20px;display:grid;gap:8px;align-content:start}'
 +'#qn .qn-cards[hidden]{display:none}'
 +'#qn .qn-card{min-height:72px;text-align:left;border:2px solid var(--qn-ink);border-radius:8px;background:var(--qn-paper);color:var(--qn-ink);padding:10px 12px;font-family:inherit;font-size:15px;line-height:1.5;cursor:pointer;overflow-wrap:anywhere}'
 +'#qn .qn-card small{display:block;font-size:12px;color:var(--qn-mute);margin-bottom:4px}'
 +'#qn .qn-card.on{border-color:var(--qn-acc)}'
 +'#qn .qn-empty{font-size:14px;color:var(--qn-mute);margin:6px 2px}'
 +'#qn textarea::placeholder{color:var(--qn-mute)}'
 /* wide screens: a column on the right; the page shrinks so the question stays visible */
 +'@media(min-width:1000px){#qn{top:0;right:0;bottom:0;width:min(380px,32vw);border-width:0 0 0 3px}html.qn-open body{padding-right:min(380px,32vw)!important}html.qn-open #qnBtn{display:none}}'
 /* narrow screens: the lower part of the screen, above the tab bar; the quiz scrolls above it */
 +'@media(max-width:999.98px){#qn{left:0;right:0;bottom:calc(72px + env(safe-area-inset-bottom));height:min(46vh,420px);border-width:3px 0 3px}html.qn-open body{padding-bottom:calc(72px + min(46vh,420px) + env(safe-area-inset-bottom))!important}#qnBtn{bottom:calc(84px + env(safe-area-inset-bottom))}html.qn-open #qnBtn{display:none}}'
 +'html.qn-ready:not(.qn-open) body{padding-bottom:calc(88px + env(safe-area-inset-bottom))!important}'
 +'@media(max-width:899.98px){html.qn-ready:not(.qn-open) body{padding-bottom:calc(150px + env(safe-area-inset-bottom))!important}}'
 +'@media(max-width:899.98px){#qnBtn{width:52px;padding:0;justify-content:center}#qnBtn span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}'
 +'@media(min-width:900px){html.qn-ready:not(.qn-open) body{padding-right:76px!important}html.qn-ready:not(.qn-open) #qnBtn{right:max(12px,env(safe-area-inset-right));width:52px;padding:0;justify-content:center}html.qn-ready:not(.qn-open) #qnBtn span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}'
 +'#qn.full{top:0!important;right:0!important;bottom:0!important;left:0!important;width:auto!important;height:auto!important;z-index:96;border-width:0!important;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}'
 +'html.qn-full,html.qn-full body{overflow:hidden}'
 +'#qn .qn-hint{width:100%;font-size:12px;color:var(--qn-mute);margin:-2px 0 0}'
 +'@media(hover:hover) and (pointer:fine){#qn .qn-hint{display:none}}'
 +'@media print{#qn,#qnBtn{display:none}}';
 var PEN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4.5l5 5L9 20H4v-5z"/><path d="M12.5 6.5l5 5"/></svg>';
 var X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
 var FULL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',SMALL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
 var ck='',chap='general',pinned=false,timer=null,panel,ta,sel,st,btn;
 function key(){return ck+':'+chap;}
 function label(id){if(id==='general')return 'General';var c=cats().find(function(x){return x[0]===id;});return c?c[1]:id;}
 function status(text,err){st.textContent=text;st.classList.toggle('err',!!err);}
 function load(){if(panel&&panel.__ni&&window.StudyNoteImages)window.StudyNoteImages.refresh(panel.__ni);var n=all()[key()];ta.value=n&&typeof n.text==='string'?n.text:'';sel.value=chap;ta.placeholder='Notes for '+label(chap)+'. They also show on the Lessons page.';status(ta.value?'Saved · '+ta.value.length.toLocaleString('en-US')+' characters':'Saved on this device');}
 function save(){clearTimeout(timer);timer=null;var notes=all(),k=key(),text=ta.value.slice(0,MAX);
  var nn=(window.StudyNoteImages?window.StudyNoteImages.withText:function(o,t,u){var im=o&&Array.isArray(o.imgs)&&o.imgs.length?o.imgs:null;if(!String(t).trim()&&!im)return null;var n={text:t,updated:u};if(im)n.imgs=im;return n;})(notes[k],text,new Date().toISOString());if(nn)notes[k]=nn;else delete notes[k]; /* keeps the note's pictures */
  try{localStorage.setItem(KEY,JSON.stringify(notes));if(window.StudyCloud)window.StudyCloud.dirty();status('Saved · '+text.length.toLocaleString('en-US')+' characters');}
  catch(e){status('Not saved: storage is full',true);}}
 function flush(){if(timer)save();}
 /* chapter of the question on screen: the page shows its label in .qmeta; map it back to the chapter id */
 function current(){var m=document.querySelector('#qBody .qmeta span');if(m){var t=m.textContent.trim(),c=cats().find(function(x){return x[1]===t;});if(c)return c[0];}
  if(typeof qcats!=='undefined'&&qcats&&qcats.size===1)return Array.from(qcats)[0];return null;}
 function follow(){if(pinned)return;var c=current();if(c&&c!==chap){flush();chap=c;load();}}
 function setFull(on){panel.classList.toggle('full',on);document.documentElement.classList.toggle('qn-full',on);var f=panel.querySelector('.qn-f');f.innerHTML=on?SMALL:FULL;f.setAttribute('aria-pressed',String(on));f.setAttribute('aria-label',on?'Exit full screen':'Full screen');}
 function setOpen(on){if(!on)setFull(false);panel.hidden=!on;document.documentElement.classList.toggle('qn-open',on);btn.setAttribute('aria-expanded',String(on));if(on){follow();load();ta.focus({preventScroll:true});}else{flush();btn.focus({preventScroll:true});}}
 function mount(){
  ck=course();if(!ck||document.documentElement.getAttribute('data-mode')!=='prac'||!document.getElementById('tab-prac')||document.getElementById('qn'))return;
  var s=document.createElement('style');s.id='qnCss';s.textContent=CSS;document.head.appendChild(s);
  btn=document.createElement('button');btn.type='button';btn.id='qnBtn';btn.setAttribute('aria-controls','qn');btn.setAttribute('aria-label','Notes');btn.title='Notes';btn.setAttribute('aria-expanded','false');btn.innerHTML=PEN+'<span>Notes</span>';
  panel=document.createElement('aside');panel.id='qn';panel.hidden=true;panel.setAttribute('aria-label','Chapter notes');
  var opts='<option value="general">General</option>'+cats().map(function(c){return '<option value="'+esc(c[0])+'">'+esc(c[1])+'</option>';}).join('');
  panel.innerHTML='<div class="qn-bar"><h2 class="qn-t">Notes</h2><select aria-label="Chapter">'+opts+'</select><button type="button" class="qn-c" aria-pressed="false" title="Lines written as question :: answer become flip cards">Cards</button><button type="button" class="qn-x qn-f" aria-pressed="false" aria-label="Full screen"></button><button type="button" class="qn-x" aria-label="Close notes">'+X+'</button><span class="qn-s" role="status"></span><p class="qn-hint">Swipe from the right towards the left to open notes full screen; swipe right to go back.</p></div><textarea maxlength="'+MAX+'" spellcheck="true" aria-label="Chapter notes"></textarea><div class="qn-cards" hidden></div>';
  document.body.appendChild(panel);document.body.appendChild(btn);document.documentElement.classList.add('qn-ready');
  ta=panel.querySelector('textarea');sel=panel.querySelector('select');st=panel.querySelector('.qn-s');
  /* pictures in the note (paste or Add image), synced with it */
  if(window.StudyNoteImages){var ni=document.createElement('div');ni.className='qn-img';ni.style.cssText='border-top:2px solid var(--qn-rule);max-height:40%;overflow-y:auto;flex:none';ta.insertAdjacentElement('afterend',ni);window.StudyNoteImages.mount(ni,key,ta);panel.__ni=ni;}
  /* note cards: lines "question :: answer" in this chapter's note, as flip cards; the note itself is not changed */
  var cb=panel.querySelector('.qn-c'),cv=panel.querySelector('.qn-cards');
  function cardsOn(on){cb.setAttribute('aria-pressed',String(on));cv.hidden=!on;ta.hidden=on;if(on){flush();paintCards();}else ta.focus({preventScroll:true});}
  function paintCards(){var list=[];ta.value.split('\n').forEach(function(raw){var l=raw.trim().replace(/^[-•*]\s*/,''),i=l.indexOf('::');if(i>0){var q=l.slice(0,i).trim(),a=l.slice(i+2).trim();if(q&&a)list.push({q:q,a:a});}});
   cv.innerHTML=list.length?list.map(function(x,i){return '<button type="button" class="qn-card" data-i="'+i+'" aria-pressed="false"><small>Card '+(i+1)+' of '+list.length+' · tap to flip</small><span>'+esc(x.q)+'</span></button>';}).join('')
    :'<p class="qn-empty">No cards in this chapter yet. In your note, write one per line:<br><b>question :: answer</b><br>e.g. Normal balance of Accounts Receivable :: Debit</p>';
   cv.querySelectorAll('.qn-card').forEach(function(b){b.onclick=function(){var on=b.getAttribute('aria-pressed')!=='true',x=list[+b.dataset.i];b.setAttribute('aria-pressed',String(on));b.classList.toggle('on',on);b.querySelector('span').textContent=on?x.a:x.q;};});}
  cb.onclick=function(){cardsOn(cv.hidden);};
  sel.addEventListener('change',function(){if(!cv.hidden)setTimeout(paintCards,0);});
  btn.onclick=function(){setOpen(true);};
  panel.querySelector('.qn-x:not(.qn-f)').onclick=function(){setOpen(false);};
  panel.querySelector('.qn-f').onclick=function(){if(panel.hidden)setOpen(true);setFull(!panel.classList.contains('full'));ta.focus({preventScroll:true});};
  setFull(false);
  /* swipe from the right side towards the left: notes open full screen; swipe right on the full-screen notes: back to the quiz.
     The outermost edge strips are left to Safari's own back/forward gestures. */
  var sx=0,sy=0,st0=0,on=false;
  var inCard=false;
  document.addEventListener('touchstart',function(e){if(e.touches.length!==1){on=false;return;}var t=e.touches[0];on=t.clientX>16&&t.clientX<innerWidth-16;inCard=!!(e.target.closest&&e.target.closest('.qcard'));sx=t.clientX;sy=t.clientY;st0=Date.now();},{passive:true});
  document.addEventListener('touchend',function(e){if(!on)return;on=false;var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Date.now()-st0>700||Math.abs(dx)<90||Math.abs(dy)>Math.abs(dx)*0.5)return;
   var full=panel.classList.contains('full'),inPanel=panel.contains(e.target);
   if(dx<0&&!full&&!inPanel&&(inCard?sx>innerWidth-64:sx>innerWidth*0.45)){if(panel.hidden)setOpen(true);setFull(true);ta.focus({preventScroll:true});}
   else if(dx>0&&full&&sx>28){setFull(false);setOpen(false);}},{passive:true});
  sel.onchange=function(){flush();chap=sel.value;pinned=chap!==current();load();ta.focus();};
  ta.addEventListener('input',function(){status('Saving…');clearTimeout(timer);timer=setTimeout(save,500);});
  ta.addEventListener('blur',flush);
  window.addEventListener('pagehide',flush);
  /* other note writers on the page (Ask AI → Save to note) flush this panel first, then ask it to reload */
  document.addEventListener('studyos:notes-flush',flush);
  document.addEventListener('studyos:notes-changed',function(){if(!timer)load();});
  document.addEventListener('visibilitychange',function(){if(document.hidden)flush();else if(!timer&&document.activeElement!==ta&&!panel.hidden)load();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden){if(panel.classList.contains('full'))setFull(false);else setOpen(false);}});
  /* follow the quiz: when the question on screen moves to another chapter, the note follows (unless a chapter was picked by hand) */
  var body=document.getElementById('qBody'),last=null;
  if(body&&typeof MutationObserver==='function')new MutationObserver(function(){var c=current();if(c!==last){last=c;pinned=false;if(!panel.hidden)follow();else if(c)chap=c;}}).observe(body,{childList:true,subtree:true});
  var c0=current();if(c0)chap=c0;
 }
 if(typeof module==='object'&&module.exports)module.exports={KEY:KEY};
 else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
