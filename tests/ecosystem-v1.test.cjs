// ecosystem/v1 contract: GET /plan and GET /digest on the Gemini MCP Worker, checked against docs/ecosystem/v1.fixture.json.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const TOKEN='t'.repeat(40),NOW=Date.UTC(2026,10,26,0,0,0),DAY=86400000;
const FIX=JSON.parse(read('docs/ecosystem/v1.fixture.json'));
const today={today:{exams:[{id:'x-past',title:'Old quiz',date:'2026-11-01',course:'acc',cats:[]},{id:'x-next',title:'Test final',date:'2026-12-20',course:'eco',cats:[]}],
 timetable:[{id:'a',day:2,start:'13:00',end:'15:00',name:'Afternoon class'},{id:'b',day:1,start:'09:00',end:'12:00',name:'Morning class'},{id:'c',day:3,start:'09:00',end:'10:00',name:'Skipped',skip:true}]}};
const home={home:{tasks:[{id:'t1',title:'Open high',date:'2026-12-01',pri:'High',done:false},{id:'t2',title:'Done one',date:'2026-11-20',pri:'Low',done:true},
 {id:'t3',title:'No date',pri:'Low',link:'javascript:alert(1)'},{id:'gc-9',title:'Classroom',date:'2026-12-03',pri:'Medium',link:'https://classroom.google.com/c/x'}]}};
let V,W;
test.before(async()=>{
 V=await import(path.join(root,'workers/gemini-mcp/ecosystem-v1.mjs'));
 const b=path.join(root,'workers/gemini-mcp/bank.json');
 if(!fs.existsSync(b))fs.writeFileSync(b,JSON.stringify(require('../scripts/build-question-bank.cjs').build()));
 W=(await import(path.join(root,'workers/gemini-mcp/worker.mjs'))).default;
});

test('the shared fixture is valid ecosystem/v1 and holds no personal data',()=>{
 assert.deepEqual(V.validate(FIX.plan),[]);assert.deepEqual(V.validate(FIX.digest),[]);
 assert.ok(!/@|kasidit/i.test(JSON.stringify(FIX)),'fixture is sample data only');
});

test('validate catches a missing version, a bad kind and bad rows',()=>{
 assert.ok(V.validate({...FIX.plan,v:2}).some(e=>e.startsWith('v must')));
 assert.ok(V.validate({...FIX.plan,kind:'x'}).length);
 assert.ok(V.validate({...FIX.plan,tasks:[{id:'a',title:'b',date:'soon',pri:'High',done:false,link:null}]}).length>=2);
 assert.ok(V.validate({...FIX.digest,totals:{}}).includes('totals'));
});

test('planFeed: open tasks only, lowercase priority, safe links, upcoming exams, timetable without skipped classes',()=>{
 const p=V.planFeed(today,home,NOW);
 assert.deepEqual(V.validate(p),[]);
 assert.equal(p.v,1);assert.equal(p.kind,'plan');
 assert.deepEqual(p.tasks.map(t=>[t.id,t.pri]),[['t1','high'],['t3','low'],['gc-9','medium']]);
 assert.equal(p.tasks[1].date,null);assert.equal(p.tasks[1].link,null,'non-https link dropped');
 assert.equal(p.tasks[2].link,'https://classroom.google.com/c/x');
 assert.ok(p.exams.some(e=>e.title==='Test final'&&e.course==='eco'));
 assert.ok(!p.exams.some(e=>e.title==='Old quiz'),'past exams left out');
 assert.ok(p.exams.every((e,i,a)=>!i||a[i-1].date<=e.date),'sorted by date');
 assert.deepEqual(p.classes.map(c=>c.name),['Morning class','Afternoon class']);
 assert.deepEqual(Object.keys(p.classes[0]).sort(),['day','end','name','start']);
 const empty=V.planFeed(null,null,NOW);assert.deepEqual(V.validate(empty),[]);assert.deepEqual(empty.tasks,[]);
});

function env(calls){return {MCP_READ_TOKEN:TOKEN,PROGRESS_SYNC_KEY:'k'.repeat(30),
 PROGRESS:{fetch:async req=>{calls.push(req.method);const s=req.url.split('/').pop();const d={today,home}[s];return d?new Response(JSON.stringify(d),{status:200}):new Response('',{status:404});}},
 SITE_FETCH:async u=>new Response(read(u.replace(/^https:\/\/cheetos9250\.github\.io\/study-os\//,'')),{status:200})};}
const get=(e,p,h,m='GET')=>W.fetch(new Request('https://x.workers.dev'+p,{method:m,headers:h||{}}),e);

test('GET /plan: Bearer only, GET only, reads upstream with GET only, answers valid v1',async()=>{
 const calls=[],e=env(calls),auth={Authorization:'Bearer '+TOKEN};
 assert.equal((await get(e,'/plan')).status,401);
 assert.equal((await get(e,'/plan/'+TOKEN)).status,404);
 assert.equal((await get(e,'/plan',auth,'POST')).status,405);
 const r=await get(e,'/plan',auth);assert.equal(r.status,200);
 const j=await r.json();assert.deepEqual(V.validate(j),[]);
 assert.equal(j.tasks.length,3);
 assert.ok(calls.length&&calls.every(m=>m==='GET'));
 assert.ok(!JSON.stringify(j).includes(e.PROGRESS_SYNC_KEY));
});

test('GET /digest answers valid v1 with version and kind',async()=>{
 const r=await get(env([]),'/digest',{Authorization:'Bearer '+TOKEN});assert.equal(r.status,200);
 const j=await r.json();assert.equal(j.v,1);assert.equal(j.kind,'digest');assert.deepEqual(V.validate(j),[]);
});
