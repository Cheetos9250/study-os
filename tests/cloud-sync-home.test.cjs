"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../scripts/study-cloud.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const t=(id,title,done=false)=>({id,title,date:'2026-11-20',pri:'Low',done});
test('home merge: tasks per id, cover/icon and card images per slot, deletes propagate',()=>{
  const base={tasks:[t('a','A'),t('b','B')],cover:'C0',covers:{acc:'X'}};
  const local={tasks:[t('a','A',true),t('b','B'),t('c','C')],cover:'C0',avatar:'IC',covers:{acc:'X',eco:'Y'}};
  const remote={tasks:[t('a','A')],cover:'C1',covers:{}};
  const m=C.mergeHome(base,local,remote);
  assert.deepEqual(m.tasks.map(x=>[x.id,x.done]).sort(),[['a',true],['c',false]],'local tick kept, remote delete of b applied, new c kept');
  assert.equal(m.cover,'C1','remote changed the cover');assert.equal(m.avatar,'IC','new icon here');
  assert.deepEqual(m.covers,{eco:'Y'},'acc image removed there, eco added here');
  const first=C.mergeHome(null,{tasks:[t('a','A')],cover:'L'},{tasks:[t('z','Z')],cover:'R'});
  assert.deepEqual(first.tasks.map(x=>x.id).sort(),['a','z']);assert.equal(first.cover,'L','first sync: this device wins a clash');
});
test('grades merge per course id',()=>{
  const g=(id,n)=>({id,name:n,credits:3,items:[],scale:[[80,'A']]});
  const m=C.mergeGrades({courses:[g('1','Acc')]},{courses:[g('1','Acc'),g('2','Eco')]},{courses:[g('1','Accounting')]});
  assert.deepEqual(m.courses.map(c=>c.name).sort(),['Accounting','Eco']);
});
test('home subject wiring: last in the list, 404 skipped, size guard, pages refresh and push',()=>{
  const s=read('scripts/study-cloud.js');
  assert.match(s,/list\.push\(\{ id: 'home' \}\)/);assert.match(s,/r\.status === 404 && \(?s\.id === 'home'( \|\| s\.id === 'extra'\))?\) return false/);
  assert.match(s,/> MAXH\) throw Error/);assert.match(s,/ls\.get\(HOMEK\) !== hraw \|\| ls\.get\(GRADESK\) !== graw\) return 'retry'/);
  assert.match(read('index.html'),/addEventListener\('studycloud:applied',\(\)=>\{st=load\(\);/);
  const gr=read('grades.html');assert.match(gr,/study-cloud\.js\?v=\d+/);assert.match(gr,/addEventListener\('studycloud:applied',\(\)=>\{st=G\.load\(read\(\)\);render\(\);\}\)/);
  const keys=require('../scripts/study-progress-backup.js').keys;assert.ok(!keys.includes('study-sync-home-base-v1'));
});
