"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=f=>fs.readFileSync(__dirname+'/../'+f,'utf8');
test('offline pill and update bar: loaded by the theme script, precached, store nothing, never reload by themselves',()=>{
  const o=read('scripts/study-offline.js');
  assert.match(read('scripts/study-theme.js'),/study-offline\.js/);
  assert.match(read('sw.js'),/'scripts\/study-offline\.js'/);
  assert.doesNotMatch(o,/localStorage|sessionStorage|indexedDB/);
  assert.match(o,/'controllerchange'/);assert.match(o,/navigator\.onLine === false/);
  assert.equal((o.match(/location\.reload\(\)/g)||[]).length,1,'only the Reload button reloads');
  assert.match(o,/3600000/,'update check at most hourly');
});
