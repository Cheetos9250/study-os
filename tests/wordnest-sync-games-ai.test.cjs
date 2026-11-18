const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const W=require('../scripts/study-wordnest.js');

test('WordNest daily goal: answers today vs goal, streak, due cards only, sync shadows skipped',()=>{
 const now=Date.parse('2026-11-18T10:00:00+07:00'),day=W.dayKey(now);
 assert.equal(day,'2026-11-18');
 const vocab={settings:{goal:8},progress:{apple:{seen:true}},days:{[day]:{answered:5},'2026-11-17':{answered:40},'2026-11-16':{answered:8},'2026-11-15':{answered:3}}};
 const eng={s:{'e1-1':{due:now-1,ts:now-5e8},'e1-2':{due:now+864e5,ts:now-1000},'vb/v1/word/apple':{kind:'word',ts:now,due:0}}};
 const zh={s:{'zr-1':{due:now-1,ts:now-60000},'zr-2':{due:now+1e6,ts:now-3*36e5}}};
 const g=W.daily(vocab,JSON.stringify(eng),zh,now);
 assert.deepEqual([g.goal,g.done,g.met,g.streak],[8,5,false,2],'today still open: streak counts from yesterday');
 assert.deepEqual([g.dueEn,g.dueZh,g.due],[1,1,2],'vb/ shadow entries are not cards');
 vocab.days[day].answered=9;assert.deepEqual([W.daily(vocab,eng,zh,now).met,W.daily(vocab,eng,zh,now).streak],[true,3]);
 assert.equal(W.daily({},null,null,now).goal,10,'default goal');
 assert.equal(W.daily({},null,null,now).started,false,'hidden before WordNest is used');
 assert.equal(W.daily('not json',null,null,now).done,0);
});

test('Today shows the WordNest goal card and loads the read-only helper',()=>{
 const h=read('index.html');
 assert.match(h,/<script src="scripts\/study-wordnest\.js\?v=\d+"><\/script>/);
 assert.match(h,/id="wordGoal"/);assert.match(h,/renderWordGoal\(\);/);
 assert.doesNotMatch(read('scripts/study-wordnest.js'),/setItem|removeItem|fetch\(/,'helper is read-only');
});

test('WordNest uses the main Cloud sync (no separate writer)',()=>{
 const h=read('vocabloom/index.html'),s=read('vocabloom/wordnest-sync.js'),c=read('scripts/study-cloud.js');
 assert.match(h,/window\.STUDY_BASE='\.\.\/';<\/script>\s*<script src="\.\.\/scripts\/study-today\.js\?v=\d+"><\/script>\s*<script src="\.\.\/scripts\/study-cloud\.js\?v=\d+"><\/script>\s*<script src="\.\/wordnest-sync\.js/);
 assert.match(c,/fetch\(\(root\.STUDY_BASE \|\| ''\) \+ 'data\/config\.json'/);
 assert.match(s,/CLOUD\.enabled=false/,'old WordNest auto sync never runs');
 assert.match(s,/cCloudDebounce=function\(\)\{persist\(\);const s=SC\(\);if\(s\)s\.dirty\(\);\}/);
 assert.match(s,/addEventListener\('studycloud:applied'/);
 // the only key it writes is the English schedule that study-cloud already syncs as subject 'eng'
 const writes=[...s.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]);
 assert.deepEqual(writes,['ENG']);assert.match(s,/const ENG='eng-vocab-v1-srs'/);
 assert.ok(require('../scripts/study-progress-backup.js').keys.includes('eng-vocab-v1-srs'));
});

test('Chinese games write only the Chinese flashcard schedule',()=>{
 const g=read('vocabloom/wordnest-zh-games.js'),h=read('vocabloom/index.html');
 assert.match(h,/<script src="\.\/wordnest-zh-games\.js\?v=\d+"><\/script>/);
 const writes=[...g.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1]);
 assert.deepEqual(writes,["d.markKey+'-srs'"]);
 assert.match(g,/if\(!window\.WORDNEST\|\|WORDNEST\.lang!=='zh'\)return;/);
 for(const m of ['match','listen','pinyin','meaning'])assert.match(g,new RegExp("\\['"+m+"'"));
 assert.match(read('vocabloom/wordnest.js'),/:not\(\[data-page=zhgames\]\)/,'Games tab stays visible in Chinese mode');
});

test('Chinese games build 4 distinct options with the right answer',()=>{
 const src=read('vocabloom/wordnest-zh-games.js');
 const decks=JSON.parse(read('vocabloom/study-decks.json')).decks,zh=decks.find(d=>d.key==='zh');
 const ctx={window:{WORDNEST:{lang:'zh'}},document:{querySelector:()=>null,head:{appendChild(){}},createElement:()=>({}),getElementById:()=>null,querySelectorAll:()=>[]},
  location:{search:''},URLSearchParams,setInterval:()=>0,clearInterval(){},setTimeout(){},Math,JSON,Set,Map,String,Number,Object,Array,
  uDeck:()=>zh,uReadSrs:()=>({s:{},m:{day:0,newDone:0}}),render(){},handleAction(){},toast(){},ui:{page:'studymerge'}};
 ctx.WORDNEST=ctx.window.WORDNEST;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);
 const G=ctx.window.WordNestZhGames,words=G.words();
 assert.ok(words.length>=270,'most of the 279 cards have characters, pinyin and meaning ('+words.length+')');
 for(const field of ['hz','py','mean'])for(const w of words.slice(0,40)){
  const o=G.options(w,field,words),right=field==='mean'?w.th+(w.en&&w.en!==w.th?' · '+w.en:''):w[field];
  assert.equal(o.length,4);assert.equal(new Set(o).size,4);assert.ok(o.includes(right));
 }
});

test('Ask AI opens the tutor with English/Chinese selected and a ready question',()=>{
 const a=read('vocabloom/wordnest-ai.js'),t=read('tutor.html');
 assert.match(t,/const COURSES=\(T\?T\.COURSES\.concat\(T\.LANGS\|\|\[\]\):\[\]\);/);
 assert.match(a,/'\.\.\/tutor\.html\?course='\+\(lang==='zh'\?'zh':'eng'\)\+'&q='\+encodeURIComponent\(q\)/);
 assert.doesNotMatch(a,/localStorage\.setItem|sessionStorage|fetch\(/);
 const ctx={window:{WORDNEST:{lang:'en'}},document:{getElementById:()=>null,head:{appendChild(){}},createElement:()=>({})},render(){},handleAction(){},toast(){},
  data:{progress:{apple:{wrong:4,correct:1},pear:{wrong:1,correct:3},kiwi:{correct:2}}},getWord:id=>({en:id}),Math,JSON,String,Number,Object,Array,encodeURIComponent};
 ctx.WORDNEST=ctx.window.WORDNEST;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(a,ctx);
 const AI=ctx.window.WordNestAI;
 assert.deepEqual([...AI.mistakes('en')],['apple','pear']);
 const p=AI.prompts('en','recipe','สูตรอาหาร');
 assert.equal(p.length,3);assert.match(p[0][1],/"recipe" \(สูตรอาหาร\)/);assert.match(p[2][1],/^\/quiz 10 .*: recipe, apple, pear$/);
 assert.match(AI.link('zh','你好'),/^\.\.\/tutor\.html\?course=zh&q=%E4%BD%A0/);
});
