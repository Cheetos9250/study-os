'use strict';
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const T=require('../scripts/study-today.js');
const D=T.parseCourseData(fs.readFileSync(path.join(__dirname,'..','data/courses/eco.js'),'utf8'));
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','scripts/eco-practice-mcq.js'),'utf8'),ctx);const Q=ctx.window.ECO_PRACTICE_MCQ;
const FIVE=['g','i','b','a','d'];
test('five-chapter summary: every chapter has 4+ sections and valid two-column rows',()=>{
  for(const c of FIVE){const s=D.sum.filter(x=>x.cat===c);assert.ok(s.length>=4,c+' '+s.length);}
  assert.ok(D.sum.every(s=>s.h&&s.rows.length&&s.rows.every(r=>r.length===2&&r[0]&&r[1])));
  assert.equal(new Set(D.sum.map(s=>s.cat+'|'+s.h)).size,D.sum.length,'section titles unique per chapter');
});
test('five-chapter summary: key facts from the summary file are present',()=>{
  const t=JSON.stringify(D.sum);
  for(const k of ['Circular flow','Income approach','$18.6 ล้านล้าน','3.34%','159.1M','15.8%','26.5%','2.5%','79.6 พันล้าน','24.7 ชั่วโมง','Housing **33%**','Offshoring','1973–74','1965–66','Luxembourg $103,199','Mozambique $392','Vicious cycle'])assert.ok(t.includes(k),k);
});
test('five-chapter summary: worked numbers are right',()=>{
  const t=JSON.stringify(D.sum);
  assert.equal(100*1+50*2,200);assert.equal(150*2+100*3,600);assert.equal(150*1+100*2,350);assert.equal(200*3+150*4,1200);assert.equal(200*1+150*2,500);
  assert.equal((600/350*100).toFixed(1),'171.4');assert.equal(1200/500*100,240);assert.equal(350/200,1.75);
  assert.equal((335/245*100).toFixed(1),'136.7');assert.equal((126-120)/120*100,5);assert.equal(30000/1.25,24000);
  assert.equal((7.769/159.1*100).toFixed(1),'4.9');
  assert.equal(+(12.8+3.036+3.27-0.5).toFixed(1),18.6);assert.equal(69+16+18-3,100);
  for(const k of ['≈ **171.4**','**136.7**','**24,000**','≈ **4.9%**'])assert.ok(t.includes(k),k);
});
test('five-chapter cards: new ids are unique and cards are well formed',()=>{
  assert.equal(new Set(D.cards.map(c=>c[4])).size,D.cards.length);
  for(const id of ['m1-21','m1-25','m3-23','m3-25','m2-20','m2-23','m4-20','m4-22','m5-16','m5-17'])assert.ok(D.cards.some(c=>c[4]===id),id);
  assert.ok(D.cards.every(c=>c.length===5&&c[1]&&c[2]&&D.cats.some(k=>k[0]===c[0])));
});
test('five-chapter MCQs: 17 new English questions with one correct answer first',()=>{
  const n=Q.filter(q=>/^ep-[gibad]20\d$/.test(q.id));assert.equal(n.length,17);
  for(const q of n){assert.equal(q.opts.length,4,q.id);assert.equal(new Set(q.opts).size,4,q.id);assert.ok(q.exp.length>20,q.id);assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/,q.id);}
  assert.equal(new Set(Q.map(q=>q.id)).size,Q.length);
  const txt=Q.map(q=>q.q.toLowerCase().trim());assert.equal(new Set(txt).size,txt.length);
  assert.equal(Q.find(q=>q.id==='ep-g203').opts[0],'171');assert.equal(Math.round(600/350*100),171);
  assert.equal(Q.find(q=>q.id==='ep-b201').opts[0],'3.3% per year');
});
test('eco.js keeps the one-line "const D = {...};" shape other pages parse',()=>{
  const s=fs.readFileSync(path.join(__dirname,'..','data/courses/eco.js'),'utf8').split('\n');
  assert.equal(s.filter(l=>l.startsWith('const D = ')).length,1);
  assert.ok(s.find(l=>l.startsWith('const D = ')).trim().endsWith('};'));
});
