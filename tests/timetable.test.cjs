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
 const cal=read('calendar.html');assert.match(cal,/location\.hash\.match\(\/\^#timetable=/);assert.match(cal,/history\.replaceState/);
 assert.deepEqual([...cal.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]),['T.SETTINGS_KEY']);
 assert.match(read('index.html'),/id="classes"/);
});
