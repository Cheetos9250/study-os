
/* VocaBloom unified progress bridge, additive to Study OS; does not delete original data. */
'use strict';
const CLOUD_KEY='study-sync-key', CLOUD_DEVICE_KEY='vocabloom-device-v1';
const CLOUD_LOCAL_DAYS='vocabloom-device-days-v1', CLOUD_STUDY_DAYS='vocabloom-device-study-days-v1';
const CLOUD_LAST='vocabloom-last-sync-v1', CLOUD_AUTO='vocabloom-auto-sync-v1';
const CLOUD_PREFIX='vb/v1/';
const CLOUD_AUTOSYNC_MIGRATION='vocabloom-autosync-safety-v2';
const CLOUD={busy:false,error:'',message:'',last:0,timer:null,api:'',enabled:false,remoteStatus:'not verified'};
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
   CLOUD.message='Auto Sync เดิมถูกปิดเพื่อความปลอดภัย กรุณาเปิดอีกครั้งด้วยตนเองหากต้องการ';
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
 try{const r=await fetch('../data/config.json',{cache:'no-store'});if(!r.ok)throw Error('config HTTP '+r.status);const j=await r.json();const url=String(j.api||'').replace(/\/+$/,'');if(!/^https:\/\//.test(url))throw Error('Missing HTTPS API');CLOUD.api=url;return url}catch(e){throw Error('ไม่พบ Cloudflare API ที่ตั้งค่าไว้')}
}
function cCloudKey(){return String(cSafeGet(CLOUD_KEY)||'').trim();}
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
 if(CLOUD.busy||(!manual&&!CLOUD.enabled)||!cCloudKey()||!USTATE.ready)return;
 CLOUD.busy=true;CLOUD.mode='unknown';cCloudNotice('กำลังตรวจเวอร์ชันและซิงก์ข้อมูล...');let count=0,legacyConsent=false;
 try{
  const api=await cApiUrl(),key=cCloudKey();
  const hds={'X-Sync-Key':key,'Content-Type':'application/json'};
  for(const d of USTATE.decks){
   const url=api+'/progress/'+encodeURIComponent(d.key);
   let complete=false;
   for(let attempt=1;attempt<=CLOUD_MAX_RETRIES;attempt++){
    const resp=await fetch(url,{headers:hds,cache:'no-store'});
    if(resp.status===401)throw Error('รหัส SYNC_KEY ไม่ถูกต้อง — ตั้งรหัสใหม่ได้ใน Settings');
    if(resp.status===404||resp.status===405)throw Error('Worker ไม่รองรับเส้นทางซิงก์ '+d.key);
    if(!resp.ok)throw Error('Cloudflare GET '+d.key+' HTTP '+resp.status);
    const revision=cCloudRevision(resp);
    if(revision&&CLOUD.mode!=='legacy')CLOUD.mode='cas';
    if(!revision){
     CLOUD.mode='legacy';
     if(!manual){
      CLOUD.enabled=false;cSafeSet(CLOUD_AUTO,'0');
      throw Error('Worker ยังไม่รองรับ Safe Sync (ไม่มี ETag) จึงปิด Auto Sync เพื่อป้องกันคะแนนถูกเขียนทับ · คะแนนในเครื่องไม่ถูกแก้ไข');
     }
     if(!legacyConsent){
      if(!window.confirm('Worker ปัจจุบันยังไม่รองรับ ETag / If-Match จึงป้องกันการเขียนทับคะแนนจากหลายอุปกรณ์ไม่ได้\n\nซิงก์แบบเดิมนี้จะอ่านและเขียนข้อมูลจริงทั้ง 5 วิชา กรุณาสำรอง Full backup ก่อน และห้ามเปิดซิงก์พร้อมกันสองเครื่อง\n\nต้องการดำเนินการแบบ Legacy Sync ด้วยตนเองหรือไม่?'))
       throw Error('ยกเลิก Legacy Sync — ยังไม่ได้เขียนข้อมูลไปยัง Worker');
      legacyConsent=true;
     }
    }
    const remote=await resp.json();
    if(remote!==null&&(typeof remote!=='object'||Array.isArray(remote)||remote.error||(Object.keys(remote).length>0&&!remote.study&&!remote.srs)))
     throw Error('รูปแบบข้อมูล Worker ไม่ถูกต้อง');
    const local=cLocalSubject(d);
    const baseline=JSON.stringify(local);
    if(d.key==='eng')cShadowFromLocal(local.srs.s);
    const joined=cMergeState(local,remote||{});
    const body=JSON.stringify(joined);
    if(new TextEncoder().encode(body).byteLength>350000)throw Error('ข้อมูลซิงก์มากเกินขนาดที่ปลอดภัย กรุณาส่งออก Backup ก่อน');
    const headers=revision?{...hds,'If-Match':revision}:hds;
    const saved=await fetch(url,{method:'PUT',headers,body});
    if(saved.status===401)throw Error('รหัส SYNC_KEY ไม่ถูกต้อง');
    if(revision&&(saved.status===409||saved.status===412))continue;
    if(saved.status===428)throw Error('Worker ต้องการ If-Match แต่ไม่ส่ง ETag กลับมา — ยังไม่ได้เปลี่ยนคะแนนในเครื่อง');
    if(!saved.ok)throw Error('Cloudflare PUT '+d.key+' HTTP '+saved.status);
    // A user might answer another card while the PUT is in flight.
    // Never overwrite those newer local answers with the older merged snapshot.
    if(JSON.stringify(cLocalSubject(d))!==baseline){
     if(revision)continue;
     throw Error('คะแนนในเครื่องเปลี่ยนระหว่าง Legacy Sync: ยกเลิกการนำเข้าข้อมูลเก่า กรุณาซิงก์ใหม่');
    }
    cApplySubject(d,joined);count++;complete=true;break;
   }
   if(!complete)throw Error('เวอร์ชันข้อมูล '+d.key+' เปลี่ยนพร้อมกันหลายครั้งเกินกำหนด ('+CLOUD_MAX_RETRIES+' รอบ) เก็บข้อมูลในเครื่องไว้ครบ');
  }
  CLOUD.last=Date.now();cSafeSet(CLOUD_LAST,String(CLOUD.last));CLOUD.remoteStatus='saved';
  cCloudNotice('ซิงก์สำเร็จทั้ง '+count+' วิชา · '+new Date(CLOUD.last).toLocaleTimeString('th-TH'));
  if(['home','studymerge','review','progress','settings'].includes(ui.page))render();
 }catch(e){
  CLOUD.remoteStatus='error';
  cCloudNotice('ซิงก์ยังไม่ครบ ('+count+'/'+USTATE.decks.length+' วิชา): '+String(e.message||e),true);
 }finally{
  CLOUD.busy=false;
  if(ui.page==='settings')render();
  if(CLOUD.pending){CLOUD.pending=false;cCloudDebounce();}
 }
}
function cCloudDebounce(){if(!cCloudKey()||!CLOUD.enabled)return;if(CLOUD.busy){CLOUD.pending=true;return;}clearTimeout(CLOUD.timer);CLOUD.timer=setTimeout(()=>cCloudSync(false),3500);}
function cSetKey(){
 const k=window.prompt('ใส่ SYNC_KEY ของ Cloudflare Worker study-api (รหัสเดียวกับ Study OS เดิม)\n\nเมื่อใส่รหัส ระบบจะซิงก์ทันที 1 รอบ: อ่านและเขียนข้อมูลทั้ง 5 วิชาขึ้น Worker โปรดทำ Full backup ก่อน และอย่าใช้งานสองเครื่องพร้อมกันจนกว่าระบบจะผ่าน QA',cCloudKey()?'':'');
 if(k===null)return;
 if(!k.trim()){cCloudNotice('ยังไม่ได้ตั้งรหัสซิงก์');return}
 cSafeSet(CLOUD_KEY,k.trim());
 // One manual sync is requested by entering the key. Auto Sync remains opt-in.
 cCloudSync(true);render();
}

