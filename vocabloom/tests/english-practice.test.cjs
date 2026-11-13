'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),src=fs.readFileSync(path.join(root,'vocabloom/study-integration.js'),'utf8');
const deck=JSON.parse(fs.readFileSync(path.join(root,'vocabloom/study-decks.json'),'utf8')).decks.find(d=>d.key==='eng');
function extract(a,b){let i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return src.slice(i,j);}
const pure=extract('function uPracticeMeaning(back){','function uHome(){');
function run(offset=0,cat='all'){
 return new Function('deck','offset','cat',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:offset,practiceAnswers:{},practiceQuestions:null,quizIndex:0,cat};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));${pure};return {questions:uPracticeQuestions(deck),meaning:uPracticeMeaning};`)(deck,offset,cat);
}
test('Generated practice produces ten answerable English-only questions with unique meanings',()=>{
 const {questions}=run();assert.equal(questions.length,10);
 for(const q of questions){assert.ok(q.id.startsWith('practice-'));assert.equal(q.opts.length,4);assert.equal(new Set(q.opts).size,4);assert.ok(q.right>=0&&q.right<4);assert.ok(q.opts[q.right]);}
 assert.deepEqual(questions,run().questions,'Same source and offset must be deterministic');
 assert.notDeepEqual(questions.map(q=>q.id),run(10).questions.map(q=>q.id));
});
test('Practice meaning extracts both legacy and news vocabulary formats',()=>{
 const {meaning}=run();
 assert.equal(meaning('n | ความหมาย | A sample sentence.'),'ความหมาย');
 assert.equal(meaning('n — การอนุรักษ์'+String.fromCharCode(10)+'Example: Preservation protects buildings.'),'การอนุรักษ์');
 assert.equal(meaning('**ความผิดพลาด**'+String.fromCharCode(10)+'ชนิดคำ: n.'+String.fromCharCode(10)+'ตัวอย่าง: A mistake.'),'ความผิดพลาด');
});
test('Practice is session-only and never uses legacy quiz or SRS write actions',()=>{
 assert.match(src,/practiceAnswers:\{\},practiceOffset:0/);
 assert.match(src,/case 'u-practice-answer'/);
 const action=extract("case 'u-practice-answer':","case 'u-answer':");
 assert.doesNotMatch(action,/localStorage|cCloudSync|uRate|cApplySubject|fetch\(/);
 assert.match(src,/Not a Verified Notion quiz/);
 assert.match(src,/Verified Quizzes/);
 assert.match(src,/case 'u-practice-restart'/);
});

test('Chapter filter limits generated practice to the chosen English category',()=>{
 const all=run().questions;
 const selected=run(0,'e1').questions;
 assert.ok(selected.length>=4);
 assert.ok(selected.every(q=>q.cat==='e1'));
 assert.ok(all.some(q=>q.cat!=='e1')||all.length===10);
 assert.deepEqual(run(0,'not-a-category').questions,[]);
 assert.match(src,/USTATE\.practiceAnswers=\{\};USTATE\.practiceOffset=0;render\(\)/);
});

test('Active practice snapshot stays stable if source cards change mid-session',()=>{
 const evaluate=new Function('deck',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:0,practiceAnswers:{},practiceQuestions:null,quizIndex:0,cat:'all'};let cards=deck.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));const uCards=()=>cards;${pure};const first=uPracticeQuestions(deck);const saved=JSON.stringify(first);cards=cards.slice().reverse().map(c=>({...c,f:'UPDATED '+c.f,b:'changed'}));const stable=uPracticeQuestions(deck);USTATE.practiceQuestions=null;const fresh=uPracticeQuestions(deck);return {saved,stable:JSON.stringify(stable),fresh:JSON.stringify(fresh)};`)(deck);
 assert.equal(evaluate.saved,evaluate.stable,'Question text/options must not change during active session');
 assert.notEqual(evaluate.saved,evaluate.fresh,'New session should reflect updated source data');
 assert.match(src,/case 'u-practice-restart':USTATE\.practiceOffset\+=10;USTATE\.practiceAnswers=\{\};USTATE\.practiceQuestions=null;/);
});
