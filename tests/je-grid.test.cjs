const __cs=require('./course-source.cjs');
"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const JE=require('../scripts/je-grid.js');
const root=path.join(__dirname,'..');
const SOL="Fee = 3,600 × 2.5% = 90.\n| Date | Account | Debit | Credit |\n|---|---|---|---|\n| Day | Cash | 3,510 |  |\n| Day | Credit Card Expense | 90 |  |\n|  |  Sales |  | 3,600 |\n| Day | Cost of Sales | 2,050 |  |\n|  |  Merchandise Inventory |  | 2,050 |";
test('parses answer lines from the solution table',()=>{
 const a=JE.parse(SOL);
 assert.equal(a.length,5);
 assert.deepEqual(a[2],{date:'Day',acct:'Sales',dr:0,cr:3600});
 assert.equal(JE.parse('no table here').length,0);
});
test('checks lines in any order, loose account names, and explains mistakes',()=>{
 const a=JE.parse(SOL);
 const right=[['','merchandise inventory','','2,050'],['Day','Cash','3510',''],['','credit card expense','90',''],['','Sales','','3600'],['','COGS','2050','']];
 const r=JE.check(right,a);assert.equal(r.all,true);assert.equal(r.ok,5);assert.equal(r.balanced,true);
 const wrong=[['','Cash','3600',''],['','Sales','3600',''],['','Credit Card Expense','',''],['','Rent Expense','90',''],['','','','']];
 const w=JE.check(wrong,a);
 assert.equal(w.all,false);assert.equal(w.rows[0].why,'Check the amount');assert.equal(w.rows[1].why,'Wrong side (Debit ↔ Credit)');
 assert.equal(w.rows[2].why,'Enter an amount');assert.equal(w.rows[3].why,'Check the account name');assert.equal(w.rows[4],null);
 assert.equal(JE.check([['','Cash','10','10']],a).rows[0].why,'Use either Debit or Credit, not both');
});
test('every textbook solution with a journal table parses and balances',()=>{
 let n=0;
 for(const ch of [5,6,7,8,9])for(const it of JSON.parse(__cs.read(path.join(root,'data/textbook-sos/ch'+ch+'.json'),'utf8'))){
  const a=JE.parse(it.solution);if(!a.length)continue;n++;
  const t=JE.totals(a.map(x=>['',x.acct,String(x.dr||''),String(x.cr||'')]));
  assert.equal(t.dr,t.cr,it.id+' balances');
  assert.ok(JE.check(a.map(x=>['',x.acct,String(x.dr||''),String(x.cr||'')]),a).all,it.id+' own answer checks as correct');
 }
 assert.ok(n>=80,'journal questions found: '+n);
});
test('suggestion list is in chart-of-accounts order (assets, liabilities, equity, revenue, expenses)',()=>{
 const list=JE.accounts(JE.parse(SOL)),names=list.map(a=>a.name),cats=list.map(a=>a.cat);
 assert.ok(names.includes('Credit Card Expense')&&names.includes('Rent Expense'));
 const order=['Asset','Liability','Equity','Revenue','Expense','Other'];
 for(let i=1;i<cats.length;i++)assert.ok(order.indexOf(cats[i-1])<=order.indexOf(cats[i]),cats[i-1]+' before '+cats[i]);
 assert.equal(names[0],'Cash');
 assert.ok(names.indexOf('Accounts Receivable')<names.indexOf('Allowance for Doubtful Accounts'));
 const sub=JE.accounts([{acct:'Accounts Receivable — A. Hale',dr:1,cr:0},{acct:'R. Vale, Capital',dr:0,cr:1}]);
 const pos=n=>sub.findIndex(a=>a.name===n);
 assert.equal(pos('Accounts Receivable — A. Hale'),pos('Accounts Receivable')+1,'subsidiary right after its control account');
 assert.equal(sub[pos('R. Vale, Capital')].cat,'Equity');
});
test('acc.html uses the grid for journal questions and stores rows in the textbook record (validated on restore)',()=>{
 const s=__cs.read(path.join(root,'acc.html'),'utf8');
 assert.match(s,/<script src="scripts\/je-grid\.js\?v=\d+"><\/script>/);
 assert.match(s,/je:window\.StudyJE\?StudyJE\.parse\(it\.solution\|\|''\):\[\]/);
 assert.match(s,/rec\.je=rows/);
 const R=require('../scripts/study-progress-restore.js'),B=require('../scripts/study-progress-backup.js');
 const snap=(v)=>JSON.stringify({format:'study-os-progress-local-backup',version:1,origin:'https://x.test',createdAt:new Date().toISOString(),entries:{'studyos.accounting.textbook.progress.v1':JSON.stringify(v)}});
 assert.ok(B);
 const mem=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
 let ok=true;try{R.plan(mem(),snap({'QS-9-2':{notes:'',je:[['Day','Cash','3510','']]}}),'https://x.test');}catch(e){ok=e.message;}
 assert.equal(ok,true);
 assert.throws(()=>R.plan(mem(),snap({'QS-9-2':{je:[[1,2]]}}),'https://x.test'));
});
