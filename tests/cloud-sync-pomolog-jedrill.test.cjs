'use strict';
/* Pomodoro history and JE Drill score sync inside the 'home' document (18 Nov 2026, no Worker redeploy). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../scripts/study-cloud.js'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');

test('pomolog: gains on both devices add up, first sync never double counts, logs merge, lastEnd max',()=>{
 const m=C.mergePomolog({days:{d:25}},{days:{d:50,e:25},lastEnd:5,bySub:{d:{acc:50}}},{days:{d:75},lastEnd:9,bySub:{d:{acc:25,eco:50}},logs:{d:[{t:2,n:'b'}]}});
 assert.deepEqual(m.days,{d:100,e:25});assert.equal(m.lastEnd,9);assert.deepEqual(m.logs,{d:[{t:2,n:'b'}]});
 assert.deepEqual(m.bySub.d,{acc:50,eco:50},'no base for bySub: larger wins');
 assert.deepEqual(C.mergePomolog(null,{days:{d:50}},{days:{d:25}}).days,{d:50});
 assert.equal(C.mergePomolog({days:{d:1400}},{days:{d:1430}},{days:{d:1430}}).days.d,1440,'capped at a day');
 const logs=C.mergePomolog(null,{days:{},logs:{d:[{t:1,n:'a'},{t:3,n:'c'}]}},{days:{},logs:{d:[{t:1,n:'a'},{t:2,n:'b'}]}}).logs.d;
 assert.deepEqual(logs.map(x=>x.n),['a','b','c']);
 const many=[...Array(50)].map((_,i)=>({t:i,n:'x'+i}));assert.equal(C.mergePomolog(null,{days:{},logs:{d:many}},{days:{}}).logs.d.length,40);
});

test('jedrill: per day and per type, right never above tries',()=>{
 const m=C.mergeJEDrill({days:{'2026-11-18':{a:2,c:1}},tpl:{fifo:[2,1]}},{days:{'2026-11-18':{a:4,c:3}},tpl:{fifo:[4,3]}},{days:{'2026-11-18':{a:3,c:1},'2026-11-19':{a:1,c:1}},tpl:{fifo:[3,1],lcm:[1,0]}});
 assert.deepEqual(m.days,{'2026-11-18':{a:5,c:3},'2026-11-19':{a:1,c:1}});assert.deepEqual(m.tpl,{fifo:[5,3],lcm:[1,0]});
 for(const x of Object.values(m.days))assert.ok(x.c<=x.a);
 const J=require('../scripts/study-je-drill.js');assert.deepEqual(J.normalize(m),m,'merged record passes the page validation');
});

test('home document carries them as _pomolog/_jedrill; studyos.home.v1 never gets them',()=>{
 assert.deepEqual(C.splitHome({tasks:[1],_pomolog:{days:{}},_jedrill:{days:{},tpl:{}}}),{home:{tasks:[1]},pomolog:{days:{}},jedrill:{days:{},tpl:{}}});
 const s=read('scripts/study-cloud.js');
 assert.match(s,/hx\._pomolog = mpo/);assert.match(s,/hx\._jedrill = mjd/);
 assert.match(s,/ls\.get\(POMOK\) !== praw \|\| ls\.get\(JDK\) !== jraw\) return 'retry'/);
 assert.match(s,/mergeHome\(hb && hb\.home \? bs\.home : null, splitHome\(lh\)\.home, rs\.home\)/);
 /* only sent when this device or the server has the data, so an empty device never creates them */
 assert.match(s,/if \(praw \|\| rs\.pomolog\)/);assert.match(s,/if \(jraw \|\| rs\.jedrill\)/);
 /* the Worker still accepts the document: home is any record */
 const w=read('experiments/prod-progress-cas/worker.mjs');assert.match(w,/homeValidator=x=>record\(x\)&&record\(x\.home\)&&record\(x\.grades\)/);
});

test('pages push changes: Pomodoro log, session notes and JE Drill call StudyCloud.dirty',()=>{
 assert.match(read('index.html'),/localStorage\.setItem\(POMOLOG,JSON\.stringify\(o\)\);window\.StudyCloud&&StudyCloud\.dirty\(\)/);
 assert.match(read('scripts/study-today-extras.js'),/addLog\([^;]*;window\.StudyCloud&&StudyCloud\.dirty\(\)/);
 const jd=read('je-drill.html');assert.match(jd,/study-cloud\.js\?v=6/);assert.match(jd,/StudyCloud\.dirty\(\)/);assert.match(jd,/studycloud:applied/);
});
