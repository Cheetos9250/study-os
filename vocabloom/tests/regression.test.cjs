'use strict';
/* No network or credentials; run node --test vocabloom/tests/regression.test.cjs */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('vocabloom/index.html');
const ui=read('vocabloom/study-integration.js');
const cloud=read('vocabloom/unified-progress.js');
const decks=JSON.parse(read('vocabloom/study-decks.json'));
const cards=JSON.parse(read('data/cards.json'));
const quizzes=JSON.parse(read('data/quiz.json'));
function extract(code,first,second){
 const a=code.indexOf(first),b=code.indexOf(second,a+first.length);
 assert.ok(a>=0&&b>a,'Missing function anchor: '+first);
 return code.slice(a,b);
}
test('Scripts parse without JavaScript syntax errors',()=>{
 const m=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(m,'Main app script missing');
 new vm.Script(m[1],{filename:'index.html'});
 new vm.Script(ui,{filename:'study-integration.js'});
 new vm.Script(cloud,{filename:'unified-progress.js'});
});
test('UI fixes and all required resources are present',()=>{
 assert.ok(html.includes('href="./favicon.svg"'));
 assert.ok(read('vocabloom/favicon.svg').includes('<svg'));
 assert.ok(!html.includes('WEDNESDAY OR ANY DAY'));
 assert.ok(html.includes('src="./study-integration.js"'));
 assert.ok(html.includes('src="./unified-progress.js"'));
 assert.ok(html.includes('background:linear-gradient(to right,var(--white)'));
 assert.ok(cloud.includes("CLOUD.enabled=cSafeGet(CLOUD_AUTO)==='1'"));
 assert.ok(cloud.includes('function cForgetKey()'));
 assert.ok(cloud.includes('function cFullBackup()'));
 assert.ok(cloud.includes("data-action=\"cloud-forget\""));
});
test('Original five subject decks and identity keys retained',()=>{
 assert.deepEqual(new Set(decks.decks.map(d=>d.key)),new Set(['acc','eco','math','eng','zh']));
 const ids=decks.decks.flatMap(d=>d.cards.map(c=>d.key+':'+c[4]));
 assert.equal(ids.length,757);
 assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual(decks.decks.map(d=>d.markKey),[
 'acc-flashcards-v1','econ-flashcards-v1','math-flashcards-v1','eng-vocab-v1','zh-vocab-v1'
 ]);
 assert.ok(cards.rows.length>=400,'Missing Notion export cards');
 assert.ok(quizzes.rows.length>=200,'Missing verified quiz export');
});
test('Cross-device merge keeps newer quiz answers and card schedules',()=>{
 const mergeCode=extract(cloud,'function cMergeState(a,b){','function cApplySubject(d,merged){');
 const merge=new Function(mergeCode+';return cMergeState;')();
 const a={study:{ans:{0:1},ats:{0:200}},srs:{s:{card:{ts:10,due:1000}},m:{day:123,newDone:2}}};
 const b={study:{ans:{0:2,1:3},ats:{0:100,1:150}},srs:{s:{card:{ts:20,due:2000},newcard:{ts:5}},m:{day:123,newDone:3}}};
 const m=merge(a,b);
 assert.equal(m.study.ans[0],1);
 assert.equal(m.study.ans[1],3);
 assert.equal(m.srs.s.card.due,2000);
 assert.ok(m.srs.s.newcard);
 assert.equal(m.srs.m.newDone,3);
});
test('SRS supports all four review ratings and preserves previous state',()=>{
 const code=extract(ui,'function uStartDay(t){','function uRate(d,r){');
 const make=new Function(code+';return {uSchedule,uStartDay};');
 const {uSchedule}=make();
 const base={st:'rev',step:0,ease:2.5,ivl:5,lapses:0,due:1,ts:1};
 for(const rating of [1,2,3,4]){
  const next=uSchedule(base,rating);
  assert.ok(next.ts>0);
  assert.ok(next.due>0);
  assert.ok(next.ivl>=0);
  assert.equal(base.ivl,5,'Rating mutated shared input');
 }
 const again=uSchedule(base,1);
 const easy=uSchedule(base,4);
 assert.equal(again.st,'learn');
 assert.equal(easy.st,'rev');
 assert.ok(easy.ivl>base.ivl);
});