async function cFullRestore(file){
 if(!file)return;
 if(CLOUD.busy){cCloudNotice('กรุณารอให้ซิงก์เสร็จก่อนนำเข้าข้อมูล',true);return;}
 let saved=null,oldData=null,oldDays=null,oldStudyDays=null;
 try{
  if(Number(file.size)>8*1024*1024)throw Error('ไฟล์ใหญ่เกิน 8 MB');
  const payload=JSON.parse(await file.text());
  if(payload?.type!=='vocabloom-unified-study-backup'||payload.version!==1)throw Error('ไม่ใช่ไฟล์ Full backup ของ VocaBloom');
  const v=payload.vocabloom,subs=payload.subjects;
  if(!v||!v.progress||!v.days||!Array.isArray(v.custom)||!v.settings||!subs||typeof subs!=='object')throw Error('โครงสร้างข้อมูลสำรองไม่ครบ');
  const writes={};
  for(const d of USTATE.decks){
   const k1='study-'+d.key,k2=d.markKey+'-srs',a=subs[k1],b=subs[k2];
   const owns=(key)=>Object.prototype.hasOwnProperty.call(subs,key);
   const record=(value)=>value!==null&&typeof value==='object'&&!Array.isArray(value);
   if(!owns(k1)||!owns(k2)||!record(a)||!record(b)||
      (a.ans!==undefined&&!record(a.ans))||(a.ats!==undefined&&!record(a.ats))||
      (b.s!==undefined&&!record(b.s))||(b.m!==undefined&&!record(b.m))||
      (Object.keys(b).length>0&&(b.s===undefined||b.m===undefined)))
     throw Error('ไม่มีข้อมูลวิชา '+d.key);
   writes[k1]=JSON.stringify(a);writes[k2]=JSON.stringify(b);
  }
  writes[STORAGE_KEY]=JSON.stringify(v);
  const otherDevice=!!payload.deviceId&&payload.deviceId!==CLOCAL.device;
  const importedDays=!otherDevice&&payload.deviceDays&&typeof payload.deviceDays==='object'?payload.deviceDays:{};
  const importedStudyDays=!otherDevice&&payload.studyDays&&typeof payload.studyDays==='object'?payload.studyDays:{};
  writes[CLOUD_LOCAL_DAYS]=JSON.stringify(importedDays);
  writes[CLOUD_STUDY_DAYS]=JSON.stringify(importedStudyDays);
  if(!window.confirm('นำเข้า Full backup แล้วเขียนทับคะแนนในเบราว์เซอร์นี้ทั้ง 5 วิชาใช่หรือไม่? ควรดาวน์โหลด Full backup ปัจจุบันก่อน'))return;
  saved=Object.fromEntries(Object.keys(writes).map(key=>[key,cSafeGet(key)]));
  oldData=structuredClone(data);oldDays=structuredClone(CLOCAL.days);oldStudyDays=structuredClone(CLOCAL.studyDays);
  for(const [key,value] of Object.entries(writes))if(!cSafeSet(key,value))throw Error('พื้นที่เก็บข้อมูลไม่เพียงพอ');
  data=structuredClone(v);CLOCAL.days=structuredClone(importedDays);CLOCAL.studyDays=structuredClone(importedStudyDays);
  CLOUD.studyMergedDays=null;CLOUD.remoteStatus='restored locally';
  cCloudNotice('กู้คืนข้อมูลครบ 5 วิชาบนเครื่องนี้แล้ว · ยังไม่ได้ส่งข้อมูลขึ้น Cloudflare');
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
  cCloudNotice('นำเข้าไม่สำเร็จ: '+String(e.message||e),true);
 }
}

