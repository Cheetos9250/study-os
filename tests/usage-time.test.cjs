/* Owner, 25 Nov 2026: the usage counter also records seconds of real use per page. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const U=require('../scripts/study-usage.js');
const mem=()=>{const m={};return{getItem:k=>m[k]===undefined?null:m[k],setItem:(k,v)=>{m[k]=String(v);}};};
test('addSecs adds to today and summary lists times',()=>{
  const s=mem(),now=new Date(2026,10,25,3,0,0);
  U.record(s,'acc-prac',now);U.addSecs(s,'acc-prac',15,now);U.addSecs(s,'acc-prac',15,now);U.addSecs(s,'index',10,now);
  const x=U.summary(s,14,now);
  assert.deepEqual(x.pages,[['acc-prac',1]]);
  assert.deepEqual(x.times,[['acc-prac',30],['index',10]]); });
test('one add is capped at 60 s and old days are dropped',()=>{
  const s=mem(),now=new Date(2026,10,25);
  U.addSecs(s,'x',5000,now);assert.equal(U.read(s).secs['2026-11-25'].x,60);
  for(let i=0;i<130;i++){const d=new Date(2026,5,1);d.setDate(d.getDate()+i);U.addSecs(s,'x',1,d);}
  assert.ok(Object.keys(U.read(s).secs).length<=120); });
test('format',()=>{assert.equal(U.fmt(45),'45 s');assert.equal(U.fmt(600),'10 min');assert.equal(U.fmt(7500),'2 h 5 min');});
test('feedback page shows time and the script only counts use',()=>{
  const f=fs.readFileSync(path.join(__dirname,'../feedback.html'),'utf8');assert.match(f,/U\.fmt/);
  const u=fs.readFileSync(path.join(__dirname,'../scripts/study-usage.js'),'utf8');assert.match(u,/doc\.hidden/);assert.match(u,/IDLE/); });
