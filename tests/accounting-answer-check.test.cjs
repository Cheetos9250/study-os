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
 assert.equal(api.count,1);assert.equal(api.supports('QS-6-1'),true);
 for(const id of ['QS-6-2','P-6-2B','QS-1-1','__proto__','constructor','toString',undefined]){
  assert.equal(api.supports(id),false);assert.equal(api.check(id,'1710').status,'unavailable');
 }
});