test('Full restore safely restores all five subject slots and rejects invalid JSON',async()=>{
 const restoreCode=extract(cloud,'async function cFullRestore(file){','function cForgetKey(){');
 const code=[
 'const memory=new Map(), structuredClone=x=>JSON.parse(JSON.stringify(x));',
 'let failKey=null, data={progress:{original:{seen:true}},days:{},custom:[],settings:{goal:10}};',
 'const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>{if(k===failKey)throw Error("Storage full");memory.set(k,String(v))},removeItem:k=>memory.delete(k)};',
 'const STORAGE_KEY="vocabloom_mvp_v1",CLOUD_LOCAL_DAYS="device-days",CLOUD_STUDY_DAYS="study-days";',
 'const USTATE={decks:bundle.decks},CLOCAL={device:"device-A",days:{},studyDays:{}},CLOUD={busy:false,remoteStatus:"not connected"};',
 'const cSafeGet=k=>localStorage.getItem(k),cSafeSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};',
 'const window={confirm:()=>true};let status="";const cCloudNotice=s=>status=s,render=()=>{};',
 restoreCode,
 'return async()=>{',
 ' const payload={version:1,type:"vocabloom-unified-study-backup",deviceId:"device-A",vocabloom:{progress:{restored:{seen:true}},days:{},custom:[],settings:{goal:10}},deviceDays:{today:{answered:2,correct:1}},studyDays:{},subjects:{}};',
 ' for(const d of bundle.decks){payload.subjects["study-"+d.key]={ans:{0:2},ats:{0:100}};payload.subjects[d.markKey+"-srs"]={s:{},m:{day:0,newDone:0}}}',
 ' const file={size:300,text:async()=>JSON.stringify(payload)};',
 ' failKey=bundle.decks[2].markKey+"-srs";await cFullRestore(file);',
 ' const rollback=data.progress.original.seen&&!memory.has("study-acc");',
 ' failKey=null;await cFullRestore(file);',
 ' const restored=data.progress.restored.seen&&JSON.parse(memory.get("study-acc")).ans[0]===2;',
 ' await cFullRestore({size:12,text:async()=>"{broken"});',
 ' return {rollback,restored,invalidPreserved:data.progress.restored.seen};',
 '};'
 ].join('\n');
 const fixture=new Function('bundle',code)(decks);
 const result=await fixture();
 assert.equal(result.rollback,true,'Expected rollback after storage failure');
 assert.equal(result.restored,true,'Expected complete subject restore');
 assert.equal(result.invalidPreserved,true,'Bad JSON must not overwrite restored data');
});


