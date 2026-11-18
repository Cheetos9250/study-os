/* WordNest: language layer over the former VocaBloom app.
   ?lang=en (default) keeps the English games and English flashcards.
   ?lang=zh shows the Chinese flashcards (same progress key as before: zh-vocab-v1-srs).
   Reads/writes no new storage keys. */
'use strict';
(function(){
 const LANG=new URLSearchParams(location.search).get('lang')==='zh'?'zh':'en';
 const DECK=LANG==='zh'?'zh':'eng';
 const NAME=LANG==='zh'?'WordNest Chinese':'WordNest English';
 window.WORDNEST={lang:LANG,deck:DECK};
 document.documentElement.lang=LANG==='zh'?'zh':'en';
 document.body.classList.add('wn-'+LANG);
 document.title=NAME;

 // Brand and language switch
 const brand=document.querySelector('.sidebar .brand');
 if(brand)brand.innerHTML='<span class="brand-symbol">'+(LANG==='zh'?'🀄':'🪺')+'</span><span>word<span class="brand-green">nest</span><small>'+(LANG==='zh'?'CHINESE':'ENGLISH')+'</small></span>';
 const mobileLogo=document.querySelector('.mobile-logo');
 if(mobileLogo)mobileLogo.innerHTML=(LANG==='zh'?'🀄':'🪺')+' word<span>nest</span>';
 const footer=document.querySelector('.main-footer');
 if(footer)footer.innerHTML='WordNest · Learn a little, every day.';
 const css=document.createElement('style');
 css.textContent=''
 +'.wn-switch{display:flex;gap:6px;margin:0 0 14px}'
 +'.wn-switch a{flex:1;text-align:center;text-decoration:none;font-weight:700;font-size:13px;padding:8px 6px;border-radius:10px;border:1px solid var(--line);color:inherit;min-height:44px;display:flex;align-items:center;justify-content:center}'
 +'.wn-switch a[aria-current=page]{background:var(--purple,#5b53d7);border-color:var(--purple,#5b53d7);color:#fff}'
 +'.wn-back{display:flex;align-items:center;gap:8px;min-height:44px;font-size:13px;font-weight:700;text-decoration:none;color:inherit;opacity:.75;margin:0 0 10px}'
 +'.u-subjects{display:none!important}'
 +'.wn-zh .main-nav [data-page]:not([data-page=studymerge]):not([data-page=zhgames]),.wn-zh .mobile-nav [data-page]:not([data-page=studymerge]):not([data-page=zhgames]),.wn-zh .sidebar-settings,.wn-zh .sidebar-target{display:none!important}';
 document.head.appendChild(css);
 const sw=document.createElement('div');
 sw.innerHTML='<a class="wn-back" href="../index.html">← Study OS</a><div class="wn-switch" role="group" aria-label="Language"><a href="./?lang=en"'+(LANG==='en'?' aria-current="page"':'')+'>English</a><a href="./?lang=zh"'+(LANG==='zh'?' aria-current="page"':'')+'>中文</a></div>';
 if(brand)brand.after(sw);

 // Flashcards: one deck per language
 if(typeof USTATE==='object'){USTATE.subject=DECK;}
 const navBtn=document.querySelector('#sideNav [data-page=studymerge]');
 if(navBtn)navBtn.innerHTML='<span class="nav-icon">🃏</span> Flashcards';
 if(typeof uHome==='function'){
  uHome=function(){if(!USTATE.ready)return '';const d=uDeck(DECK);if(!d)return '';const t=uStats(d);
   return '<div class="section-header"><div><h2>Flashcards</h2><p class="subheading">'+t.total+' cards · '+t.due+' due</p></div><button class="text-link" data-page="studymerge">Open cards →</button></div>';};
 }
 if(typeof uReview==='function'){
  uReview=function(){if(!USTATE.ready)return '';const d=uDeck(DECK);if(!d)return '';const t=uStats(d);
   return '<div class="panel u-highlight"><div class="panel-header"><h3>Flashcards</h3><span class="badge">'+t.due+' DUE</span></div><button class="btn btn-primary" data-page="studymerge">Review cards →</button></div>';};
 }
 if(typeof heading==='function'){
  const baseHeading=heading;
  heading=function(title,sub,button){
   if(title==='Study Flashcards')return baseHeading(LANG==='zh'?'Chinese flashcards':'English flashcards','',button||'');
   return baseHeading(title,sub,button);
  };
 }
 // Keep the deck fixed even if old buttons try to switch subject.
 if(typeof uAction==='function'){
  const baseU=uAction;
  uAction=function(el){if(el.dataset.action==='u-subject')el.dataset.subject=DECK;USTATE.subject=DECK;return baseU(el);};
 }
 if(typeof render==='function'){
  const baseRender=render;
  render=function(){if(LANG==='zh'&&ui.page!=='studymerge')ui.page='studymerge';USTATE.subject=DECK;const r=baseRender();
   if(ui.page==='studymerge'){const bc=document.getElementById('breadcrumbCurrent');if(bc)bc.textContent='Flashcards';}return r;};
  if(LANG==='zh')ui.page='studymerge';render();
 }
})();
