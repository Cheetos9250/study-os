// GET /plan on the read-only Gemini MCP Worker: a small feed (tasks, exams, timetable) for Life OS.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const TOKEN='p'.repeat(40);
function env(calls){
 const prog={today:{today:{timetable:[{day:2,start:'13:00',end:'16:00',name:'Economics'}],exams:[{id:'x1',title:'Accounting final',course:'acc',date:'2099-11-26',cats:['c5']},{id:'x0',title:'Old quiz',course:'acc',date:'2000-01-01',cats:[]}]}},
  home:{home:{tasks:[{id:'t1',title:'Group video',date:'2099-11-20',pri:'high',done:false,link:'https://classroom.google.com/c/1'},{id:'t2',title:'Done one',done:true},{id:'t3',title:'Bad link',link:'javascript:alert(1)'},null]}}};
 return {MCP_READ_TOKEN:TOKEN,PROGRESS_SYNC_KEY:'k'.repeat(30),
  PROGRESS:{fetch:async req=>{calls.push(req.method);const s=req.url.split('/').pop();return new Response(JSON.stringify(prog[s]||{}),{status:200});}},
  SITE_FETCH:async u=>new Response(fs.readFileSync(path.join(root,u.replace(/^https:\/\/cheetos9250\.github\.io\/study-os\//,'')),'utf8'),{status:200})};
}
let W;test.before(async()=>{fs.writeFileSync(path.join(root,'workers/gemini-mcp/bank.json'),JSON.stringify(require('../scripts/build-question-bank.cjs').build()));W=(await import(path.join(root,'workers/gemini-mcp/worker.mjs'))).default;});
test('GET /plan needs the Bearer token and returns tasks, upcoming exams and classes',async()=>{
 const calls=[],e=env(calls),get=(h,p='/plan')=>W.fetch(new Request('https://x.workers.dev'+p,{headers:h}),e);
 assert.equal((await get({})).status,401);
 assert.equal((await get({},'/plan/'+TOKEN)).status,404,'no token in the URL');
 const r=await get({Authorization:'Bearer '+TOKEN});assert.equal(r.status,200);
 const d=await r.json();
 assert.deepEqual(d.tasks.map(t=>t.title),['Group video','Done one','Bad link']);
 assert.equal(d.tasks[0].date,'2099-11-20');assert.equal(d.tasks[0].link,'https://classroom.google.com/c/1');assert.equal(d.tasks[1].done,true);
 assert.equal(d.tasks[2].link,null,'only https links');
 assert.deepEqual(d.exams.map(x=>x.title),['Accounting final'],'past exams left out');
 assert.deepEqual(d.classes,[{day:2,start:'13:00',end:'16:00',name:'Economics'}]);
 assert.ok(!JSON.stringify(d).includes('k'.repeat(30)));
 assert.ok(calls.every(m=>m==='GET'));
 assert.equal((await W.fetch(new Request('https://x.workers.dev/plan',{method:'POST',headers:{Authorization:'Bearer '+TOKEN}}),e)).status,405);
});
