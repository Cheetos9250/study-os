const __cs=require('./course-source.cjs');
"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const F=require('../scripts/fs-grid.js'),root=path.join(__dirname,'..');
const SOL="| Opal Boutique — Income Statement |  |\n|---|---|\n| Revenues: Sales | 248,000 |\n| Interest revenue | 1,450 |\n| **Total revenues** | **249,450** |\n| Expenses: Cost of goods sold | 139,000 |\n| Salaries | 46,500 |\n| Rent | 18,000 |\n| Credit card | 3,720 |\n| Bad debts | 2,980 |\n| Factoring fee | 720 |\n| **Total expenses** | **210,920** |\n| **Net income** | **38,530** |";
test('parses statement tables (2 or 3 columns), not journal or comparison tables',()=>{
 const a=F.parse(SOL);assert.equal(a.title,'Opal Boutique — Income Statement');assert.equal(a.rows.length,11);
 assert.deepEqual(a.rows.filter(r=>r.total).map(r=>r.label),['Total revenues','Total expenses','Net income']);
 assert.equal(F.parse('| Date | Account | Debit | Credit |\n|---|---|---|---|\n| Day | Cash | 1 |  |').rows.length,0);
 assert.equal(F.parse('| | FIFO | LIFO |\n|---|---|---|\n| COGS | 1 | 2 |').rows.length,0);
 const three=F.parse('| X — Income Statement |  |  |\n|---|---|---|\n| Less: Sales discounts | 3,000 | 9,000 |\n| Interest expense | (3,900) |  |');
 assert.deepEqual(three.rows.map(r=>r.amts),[[3000,9000],[3900]]);
});
test('checks totals by name and amount, other amounts anywhere; explains mistakes',()=>{
 const a=F.parse(SOL);
 const right=[['Sales','248000',''],['Interest revenue','1,450',''],['Total revenues','','249,450'],['Cost of goods sold','139000',''],['Salaries expense','46500',''],['Rent expense','18000',''],['Credit card expense','3720',''],['Bad debts expense','2980',''],['Factoring fee expense','720',''],['Total expenses','','210920'],['Net income','','38,530']];
 const r=F.check(right,a);assert.equal(r.all,true);assert.equal(r.totalsOk,3);assert.equal(r.linesOk,8);
 const wrong=right.slice(0,10).concat([['Net income','','38,350']]);wrong[9]=['Net income','','210920'];
 const w=F.check(wrong,a);assert.equal(w.all,false);
 assert.equal(w.rows[10].why,'Check the amount');assert.match(w.rows[9].why,/Total expenses/);
 assert.deepEqual(w.totalsMissing,['Total expenses','Net income']);
});
test('every statement solution checks as correct against itself',()=>{
 let n=0;
 for(const ch of [5,6,7,8,9])for(const it of JSON.parse(__cs.read(path.join(root,'data/textbook-sos/ch'+ch+'.json'),'utf8'))){
  const a=F.parse(it.solution);if(!a.rows.length)continue;n++;
  const rows=a.rows.map(r=>[r.label,r.amts.length>1?String(r.amts[0]):(r.total?'':String(r.amts[0])),r.amts.length>1?String(r.amts[1]):(r.total?String(r.amts[0]):'')]);
  assert.ok(F.check(rows,a).all,it.id);
 }
 assert.ok(n>=15,'statement questions: '+n);
});
test('acc.html shows the statement table and stores rows as fs in the textbook record (validated on restore)',()=>{
 const s=__cs.read(path.join(root,'acc.html'),'utf8');
 assert.match(s,/<script src="scripts\/fs-grid\.js\?v=\d+"><\/script>/);
 assert.match(s,/fs:window\.StudyFS\?StudyFS\.parse\(it\.solution\|\|''\)/);assert.match(s,/rec\.fs=rows/);
 const R=require('../scripts/study-progress-restore.js');
 const snap=v=>JSON.stringify({format:'study-os-progress-local-backup',version:1,origin:'https://x.test',createdAt:new Date().toISOString(),entries:{'studyos.accounting.textbook.progress.v1':JSON.stringify(v)}});
 const mem=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
 R.plan(mem(),snap({'QS-9-26':{fs:[['Sales','248000','']]}}),'https://x.test');
 assert.throws(()=>R.plan(mem(),snap({'QS-9-26':{fs:[['a','b','c','d']]}}),'https://x.test'));
});
test('balance sheet: net receivables may be typed as its parts; title says Balance sheet',()=>{
 const sol="| Current assets |  |\n|---|---|\n| Cash | 11,600 |\n| Accounts receivable 58,400 − allowance 3,150 | 55,250 |\n| Prepaid rent | 1,500 |\n| **Total current assets** | **68,350** |";
 const a=F.parse(sol);
 assert.ok(F.check([['Cash','11600',''],['Accounts receivable','58400',''],['Less allowance','(3,150)',''],['Prepaid rent','1500',''],['Total current assets','','68350']],a).all);
 assert.ok(F.check([['Cash','11600',''],['Accounts receivable, net','55250',''],['Prepaid rent','1500',''],['Total current assets','','68350']],a).all);
 assert.equal(F.check([['Cash','11600',''],['Total current assets','','68,000']],a).all,false);
 assert.match(__cs.read(path.join(root,'scripts/fs-grid.js'),'utf8'),/'Balance sheet · '\+x/);
});
test('"All correct" for the number checks stays hidden until the numbers are checked',()=>{
 assert.match(__cs.read(path.join(root,'acc.html'),'utf8'),/\.tb-row\[hidden\]\{display:none\}/);
});
