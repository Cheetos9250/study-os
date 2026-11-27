// Whole-system export for Gemini: question bank (same ids as the course engine), /export tables, get_questions tool.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),B=require('../scripts/build-question-bank.cjs');
const TOKEN='t'.repeat(40);let W,bank;
const study={ans:{0:0,1:0,'err-1':1},ats:{0:1,1:2,'err-1':3}};
const prog={acc:{study},eco:{study:{}},math:{study:{}},
 today:{today:{exams:[],timetable:[{day:2,start:'13:00',end:'15:00',name:'Economics'}],notes:{'acc:c5':{text:'FOB shipping point :: buyer pays freight',updated:'2026-11-23'}}}},
 home:{home:{tasks:[{id:'t1',title:'Read ch 8',date:'2026-11-25',pri:'h',done:false}]},grades:{courses:[{name:'ACC',credits:3,items:[{name:'Mid',weight:30,got:24,max:30}]}]}}};
const env={MCP_READ_TOKEN:TOKEN,PROGRESS_SYNC_KEY:'k'.repeat(30),
 PROGRESS:{fetch:async req=>{if(req.method!=='GET')throw Error('write');return new Response(JSON.stringify(prog[req.url.split('/').pop()]),{status:200});}},
 SITE_FETCH:async u=>new Response(fs.readFileSync(path.join(root,u.replace(/^https:\/\/cheetos9250\.github\.io\/study-os\//,'')),'utf8'))};
test.before(async()=>{bank=B.build();require('./bank-file.cjs').writeBank();W=(await import(path.join(root,'workers/gemini-mcp/worker.mjs'))).default;});
test('bank has every course, engine ids, no hidden extras',()=>{
 const acc=bank.courses.acc;assert.ok(acc.questions.length>500);assert.equal(acc.questions[0].id,'0');
 assert.ok(acc.questions.some(q=>q.id==='err-1'));
 const hide=require('vm').runInNewContext(fs.readFileSync(path.join(root,'data/courses/acc-extra.js'),'utf8')+';window.StudyCourseExtra.hide',{window:{}});
 const ids=new Set(acc.questions.map(q=>q.id));assert.ok(hide.every(h=>!ids.has(String(h))));
 assert.equal(ids.size,acc.questions.length,'ids unique');
 for(const k of ['eco','math'])assert.ok(bank.courses[k].questions.length>50);
 assert.ok(Object.values(bank.courses).every(c=>c.questions.every(q=>q.opts[q.right]!==undefined)));
});
test('GET /export returns all tables with my answers, Bearer only',async()=>{
 assert.equal((await W.fetch(new Request('https://x/export'),env)).status,401);
 const r=await W.fetch(new Request('https://x/export',{headers:{Authorization:'Bearer '+TOKEN}}),env);assert.equal(r.status,200);
 const {sheets}=await r.json();
 assert.deepEqual(Object.keys(sheets),['Summary','Questions','Notes','Tasks','Grades','Exams','Classes']);
 const Q=sheets.Questions;assert.equal(Q.length-1,bank.courses.acc.questions.length+bank.courses.eco.questions.length+bank.courses.math.questions.length);
 const row0=Q.find(x=>x[2]==='0'&&x[0]==='Accounting');assert.equal(row0[12],'A');assert.equal(row0[13],'Right');
 assert.equal(Q.find(x=>x[2]==='1'&&x[0]==='Accounting')[13],'Wrong');
 assert.equal(sheets.Notes[1][0],'acc:c5');assert.equal(sheets.Tasks[1][0],'Read ch 8');assert.equal(sheets.Grades[1][2],'Mid');
 assert.equal(sheets.Classes[1][3],'Economics');assert.ok(sheets.Exams.length>1);
});
test('get_questions pages through the bank with filters',async()=>{
 const call=async a=>(await (await W.fetch(new Request('https://x/mcp/'+TOKEN,{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'get_questions',arguments:a}})}),env)).json()).result.content[0].text;
 const all=await call({course:'acc',limit:2});assert.match(all,/questions 1–2 of \d+/);assert.match(all,/More: call again with offset 2/);
 const wrong=await call({course:'acc',status:'wrong'});assert.match(wrong,/of 2 \(wrong\)/);
 assert.match(await call({course:'math',status:'right'}),/no questions match/);
});
