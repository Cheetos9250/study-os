/* Study OS screen settings: theme auto (follow device) / dark / light, and the collapsed sidebar.
   Writes only its own two keys (studyos.theme.v1, studyos.nav.v1); neither is study data or part of backups.
   Loaded in <head>, so a collapsed sidebar is applied before the first paint. */
(function(){
 'use strict';
 var KEY='studyos.theme.v1',root=document.documentElement;
 function read(){try{var v=localStorage.getItem(KEY);return v==='dark'||v==='light'?v:'auto';}catch(e){return 'auto';}}
 function apply(m){if(m==='auto')root.removeAttribute('data-theme');else root.setAttribute('data-theme',m);}
 var mode=read();apply(mode);
 var NAV_KEY='studyos.nav.v1',collapsed=false;
 try{collapsed=localStorage.getItem(NAV_KEY)==='collapsed';}catch(e){}
 if(collapsed)root.classList.add('sn-collapsed');
 function setCollapsed(on){collapsed=!!on;root.classList.toggle('sn-collapsed',collapsed);try{if(collapsed)localStorage.setItem(NAV_KEY,'collapsed');else localStorage.removeItem(NAV_KEY);}catch(e){}return collapsed;}
 var ICON={auto:'🌓',dark:'🌙',light:'☀️'},LABEL={auto:'Theme: Auto',dark:'Theme: Dark',light:'Theme: Light'},NEXT={auto:'dark',dark:'light',light:'auto'};
 function cycle(){mode=NEXT[mode];apply(mode);try{if(mode==='auto')localStorage.removeItem(KEY);else localStorage.setItem(KEY,mode);}catch(e){}return mode;}
 /* Ask the browser to keep this site's data instead of clearing it under storage pressure (iPadOS honours this best for home-screen apps). */
 try{if(navigator.storage&&navigator.storage.persisted&&navigator.storage.persist)navigator.storage.persisted().then(function(p){if(!p)return navigator.storage.persist();}).catch(function(){});}catch(e){}
 window.StudyTheme={mode:function(){return mode;},cycle:cycle,ICON:ICON,LABEL:LABEL,collapsed:function(){return collapsed;},setCollapsed:setCollapsed};
 function mount(){
  if(document.getElementById('studyThemeBtn')||document.getElementById('studyNav')||document.querySelector('script[src*="study-nav.js"]'))return;
  var b=document.createElement('button');b.id='studyThemeBtn';b.type='button';
  b.style.cssText='position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));z-index:60;width:44px;height:44px;border-radius:50%;border:1px solid rgba(127,127,127,.45);background:rgba(127,127,127,.18);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-size:20px;line-height:1;cursor:pointer;padding:0';
  function paint(){b.textContent=ICON[mode];b.title=LABEL[mode]+' (tap to change)';b.setAttribute('aria-label',LABEL[mode]+' (tap to change)');}
  b.onclick=function(){cycle();paint();};
  paint();document.body.appendChild(b);
 }
 if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
})();
