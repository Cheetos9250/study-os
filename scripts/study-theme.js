/* Study OS screen settings: theme auto (follow device) / dark / light, the collapsed sidebar, and focus mode.
   Writes only its own three keys (studyos.theme.v1, studyos.nav.v1, studyos.focus.v1); none is study data or part of backups.
   Loaded in <head>, so a collapsed sidebar is applied before the first paint. */
(function(){
 'use strict';
 var KEY='studyos.theme.v1',root=document.documentElement;
 function read(){try{var v=localStorage.getItem(KEY);return v==='dark'||v==='light'||v==='warm'?v:'auto';}catch(e){return 'auto';}}
 /* warm = the light theme with warm paper colours (class .warm), so every light-mode rule still applies */
 function apply(m){root.classList.toggle('warm',m==='warm');if(m==='auto')root.removeAttribute('data-theme');else root.setAttribute('data-theme',m==='warm'?'light':m);}
 var mode=read();apply(mode);
 var NAV_KEY='studyos.nav.v1',collapsed=false;
 try{collapsed=localStorage.getItem(NAV_KEY)==='collapsed';}catch(e){}
 if(collapsed)root.classList.add('sn-collapsed');
 function setCollapsed(on){collapsed=!!on;root.classList.toggle('sn-collapsed',collapsed);try{if(collapsed)localStorage.setItem(NAV_KEY,'collapsed');else localStorage.removeItem(NAV_KEY);}catch(e){}return collapsed;}
 /* Focus mode (default on): the owner studies with practice questions and notes, so summaries and flashcards are hidden. Data is untouched. */
 var FOCUS_KEY='studyos.focus.v1',focus=true;
 try{focus=localStorage.getItem(FOCUS_KEY)!=='off';}catch(e){}
 if(focus)root.classList.add('focus');
 function setFocus(on){focus=!!on;root.classList.toggle('focus',focus);try{localStorage.setItem(FOCUS_KEY,focus?'on':'off');}catch(e){}return focus;}
 var ICON={auto:'🌓',dark:'🌙',light:'☀️',warm:'📜'},LABEL={auto:'Theme: Auto',dark:'Theme: Dark',light:'Theme: Light',warm:'Theme: Warm paper'},NEXT={auto:'dark',dark:'light',light:'warm',warm:'auto'};
 function cycle(){mode=NEXT[mode];apply(mode);try{if(mode==='auto')localStorage.removeItem(KEY);else localStorage.setItem(KEY,mode);}catch(e){}return mode;}
 /* Ask the browser to keep this site's data instead of clearing it under storage pressure (iPadOS honours this best for home-screen apps). */
 try{if(navigator.storage&&navigator.storage.persisted&&navigator.storage.persist)navigator.storage.persisted().then(function(p){if(!p)return navigator.storage.persist();}).catch(function(){});}catch(e){}
 /* Offline support: register sw.js (site root, next to this scripts/ folder) on https only. It caches site files, never study data. */
 try{var cs=document.currentScript;if('serviceWorker' in navigator&&location.protocol==='https:'&&cs&&cs.src){var swu=new URL('../sw.js',cs.src);window.addEventListener('load',function(){navigator.serviceWorker.register(swu.href,{scope:new URL('./',swu).href}).catch(function(){});});}}catch(e){}
 /* read-only view of Today's running Pomodoro (studyos.pomo.v1 is written only by index.html) */
 function pomo(){try{var s=JSON.parse(localStorage.getItem('studyos.pomo.v1')||'null');return s&&s.endAt?s:null;}catch(e){return null;}}
 window.StudyTheme={pomo:pomo,mode:function(){return mode;},cycle:cycle,ICON:ICON,LABEL:LABEL,collapsed:function(){return collapsed;},setCollapsed:setCollapsed,focus:function(){return focus;},setFocus:setFocus};
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
