"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const B=require('../scripts/study-progress-backup.js'),X=require('../scripts/study-progress-restore.js'),C=require('../scripts/study-cloud.js');
const ORIGIN='https://example.test';
const mem=(init)=>{const m=new Map(Object.entries(init||{}));return{m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{m.set(k,String(v));},removeItem:k=>{m.delete(k);}};};
const J=JSON.stringify;
const quiz=(ans,ats,extra)=>J(Object.assign({known:[],ans,ats,rst:0,rv:{},fsrs:{}},extra||{}));
const snap=(entries)=>B.createSnapshot(mem(entries),ORIGIN,new Date('2026-11-27T00:00:00Z'));
const text=(entries)=>typeof snap(entries)==='string'?snap(entries):J(snap(entries));
test('merge rules equal cloud sync mergeCourse (newer answer wins, union of the rest)',()=>{
  const a={known:['k1'],ans:{q1:1,q2:0},ats:{q1:10,q2:50},rst:0,rv:{q1:[0,1],q2:[2,9]},fsrs:{q1:[1,2,3,4]}},b={known:['k2'],ans:{q1:2,q3:1},ats:{q1:20,q3:5},rst:0,rv:{q1:[1,7]},fsrs:{}};
  const mine=JSON.parse(X.mergeRaw('study-acc',J(a),J(b))),cloud=C.mergeCourse({study:a},{study:b}).study;
  for(const k of ['ans','ats','rv','fsrs','rst'])assert.deepEqual(mine[k],cloud[k],k);
  assert.deepEqual(mine.known.sort(),cloud.known.sort());
  const sa={s:{c1:{ts:5}},m:{day:1,newDone:2}},sb={s:{c1:{ts:9},c2:{ts:1}},m:{day:1,newDone:4}};
  const ms=JSON.parse(X.mergeRaw('acc-flashcards-v1-srs',J(sa),J(sb))),cs=C.mergeCourse({srs:sa},{srs:sb}).srs;
  assert.deepEqual(ms.s,cs.s);assert.deepEqual(ms.m,cs.m);
});
test('restoreMerge combines quiz history, adds missing keys, keeps other fields, leaves other conflicts',()=>{
  const local=mem({'study-acc':quiz({q1:0},{q1:5},{custom:'keep'}),'study-eco':quiz({e1:1},{e1:1}),'studyos.notes.v1':J({'acc:c5':{text:'mine',updated:'1'}})});
  const backup=text({'study-acc':quiz({q1:1,q2:1},{q1:9,q2:3}),'study-eco':quiz({e1:1},{e1:1}),'study-math':quiz({m1:1},{m1:2}),'studyos.notes.v1':J({'acc:c5':{text:'old',updated:'0'}})});
  const mp=X.mergePlan(local,backup,ORIGIN);
  assert.deepEqual(mp.merge,['study-acc']);assert.deepEqual(mp.missing,['study-math']);assert.deepEqual(mp.skipped,['studyos.notes.v1']);
  const o=X.restoreMerge(local,backup,ORIGIN);
  assert.equal(o.merged,1);assert.equal(o.added,1);assert.deepEqual(o.skipped,['studyos.notes.v1']);
  const acc=JSON.parse(local.getItem('study-acc'));
  assert.deepEqual(acc.ans,{q1:1,q2:1});assert.equal(acc.custom,'keep');
  assert.equal(JSON.parse(local.getItem('studyos.notes.v1'))['acc:c5'].text,'mine','non-mergeable data untouched');
  assert.ok(local.getItem('study-math'));
});
test('restoreMerge rolls back every write when one fails, and never deletes answers',()=>{
  const before=quiz({q1:0},{q1:5});
  const store=mem({'study-acc':before});
  const real=store.setItem;let n=0;store.setItem=(k,v)=>{n++;if(n===2)throw new Error('quota');real(k,v);};
  const backup=text({'study-acc':quiz({q2:1},{q2:3}),'study-math':quiz({m1:1},{m1:2})});
  assert.throws(()=>X.restoreMerge(store,backup,ORIGIN),/put back/);
  store.setItem=real;
  assert.equal(store.getItem('study-acc'),before);assert.equal(store.getItem('study-math'),null);
});
test('a backup answer older than a reset (rst) is dropped, a local one is never lost otherwise',()=>{
  const m=JSON.parse(X.mergeRaw('study-acc',quiz({a:1},{a:100}),quiz({b:1,c:1},{b:50,c:200},{rst:0})));
  assert.deepEqual(Object.keys(m.ans).sort(),['a','b','c']);
});
test('restore page has the merge step and keeps the old blocked message',()=>{
  const h=fs.readFileSync(__dirname+'/../progress-restore.html','utf8');
  assert.match(h,/id="merge"/);assert.match(h,/core\.restoreMerge/);assert.match(h,/Blocked: /);
});
