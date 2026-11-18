const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const T=require('../scripts/study-today.js'),P=require('../vocabloom/wordnest-zh-games.js'),SP=require('../vocabloom/wordnest-speak.js');

test('Economics has Money & Banking, Fiscal Policy and Monetary Policy, appended without moving old ids',()=>{
 const D=T.parseCourseData(read('data/courses/eco.js'));
 assert.deepEqual(D.cats.slice(-3).map(c=>c[0]),['m','f','n']);
 for(const c of ['m','f','n']){
  assert.ok(D.cards.filter(x=>x[0]===c).length>=15,c+' cards');assert.ok(D.quiz.filter(x=>x[0]===c).length>=5,c+' quiz');
  assert.ok(D.sum.some(s=>s.cat===c),c+' summary');
 }
 assert.equal(new Set(D.cards.map(c=>c[4])).size,D.cards.length,'card ids unique');
 assert.deepEqual(D.quiz.slice(0,60).map(q=>q[0]).slice(-1),['d'],'the first 60 questions keep their positions (answers are stored by index)');
 for(const q of D.quiz)assert.ok(Array.isArray(q[2])&&q[3]>=0&&q[3]<q[2].length,'valid answer index: '+q[1]);
});

test('Economics final scope includes the new chapters; an edited scope is left alone',()=>{
 const s=T.loadSettings(JSON.stringify({exams:[{id:'eco-final-20261127',course:'eco',title:'Economics final',date:'2026-11-27',cats:['g','i','b','a','d'],confirmed:true}]}));
 assert.deepEqual(s.exams.find(e=>e.id==='eco-final-20261127').cats,['g','i','b','a','d','m','f','n']);
 const k=T.loadSettings(JSON.stringify({exams:[{id:'eco-final-20261127',course:'eco',title:'Economics final',date:'2026-11-27',cats:['g','a'],confirmed:true}]}));
 assert.deepEqual(k.exams[0].cats,['g','a']);
});

test('exam mode: in the last 3 days missed questions and weak chapters lead the plan',()=>{
 const D=T.parseCourseData(read('data/courses/eco.js')),ans={};
 D.quiz.forEach((q,i)=>{if(q[0]==='g')ans[i]=i%2?(q[3]+1)%q[2].length:q[3];});
 const exam={id:'x',course:'eco',title:'Economics final',date:'2026-11-27',cats:['g','i'],confirmed:true};
 const plan=at=>{const now=Date.parse(at),sum=T.summarize(D,'{}',JSON.stringify({ans}),now),st=T.loadSettings(JSON.stringify({exams:[exam]}));return T.buildPlan(st.exams,{eco:sum},st,now).tasks;};
 const near=plan('2026-11-25T03:00:00Z');
 assert.equal(near[0].kind,'missed');assert.deepEqual(near[0].cats,['g']);assert.match(near[0].detail,/exam in 2 days/);
 assert.equal(near[1].kind,'weak');assert.equal(near[1].cat,'g');
 assert.ok(!plan('2026-11-20T03:00:00Z').some(t=>t.kind==='missed'||t.kind==='weak'),'not a week before');
 const h=read('index.html');
 assert.match(h,/t\.kind==='missed'\)acts='<a class="main" href="'\+link\(c,'prac',t\.cats\.join\(','\)\)\+'&missed=1">Redo missed<\/a>'/);
 assert.match(h,/mock\.html\?course='\+c\.key/);
});

test('course pages open the chapters and the Missed filter from the link (?cat=a,b&missed=1)',()=>{
 const e=read('scripts/study-course-engine.js');
 assert.match(e,/get\('cat'\)\|\|''\)\.split\(','\)\.filter\(id=>id&&D\.cats\.some/);
 assert.match(e,/missedOnly=\/\[\?&\]missed=1\\b\/\.test\(location\.search\)/);
 assert.match(e,/URL_CATS\.forEach\(id=>qcats\.add\(id\)\);/);
});

