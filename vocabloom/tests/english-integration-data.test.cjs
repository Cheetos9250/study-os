'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('vocabloom/study-integration.js'),decks=JSON.parse(read('vocabloom/study-decks.json')).decks;
const rows=JSON.parse(read('data/cards.json')).rows,quizzes=JSON.parse(read('data/quiz.json')).rows;
function extract(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return src.slice(i,j);}
const cardFns=extract('function uCards(d){','function uSelected(d){');
const quizFns=extract('function uQuizAnswers(d){','// Local-only vocabulary practice');
const practiceFns=extract('function uPracticeMeaning(back){','function uHome(){');
const evalData=new Function('decks','rows','quizzes',`const UACTIVE_LANGUAGE='eng',UNAMES={acc:'Accounting',eco:'Economics',math:'Math for Life',eng:'English Vocab',zh:'Chinese'};const USTATE={rows,quizzes,cat:'all',practiceOffset:0,practiceQuestions:null,practiceAnswers:{}};${cardFns}${quizFns}${practiceFns}return {cards:uCards(decks.find(d=>d.key==='eng')),verified:uQuiz(decks.find(d=>d.key==='eng')),practice:uPracticeQuestions(decks.find(d=>d.key==='eng'))};`);
test('English integrated deck uses real Verified rows and does not fabricate Verified quiz records',()=>{
 const out=evalData(decks,rows,quizzes);
 assert.equal(out.verified.length,0);
 assert.ok(out.cards.length>51);
 assert.equal(out.practice.length,10);
 assert.ok(out.practice.every(q=>q.id.startsWith('practice-')));
 const ids=out.cards.map(c=>c.mid);
 assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual(decks.map(d=>d.key),['acc','eco','math','eng','zh']);
});
test('Source refresh does not modify original deck identity or quiz provenance',()=>{
 const original=JSON.stringify(decks);
 const before=evalData(decks,rows,quizzes);
 const cloned=rows.map(x=>({...x}));
 cloned.push({Status:'Draft',Subject:'English Vocab',Chapter:'ศัพท์ข่าว',Front:'DRAFT_ONLY',Back:'n — ไม่เผยแพร่'});
 const after=evalData(decks,cloned,quizzes);
 assert.deepEqual(before.cards,after.cards);
 assert.deepEqual(before.verified,after.verified);
 assert.equal(JSON.stringify(decks),original);
});
test('Non-English legacy quiz content stays available in the source data',()=>{
 assert.deepEqual(decks.map(d=>d.quiz.length),[42,60,34,0,0]);
 assert.equal(quizzes.length,222);
 assert.ok(quizzes.every(q=>q.Subject!=='English Vocab'));
});
