/* Study OS navigation: left sidebar on wide screens, bottom tab bar on narrow ones.
   Reads and writes no study data. The theme control uses window.StudyTheme. */
(function(){
 'use strict';
 if(typeof document==='undefined'||document.getElementById('studyNav'))return;
 var TABS=[
  {id:'today',href:'index.html',icon:'☀️',label:'Today'},
  {id:'practice',href:'practice.html',icon:'✏️',label:'Practice'},
  {id:'subjects',href:'hub.html',icon:'📚',label:'Subjects'},
  {id:'calendar',href:'calendar.html',icon:'📅',label:'Calendar'}
 ];
 var MORE=[
  {href:'progress-backup.html',label:'Back up'},
  {href:'progress-restore.html',label:'Restore'}
 ];
 var file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
 var active={'':'today','index.html':'today','practice.html':'practice','acc.html':'practice','eco.html':'practice','math.html':'practice','eng.html':'practice','zh.html':'practice','accounting-textbook.html':'practice','hub.html':'subjects','calendar.html':'calendar','today.html':'calendar'}[file]||'';
 var css=''
 +'#studyNav{--sn-bg:#f7f7f5;--sn-fg:#37352f;--sn-mute:#787774;--sn-line:#e9e9e7;--sn-hi:#ebebea;font-family:"DM Sans",system-ui,-apple-system,sans-serif;position:fixed;z-index:70;background:var(--sn-bg);color:var(--sn-fg);box-sizing:border-box}'
 +'@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) #studyNav{--sn-bg:#202020;--sn-fg:#e6e6e4;--sn-mute:#9b9a97;--sn-line:#2f2f2f;--sn-hi:#2c2c2c}}'
 +':root[data-theme="dark"] #studyNav{--sn-bg:#202020;--sn-fg:#e6e6e4;--sn-mute:#9b9a97;--sn-line:#2f2f2f;--sn-hi:#2c2c2c}'
 +'#studyNav a,#studyNav button{color:inherit;text-decoration:none;font:inherit;background:none;border:0;cursor:pointer;display:flex;align-items:center;gap:10px;border-radius:8px;min-height:44px;box-sizing:border-box}'
 +'#studyNav a:focus-visible,#studyNav button:focus-visible{outline:3px solid #6c63ff;outline-offset:2px}'
 +'#studyNav .sn-ic{font-size:18px;width:24px;text-align:center;flex:none}'
 +'#studyNav .sn-tab[aria-current="page"]{background:var(--sn-hi);font-weight:700}'
 +'#studyNav .sn-more{display:none}'
 +'@media(min-width:900px){'
 +' html.sn-on body{padding-left:224px!important}'
 +' #studyNav{left:0;top:0;bottom:0;width:224px;border-right:1px solid var(--sn-line);padding:max(18px,env(safe-area-inset-top)) 10px 16px max(10px,env(safe-area-inset-left));display:flex;flex-direction:column;gap:2px}'
 +' #studyNav .sn-brand{font-weight:800;font-size:17px;padding:4px 10px 16px}'
 +' #studyNav .sn-tab{padding:0 10px;font-size:15px}'
 +' #studyNav .sn-tab:hover{background:var(--sn-hi)}'
 +' #studyNav .sn-foot{margin-top:auto;display:grid;gap:2px;border-top:1px solid var(--sn-line);padding-top:10px}'
 +' #studyNav .sn-foot a,#studyNav .sn-foot button{padding:0 10px;font-size:14px;color:var(--sn-mute);width:100%;text-align:left}'
 +' #studyNav .sn-foot a:hover,#studyNav .sn-foot button:hover{background:var(--sn-hi);color:var(--sn-fg)}'
 +'}'
 +'@media(max-width:899.98px){'
 +' html.sn-on body{padding-bottom:calc(72px + env(safe-area-inset-bottom))!important}'
 +' #studyNav{left:0;right:0;bottom:0;border-top:1px solid var(--sn-line);padding:4px max(6px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(6px,env(safe-area-inset-left));display:flex}'
 +' #studyNav .sn-brand{display:none}'
 +' #studyNav .sn-tabs{display:flex;flex:1}'
 +' #studyNav .sn-tab,#studyNav .sn-more{flex:1;flex-direction:column;gap:2px;justify-content:center;font-size:11px;padding:6px 2px;min-height:56px}'
 +' #studyNav .sn-more{display:flex}'
 +' #studyNav .sn-foot{display:none;position:absolute;right:8px;bottom:calc(100% + 8px);background:var(--sn-bg);border:1px solid var(--sn-line);border-radius:12px;padding:6px;min-width:180px;box-shadow:0 8px 24px rgba(0,0,0,.18)}'
 +' #studyNav.sn-open .sn-foot{display:grid;gap:2px}'
 +' #studyNav .sn-foot a,#studyNav .sn-foot button{padding:0 12px;font-size:15px;width:100%;text-align:left}'
 +'}'
 +'@media print{#studyNav{display:none}html.sn-on body{padding:0!important}}';
 function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 function mount(){
  if(document.getElementById('studyNav'))return;
  var st=document.createElement('style');st.id='studyNavCss';st.textContent=css;document.head.appendChild(st);
  var nav=document.createElement('nav');nav.id='studyNav';nav.setAttribute('aria-label','Main');
  var h='<a class="sn-brand" href="index.html">Study OS</a><div class="sn-tabs">';
  TABS.forEach(function(t){h+='<a class="sn-tab" data-sn="'+t.id+'" href="'+t.href+'"'+(t.id===active?' aria-current="page"':'')+'><span class="sn-ic" aria-hidden="true">'+t.icon+'</span><span>'+esc(t.label)+'</span></a>';});
  h+='<button type="button" class="sn-more" aria-expanded="false" aria-controls="snFoot"><span class="sn-ic" aria-hidden="true">⋯</span><span>More</span></button></div>';
  h+='<div class="sn-foot" id="snFoot"><button type="button" class="sn-theme"></button>';
  MORE.forEach(function(m){h+='<a href="'+m.href+'">'+esc(m.label)+'</a>';});
  h+='</div>';
  nav.innerHTML=h;document.body.appendChild(nav);document.documentElement.classList.add('sn-on');
  var more=nav.querySelector('.sn-more');
  more.onclick=function(e){e.stopPropagation();var o=nav.classList.toggle('sn-open');more.setAttribute('aria-expanded',o?'true':'false');};
  document.addEventListener('click',function(e){if(!nav.contains(e.target)){nav.classList.remove('sn-open');more.setAttribute('aria-expanded','false');}});
  var tb=nav.querySelector('.sn-theme'),T=window.StudyTheme;
  function paint(){if(!T){tb.hidden=true;return;}var m=T.mode();tb.innerHTML='<span class="sn-ic" aria-hidden="true">'+T.ICON[m]+'</span><span>'+esc(T.LABEL[m])+'</span>';tb.setAttribute('aria-label',T.LABEL[m]+' (tap to change)');}
  tb.onclick=function(){if(T){T.cycle();paint();}};paint();
 }
 window.StudyNav={TABS:TABS,active:active};
 if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
})();
