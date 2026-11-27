// Life OS morning digest feed: GET /digest on the read-only Gemini MCP Worker (counts only, GET only upstream).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const TOKEN='t'.repeat(40),NOW=Date.UTC(2026,10,26,0,0,0);
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const T=require('../scripts/study-today.js');
const D=T.parseCourseData(read('data/courses/acc.js'));
const cats=D.cats.map(c=>c[0]);
// answer 4 questions of the first chapter: 1 right, 3 wrong, all yesterday; one wrong one is due for review
const idx=D.quiz.map((q,i)=>[q[0],i,q[3]]).filter(x=>x[0]===cats[0]).slice(0,4);
const ans={},ats={};idx.forEach(([,i,r],k)=>{ans[i]=k===0?r:(r+1)%2;ats[i]=NOW-DAY();});
function DAY(){return 86400000;}
const study={ans,ats,rv:{[idx[1][1]]:[0,NOW-1],[idx[2][1]]:[0,NOW+5*86400000],[idx[0][1]]:[2,NOW-1]}},srs={s:{},m:{day:0,newDone:0}};
const prog={acc:{study,srs},eco:null,math:{study:{}}};
function env(calls){return {MCP_READ_TOKEN:TOKEN,PROGRESS_SYNC_KEY:'k'.repeat(30),
 PROGRESS:{fetch:async req=>{calls.push({method:req.method,url:req.url});const s=req.url.split('/').pop();return prog[s]?new Response(JSON.stringify(prog[s]),{status:200}):new Response('',{status:404});}},
 SITE_FETCH:async u=>new Response(read(u.replace(/^https:\/\/cheetos9250\.github\.io\/study-os\//,'')),{status:200})};}

test('courseDigest: counts, recent accuracy, weak chapters and due reviews, no question text',async()=>{
 const {courseDigest}=await import(path.join(root,'workers/gemini-mcp/study-digest.mjs'));
 const c=courseDigest({key:'acc',name:'Accounting'},D,{study,srs},NOW);
 assert.equal(c.answered,4);assert.equal(c.correct,1);assert.equal(c.pct,25);
 assert.deepEqual(c.recent,{days:7,answered:4,correct:1,pct:25});
 assert.equal(c.quiz_due,1,'only box 0 and due now; box 2 is an old question, box 0 in the future is not due');
 assert.equal(c.weak.length,1);assert.equal(c.weak[0].pct,25);
 assert.ok(c.cards_due>=0);
 assert.ok(!JSON.stringify(c).includes(D.quiz[idx[0][1]][1]),'no question text');
 const old=courseDigest({key:'acc',name:'Accounting'},D,{study,srs},NOW+30*86400000);
 assert.equal(old.recent.answered,0,'answers older than 7 days are not recent');assert.equal(old.recent.pct,null);
 const empty=courseDigest({key:'math',name:'Math'},D,null,NOW);assert.equal(empty.answered,0);assert.equal(empty.pct,null);assert.deepEqual(empty.weak,[]);
});

let W;test.before(async()=>{
 const b=path.join(root,'workers/gemini-mcp/bank.json');
 if(!fs.existsSync(b))require('./bank-file.cjs').writeBank();
 W=(await import(path.join(root,'workers/gemini-mcp/worker.mjs'))).default;});
const get=(e,p,h,m='GET')=>W.fetch(new Request('https://x.workers.dev'+p,{method:m,headers:h||{}}),e);

test('GET /digest needs the Bearer token (never in the URL), is GET only and reads upstream with GET only',async()=>{
 const calls=[],e=env(calls),auth={Authorization:'Bearer '+TOKEN};
 assert.equal((await get(e,'/digest')).status,401);
 assert.equal((await get(e,'/digest/'+TOKEN)).status,404);
 assert.equal((await get(e,'/digest',{Authorization:'Bearer '+'x'.repeat(40)})).status,401);
 assert.equal((await get(e,'/digest',auth,'POST')).status,405);
 const r=await get(e,'/digest',auth);assert.equal(r.status,200);
 const j=await r.json();
 assert.deepEqual(j.courses.map(c=>c.key),['acc','eco','math']);
 assert.equal(j.courses[0].answered,4);assert.equal(j.totals.quiz_due,j.courses.reduce((n,c)=>n+c.quiz_due,0));
 assert.ok(calls.length>0&&calls.every(c=>c.method==='GET'));
 assert.ok(!JSON.stringify(j).includes(e.PROGRESS_SYNC_KEY));
});
