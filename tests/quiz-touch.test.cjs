/* iPad touch (owner, 23 Nov 2026): swipe on the question card changes questions, the right edge opens notes,
   a right answer moves on by itself, and answer buttons are bigger on touch screens. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('swipe script presses the page Previous/Next buttons and stays out of the scratchpad, text boxes and the notes edge',()=>{
  const s=R('scripts/study-quiz-touch.js');
  assert.match(s,/closest\('\.qcard'\)/);assert.match(s,/getElementById\(dx<0\?'qnext':'qprev'\)/);
  assert.match(s,/tag==='CANVAS'\|\|tag==='TEXTAREA'\|\|tag==='INPUT'/);assert.match(s,/t\.clientX>innerWidth-EDGE/);
  assert.doesNotMatch(s,/localStorage|sessionStorage/,'stores nothing');
  for(const f of ['acc.html','eco.html','math.html'])assert.match(R(f),/<script src="scripts\/study-quiz-touch\.js\?v=\d+"><\/script>/,f);
});
test('a right answer moves to the next question after a moment; a wrong one stays',()=>{
  const s=R('scripts/study-course-engine.js');
  assert.match(s,/if\(ok&&qpos<deck\.length-1\)\{[^}]*setTimeout\(\(\)=>\{ if\(qpos===at&&deck\[qpos\]&&String\(deck\[qpos\]\.id\)===id\)\{ qpos\+\+; renderQ\(\); \} \},900\)/);
});
test('answer buttons are bigger on touch screens',()=>{
  assert.match(R('assets/study-eink-course.css'),/@media \(pointer:coarse\)\{[\s\S]*body \.opt\{min-height:64px/);
});