function cForgetKey(){
 if(CLOUD.busy){cCloudNotice('กำลังซิงก์อยู่ รอให้การทำงานเสร็จก่อนลบรหัส',true);return;}
 if(!cCloudKey())return;
 if(!window.confirm('ลบรหัส SYNC_KEY ออกจากเบราว์เซอร์นี้ใช่หรือไม่? จะไม่ลบคะแนนการเรียนที่บันทึกไว้'))return;
 try{localStorage.removeItem(CLOUD_KEY);}catch{}
 CLOUD.enabled=false;cSafeSet(CLOUD_AUTO,'0');clearTimeout(CLOUD.timer);
 CLOUD.remoteStatus='disconnected';cCloudNotice('ลบรหัสซิงก์จากเบราว์เซอร์นี้แล้ว');
 render();
}
function cPanel(){
 const active=!!cCloudKey(),time=CLOUD.last?new Date(CLOUD.last).toLocaleString('th-TH'):'ยังไม่เคยยืนยันการซิงก์';
 const engine=CLOUD.mode==='cas'?'Safe Sync (ETag / If-Match)':CLOUD.mode==='legacy'?'Legacy Worker (ไม่มี ETag)':'ยังไม่ได้ตรวจความสามารถ Worker';
 return '<div class="panel mt20"><span class="section-kicker">CROSS-DEVICE PROGRESS</span><h3 class="mt10">☁ Unified Learning Sync</h3><p>บันทึกแฟลชการ์ดทุกวิชา ข้อสอบ และประวัติเกมศัพท์ ผ่าน Worker เดิม (ไม่ส่งข้อมูลไปยัง Notion)</p><p style="color:#ae6741;font-weight:700">Cloud Sync ยังอยู่ระหว่าง QA: Worker จริงยังไม่ได้รับการยืนยันว่ารองรับการเขียนข้อมูลพร้อมกันอย่างปลอดภัย · Auto Sync จะปิดตัวเองหากไม่พบ ETag · การซิงก์แบบเดิมต้องยืนยันความเสี่ยงทุกครั้ง โปรดทำ Full backup ก่อนใช้งาน</p><p>โหมดเซิร์ฟเวอร์: <strong>'+h(engine)+'</strong></p><p><strong>'+(active?'มีรหัสซิงก์':'ยังไม่มีรหัสซิงก์')+'</strong> · '+h(time)+'</p><div class="pill-row"><button class="btn btn-primary" data-action="cloud-sync" '+(!active||CLOUD.busy?'disabled':'')+'>↻ Sync now</button><button class="btn btn-outline" data-action="cloud-config">⚙ '+(active?'เปลี่ยนรหัส':'ตั้งรหัสซิงก์')+'</button><button class="btn btn-outline" data-action="cloud-auto">'+(CLOUD.enabled?'ปิด Auto Sync':'เปิด Auto Sync')+'</button><button class="btn btn-outline" data-action="cloud-backup">↓ Local backup</button><button class="btn btn-outline" data-action="cloud-remote-backup" '+(!active||CLOUD.busy?'disabled':'')+'>↓ Cloud snapshot (read-only)</button><button class="btn btn-outline" data-action="cloud-restore">↑ Full restore</button><button class="btn btn-outline" data-action="cloud-forget" '+(!active?'disabled':'')+'>ลบรหัสจากเครื่องนี้</button></div><input type="file" id="fullRestoreInput" accept=".json,application/json" hidden><p class="footnote mt20" id="cloudSyncState" role="status">'+h(CLOUD.message||'ข้อมูลเก็บบนเครื่องจนกว่าจะตั้ง SYNC_KEY และซิงก์สำเร็จ')+'</p><p class="footnote">ระบบเก็บ SYNC_KEY ใน localStorage ของเบราว์เซอร์ ไม่ฝังคีย์ลงเว็บไซต์ · Auto Sync ปิดโดยค่าเริ่มต้น · ถ้าใช้คอมพิวเตอร์สาธารณะให้ใช้โหมดส่วนตัวและลบรหัสออกก่อนเลิกใช้ · โปรดทำ Full backup ก่อนซิงก์ครั้งแรก · Cloud snapshot ใช้แค่ GET ไม่เปลี่ยนข้อมูลบน Worker หรือคะแนนในเครื่อง และไฟล์มีข้อมูลการเรียนส่วนตัว · Full restore เขียนทับคะแนนในเบราว์เซอร์นี้และต้องยืนยันก่อนเสมอ</p></div>';
}

