/* 24 Nov 2026 (owner): accounting abbreviations in site search, and no LIFO in JE Drill (outside the exam guide). */
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../scripts/study-search.js'),J=require('../scripts/study-je-drill.js');
const it=(title,href)=>({type:'q',course:'acc',title,sub:'',href,text:title.toLowerCase()});
const idx=[it('Cost of goods sold under FIFO','a'),it('Accounts receivable aging','b'),it('Bar chart of sales','c'),it('ลูกหนี้การค้า','d'),it('Net realizable value write-down','e'),it('Aging of AR balances','f')];
test('abbreviations find the full term, in English or Thai',()=>{
  assert.deepEqual(S.search(idx,'cogs').map(x=>x.href),['a']);
  assert.deepEqual(S.search(idx,'ar').map(x=>x.href).sort(),['b','d','f']);
  assert.deepEqual(S.search(idx,'nrv').map(x=>x.href),['e']);
  assert.deepEqual(S.search(idx,'cogs fifo').map(x=>x.href),['a']);
});
test('a short abbreviation no longer matches inside other words',()=>{
  assert.ok(!S.search(idx,'ar').some(x=>x.href==='c'),'"bar chart" is not AR');
  assert.deepEqual(S.search(idx,'chart').map(x=>x.href),['c'],'normal words still match inside text');
});
test('JE Drill has no LIFO template and old LIFO scores are not listed as weak',()=>{
  assert.ok(!J.TEMPLATES.some(t=>t.id==='lifo'||/lifo/i.test(t.title)));
  const w=J.weak({days:{},tpl:{lifo:[5,0],[J.TEMPLATES[0].id]:[4,1]}},5);
  assert.ok(!w.some(x=>x.id==='lifo'));assert.ok(w.some(x=>x.id===J.TEMPLATES[0].id));
});
