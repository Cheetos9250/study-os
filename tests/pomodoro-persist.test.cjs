"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('Pomodoro keeps its end time so it keeps counting when you leave Today, and resumes on return',()=>{
  const s=read('index.html');
  assert.match(s,/function savePomo\(\)\{try\{localStorage\.setItem\(POMO_KEY,JSON\.stringify\(endAt\?\{mins,endAt\}:\{mins,left\}\)\);\}catch\{\}\}/);
  assert.match(s,/if\(s\.endAt&&s\.endAt>Date\.now\(\)\)\{endAt=s\.endAt;run\(\);\}/);
});
test('other pages show a countdown while it runs; the nav itself never touches storage',()=>{
  assert.match(read('scripts/study-theme.js'),/function pomo\(\)\{try\{var s=JSON\.parse\(localStorage\.getItem\('studyos\.pomo\.v1'\)/);
  const n=read('scripts/study-nav.js');assert.match(n,/a\.id='snPomo';a\.href='index\.html'/);assert.doesNotMatch(n,/localStorage|sessionStorage/);
});
