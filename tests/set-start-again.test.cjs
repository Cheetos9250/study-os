const __cs=require('./course-source.cjs');
const test=require('node:test'),assert=require('node:assert'),path=require('path');
const s=__cs.read(path.join(__dirname,'..','acc.html'),'utf8');
test('Start again shows when every question of the chosen set is answered and keeps old answers',()=>{
  assert.match(s,/const setDone=\(\)=>setsOn\(\)&&qcats\.size===1&&qset!=='all'/);
  assert.match(s,/id="againBtn"/);
  assert.match(s,/redoIds=new Set\(deck\.map/);
  assert.match(s,/redoAt>0&&redoIds\.has/);
  assert.doesNotMatch(s,/againBtn[^;]*delete store\.ans/); // never clears answers
  assert.doesNotMatch(s,/localStorage\.setItem\([^)]*redo/); // in memory only, no new key
});
