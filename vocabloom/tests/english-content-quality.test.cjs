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
