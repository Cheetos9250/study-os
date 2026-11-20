'use strict';
/* Final 1201101 study-guide import (20 Nov 2026): gd- set, guide filter, guide mock, Plant assets hidden, pattern duplicates hidden. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..'),R=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const topics=require('../scripts/acc-topics.js');
const bank=c=>R('data/acc-questions/'+c+'.json').split('\n').map(l=>l.trim().replace(/,$/,'')).filter(l=>l.startsWith('{')).map(JSON.parse);
const all=['c5','c6','c7','c8','c9','c10'].flatMap(bank);

test('gd- set: 285 questions, each with 4 options, self-contained text, ids contiguous',()=>{
  const gd=all.filter(e=>e.id.startsWith('gd-'));
  assert.equal(gd.length,285);
  gd.forEach(e=>{assert.equal(e.row[2].length,4,e.id);assert.equal(e.row[3],0,e.id);assert.ok(e.row[4].length>10,e.id);assert.doesNotMatch(e.row[1],/\bQuestions? \d+/,e.id);});
  assert.deepEqual(gd.map(e=>+e.id.slice(3)).sort((a,b)=>a-b),gd.map((_,i)=>i+1));
  const set=JSON.parse(R('data/acc-questions/_sets.json')).sets.find(s=>s.pre==='gd-');
  assert.deepEqual([set.from,set.seed,set.count,set.case],[1,1801,285,true]);
});

test('corrected keys of the guide file stay corrected (3.14 purchases, 2.82 net effect)',()=>{
  const gd=all.filter(e=>e.id.startsWith('gd-')),q=re=>gd.find(e=>re.test(e.row[1]));
  const a=q(/Beginning Inventory of \$60,000, Net Purchases of \$342,000/);assert.ok(a);assert.equal(a.row[2][0],'$72,000');
  const b=q(/writes off a \$1,500 uncollectible account using the Allowance Method\. On September 15/);assert.ok(b);assert.match(b.row[2][0],/both unaffected/);
});

test('guide classifier: LIFO, periodic non-average, retail/gross-profit and plant assets are outside the guide',()=>{
  const g=(q,cat='c6')=>topics.guide({cat,q,right:0,opts:['x']});
  assert.equal(g('Under LIFO, which cost is in ending inventory?'),'out');
  assert.equal(g('Under a periodic system using FIFO, what is COGS?'),'out');
  assert.equal(g('Periodic weighted-average cost per unit?'),'in');
  assert.equal(g('Using the retail inventory method, ending inventory at cost?'),'out');
  assert.equal(g('A fire destroyed the inventory; use the gross profit method.'),'out');
  assert.equal(g('Goods in transit, FOB shipping point: include?'),'in');
  assert.equal(g('Bank reconciliation outstanding checks','c8'),'in');
  assert.equal(g('Depreciation of equipment','c10'),'');
  assert.equal(g('Business transactions','c1'),'');
});

test('guide filter chips on the accounting practice page only (engine reads StudyAccTopics.guide)',()=>{
  const e=R('scripts/study-course-engine.js');
  assert.match(e,/data-qguide/);assert.match(e,/\(!qguide\|\|guideOf\(q\)===qguide\)/);
  assert.match(R('scripts/acc-topics.js'),/guide:guideOf/);
  for(const c of ['eco','math','eng','zh']) assert.doesNotMatch(R(c+'.html'),/acc-topics/);
});

test('enough in-guide questions for the guide mock: A 10+10, B 10, C 10, D 10, and no duplicates picked from one case more than twice',()=>{
  const vis=all.filter(e=>!e.hide);
  const n=c=>vis.filter(e=>e.row[0]===c&&topics.guide({cat:c,q:e.row[1],case:e.row[5]||'',opts:e.row[2],right:e.row[3]})==='in').length;
  ['c5','c6','c7','c8','c9'].forEach(c=>assert.ok(n(c)>=40,c+' has '+n(c)));
  const m=R('mock.html');
  assert.match(m,/A:\{label:'A · Inventory & merchandising',cats:\['c5','c6'\],n:20\}/);
  assert.match(m,/B:\{[^}]*n:10\}/);assert.match(m,/C:\{[^}]*n:10\}/);assert.match(m,/D:\{[^}]*n:10\}/);
  assert.match(m,/180\*60000/);assert.match(m,/\(cases\[ck\]\|\|0\)>=2/);
  assert.match(m,/acc-topics\.js\?v=2/);
});

test('Plant assets are hidden; hidden rows keep their ids',()=>{
  assert.ok(bank('c10').every(e=>e.hide===true));
  assert.ok(all.filter(e=>e.hide).length>=45);
});

test('visible questions: no two stand-alone questions are the same pattern with only numbers changed',()=>{
  const tok=s=>new Set(s.toLowerCase().replace(/\$?\d[\d,.]*%?/g,'#').match(/[a-z#]{2,}|#/g)||[]);
  const J=(a,b)=>{let n=0;a.forEach(x=>b.has(x)&&n++);return n/(a.size+b.size-n);};
  const lastQ=t=>{const p=t.trim().replace(/\n/g,' ').split(/(?<=[.?!:])\s+/);return tok(p[p.length-1]);};
  const rows=all.filter(e=>!e.hide&&!e.row[5]&&(e.row[1].match(/\$?\d[\d,.]*%?/g)||[]).length>=2&&e.row[0]!=='c10');
  const T=rows.map(e=>[tok(e.row[1]),lastQ(e.row[1])]);
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++)
    assert.ok(!(J(T[i][0],T[j][0])>=0.9&&J(T[i][1],T[j][1])>=0.75),rows[i].id+' and '+rows[j].id+' are the same pattern');
});