test('BR-08: actual Full backup round-trips on clean profile with empty English/Chinese study slots',async()=>{
 const saveCode=extract(cloud,'function cFullBackup(){','function cPanelAction(el){');
 const restoreCode=extract(cloud,'async function cFullRestore(file){','function cForgetKey(){');
 const fixture=new Function('bundle',[
  'const memory=new Map(), structuredClone=x=>JSON.parse(JSON.stringify(x));',
  'let data={progress:{apple:{seen:true,correct:3}},days:{today:{answered:3,correct:2}},custom:[],settings:{goal:10}};',
  'const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};',
  'const STORAGE_KEY="vocabloom_mvp_v1",CLOUD_LOCAL_DAYS="device-days",CLOUD_STUDY_DAYS="study-days";',
  'const USTATE={decks:bundle.decks},CLOCAL={device:"device-A",days:{today:{answered:3,correct:2}},studyDays:{}},CLOUD={busy:false,remoteStatus:"local"};',
  'const cSafeGet=k=>localStorage.getItem(k),cSafeSet=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}},cSafeJSON=(k,def)=>{try{return JSON.parse(memory.get(k))||def}catch{return def}};',
  'const cDate=()=> "2026-11-12";let captured=null,status="";',
  'const URL={createObjectURL:blob=>{captured=blob;return "blob:qa"},revokeObjectURL:()=>{}};',
  'const document={createElement:()=>({click(){},remove(){}}),body:{append(){}},getElementById:()=>null};',
  'const setTimeout=()=>0;const window={confirm:()=>true};const cCloudNotice=s=>status=s,render=()=>{};',
  saveCode,restoreCode,
  'return async()=>{',
  ' for(const d of bundle.decks){memory.set("study-"+d.key,d.key==="acc"?JSON.stringify({ans:{0:1},ats:{0:123}}):"{}");memory.set(d.markKey+"-srs",d.key==="acc"?JSON.stringify({s:{card:{ts:123,due:555}},m:{day:0,newDone:1}}):"{}");}',
  ' const expected=Object.fromEntries([...memory]);',
  ' cFullBackup();if(!captured)throw Error("No Blob from cFullBackup");',
  ' const exported=JSON.parse(await captured.text());',
  ' const blankFields=JSON.stringify(exported.subjects["study-eng"])==="{}"&&JSON.stringify(exported.subjects["study-zh"])==="{}";',
  ' const clean=new Map();memory.clear();data={progress:{},days:{},custom:[],settings:{}};CLOCAL.device="device-B";',
  ' await cFullRestore({size:captured.size,text:()=>captured.text()});',
  ' const restored=Object.keys(expected).every(k=>memory.get(k)===expected[k])&&data.progress.apple?.correct===3;',
  ' const deviceDaysSkipped=Object.keys(CLOCAL.days).length===0;',
  ' const before=JSON.stringify([...memory]);await cFullRestore({size:10,text:async()=>"{invalid"});',
  ' const rejected=JSON.stringify([...memory])===before;',
  ' return {blankFields,restored,deviceDaysSkipped,rejected,exported};',
  '};'
 ].join('\n'))(decks);
 const r=await fixture();
 assert.equal(r.blankFields,true,'English/Chinese study slots must remain empty, not fabricated');
 assert.equal(r.restored,true,'Full backup must restore every slot and VocaBloom progress unchanged');
 assert.equal(r.deviceDaysSkipped,true,'Device-specific activity must not double count on another device');
 assert.equal(r.rejected,true,'Invalid backup must leave prior restored data unchanged');
});
test('UP-02/UP-04: reloading must not rewrite either existing SRS or vocabulary schedules',()=>{
 const migration=extract(cloud,'function cBridgeExistingSrs(){','function cShadow(');
 const run=new Function('payload','bridgeCode',[
  'const memory=new Map(),localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v))};',
  'const d={markKey:"eng-vocab-v1"},word={id:"example",en:"accounts payable"},card={mid:"n-test"};',
  'let data={progress:{example:{seen:true,correct:3,wrong:0,streak:2,interval:7,due:"2026-11-20",last:"2026-11-12",syncTs:1001}}};',
  'const allWords=()=>[word],uDeck=()=>d,cOriginalCardFor=()=>card;',
  'const uReadSrs=()=>{const raw=localStorage.getItem("eng-vocab-v1-srs");return raw?JSON.parse(raw):{s:{},m:{day:0,newDone:0}};};',
  'const cSafeSet=(k,v)=>{localStorage.setItem(k,v);return true};',
  'const localDate=d=>d.toISOString().slice(0,10),cDate=()=> "2026-11-12";',
  'const store=()=>memory.set("vocabloom_mvp_v1",JSON.stringify(data));',
  migration,
  'const original={s:{"n-test":{st:"rev",step:1,ease:2.65,ivl:10,due:1795280400000,ts:1000,last:4}},m:{day:0,newDone:0}};',
  'memory.set("eng-vocab-v1-srs",JSON.stringify(original));store();',
  'const beforeSrs=memory.get("eng-vocab-v1-srs"),beforeWord=memory.get("vocabloom_mvp_v1");',
  'cBridgeExistingSrs();cBridgeExistingSrs();',
  'return {scheduleUnchanged:memory.get("eng-vocab-v1-srs")===beforeSrs,wordUnchanged:memory.get("vocabloom_mvp_v1")===beforeWord};'
 ].join('\n'))({},migration);
 assert.equal(run.scheduleUnchanged,true,'Existing SRS interval/due/last must not change on reload');
 assert.equal(run.wordUnchanged,true,'Existing vocabulary date/interval must not change on reload');
});
test('UP-03-H: Hard rating counts as remembered, and schedule uses canonical SRS timestamps',()=>{
 const bridgeCode=extract(cloud,'function cReflectWordSchedule(w,card){','/* One-time legacy migration only.');
 const execute=new Function('bridgeCode',[
  'const d={markKey:"eng-vocab-v1"},word={id:"word1",en:"accounts payable"},card={mid:"n-card1"};',
  'let data={progress:{}},passedCorrect=null,deviceCorrect=null;',
  'const uDeck=()=>d,cWordForCard=()=>word,uReadSrs=()=>({s:{"n-card1":{st:"learn",ivl:0,due:1794461552006,ts:1794460952006}}});',
  'const localDate=d=>new Date(d).toISOString().slice(0,10),store=()=>{};',
  'const ORIGINAL_VOCA_RECORD=(id,correct)=>{passedCorrect=correct;data.progress[id]={seen:true,correct:correct?1:0,wrong:correct?0:1,streak:correct?1:0,due:"2026-11-13"};};',
  'const cLocalRecord=(id,correct)=>{deviceCorrect=correct;};',
  bridgeCode,
  'cMirrorCardToVocab(card,2);',
  'return {passedCorrect,deviceCorrect,progress:data.progress.word1};'
 ].join('\n'))(bridgeCode);
 assert.equal(execute.passedCorrect,true,'Hard must not be counted as wrong');
 assert.equal(execute.deviceCorrect,true);
 assert.equal(execute.progress.wrong,0);
 assert.equal(execute.progress.syncTs,1794460952006);
 assert.equal(execute.progress.due,'2026-11-12');
});


