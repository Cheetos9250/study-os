const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('quiz pages load the chapter notes panel before the nav scripts',()=>{
 for(const f of ['acc.html','eco.html','math.html']){
  const s=read(f);assert.match(s,/<script src="scripts\/study-course-mode\.js\?v=1"><\/script>\s*<script src="scripts\/study-quiz-notes\.js\?v=1"><\/script>\s*<script src="scripts\/study-course-nav\.js\?v=1"><\/script>/,f);
 }
});
test('quiz notes use the backed-up lesson notes key, one note per chapter, and re-read before writing',()=>{
 const s=read('scripts/study-quiz-notes.js');
 assert.match(s,/KEY='studyos\.notes\.v1'/);
 assert.match(s,/function key\(\)\{return ck\+':'\+chap;\}/);
 assert.match(s,/function save\(\)\{clearTimeout\(timer\);timer=null;var notes=all\(\)/);
 assert.doesNotMatch(s,/removeItem|\.clear\(|fetch\(|sessionStorage/);
 assert.match(s,/data-mode'\)!=='prac'/);
 assert.ok(require('../scripts/study-progress-backup.js').keys.includes('studyos.notes.v1'));
});
test('Lessons page re-reads notes before saving, so quiz notes are kept',()=>{
 assert.match(read('hub.html'),/function saveNote\(k,text\)\{try\{const o=JSON\.parse\(localStorage\.getItem\(NOTES_KEY\)/);
});
test('quiz notes open full screen on a swipe right and leave screen edges to Safari',()=>{
 const s=read('scripts/study-quiz-notes.js');
 assert.match(s,/addEventListener\('touchstart'[\s\S]*?t\.clientX>28&&t\.clientX<innerWidth-28/);
 assert.match(s,/if\(dx>0&&!full&&!inPanel\)\{if\(panel\.hidden\)setOpen\(true\);setFull\(true\)/);
 assert.match(s,/else if\(dx<0&&full\)\{setFull\(false\);setOpen\(false\);\}/);
 assert.match(s,/aria-label="Full screen"/);
});
