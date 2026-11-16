"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../scripts/study-cloud.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('course merge keeps the newest answer per question, its review schedule, and never drops cards',()=>{
  const a={study:{ans:{q1:1,q2:0},ats:{q1:10,q2:50},rst:0,known:['k1'],rv:{q1:[0,1],q2:[2,9]}},srs:{s:{c1:{ts:5}},m:{day:1,newDone:2}}};
  const b={study:{ans:{q1:2,q3:1},ats:{q1:20,q3:5},rst:0,known:['k2'],rv:{q1:[1,7]}},srs:{s:{c1:{ts:9},c2:{ts:1}},m:{day:1,newDone:4}}};
  const m=C.mergeCourse(a,b);
  assert.deepEqual(m.study.ans,{q1:2,q2:0,q3:1});assert.deepEqual(m.study.rv,{q1:[1,7],q2:[2,9]});
  assert.deepEqual(m.study.known.sort(),['k1','k2']);assert.deepEqual(m.srs.s,{c1:{ts:9},c2:{ts:1}});assert.equal(m.srs.m.newDone,4);
  assert.deepEqual(C.mergeCourse(b,a).study.ans,m.study.ans,'order does not matter');
});
test('a reset (Clear answers) on one device removes older answers everywhere',()=>{
  const m=C.mergeCourse({study:{ans:{},ats:{},rst:100}},{study:{ans:{q1:1,q2:1},ats:{q1:50,q2:150},rst:0}});
  assert.deepEqual(m.study.ans,{q2:1});
});
test('planner merge: edits on either device survive, deletes propagate, first sync unions',()=>{
  const ex=(id,date)=>({id,course:'acc',title:'SYNTHETIC '+id,date,cats:[],confirmed:false});
  const base={exams:[ex('a','2026-11-20'),ex('b','2026-11-21')],timetable:[],done:{},tasks:{d1:{x:true}}};
  const local={exams:[ex('a','2026-11-25'),ex('b','2026-11-21')],timetable:[{id:'t1',day:1}],done:{},tasks:{d1:{x:true},d2:{y:true}}};
  const remote={exams:[ex('a','2026-11-20')],timetable:[],done:{r:1},tasks:{d1:{x:true}}};
  const m=C.mergeToday(base,local,remote);
  assert.deepEqual(m.exams.map(e=>[e.id,e.date]),[['a','2026-11-25']],'local edit kept, remote delete of b applied');
  assert.deepEqual(m.timetable,[{id:'t1',day:1}]);assert.deepEqual(m.done,{r:1});assert.deepEqual(Object.keys(m.tasks).sort(),['d1','d2']);
  const first=C.mergeToday(null,{exams:[ex('a','2026-11-25')],timetable:[],done:{},tasks:{}},{exams:[ex('z','2026-12-01')],timetable:[{id:'t9',day:2}],done:{},tasks:{}});
  assert.deepEqual(first.exams.map(e=>e.id).sort(),['a','z']);assert.deepEqual(first.timetable,[{id:'t9',day:2}]);
  assert.deepEqual(C.mergeToday(null,local,{}).exams,local.exams,'empty server keeps local data');
});
test('core pages load cloud sync, refresh after it applies, and only use progress_api (never the legacy Worker)',()=>{
  const src=read('scripts/study-cloud.js');
  assert.match(src,/api = next && next !== original \? next : ''/);
  assert.match(src,/'If-Match': rev/);assert.doesNotMatch(src,/removeItem\((?!PROGRESS_LSK|AUTOK)/);
  for(const f of ['index.html','calendar.html','practice.html','flashcards.html','hub.html']){const s=read(f);
    assert.match(s,/<script src="scripts\/study-today\.js\?v=\d+"><\/script>\n<script src="scripts\/study-cloud\.js\?v=\d+"><\/script>/,f);
    assert.match(s,/addEventListener\('studycloud:applied'/,f);}
  assert.match(read('index.html'),/window\.StudyCloud&&StudyCloud\.dirty\(\)/);assert.match(read('calendar.html'),/window\.StudyCloud&&StudyCloud\.dirty\(\)/);
  const keys=require('../scripts/study-progress-backup.js').keys;
  for(const k of ['study-sync-today-base-v1','study-sync-last-v1'])assert.ok(!keys.includes(k),k+' is a sync cache, not study data');
});
