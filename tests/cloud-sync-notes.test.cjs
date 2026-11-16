"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../scripts/study-cloud.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const n=(text,updated)=>({text,updated});
test('notes merge: new notes from either device, deletes propagate, a both-sides edit keeps the newer one',()=>{
  const base={'acc:c1':n('old','2026-11-16T01:00:00Z'),'acc:c2':n('keep','2026-11-16T01:00:00Z'),'practice:general':n('x','2026-11-16T01:00:00Z')};
  const local={'acc:c1':n('local edit','2026-11-16T03:00:00Z'),'acc:c2':n('keep','2026-11-16T01:00:00Z'),'eco:c1':n('new here','2026-11-16T02:00:00Z'),'practice:general':n('x','2026-11-16T01:00:00Z')};
  const remote={'acc:c1':n('remote edit','2026-11-16T04:00:00Z'),'practice:general':n('x','2026-11-16T01:00:00Z'),'math:c1':n('new there','2026-11-16T02:00:00Z')};
  const m=C.mergeNotes(base,local,remote);
  assert.equal(m['acc:c1'].text,'remote edit','both edited: newer wins');
  assert.ok(!('acc:c2' in m),'deleted on the other device');
  assert.equal(m['eco:c1'].text,'new here');assert.equal(m['math:c1'].text,'new there');
  assert.deepEqual(C.mergeNotes(null,{a:n('1','t1')},{b:n('2','t2')}),{b:n('2','t2'),a:n('1','t1')},'first sync keeps both');
});
test('notes travel inside the planner subject, with a size guard, and pages refresh/push note edits',()=>{
  const src=read('scripts/study-cloud.js');
  assert.match(src,/NOTESK = 'studyos\.notes\.v1'/);assert.match(src,/today: Object\.assign\(\{\}, merged, \{ notes: notes \}\)/);
  assert.match(src,/> MAXB\) throw Error/);assert.match(src,/ls\.get\(NOTESK\) !== nraw\) return 'retry'/);
  assert.match(read('practice.html'),/addEventListener\('studycloud:applied',\(\)=>\{if\(!timer&&document\.activeElement!==ta\)load\(\);\}\)/);
  assert.match(read('practice.html'),/window\.StudyCloud&&StudyCloud\.dirty\(\);\}/);
  assert.match(read('hub.html'),/localStorage\.setItem\(NOTES_KEY,JSON\.stringify\(notes\)\);window\.StudyCloud&&StudyCloud\.dirty\(\);/);
});
