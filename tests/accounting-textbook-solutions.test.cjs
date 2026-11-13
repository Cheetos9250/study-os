'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const bank = JSON.parse(read('data/accounting-textbook-solutions.json'));
const index = JSON.parse(read('data/accounting-textbook-index.json'));
const html = read('accounting-textbook.html');
const items = index.items.filter(x=>!x.sectionOnly && /^[1-9]$/.test(String(x.chapter)));
const idMap = new Map(items.map(x=>[x.id,x]));

test('worked solutions only reference indexed chapters 1–9 questions',()=>{
 const entries = Object.entries(bank.answers);
 assert.equal(entries.length,bank.meta.reviewedCount);
 assert.equal(items.length,403);
 assert.equal(bank.meta.catalogQuestionCount,items.length);
 assert.ok(entries.length>1 && entries.length<items.length);
 for(const [id,record] of entries){
  const q=idMap.get(id);
  assert.ok(q,'not in catalog: '+id);
  assert.ok(record.answer.trim(),'blank answer: '+id);
  assert.ok(record.explanation.trim(),'blank explanation: '+id);
  assert.ok(Array.isArray(record.pages)&&record.pages.length>0);
  assert.ok(record.pages.includes(q.pdfPage),'solution lacks question source page: '+id);
  for(const p of record.pages)assert.ok(Number.isInteger(p)&&p>=51&&p<=410);
 }
});

test('no answers are invented for incomplete catalog coverage',()=>{
 assert.equal(Object.hasOwn(bank.answers,'QS-1-10'),false);
 assert.equal(Object.hasOwn(bank.answers,'E-1-10'),false);
 assert.equal(Object.hasOwn(bank.answers,'QS-6-2'),false);
 assert.equal(Object.hasOwn(bank.answers,'QS-6-1'),true);
 assert.equal(bank.meta.reviewedCount,24);
});

test('solution reveal is independent from auto-checking and student progress',()=>{
 for(const needle of ['showSolution','solutionContent','solutionAnswer','solutionExplanation','solutionSource','solutionScope','loadSolutions();options();','resetAnswerCheck();resetSolution();'])assert.ok(html.includes(needle),'missing '+needle);
 assert.match(html,/solutionContent" hidden/);
 assert.match(html,/solution-answer/);
 assert.match(html,/textContent=item\.answer/);
 assert.match(html,/textContent=item\.explanation/);
 assert.match(html,/solutionsLoadError/);
 assert.match(html,/No source-reviewed solution yet/);
 assert.match(html,/StudyAccountingCheck/);
 assert.match(html,/studyos\.accounting\.textbook\.progress\.v1/);
 assert.doesNotMatch(html,/localStorage\.clear\(/);
});
