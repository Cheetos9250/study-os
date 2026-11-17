const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const A=require('../scripts/study-sync-app.js');
const root=path.join(__dirname,'..');
const KEY='FAKE_PROD_KEY_TEST_ONLY_0123456789',HOST='https://vocabloom-progress-cas-prod.kasidit09022550.workers.dev';
const TODAY='studyos.today.v1',HOME='studyos.home.v1',GRADES='studyos.grades.v1',NOTES='studyos.notes.v1';

function storage(init={}){const m=new Map(Object.entries(init));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),map:m};}
async function server(){
 const {default:entry,ProductionProgressDO}=await import('../experiments/prod-progress-cas/worker.mjs');
 const objects=new Map(),log=[];
 const env={PROGRESS_CAS_ENABLED:'true',PROGRESS_WRITES_ENABLED:'true',PROGRESS_MIGRATION_VERIFIED:'true',PROGRESS_SYNC_KEY:KEY,
  PROD_PROGRESS_DO:{idFromName:s=>s,get(id){if(!objects.has(id)){const d=new Map();objects.set(id,new ProductionProgressDO({storage:{kv:{get:k=>d.get(k),put:(k,v)=>d.set(k,structuredClone(v))}}}));}return objects.get(id);}}};
 const fetch=async(url,init={})=>{log.push((init.method||'GET')+' '+url);
  const h=new Headers(init.headers||{});h.set('Origin','https://cheetos9250.github.io');
  return entry.fetch(new Request(url,{method:init.method||'GET',headers:h,body:init.body}),env);};
 return {fetch,log};
}
let clock=1_800_000_000_000;
const sync=(srv,st,extra={})=>A.syncOnce({storage:st,fetch:srv.fetch,endpoint:HOST,key:KEY,now:()=>(clock+=1000),...extra});
const J=(st,k)=>JSON.parse(st.getItem(k));

test('first device uploads, second device receives (timetable, exams, ticks, grades, notes)',async()=>{
 const srv=await server();
 const today={exams:[{id:'acc-final',course:'acc',title:'Accounting final',date:'2026-11-26',cats:['c5']}],done:{'acc-final':{c5:'2026-11-16'}},tasks:{},timetable:[{id:'c1',day:1,start:'09:00',end:'12:00',name:'Accounting'}]};
 const ipad=storage({[TODAY]:JSON.stringify(today),[GRADES]:JSON.stringify({courses:[{name:'ACC',items:[{weight:10,got:8}]}]}),[NOTES]:JSON.stringify({'acc:c5':{text:'Inventory',updated:'2026-11-15T10:00:00Z'}})});
 const r1=await sync(srv,ipad);
 assert.deepEqual(r1.pushed.sort(),[GRADES,NOTES,TODAY].sort());
 const pc=storage();
 const r2=await sync(srv,pc);
 assert.deepEqual(r2.pulled.sort(),[GRADES,NOTES,TODAY].sort());
 assert.deepEqual(J(pc,TODAY),today);assert.equal(pc.getItem(GRADES),ipad.getItem(GRADES));assert.equal(pc.getItem(NOTES),ipad.getItem(NOTES));
 // Nothing changed: no write at all.
 const before=srv.log.length;const r3=await sync(srv,ipad);
 assert.deepEqual([r3.pushed,r3.pulled],[[],[]]);assert.ok(srv.log.slice(before).every(x=>x.startsWith('GET')));
});

test('an edit on one device reaches the other; the unchanged side never overwrites it',async()=>{
 const srv=await server();
 const ipad=storage({[GRADES]:JSON.stringify({courses:[{name:'ACC',items:[{weight:10,got:null}]}]})});
 await sync(srv,ipad);const pc=storage();await sync(srv,pc);
 pc.setItem(GRADES,JSON.stringify({courses:[{name:'ACC',items:[{weight:10,got:9}]}]}));
 assert.ok(A.pending(pc));
 await sync(srv,pc);
 await sync(srv,ipad);
 assert.equal(J(ipad,GRADES).courses[0].items[0].got,9);
 assert.equal(A.pending(ipad),false);
});

