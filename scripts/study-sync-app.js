/* Study OS app sync: timetable, exams, plan ticks, tasks, grades, notes and textbook answers across devices.
   Opt-in only (the same "study-sync-auto-v1" switch the course pages use) and only with the separate
   Progress Worker (data/config.json -> progress_api). Never uses the legacy study-api Worker.
   One CAS document (/progress/app, If-Match revision). Per key:
   - changed here only -> upload; changed elsewhere only -> download;
   - changed on both   -> merge (union of exams/tasks/ticks/notes, newer edit wins on the same item);
     the local value before the merge is kept in "study-sync-app-conflict-v1".
   A key missing here is never deleted elsewhere; a missing local key is restored from the cloud.
   Home images (cover, icon, card images) stay on each device. */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.StudySyncApp=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TODAY='studyos.today.v1',HOME='studyos.home.v1',GRADES='studyos.grades.v1',NOTES='studyos.notes.v1',
  TEXTBOOK='studyos.accounting.textbook.progress.v1';
 const KEYS=Object.freeze([TODAY,HOME,GRADES,NOTES,TEXTBOOK]);
 const STATE_KEY='study-sync-app-state-v1',CONFLICT_KEY='study-sync-app-conflict-v1',DEVICE_KEY='study-sync-app-device-v1',
  AUTO_KEY='study-sync-auto-v1',PROGRESS_KEY='study-sync-progress-key-v1';
 const MAX_BYTES=1000000,BAD_IDS=new Set(['__proto__','constructor','prototype']);
 const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 function parse(raw){if(typeof raw!=='string'||!raw)return null;try{const v=JSON.parse(raw);return obj(v)?v:null;}catch(e){return null;}}
 function hash(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return (h>>>0).toString(36)+':'+s.length;}
 function bytes(s){return typeof TextEncoder!=='undefined'?new TextEncoder().encode(s).length:s.length*3;}
 /* The synced part of a stored value, as a canonical string (null = nothing to sync). */
 function pickObj(key,v){
  if(!obj(v))return null;
  if(key===HOME){const o={};if(Array.isArray(v.tasks))o.tasks=v.tasks;if(obj(v.focus))o.focus=v.focus;return Object.keys(o).length?o:null;}
  return v;
 }
 function pick(key,raw){const o=pickObj(key,parse(raw));return o?JSON.stringify(o):null;}
 /* Write a synced part back into the stored value (home keeps its local images and other fields). */
 function put(key,currentRaw,value){
  if(key!==HOME)return JSON.stringify(value);
  const out={...(parse(currentRaw)||{})};delete out.tasks;delete out.focus;
  if(Array.isArray(value.tasks))out.tasks=value.tasks;if(obj(value.focus))out.focus=value.focus;
  return JSON.stringify(out);
 }
 function valid(key,v){
  if(!obj(v))return false;
  if(key===TODAY)return (v.exams===undefined||Array.isArray(v.exams)&&v.exams.every(e=>obj(e)&&typeof e.id==='string'))&&
   (v.done===undefined||obj(v.done))&&(v.tasks===undefined||obj(v.tasks))&&(v.timetable===undefined||Array.isArray(v.timetable));
  if(key===HOME)return (v.tasks===undefined||Array.isArray(v.tasks)&&v.tasks.every(t=>obj(t)&&typeof t.id==='string'))&&(v.focus===undefined||obj(v.focus));
  if(key===GRADES)return Array.isArray(v.courses)&&v.courses.every(c=>obj(c)&&Array.isArray(c.items));
  if(key===NOTES)return Object.keys(v).every(k=>!BAD_IDS.has(k)&&obj(v[k])&&typeof v[k].text==='string');
  if(key===TEXTBOOK)return Object.keys(v).every(k=>!BAD_IDS.has(k)&&obj(v[k]));
  return false;
 }
 function unionById(w,l){
  if(!Array.isArray(w))return Array.isArray(l)?l:undefined;if(!Array.isArray(l))return w;
  const ids=new Set(w.map(x=>x&&x.id)),out=[...w];
  for(const x of l)if(x&&typeof x.id==='string'&&!ids.has(x.id)){ids.add(x.id);out.push(x);}
  return out;
 }
 function nested(w,l){ // {a:{x:..}} maps: union both levels, winner first
  if(!obj(w))return obj(l)?l:w;if(!obj(l))return w;
  const out={...l};for(const k of Object.keys(w))out[k]=obj(w[k])&&obj(l[k])?{...l[k],...w[k]}:w[k];return out;
 }
 function newerEach(w,l){ // {id:{updated:ISO,...}}: newer "updated" wins, ties go to the winner
  const out={...l};
  for(const k of Object.keys(w)){const a=w[k],b=l[k];out[k]=obj(b)&&String(b.updated||'')>String((a&&a.updated)||'')?b:a;}
  return out;
 }
 /* Merge two synced values. w = winner (newer edit), l = the other one. Union first, so nothing is dropped. */
 function merge(key,w,l){
  if(key===TODAY){
   const out={...l,...w};
   const ex=unionById(w.exams,l.exams);if(ex)out.exams=ex;
   const done=nested(w.done,l.done);if(done)out.done=done;
   const tasks=nested(w.tasks,l.tasks);if(tasks)out.tasks=tasks;
   if(Array.isArray(w.seenDefaults)||Array.isArray(l.seenDefaults))out.seenDefaults=[...new Set([...(w.seenDefaults||[]),...(l.seenDefaults||[])])];
   return out;
  }
  if(key===HOME){
   const out={},t=unionById(w.tasks,l.tasks);if(t)out.tasks=t;
   if(obj(w.focus)||obj(l.focus))out.focus={...(l.focus||{}),...(w.focus||{})};
   return out;
  }
  if(key===NOTES||key===TEXTBOOK)return newerEach(w,l);
  return w; // grades: whole document from the newer edit (the other copy is kept as the conflict copy)
 }
 function readState(storage){
  const s=parse(storage.getItem(STATE_KEY))||{};
  return {base:obj(s.base)?s.base:{},seen:obj(s.seen)?s.seen:{}};
 }
 function writeState(storage,st){try{storage.setItem(STATE_KEY,JSON.stringify(st));}catch(e){}}
 /* Remember roughly when each key was last edited here (called on a timer). */
 function noteEdits(storage,now){
  const st=readState(storage),t=now||Date.now();let changed=false;
  for(const k of KEYS){
   const L=pick(k,storage.getItem(k));if(L===null)continue;const h=hash(L);
   if(!st.seen[k]||st.seen[k].h!==h){st.seen[k]={h,ts:t};changed=true;}
  }
  if(changed)writeState(storage,st);
  return st;
 }
 /* True when something here has not been uploaded yet. */
 function pending(storage){
  const st=readState(storage);
  return KEYS.some(k=>{const L=pick(k,storage.getItem(k));return L!==null&&(!st.base[k]||st.base[k].h!==hash(L));});
 }
 function device(storage){
  let id='';try{id=storage.getItem(DEVICE_KEY)||'';}catch(e){}
  if(!id){id='dev-'+Math.random().toString(36).slice(2,10)+Date.now().toString(36);try{storage.setItem(DEVICE_KEY,id);}catch(e){}}
  return id;
 }
 function fail(code,msg){const e=new Error(msg);e.code=code;return e;}
 /* One sync round: GET -> per-key decision -> conditional PUT (retry on 409) -> write local keys. */
 async function syncOnce(o){
  const storage=o.storage,fetchFn=o.fetch,now=o.now||Date.now,url=o.endpoint.replace(/\/+$/,'')+'/progress/app';
  const hdr={'X-Sync-Key':o.key,'Content-Type':'application/json'};
  let devId='';const dev=()=>devId||(devId=device(storage));
  for(let attempt=1;attempt<=6;attempt++){
   const r=await fetchFn(url,{headers:hdr,cache:'no-store'});
   if(r.status===401)throw fail('auth','Wrong sync key');
   if(!r.ok)throw fail('http','Cloud read failed (HTTP '+r.status+')');
   const tag=(r.headers.get('X-Sync-Revision')||r.headers.get('ETag')||'');
   if(!/^"[0-9]+"$/.test(tag))throw fail('cas','The sync server sent no revision, so nothing was changed');
   const remote=await r.json();
   if(!obj(remote)||remote.v!==1||!obj(remote.keys))throw fail('data','The cloud copy has an unknown format, so nothing was changed');
   const t=now(),st=readState(storage),snap={},writes={},next={...remote.keys},res={pulled:[],pushed:[],merged:[]};
   let push=false;
   for(const k of KEYS){
    const raw=storage.getItem(k);snap[k]=raw;
    const L=pick(k,raw),B=st.base[k],R=remote.keys[k];
    let Rv=null;
    if(R!==undefined){
     if(!obj(R)||typeof R.value!=='string'||!Number.isFinite(R.ts))throw fail('data','The cloud copy is damaged, so nothing was changed');
     Rv=parse(R.value);
     if(!valid(k,Rv))throw fail('data','The cloud copy is damaged, so nothing was changed');
    }
    if(L===null&&!R)continue;
    // A key the cloud lost is uploaded again.
    const lc=L!==null&&(!B||B.h!==hash(L)||!R),rc=!!R&&(!B||B.ts!==R.ts||L===null);
    // The cloud time of a value is when it was edited here (so the newer edit wins later), always after the old one.
    const editTs=L!==null&&st.seen[k]&&st.seen[k].h===hash(L)?st.seen[k].ts:t;
    const stamp=()=>Math.max(editTs,(R?R.ts:0)+1);
    if(lc&&!rc){next[k]={value:L,ts:stamp(),dev:dev()};push=true;res.pushed.push(k);}
    else if(rc&&!lc){if(L!==R.value){writes[k]=Rv;res.pulled.push(k);}}
    else if(lc&&rc){
     const Lv=parse(L);
     // Newer edit wins on the same item. With no shared history yet, the cloud copy is the established one.
     const localWins=!!B&&editTs>R.ts;
     const m=localWins?merge(k,Lv,Rv):merge(k,Rv,Lv),ms=JSON.stringify(m);
     if(ms!==R.value){next[k]={value:ms,ts:stamp(),dev:dev()};push=true;}
     if(ms!==L){writes[k]=m;res.pulled.push(k);}
     res.merged.push(k);
     o.conflict&&o.conflict(k,raw);
    }
   }
   let revision=tag;
   if(push){
    const body=JSON.stringify({v:1,keys:next});
    if(bytes(body)>MAX_BYTES)throw fail('size','Too much data to sync (over 1 MB)');
    const p=await fetchFn(url,{method:'PUT',headers:{...hdr,'If-Match':tag},body});
    if(p.status===409||p.status===412)continue;
    if(p.status===401)throw fail('auth','Wrong sync key');
    if(!p.ok)throw fail('http','Cloud write failed (HTTP '+p.status+')');
    revision=p.headers.get('X-Sync-Revision')||p.headers.get('ETag')||revision;
   }
   // Write local keys only if this page did not change them meanwhile; otherwise the next round merges them.
   const fresh=readState(storage),skipped=[];
   for(const k of KEYS){
    const entry=next[k];if(!entry)continue;
    const cur=storage.getItem(k);
    if(cur!==snap[k]){skipped.push(k);continue;}
    if(writes[k]){try{storage.setItem(k,put(k,cur,writes[k]));}catch(e){skipped.push(k);continue;}}
    const L=pick(k,storage.getItem(k));
    if(L!==null)fresh.base[k]={h:hash(L),ts:entry.ts};
   }
   writeState(storage,fresh);
   res.pulled=res.pulled.filter(k=>!skipped.includes(k));res.revision=revision;res.skipped=skipped;
   return res;
  }
  throw fail('busy','Another device kept changing the data; local data is kept, try again');
 }
 function saveConflict(storage,k,raw){
  try{const c=parse(storage.getItem(CONFLICT_KEY))||{};c[k]={at:new Date().toISOString(),local:raw};storage.setItem(CONFLICT_KEY,JSON.stringify(c));}catch(e){}
 }

 /* ---------- browser runner + panel ---------- */
 const S={api:'',loaded:false,busy:false,msg:'',ok:true,last:0,timer:null,armed:false,panel:null,reloadPending:false};
 const ls=()=>{try{return window.localStorage;}catch(e){return null;}};
 function get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
 function key(){const e=parse(get(PROGRESS_KEY));return e&&e.endpoint===S.api&&typeof e.key==='string'?e.key.trim():'';}
 const autoOn=()=>get(AUTO_KEY)==='1';
 const ready=()=>!!(S.api&&key());
 async function config(){
  if(S.loaded)return S.api;
  try{const r=await fetch('data/config.json',{cache:'no-store'});if(r.ok){const j=await r.json();const legacy=String(j.api||'').replace(/\/+$/,'');
   const p=String(j.progress_api||'').replace(/\/+$/,'');S.api=/^(https:\/\/|http:\/\/(127\.0\.0\.1|localhost)[:/])/.test(p)&&p!==legacy?p:'';}}catch(e){}
  S.loaded=true;return S.api;
 }
 function typing(){const a=document.activeElement;return !!a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable);}
 function say(t,ok){S.msg=t;S.ok=ok!==false;paint();}
 const hhmm=t=>new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Bangkok'}).format(new Date(t));
 function reloadSoon(){
  // Show what the other device saved. Guard against reload loops.
  let n=0;try{const v=JSON.parse(sessionStorage.getItem('study-sync-app-reload')||'null');if(v&&Date.now()-v.t<30000)n=v.n;}catch(e){}
  if(n>=2){say('Updated from another device. Reload the page to see it.');return;}
  try{sessionStorage.setItem('study-sync-app-reload',JSON.stringify({t:Date.now(),n:n+1}));}catch(e){}
  location.reload();
 }
 async function run(manual,force){
  if(S.busy)return;await config();
  if(!S.api){say('Cloud sync is not set up yet',false);return;}
  if(!key()){if(manual)askKey();return;}
  if(!manual&&!force&&typing()){schedule(10000);return;}
  S.busy=true;say('Syncing…');
  const work=async()=>{
   const st=ls();noteEdits(st);
   return syncOnce({storage:st,fetch:(u,i)=>fetch(u,i),endpoint:S.api,key:key(),conflict:(k,raw)=>saveConflict(st,k,raw)});
  };
  try{
   const res=navigator.locks&&navigator.locks.request?await navigator.locks.request('study-sync-app',work):await work();
   S.last=Date.now();say('Synced '+hhmm(S.last));
   if(res.pulled.length){
    try{window.dispatchEvent(new CustomEvent('studyos:synced',{detail:res}));}catch(e){}
    if(document.hidden)S.reloadPending=true;else if(!typing())reloadSoon();else{S.reloadPending=true;say('Updated from another device. Reload to see it.');}
   }
  }catch(e){
   if(e&&e.code==='auth'){try{localStorage.removeItem(PROGRESS_KEY);}catch(x){}}
   say('Sync failed: '+String(e&&e.message||e),false);
  }finally{S.busy=false;paint();}
 }
 function schedule(ms){clearTimeout(S.timer);S.timer=setTimeout(()=>{if(autoOn()&&ready())run(false);},ms);}
 function arm(){
  if(S.armed)return;S.armed=true;
  setInterval(()=>{if(!autoOn()||!ready()||document.hidden)return;const st=ls();noteEdits(st);if(pending(st))schedule(8000);},15000);
  setInterval(()=>{if(autoOn()&&ready()&&!document.hidden)run(false);},300000);
  document.addEventListener('visibilitychange',()=>{
   if(!autoOn()||!ready())return;
   if(document.hidden){if(pending(ls()))run(false,true);}
   else if(S.reloadPending&&!typing())reloadSoon();
   else schedule(800);
  });
 }
 function askKey(){
  let k='';try{k=window.prompt('Enter the key for the Progress Worker.\n\nUse the same key on every device. Do not reuse the original Worker key.')||'';}catch(e){}
  k=k.trim();if(!k)return;
  try{localStorage.setItem(PROGRESS_KEY,JSON.stringify({endpoint:S.api,key:k}));}catch(e){say('Could not save the key on this device',false);return;}
  paint();run(true);
 }
 function setAuto(on){
  try{if(on)localStorage.setItem(AUTO_KEY,'1');else localStorage.removeItem(AUTO_KEY);}catch(e){say('Could not save the setting',false);return;}
  if(on){arm();run(false);}else{clearTimeout(S.timer);say('Auto sync is off');}
  paint();
 }
 const CSS='#ssaPanel{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.45)}'
 +'#ssaPanel[hidden]{display:none}'
 +'#ssaPanel .ssa-box{--b:#fff;--f:#111;--m:#474747;--ok:#1d6b3f;--bad:#b3261e;background:var(--b);color:var(--f);border:3px solid var(--f);border-radius:6px;padding:20px;width:min(420px,100%);box-sizing:border-box;font-family:"Zen Maru Gothic","Mali",system-ui,-apple-system,sans-serif;box-shadow:6px 6px 0 rgba(0,0,0,.25)}'
 +'@media(prefers-color-scheme:dark){:root:not([data-theme="light"]) #ssaPanel .ssa-box{--b:#0e0e0f;--f:#f0f0ee;--m:#a9a9a6;--ok:#7fd6a0;--bad:#ff9b8f}}'
 +':root[data-theme="dark"] #ssaPanel .ssa-box{--b:#0e0e0f;--f:#f0f0ee;--m:#a9a9a6;--ok:#7fd6a0;--bad:#ff9b8f}'
 +'#ssaPanel h2{font:700 22px/1.2 "Kaisei Decol",serif;margin:0 0 8px}'
 +'#ssaPanel p{margin:0 0 12px;color:var(--m);font-size:14px;line-height:1.5}'
 +'#ssaPanel .ssa-st{color:var(--ok);font-weight:700;min-height:1.4em}#ssaPanel .ssa-st.bad{color:var(--bad)}'
 +'#ssaPanel .ssa-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}'
 +'#ssaPanel button{font:inherit;font-weight:700;min-height:44px;padding:0 16px;border-radius:6px;border:2px solid var(--f);background:var(--b);color:var(--f);cursor:pointer}'
 +'#ssaPanel button.pri{background:var(--f);color:var(--b)}#ssaPanel button:disabled{opacity:.45;cursor:default}'
 +'#ssaPanel button:focus-visible{outline:3px solid #2f6bff;outline-offset:2px}';
 function mountPanel(){
  if(S.panel)return S.panel;
  const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  const p=document.createElement('div');p.id='ssaPanel';p.hidden=true;p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-labelledby','ssaTitle');
  p.innerHTML='<div class="ssa-box"><h2 id="ssaTitle">Cloud sync</h2>'
  +'<p>Keeps your timetable, exams, plan ticks, tasks, grades, notes, textbook answers and course progress the same on every device. Images stay on each device.</p>'
  +'<p class="ssa-st" role="status"></p>'
  +'<div class="ssa-row"><button type="button" class="ssa-auto pri"></button><button type="button" class="ssa-now">Sync now</button><button type="button" class="ssa-key">Set key</button><button type="button" class="ssa-close">Close</button></div></div>';
  document.body.appendChild(p);
  p.addEventListener('click',e=>{if(e.target===p)close();});
  p.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  p.querySelector('.ssa-close').onclick=close;
  p.querySelector('.ssa-key').onclick=askKey;
  p.querySelector('.ssa-now').onclick=()=>run(true);
  p.querySelector('.ssa-auto').onclick=()=>{
   if(autoOn()){setAuto(false);return;}
   if(!key()){askKey();if(!key())return;}
   if(window.confirm('Turn on auto sync?\n\nThis device will send and receive your study data with your own Progress Worker when a page opens, after you change something and every few minutes. Back up first if you have not yet.'))setAuto(true);
  };
  S.panel=p;return p;
 }
 function paint(){
  const p=S.panel;if(!p)return;
  const st=p.querySelector('.ssa-st'),setup=!!S.api,has=!!key();
  let t=S.msg;
  if(!setup)t='Cloud sync is not set up yet. It starts after the sync server is deployed.';
  else if(!has&&!t)t='Enter the sync key to start.';
  else if(!t)t=autoOn()?'Auto sync is on':'Auto sync is off';
  st.textContent=t;st.classList.toggle('bad',!setup||!S.ok);
  const a=p.querySelector('.ssa-auto');a.textContent=autoOn()?'Turn auto sync off':'Turn auto sync on';a.disabled=!setup;
  p.querySelector('.ssa-now').disabled=!setup||!has||S.busy;p.querySelector('.ssa-key').disabled=!setup;
  p.querySelector('.ssa-key').textContent=has?'Change key':'Set key';
 }
 let opener=null;
 async function open(){const p=mountPanel();opener=document.activeElement;p.hidden=false;paint();await config();paint();const b=p.querySelector('button:not(:disabled)');b&&b.focus();}
 function close(){if(S.panel)S.panel.hidden=true;if(opener&&opener.focus)opener.focus();}
 function boot(){config().then(()=>{if(autoOn()&&ready()){arm();schedule(1200);}});}
 if(typeof window!=='undefined'&&typeof document!=='undefined'&&!window.__studySyncApp){
  window.__studySyncApp=true;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
 }
 return {KEYS,STATE_KEY,CONFLICT_KEY,AUTO_KEY,PROGRESS_KEY,pick,put,valid,merge,hash,noteEdits,pending,syncOnce,open,close,run:()=>run(true)};
});
