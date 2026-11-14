const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const T=require('../scripts/study-today.js'),root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const tt=[{id:'a',day:1,start:'08:00',end:'10:00',name:'Accounting',code:'1201101',course:'acc'},{id:'g',day:5,start:'09:00',end:'12:00',name:'Global',skip:true},{day:8,start:'08:00',end:'09:00'},{day:2,start:'10:00',end:'09:00'}];
test('timetable is normalized and filtered by weekday (Bangkok dates)',()=>{
 const n=T.normalizeTimetable(tt);assert.equal(n.length,2);assert.equal(n[1].skip,true);assert.equal(n[0].course,'acc');
 assert.deepEqual(T.classesOn(tt,'2026-11-16').map(x=>x.id),['a']);assert.deepEqual(T.classesOn(tt,'2026-11-20').map(x=>x.id),['g']);assert.equal(T.classesOn(tt,'2026-11-15').length,0);
});
test('ticking a plan item keeps the timetable',()=>{
 const s=T.loadSettings(JSON.stringify({timetable:tt}));const next=T.markChapter(s,{kind:'review',id:'review'},true,Date.parse('2026-11-16T03:00:00Z'));
 assert.equal(next.timetable.length,2);
});
test('timetable and exams are included in backups and validated on restore',()=>{
 assert.ok(require('../scripts/study-progress-backup.js').keys.includes('studyos.today.v1'));
 const src=read('scripts/study-progress-restore.js');assert.match(src,/key === "studyos\.today\.v1"/);assert.match(src,/Invalid timetable/);
 assert.match(read('progress-restore.html'),/Exam schedule, plan ticks and timetable/);
});
test('calendar imports a timetable only from the link fragment and clears it',()=>{
 const cal=read('calendar.html');assert.match(cal,/\/\^#timetable=\/\.test\(location\.hash\)/);assert.match(cal,/history\.replaceState/);assert.match(cal,/id="pasteClass"/);
 assert.deepEqual([...cal.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]),['T.SETTINGS_KEY']);
 assert.match(read('index.html'),/id="classes"/);
});
test('grades: weighted score, letter, what is needed on the rest, GPA',()=>{
 const G=require('../scripts/study-grades.js');
 const c=G.load(JSON.stringify({courses:[{id:'acc',name:'Accounting',credits:3,items:[{name:'Lab',weight:10,got:9,max:10},{name:'HW',weight:10,got:8,max:10},{name:'Q1',weight:10,got:7,max:10},{name:'Q2',weight:10},{name:'Mid',weight:30,got:24,max:30},{name:'Final',weight:30}]}]})).courses[0];
 const r=G.result(c);assert.equal(r.earned,48);assert.equal(r.remaining,40);assert.equal(r.letter,'A');
 assert.equal(r.needs[0].letter,'A');assert.equal(r.needs[0].need,80);assert.equal(r.needs[1].need,67.5);
 assert.deepEqual(G.gpa([c]),{gpa:4,credits:3});
 assert.equal(G.letterFor(74.99),'B');assert.equal(G.letterFor(49.99),'F');
 assert.equal(G.load('{"courses":[{"name":"x","credits":99,"items":[{"weight":500,"got":-1}]}]}').courses[0].credits,3);
});
test('grades are backed up, validated on restore, and reachable from the sidebar',()=>{
 assert.ok(require('../scripts/study-progress-backup.js').keys.includes('studyos.grades.v1'));
 assert.match(read('scripts/study-progress-restore.js'),/key === "studyos\.grades\.v1"/);
 assert.match(read('scripts/study-nav.js'),/href:'grades\.html',label:'Grades'/);
 const g=read('grades.html');assert.deepEqual([...g.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]),['KEY']);
 assert.match(g,/\/\^#grades=\/\.test\(location\.hash\)/);assert.match(g,/id="pasteGrades"/);assert.doesNotMatch(read('scripts/study-grades.js'),/localStorage|fetch\(/);
 const T=require('../scripts/study-today.js');assert.deepEqual(T.DEFAULT_EXAMS.find(e=>e.id==='acc-final-20261126').cats,['c5','c6','c7','c8','c9']);
});
test('inline scripts on the main pages parse',()=>{
 for(const f of ['index.html','calendar.html','grades.html','practice.html','flashcards.html','hub.html']){
  for(const m of read(f).matchAll(/<script>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new Function(m[1]),f);
 }
});
test('exams and deadlines may belong to languages or other subjects',()=>{
 const T=require('../scripts/study-today.js');
 const s=T.loadSettings(JSON.stringify({exams:[{id:'p',course:'eng',title:'EC1 presentation',date:'2026-11-18',cats:[]},{id:'x',course:'other',title:'Excel project',date:'2026-11-20',cats:[]},{id:'bad',course:'zz',date:'2026-11-20'}]}));
 assert.deepEqual(s.exams.map(e=>e.id),['p','x']);
 const plan=T.buildPlan(s.exams,{},s,Date.parse('2026-11-16T03:00:00Z'));assert.equal(plan.upcoming.length,2);
 assert.match(read('calendar.html'),/name:'Other \(no cards\)'/);
});
test('lesson notes are backed up and validated on restore',()=>{
 assert.ok(require('../scripts/study-progress-backup.js').keys.includes('studyos.notes.v1'));
 assert.match(read('scripts/study-progress-restore.js'),/key === "studyos\.notes\.v1"/);
 assert.match(read('hub.html'),/data-note-text/);
});
