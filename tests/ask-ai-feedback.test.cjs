const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const rd=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const A=require('../scripts/study-ask-inline.js'),U=require('../scripts/study-usage.js');
const mem=()=>{const m={};return{getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v);},removeItem:k=>{delete m[k];}};};
test('Ask AI prompt: options in shown order, answer only after answering',()=>{
  const q={q:'Current ratio =',opts:['A1','B1','C1','D1'],right:1,exp:'liquidity'};
  const before=A.prompt(q,undefined,'04 Cycle');assert.match(before,/A\) A1\nB\) B1/);assert.doesNotMatch(before,/Correct answer/);assert.match(before,/Solve it in Thai/);
  const after=A.prompt(q,2,'04 Cycle');assert.match(after,/My answer: C\. Correct answer: B\./);assert.doesNotMatch(after,/goes wrong/);assert.match(after,/Do not explain why the other options/);
  assert.doesNotMatch(A.prompt(q,1),/goes wrong/);
});
test('Save to note appends, keeps pictures and other notes, refuses past 20,000 characters',()=>{
  const notes={'acc:c5':{text:'old',updated:'x',imgs:['a'.repeat(32)]},'acc:c6':{text:'keep'}};
  const n=A.appendNote(notes,'acc:c5','Q title','Answer **here**','2026-11-24T00:00:00Z');
  assert.equal(n['acc:c5'].text,'old\n\n### Q title\nAnswer **here**\n');assert.deepEqual(n['acc:c5'].imgs,['a'.repeat(32)]);assert.equal(n['acc:c6'].text,'keep');
  assert.equal(notes['acc:c5'].text,'old','input not mutated');
  assert.equal(A.appendNote({},'acc:c9','t','new','z')['acc:c9'].text,'### t\nnew\n');
  assert.equal(A.appendNote({'k':{text:'x'.repeat(19990)}},'k','t','long answer'),null);
});
test('engine shows Ask AI on multiple-choice questions and the notes panel reloads after a save',()=>{
  const e=rd('scripts/study-course-engine.js');assert.match(e,/StudyAskInline\.mount\(ax,/);assert.match(e,/opts:q\.order\.map/);
  const n=rd('scripts/study-quiz-notes.js');assert.match(n,/studyos:notes-flush/);assert.match(n,/studyos:notes-changed/);
  for(const c of['acc','eco','math'])assert.match(rd(c+'.html'),/study-ask-inline\.js\?v=\d+[\s\S]*study-course-engine/);
});
test('page-open counts: page ids, 120-day cap, summary',()=>{
  assert.equal(U.pageId('/study-os/acc.html','?tab=prac&cat=c5'),'acc-prac');assert.equal(U.pageId('/study-os/','') ,'index');assert.equal(U.pageId('/x/mock.html',''),'mock');
  const s=mem();const d=new Date('2026-11-24T10:00:00');U.record(s,'acc-prac',d);U.record(s,'acc-prac',d);U.record(s,'index',d);
  assert.deepEqual(U.summary(s,14,d).pages,[['acc-prac',2],['index',1]]);
  for(let i=0;i<130;i++){const x=new Date(2026,0,1+i);U.record(s,'index',x);}assert.equal(Object.keys(U.read(s).days).length,120);
});
test('usage counts are not backed up (not study progress, would make every restore look different); nav loads it and links Feedback',()=>{
  const B=require('../scripts/study-progress-backup.js');assert.ok(!B.keys.includes('studyos.usage.v1'));assert.ok(U.SKIP['progress-backup']&&U.SKIP['progress-restore'],'backup/restore pages stay read-only');
  const nav=rd('scripts/study-nav.js');assert.match(nav,/study-usage\.js\?v=1/);assert.match(nav,/feedback\.html\?from=/);
  const f=rd('feedback.html');assert.match(f,/github\.com\/cheetos9250\/study-os\/issues\/new/);assert.doesNotMatch(f,/[฀-๿]/);assert.doesNotMatch(f,/localStorage\.setItem/);
});
