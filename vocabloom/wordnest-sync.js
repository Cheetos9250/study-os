/* WordNest → Study OS Cloud sync (18 Nov 2026).
   WordNest's word-game progress (words, daily answers per device, my words) already travels inside the English
   flashcard schedule (eng-vocab-v1-srs) as "vb/v1/…" shadow entries, which the main Cloud sync (scripts/study-cloud.js,
   subject 'eng') merges entry by entry with compare-and-set. This file:
   - writes those shadow entries to eng-vocab-v1-srs after every change (before, only the old WordNest "Sync now" did);
   - reads them back when the page opens and after the main sync brings changes from another device;
   - hands "Sync now" / auto sync to StudyCloud, so WordNest has no separate writer any more.
   Reads/writes no new storage keys. The old WordNest sync code stays in unified-progress.js but never runs. */
'use strict';
(function(){
 const ENG='eng-vocab-v1-srs';
 const SC=()=>window.StudyCloud||null;
 function readSrs(){try{const o=JSON.parse(localStorage.getItem(ENG)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch{return {};}}
 /* copy WordNest progress into the English schedule as shadow entries (only newer entries replace older ones) */
 function persist(){
  if(typeof cShadowFromLocal!=='function')return false;
  const raw=localStorage.getItem(ENG),o=readSrs();
  o.s=o.s&&typeof o.s==='object'?o.s:{};
  if(!o.m)o.m={day:0,newDone:0};
  const before=JSON.stringify(o.s);
  try{cShadowFromLocal(o.s);}catch{return false;}
  if(JSON.stringify(o.s)===before)return false;
  if(localStorage.getItem(ENG)!==raw)return false;                        // another tab wrote meanwhile; next change retries
  try{localStorage.setItem(ENG,JSON.stringify(o));return true;}catch{return false;}
 }
 /* bring shadow entries from the schedule (another device's progress after a sync) into WordNest */
 function pull(){
  if(typeof cApplyShadows!=='function')return;
  try{cApplyShadows(readSrs().s||{});}catch{}
 }
 /* one WordNest answer that is not an English word game (Chinese games and cards): counts toward the day like English
    answers do (data.days for this device's view, and the per-device day log that syncs) */
 function count(correct,id){
  if(typeof dayData!=='function'||typeof today!=='function')return;
  const d=dayData();d.answered=(Number(d.answered)||0)+1;if(correct)d.correct=(Number(d.correct)||0)+1;
  d.ids=Array.isArray(d.ids)?d.ids:[];if(id&&!d.ids.includes(id))d.ids.push(id);
  data.days[today()]=d;if(typeof store==='function')store();
  if(typeof cLocalRecord==='function')cLocalRecord(id||null,correct);
  if(typeof updateChrome==='function')updateChrome();
  if(typeof cCloudDebounce==='function')cCloudDebounce();
 }
 window.WordNestSync={persist,pull,count};
 // Chinese flashcards rated in WordNest count too
 if(typeof uRate==='function'){
  const baseRate=uRate;
  uRate=function(d,rating){
   const c=d&&d.key==='zh'&&typeof uCurrent==='function'?uCurrent(d):null,before=c&&uReadSrs(d).s[c.mid]?Number(uReadSrs(d).s[c.mid].ts||0):0;
   const r=baseRate.apply(this,arguments);
   if(c&&Number((uReadSrs(d).s[c.mid]||{}).ts||0)>before)count(Number(rating)>=3,'zh:'+c.mid);
   return r;
  };
 }

 // The old WordNest writer never runs on its own any more.
 if(typeof CLOUD==='object'){CLOUD.enabled=false;clearTimeout(CLOUD.timer);}
 if(typeof cCloudDebounce==='function'){
  cCloudDebounce=function(){persist();const s=SC();if(s)s.dirty();};
 }
 if(typeof cCloudSync==='function'){
  cCloudSync=function(manual){persist();const s=SC();if(!s)return Promise.resolve(null);if(manual){s.open();return Promise.resolve(null);}return s.syncAll('wordnest');};
 }
 if(typeof cPanel==='function'){
  cPanel=function(){
   const s=SC(),lab=s?s.label():'Cloud sync is not available on this page';
   return '<div class="panel mt20 wn-cloud"><span class="section-kicker">CROSS-DEVICE PROGRESS</span><h3 class="mt10">Cloud sync</h3>'
    +'<p>Word games, daily answers, favourites, my words and both flashcard decks sync automatically with the rest of Study OS: when a page opens, after changes and every few minutes. Use the same sync key as Study OS.</p>'
    +'<p class="footnote" id="cloudSyncState" role="status">'+h(lab)+'</p>'
    +'<div class="pill-row"><button class="btn btn-primary" data-action="wn-cloud">Cloud sync…</button><button class="btn btn-outline" data-action="cloud-backup">↓ Local backup</button><button class="btn btn-outline" data-action="cloud-restore">↑ Full restore</button></div>'
    +'<input type="file" id="fullRestoreInput" accept=".json,application/json" hidden></div>';
  };
 }
 if(typeof handleAction==='function'){
  const base=handleAction;
  handleAction=function(el){if(el.dataset.action==='wn-cloud'){persist();const s=SC();if(s)s.open();else toast('Cloud sync is not available');return;}return base(el);};
 }
 const paintLabel=()=>{const el=document.getElementById('cloudSyncState'),s=SC();if(el&&s&&el.closest('.wn-cloud'))el.textContent=s.label();};
 if(SC()&&SC().onStatus)SC().onStatus(paintLabel);
 // Changes from another device: merge the shadows into WordNest and repaint.
 addEventListener('studycloud:applied',e=>{
  const subs=(e.detail&&e.detail.subjects)||[];
  if(subs.includes('eng')){persist();pull();}
  if((subs.includes('eng')||subs.includes('zh'))&&typeof render==='function')render();
 });
 // Another tab (Study OS course page) changed the schedule.
 addEventListener('storage',e=>{if(e.key===ENG){persist();pull();if(typeof render==='function'&&ui.page!=='learn'&&ui.page!=='practice')render();}});
 // Own progress first (so this device's day counts are current), then the other devices'.
 persist();pull();
})();
