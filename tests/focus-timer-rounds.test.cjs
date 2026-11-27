"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const R=require('../scripts/study-progress-restore.js'),B=require('../scripts/study-progress-backup.js');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const mem=o=>{const m=new Map(Object.entries(o));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const snapWith=tasks=>B.createSnapshot(mem({'studyos.home.v1':JSON.stringify({tasks})}),'https://x.test',new Date('2026-11-27T00:00:00Z'));
const task=extra=>Object.assign({id:'t1',title:'Read ch5',date:'2026-11-30',pri:'High',done:false},extra);
test('restore accepts task rounds / rdone and rejects bad values',()=>{
  const plan=t=>R.plan(mem({}),snapWith([t]),'https://x.test');
  assert.deepEqual(plan(task({rounds:4,rdone:2})).missing,['studyos.home.v1']);
  for(const bad of [{rounds:0},{rounds:21},{rounds:2.5},{rounds:'3'},{rdone:-1},{rdone:100},{rdone:'1'}])
    assert.throws(()=>plan(task(bad)),/rounds/,JSON.stringify(bad));
});
test('Today: rounds field, task picker, round counter and full screen controls are wired',()=>{
  for(const id of ['tRounds','pTask','pFull','pExit','pRound'])assert.match(html,new RegExp('id="'+id+'"'),id);
  assert.match(html,/t\.rounds=rn/);assert.match(html,/bumpTask\(\);/);
  assert.match(html,/wakeLock\.request\('screen'\)/);assert.match(html,/\.pomo\.pfull\{position:fixed;inset:0/);
  assert.match(html,/e\.key==='Escape'&&document\.querySelector\('\.pomo\.pfull'\)/);
});
test('a finished round counts once for the picked task (logPomo guard) and a repeat starts at 0',()=>{
  assert.match(html,/o\.lastEnd=end;localStorage\.setItem\(POMOLOG,JSON\.stringify\(o\)\);window\.StudyCloud&&StudyCloud\.dirty\(\);bumpTask\(\);/);
  assert.match(html,/done:false,rdone:0\}/);
});
