/* Course pages share scripts/study-course-engine.js and load their data from data/courses/ (18 Nov 2026). */
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..'),R=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const T=require('../scripts/study-today.js');
const PAGES=['acc','eco','math','eng','zh'];
test('each course page loads its data file, then the shared engine; no course data or engine left inline',()=>{
  for(const c of PAGES){const h=R(c+'.html');
    assert.ok(h.length<40000,c+'.html stays small ('+h.length+')');
    assert.doesNotMatch(h,/^const D = /m,c);assert.doesNotMatch(h,/function buildDeck/,c);
    const d=h.indexOf('src="data/courses/'+c+'.js'),o=h.indexOf('window.StudyCourseOpts='),e=h.indexOf('src="scripts/study-course-engine.js');
    assert.ok(d>0&&o>d&&e>o,c+': data, options, engine in that order');
    for(const after of ['study-course-mode.js','study-course-nav.js','study-quiz-notes.js','study-cloud.js','study-nav.js']) if(h.includes(after)) assert.ok(h.indexOf(after)>e,c+': '+after+' after the engine');
  }
  assert.match(R('acc.html'),/src="data\/courses\/acc-snapshot\.js[^"]*"><\/script>\n<script src="data\/courses\/acc-extra\.js/);
  assert.match(R('eco.html'),/src="data\/courses\/eco-snapshot\.js/);
});
test('data files keep the one-line D that Today, Lessons, Grades, Calendar, Stats and search parse',()=>{
  for(const c of T.COURSES.concat(T.LANGS)){
    assert.equal(c.data,'data/courses/'+c.key+'.js');
    const D=T.parseCourseData(R(c.data));
    assert.equal(D.key,c.key);assert.equal(D.markKey,c.mark);assert.ok(Array.isArray(D.cards)&&D.cards.length);
  }
  for(const p of ['index.html','practice.html','flashcards.html','hub.html','calendar.html','grades.html','stats.html']){
    const s=R(p);assert.doesNotMatch(s,/fetch\((c|l|C)\.page/,p);assert.match(s,/fetch\((c|l|C)\.data/,p);
  }
});
test('the engine is shared: course differences come from options, not from course names',()=>{
  const e=R('scripts/study-course-engine.js');
  assert.doesNotMatch(e,/studyos\.acc\.qtype|ACC_TB_MCQ|ECO_PRACTICE_MCQ|MATH_PRACTICE_MCQ|\[5,6,7,8,9\]/);
  assert.match(e,/for\(const ch of \(OPT\.written\|\|\[\]\)\)/);
  assert.match(e,/\(missedOnly\|\|unansOnly\)\?'No questions match this filter'/,'empty-deck message uses missedOnly (was an undefined name on acc)');
  assert.doesNotMatch(e,/\(missed\|\|unansOnly\)/);
  assert.match(e,/const EMBQ_ROWS=typeof EMBQ!=='undefined'/);
  assert.equal(R('acc.html').includes('written:[5,6,7,8,9]'),true);
  for(const c of ['eco','eng','zh']) assert.doesNotMatch(R(c+'.html'),/written:/,c);
});
test('extra accounting sets keep their ids and seeds (saved answers and option order depend on them)',()=>{
  const ctx={window:{}};vm.runInNewContext(R('data/courses/acc-extra.js'),ctx);const X=ctx.window.StudyCourseExtra;
  assert.deepEqual(X.sets.map(s=>[s.pre,s.from,s.seed,s.rows.length,!!s.case]),
    [['err-',1,701,20,false],['c8x-',1,801,16,false],['err-b',1,901,20,false],['err-b',21,1001,80,false],['brc-',1,1201,48,true],['x7-',1,1301,10,false],['x9-',1,1401,10,false],['pe-',1,1601,100,false],['ps-',1,1701,278,true]]);
  assert.ok(X.hide.length>=80);
});