test('both devices changed: union keeps both, newer edit wins on the same item',async()=>{
 const srv=await server();
 const base={exams:[{id:'e1',course:'acc',date:'2026-11-26',cats:[]}],done:{},tasks:{},timetable:[]};
 const ipad=storage({[TODAY]:JSON.stringify(base),[NOTES]:JSON.stringify({'acc:c1':{text:'old',updated:'2026-11-10T00:00:00Z'}})});
 await sync(srv,ipad);const pc=storage();await sync(srv,pc);
 // Offline edits on both.
 ipad.setItem(TODAY,JSON.stringify({...base,exams:[...base.exams,{id:'e2',course:'eco',date:'2026-11-27',cats:[]}],done:{e1:{c5:'2026-11-16'}}}));
 ipad.setItem(NOTES,JSON.stringify({'acc:c1':{text:'ipad newer',updated:'2026-11-16T09:00:00Z'}}));
 A.noteEdits(ipad,clock+=1000);
 pc.setItem(TODAY,JSON.stringify({...base,exams:[...base.exams,{id:'e3',course:'math',date:'2026-12-01',cats:[]}],done:{e1:{c6:'2026-11-16'}},timetable:[{id:'c1',day:2,start:'10:00',end:'11:00'}]}));
 pc.setItem(NOTES,JSON.stringify({'acc:c1':{text:'pc older',updated:'2026-11-12T00:00:00Z'},'eco:c1':{text:'pc only'}}));
 A.noteEdits(pc,clock+=1000);
 const conflicts=[];
 await sync(srv,ipad);
 const r=await sync(srv,pc,{conflict:(k,raw)=>conflicts.push([k,raw])});
 assert.deepEqual(r.merged.sort(),[NOTES,TODAY].sort());
 await sync(srv,ipad);
 for(const st of [ipad,pc]){
  const t=J(st,TODAY);
  assert.deepEqual(t.exams.map(e=>e.id).sort(),['e1','e2','e3']);
  assert.deepEqual(t.done.e1,{c5:'2026-11-16',c6:'2026-11-16'});
  assert.equal(t.timetable.length,1,'newer whole timetable kept');
  assert.equal(J(st,NOTES)['acc:c1'].text,'ipad newer');assert.equal(J(st,NOTES)['eco:c1'].text,'pc only');
 }
 assert.equal(ipad.getItem(TODAY),pc.getItem(TODAY));
 assert.equal(conflicts.length,2,'the local value before each merge is handed over to be kept');
});

test('a device that lost its data is restored from the cloud, and never deletes the cloud copy',async()=>{
 const srv=await server();
 const ipad=storage({[TODAY]:JSON.stringify({exams:[],timetable:[{id:'c1',day:1,start:'09:00',end:'10:00'}]})});
 await sync(srv,ipad);
 ipad.removeItem(TODAY); // Safari cleared site data for this key
 const r=await sync(srv,ipad);
 assert.deepEqual(r.pulled,[TODAY]);assert.equal(J(ipad,TODAY).timetable.length,1);
 // Fresh device whose page already wrote defaults: cloud copy (established data) wins scalar fields; lists are unioned.
 const pc=storage({[TODAY]:JSON.stringify({exams:[{id:'d1',course:'acc',date:'2026-11-16',cats:[]}],timetable:[]})});
 await sync(srv,pc);
 assert.equal(J(pc,TODAY).timetable.length,1);assert.deepEqual(J(pc,TODAY).exams.map(e=>e.id),['d1']);
});

test('home: tasks and checklist sync, images stay on each device',async()=>{
 const srv=await server();
 const img='data:image/png;base64,AAAA';
 const ipad=storage({[HOME]:JSON.stringify({cover:img,tasks:[{id:'t1',title:'Read Ch5',date:'2026-11-17',pri:'High'}],focus:{a:true}})});
 await sync(srv,ipad);
 const pc=storage({[HOME]:JSON.stringify({cover:'https://example.com/pc.png'})});
 await sync(srv,pc);
 const h=J(pc,HOME);
 assert.equal(h.cover,'https://example.com/pc.png');assert.equal(h.tasks[0].id,'t1');assert.deepEqual(h.focus,{a:true});
 assert.ok(!srv.log.some(()=>false));
 // The cloud copy never contains the image.
 const g=await srv.fetch(HOST+'/progress/app',{headers:{'X-Sync-Key':KEY}});
 assert.doesNotMatch(JSON.stringify(await g.json()),/data:image/);
});

