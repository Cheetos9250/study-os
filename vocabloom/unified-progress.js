
/* VocaBloom unified progress bridge, additive to Study OS; does not delete original data. */
'use strict';
const CLOUD_KEY='study-sync-key', CLOUD_PROGRESS_KEY='study-sync-progress-key-v1', CLOUD_DEVICE_KEY='vocabloom-device-v1';
const CLOUD_LOCAL_DAYS='vocabloom-device-days-v1', CLOUD_STUDY_DAYS='vocabloom-device-study-days-v1';
const CLOUD_LAST='vocabloom-last-sync-v1', CLOUD_AUTO='vocabloom-auto-sync-v1';
const CLOUD_PREFIX='vb/v1/';
const CLOUD_AUTOSYNC_MIGRATION='vocabloom-autosync-safety-v2';
const CLOUD_AUTO_ENDPOINT='vocabloom-auto-sync-endpoint-v1';
const CLOUD={busy:false,error:'',message:'',last:0,timer:null,api:'',progressSplit:false,enabled:false,remoteStatus:'not verified'};
function cSafeGet(k){try{return localStorage.getItem(k)}catch{return null}}
function cSafeSet(k,v){try{localStorage.setItem(k,v);return true}catch{return false}}
function cSafeJSON(k,fallback){try{const o=JSON.parse(cSafeGet(k)||'null');return o&&typeof o==='object'?o:fallback}catch{return fallback}}
function cDevice(){let id=cSafeGet(CLOUD_DEVICE_KEY);if(!id){id='device-'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2));cSafeSet(CLOUD_DEVICE_KEY,id)}return id}
function cDate(){return typeof today==='function'?today():new Date().toISOString().slice(0,10)}
function cWordKey(str){return String(str||'').toLowerCase().normalize('NFKC').trim().replace(/\s+/g,' ')}
const CLOCAL={days:{},studyDays:{},device:''};
function cInitLocal(){
 CLOCAL.device=cDevice();
 const oldDays=cSafeJSON(CLOUD_LOCAL_DAYS,null);
 CLOCAL.days=oldDays||structuredClone(data.days||{});
 if(!oldDays)cSafeSet(CLOUD_LOCAL_DAYS,JSON.stringify(CLOCAL.days));
 CLOCAL.studyDays=cSafeJSON(CLOUD_STUDY_DAYS,{});
 let changed=false;
 for(const w of data.custom||[]){if(w?.id&&w?.en&&!Number(w.syncTs)){w.syncTs=Date.now();changed=true;}}
 if(changed)store();
 const n=Number(cSafeGet(CLOUD_LAST)||0);CLOUD.last=Number.isFinite(n)?n:0;
 // One-time safety migration: old versions could silently enable Auto Sync when a key was entered.
 // Preserve all scores and the key, but require an explicit new opt-in for background writes.
 if(!cSafeGet(CLOUD_AUTOSYNC_MIGRATION)){
  if(cSafeGet(CLOUD_AUTO)==='1'){
   cSafeSet(CLOUD_AUTO,'0');
   CLOUD.message='The previous Auto Sync was turned off for safety; turn it on again yourself if you want it';
  }
  cSafeSet(CLOUD_AUTOSYNC_MIGRATION,'1');
 }
 CLOUD.enabled=cSafeGet(CLOUD_AUTO)==='1';
}
function cLocalRecord(wordId,correct){
 const date=cDate(),o=CLOCAL.days[date]||{answered:0,correct:0,ids:[]};
 o.answered=(Number(o.answered)||0)+1;o.correct=(Number(o.correct)||0)+(correct?1:0);
 if(!Array.isArray(o.ids))o.ids=[];if(wordId&&!o.ids.includes(wordId))o.ids.push(wordId);
 CLOCAL.days[date]=o;cSafeSet(CLOUD_LOCAL_DAYS,JSON.stringify(CLOCAL.days));
}
function cStudyRecord(correct){
 const date=cDate(),o=CLOCAL.studyDays[date]||{answered:0,correct:0};
 o.answered=(Number(o.answered)||0)+1;o.correct=(Number(o.correct)||0)+(correct?1:0);
 CLOCAL.studyDays[date]=o;cSafeSet(CLOUD_STUDY_DAYS,JSON.stringify(CLOCAL.studyDays));
}
function cEnglishCardMap(){
 const d=typeof uDeck==='function'?uDeck('eng'):null;
 if(!d||typeof uCards!=='function')return new Map();
 if(CLOUD.cardCache&&CLOUD.cardCache.deck===d&&CLOUD.cardCache.rows===USTATE.rows)return CLOUD.cardCache.map;
 const map=new Map();
 for(const c of uCards(d)){const k=cWordKey(c.f);if(k&&!map.has(k))map.set(k,c);}
 CLOUD.cardCache={deck:d,rows:USTATE.rows,map};
 return map;
}
function cOriginalCardFor(w){return cEnglishCardMap().get(cWordKey(w.en))||null;}
function cWordForCard(c){
 if(!c||typeof allWords!=='function')return null;
 const k=cWordKey(c.f);return allWords().find(w=>cWordKey(w.en)===k)||null;
}
function cBridgeGameToCard(wordId,correct){
 const w=getWord(wordId),d=uDeck('eng');if(!w||!d)return false;
 const c=cOriginalCardFor(w);if(!c)return false;
 const old=uReadSrs(d),before=old.s[c.mid]||null,now=Date.now();
 if(before&&Number(before.ts||0)>=now)return false;
 old.s[c.mid]=uSchedule(before,correct?3:1);
 if(!cSafeSet(d.markKey+'-srs',JSON.stringify(old)))return false;
 return true;
}
function cReflectWordSchedule(w,card){
 const d=uDeck('eng'),st=d&&card&&uReadSrs(d).s[card.mid],p=data.progress[w.id];
 if(!st||!p)return false;
 const deadline=Number(st.due)||Date.now(),stamp=Number(st.ts)||Date.now();
 p.due=localDate(new Date(deadline));
 p.last=localDate(new Date(stamp));
 p.interval=Math.max(1,Number(st.ivl)||1);
 p.mastered=st.st==='rev'&&Number(st.ivl||0)>=7;
 p.syncTs=stamp;
 return true;
}
function cMirrorCardToVocab(card,rating){
 const correct=Number(rating)>=2,w=cWordForCard(card);
 if(!w){cStudyRecord(correct);return;}
 ORIGINAL_VOCA_RECORD(w.id,correct);
 cReflectWordSchedule(w,card);
 store();cLocalRecord(w.id,correct);
}
/* One-time legacy migration only. Page load must never rewrite an existing schedule. */
function cBridgeExistingSrs(){
 const d=uDeck('eng');if(!d)return;
 const state=uReadSrs(d);
 let changedWords=false,changedCards=false;
 for(const w of allWords()){
  const c=cOriginalCardFor(w);if(!c)continue;
  const st=state.s[c.mid],p=data.progress[w.id];
  if(st&&(!p||!p.seen)){
   const stamp=Number(st.ts)||0,deadline=Number(st.due)||Date.now();
   const correct=Number(st.last||0)>=2;
   data.progress[w.id]={...(p||{}),seen:true,correct:Number(p?.correct)||0,wrong:Number(p?.wrong)||0,
    streak:correct?Math.max(1,Number(p?.streak)||0):0,
    interval:Math.max(1,Number(st.ivl)||1),due:localDate(new Date(deadline)),
    last:localDate(new Date(stamp||Date.now())),
    mastered:st.st==='rev'&&Number(st.ivl||0)>=7,syncTs:stamp};
   changedWords=true;
  }else if(!st&&p?.seen){
   const day=Date.parse(String(p.due||cDate())+'T00:00:00+07:00');
   const last=Date.parse(String(p.last||cDate())+'T12:00:00+07:00');
   state.s[c.mid]={st:'rev',step:0,ease:2.5,ivl:Math.max(1,Number(p.interval)||1),
    lapses:Number(p.wrong)||0,due:Number.isFinite(day)?day:Date.now(),
    ts:Number(p.syncTs)||last||Date.now(),last:Number(p.streak||0)>0?3:1};
   changedCards=true;
  }
 }
 if(changedCards)cSafeSet(d.markKey+'-srs',JSON.stringify(state));
 if(changedWords)store();
}
function cShadow(name,val,ts=Date.now()){return {kind:name,value:val,ts:Number(ts)||Date.now()}}
function cSetShadow(dict,key,item){const v=dict[key];if(!v||Number(v.ts||0)<=Number(item.ts||0))dict[key]=item;}
function cShadowFromLocal(srs){
 for(const [id,p] of Object.entries(data.progress||{})){
  if(!p||(!p.seen&&!p.favorite))continue;
  const t=Number(p.syncTs||0)||(Date.parse(String(p.last||'')+'T12:00:00+07:00')||1);
  const item={...p};delete item.syncTs;
  cSetShadow(srs,CLOUD_PREFIX+'word/'+encodeURIComponent(id),cShadow('word',item,t));
 }
 for(const [date,v] of Object.entries(CLOCAL.days))cSetShadow(srs,CLOUD_PREFIX+'day/'+CLOCAL.device+'/'+date,cShadow('day',v));
 for(const [date,v] of Object.entries(CLOCAL.studyDays))cSetShadow(srs,CLOUD_PREFIX+'studyday/'+CLOCAL.device+'/'+date,cShadow('studyday',v));
 for(const x of data.custom||[]){
  if(!x?.id||!x.en)continue;
  cSetShadow(srs,CLOUD_PREFIX+'custom/'+encodeURIComponent(x.id),cShadow('custom',x,Number(x.syncTs||0)||Date.now()));
 }
}
function cApplyShadows(srs){
 if(!srs||typeof srs!=='object')return;
 let changed=false;
 const mergedDays={},mergedStudyDays={},newCustom=new Map((data.custom||[]).map(x=>[x.id,x]));
 for(const [key,entry] of Object.entries(srs)){
  if(!key.startsWith(CLOUD_PREFIX)||!entry||typeof entry!=='object'||!entry.value)continue;
  const v=entry.value,t=Number(entry.ts||0);
  if(key.startsWith(CLOUD_PREFIX+'word/')){
   const id=decodeURIComponent(key.slice((CLOUD_PREFIX+'word/').length));
   if(!id||!v||typeof v!=='object')continue;
   const cur=data.progress[id]||{};
   if(t>Number(cur.syncTs||0)){data.progress[id]={...v,syncTs:t};changed=true;}
  }else if(key.startsWith(CLOUD_PREFIX+'day/')){
   const date=key.split('/').slice(-1)[0],o=mergedDays[date]||{answered:0,correct:0,ids:[]};
   o.answered+=Number(v.answered)||0;o.correct+=Number(v.correct)||0;
   o.ids=[...new Set([...o.ids,...(Array.isArray(v.ids)?v.ids:[])])];
   mergedDays[date]=o;
  }else if(key.startsWith(CLOUD_PREFIX+'studyday/')){
   const date=key.split('/').slice(-1)[0],o=mergedStudyDays[date]||{answered:0,correct:0};
   o.answered+=Number(v.answered)||0;o.correct+=Number(v.correct)||0;mergedStudyDays[date]=o;
  }else if(key.startsWith(CLOUD_PREFIX+'custom/')){
   const id=decodeURIComponent(key.slice((CLOUD_PREFIX+'custom/').length)),old=newCustom.get(id);
   if(id&&v.en&&v.th&&v.example&&(!old||t>Number(old.syncTs||0)))newCustom.set(id,{...v,syncTs:t});
  }
 }
 if(Object.keys(mergedDays).length){data.days={...data.days,...mergedDays};changed=true;}
 if(Object.keys(mergedStudyDays).length){CLOUD.studyMergedDays=mergedStudyDays;changed=true;}
 if(newCustom.size!==(data.custom||[]).length || [...newCustom].some(([id,v])=>(data.custom||[]).find(x=>x.id===id)?.syncTs!==v.syncTs)){data.custom=[...newCustom.values()];changed=true;}
 if(changed)store();
 cBridgeExistingSrs();
}
function cLocalSubject(d){
 const st=cSafeJSON('study-'+d.key,{});
 const srs=cSafeJSON(d.markKey+'-srs',{});
 return {study:{ans:st.ans||{},ats:st.ats||{},rst:Number(st.rst)||0,known:st.known||[]},srs:{s:srs.s||{},m:srs.m||{day:0,newDone:0}}};
}
function cMergeState(a,b){
 const A=a?.study||{},B=b?.study||{},SA=a?.srs||{},SB=b?.srs||{};
 const out={study:{ans:{},ats:{},known:[],rst:Math.max(Number(A.rst)||0,Number(B.rst)||0)},srs:{s:{},m:{day:0,newDone:0}}};
 const allIds=new Set([...Object.keys(A.ans||{}),...Object.keys(B.ans||{})]);
 for(const id of allIds){
  const hasA=Object.prototype.hasOwnProperty.call(A.ans||{},id);
  const hasB=Object.prototype.hasOwnProperty.call(B.ans||{},id);
  const ta=Number((A.ats||{})[id])||0,tb=Number((B.ats||{})[id])||0;
  const fromA=hasA&&(!hasB||ta>=tb),value=fromA?A.ans[id]:B.ans[id],time=fromA?ta:tb;
  if(out.study.rst&&time<out.study.rst)continue;
  out.study.ans[id]=value;out.study.ats[id]=time;
 }
 out.study.known=[...new Set([...(A.known||[]),...(B.known||[])])];
 for(const id of new Set([...Object.keys(SA.s||{}),...Object.keys(SB.s||{})])){
  const x=(SA.s||{})[id],y=(SB.s||{})[id];
  out.srs.s[id]=!x?y:!y?x:Number(x.ts||0)>=Number(y.ts||0)?x:y;
 }
 const ma=SA.m||{day:0,newDone:0},mb=SB.m||{day:0,newDone:0};
 out.srs.m=ma.day>mb.day?ma:mb.day>ma.day?mb:{day:ma.day||0,newDone:Math.max(Number(ma.newDone)||0,Number(mb.newDone)||0)};
 return out;
}
function cApplySubject(d,merged){
 const st=cSafeJSON('study-'+d.key,{}),oldS=cSafeJSON(d.markKey+'-srs',{});
 cSafeSet('study-'+d.key,JSON.stringify({...st,...merged.study}));
 cSafeSet(d.markKey+'-srs',JSON.stringify({...oldS,...merged.srs}));
 if(d.key==='eng')cApplyShadows(merged.srs.s);
}
function cCloudNotice(msg,error=false){CLOUD.message=msg;CLOUD.error=error?msg:'';const el=document.getElementById('cloudSyncState');if(el)el.textContent=msg;}
async function cApiUrl(){
 if(CLOUD.api)return CLOUD.api;
 try{const r=await fetch('../data/config.json',{cache:'no-store'});if(!r.ok)throw Error('config HTTP '+r.status);const j=await r.json();const original=String(j.api||'').replace(/\/+$/,'');const url=String(j.progress_api||original).replace(/\/+$/,'');if(!/^https:\/\//.test(url))throw Error('Missing HTTPS API');CLOUD.progressSplit=url!==original;CLOUD.api=url;
 // A new endpoint must not inherit old Auto Sync consent. A separately
 // approved endpoint may retain its own deliberate opt-in across reloads.
 if(CLOUD.progressSplit&&cSafeGet(CLOUD_AUTO_ENDPOINT)!==url){
  CLOUD.enabled=false;
  if(cSafeGet(CLOUD_AUTO)==='1')cSafeSet(CLOUD_AUTO,'0');
 }
 return url}catch(e){throw Error('No Cloudflare API configured')}
}
function cCloudStorageKey(){return CLOUD.progressSplit?CLOUD_PROGRESS_KEY:CLOUD_KEY;}
function cCloudKey(){
 const raw=String(cSafeGet(cCloudStorageKey())||'');
 if(!CLOUD.progressSplit)return raw.trim();
 // The new Progress token is scoped to one exact URL. Legacy plain-string
 // progress tokens are deliberately invalid until the owner re-enters them.
 try{
  const entry=JSON.parse(raw);
  return entry&&entry.endpoint===CLOUD.api&&typeof entry.key==='string'
   ?entry.key.trim():'';
 }catch{return ''}
}
/* ETag/If-Match protects concurrent clients when the backend supports atomic revisions.
 * Legacy KV is manual-confirmation-only. Never background-write an unversioned response. */
const CLOUD_MAX_RETRIES=6;
function cCloudRevision(response){
 // Prefer application-level CAS revision because Cloudflare compression can weaken ETag.
 // A present but malformed custom revision must NOT silently fall back to ETag.
 const value=response?.headers?.get?.('X-Sync-Revision')??response?.headers?.get?.('ETag')??'';
 return /^"[0-9]+"$/.test(value)?value:'';
}
async function cCloudSync(manual=false){
 if(CLOUD.busy||(!manual&&!CLOUD.enabled)||!USTATE.ready)return;
 CLOUD.busy=true;CLOUD.mode='unknown';cCloudNotice('Checking revisions and syncing…');let count=0,legacyConsent=false;
 try{
  const api=await cApiUrl(),key=cCloudKey();
  // Resolving progress_api can deactivate inherited Auto Sync. Recheck after
  // the await, before issuing any network requests with a progress credential.
  if(!manual&&!CLOUD.enabled)throw Error('Auto Sync is off or was turned off after the Progress endpoint changed — nothing was written');
  if(!key)throw Error('The Progress endpoint has no key of its own yet; set one before syncing');
  const hds={'X-Sync-Key':key,'Content-Type':'application/json'};
  for(const d of USTATE.decks){
   const url=api+'/progress/'+encodeURIComponent(d.key);
   let complete=false;
   for(let attempt=1;attempt<=CLOUD_MAX_RETRIES;attempt++){
    // Do not continue an in-flight background sync after the user turns it off.
    if(!manual&&!CLOUD.enabled)throw Error('Auto Sync was turned off mid-run — stopped before the next request');
    const resp=await fetch(url,{headers:hds,cache:'no-store'});
    if(resp.status===401)throw Error('Wrong SYNC_KEY — set it again in Settings');
    if(resp.status===404||resp.status===405)throw Error('Worker does not support the sync route '+d.key);
    if(!resp.ok)throw Error('Cloudflare GET '+d.key+' HTTP '+resp.status);
    const revision=cCloudRevision(resp);
    const customRev=resp.headers?.get?.('X-Sync-Revision');
    const httpTag=resp.headers?.get?.('ETag')||'';
    // An advertised but broken revision, or a weak HTTP validator, is NOT
    // equivalent to an unversioned legacy backend; refuse even manual PUT.
    if(!revision&&(customRev!==null&&customRev!==undefined||/^W\//.test(httpTag)))
     throw Error('Worker sent an unsafe revision (weak ETag or malformed X-Sync-Revision), so nothing was written');
    if(revision&&CLOUD.mode!=='legacy')CLOUD.mode='cas';
    if(!revision){
     CLOUD.mode='legacy';
     if(!manual){
      CLOUD.enabled=false;cSafeSet(CLOUD_AUTO,'0');
      throw Error('Worker does not support Safe Sync (no ETag), so Auto Sync was turned off to protect your scores · local scores unchanged');
     }
     if(!legacyConsent){
      if(!window.confirm('The current Worker does not support ETag / If-Match, so it cannot stop devices from overwriting each other’s scores.\n\nThis older sync reads and writes real data for all 5 subjects. Make a Full backup first and never sync two devices at once.\n\nRun Legacy Sync manually?'))
       throw Error('Legacy Sync cancelled — nothing was written to the Worker');
      legacyConsent=true;
     }
    }
    const remote=await resp.json();
    if(remote!==null&&(typeof remote!=='object'||Array.isArray(remote)||remote.error||(Object.keys(remote).length>0&&!remote.study&&!remote.srs)))
     throw Error('Invalid Worker data format');
    const local=cLocalSubject(d);
    const baseline=JSON.stringify(local);
    if(d.key==='eng')cShadowFromLocal(local.srs.s);
    const joined=cMergeState(local,remote||{});
    const body=JSON.stringify(joined);
    if(new TextEncoder().encode(body).byteLength>350000)throw Error('Sync data is larger than the safe limit; export a backup first');
    // GET may have completed after Auto Sync was disabled. No new write.
    if(!manual&&!CLOUD.enabled)throw Error('Auto Sync was turned off while checking — no write was sent');
    const headers=revision?{...hds,'If-Match':revision}:hds;
    const saved=await fetch(url,{method:'PUT',headers,body});
    if(saved.status===401)throw Error('Wrong SYNC_KEY');
    if(revision&&(saved.status===409||saved.status===412))continue;
    if(saved.status===428)throw Error('Worker requires If-Match but sent no ETag — local scores unchanged');
    if(!saved.ok)throw Error('Cloudflare PUT '+d.key+' HTTP '+saved.status);
    // A user might answer another card while the PUT is in flight.
    // Never overwrite those newer local answers with the older merged snapshot.
    if(JSON.stringify(cLocalSubject(d))!==baseline){
     if(revision)continue;
     throw Error('Local scores changed during Legacy Sync: cancelled importing old data; sync again');
    }
    cApplySubject(d,joined);count++;complete=true;break;
   }
   if(!complete)throw Error('Data revision '+d.key+' changed concurrently too many times ('+CLOUD_MAX_RETRIES+' tries); local data kept');
  }
  CLOUD.last=Date.now();cSafeSet(CLOUD_LAST,String(CLOUD.last));CLOUD.remoteStatus='saved';
  cCloudNotice('Synced all '+count+' subjects · '+new Date(CLOUD.last).toLocaleTimeString('th-TH'));
  if(['home','studymerge','review','progress','settings'].includes(ui.page))render();
 }catch(e){
  CLOUD.remoteStatus='error';
  cCloudNotice('Sync incomplete ('+count+'/'+USTATE.decks.length+' subjects): '+String(e.message||e),true);
 }finally{
  CLOUD.busy=false;
  if(ui.page==='settings')render();
  if(CLOUD.pending){CLOUD.pending=false;cCloudDebounce();}
 }
}
function cCloudDebounce(){if(!cCloudKey()||!CLOUD.enabled)return;if(CLOUD.busy){CLOUD.pending=true;return;}clearTimeout(CLOUD.timer);CLOUD.timer=setTimeout(()=>cCloudSync(false),3500);}
async function cSetKey(){
 try{await cApiUrl();}catch(e){cCloudNotice(String(e.message||e),true);return;}
 const promptText=CLOUD.progressSplit?
  'Enter the key for this Progress Worker only.\n\nThe key works only for the selected URL. Do not reuse the original or staging Worker key. Make a Full backup before the first sync.':
  'Enter the SYNC_KEY of the study-api Cloudflare Worker (same key as Study OS).\n\nAfter you enter it, one sync runs right away: it reads and writes data for all 5 subjects on the Worker. Make a Full backup first and do not use two devices at once until QA is done.';
 const k=window.prompt(promptText,cCloudKey()?'':'');
 if(k===null)return;
 if(!k.trim()){cCloudNotice('No sync key set');return}
 const stored=CLOUD.progressSplit
  ?JSON.stringify({endpoint:CLOUD.api,key:k.trim()}):k.trim();
 if(!cSafeSet(cCloudStorageKey(),stored)){
  cCloudNotice('Could not store the sync key on this device, so the sync was cancelled',true);
  return;
 }
 // One manual sync is requested by entering the key. Auto Sync remains opt-in.
 cCloudSync(true);render();
}

async function cFullRestore(file){
 if(!file)return;
 if(CLOUD.busy){cCloudNotice('Wait for the sync to finish before importing',true);return;}
 let saved=null,oldData=null,oldDays=null,oldStudyDays=null;
 try{
  if(Number(file.size)>8*1024*1024)throw Error('File is larger than 8 MB');
  const payload=JSON.parse(await file.text());
  if(payload?.type!=='vocabloom-unified-study-backup'||payload.version!==1)throw Error('Not a WordNest Full backup file');
  const v=payload.vocabloom,subs=payload.subjects;
  if(!v||!v.progress||!v.days||!Array.isArray(v.custom)||!v.settings||!subs||typeof subs!=='object')throw Error('Backup structure incomplete');
  const writes={};
  for(const d of USTATE.decks){
   const k1='study-'+d.key,k2=d.markKey+'-srs',a=subs[k1],b=subs[k2];
   const owns=(key)=>Object.prototype.hasOwnProperty.call(subs,key);
   const record=(value)=>value!==null&&typeof value==='object'&&!Array.isArray(value);
   if(!owns(k1)||!owns(k2)||!record(a)||!record(b)||
      (a.ans!==undefined&&!record(a.ans))||(a.ats!==undefined&&!record(a.ats))||
      (b.s!==undefined&&!record(b.s))||(b.m!==undefined&&!record(b.m))||
      (Object.keys(b).length>0&&(b.s===undefined||b.m===undefined)))
     throw Error('No subject data '+d.key);
   writes[k1]=JSON.stringify(a);writes[k2]=JSON.stringify(b);
  }
  writes[STORAGE_KEY]=JSON.stringify(v);
  const otherDevice=!!payload.deviceId&&payload.deviceId!==CLOCAL.device;
  const importedDays=!otherDevice&&payload.deviceDays&&typeof payload.deviceDays==='object'?payload.deviceDays:{};
  const importedStudyDays=!otherDevice&&payload.studyDays&&typeof payload.studyDays==='object'?payload.studyDays:{};
  writes[CLOUD_LOCAL_DAYS]=JSON.stringify(importedDays);
  writes[CLOUD_STUDY_DAYS]=JSON.stringify(importedStudyDays);
  if(!window.confirm('Import this Full backup and overwrite scores for all 5 subjects in this browser? Download a current Full backup first.'))return;
  saved=Object.fromEntries(Object.keys(writes).map(key=>[key,cSafeGet(key)]));
  oldData=structuredClone(data);oldDays=structuredClone(CLOCAL.days);oldStudyDays=structuredClone(CLOCAL.studyDays);
  for(const [key,value] of Object.entries(writes))if(!cSafeSet(key,value))throw Error('Not enough storage');
  data=structuredClone(v);CLOCAL.days=structuredClone(importedDays);CLOCAL.studyDays=structuredClone(importedStudyDays);
  CLOUD.studyMergedDays=null;CLOUD.remoteStatus='restored locally';
  cCloudNotice('Restored all 5 subjects on this device · nothing sent to Cloudflare');
  render();
 }catch(e){
  if(saved){
   for(const [key,value] of Object.entries(saved)){
    try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{}
   }
   if(oldData)data=oldData;
   if(oldDays)CLOCAL.days=oldDays;
   if(oldStudyDays)CLOCAL.studyDays=oldStudyDays;
  }
  cCloudNotice('Import failed: '+String(e.message||e),true);
 }
}

async function cForgetKey(){
 try{await cApiUrl();}catch(e){cCloudNotice(String(e.message||e),true);return;}
 if(CLOUD.busy){cCloudNotice('Sync in progress; wait for it to finish before removing the key',true);return;}
 if(!cCloudKey())return;
 if(!window.confirm('Remove the SYNC_KEY from this browser? Your saved study scores are not deleted.'))return;
 try{localStorage.removeItem(cCloudStorageKey());}catch{}
 CLOUD.enabled=false;cSafeSet(CLOUD_AUTO,'0');clearTimeout(CLOUD.timer);
 CLOUD.remoteStatus='disconnected';cCloudNotice('Sync key removed from this browser');
 render();
}
function cPanel(){
 const active=!!cCloudKey(),time=CLOUD.last?new Date(CLOUD.last).toLocaleString('th-TH'):'No sync confirmed yet';
 const engine=CLOUD.mode==='cas'?'Safe Sync (ETag / If-Match)':CLOUD.mode==='legacy'?'Legacy Worker (no ETag)':'Worker capabilities not checked yet';
 return '<div class="panel mt20"><span class="section-kicker">CROSS-DEVICE PROGRESS</span><h3 class="mt10">☁ Unified Learning Sync</h3><p>Saves flashcards for every subject, quiz answers and word-game history through the existing Worker</p><p style="color:#ae6741;font-weight:700">Cloud Sync is still in QA: the live Worker is not confirmed safe for concurrent writes · Auto Sync turns itself off without an ETag · The older sync asks you to confirm the risk every time; make a Full backup first</p><p>Server mode: <strong>'+h(engine)+'</strong></p><p><strong>'+(active?'Sync key set':'No sync key')+'</strong> · '+h(time)+'</p><div class="pill-row"><button class="btn btn-primary" data-action="cloud-sync" '+(!active||CLOUD.busy?'disabled':'')+'>↻ Sync now</button><button class="btn btn-outline" data-action="cloud-config">⚙ '+(active?'Change key':'Set sync key')+'</button><button class="btn btn-outline" data-action="cloud-auto">'+(CLOUD.enabled?'Turn off Auto Sync':'Turn on Auto Sync')+'</button><button class="btn btn-outline" data-action="cloud-backup">↓ Local backup</button><button class="btn btn-outline" data-action="cloud-remote-backup" '+(!active||CLOUD.busy?'disabled':'')+'>↓ Cloud snapshot (read-only)</button><button class="btn btn-outline" data-action="cloud-restore">↑ Full restore</button><button class="btn btn-outline" data-action="cloud-forget" '+(!active?'disabled':'')+'>Remove key from this device</button></div><input type="file" id="fullRestoreInput" accept=".json,application/json" hidden><p class="footnote mt20" id="cloudSyncState" role="status">'+h(CLOUD.message||'Data stays on this device until a SYNC_KEY is set and a sync succeeds')+'</p><p class="footnote">SYNC_KEY is kept in this browser’s localStorage, never in the site · Auto Sync is off by default · On a shared computer use private mode and remove the key afterwards · Make a Full backup before the first sync · Cloud snapshot only reads (GET) and changes nothing; the file contains private study data · Full restore overwrites scores in this browser and always asks first</p></div>';
}

/* Read-only remote snapshot for migration planning. Never POST/PUT or mutate local progress. */
async function cRemoteSnapshot(){
 if(CLOUD.busy){cCloudNotice('Another sync is running; try again when it finishes',true);return;}
 try{await cApiUrl();}catch(e){cCloudNotice(String(e.message||e),true);return;}
 if(!cCloudKey()||!USTATE.ready){cCloudNotice('No sync key yet, or subject data not ready',true);return;}
 if(!window.confirm('Back up scores for all 5 subjects from Cloudflare (read-only)?\n\nThis JSON file contains your study details and should stay private. On a shared computer, move it somewhere private and delete the download.'))return;
 CLOUD.busy=true;cCloudNotice('Reading Cloudflare data for a backup (no PUT)…');
 try{
  const api=await cApiUrl();
  const headers={'X-Sync-Key':cCloudKey()};
  const subjects={},revisions={};
  for(const d of USTATE.decks){
   const response=await fetch(api+'/progress/'+encodeURIComponent(d.key),{headers,cache:'no-store'});
   if(response.status===401)throw Error('Wrong SYNC_KEY');
   if(!response.ok)throw Error('Read subject data '+d.key+' failed HTTP '+response.status);
   const body=await response.text();
   if(new TextEncoder().encode(body).byteLength>500000)throw Error('Subject data '+d.key+' is larger than the safe limit');
   const value=JSON.parse(body);
   if(!value||typeof value!=='object'||Array.isArray(value)||value.error)throw Error('Subject data '+d.key+' has an unexpected format');
   subjects[d.key]=value;
   revisions[d.key]=cCloudRevision(response)||null;
  }
  const snapshot={
   format:'vocabloom-cloud-readonly-snapshot',version:1,
   capturedAt:new Date().toISOString(),subjects,revisions,
   note:'Read-only snapshot. No Worker or local study data was modified. ETag=null means no atomic versioning guarantee.'
  };
  const payload=JSON.stringify(snapshot,null,2);
  // Never serialize SYNC_KEY, request headers or Cloudflare API credentials into downloaded data.
  if(payload.includes(cCloudKey()))throw Error('Could not create the backup file safely');
  const blob=new Blob([payload],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='vocabloom-cloud-snapshot-'+cDate()+'.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  cCloudNotice('Read and downloaded the Cloudflare backup for all 5 subjects · 5 GET / 0 PUT');
 }catch(e){
  cCloudNotice('Cloudflare backup download failed: '+String(e.message||e),true);
 }finally{
  CLOUD.busy=false;
  if(ui.page==='settings')render();
 }
}

function cFullBackup(){
 const subjectStorage={};
 for(const d of USTATE.decks){
  subjectStorage['study-'+d.key]=cSafeJSON('study-'+d.key,{});
  subjectStorage[d.markKey+'-srs']=cSafeJSON(d.markKey+'-srs',{});
 }
 const payload={version:1,type:'vocabloom-unified-study-backup',createdAt:new Date().toISOString(),deviceId:CLOCAL.device,vocabloom:structuredClone(data),deviceDays:CLOCAL.days,studyDays:CLOCAL.studyDays,subjects:subjectStorage};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='vocabloom-full-backup-'+cDate()+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
 cCloudNotice('Exported a backup of all 5 subjects (without SYNC_KEY)');
}

async function cToggleAuto(){
 if(CLOUD.autoBusy)return;
 CLOUD.autoBusy=true;
 try{
  // Resolve destination before permitting opt-in. A newly split endpoint
  // cannot inherit authorization that was granted to the old Worker.
  await cApiUrl();
  if(CLOUD.enabled){
   CLOUD.enabled=false;
   cSafeSet(CLOUD_AUTO,'0');
   clearTimeout(CLOUD.timer);
   render();
   return;
  }
  if(CLOUD.progressSplit){
   if(!cCloudKey()){
    cCloudNotice('Set the key for the new Progress Worker before turning on Auto Sync',true);
    return;
   }
   if(!window.confirm('You are turning on Auto Sync for the new Progress Worker, separate from the original Worker.\n\nHave you checked your Full backup and the migration test? Turning it on writes scores for all 5 subjects to this new endpoint.\n\nAllow Auto Sync for this endpoint only?'))return;
   if(!cSafeSet(CLOUD_AUTO_ENDPOINT,CLOUD.api))
    throw Error('Could not save the Auto Sync endpoint confirmation on this device');
  }
  if(!cSafeSet(CLOUD_AUTO,'1'))
   throw Error('Could not save the Auto Sync setting on this device');
  CLOUD.enabled=true;
  render();
  cCloudSync(false);
 }catch(e){
  CLOUD.enabled=false;
  cSafeSet(CLOUD_AUTO,'0');
  cCloudNotice(String(e.message||e),true);
 }finally{
  CLOUD.autoBusy=false;
  render();
 }
}
function cPanelAction(el){
 if(el.dataset.action==='cloud-restore'){document.getElementById('fullRestoreInput')?.click();return true;}
 if(el.dataset.action==='cloud-forget'){cForgetKey();return true;}
 if(el.dataset.action==='cloud-remote-backup'){cRemoteSnapshot();return true;}
 if(el.dataset.action==='cloud-backup'){cFullBackup();return true;}
 if(el.dataset.action==='cloud-config'){cSetKey();return true;}
 if(el.dataset.action==='cloud-sync'){cCloudSync(true);return true;}
 if(el.dataset.action==='cloud-auto'){cToggleAuto();return true;}
 return false;
}
function cDashboardExtra(){
 if(!USTATE.ready)return '';
 const counts=USTATE.decks.map(d=>({name:d.name,...uStats(d)}));
 const total=counts.reduce((a,x)=>a+x.total,0),seen=counts.reduce((a,x)=>a+x.seen,0),due=counts.reduce((a,x)=>a+x.due,0);
 const d=CLOUD.studyMergedDays?.[cDate()]||CLOCAL.studyDays[cDate()]||{answered:0};
 return '<div class="panel mt20"><div class="panel-header"><h3>Unified Study Progress</h3><span class="badge">ALL SUBJECTS</span></div><div class="progress-tiles mt20"><div class="mini-metric"><strong>'+total+'</strong><small>Flashcards</small></div><div class="mini-metric"><strong>'+seen+'</strong><small>Cards reviewed</small></div><div class="mini-metric"><strong>'+due+'</strong><small>Cards due</small></div><div class="mini-metric"><strong>'+(Number(d.answered)||0)+'</strong><small>Other subject reviews today</small></div></div><p class="footnote mt20">English cards and word games share status for the same word; other subjects keep their own review keys</p></div>';
}
let ORIGINAL_VOCA_RECORD=null;
function cInstall(){
 cInitLocal();
 ORIGINAL_VOCA_RECORD=recordAnswer;
 recordAnswer=function(id,correct){
  ORIGINAL_VOCA_RECORD(id,correct);
  cLocalRecord(id,correct);
  const bridged=USTATE.ready&&cBridgeGameToCard(id,correct);
  const w=getWord(id),card=bridged&&w?cOriginalCardFor(w):null;
  if(!card||!cReflectWordSchedule(w,card)){
   if(data.progress[id])data.progress[id].syncTs=Date.now();
  }
  store();cCloudDebounce();
 };
 const oldAdd=addWord;
 addWord=function(){
  const ids=new Set((data.custom||[]).map(w=>w.id));
  const result=oldAdd();
  const newWords=(data.custom||[]).filter(w=>!ids.has(w.id));
  if(newWords.length){for(const w of newWords)w.syncTs=Date.now();store();cCloudDebounce();}
  return result;
 };
 const oldRate=uRate;
 uRate=function(d,rating){
  const before=uCurrent(d);
  const previous=before&&uReadSrs(d).s[before.mid]?.ts||0;
  oldRate(d,rating);
  if(before&&Number(uReadSrs(d).s[before.mid]?.ts||0)>Number(previous)){
   if(d.key==='eng')cMirrorCardToVocab(before,rating);else cStudyRecord(Number(rating)>=3);
   cCloudDebounce();
  }
 };
 const oldBoot=uBoot;
 uBoot=async function(...args){const result=await oldBoot(...args);if(USTATE.ready){cBridgeExistingSrs();if(cCloudKey()&&CLOUD.enabled&&Date.now()-CLOUD.last>90000)cCloudDebounce();}return result;};
 const oldSettings=settingsHTML,oldHome=homeHTML,oldProgress=progressHTML;
 settingsHTML=function(){return oldSettings()+cPanel();};
 homeHTML=function(){return oldHome()+cDashboardExtra();};
 progressHTML=function(){return oldProgress()+cDashboardExtra();};
 const oldHandle=handleAction;
 handleAction=function(el){if(cPanelAction(el))return;const action=el.dataset.action;if(action==='favorite'){const result=oldHandle(el);const p=data.progress[el.dataset.word];if(p){p.syncTs=Date.now();store();cCloudDebounce();}return result;}const result=oldHandle(el);if(action==='u-answer')cCloudDebounce();return result;};
 document.addEventListener('change',e=>{if(e.target.id==='fullRestoreInput'){const file=e.target.files?.[0];e.target.value='';cFullRestore(file);}});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&cCloudKey()&&CLOUD.enabled&&Date.now()-CLOUD.last>60000)cCloudSync(false);});
 window.addEventListener('storage',e=>{if(e.key===cCloudStorageKey()&&cCloudKey()&&CLOUD.enabled)cCloudDebounce();});
 setInterval(()=>{if(document.visibilityState==='visible'&&cCloudKey()&&CLOUD.enabled&&Date.now()-CLOUD.last>300000)cCloudSync(false);},300000);
 const oldDue=dueWords;
 dueWords=function(){
  if(!USTATE.ready)return oldDue();
  const fallback=new Set(oldDue().map(w=>w.id)),d=uDeck('eng'),state=d?uReadSrs(d).s:{};
  return allWords().filter(w=>{const c=cOriginalCardFor(w),s=c&&state[c.mid];return s?Number(s.due||0)<=Date.now():fallback.has(w.id);});
 };
 if(USTATE.ready){cBridgeExistingSrs();}
 else{let retries=0;const id=setInterval(()=>{retries++;if(USTATE.ready){clearInterval(id);cBridgeExistingSrs();if(['home','review','progress','studymerge'].includes(ui.page))render();if(cCloudKey()&&CLOUD.enabled)cCloudDebounce();}else if(retries>=30)clearInterval(id);},500);}
 if(cCloudKey()&&CLOUD.enabled)setTimeout(()=>{if(USTATE.ready)cCloudSync(false);},2500);
 if(['home','settings','progress'].includes(ui.page))render();
}
cInstall();
