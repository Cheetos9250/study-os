/* Owner wishlist round 1 (TASKS 14–18): Cram Mode, pinned formulas, note cards, calculator history, PDF resume page. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const P=require('../scripts/study-pins.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('pins: "title :: formula" per line, comments and blanks skipped',()=>{
  assert.deepEqual(P.parsePins('COGS :: BI + P − EI\n\n// note\nGP = Sales − COGS'),[{title:'COGS',body:'BI + P − EI'},{title:'',body:'GP = Sales − COGS'}]);
});
test('note cards: only lines with both sides of "::"',()=>{
  assert.deepEqual(P.parseCards('- Normal balance of AR :: Debit\nplain line\n:: no question\nFIFO ::\n• LIFO in IFRS? :: Not allowed'),
    [{q:'Normal balance of AR',a:'Debit'},{q:'LIFO in IFRS?',a:'Not allowed'}]);
});
test('pins live in the backed-up, synced notes as "<course>:pins" (valid for restore)',()=>{
  assert.equal(P.KEY,'studyos.notes.v1');
  assert.match(R('scripts/study-pins.js'),/k=c\+':pins'/);
  assert.ok(/^[a-z]+:[A-Za-z0-9_-]+$/.test('acc:pins'),'matches the restore note-key rule');
  assert.match(R('practice.html'),/<section id="pinsPanel"/);assert.match(R('practice.html'),/scripts\/study-pins\.js/);
  for(const c of ['acc','eco','math'])assert.match(R(c+'.html'),/scripts\/study-quiz-notes\.js\?v=3"><\/script>\n<script src="scripts\/study-pins\.js/);
});
test('Cram Mode is read-only: lists wrong or box-0 questions with the right answer',()=>{
  const e=R('scripts/study-course-engine.js');
  assert.match(e,/const CRAM=\/\[\?&\]cram=1\\b\/\.test\(location\.search\);/);
  assert.match(e,/if\(CRAM\)\{ renderCram\(\$\('#qBody'\)\); return; \}/);
  const body=e.slice(e.indexOf('function renderCram'),e.indexOf('function renderQ'));
  assert.doesNotMatch(body,/save\(\)|store\.ans\[[^\]]+\]=/,'never writes answers');
  assert.match(e,/rv\[q\.id\]\[0\]===0/);
});
test('Notes panel shows note cards without changing the note',()=>{
  const q=R('scripts/study-quiz-notes.js');assert.match(q,/class="qn-c"/);assert.match(q,/function paintCards\(\)/);
  const cards=q.slice(q.indexOf('function paintCards'),q.indexOf('cb.onclick'));assert.doesNotMatch(cards,/localStorage\.setItem/);
});
test('calculator keeps 30 results on this device; PDF sets remember the page per PDF',()=>{
  const c=R('scripts/study-calc.js');assert.match(c,/var HK='studyos\.calc\.v1',MAXH=30;/);assert.match(c,/Clear history/);
  const evaluate=require('../scripts/study-calc.js').evaluate;assert.equal(evaluate('2*(3+4)'),14);
  const p=R('pdf-sets.html');assert.match(p,/const POS_KEY='studyos\.pdfpos\.v1'/);
  assert.match(p,/await select\(BOOK_ID,\{noResume:!!\(u\.get\('q'\)\|\|u\.get\('ch'\)\)\}\)/,'links to an exercise still open at that exercise');
  const b=R('scripts/study-progress-backup.js');assert.doesNotMatch(b,/studyos\.(calc|pdfpos)\.v1/,'device-only conveniences');
});
