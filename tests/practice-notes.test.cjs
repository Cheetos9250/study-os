const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('practice notebook stores notes in the backed-up lesson notes key',()=>{
 const s=read('practice.html');
 assert.match(s,/const KEY='studyos\.notes\.v1'/);
 assert.match(s,/'practice:'\+book/);
 for(const b of ['general','acc','eco','math'])assert.match(s,new RegExp('data-nb="'+b+'"'),b);
 assert.ok(require('../scripts/study-progress-backup.js').keys.includes('studyos.notes.v1'));
 const re=/^[a-z]+:[A-Za-z0-9_-]+$/;for(const b of ['general','acc','eco','math'])assert.ok(re.test('practice:'+b),b);
 assert.doesNotMatch(s,/removeItem|\.clear\(/);
});
test('practice notebook re-reads stored notes before writing, so other notes are kept',()=>{
 const s=read('practice.html');
 const m=s.match(/function save\(\)\{[\s\S]*?\n/);assert.ok(m);assert.match(m[0],/const notes=all\(\)/);
});
