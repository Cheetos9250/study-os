'use strict';
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const R=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const ctx={window:{}};vm.runInNewContext(R('data/courses/acc-extra.js'),ctx);const X=ctx.window.StudyCourseExtra;
const pe=X.sets.find(s=>s.pre==='pe-');

test('practice exam: 100 questions, 20 per chapter group, 4 distinct options, explanation, right option first',()=>{
  assert.strictEqual(pe.rows.length,100);
  const by={};
  for(const r of pe.rows){by[r[0]]=(by[r[0]]||0)+1;assert.strictEqual(r[2].length,4);assert.strictEqual(new Set(r[2]).size,4);assert.strictEqual(r[3],0);assert.ok(r[4].length>20);}
  assert.deepStrictEqual(by,{c5:20,c6:20,c8:20,c9:20,c10:20});
});

test('practice exam: spot-check the answer key against known results',()=>{
  const q=n=>pe.rows[n-1],right=n=>q(n)[2][0];
  assert.match(right(5),/7,920/);assert.match(right(9),/240,000/);assert.match(right(39),/6\.0/);
  assert.match(right(64),/22,000/);assert.match(right(65),/28,000/);assert.match(right(68),/61,200/);
  assert.match(right(69),/September 8/);assert.match(right(86),/18,000/);assert.match(right(87),/40,000/);assert.match(right(93),/Loss of \$3,000/);
  assert.match(right(58),/Debit to Cash Over and Short for \$5/);
});

test('plant assets (c10) get their own chip via OPT.extraCats, nothing else in the site changes',()=>{
  assert.match(R('acc.html'),/extraCats:\{c10:'10 Plant assets'\}/);
  assert.match(R('scripts/study-course-engine.js'),/Object\.entries\(OPT\.extraCats\|\|\{\}\)/);
});

test('near-duplicate clusters are capped: no more than 3 visible questions share one pattern per chapter',()=>{
  const tok=e=>new Set((e.row[1]+' '+(e.row[5]||'')).toLowerCase().replace(/\d[\d,.]*/g,'#').match(/[a-z#]+/g));
  for(const c of ['c6','c8']){
    const rows=JSON.parse(R('data/acc-questions/'+c+'.json')).filter(e=>!e.hide),T=rows.map(tok),used=new Set();
    for(let i=0;i<rows.length;i++){if(used.has(i))continue;const g=[i];
      for(let j=i+1;j<rows.length;j++){if(used.has(j))continue;const a=T[i],b=T[j];let n=0;a.forEach(x=>b.has(x)&&n++);if(n/(a.size+b.size-n)>=0.75)g.push(j);}
      g.forEach(k=>used.add(k));assert.ok(g.length<=3,c+' '+rows[i].id+' still has '+g.length+' near-copies');}
  }
});
