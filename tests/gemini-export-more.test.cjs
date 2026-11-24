// Gemini export, part 2: flashcards, WordNest words, review boxes, textbook / PDF sets / Excel tabs in GET /export.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),B=require('../scripts/build-question-bank.cjs');
const TOKEN='t'.repeat(40);let W,bank;
const DAY=864e5,T0=Date.UTC(2026,10,24,3);
const prog={
 acc:{study:{ans:{0:0,1:0},ats:{0:T0,1:T0},rv:{0:[2,T0+7*DAY],1:[0,T0+DAY]}},srs:{s:{},m:{day:0,newDone:0}}},
 eco:{study:{}},math:{study:{}},zh:{study:{},srs:{s:{}}},
 eng:{study:{},srs:{s:{
  'vb/v1/word/base-1':{kind:'word',value:{seen:true,correct:3,wrong:1,streak:3,mastered:true,due:'2026-12-01',last:'2026-11-24'},ts:T0},
  'vb/v1/custom/c1':{kind:'custom',value:{id:'c1',en:'ledger',th:'บัญชีแยกประเภท'},ts:T0},
  'vb/v1/word/c1':{kind:'word',value:{seen:true,correct:0,wrong:2},ts:T0},
  'vb/v1/day/devA/2026-11-24':{kind:'day',value:{answered:5,correct:4},ts:T0},
  'vb/v1/day/devB/2026-11-24':{kind:'day',value:{answered:2,correct:1},ts:T0}}}},
 today:{today:{exams:[],timetable:[]}},home:{home:{tasks:[]},grades:{courses:[]}},
 extra:{excel:{done:{s1:true},ans:{x1:2}},
  pdfsets:{sets:{pmid:{name:'Midterm set',n:3,ans:{1:'a',2:'c'},key:{1:'a',2:'b'},notes:{4:'FIFO working'}}}},
  textbook:{'QS-1-1':{status:'done',notes:'equation',je:[['Jan 1','Cash','100',''],['','Capital','','100']],updated:'2026-11-23'}}}};
const env={MCP_READ_TOKEN:TOKEN,PROGRESS_SYNC_KEY:'k'.repeat(30),
 PROGRESS:{fetch:async req=>{if(req.method!=='GET')throw Error('write');const v=prog[req.url.split('/').pop()];return v?new Response(JSON.stringify(v),{status:200}):new Response('{}',{status:404});}},
 SITE_FETCH:async u=>new Response(fs.readFileSync(path.join(root,u.replace(/^https:\/\/cheetos9250\.github\.io\/study-os\//,'')),'utf8'))};
test.before(async()=>{bank=require('./gemini-bank.cjs')();W=(await import(path.join(root,'workers/gemini-mcp/worker.mjs'))).default;});
const sheets=async()=>{const r=await W.fetch(new Request('https://x/export',{headers:{Authorization:'Bearer '+TOKEN}}),env);assert.equal(r.status,200);return (await r.json()).sheets;};
test('bank carries every flashcard (mid ids) and the WordNest base words',()=>{
 for(const k of ['acc','eco','math','eng','zh']){const c=bank.cards[k];assert.ok(c.cards.length>20,k);assert.equal(new Set(c.cards.map(x=>x.id)).size,c.cards.length,k+' ids unique');}
 assert.equal(bank.words[0].id,'base-1');assert.equal(bank.words[0].en,'apple');assert.ok(bank.words.length>=50);
});
test('export has the new tabs after the old ones',async()=>{
 const S=await sheets();
 assert.deepEqual(Object.keys(S),['Summary','Questions','Notes','Tasks','Grades','Exams','Classes','Flashcards','Words','Word days','Textbook','PDF sets','Excel']);
});
test('Questions show review box, next review and old questions',async()=>{
 const Q=(await sheets()).Questions,h=Q[0];
 assert.deepEqual(h.slice(15),['Review box','Next review (Bangkok)','Old question']);
 const r0=Q.find(x=>x[0]==='Accounting'&&x[2]==='0'),r1=Q.find(x=>x[0]==='Accounting'&&x[2]==='1');
 assert.equal(r0[15],'2');assert.equal(r0[17],'yes');assert.equal(r0[16],'2026-12-01 10:00');
 assert.equal(r1[15],'0');assert.equal(r1[17],'');
});
test('Flashcards list every card with its schedule',async()=>{
 const card=bank.cards.acc.cards[0];prog.acc.srs.s[card.id]={st:'rev',ivl:6,due:T0+6*DAY,lapses:1,last:3,ts:T0};
 const F=(await sheets()).Flashcards;
 assert.equal(F.length-1,Object.values(bank.cards).reduce((n,c)=>n+c.cards.length,0));
 const r=F.find(x=>x[0]==='Accounting'&&x[2]===card.id);assert.deepEqual(r.slice(5),['Review','6','2026-11-30 10:00','1','Good','2026-11-24 10:00']);
 assert.equal(F.find(x=>x[0]==='Chinese')[5],'New');
});
test('Words join WordNest progress, my words and daily answers across devices',async()=>{
 const S=await sheets(),W2=S.Words;
 const apple=W2.find(x=>x[0]==='apple');assert.deepEqual([apple[5],apple[6],apple[7],apple[8],apple[10],apple[11]],['WordNest','yes','3','1','yes','2026-12-01']);
 const mine=W2.find(x=>x[0]==='ledger');assert.equal(mine[5],'My words');assert.equal(mine[8],'2');
 assert.deepEqual(S['Word days'][1],['2026-11-24',7,5]);
});
test('Textbook, PDF sets and Excel tabs',async()=>{
 const S=await sheets();
 const t=S.Textbook[1];assert.equal(t[0],'QS-1-1');assert.equal(t[3],'Understanding accounting C!');assert.equal(t[4],'done');
 assert.equal(t[6],'Jan 1 | Cash | 100 | \n | Capital |  | 100');
 assert.deepEqual(S['PDF sets'].slice(1).map(r=>[r[2],r[3],r[4],r[5],r[6]]),[['Q1','A','A','Right',''],['Q2','C','B','Wrong',''],['Page 4','','','','FIFO working']]);
 assert.deepEqual(S.Excel.slice(1),[['Step done','s1','true'],['Quiz answer','x1','2']]);
});
test('missing extra / eng subjects give header-only tabs, no error',async()=>{
 const save={extra:prog.extra,eng:prog.eng};delete prog.extra;delete prog.eng;
 try{const S=await sheets();assert.equal(S.Textbook.length,1);assert.equal(S['PDF sets'].length,1);assert.equal(S['Word days'].length,1);assert.ok(S.Words.length>50);}
 finally{Object.assign(prog,save);}
});
