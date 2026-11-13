'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const bank = JSON.parse(read('data/accounting-textbook-solutions.json'));
const index = JSON.parse(read('data/accounting-textbook-index.json'));
const geometry = JSON.parse(read('data/accounting-textbook-geometry.json'));

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
  for(const p of record.pages)assert.ok(Number.isInteger(p) && ((p>=51&&p<=410) || (id==='QS-2-3'&&[1134,1135].includes(p))),'unexpected supporting PDF page for '+id+': '+p);
 }
});

test('no answers are invented for incomplete catalog coverage',()=>{
 assert.equal(Object.hasOwn(bank.answers,'QS-1-10'),false);
 assert.equal(Object.hasOwn(bank.answers,'E-1-10'),false);
 assert.equal(Object.hasOwn(bank.answers,'QS-6-2'),false);
 assert.equal(Object.hasOwn(bank.answers,'QS-6-1'),true);
 assert.equal(bank.meta.reviewedCount,79);
 assert.equal(bank.meta.sourceReviewedNewCount,50);
 for(const id of ['E-1-11','E-1-13','E-1-15','E-1-16','E-1-18','P-1-1A','P-1-2A','P-1-3A','P-1-4A','P-1-5A','P-1-6A','P-1-7A','P-1-8A','P-1-9A','P-1-11A','P-1-12A','P-1-1B','P-1-2B','P-1-3B','P-1-4B','P-1-5B','P-1-6B','P-1-7B','P-1-8B','P-1-9B','P-1-11B','P-1-12B','P-1-13B','P-1-14B','QS-2-5','QS-2-6','QS-2-7','QS-2-8','QS-2-9','E-2-5','E-2-6']){
  assert.equal(bank.answers[id]?.verification,'source-reviewed-2026-11-13',id+' must be source checked');
 }
 assert.equal(bank.answers['P-1-2A']?.pages.includes(60),true);
 assert.equal(bank.answers['P-1-7A']?.pages.includes(61),true);
 assert.equal(bank.answers['P-1-9A']?.pages.includes(62),true);
 assert.ok(bank.answers['E-2-6'].answer.includes('$89,390'));
 assert.ok(bank.answers['P-1-9B'].answer.includes('$104,545'));
 assert.ok(bank.answers['E-2-6'].answer.includes('$19,250'));
 assert.deepEqual(bank.answers['QS-2-3'].pages,[94,1134,1135]);

});

test('solution reveal is independent from auto-checking and student progress',()=>{
 for(const needle of ['showSolution','solutionContent','solutionAnswer','solutionExplanation','solutionSource','solutionScope','loadSolutions();options();','resetAnswerCheck();resetSolution();'])assert.ok(html.includes(needle),'missing '+needle);
 assert.match(html,/solutionContent" hidden/);
 assert.match(html,/solution-answer/);
 assert.match(html,/textContent=item\.answer/);
 assert.match(html,/textContent=item\.explanation/);
 assert.match(html,/solutionsLoadError/);
 assert.match(html,/No worked solution yet/);
 assert.match(html,/PDF-checked worked solution available/);
 assert.match(html,/Draft worked solution available/);
 assert.match(html,/source verification incomplete/);
 assert.match(html,/StudyAccountingCheck/);
 assert.match(html,/studyos\.accounting\.textbook\.progress\.v1/);
 assert.doesNotMatch(html,/localStorage\.clear\(/);
});

test('new source-reviewed chapter 2 worked solutions and repaired source geometry',()=>{
 const newlyReviewed=['QS-2-1','QS-2-2','QS-2-3','QS-2-4','E-2-1','E-2-2','E-2-3','E-2-4','E-2-7','E-2-8','E-2-9','P-2-1A','P-2-7A','P-2-1B'];
 for(const id of newlyReviewed){
  assert.equal(bank.answers[id]?.verification,'source-reviewed-2026-11-14',id+' must be checked from original PDF');
 }
 const expected=[
  ['QS-2-1','Identifying source documents',94,153.3],
  ['QS-2-2','Identifying financial statement accounts',94,196.9],
  ['QS-2-3','Reading a chart of accounts',94,257.5],
  ['QS-2-4','Identifying normal balance',94,350.9],
  ['E-2-1','Steps in analyzing and recording transactions',96,180.4],
  ['E-2-2','Identifying and classifying accounts',96,228.6],
  ['E-2-3','Identifying a ledger and chart of accounts',96,338.5],
  ['E-2-4','Identifying type and normal balances of accounts',96,448.5]
 ];
 for(const [id,title,page,top] of expected){
  assert.equal(idMap.get(id)?.title,title,id+' wrong display title');
  assert.equal(geometry.items[id]?.page,page,id+' wrong PDF page');
  assert.equal(geometry.items[id]?.top,top,id+' wrong source crop');
  assert.equal(geometry.items[id]?.matchedTitle,title,id+' crop/title mismatch');
 }
 assert.equal(bank.answers['E-2-8'].answer.includes('$43,331'),true);
 assert.equal(bank.answers['E-2-9'].answer.includes('$94,850'),true);
 assert.equal(bank.answers['P-2-1A'].answer.includes('$119,490'),true);
 assert.equal(bank.answers['P-2-7A'].answer.includes('$20,500'),true);
 assert.equal(bank.answers['P-2-1B'].answer.includes('$74,330'),true);
});