/* Read-only remote snapshot for migration planning. Never POST/PUT or mutate local progress. */
async function cRemoteSnapshot(){
 if(CLOUD.busy){cCloudNotice('มีการซิงก์อื่นทำงานอยู่ กรุณาลองใหม่หลังจบ',true);return;}
 if(!cCloudKey()||!USTATE.ready){cCloudNotice('ยังไม่มีรหัสซิงก์หรือข้อมูลวิชาไม่พร้อม',true);return;}
 if(!window.confirm('สำรองคะแนนจาก Cloudflare แบบอ่านอย่างเดียวทั้ง 5 วิชาใช่หรือไม่?\n\nไฟล์ JSON นี้มีรายละเอียดคะแนนการเรียนและควรเก็บเป็นส่วนตัว ถ้าใช้คอมพิวเตอร์สาธารณะควรย้ายไฟล์ไปพื้นที่ส่วนตัวแล้วลบไฟล์ที่ดาวน์โหลดออกจากเครื่อง'))return;
 CLOUD.busy=true;cCloudNotice('กำลังอ่านข้อมูล Cloudflare เพื่อสำรอง (ไม่ส่งคำสั่ง PUT)...');
 try{
  const api=await cApiUrl();
  const headers={'X-Sync-Key':cCloudKey()};
  const subjects={},revisions={};
  for(const d of USTATE.decks){
   const response=await fetch(api+'/progress/'+encodeURIComponent(d.key),{headers,cache:'no-store'});
   if(response.status===401)throw Error('รหัส SYNC_KEY ไม่ถูกต้อง');
   if(!response.ok)throw Error('อ่านข้อมูลวิชา '+d.key+' ไม่สำเร็จ HTTP '+response.status);
   const body=await response.text();
   if(new TextEncoder().encode(body).byteLength>500000)throw Error('ข้อมูลวิชา '+d.key+' ใหญ่เกินขนาดปลอดภัย');
   const value=JSON.parse(body);
   if(!value||typeof value!=='object'||Array.isArray(value)||value.error)throw Error('ข้อมูลวิชา '+d.key+' มีรูปแบบผิดปกติ');
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
  if(payload.includes(cCloudKey()))throw Error('ไม่สามารถสร้างไฟล์สำรองได้อย่างปลอดภัย');
  const blob=new Blob([payload],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='vocabloom-cloud-snapshot-'+cDate()+'.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  cCloudNotice('อ่านและดาวน์โหลดสำรองข้อมูล Cloudflare ครบ 5 วิชาแล้ว · 5 GET / 0 PUT');
 }catch(e){
  cCloudNotice('ดาวน์โหลดสำรองข้อมูล Cloudflare ไม่สำเร็จ: '+String(e.message||e),true);
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
 cCloudNotice('ส่งออกสำรองทั้ง 5 วิชาแล้ว (ไม่รวม SYNC_KEY)');
}

function cPanelAction(el){
 if(el.dataset.action==='cloud-restore'){document.getElementById('fullRestoreInput')?.click();return true;}
 if(el.dataset.action==='cloud-forget'){cForgetKey();return true;}
 if(el.dataset.action==='cloud-remote-backup'){cRemoteSnapshot();return true;}
 if(el.dataset.action==='cloud-backup'){cFullBackup();return true;}
 if(el.dataset.action==='cloud-config'){cSetKey();return true;}
 if(el.dataset.action==='cloud-sync'){cCloudSync(true);return true;}
 if(el.dataset.action==='cloud-auto'){CLOUD.enabled=!CLOUD.enabled;cSafeSet(CLOUD_AUTO,CLOUD.enabled?'1':'0');render();if(CLOUD.enabled)cCloudSync(false);return true;}
 return false;
}
function cDashboardExtra(){
 if(!USTATE.ready)return '';
 const counts=USTATE.decks.map(d=>({name:d.name,...uStats(d)}));
 const total=counts.reduce((a,x)=>a+x.total,0),seen=counts.reduce((a,x)=>a+x.seen,0),due=counts.reduce((a,x)=>a+x.due,0);
 const d=CLOUD.studyMergedDays?.[cDate()]||CLOCAL.studyDays[cDate()]||{answered:0};
 return '<div class="panel mt20"><div class="panel-header"><h3>Unified Study Progress</h3><span class="badge">ALL SUBJECTS</span></div><div class="progress-tiles mt20"><div class="mini-metric"><strong>'+total+'</strong><small>Flashcards</small></div><div class="mini-metric"><strong>'+seen+'</strong><small>Cards reviewed</small></div><div class="mini-metric"><strong>'+due+'</strong><small>Cards due</small></div><div class="mini-metric"><strong>'+(Number(d.answered)||0)+'</strong><small>Other subject reviews today</small></div></div><p class="footnote mt20">การ์ดภาษาอังกฤษและเกมศัพท์ใช้สถานะร่วมกันเมื่อเป็นคำเดียวกัน ส่วนวิชาอื่นเก็บรอบทบทวนด้วยคีย์เดิม</p></div>';
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
 window.addEventListener('storage',e=>{if(e.key===CLOUD_KEY&&cCloudKey()&&CLOUD.enabled)cCloudDebounce();});
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
