/* 24 Nov 2026 (owner): exams → iPad Calendar (.ics), practice stopwatch, PDF page + zoom bar. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8'),I=require('../scripts/study-ics.js');
test('.ics has one all-day event per upcoming exam with two alerts, escaped text and CRLF lines',()=>{
  const t=I.build([{id:'a',title:'Accounting final; Ch5–9',date:'2026-11-26'},{id:'old',title:'Old',date:'2026-11-01'},{id:'e',title:'Econ',date:'2026-11-27'}],Date.UTC(2026,10,24),'2026-11-24');
  assert.equal((t.match(/BEGIN:VEVENT/g)||[]).length,2,'past exam left out');
  assert.match(t,/DTSTART;VALUE=DATE:20261126\r\nDTEND;VALUE=DATE:20261127/);
  assert.ok(t.includes('SUMMARY:Accounting final'+String.fromCharCode(92)+'; Ch5–9'),'semicolon escaped');
  assert.equal((t.match(/BEGIN:VALARM/g)||[]).length,4);
  assert.ok(t.startsWith('BEGIN:VCALENDAR\r\n')&&t.endsWith('END:VCALENDAR\r\n'));
  assert.ok(t.indexOf('20261126')<t.indexOf('20261127'),'sorted by date');
});
test('Calendar page has the Add to iPad Calendar button and loads the builder',()=>{
  const s=R('calendar.html');assert.match(s,/id="icsExams"/);assert.match(s,/scripts\/study-ics\.js\?v=\d+/);assert.match(s,/StudyIcs\.build\(settings\.exams/);
});
test('stopwatch is on acc/eco/math practice, reads answers only and stores nothing',()=>{
  const s=R('scripts/study-stopwatch.js');
  assert.doesNotMatch(s,/setItem|sessionStorage/);assert.match(s,/tab=prac/);
  for(const f of ['acc.html','eco.html','math.html'])assert.match(R(f),/scripts\/study-stopwatch\.js\?v=\d+/,f);
});
test('PDF viewer has a sticky page + zoom bar beside the pages, zoom redraws pages and is not stored',()=>{
  const s=R('pdf-sets.html');
  assert.match(s,/<div class="ps-vcol"><div class="ps-viewer" id="viewer"[^>]*><\/div>\s*<div class="ps-zbar" id="zbar"/);
  for(const id of ['zPrev','zNext','zIn','zOut','zFit','zPage'])assert.match(s,new RegExp('id="'+id+'"'));
  assert.match(s,/rezoom=\(\)=>v\.querySelectorAll\('\.ps-pg'\)/);
  assert.match(s,/\.ps-zbar\{position:sticky/);
  assert.doesNotMatch(s.slice(s.indexOf('const ZOOMS'),s.indexOf('function goPage')),/localStorage|sessionStorage/);
});
