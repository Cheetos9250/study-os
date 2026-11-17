"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('Pomodoro end shows a red popup on Today and on other pages',()=>{
  const n=read('scripts/study-nav.js');
  assert.match(n,/function timesUp\(mins\)/);assert.match(n,/window\.StudyNav=\{TABS:TABS,active:active,timesUp:timesUp\}/);
  assert.match(n,/#snAlert \.sa-box\{background:#c21f2f/);assert.match(n,/role','alertdialog'/);
  assert.match(n,/if\(seen\)timesUp\(s\.mins\)/,'other pages: only when it ends while the page is open');
  assert.doesNotMatch(n,/localStorage|sessionStorage/);
  assert.match(read('index.html'),/StudyNav\.timesUp\(m\);return;\}/);
});
