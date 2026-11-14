/* Study OS theme: auto (follow device) / dark / light. Writes only its own key. */
(function(){
 'use strict';
 var KEY='studyos.theme.v1',root=document.documentElement;
 function read(){try{var v=localStorage.getItem(KEY);return v==='dark'||v==='light'?v:'auto';}catch(e){return 'auto';}}
 function apply(m){if(m==='auto')root.removeAttribute('data-theme');else root.setAttribute('data-theme',m);}
 var mode=read();apply(mode);
 var ICON={auto:'🌓',dark:'🌙',light:'☀️'},LABEL={auto:'ธีม: ตามอุปกรณ์',dark:'ธีม: มืด',light:'ธีม: สว่าง'},NEXT={auto:'dark',dark:'light',light:'auto'};
 function mount(){
  if(document.getElementById('studyThemeBtn'))return;
  var b=document.createElement('button');b.id='studyThemeBtn';b.type='button';
  b.style.cssText='position:fixed;left:max(12px,env(safe-area-inset-left));bottom:max(12px,env(safe-area-inset-bottom));z-index:60;width:44px;height:44px;border-radius:50%;border:1px solid rgba(127,127,127,.45);background:rgba(127,127,127,.18);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);font-size:20px;line-height:1;cursor:pointer;padding:0';
  function paint(){b.textContent=ICON[mode];b.title=LABEL[mode]+' (แตะเพื่อสลับ)';b.setAttribute('aria-label',LABEL[mode]+' แตะเพื่อสลับ');}
  b.onclick=function(){mode=NEXT[mode];apply(mode);try{if(mode==='auto')localStorage.removeItem(KEY);else localStorage.setItem(KEY,mode);}catch(e){}paint();};
  paint();document.body.appendChild(b);
 }
 if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount);
})();