test('a page write during the sync is not overwritten; the next round merges it',async()=>{
 const srv=await server();
 const ipad=storage({[GRADES]:JSON.stringify({courses:[{name:'A',items:[]}]})});await sync(srv,ipad);
 const pc=storage();await sync(srv,pc);
 ipad.setItem(GRADES,JSON.stringify({courses:[{name:'B',items:[]}]}));await sync(srv,ipad);
 // pc has its own note to upload; its page saves grades while the upload is in flight.
 pc.setItem(NOTES,JSON.stringify({'acc:c1':{text:'pc'}}));
 const racing={...srv,fetch:async(u,i)=>{const r=await srv.fetch(u,i);if(i.method==='PUT')pc.setItem(GRADES,JSON.stringify({courses:[{name:'PC edit',items:[]}]}));return r;}};
 const r=await sync(racing,pc);
 assert.deepEqual(r.skipped,[GRADES]);assert.equal(J(pc,GRADES).courses[0].name,'PC edit');
 const r2=await sync(srv,pc);
 assert.deepEqual(r2.merged,[GRADES]);
});

test('concurrent devices: compare-and-set retry, no lost update',async()=>{
 const srv=await server();
 const a=storage({[NOTES]:JSON.stringify({'acc:c1':{text:'A',updated:'2026-11-16T01:00:00Z'}})});
 const b=storage({[NOTES]:JSON.stringify({'eco:c1':{text:'B',updated:'2026-11-16T01:00:00Z'}})});
 await Promise.all([sync(srv,a),sync(srv,b)]);
 await sync(srv,a);await sync(srv,b);
 assert.deepEqual(Object.keys(J(a,NOTES)).sort(),['acc:c1','eco:c1']);assert.equal(a.getItem(NOTES),b.getItem(NOTES));
});

test('refuses servers without a revision, a wrong key, or damaged cloud data, changing nothing',async()=>{
 const st=storage({[GRADES]:'{"courses":[]}'});const before=[...st.map];
 const resp=(status,body,headers={})=>async()=>new Response(JSON.stringify(body),{status,headers});
 const run=f=>A.syncOnce({storage:st,fetch:f,endpoint:HOST,key:KEY});
 await assert.rejects(run(resp(200,{v:1,keys:{}})),e=>e.code==='cas');
 await assert.rejects(run(resp(401,{})),e=>e.code==='auth');
 await assert.rejects(run(resp(200,{v:1,keys:{[GRADES]:{value:'{"courses":"x"}',ts:1}}},{'X-Sync-Revision':'"3"'})),e=>e.code==='data');
 await assert.rejects(run(resp(200,{study:{}},{'X-Sync-Revision':'"3"'})),e=>e.code==='data');
 assert.deepEqual([...st.map],before);
});

test('pages load the sync script; it uses progress_api only, never the legacy Worker; sync keys are not backed up',()=>{
 const src=fs.readFileSync(path.join(root,'scripts/study-sync-app.js'),'utf8');
 assert.match(src,/j\.progress_api/);assert.doesNotMatch(src,/progress_api\s*\|\|\s*(j\.api|legacy|original)/);
 assert.match(src,/p!==legacy/,'refuses progress_api equal to the legacy api');
 for(const f of ['index.html','calendar.html','grades.html','hub.html','flashcards.html','practice.html','accounting-textbook.html','acc.html','eco.html','math.html','eng.html','zh.html'])
  assert.match(fs.readFileSync(path.join(root,f),'utf8'),/<script src="scripts\/study-sync-app\.js\?v=\d+"><\/script>/,f);
 const nav=fs.readFileSync(path.join(root,'scripts/study-nav.js'),'utf8');
 assert.match(nav,/StudySyncApp\.open\(\)/);
 const backup=require('../scripts/study-progress-backup.js');
 for(const k of [A.STATE_KEY,A.CONFLICT_KEY])assert.ok(k.startsWith('study-sync-'));
 assert.ok(A.KEYS.every(k=>fs.readFileSync(path.join(root,'scripts/study-progress-backup.js'),'utf8').includes('"'+k+'"')),'synced keys are all backed-up keys');
 assert.ok(backup);
});
