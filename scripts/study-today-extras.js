/* Today extras (TASKS 32–36, 18 Nov 2026), loaded only by index.html:
   - Study time this week per subject, from the Pomodoro log (studyos.pomolog.v1 bySub);
   - "What did you finish?" after a 25-minute Pomodoro, kept as pomolog `logs` {day: [{t, s, n}]} (backed up, validated);
   - Formulas drawer: your pinned formulas (studyos.notes.v1 "<course>:pins") plus a built-in Excel and accounting sheet;
   - Quick words: 5 random English words from data/cards.json to flip during a break;
   - Keyboard shortcuts: Space start/pause, N new task, F formulas, W words, ? help.
   Pure helpers are exported for tests. */
(function(root,factory){
 'use strict';const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudyTodayX=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const DAY=86400000,TZ=7*3600000,LOGKEY='studyos.pomolog.v1',NOTES='studyos.notes.v1';
 const NAMES={acc:'Accounting',eco:'Economics',math:'Math',excel:'Excel',eng:'English',zh:'Chinese'};
 const dayKey=t=>new Date(Math.floor((t+TZ)/DAY)*DAY).toISOString().slice(0,10);
 function weekDays(now){const d=dayKey(now),dow=(new Date(d+'T00:00:00Z').getUTCDay()+6)%7,t0=Date.parse(d+'T00:00:00Z'),out=[];for(let i=dow;i>=0;i--)out.push(new Date(t0-i*DAY).toISOString().slice(0,10));return out;}
 /* minutes per subject this week (Monday → today), most first */
 function weekTime(log,now){const m={};for(const d of weekDays(now)){const b=log&&log.bySub&&log.bySub[d];if(b&&typeof b==='object')for(const k of Object.keys(b))m[k]=(m[k]||0)+(+b[k]||0);}
  return Object.entries(m).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);}
 /* add a session note; one per session end time, at most 40 a day, 200 characters each */
 function addLog(log,end,sub,text){const o=log&&typeof log==='object'?log:{},t=String(text||'').trim().slice(0,200);if(!t||!end)return o;
  const d=dayKey(end);o.logs=o.logs&&typeof o.logs==='object'?o.logs:{};const list=Array.isArray(o.logs[d])?o.logs[d]:[];
  if(list.some(x=>x&&x.t===end))return o;list.push(Object.assign({t:end,n:t},sub?{s:sub}:{}));o.logs[d]=list.slice(-40);return o;}
 /* next date of a repeating task: daily or weekly, never in the past */
 function nextDate(date,rep,today){const step=rep==='w'?7:rep==='d'?1:0;if(!step)return null;let t=Date.parse(date+'T00:00:00Z')+step*DAY;const td=Date.parse(today+'T00:00:00Z');while(t<td)t+=step*DAY;return new Date(t).toISOString().slice(0,10);}
 function pickWords(rows,n,seed){const list=(rows||[]).filter(r=>r&&r.Subject==='English Vocab'&&r.Status==='Verified'&&r.Front&&r.Back);let s=seed||Date.now()%2147483647||1;
  const rnd=()=>{s=(s*48271)%2147483647;return s/2147483647;};const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a.slice(0,n||5).map(r=>({w:r.Front,m:String(r.Back).split('\n')[0]}));}
 const EXCEL=[['VLOOKUP','=VLOOKUP(value, table, col_index, FALSE) — exact match, looks right only'],['XLOOKUP','=XLOOKUP(value, lookup_range, return_range, "Not found")'],['INDEX + MATCH','=INDEX(return_range, MATCH(value, lookup_range, 0))'],
  ['SUMIFS','=SUMIFS(sum_range, criteria_range1, criteria1, …)'],['COUNTIFS','=COUNTIFS(range1, criteria1, …)'],['IF','=IF(test, value_if_true, value_if_false)'],['Absolute reference','$A$1 fixed · A$1 row fixed · $A1 column fixed (F4 cycles)']];
 const ACC=[['Accounting equation','Assets = Liabilities + Equity'],['Normal balances','Assets, Expenses, Drawings: Debit · Liabilities, Equity, Revenue: Credit'],['COGS (periodic)','Beginning inventory + Net purchases − Ending inventory'],['Gross profit','Net sales − Cost of goods sold'],['Net realizable value','Accounts receivable − Allowance for doubtful accounts'],['Interest on a note','Principal × rate × time (days/360)']];
 if(typeof document==='undefined')return {weekDays,weekTime,addLog,nextDate,pickWords,EXCEL,ACC,dayKey};

 const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 function readJ(k){try{const o=JSON.parse(localStorage.getItem(k)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch(e){return {};}}
 const CSS=''
 +'.tx-row{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 0}.tx-row button{min-height:44px;padding:0 14px;border:2.5px solid var(--ink);border-radius:var(--r-s,6px);background:var(--panel);color:var(--text);font:700 14px var(--ui);cursor:pointer}.tx-row button:hover{background:var(--panel-2)}.tx-row kbd{font:600 11px var(--ui);color:var(--muted);border:1px solid var(--line-soft);border-radius:4px;padding:0 4px;margin-left:6px}'
 +'.tx-card{margin:12px 0 0;padding:12px 16px;border:var(--bw,3px) solid var(--ink);border-radius:var(--r,2px);background:var(--panel)}.tx-card h3{margin:0 0 6px;font-size:16px}.tx-card .sub{margin:0 0 8px;font-size:13px;color:var(--muted)}'
 +'.tx-bar{display:grid;grid-template-columns:110px minmax(0,1fr) 64px;gap:10px;align-items:center;font-size:14px;margin:4px 0}.tx-bar i{display:block;height:12px;border:2px solid var(--ink);border-radius:99px;overflow:hidden;background:var(--panel)}.tx-bar i b{display:block;height:100%;background:var(--acc)}.tx-bar span:last-child{text-align:right;font-variant-numeric:tabular-nums;color:var(--muted)}'
 +'.tx-log{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.tx-log input{flex:1 1 220px;min-height:44px;border:2px solid var(--ink);border-radius:var(--r-s,6px);background:var(--panel);color:var(--text);font:500 15px var(--ui);padding:0 10px;min-width:0}.tx-log button,.tx-card .tx-b{min-height:44px;padding:0 14px;border:2.5px solid var(--ink);border-radius:var(--r-s,6px);background:var(--panel);color:var(--text);font:700 14px var(--ui);cursor:pointer}.tx-log button.primary{background:var(--ink);color:var(--accent-ink)}'
 +'.tx-logs{list-style:none;margin:8px 0 0;padding:0;font-size:14px}.tx-logs li{padding:4px 0;border-top:1px solid var(--line-soft)}.tx-logs small{color:var(--muted);margin-right:6px}'
 +'.tx-words{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.tx-words button{min-height:64px;border:2px solid var(--ink);border-radius:8px;background:var(--panel);color:var(--text);font:600 15px var(--ui);cursor:pointer;padding:8px;overflow-wrap:anywhere}.tx-words button[aria-pressed="true"]{background:var(--acc-soft)}'
 +'#txDrawer{position:fixed;z-index:95;top:0;right:0;bottom:0;width:min(420px,100vw);background:var(--panel);color:var(--text);border-left:3px solid var(--ink);padding:max(16px,env(safe-area-inset-top)) 16px 24px;overflow-y:auto;box-shadow:-10px 0 30px -12px rgba(0,0,0,.35)}#txDrawer[hidden]{display:none}'
 +'#txDrawer h2{margin:0 0 8px;font-size:22px;display:flex;align-items:center;gap:8px}#txDrawer h2 span{flex:1}#txDrawer h3{margin:14px 0 4px;font-size:15px}#txDrawer dl{margin:0}#txDrawer dt{font-weight:900;font-size:13px;margin-top:6px}#txDrawer dd{margin:0 0 4px;font-size:14px;line-height:1.5;overflow-wrap:anywhere}#txDrawer .x{min-width:44px;min-height:44px;border:2.5px solid var(--ink);border-radius:6px;background:var(--panel);color:var(--text);font:700 18px var(--ui);cursor:pointer}'
 +'@media(max-width:560px){.tx-bar{grid-template-columns:84px minmax(0,1fr) 56px}}';
 function css(){if($('#txCss'))return;const s=document.createElement('style');s.id='txCss';s.textContent=CSS;document.head.appendChild(s);}
 /* ---------- study time ---------- */
 function renderTime(){const el=$('#studyTime');if(!el)return;const w=weekTime(readJ(LOGKEY),Date.now()),total=w.reduce((n,[,v])=>n+v,0),max=Math.max(1,...w.map(([,v])=>v));
  el.innerHTML='<h3>Study time this week</h3><p class="sub">Pomodoro minutes per subject, Monday to today'+(total?' · '+(Math.round(total/6)/10)+' h in all':'')+'</p>'
   +(w.length?w.map(([k,v])=>'<div class="tx-bar"><span>'+esc(NAMES[k]||k)+'</span><i role="img" aria-label="'+esc((NAMES[k]||k)+' '+v+' minutes')+'"><b style="width:'+Math.round(v/max*100)+'%"></b></i><span>'+(v>=60?(Math.round(v/6)/10)+' h':v+' min')+'</span></div>').join('')
    +((()=>{const miss=['acc','eco','math'].filter(k=>!w.some(([x])=>x===k));return miss.length?'<p class="sub" style="margin-top:6px">No Pomodoro yet this week: '+miss.map(k=>NAMES[k]).join(', ')+'.</p>':'';})())
    :'<p class="sub">Pick a subject under the Pomodoro timer; finished 25-minute sessions show up here.</p>');}
 /* ---------- session log ---------- */
 let pending=null;
 function renderLog(){const el=$('#sessionLog');if(!el)return;const log=readJ(LOGKEY),today=dayKey(Date.now()),list=(log.logs&&Array.isArray(log.logs[today])?log.logs[today]:[]).slice().reverse();
  el.hidden=!pending&&!list.length;if(el.hidden)return;
  const hhmm=t=>new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'}).format(new Date(t));
  el.innerHTML='<h3>Session log</h3>'+(pending?'<form class="tx-log" id="txLogForm"><label class="sub" for="txLogIn" style="width:100%;margin:0">Session done'+(pending.sub?' · '+esc(NAMES[pending.sub]||pending.sub):'')+'. What did you finish?</label><input id="txLogIn" maxlength="200" placeholder="e.g. Ch6 FIFO questions 1–15" autocomplete="off"><button class="primary" type="submit">Save</button><button type="button" id="txLogSkip">Skip</button></form>':'')
   +(list.length?'<ul class="tx-logs">'+list.map(x=>'<li><small>'+hhmm(x.t)+(x.s?' · '+esc(NAMES[x.s]||x.s):'')+'</small>'+esc(x.n)+'</li>').join('')+'</ul>':'');
  const f=$('#txLogForm');if(f){f.onsubmit=e=>{e.preventDefault();const v=$('#txLogIn').value;if(v.trim()){try{localStorage.setItem(LOGKEY,JSON.stringify(addLog(readJ(LOGKEY),pending.end,pending.sub,v)));window.StudyCloud&&StudyCloud.dirty();}catch(err){}}pending=null;renderLog();};
   $('#txLogSkip').onclick=()=>{pending=null;renderLog();};setTimeout(()=>{try{$('#txLogIn').focus({preventScroll:true});}catch(e){}},50);}}
 function sessionDone(sub,end){pending={sub:sub||'',end:end||Date.now()};renderLog();renderTime();const el=$('#sessionLog');if(el&&el.scrollIntoView)el.scrollIntoView({block:'nearest',behavior:'smooth'});}
 /* ---------- formulas drawer ---------- */
 function drawer(){let d=$('#txDrawer');if(!d){d=document.createElement('aside');d.id='txDrawer';d.hidden=true;d.setAttribute('role','dialog');d.setAttribute('aria-label','Formulas');document.body.appendChild(d);
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!d.hidden)toggleDrawer(false);});}return d;}
 let back=null;
 function toggleDrawer(on){const d=drawer();if(on===undefined)on=d.hidden;if(!on){d.hidden=true;if(back&&back.focus&&document.contains(back))try{back.focus({preventScroll:true});}catch(e){}else if(document.activeElement&&d.contains(document.activeElement))document.activeElement.blur();return;}
  back=document.activeElement&&document.activeElement!==document.body?document.activeElement:null;
  const notes=readJ(NOTES),pins=['acc','eco','math'].map(k=>{const n=notes[k+':pins'];return [k,n&&typeof n.text==='string'?n.text.split('\n').map(l=>l.trim()).filter(l=>l&&!l.startsWith('//')):[]];}).filter(([,l])=>l.length);
  const dl=list=>'<dl>'+list.map(([t,b])=>'<dt>'+esc(t)+'</dt><dd>'+esc(b)+'</dd>').join('')+'</dl>';
  d.innerHTML='<h2><span>Formulas</span><button type="button" class="x" aria-label="Close formulas">×</button></h2>'
   +(pins.length?pins.map(([k,l])=>'<h3>📌 '+esc(NAMES[k])+'</h3>'+dl(l.map(x=>{const i=x.indexOf('::');return i>0?[x.slice(0,i).trim(),x.slice(i+2).trim()]:['',x];}))).join(''):'<p class="sub" style="font-size:13px">Your own pinned formulas show here. Add them on <a href="practice.html">Practice → Pinned formulas</a>.</p>')
   +'<h3>Accounting basics</h3>'+dl(ACC)+'<h3>Excel</h3>'+dl(EXCEL)+'<p style="font-size:13px;margin-top:14px"><a href="practice.html">Edit your pinned formulas →</a></p>';
  d.querySelector('.x').onclick=()=>toggleDrawer(false);d.hidden=false;d.querySelector('.x').focus();}
 /* ---------- quick words ---------- */
 let rows=null;
 async function showWords(){const el=$('#quickWords');if(!el)return;el.hidden=false;el.innerHTML='<h3>Quick words</h3><p class="sub">Loading…</p>';
  if(!rows){try{const r=await fetch('data/cards.json',{cache:'no-cache'});rows=r.ok?(await r.json()).rows||[]:[];}catch(e){rows=[];}}
  const w=pickWords(rows,5,Date.now()%2147483646+1);
  el.innerHTML='<h3>Quick words</h3><p class="sub">Five English words for your break · tap to see the meaning · <a href="vocabloom/?lang=en">WordNest →</a></p>'+(w.length?'<div class="tx-words">'+w.map((x,i)=>'<button type="button" data-i="'+i+'" aria-pressed="false">'+esc(x.w)+'</button>').join('')+'</div><div class="tx-row"><button type="button" id="txMore">5 more</button><button type="button" id="txHide">Hide</button></div>':'<p class="sub">Could not load the words (offline?).</p>');
  el.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const x=w[+b.dataset.i],on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));b.textContent=on?x.m:x.w;});
  const m=$('#txMore');if(m)m.onclick=showWords;const h=$('#txHide');if(h)h.onclick=()=>{el.hidden=true;};}
 function breakStarted(){showWords();}
 /* ---------- shortcuts ---------- */
 function help(){alert('Keyboard shortcuts on Today\n\nSpace  start / pause the Pomodoro\nN  add a task\nF  formulas\nW  quick words\nCtrl+K or /  search\n?  this help');}
 function keys(e){if(e.metaKey||e.ctrlKey||e.altKey)return;const a=document.activeElement;if(a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable))return;
  if(e.key===' '){if(a&&/^(BUTTON|A)$/.test(a.tagName))return; /* Space presses the focused button as usual */const b=$('#pStart');if(b){e.preventDefault();b.click();}}
  else if(e.key==='n'||e.key==='N'){const t=$('#tTitle');if(t){e.preventDefault();t.focus();t.scrollIntoView({block:'center',behavior:'smooth'});}}
  else if(e.key==='f'||e.key==='F'){e.preventDefault();toggleDrawer();}
  else if(e.key==='w'||e.key==='W'){e.preventDefault();showWords();}
  else if(e.key==='?'){e.preventDefault();help();}}
 function mount(){if(!$('#studyTime'))return;css();
  const row=$('#txRow');if(row){row.innerHTML='<button type="button" id="txF">Formulas<kbd>F</kbd></button><button type="button" id="txW">Quick words<kbd>W</kbd></button><button type="button" id="txK">Shortcuts<kbd>?</kbd></button>';
   $('#txF').onclick=()=>toggleDrawer();$('#txW').onclick=showWords;$('#txK').onclick=help;}
  renderTime();renderLog();document.addEventListener('keydown',keys);
  addEventListener('studycloud:applied',()=>{renderTime();renderLog();});document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderTime();renderLog();}});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
 return {weekDays,weekTime,addLog,nextDate,pickWords,EXCEL,ACC,dayKey,sessionDone,breakStarted,toggleDrawer,showWords};
});
