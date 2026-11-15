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
  {href:'grades.html',label:'Grades'},
  {href:'progress-backup.html',label:'Back up'},
  {href:'progress-restore.html',label:'Restore'}
 ];
 var file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
 // Course pages show one mode (?tab=cards|sum|prac); highlight the matching section.
 var mode=(typeof URLSearchParams==='function'?new URLSearchParams(location.search).get('tab'):'')||'cards';
 var course=/^(acc|eco|math|eng|zh)\.html$/.test(file)?({cards:'cards',sum:'lessons',prac:'practice'}[mode]||'cards'):'';
 var active=course||{'':'today','index.html':'today','flashcards.html':'cards','practice.html':'practice','accounting-textbook.html':'practice','hub.html':'lessons','calendar.html':'calendar','today.html':'calendar','grades.html':''}[file]||'';
 /* Line icons, 24px grid, 1.8 stroke. */
 var ICONS={
  today:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  cards:'<rect x="3.5" y="6.5" width="13" height="14" rx="2"/><path d="M7.5 3.5h11a2 2 0 0 1 2 2v12"/>',
  practice:'<path d="M14.5 4.5l5 5L9 20H4v-5z"/><path d="M12.5 6.5l5 5"/>',
  lessons:'<path d="M4 5.5A2 2 0 0 1 6 3.5h13v15H6a2 2 0 0 0-2 2z"/><path d="M4 20.5v-15M8 8h7M8 11.5h5"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  more:'<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  sync:'<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.2 4.7 4.7 0 0 0 7 18.5z"/>',
  auto:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
  dark:'<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  light:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>'
 };
 function svg(k){return '<svg class="sn-ic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(ICONS[k]||'')+'</svg>';}
 var css=''
 +'#studyNav{--sn-bg:#0f3b2c;--sn-fg:#eef3ef;--sn-mute:#a8c3b5;--sn-line:rgba(255,255,255,.12);--sn-hi:rgba(255,255,255,.09);--sn-on:#ffd23f;font-family:"Bai Jamjuree",system-ui,-apple-system,sans-serif;position:fixed;z-index:70;background:var(--sn-bg);color:var(--sn-fg);box-sizing:border-box}'
 +'@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) #studyNav{--sn-bg:#0a2219;--sn-line:rgba(255,255,255,.08)}}'
 +':root[data-theme="dark"] #studyNav{--sn-bg:#0a2219;--sn-line:rgba(255,255,255,.08)}'
 +'#studyNav a,#studyNav button{color:inherit;text-decoration:none;font:inherit;background:none;border:0;cursor:pointer;display:flex;align-items:center;gap:12px;border-radius:8px;min-height:44px;box-sizing:border-box}'
 +'#studyNav a:focus-visible,#studyNav button:focus-visible{outline:3px solid var(--sn-on);outline-offset:2px}'
 +'#studyNav .sn-ic{width:22px;height:22px;flex:none}'
 +'#studyNav .sn-tab{font-weight:600;color:var(--sn-mute)}'
 +'#studyNav .sn-tab[aria-current="page"]{background:var(--sn-hi);color:var(--sn-fg);font-weight:700}'
 +'#studyNav .sn-tab[aria-current="page"] .sn-ic{color:var(--sn-on)}'
 +'#studyNav .sn-more{display:none}'
 +'@media(min-width:900px){'
 +' html.sn-on body{padding-left:224px!important}'
 +' #studyNav{left:0;top:0;bottom:0;height:100vh;height:100lvh;width:224px;border-right:1px solid var(--sn-line);padding:max(20px,env(safe-area-inset-top)) 12px 16px max(12px,env(safe-area-inset-left));display:flex;flex-direction:column;gap:2px}'
 +' #studyNav .sn-brand{font:800 26px/1 "Big Shoulders Display","Bai Jamjuree",sans-serif;letter-spacing:.01em;padding:4px 12px 22px;min-height:0}'
 +' #studyNav .sn-brand b{color:var(--sn-on);font-weight:800;margin-left:.12em}'
 /* Safari rubber-band scrolling moves fixed elements; extend the sidebar colour above and below so no gap shows */
 +' #studyNav::before,#studyNav::after{content:"";position:absolute;left:0;right:-1px;height:100vh;background:var(--sn-bg);border-right:1px solid var(--sn-line);pointer-events:none}'
 +' #studyNav::before{bottom:100%}#studyNav::after{top:100%}'
 +' #studyNav .sn-tab{padding:0 12px;font-size:15px}'
 +' #studyNav .sn-tab:hover{background:var(--sn-hi);color:var(--sn-fg)}'
 +' #studyNav .sn-foot{margin-top:auto;display:grid;gap:2px;border-top:1px solid var(--sn-line);padding-top:12px}'
 +' #studyNav .sn-foot a,#studyNav .sn-foot button{padding:0 12px;font-size:14px;color:var(--sn-mute);width:100%;text-align:left}'
 +' #studyNav .sn-foot a:hover,#studyNav .sn-foot button:hover{background:var(--sn-hi);color:var(--sn-fg)}'
 +'}'
 +'@media(max-width:899.98px){'
 +' html.sn-on body{padding-bottom:calc(72px + env(safe-area-inset-bottom))!important}'
 +' #studyNav{left:0;right:0;bottom:0;border-top:1px solid var(--sn-line);padding:4px max(6px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(6px,env(safe-area-inset-left));display:flex}'
 +' #studyNav .sn-brand{display:none}'
 +' #studyNav::after{content:"";position:absolute;left:0;right:0;top:100%;height:100vh;background:var(--sn-bg);pointer-events:none}'
 +' #studyNav .sn-tabs{display:flex;flex:1}'
 +' #studyNav .sn-tab,#studyNav .sn-more{flex:1;flex-direction:column;gap:3px;justify-content:center;font-size:11.5px;padding:6px 2px;min-height:56px}'
 +' #studyNav .sn-more{display:flex;color:var(--sn-mute);font-weight:600}'
 +' #studyNav .sn-tab[aria-current="page"]{background:none}'
 +' #studyNav .sn-foot{display:none;position:absolute;right:8px;bottom:calc(100% + 8px);background:var(--sn-bg);border:1px solid var(--sn-line);border-radius:12px;padding:6px;min-width:200px;box-shadow:0 12px 30px -8px rgba(0,0,0,.45)}'
 +' #studyNav.sn-open .sn-foot{display:grid;gap:2px}'
 +' #studyNav .sn-foot a,#studyNav .sn-foot button{padding:0 12px;font-size:15px;width:100%;text-align:left;color:var(--sn-fg)}'
 +'}'
 +'@media print{#studyNav{display:none}html.sn-on body{padding:0!important}}';
 function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 function mount(){
  if(document.getElementById('studyNav'))return;
  if(course&&typeof URLSearchParams==='function'&&new URLSearchParams(location.search).get('sync')==='1')document.documentElement.classList.add('show-sync');
  if(!document.querySelector('link[href*="Bai+Jamjuree"],style[data-world]')){var fl=document.createElement('link');fl.rel='stylesheet';fl.href='https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@500;600;700&family=Big+Shoulders+Display:wght@800&display=swap';document.head.appendChild(fl);}
  var st=document.createElement('style');st.id='studyNavCss';st.textContent=css;document.head.appendChild(st);
  var nav=document.createElement('nav');nav.id='studyNav';nav.setAttribute('aria-label','Main');
  var h='<a class="sn-brand" href="index.html">Study<b>OS</b></a><div class="sn-tabs">';
  TABS.forEach(function(t){h+='<a class="sn-tab" data-sn="'+t.id+'" href="'+t.href+'"'+(t.id===active?' aria-current="page"':'')+'>'+svg(t.icon)+'<span>'+esc(t.label)+'</span></a>';});
  h+='<button type="button" class="sn-more" aria-expanded="false" aria-controls="snFoot">'+svg('more')+'<span>More</span></button></div>';
  h+='<div class="sn-foot" id="snFoot"><button type="button" class="sn-theme"></button>'+(course?'<button type="button" class="sn-sync">'+svg('sync')+'<span>Cloud sync</span></button>':'');
  MORE.forEach(function(m){h+='<a href="'+m.href+'">'+esc(m.label)+'</a>';});
  h+='</div>';
  nav.innerHTML=h;document.body.appendChild(nav);document.documentElement.classList.add('sn-on');
  var more=nav.querySelector('.sn-more');
  more.onclick=function(e){e.stopPropagation();var o=nav.classList.toggle('sn-open');more.setAttribute('aria-expanded',o?'true':'false');};
  document.addEventListener('click',function(e){if(!nav.contains(e.target)){nav.classList.remove('sn-open');more.setAttribute('aria-expanded','false');}});
  var sy=nav.querySelector('.sn-sync');
  if(sy)sy.onclick=function(){var on=document.documentElement.classList.toggle('show-sync');nav.classList.remove('sn-open');var bar=document.querySelector('.cloud-sync-bar');if(on&&bar&&bar.scrollIntoView)bar.scrollIntoView({block:'center'});};
  var tb=nav.querySelector('.sn-theme'),T=window.StudyTheme;
  function paint(){if(!T){tb.hidden=true;return;}var m=T.mode();tb.innerHTML=svg(m)+'<span>'+esc(T.LABEL[m])+'</span>';tb.setAttribute('aria-label',T.LABEL[m]+' (tap to change)');}
  tb.onclick=function(){if(T){T.cycle();paint();}};paint();
 }
 window.StudyNav={TABS:TABS,active:active};
 if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
})();
