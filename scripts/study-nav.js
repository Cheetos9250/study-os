/* Study OS navigation: left sidebar on wide screens, bottom tab bar on narrow ones.
   Reads and writes no study data. The theme control uses window.StudyTheme. */
(function(){
 'use strict';
 if(typeof document==='undefined'||document.getElementById('studyNav'))return;
 var TABS=[
  {id:'today',href:'index.html',icon:'today',label:'Today'},
  {id:'cards',href:'flashcards.html',icon:'cards',label:'Flashcards'},
  {id:'practice',href:'practice.html',icon:'practice',label:'Practice'},
  {id:'lessons',href:'hub.html',icon:'lessons',label:'Lessons'},
  {id:'calendar',href:'calendar.html',icon:'calendar',label:'Calendar'}
 ];
 var MORE=[
  {href:'grades.html',label:'Grades',icon:'grades'},
 {href:'stats.html',label:'Stats',icon:'stats'},
  {href:'desk.html',label:'Desk display',icon:'desk'},
  {href:'tutor.html',label:'AI tutor',icon:'tutor'},
  {href:'gemini.html',label:'Share with Gemini',icon:'tutor'},
  {href:'feedback.html?from='+((location.pathname.split('/').pop()||'index').replace(/\.html$/i,'')||'index'),label:'Feedback',icon:'feedback'},
  {href:'progress-backup.html',label:'Back up',icon:'backup'},
  {href:'progress-restore.html',label:'Restore',icon:'restore'}
 ];
 var file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
 // Course pages show one mode (?tab=cards|sum|prac); highlight the matching section.
 var mode=(typeof URLSearchParams==='function'?new URLSearchParams(location.search).get('tab'):'')||'cards';
 var course=/^(acc|eco|math|eng|zh)\.html$/.test(file)?({cards:'cards',sum:'lessons',prac:'practice'}[mode]||'cards'):'';
 var active=course||{'':'today','index.html':'today','flashcards.html':'cards','practice.html':'practice','accounting-textbook.html':'practice','pdf-sets.html':'practice','mock.html':'practice','hub.html':'lessons','calendar.html':'calendar','today.html':'calendar','grades.html':'','classroom.html':'today'}[file]||'';
 /* Line icons, 24px grid, 1.8 stroke. */
 var ICONS={
  today:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  cards:'<rect x="3.5" y="6.5" width="13" height="14" rx="2"/><path d="M7.5 3.5h11a2 2 0 0 1 2 2v12"/>',
  practice:'<path d="M14.5 4.5l5 5L9 20H4v-5z"/><path d="M12.5 6.5l5 5"/>',
  lessons:'<path d="M4 5.5A2 2 0 0 1 6 3.5h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 20.5v-15M8 8h7M8 11.5h5"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  more:'<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20.5 20.5"/>',
  tutor:'<path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-7l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z"/><path d="M9 11.2h.01M12 11.2h.01M15 11.2h.01"/>',
  stats:'<path d="M4 19.5h16"/><path d="M4 15l4.5-4.5 3.5 3 7-7.5"/><path d="M15 6h4v4"/>',
  desk:'<rect x="3.5" y="4.5" width="17" height="12" rx="2"/><path d="M9 20h6M12 16.5V20"/>',
  grades:'<path d="M4 20h16"/><path d="M7 16v-5M12 16V6M17 16v-8"/>',
  feedback:'<path d="M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2z"/><path d="M12 8.2v3.2M12 13.4h.01"/>',
  backup:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 17.5v2h15v-2"/>',
  restore:'<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 17.5v2h15v-2"/>',
  fold:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9 4.5v15M15.5 9.5 13 12l2.5 2.5"/>',
  unfold:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9 4.5v15M13 9.5l2.5 2.5L13 14.5"/>',
  sync:'<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.2 4.7 4.7 0 0 0 7 18.5z"/>',
  auto:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
  warm:'<path d="M6 3.5h9l3 3v14H6z"/><path d="M15 3.5v3h3M9 11h6M9 14.5h6M9 18h4"/>',
  dark:'<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  light:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>'
 };
 function svg(k){return '<svg class="sn-ic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(ICONS[k]||'')+'</svg>';}
 var css=''
 +'#studyNav{--sn-bg:#fff;--sn-fg:#111;--sn-mute:#474747;--sn-line:#111;--sn-hi:#efefed;--sn-on:var(--acc-t,var(--acc,#d43a2a));--sn-pill:#111;--sn-pill-ink:#fff;font-family:"Zen Maru Gothic","Mali",system-ui,-apple-system,sans-serif;position:fixed;z-index:70;background:var(--sn-bg);color:var(--sn-fg);box-sizing:border-box}'
 +'@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) #studyNav{--sn-bg:#0e0e0f;--sn-fg:#f0f0ee;--sn-mute:#a9a9a6;--sn-line:#f0f0ee;--sn-hi:#232325;--sn-on:var(--acc,#ff8a7a);--sn-pill:#f0f0ee;--sn-pill-ink:#0e0e0f}}'
 +':root.warm #studyNav{--sn-bg:#fbf4e4;--sn-fg:#3a2e22;--sn-mute:#6b5a45;--sn-line:#3a2e22;--sn-hi:#f1e6cd;--sn-pill:#3a2e22;--sn-pill-ink:#fbf4e4}'
 +':root[data-theme="dark"] #studyNav{--sn-bg:#0e0e0f;--sn-fg:#f0f0ee;--sn-mute:#a9a9a6;--sn-line:#f0f0ee;--sn-hi:#232325;--sn-on:var(--acc,#ff8a7a);--sn-pill:#f0f0ee;--sn-pill-ink:#0e0e0f}'
 +'#studyNav a,#studyNav button{color:inherit;text-decoration:none;font:inherit;background:none;border:0;cursor:pointer;display:flex;align-items:center;gap:12px;border-radius:8px;min-height:44px;box-sizing:border-box}'
 +'#studyNav a:focus-visible,#studyNav button:focus-visible{outline:3px solid #2f6bff;outline-offset:2px}'
 +'#studyNav .sn-ic{width:22px;height:22px;flex:none}'
 +'#studyNav .sn-tab{font-weight:700;color:var(--sn-mute)}#studyNav a,#studyNav button{border-radius:6px}'
 +'#studyNav .sn-tab[aria-current="page"]{background:var(--sn-pill);color:var(--sn-pill-ink);font-weight:900}'
 +'#studyNav .sn-tab[aria-current="page"] .sn-ic{color:inherit}'
 +'#studyNav .sn-more{display:none}'
 +'@media(min-width:900px){'
 +' html.sn-on body{padding-left:224px!important}'
 +' #studyNav{overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:none;left:0;top:0;bottom:0;height:100vh;height:100lvh;width:224px;max-height:100dvh;border-right:3px solid var(--sn-line);padding:max(20px,env(safe-area-inset-top)) 12px 16px max(12px,env(safe-area-inset-left));display:flex;flex-direction:column;gap:2px}'
 +' #studyNav .sn-brand{font:700 25px/1 "Kaisei Decol",serif;padding:4px 12px 22px;min-height:0;margin-right:54px}'
 +' #studyNav .sn-brand b{color:var(--sn-on);font-weight:700;margin-left:.25em}'
 /* Safari rubber-band scrolling moves fixed elements; extend the sidebar colour above and below so no gap shows */
 +' #studyNav::before,#studyNav::after{content:"";position:absolute;left:0;right:-1px;height:100vh;background:var(--sn-bg);border-right:3px solid var(--sn-line);pointer-events:none}'
 +' #studyNav::before{bottom:100%}#studyNav::after{top:100%}'
 +' #studyNav .sn-tab{padding:0 12px;font-size:15px}'
 +' #studyNav .sn-tab:hover{background:var(--sn-hi);color:var(--sn-fg)}'
 +' #studyNav::-webkit-scrollbar{display:none}'
 +' #studyNav .sn-foot{margin-top:auto;display:grid;gap:2px;border-top:2px solid var(--sn-line);padding-top:12px}'
 +' #studyNav .sn-foot a,#studyNav .sn-foot button{padding:0 12px;font-size:14px;color:var(--sn-mute);width:100%;text-align:left}'
 +' #studyNav .sn-foot a:hover,#studyNav .sn-foot button:hover{background:var(--sn-hi);color:var(--sn-fg)}'
 +' #studyNav .sn-fold{position:absolute;top:max(12px,env(safe-area-inset-top));right:10px;display:flex;justify-content:center;width:48px;min-height:44px;padding:0;color:var(--sn-fg);background:var(--sn-hi);border:0;border-radius:999px}'
 +' #studyNav .sn-fold:hover{filter:brightness(.94)}'
 +' #studyNav .sn-fold span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'
 +' #studyNav .sn-fold:hover{background:var(--sn-hi);color:var(--sn-fg)}'
 +' html.sn-on.sn-collapsed body{padding-left:76px!important}'
 +' html.sn-collapsed #studyNav{width:auto;height:auto;bottom:auto;padding:0;background:none;border:0;pointer-events:none}'
 +' html.sn-collapsed #studyNav::before,html.sn-collapsed #studyNav::after{display:none}'
 +' html.sn-collapsed #studyNav .sn-brand,html.sn-collapsed #studyNav .sn-tabs,html.sn-collapsed #studyNav .sn-foot{display:none}'
 +' html.sn-collapsed #studyNav .sn-fold{position:fixed;top:max(14px,env(safe-area-inset-top));left:max(14px,env(safe-area-inset-left));width:52px;min-height:52px;border-radius:50%;background:var(--sn-bg);color:var(--sn-fg);border:2px solid var(--sn-line)!important;box-shadow:0 6px 18px -8px rgba(0,0,0,.45);pointer-events:auto}'
 +' html.sn-collapsed #studyNav .sn-tab span,html.sn-collapsed #studyNav .sn-foot span,html.sn-collapsed #studyNav .sn-fold span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}'
 +'}'
 +'@media(max-width:899.98px){'
 +' html.sn-on body{padding-bottom:calc(72px + env(safe-area-inset-bottom))!important}'
 +' #studyNav{left:0;right:0;bottom:0;border-top:3px solid var(--sn-line);padding:4px max(6px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(6px,env(safe-area-inset-left));display:flex}'
 +' #studyNav .sn-brand,#studyNav .sn-fold{display:none!important}'
 +' #studyNav::after{content:"";position:absolute;left:0;right:0;top:100%;height:100vh;background:var(--sn-bg);pointer-events:none}'
 +' #studyNav .sn-tabs{display:flex;flex:1}'
 +' #studyNav .sn-tab,#studyNav .sn-more{flex:1;flex-direction:column;gap:3px;justify-content:center;font-size:11.5px;padding:6px 2px;min-height:56px}'
 +' #studyNav .sn-more{display:flex;color:var(--sn-mute);font-weight:600}'
 +' #studyNav .sn-tab[aria-current="page"]{background:none;color:var(--sn-fg)}#studyNav .sn-tab[aria-current="page"] .sn-ic{color:var(--sn-on)}'
 +' #studyNav .sn-foot{display:none;position:absolute;right:8px;bottom:calc(100% + 8px);background:var(--sn-bg);border:3px solid var(--sn-line);border-radius:4px;padding:6px;min-width:200px;box-shadow:0 12px 30px -8px rgba(0,0,0,.3)}'
 +' #studyNav.sn-open .sn-foot{display:grid;gap:2px}'
 +' #studyNav .sn-foot a,#studyNav .sn-foot button{padding:0 12px;font-size:15px;width:100%;text-align:left;color:var(--sn-fg)}'
 +'}'
 /* Pomodoro "time's up" popup: red panel, ink frame, same in light and dark */
 +'#snAlert{position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.45);font-family:"Zen Maru Gothic","Mali",system-ui,-apple-system,sans-serif}'
 +'#snAlert .sa-box{background:#c21f2f;color:#fff;border:3px solid #111;border-radius:6px;box-shadow:6px 6px 0 #111;padding:22px 22px 18px;width:min(380px,100%);box-sizing:border-box;text-align:center;animation:snPop .28s cubic-bezier(.2,1.4,.4,1)}'
 +'#snAlert h2{font:700 34px/1.1 "Kaisei Decol",serif;margin:0 0 8px;color:#fff}'
 +'#snAlert h2::before,#snAlert h2::after{display:none}'
 +'#snAlert p{margin:0 0 18px;font-size:16px;line-height:1.5;font-weight:700}'
 +'#snAlert .sa-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}'
 +'#snAlert button,#snAlert a{font:inherit;font-weight:900;min-height:44px;padding:0 22px;border-radius:6px;border:2.5px solid #111;background:#fff;color:#111;cursor:pointer;display:inline-flex;align-items:center;text-decoration:none}'
 +'#snAlert a{background:#111;color:#fff}'
 +'#snAlert button:focus-visible,#snAlert a:focus-visible{outline:3px solid #fff;outline-offset:2px}'
 +'@keyframes snPop{from{transform:scale(.85);opacity:0}to{transform:none;opacity:1}}'
 +'@media(prefers-reduced-motion:reduce){#snAlert .sa-box{animation:none}}'
 /* search: a field-like button under the brand in the sidebar, an item in More on phones */
 +'#studyNav .sn-find{display:none}#studyNav .sn-find kbd{margin-left:auto;font:700 11px var(--ui,inherit);border:1.5px solid currentColor;border-radius:4px;padding:0 5px;opacity:.6}'
 +'@media(min-width:900px){#studyNav .sn-find{display:flex;margin:0 0 10px;padding:0 12px;min-height:42px;border:2px solid var(--sn-line)!important;border-radius:6px;color:var(--sn-mute);font-size:14px;font-weight:700}#studyNav .sn-find:hover{color:var(--sn-fg);background:var(--sn-hi)}#studyNav .sn-foot .sn-find-m{display:none}html.sn-collapsed #studyNav .sn-find{display:none}}'
 +'@media print{#studyNav{display:none}html.sn-on body{padding:0!important}}';
 /* Red popup when a Pomodoro ends (Today calls it, other pages call it from the nav countdown). */
 function timesUp(mins){
  if(!document.body)return;
  if(!document.getElementById('studyNavCss')){var st=document.createElement('style');st.id='studyNavCss';st.textContent=css;document.head.appendChild(st);}
  var old=document.getElementById('snAlert');if(old)old.remove();
  var brk=mins===5||mins===15,prev=document.activeElement;
  var d=document.createElement('div');d.id='snAlert';d.setAttribute('role','alertdialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','snAlertT');d.setAttribute('aria-describedby','snAlertM');
  d.innerHTML='<div class="sa-box"><h2 id="snAlertT">Time\u2019s up!</h2><p id="snAlertM">'+(brk?'Break is over. Back to study.':'Pomodoro done. Take a break.')+'</p>'
   +'<div class="sa-row">'+(active==='today'?'':'<a href="index.html">Open Today</a>')+'<button type="button">OK</button></div></div>';
  function close(){d.remove();document.removeEventListener('keydown',key);if(prev&&prev.focus)try{prev.focus();}catch(e){}}
  function key(e){if(e.key==='Escape')close();}
  d.querySelector('button').onclick=close;d.addEventListener('click',function(e){if(e.target===d)close();});document.addEventListener('keydown',key);
  document.body.appendChild(d);d.querySelector('button').focus();
 }
 function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 function mount(){
  if(document.getElementById('studyNav'))return;
  if(course&&typeof URLSearchParams==='function'&&new URLSearchParams(location.search).get('sync')==='1')document.documentElement.classList.add('show-sync');
  var st=document.createElement('style');st.id='studyNavCss';st.textContent=css;document.head.appendChild(st);
  var nav=document.createElement('nav');nav.id='studyNav';nav.setAttribute('aria-label','Main');
  var h='<a class="sn-brand" href="index.html" aria-label="Study OS home"><span class="sn-bt">Study</span><b>OS</b></a><button type="button" class="sn-fold" aria-pressed="false"></button><button type="button" class="sn-find" aria-label="Search (press /)">'+svg('search')+'<span>Search</span><kbd>/</kbd></button><div class="sn-tabs">';
  var FOCUS=!!(window.StudyTheme&&window.StudyTheme.focus&&window.StudyTheme.focus());
  TABS.forEach(function(t){if(FOCUS&&t.id==='cards'&&active!=='cards')return;h+='<a class="sn-tab" data-sn="'+t.id+'" href="'+t.href+'"'+(t.id===active?' aria-current="page"':'')+' title="'+esc(t.label)+'">'+svg(t.icon)+'<span>'+esc(t.label)+'</span></a>';});
  h+='<button type="button" class="sn-more" aria-expanded="false" aria-controls="snFoot">'+svg('more')+'<span>More</span></button></div>';
  h+='<div class="sn-foot" id="snFoot"><button type="button" class="sn-find-m">'+svg('search')+'<span>Search</span></button><button type="button" class="sn-theme"></button>'+(window.StudyTheme&&window.StudyTheme.setFocus?'<button type="button" class="sn-focus" aria-pressed="'+FOCUS+'" title="Show or hide summaries and flashcards">'+svg('cards')+'<span>'+(FOCUS?'Show cards &amp; summaries':'Hide cards &amp; summaries')+'</span></button>':'')+((course||window.StudyCloud)?'<button type="button" class="sn-sync">'+svg('sync')+'<span>Cloud sync</span></button>':'');
  MORE.forEach(function(m){h+='<a href="'+m.href+'" title="'+esc(m.label)+'">'+svg(m.icon)+'<span>'+esc(m.label)+'</span></a>';});
  h+='</div>';
  nav.innerHTML=h;document.body.appendChild(nav);if(!document.querySelector('link[href*="Zen+Maru+Gothic"],style[data-world]')){/* Course pages: load only the glyphs the nav shows (Google Fonts text=), a few KB instead of whole Japanese fonts. */var tx=nav.textContent.replace(/\s+/g,'');var u={};tx.split('').forEach(function(c){u[c]=1;});var fl=document.createElement('link');fl.rel='stylesheet';fl.href='https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@700&family=Zen+Maru+Gothic:wght@700;900&display=swap&text='+encodeURIComponent(Object.keys(u).sort().join('')+'0123456789');document.head.appendChild(fl);}document.documentElement.classList.add('sn-on');
  var more=nav.querySelector('.sn-more');
  more.onclick=function(e){e.stopPropagation();var o=nav.classList.toggle('sn-open');more.setAttribute('aria-expanded',o?'true':'false');};
  document.addEventListener('click',function(e){if(!nav.contains(e.target)){nav.classList.remove('sn-open');more.setAttribute('aria-expanded','false');}});
  [].forEach.call(nav.querySelectorAll('.sn-find,.sn-find-m'),function(b){b.onclick=function(){nav.classList.remove('sn-open');openSearch();};});
  var sy=nav.querySelector('.sn-sync');
  if(sy)sy.onclick=function(){if(!course&&window.StudyCloud){nav.classList.remove('sn-open');window.StudyCloud.open();return;}var on=document.documentElement.classList.toggle('show-sync');nav.classList.remove('sn-open');var bar=document.querySelector('.cloud-sync-bar');if(on&&bar&&bar.scrollIntoView)bar.scrollIntoView({block:'center'});};
  var fo=nav.querySelector('.sn-focus');if(fo)fo.onclick=function(){window.StudyTheme.setFocus(!window.StudyTheme.focus());location.reload();};
  var tb=nav.querySelector('.sn-theme'),T=window.StudyTheme;
  function paint(){if(!T){tb.hidden=true;return;}var m=T.mode();tb.innerHTML=svg(m)+'<span>'+esc(T.LABEL[m])+'</span>';tb.setAttribute('aria-label',T.LABEL[m]+' (tap to change)');}
  tb.onclick=function(){if(T){T.cycle();paint();}};paint();
  var fb=nav.querySelector('.sn-fold');
  function paintFold(){var on=!!(T&&T.collapsed&&T.collapsed());fb.innerHTML=svg(on?'unfold':'fold')+'<span>'+(on?'Expand sidebar':'Collapse sidebar')+'</span>';fb.setAttribute('aria-pressed',String(on));fb.title=on?'Expand sidebar':'Collapse sidebar';}
  if(!T||!T.setCollapsed)fb.hidden=true;else{fb.onclick=function(){T.setCollapsed(!T.collapsed());paintFold();};paintFold();}
 }
 /* running Pomodoro from Today (state read through StudyTheme.pomo): a small countdown on every other page */
 function pomo(){
  var P=window.StudyTheme&&window.StudyTheme.pomo;if(active==='today'||!document.body||!P||!P())return;
  var a=document.createElement('a');a.id='snPomo';a.href='index.html';a.setAttribute('aria-label','Pomodoro timer, open Today');
  a.style.cssText='position:fixed;top:max(10px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));z-index:70;display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border:2.5px solid var(--ink,#111);border-radius:999px;background:var(--panel,#fff);color:var(--text,#111);font:700 15px/1 var(--num,ui-monospace,monospace);text-decoration:none;font-variant-numeric:tabular-nums';
  document.body.appendChild(a);
  var done=false,seen=false,t=setInterval(paint,500);paint();
  function paint(){var s=P();if(!s){clearInterval(t);a.remove();return;}var l=Math.ceil((s.endAt-Date.now())/1000);
   if(l<=0){if(!done){done=true;a.textContent='Time\u2019s up';try{navigator.vibrate&&navigator.vibrate(300);}catch(e){}
     // Popup only when it ends while this page is open, not when a page opens after it already ended.
     if(seen)timesUp(s.mins);setTimeout(function(){clearInterval(t);a.remove();},60000);}return;}
   seen=true;
   a.textContent='\u23F1 '+String(Math.floor(l/60)).padStart(2,'0')+':'+String(l%60).padStart(2,'0');}
 }
 /* Site search: scripts/study-search.js is loaded the first time search opens. */
 var navSrc=(document.currentScript&&document.currentScript.src)||'';
 function openSearch(q){
  if(window.StudySearch){window.StudySearch.open(q);return;}
  var sc=document.createElement('script');sc.src=navSrc?new URL('study-search.js?v=3',navSrc).href:'scripts/study-search.js?v=3';
  sc.onload=function(){if(window.StudySearch)window.StudySearch.open(q);};document.head.appendChild(sc);
 }
 document.addEventListener('keydown',function(e){
  /* Ctrl+K / ⌘K opens search from anywhere, even while typing (TASK 24); / opens it when no text field has focus */
  if((e.key==='k'||e.key==='K')&&(e.ctrlKey||e.metaKey)&&!e.altKey&&!e.shiftKey){e.preventDefault();openSearch();return;}
  if(e.key!=='/'||e.metaKey||e.ctrlKey||e.altKey)return;var a=document.activeElement;
  if(a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable))return;e.preventDefault();openSearch();
 });
 /* Page-open counts on this device (scripts/study-usage.js); the nav itself still reads and writes no study data. */
 if(!window.StudyUsage){var us=document.createElement('script');us.src=navSrc?new URL('study-usage.js?v=3',navSrc).href:'scripts/study-usage.js?v=1';document.head.appendChild(us);}
 window.StudyNav={TABS:TABS,active:active,timesUp:timesUp,search:openSearch};
 if(document.body)pomo();else document.addEventListener('DOMContentLoaded',pomo);
 if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
})();
