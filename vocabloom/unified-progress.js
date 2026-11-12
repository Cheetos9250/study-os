
/* VocaBloom unified progress bridge, additive to Study OS; does not delete original data. */
'use strict';
const CLOUD_KEY='study-sync-key', CLOUD_DEVICE_KEY='vocabloom-device-v1';
const CLOUD_LOCAL_DAYS='vocabloom-device-days-v1', CLOUD_STUDY_DAYS='vocabloom-device-study-days-v1';
const CLOUD_LAST='vocabloom-last-sync-v1', CLOUD_AUTO='vocabloom-auto-sync-v1';
const CLOUD_PREFIX='vb/v1/';
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
 const n=Number(cSafeGet(CLOUD_LAST)||0);CLOUD.last=Number.isFinite(n)?n:0;
 CLOUD.enabled=cSafeGet(CLOUD_AUTO)!=='0';
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
function cOriginalCardFor(w){
 const d=typeof uDeck==='function'?uDeck('eng'):null;
 if(!d||typeof uCards!=='function')return null;
 const k=cWordKey(w.en);return uCards(d).find(c=>cWordKey(c.f)===k)||null;
}
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
function cMirrorCardToVocab(card,rating){
 const w=cWordForCard(card);
 if(!w){cStudyRecord(Number(rating)>=3);return;}
 const oldRecord=ORIGINAL_VOCA_RECORD;
 oldRecord(w.id,Number(rating)>=3);
 if(data.progress[w.id])data.progress[w.id].syncTs=Date.now();
 store();cLocalRecord(w.id,Number(rating)>=3);
}
function cBridgeExistingSrs(){
 const d=uDeck('eng');if(!d)return;
 const s=uReadSrs(d).s;
 let changed=false;
 for(const w of allWords()){
  const c=cOriginalCardFor(w);if(!c)continue;
  const st=s[c.mid],p=data.progress[w.id]||{},local=Number(p.syncTs||0);
  if(st&&st.ts>local){
   const correct=Number(st.last||0)>=3;
   data.progress[w.id]={...p,seen:true,mastered:st.st==='rev'&&Number(st.ivl||0)>=7,streak:correct?Math.max(1,Number(p.streak||0)):0,interval:Math.max(1,Number(st.ivl||1)),due:localDate(new Date(Number(st.due||Date.now()))),last:localDate(new Date(Number(st.ts||Date.now()))),syncTs:Number(st.ts)};
   changed=true;
  }else if(p.seen&&local>Number(st?.ts||0))cBridgeGameToCard(w.id,Number(p.streak||0)>0);
 }
 if(changed)store();
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
async function cCloudSync(manual=false){
 if(CLOUD.busy||(!manual&&!CLOUD.enabled)||!cCloudKey()||!USTATE.ready)return;
 CLOUD.busy=true;cCloudNotice('กำลังซิงก์ข้อมูล...');let count=0;
 try{
  const api=await cApiUrl(),key=cCloudKey();
  const hds={'X-Sync-Key':key,'Content-Type':'application/json'};
  for(const d of USTATE.decks){
   const url=api+'/progress/'+encodeURIComponent(d.key);
   const resp=await fetch(url,{headers:hds,cache:'no-store'});
   if(resp.status===401)throw Error('รหัส SYNC_KEY ไม่ถูกต้อง — ตั้งรหัสใหม่ได้ใน Settings');
   if(resp.status===404||resp.status===405)throw Error('Worker ไม่รองรับเส้นทางซิงก์ '+d.key);
   if(!resp.ok)throw Error('Cloudflare GET '+d.key+' HTTP '+resp.status);
   const remote=await resp.json();
   if(remote!==null&&(typeof remote!=='object'||Array.isArray(remote)||remote.error||(Object.keys(remote).length>0&&!remote.study&&!remote.srs)))throw Error('รูปแบบข้อมูล Worker ไม่ถูกต้อง');
   const local=cLocalSubject(d);
   if(d.key==='eng')cShadowFromLocal(local.srs.s);
   const joined=cMergeState(local,remote||{});
   const body=JSON.stringify(joined);
   if(body.length>350000)throw Error('ข้อมูลซิงก์มากเกินขนาดที่ปลอดภัย กรุณาส่งออก Backup ก่อน');
   const saved=await fetch(url,{method:'PUT',headers:hds,body});
   if(saved.status===401)throw Error('รหัส SYNC_KEY ไม่ถูกต้อง');
   if(!saved.ok)throw Error('Cloudflare PUT '+d.key+' HTTP '+saved.status);
   cApplySubject(d,joined);count++;
  }
  CLOUD.last=Date.now();cSafeSet(CLOUD_LAST,String(CLOUD.last));CLOUD.remoteStatus='saved';
  cCloudNotice('ซิงก์สำเร็จทั้ง '+count+' วิชา · '+new Date(CLOUD.last).toLocaleTimeString('th-TH'));if(['home','studymerge','review','progress','settings'].includes(ui.page))render();
 }catch(e){
  CLOUD.remoteStatus='error';cCloudNotice('ซิงก์ไม่สำเร็จ: '+String(e.message||e),true);
 }finally{CLOUD.busy=false;}
}
function cCloudDebounce(){if(!cCloudKey()||!CLOUD.enabled)return;clearTimeout(CLOUD.timer);CLOUD.timer=setTimeout(()=>cCloudSync(false),3500);}
function cSetKey(){
 const k=window.prompt('ใส่ SYNC_KEY ที่ตั้งไว้ใน Cloudflare Worker study-api (ใช้รหัสเดียวกับหน้า Study OS เดิม)',cCloudKey()?'':'');
 if(k===null)return;
 if(!k.trim()){cCloudNotice('ยังไม่ได้ตั้งรหัสซิงก์');return}
 cSafeSet(CLOUD_KEY,k.trim());CLOUD.enabled=true;cSafeSet(CLOUD_AUTO,'1');cCloudSync(true);render();
}
function cPanel(){
 const active=!!cCloudKey(),time=CLOUD.last?new Date(CLOUD.last).toLocaleString('th-TH'):'ยังไม่เคยยืนยันการซิงก์';
 return '<div class="panel mt20"><span class="section-kicker">CROSS-DEVICE PROGRESS</span><h3 class="mt10">☁ Unified Learning Sync</h3><p>บันทึกแฟลชการ์ดทุกวิชา ข้อสอบ และประวัติเกมศัพท์ ผ่าน Worker เดิม (ไม่ส่งข้อมูลไปยัง Notion)</p><p><strong>'+(active?'มีรหัสซิงก์':'ยังไม่มีรหัสซิงก์')+'</strong> · '+h(time)+'</p><div class="pill-row"><button class="btn btn-primary" data-action="cloud-sync" '+(!active||CLOUD.busy?'disabled':'')+'>↻ Sync now</button><button class="btn btn-outline" data-action="cloud-config">⚙ '+(active?'เปลี่ยนรหัส':'ตั้งรหัสซิงก์')+'</button><button class="btn btn-outline" data-action="cloud-auto">'+(CLOUD.enabled?'ปิด Auto Sync':'เปิด Auto Sync')+'</button></div><p class="footnote mt20" id="cloudSyncState" role="status">'+h(CLOUD.message||'ข้อมูลเก็บบนเครื่องจนกว่าจะตั้ง SYNC_KEY และซิงก์สำเร็จ')+'</p><p class="footnote">ระบบเก็บ SYNC_KEY ใน localStorage ของเบราว์เซอร์ ไม่ฝังคีย์ลงเว็บไซต์ และจะหยุดการเขียนหากตรวจสอบ Worker ไม่ผ่าน</p></div>';
}
function cPanelAction(el){
 if(el.dataset.action==='cloud-config'){cSetKey();return true;}
 if(el.dataset.action==='cloud-sync'){cCloudSync(true);return true;}
 if(el.dataset.action==='cloud-auto'){CLOUD.enabled=!CLOUD.enabled;cSafeSet(CLOUD_AUTO,CLOUD.enabled?'1':'0');render();if(CLOUD.enabled)cCloudSync(true);return true;}
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
  if(data.progress[id])data.progress[id].syncTs=Date.now();
  store();cLocalRecord(id,correct);
  if(USTATE.ready)cBridgeGameToCard(id,correct);
  cCloudDebounce();
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