test('mock exam: saves answers like practice (ans + ats), no new localStorage key, linked from Practice and nav',()=>{
 const m=read('mock.html');
 const keys=[...m.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(x=>x[1]);
 assert.deepEqual(keys,['k']);assert.match(m,/const k='study-'\+st\.course;/);
 assert.match(m,/o\.ans\[i\]=st\.ans\[i\];o\.ats\[i\]=t;/);
 assert.match(m,/sessionStorage\.setItem\(RUN/);assert.match(m,/RUN='studyos\.mock\.v1'/);
 assert.match(read('practice.html'),/href="mock\.html"/);
 assert.match(read('scripts/study-nav.js'),/'mock\.html':'practice'/);
 assert.match(read('sw.js'),/'mock\.html'/);
});

test('pinyin: numbers become tone marks, tones go on the right vowel, letters-only check',()=>{
 assert.equal(P.normPy('ni3 hao3'),P.normPy('nǐ hǎo'));
 assert.equal(P.normPy('Ni3Hao3'),'nǐhǎo');
 assert.equal(P.normPy('lv4'),'lǜ');
 assert.deepEqual(['gou','dui','liu','xue','hao','mei'].map((s,i)=>P.withTone(s,[3,4,2,2,3,2][i])),['gǒu','duì','liú','xué','hǎo','méi']);
 assert.equal(P.toneOf('zhōng'),1);assert.equal(P.toneOf('de'),5);
 assert.equal(P.toneless('shēng rì kuài lè'),'sheng ri kuai le');
 assert.ok(P.sameLetters('ni2 hao2','nǐ hǎo'));assert.ok(!P.sameLetters('ni hai','nǐ hǎo'));
 const decks=JSON.parse(read('vocabloom/study-decks.json')).decks,zh=decks.find(d=>d.key==='zh');
 let n=0;for(const x of zh.cards){const py=x[7][1];if(!/^[a-zü'\s̀́̄̌̈]+$/i.test(py.normalize('NFD')))continue;n++;
  const num=py.normalize('NFD').split(/\s+/).map(s=>P.toneless(s)+P.toneOf(s)).join(' ');
  assert.equal(P.normPy(num),P.normPy(py),py);
  const o=P.toneOptions(py);assert.equal(o[0],py.trim().split(/\s+/).join(' '));assert.equal(new Set(o).size,o.length);assert.ok(o.length>=2,py);}
 assert.ok(n>=270,'most words can be typed ('+n+')');
});

test('Chinese games: 7 modes, mistakes filter, answers count toward the daily goal; English speaking check',()=>{
 const g=read('vocabloom/wordnest-zh-games.js'),s=read('vocabloom/wordnest-sync.js');
 for(const m of ['match','listen','pinyin','meaning','tones','type','speak'])assert.match(g,new RegExp("\\['"+m+"'"));
 assert.match(g,/if\(G\.miss\)all=all\.filter\(w=>isMiss\(s\[w\.mid\]\)\)/);
 assert.match(g,/WordNestSync\.count\(correct,'zh:'\+w\.mid\)/);
 assert.match(s,/data\.days\[today\(\)\]=d;/);assert.match(s,/cLocalRecord\(id\|\|null,correct\)/);
 assert.ok(SP.heardWord(['I said Apple!'],'apple'));assert.ok(SP.heardWord(['take a deep breath'],'deep breath'));
 assert.ok(!SP.heardWord(['pineapple'],'apple'));
 assert.doesNotMatch(read('vocabloom/wordnest-speak.js'),/localStorage|fetch\(/);
 assert.match(read('vocabloom/index.html'),/<script src="\.\/wordnest-speak\.js\?v=\d+"><\/script>/);
});

test('Stats shows WordNest words per day and counts them in the streak; Today shows the goal streak',()=>{
 const st=read('stats.html');
 assert.match(st,/id="wChart"/);assert.match(st,/S\.streak\(now,\[answered,pomo,ticks,words\]\)/);
 assert.match(st,/<script src="scripts\/study-wordnest\.js\?v=\d+"><\/script>/);
 assert.match(read('index.html'),/g\.streak\+'-day streak'/);
});

test('offline: WordNest folder links open WordNest, not Today; decks precached',()=>{
 const w=read('sw.js');
 assert.match(w,/'vocabloom\/', 'vocabloom\/index\.html', 'vocabloom\/study-decks\.json'/);
 assert.match(w,/cache\.match\(path \+ 'index\.html', \{ ignoreSearch: true \}\)/);
});
