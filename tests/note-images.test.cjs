"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const NI=require('../scripts/study-note-images.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const id='0123456789abcdef0123456789abcdef';
test('saving a note keeps its pictures; an empty note with pictures is kept, an empty one without is dropped',()=>{
  assert.deepEqual(NI.withText({text:'a',imgs:[id]},'b','t'),{text:'b',updated:'t',imgs:[id]});
  assert.deepEqual(NI.withText({text:'a',imgs:[id]},'','t'),{text:'',updated:'t',imgs:[id]});
  assert.equal(NI.withText({text:'a'},'  ','t'),null);
  assert.deepEqual(NI.validIds([id,'bad','<script>',id.toUpperCase()]),[id]);
});
test('every note writer keeps pictures even if the images script is not loaded',()=>{
  for(const f of ['scripts/study-quiz-notes.js','practice.html','hub.html','scripts/study-pins.js']){
    const s=read(f);assert.match(s,/var im=o&&Array\.isArray\(o\.imgs\)&&o\.imgs\.length\?o\.imgs:null;/,f);
    assert.doesNotMatch(s,/notes\[k\]=\{text/,f);}
});
test('restore accepts picture ids on notes and rejects anything else',()=>{
  const R=require('../scripts/study-progress-restore.js');
  const ok=JSON.stringify({'acc:c1':{text:'x',imgs:[id]}}),bad=JSON.stringify({'acc:c1':{text:'x',imgs:['../etc']}});
  const s=read('scripts/study-progress-restore.js');assert.match(s,/note\.imgs !== undefined && \(!Array\.isArray\(note\.imgs\)/);
  assert.ok(ok&&bad&&R);
});
test('pictures load on the quiz notes, the Practice notebook and Lessons notes, and upload only through StudyCloud creds',()=>{
  for(const f of ['acc.html','eco.html','math.html','practice.html','hub.html'])assert.match(read(f),/scripts\/study-note-images\.js\?v=\d+/,f);
  const s=read('scripts/study-note-images.js');
  assert.match(s,/root\.StudyCloud && root\.StudyCloud\.creds/);assert.match(s,/c\.api \+ '\/img\/' \+ r\.id/);
  assert.match(s,/if \(h !== id\) return null;/,'downloaded pictures are checked against their id');
  assert.match(read('scripts/study-cloud.js'),/function creds\(\) \{ return cfg\(\)\.then\(function \(\) \{ return api && key\(\) \? \{ api: api, key: key\(\) \} : null; \}\); \}/);
  assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('studyos-note-images-v1'));
});
