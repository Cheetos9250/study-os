// Read-only Gemini MCP Worker (workers/gemini-mcp/worker.mjs): auth, MCP handshake, tools, and GET-only upstream calls.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const TOKEN='t'.repeat(40);
const study={ans:{0:0,1:0},ats:{0:Date.UTC(2026,10,22),1:Date.UTC(2026,10,23)}};
function env(calls){
 const prog={acc:{study},eco:{study:{}},math:{study:{}},today:{today:{timetable:[{day:1,start:'09:00',end:'12:00',name:'Accounting'}]}}};
 return {MCP_READ_TOKEN:TOKEN,PROGRESS_SYNC_KEY:'k'.repeat(30),
  PROGRESS:{fetch:async req=>{calls.push({method:req.method,url:req.url,key:req.headers.get('X-Sync-Key')});const s=req.url.split('/').pop();return new Response(JSON.stringify(prog[s]),{status:200});}},
  SITE_FETCH:async u=>{const f=u.replace(/^https:\/\/cheetos9250\.github\.io\/study-os\//,'');return new Response(fs.readFileSync(path.join(root,f),'utf8'),{status:200});}};
}
const post=(w,e,body,p='/mcp/'+TOKEN,h={})=>w.fetch(new Request('https://x.workers.dev'+p,{method:'POST',headers:{'Content-Type':'application/json',...h},body:JSON.stringify(body)}),e);
let W;test.before(async()=>{require('./gemini-bank.cjs')();W=(await import(path.join(root,'workers/gemini-mcp/worker.mjs'))).default;});
test('rejects a wrong or missing token and non-POST methods',async()=>{
 const e=env([]);
 assert.equal((await post(W,e,{jsonrpc:'2.0',id:1,method:'ping'},'/mcp/'+'x'.repeat(40))).status,401);
 assert.equal((await post(W,e,{jsonrpc:'2.0',id:1,method:'ping'},'/mcp')).status,401);
 assert.equal((await post(W,e,{jsonrpc:'2.0',id:1,method:'ping'},'/mcp',{Authorization:'Bearer '+TOKEN})).status,200);
 assert.equal((await W.fetch(new Request('https://x.workers.dev/mcp/'+TOKEN),e)).status,405);
 assert.equal((await post(W,{...e,MCP_READ_TOKEN:'short'},{jsonrpc:'2.0',id:1,method:'ping'},'/mcp/short')).status,503);
});
test('initialize, notifications and tools/list follow MCP',async()=>{
 const e=env([]);
 const init=await (await post(W,e,{jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'t',version:'1'}}})).json();
 assert.equal(init.result.serverInfo.name,'study-os');assert.ok(init.result.capabilities.tools);
 assert.equal((await post(W,e,{jsonrpc:'2.0',method:'notifications/initialized'})).status,202);
 const list=await (await post(W,e,{jsonrpc:'2.0',id:2,method:'tools/list'})).json();
 assert.deepEqual(list.result.tools.map(t=>t.name),['get_questions','get_overview','get_wrong_questions','get_schedule']);
 assert.ok(list.result.tools.every(t=>t.annotations.readOnlyHint));
 const bad=await (await post(W,e,{jsonrpc:'2.0',id:3,method:'nope'})).json();assert.equal(bad.error.code,-32601);
});
test('tools read live progress with GET only and the sync key never leaves the Worker',async()=>{
 const calls=[],e=env(calls);
 const ov=await (await post(W,e,{jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'get_overview',arguments:{wrong_per_course:5}}})).json();
 const text=ov.result.content[0].text;
 assert.match(text,/## Accounting/);assert.match(text,/2 of \d+ practice questions answered, 50% right/);assert.match(text,/## Last practice/);
 assert.doesNotMatch(text,/What I want from you/);assert.ok(!text.includes(e.PROGRESS_SYNC_KEY));
 assert.ok(calls.length>0&&calls.every(c=>c.method==='GET'&&c.key===e.PROGRESS_SYNC_KEY));
 const wq=await (await post(W,e,{jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'get_wrong_questions',arguments:{course:'acc'}}})).json();
 assert.match(wq.result.content[0].text,/wrong questions \(1 of 1\)[\s\S]*Student answered: A · Correct: [B-H]/);
 const sc=await (await post(W,e,{jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'get_schedule',arguments:{date:'2026-11-23'}}})).json();
 assert.match(sc.result.content[0].text,/09:00–12:00 Accounting/);
 const bad=await (await post(W,e,{jsonrpc:'2.0',id:4,method:'tools/call',params:{name:'get_wrong_questions',arguments:{course:'zzz'}}})).json();
 assert.equal(bad.error.code,-32602);
});
test('worker source has no secrets and the deploy workflow is manual',()=>{
 const src=fs.readFileSync(path.join(root,'workers/gemini-mcp/worker.mjs'),'utf8');
 assert.doesNotMatch(src,/method:\s*'(PUT|POST|DELETE)'/);
 const wf=fs.readFileSync(path.join(root,'.github/workflows/deploy-gemini-mcp.yml'),'utf8');
 assert.match(wf,/workflow_dispatch/);assert.match(wf,/== 'DEPLOY'/);assert.doesNotMatch(wf,/\bpush:|pull_request:/);
});
test('GET /summary returns Markdown with a Bearer token only',async()=>{
 const e=env([]),get=h=>W.fetch(new Request('https://x.workers.dev/summary?wrong=3',{headers:h}),e);
 assert.equal((await get({})).status,401);
 const r=await get({Authorization:'Bearer '+TOKEN});assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/markdown/);
 const t=await r.text();assert.match(t,/## Accounting/);assert.match(t,/## Classes on \d{4}-\d{2}-\d{2}/);
 assert.equal((t.match(/## Upcoming exams/g)||[]).length,1);
 assert.equal((await W.fetch(new Request('https://x.workers.dev/summary/'+TOKEN),e)).status,404,'no token in the summary URL');
});
