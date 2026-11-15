const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {evaluate,fmt}=require('../scripts/study-calc.js');
test('practice calculator does arithmetic without eval',()=>{
 assert.equal(evaluate('1+2*3'),7);
 assert.equal(evaluate('(1+2)*3'),9);
 assert.equal(evaluate('10/4'),2.5);
 assert.equal(evaluate('2^3^2'),512);
 assert.equal(evaluate('-5+2'),-3);
 assert.equal(evaluate('3*-2'),-6);
 assert.equal(evaluate('200*15%'),30);
 assert.equal(evaluate('50000-12%*50000'),44000);
 assert.equal(evaluate('0.1+0.2'),0.3);
 assert.equal(evaluate('1,250,000/4'),312500);
 assert.equal(evaluate('12÷4×3−1'),8);
 for(const bad of ['1/0','(1+2','1+','2**3','alert(1)','1..2'])assert.throws(()=>evaluate(bad),bad);
 assert.equal(fmt(1234567.5),'1,234,567.5');
 const src=fs.readFileSync(path.join(__dirname,'..','scripts/study-calc.js'),'utf8');
 assert.doesNotMatch(src,/\beval\(|new Function|localStorage|sessionStorage|fetch\(/);
});
test('calculator is on the quiz pages and the textbook exercises',()=>{
 for(const f of ['acc.html','eco.html','math.html','accounting-textbook.html'])
  assert.match(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),/scripts\/study-calc\.js\?v=1/,f);
});
