'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),rows=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).rows;
const source=fs.readFileSync(path.join(root,'vocabloom/study-integration.js'),'utf8');
const i=source.indexOf('function uPracticeMeaning(back){'),j=source.indexOf('function uPracticeQuestions(d){',i);
assert.ok(i>=0&&j>i);
const meaning=new Function(source.slice(i,j)+';return uPracticeMeaning')();
const verified=rows.filter(r=>r.Subject==='English Vocab'&&r.Status==='Verified');
test('Committed English Verified vocabulary has distinct headwords and nonempty Thai meanings',()=>{
 assert.ok(verified.length>100);
 const words=new Set();
 for(const r of verified){
  assert.ok(typeof r.Front==='string'&&r.Front.trim(), 'Missing English headword');
  const word=r.Front.trim().normalize('NFKC').toLocaleLowerCase();
  assert.ok(!words.has(word),'Duplicate Verified English headword: '+word);words.add(word);
  const thai=meaning(r.Back);
  assert.ok(thai&&thai.length<=160,'Unusable meaning for '+word);
  assert.match(thai,/[\u0E00-\u0E7F]/,'Thai meaning missing for '+word);
 }
});
test('Both pipe-separated legacy and multiline news vocabulary remain represented',()=>{
 const legacy=verified.filter(r=>r.Back.includes('|'));
 const news=verified.filter(r=>!r.Back.includes('|'));
 assert.ok(legacy.length>0&&news.length>0);
 for(const r of news){assert.match(r.Back,/^Example:\s+\S/m,'Missing example for '+r.Front);assert.match(r.Back,/^แปล:\s+\S/m,'Missing translated example for '+r.Front);}
});
test('English vocabulary coverage is not confused with verified English quiz availability',()=>{
 const quiz=JSON.parse(fs.readFileSync(path.join(root,'data/quiz.json'),'utf8')).rows;
 assert.equal(quiz.filter(r=>r.Subject==='English Vocab'&&r.Status==='Verified').length,0);
});

test('Generated English practice answers and distractors retain Verified source meaning provenance',()=>{
 const start=source.indexOf('function uPracticeMeaning(back){'),end=source.indexOf('function uHome(){',start);
 assert.ok(start>=0&&end>start);
 const funcs=source.slice(start,end);
 const deck=JSON.parse(fs.readFileSync(path.join(root,'vocabloom/study-decks.json'),'utf8')).decks.find(d=>d.key==='eng');
 const cards=verified.map(r=>({cat:r.Chapter||'all',f:r.Front,b:r.Back,mid:r.page_id,ref:r.page_id}));
 const canonical=new Set(verified.map(r=>meaning(r.Back)).filter(Boolean));
 const make=new Function('cards','offset',`const UACTIVE_LANGUAGE='eng',USTATE={cat:'all',practiceOffset:offset,practiceQuestions:null};const uCards=()=>cards;${funcs}return uPracticeQuestions({key:'eng'});`);
 let count=0;
 for(let offset=0;offset<Math.min(cards.length,650);offset+=10){
  const questions=make(cards,offset);
  assert.ok(questions.length>0,'No questions at offset '+offset);
  for(const q of questions){
   assert.equal(q.opts.length,4);
   assert.equal(new Set(q.opts).size,4);
   for(const option of q.opts){
    assert.ok(canonical.has(option),'Option not grounded in a Verified meaning: '+option);
    assert.match(option,/[\\u0E00-\\u0E7F]/,'Option lacks Thai meaning');
   }
   const row=verified.find(r=>r.Front===q.q);
   assert.ok(row,'Question headword not found in Verified source: '+q.q);
   assert.equal(q.opts[q.right],meaning(row.Back),'Answer changed from Verified meaning: '+q.q);
   count++;
  }
 }
 assert.ok(count>=100,'Expected broad rotated-question coverage');
});