test('P2: existing Auto Sync opt-in is cleared once without clearing scores or key',()=>{
 const code=extract(cloud,'function cInitLocal(){','function cLocalRecord(wordId,correct){');
 const fixture=new Function('initCode',[
  'const map=new Map([["study-sync-key","KEEP_THIS_KEY"],["vocabloom-auto-sync-v1","1"],["study-acc","{\\"ans\\":{\\"1\\":2}}"]]);',
  'const localStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v))};',
  'const cSafeGet=k=>localStorage.getItem(k),cSafeSet=(k,v)=>{localStorage.setItem(k,v);return true};',
  'const cSafeJSON=(k,f)=>{try{return JSON.parse(map.get(k))||f}catch{return f}};',
  'const cDevice=()=> "device-test",cDate=()=>"2026-11-12";',
  'const CLOUD_LOCAL_DAYS="day-local",CLOUD_STUDY_DAYS="study-days",CLOUD_LAST="last-sync",CLOUD_AUTO="vocabloom-auto-sync-v1",CLOUD_AUTOSYNC_MIGRATION="vocabloom-autosync-safety-v2";',
  'const CLOCAL={days:{},studyDays:{},device:""},CLOUD={last:0,enabled:true,message:""};',
  'const data={progress:{},days:{},custom:[]};const structuredClone=x=>JSON.parse(JSON.stringify(x));const store=()=>{};',
  initCode,
  'cInitLocal();',
  'const first={enabled:CLOUD.enabled,flag:map.get(CLOUD_AUTO),migration:map.get(CLOUD_AUTOSYNC_MIGRATION),key:map.get("study-sync-key"),score:map.get("study-acc")};',
  'map.set(CLOUD_AUTO,"1");cInitLocal();',
  'return {first,second:CLOUD.enabled};'
 ].join('\n'))(code);
 assert.equal(fixture.first.enabled,false);
 assert.equal(fixture.first.flag,'0');
 assert.equal(fixture.first.migration,'1');
 assert.equal(fixture.first.key,'KEEP_THIS_KEY');
 assert.equal(JSON.parse(fixture.first.score).ans['1'],2);
 assert.equal(fixture.second,true,'Manual later opt-in must remain enabled');
});
test('P2: key prompt explicitly discloses immediate sync and dark links are readable',()=>{
 assert.ok(cloud.includes('ระบบจะซิงก์ทันที 1 รอบ'));
 assert.ok(cloud.includes('อ่านและเขียนข้อมูลทั้ง 5 วิชา'));
 assert.ok(html.includes('body.dark .text-link { color:#c4baff; }'));
});
