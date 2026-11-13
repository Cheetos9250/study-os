'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),src=fs.readFileSync(path.join(root,'vocabloom/study-integration.js'),'utf8');
const deck=JSON.parse(fs.readFileSync(path.join(root,'vocabloom/study-decks.json'),'utf8')).decks.find(d=>d.key==='eng');
function extract(a,b){let i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return src.slice(i,j);}
const pure=extract('function uPracticeMeaning(back){','function uHome(){');
function run(offset=0){
 return new Function('deck','offset',`const UACTIVE_LANGUAGE='eng',USTATE={practiceOffset:offset,practiceAnswers:{},quizIndex:0};const uCards=d=>d.cards.map(x=>({cat:x[0],f:x[1],b:x[2],mid:x[4]}));${pure};return {questions:uPracticeQuestions(deck),meaning:uPracticeMeaning};`)(deck,offset);
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
 assert.equal(meaning('n — การอนุรักษ์\\nExample: Preservation protects buildings.'),'การอนุรักษ์');
 assert.equal(meaning('**ความผิดพลาด**\\nชนิดคำ: n.\\nตัวอย่าง: A mistake.'),'ความผิดพลาด');
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
