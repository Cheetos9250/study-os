"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const S=require('../scripts/study-stats.js'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const B=require('../scripts/study-progress-backup.js'),R=require('../scripts/study-progress-restore.js');
const NOW=Date.UTC(2026,10,17,5,0,0); // 17 Nov 12:00 Bangkok
test('answers per day use the last answer time; cleared answers are skipped',()=>{
 const m=S.answersPerDay([JSON.stringify({ans:{1:0,2:1,3:2},ats:{1:NOW,2:NOW-864e5,3:NOW-2*864e5},rst:NOW-1.5*864e5}),null,'bad']);
 assert.deepEqual(m,{'2026-11-17':1,'2026-11-16':1});
});
test('streak counts back from today, or from yesterday when today is still empty',()=>{
 const a={'2026-11-16':3,'2026-11-15':1},p={'2026-11-14':25};
 assert.equal(S.streak(NOW,[a,p]),3);
 assert.equal(S.streak(NOW,[{...a,'2026-11-17':1},p]),4);
 assert.equal(S.streak(NOW,[{'2026-11-15':1}]),0);
 assert.deepEqual(S.tickDays(JSON.stringify({done:{e1:{c5:'2026-11-16'}},tasks:{'2026-11-17':{review:true}}})),{'2026-11-16':1,'2026-11-17':1});
 assert.equal(S.lastDays(NOW,30).length,30);assert.equal(S.lastDays(NOW,30)[29],'2026-11-17');
 assert.equal(S.niceMax(37),50);assert.equal(S.niceMax(3),4);
});
test('Pomodoro history is a new backed-up key with a label and restore validation',()=>{
 const k='studyos.pomolog.v1';
 assert.ok(B.keys.includes(k));assert.equal(B.labelForKey(k),'Pomodoro history');
 assert.match(read('progress-restore.html'),/"studyos\.pomolog\.v1"\) return "Pomodoro history"/);
 const mem=()=>{const m=new Map();return{getItem:x=>m.has(x)?m.get(x):null,setItem:(x,v)=>m.set(x,v),removeItem:x=>m.delete(x)};};
 const snap=v=>JSON.stringify({format:'study-os-progress-local-backup',version:1,origin:'https://x.test',createdAt:new Date().toISOString(),entries:{[k]:JSON.stringify(v)}});
 assert.deepEqual(R.restoreMissing(mem(),snap({days:{'2026-11-17':50},lastEnd:1}),'https://x.test'),{restored:1,alreadyPresent:0});
 assert.throws(()=>R.plan(mem(),snap({days:{'17 Nov':50}}),'https://x.test'));
 assert.throws(()=>R.plan(mem(),snap({days:{'2026-11-17':-5}}),'https://x.test'));
 const s=read('index.html');
 assert.match(s,/function logPomo\(end,m,sub\)\{if\(m!==25\|\|!end\)return;/);
 assert.match(s,/if\(o\.lastEnd===end\)return;/,'one session counts once');
 assert.match(s,/logPomo\(endAt,m,psub\);left=0;stop\(\);/);assert.match(s,/else if\(s\.endAt\)\{logPomo\(s\.endAt,mins,psub\);/);
});
test('Stats page is linked from the nav footer and cached for offline use',()=>{
 assert.match(read('scripts/study-nav.js'),/\{href:'stats\.html',label:'Stats',icon:'stats'\}/);
 assert.match(read('sw.js'),/'stats\.html'/);
 const s=read('stats.html');
 assert.match(s,/<script src="scripts\/study-stats\.js\?v=\d+"><\/script>/);
 assert.doesNotMatch(s,/localStorage\.removeItem/);assert.deepEqual(s.match(/localStorage\.setItem\([^,]+/g),["localStorage.setItem('studyos.home.v1'"],'Stats only writes the weekly target');
});
