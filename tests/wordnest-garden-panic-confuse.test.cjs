const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const T=require('../vocabloom/wordnest-tools.js'),P=require('../vocabloom/wordnest-zh-games.js');

test('typo diff marks missing and extra letters, and the right ones stay plain',()=>{
 const d=T.diff('recieve','receive');
 assert.equal(d.filter(x=>x[0]!=='+').map(x=>x[1]).join(''),'receive','reading = and - gives the right word');
 assert.equal(d.filter(x=>x[0]!=='-').map(x=>x[1]).join(''),'recieve','reading = and + gives what was typed');
 assert.deepEqual(T.diff('apple','apple').map(x=>x[0]),['=','=','=','=','=']);
 assert.match(T.diffHTML('aple','apple'),/<ins class="wd-miss"[^>]*>p<\/ins>/);
 assert.match(T.diffHTML('<b>','x'),/&lt;/,'typed text is escaped');
});

test('sentence dictation ignores case, spaces and punctuation',()=>{
 assert.equal(T.normSentence('  I MADE a mistake, in my homework!! '),T.normSentence('I made a mistake in my homework.'));
 assert.notEqual(T.normSentence('I made mistake'),T.normSentence('I made a mistake'));
 assert.equal(T.normSentence('It’s fine'),T.normSentence("it's fine"));
});

test('CSV: round trip with quotes and commas; Anki tab text; header names; HTML removed',()=>{
 const csv=T.toCSV([['word','meaning','example'],['a, b','x "y"','line']]);
 assert.deepEqual(T.parseCSV(csv),[['word','meaning','example'],['a, b','x "y"','line']]);
 assert.deepEqual(T.wordsFromCSV(T.parseCSV('#separator:tab\n#html:true\nRecipe\tสูตร<br>อาหาร')),[{en:'recipe',th:'สูตร อาหาร',example:'',level:''}]);
 assert.deepEqual(T.wordsFromCSV(T.parseCSV('Meaning;Word;Level\nบังเอิญ;serendipity;c1')),[{en:'serendipity',th:'บังเอิญ',example:'',level:'C1'}]);
 assert.deepEqual(T.wordsFromCSV(T.parseCSV('word,meaning\n,missing word\nok,\n')),[],'rows without word or meaning are skipped');
});

test('confusable words: English look-alikes, Chinese same sound or shared character',()=>{
 assert.deepEqual(T.confusableEn('affect',['effect','apple','afford','affect']),['effect']);
 assert.deepEqual(T.confusableEn('adapt',['adopt','adept','adult']),['adopt','adept']);
 assert.deepEqual(T.confusableEn('cat',['car','cut']),[],'too short to guess');
 const zh=[{hz:'中国',py:'zhōng guó'},{hz:'美国',py:'měi guó'},{hz:'终过',py:'zhōng guò'},{hz:'你好',py:'nǐ hǎo'}];
 const c=T.confusableZh(zh[0],zh,P.toneless);
 assert.deepEqual(c.map(x=>[x.w.hz,x.why]),[['终过','same sound'],['美国','shares a character']]);
});

test('word status, bloom stages and the 12-week goal calendar',()=>{
 assert.deepEqual(T.statusEn(['a','b','c','d'],{a:{seen:true},b:{seen:true,mastered:true},d:{}}),{new:2,learning:1,mastered:1});
 assert.deepEqual(T.statusZh(['x','y','z'],{x:{st:'learn'},y:{st:'rev',ivl:30}}),{new:1,learning:1,mastered:1});
 assert.equal(T.bloomStage({new:10,learning:0,mastered:0}),0);
 assert.equal(T.bloomStage({new:9,learning:1,mastered:0}),1);
 assert.equal(T.bloomStage({new:7,learning:3,mastered:0}),2);
 assert.equal(T.bloomStage({new:8,learning:1,mastered:1}),3);
 assert.equal(T.bloomStage({new:5,learning:2,mastered:3}),4);
 assert.equal(T.bloomStage({new:2,learning:2,mastered:6}),5);
 const cells=T.heatCells({'2026-11-18':10,'2026-11-17':3},10,'2026-11-18',12);
 assert.equal(cells[cells.length-1].date,'2026-11-18');assert.ok(cells[cells.length-1].met);
 assert.ok(!cells[cells.length-2].met&&cells[cells.length-2].n===3);
 assert.equal(new Date(cells[0].date+'T12:00:00Z').getUTCDay(),1,'columns start on Monday');
 assert.equal(cells.length,11*7+3,'11 full weeks + Mon..Wed');
});

test('Panic Review / weakest picks: most-missed first, then newest',()=>{
 const items=[{id:'a',wrong:1,correct:3},{id:'b',wrong:4,correct:0},{id:'c',wrong:0,correct:0,added:5},{id:'d',wrong:0,correct:0,added:9},{id:'e',wrong:2,correct:2}];
 assert.deepEqual(T.pickWeak(items,4).map(x=>x.id),['b','e','a','d']);
});

test('WordNest pages load the tools and the extras; storage stays in existing keys',()=>{
 const h=read('vocabloom/index.html'),p=read('vocabloom/wordnest-plus.js');
 assert.match(h,/<script src="\.\/wordnest-tools\.js\?v=\d+"><\/script>\s*<script src="\.\/wordnest-plus\.js\?v=\d+"><\/script>/);
 assert.doesNotMatch(p,/localStorage\.setItem|sessionStorage|fetch\(/,'saves only through WordNest store()');
 assert.match(p,/data\.settings\.links=l;data\.settings\.linksTs=Date\.now\(\)/);
 assert.match(p,/data\.settings\.hidePinyin=!data\.settings\.hidePinyin;store\(\)/);
 const s=read('vocabloom/wordnest-sync.js');
 assert.match(s,/lk='vb\/v1\/links'/);assert.match(s,/\+e\.ts>\(\+data\.settings\.linksTs\|\|0\)/);
 assert.match(read('vocabloom/wordnest-zh-games.js'),/\['dictate','👂','Dictation'/);
 assert.match(read('vocabloom/wordnest-ai.js'),/WordNestConfuse\.dialogPart\(lang,term\)/);
});

test('Today: WordNest plan task ticks itself at the goal; + New word appends to My words only',()=>{
 const h=read('index.html');
 assert.match(h,/kind:'words',title:'Review vocabulary \(WordNest\)'.*auto:wg\.met/);
 assert.match(h,/done=t\.kind==='chapter'\?t\.done:!!\(doneToday\[t\.id\]\|\|t\.auto\)/);
 assert.match(h,/\(t\.auto\?' disabled':''\)/);
 assert.match(h,/id="wordAdd"/);assert.match(h,/category:'personal',level:'B1',syncTs:t/);
 assert.match(h,/already in My words/);
});
