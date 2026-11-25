/* Drive question inbox (owner, 25 Nov 2026): the Markdown template Gemini writes → rows the course pages add to Practice. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const I=require('../scripts/study-inbox.js');
const SAMPLE=`Subject: Accounting
Chapter: 06 Inventory

---
Question: A company buys 100 units at 5 and 100 units at 7, then sells 150 units.
Under FIFO, what is cost of goods sold?
A) 850
B) 900
C) 950
D) 1,050
Answer: C
Explanation: The first 100 units cost 500 and 50 units cost 350, so 850... FIFO uses oldest costs first.

---
**Question:** Which account is a contra asset?
- A) Sales
- B) Allowance for doubtful accounts
- C) Rent expense
- D) Unearned revenue
**Answer:** B
**Explanation:** It reduces receivables.

---
Chapter: 09 Receivables
Question 3: Bad one with no answer
A) x
B) y
`;
test('parses the template into data/quiz.json-style rows',()=>{
  const r=I.parse(SAMPLE);assert.equal(r.rows.length,2);
  const a=r.rows[0];assert.equal(a.Subject,'Accounting');assert.equal(a.Chapter,'06 Inventory');
  assert.equal(a.Correct,'950');assert.deepEqual([a['Wrong 1'],a['Wrong 2'],a['Wrong 3']],['850','900','1,050']);
  assert.match(a.Question,/Under FIFO, what is cost of goods sold\?$/,'wrapped question lines join');
  assert.equal(a.Status,'Verified');assert.match(a.page_id,/^in[0-9a-z]+$/);
  assert.equal(r.rows[1].Correct,'Allowance for doubtful accounts');assert.equal(r.rows[1].Explanation,'It reduces receivables.');
  assert.equal(r.errors.length,1);assert.match(r.errors[0],/Answer missing/);
});
test('ids are stable and repeats collapse',()=>{
  const a=I.parse(SAMPLE).rows,b=I.parse(SAMPLE+'\n---\n'+SAMPLE.split('---\n')[1]).rows;
  assert.deepEqual(a.map(x=>x.page_id),b.map(x=>x.page_id));assert.equal(b.length,2);
});
test('missing subject or chapter, too few or too many options are reported, not added',()=>{
  const r=I.parse('Question: q1\nA) a\nB) b\nAnswer: A\n---\nSubject: eco\nChapter: Macro · GDP\nQuestion: q2\nA) a\nAnswer: A\nQuestion: q3\nA) a\nB) b\nC) c\nD) d\nE) e\nAnswer: A\nQuestion: q4\nA) a\nB) b\nAnswer: 2');
  assert.equal(r.rows.length,1);assert.equal(r.rows[0].Subject,'Economics');assert.equal(r.rows[0].Correct,'b');assert.equal(r.errors.length,3);
});
test('chapter matching: exact label, name, or chapter number',()=>{
  const acc=[['c5','05 Merchandising'],['c6','06 Inventory']],eco=[['c2','Micro · 002 Economic Way of Thinking'],['g','Macro · GDP'],['m','Macro · Money & Banking']];
  assert.equal(I.matchChapter(acc,'06 Inventory')[0],'c6');assert.equal(I.matchChapter(acc,'Chapter 5')[0],'c5');assert.equal(I.matchChapter(acc,'inventory')[0],'c6');
  assert.equal(I.matchChapter(eco,'GDP')[0],'g');assert.equal(I.matchChapter(eco,'Macro · Money & Banking')[0],'m');assert.equal(I.matchChapter(eco,'2')[0],'c2');
  assert.equal(I.matchChapter(acc,'Cooking'),null);
});
test('forCourse keeps the subject, maps the chapter label and reports unknown chapters',()=>{
  const rows=I.parse(SAMPLE.replace('06 Inventory','Inventory')+'\n---\nSubject: Economics\nChapter: Macro · GDP\nQuestion: q\nA) a\nB) b\nAnswer: A\n').rows;
  const r=I.forCourse(rows,'Accounting',[['c6','06 Inventory']]);assert.equal(r.rows.length,2);assert.equal(r.rows[0].Chapter,'06 Inventory');assert.equal(r.rows[0]._inbox,true);
  const u=I.forCourse(rows,'Accounting',[['c1','01 Business']]);assert.equal(u.rows.length,0);assert.deepEqual(u.unknownChapters,['Inventory']);
});
test('the Apps Script carries an identical copy of the parser',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../scripts/study-inbox.js'),'utf8'),gs=fs.readFileSync(path.join(__dirname,'../workers/inbox/study-os-inbox.gs'),'utf8');
  const a=js.match(/\/\* PARSER-START \*\/\n([\s\S]*?)\n  \/\* PARSER-END \*\//)[1].split('\n').map(l=>l.replace(/^  /,'')).join('\n');
  const b=gs.match(/\/\/ PARSER-COPY-START\n([\s\S]*?)\n\/\/ PARSER-COPY-END/)[1];
  assert.equal(b,a);
});
test('the prompt Gemini gets matches the parser: its own layout, filled in, parses',()=>{
  const p=fs.readFileSync(path.join(__dirname,'../docs/gemini-question-prompt.md'),'utf8');
  assert.match(p,/why the right answer is right only/);
  let lay=p.slice(p.indexOf('Subject: {SUBJECT}'),p.indexOf('Rules:')).replace('{SUBJECT}','Accounting').replace('{CHAPTER}','06 Inventory');
  lay=lay.replace('Question: <the question, one paragraph; put any numbers it needs inside it>','Question: What is FIFO?').replace(/<option>/g,'opt').replace('<one letter, A to D>','B').replace(/<say why[^>]*>/,'Because it uses oldest costs.').replace('Question: ...','Question: Second?\nA) a\nB) b\nAnswer: A');
  const r=I.parse(lay);assert.equal(r.errors.length,0,r.errors.join('|'));assert.equal(r.rows.length,2);assert.equal(r.rows[0].Chapter,'06 Inventory');
});
test('course pages load the parser before the engine and the engine uses Drive inbox rows as questions that skip the sets',()=>{
  const cs=require('./course-source.cjs');
  for(const f of ['acc.html','eco.html','math.html']){const raw=fs.readFileSync(path.join(__dirname,'..',f),'utf8');
    assert.ok(raw.indexOf('study-inbox.js')>0&&raw.indexOf('study-inbox.js')<raw.indexOf('study-course-engine.js'),f);
    const s=cs.read(path.join(__dirname,'..',f),'utf8');assert.match(s,/loadInbox/,f);assert.match(s,/r\._inbox\?\{inbox:true\}/,f);}
});
