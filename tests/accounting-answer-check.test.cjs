'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../scripts/accounting-answer-check.js');
test('reviewed inventory ownership quantity accepts only equivalent numeric formats',()=>{
 for(const answer of ['1710','1,710','1710.00',' 1,710 units ','1710 unit','1710 หน่วย']){
  const result=api.check('QS-6-1',answer);assert.equal(result.status,'correct',answer);
  assert.match(result.explanation,/1,300 − 20 \+ 350 \+ 80/);assert.match(result.source,/not an official/);
 }
});
test('wrong quantities and ambiguous working never accidentally pass',()=>{
 for(const answer of ['1730','1280','1711'])assert.equal(api.check('QS-6-1',answer).status,'incorrect');
 for(const answer of ['17,10','1,7100','1.710','-1710','$1710','1710 dollars','1710 or 1730','1300-20+350+80=1710','wrong: 1710','1710\n1730','1710.1','Infinity','NaN','9007199254740992','<img src=x>1710'])assert.equal(api.check('QS-6-1',answer).status,'format',answer);
 for(const answer of ['', '  ',null,undefined])assert.equal(api.check('QS-6-1',answer).status,'empty');
});
test('unsupported questions and prototype names fail closed without guessed grades',()=>{
 assert.equal(api.count,12);assert.equal(api.supports('QS-6-1'),true);
 for(const id of ['QS-6-9','P-6-2B','QS-1-1','__proto__','constructor','toString',undefined]){
  assert.equal(api.supports(id),false);assert.equal(api.check(id,'1710').status,'unavailable');
 }
});


test('inventory acquisition cost includes freight insurance and duties, not selling costs',()=>{
 for(const answer of ['15450','$15,450','15,450.00','USD 15450.00','US$15,450.0','15450 USD']){
  const result=api.check('QS-6-2',answer);assert.equal(result.status,'correct',answer);
  assert.match(result.explanation,/\$900 import duties/);assert.match(result.explanation,/period expenses/);
 }
 for(const answer of ['550','14550','15600','15450.01','15449.99','14000'])assert.equal(api.check('QS-6-2',answer).status,'incorrect',answer);
 for(const answer of ['15,45','15.450','15450.001','$15,450 USD','€15450','15450 units','15450 บาท','1e4','-15450','9007199254740992','15450 or 14000'])assert.equal(api.check('QS-6-2',answer).status,'format',answer);
});
test('explicit final line preserves working but does not grade its reasoning',()=>{
 for(const answer of ['Freight: 250\nInsurance: 300\nFinal answer: $15,450.00','คำตอบสุดท้าย: 15450'])assert.equal(api.check('QS-6-2',answer).status,'correct');
 assert.equal(api.check('QS-6-1','1300 - 20 + 350 + 80\nFinal answer: 1710 units').status,'correct');
 for(const answer of ['Final answer: 14000\nFinal answer:15450','Final answer: 15450\nmore working','250 for transportation in\n300 for shipping insurance','14000+250+300+900=15450'])assert.equal(api.check('QS-6-2',answer).status,'format',answer);
});
test('solution reveal and descriptions are explicit and never manufacture grades',()=>{
 assert.deepEqual(api.describe('QS-6-2'),{kind:'money',example:'$15,450.00'});
 assert.equal(api.solution('QS-6-2').status,'solution');assert.match(api.solution('QS-6-2').message,/15,450/);
 assert.equal(api.solution('P-6-2B').status,'unavailable');assert.equal(api.describe('__proto__'),null);
 assert.deepEqual([...api.ids],['QS-6-1','QS-6-2','QS-6-4','QS-6-3','QS-6-18','QS-6-11','QS-6-12','QS-6-19','E-8-12','E-8-14','P-8-4A','P-8-5A']);assert.equal(Object.isFrozen(api.ids),true);
 const fs=require('node:fs'),catalog=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/accounting-textbook-index.json')));
 const where={'QS-6-1':['6',268],'QS-6-2':['6',268],'QS-6-4':['6',269],'QS-6-3':['6',269],'QS-6-18':['6',269],'QS-6-11':['6',269],'QS-6-12':['6',269],'QS-6-19':['6',269],'E-8-12':['8',342],'E-8-14':['8',342],'P-8-4A':['8',344],'P-8-5A':['8',345]};
 for(const id of api.ids){const q=catalog.items.find(q=>q.id===id);assert.ok(q,id);assert.deepEqual([q.chapter,q.pdfPage],where[id],id);}
});

// Independent recomputation of the inventory and bank-reconciliation answers (no hard-coded results).
function perpetual(events,method){
 const inv=[];let cogs=0;
 for(const e of events){
  if(e.buy){inv.push({u:e.buy[0],c:e.buy[1]});continue;}
  let q=e.sell;
  if(method==='wa'){const u=inv.reduce((a,l)=>a+l.u,0),c=inv.reduce((a,l)=>a+l.u*l.c,0),avg=c/u;cogs+=q*avg;inv.length=0;inv.push({u:u-q,c:avg});continue;}
  for(const l of (method==='fifo'?inv:[...inv].reverse())){const t=Math.min(q,l.u);l.u-=t;q-=t;cogs+=t*l.c;if(!q)break;}
 }
 return Math.round(inv.reduce((a,l)=>a+l.u*l.c,0)*100);
}
test('perpetual inventory answers match an independent recomputation',()=>{
 const jan=[{buy:[320,3]},{buy:[80,3.2]},{buy:[100,3.34]},{sell:350}],dec=[{buy:[10,6]},{buy:[20,12]},{sell:15},{buy:[15,14]}];
 const cases=[['QS-6-4',jan,'lifo'],['QS-6-3',jan,'wa'],['QS-6-18',dec,'fifo'],['QS-6-11',dec,'lifo'],['QS-6-12',dec,'wa']];
 for(const [id,ev,m] of cases){const cents=perpetual(ev,m),dollars=(cents/100).toFixed(2);assert.equal(api.check(id,dollars).status,'correct',id+' '+dollars);assert.equal(api.check(id,String(Number(dollars)+1)).status,'incorrect',id);}
 assert.equal(perpetual(jan,'fifo'),49400);// QS 6-4 FIFO answer, not in the catalog
 assert.equal(api.check('QS-6-19',String(510-(8*6+7*12))).status,'correct');
});
test('bank reconciliation answers: bank side and book side agree and match printed check figures',()=>{
 const rec=[['E-8-12',10555+2856-1829,11589-16+9,11582],['E-8-14',25800+6200-5600+400,27500-100-600,26800],['P-8-4A',27233+11514-(1482+382+2281),27497-20+7955-805-25,34602],['P-8-5A',18453+1682-(494+982+388),17404-30-600+1485+12,18271]];
 for(const [id,bank,book,printed] of rec){assert.equal(bank,book,id);assert.equal(bank,printed,id);assert.equal(api.check(id,bank.toLocaleString('en-US')).status,'correct',id);assert.equal(api.check(id,String(bank+1)).status,'incorrect',id);}
});
