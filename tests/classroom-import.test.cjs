/* Google Classroom import (classroom.html + scripts/study-classroom.js) into Today's tasks. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const C=require('../scripts/study-classroom.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const restore=require('../scripts/study-progress-restore.js');
test('client IDs are checked; scopes are read-only',()=>{
  assert.equal(C.clientId(' 123456789-abc123.apps.googleusercontent.com '),'123456789-abc123.apps.googleusercontent.com');
  assert.equal(C.clientId('my secret'),'');assert.doesNotMatch(C.SCOPES,/classroom\.(courses|coursework\.me)(\s|$)/);
  for(const s of C.SCOPES.split(' '))assert.match(s,/\.readonly$/);
});
test('UTC due date and time become the Bangkok day',()=>{
  assert.equal(C.dueDay({dueDate:{year:2026,month:11,day:20},dueTime:{hours:18,minutes:0}}),'2026-11-21');
  assert.equal(C.dueDay({dueDate:{year:2026,month:11,day:20},dueTime:{hours:3}}),'2026-11-20');
  assert.equal(C.dueDay({dueDate:{year:2026,month:11,day:20}}),'2026-11-20');assert.equal(C.dueDay({}),'');
  assert.equal(C.dueTime({dueDate:{year:2026,month:11,day:20},dueTime:{hours:16,minutes:59}}),'23:59');
});
test('rows: turned-in work is not picked; tasks merge by id and keep the owner\'s tick',()=>{
  const courses=[{id:'1',name:'Global Citizenship for a Better World'}];
  const works={'1':[{id:'w1',title:'SDG video link',dueDate:{year:2026,month:11,day:20},alternateLink:'https://classroom.google.com/c/x/a/y'},
    {id:'w2',title:'Quiz 1',dueDate:{year:2026,month:11,day:19}},{id:'w3',title:'Reading'}]};
  const rows=C.rows(courses,works,{w2:{state:'TURNED_IN'}},'2026-11-18');
  assert.deepEqual(rows.map(r=>[r.id,r.pick,r.done]),[['gc-w2',false,true],['gc-w1',true,false],['gc-w3',false,false]]);
  assert.ok(rows[1].title.length<=80);assert.match(rows[1].title,/^Global Citizenship fo…: SDG video link$/);
  const first=C.merge([{id:'t1',title:'Mine',date:'2026-11-30',pri:'Low',done:false}],[rows[1]],'2026-11-18',0);
  assert.equal(first.added,1);const t=first.tasks.find(x=>x.id==='gc-w1');
  assert.deepEqual([t.date,t.pri,t.done,t.src,t.link],['2026-11-20','High',false,'classroom','https://classroom.google.com/c/x/a/y']);
  t.done=true;const again=C.merge(first.tasks,[Object.assign({},rows[1],{date:'2026-11-22'})],'2026-11-18',0);
  assert.equal(again.added,0);assert.equal(again.updated,1);const u=again.tasks.find(x=>x.id==='gc-w1');assert.equal(u.done,true);assert.equal(u.date,'2026-11-22');
  assert.equal(again.tasks.length,2);
});
test('restore accepts imported tasks and rejects a non-Classroom link',()=>{
  const B=require('../scripts/study-progress-backup.js'),O='https://cheetos9250.github.io';
  const snap=v=>{const m=new Map([['studyos.home.v1',JSON.stringify(v)]]);return B.createSnapshot({getItem:k=>m.has(k)?m.get(k):null},O,new Date('2026-11-18T00:00:00Z'));};
  const empty={getItem:()=>null};
  const ok={tasks:[{id:'gc-1',title:'A: b',date:'2026-11-20',pri:'High',done:false,src:'classroom',link:'https://classroom.google.com/c/1'}]};
  assert.deepEqual(restore.plan(empty,snap(ok),O).missing,['studyos.home.v1']);
  for(const t of [{link:'javascript:alert(1)'},{link:'https://evil.example/'},{src:'other'}])
    assert.throws(()=>restore.plan(empty,snap({tasks:[Object.assign({id:'gc-1',title:'A',date:'2026-11-20',pri:'High'},t)]}),O),/task link/);
});
test('page and Today wiring',()=>{
  const h=R('classroom.html');assert.match(h,/accounts\.google\.com\/gsi\/client/);assert.match(h,/initTokenClient/);
  assert.doesNotMatch(h,/localStorage\.setItem\([^)]*token/i,'the access token is never stored');
  assert.match(R('index.html'),/href="classroom\.html"/);assert.match(R('index.html'),/classroom\\\.google\\\.com/);
});
