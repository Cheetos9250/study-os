"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('focus mode is a screen setting, on unless turned off, applied in <head> and never backed up',()=>{
  const s=read('scripts/study-theme.js');
  assert.match(s,/FOCUS_KEY='studyos\.focus\.v1',focus=true/);assert.match(s,/focus=localStorage\.getItem\(FOCUS_KEY\)!=='off'/);
  assert.match(s,/if\(focus\)root\.classList\.add\('focus'\)/);
  assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('studyos.focus.v1'));
});
test('in focus mode the nav drops Flashcards and offers a toggle; Today and Lessons drop summary/card links and stats',()=>{
  const n=read('scripts/study-nav.js');
  assert.match(n,/if\(FOCUS&&t\.id==='cards'&&active!=='cards'\)return;/);assert.match(n,/class="sn-focus"/);
  const t=read('index.html');
  assert.match(t,/acts=\(FOCUS\?'':'<a href="'\+link\(c,'sum',t\.cat\)/);assert.match(t,/plan\.tasks=plan\.tasks\.filter\(t=>t\.kind!=='review'\)/);
  assert.match(t,/<b>'\+a\+'<\/b>done<\/div>/);
  const h=read('hub.html');assert.match(h,/classList\.contains\('focus'\)\?'<a class="main" href="'\+link\(c,'prac',id\)/);
  assert.match(h,/const verb=document\.documentElement\.classList\.contains\('focus'\)\?'Practise ':'Read '/);
});
