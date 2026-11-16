const test=require('node:test'),assert=require('node:assert');
const T=require('../scripts/study-today.js');
test('Global Citizenship video deadline is added once to an existing saved schedule',()=>{
  const old=JSON.stringify({exams:[{id:'acc-final-20261126',course:'acc',title:'Accounting final',date:'2026-11-26',cats:['c5'],confirmed:true}]});
  const s=T.loadSettings(old); assert.ok(s.exams.some(e=>e.id==='gc-video-20261120'&&e.course==='other'&&e.date==='2026-11-20'));
  assert.ok(s.seenDefaults.includes('gc-video-20261120'));
  // the learner deletes it: it must not come back
  const after=T.loadSettings(JSON.stringify({...s,exams:s.exams.filter(e=>e.id!=='gc-video-20261120')}));
  assert.ok(!after.exams.some(e=>e.id==='gc-video-20261120'));
  // old defaults the learner deleted earlier are not re-added
  assert.ok(!s.exams.some(e=>e.id==='math-final-20261201'));
});
test('Economics final scope is confirmed by the course outline; edited scopes are left alone',()=>{
  const s=T.loadSettings(JSON.stringify({exams:[{id:'eco-final-20261127',course:'eco',title:'Economics final',date:'2026-11-27',cats:['g','i','b','a','d'],confirmed:false},{id:'e2',course:'eco',date:'2026-11-27',cats:['g'],confirmed:false}]}));
  assert.equal(s.exams.find(e=>e.id==='eco-final-20261127').confirmed,true);
  assert.equal(s.exams.find(e=>e.id==='e2').confirmed,false);
});
test('markChapter keeps seenDefaults',()=>{
  const s=T.loadSettings(JSON.stringify({exams:[]}));
  const n=T.markChapter(s,{kind:'review',id:'review'},true,Date.parse('2026-11-16T03:00:00Z'));
  assert.deepEqual(n.seenDefaults,s.seenDefaults);
});
