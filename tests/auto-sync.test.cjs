const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
for(const f of ['acc','eco','math','eng','zh']){
 test(f+'.html automatic sync is opt-in and CAS-guarded',()=>{
  const s=fs.readFileSync(__dirname+'/../'+f+'.html','utf8');
  assert.match(s,/AUTOK='study-sync-auto-v1'/);
  assert.match(s,/autoOn\(\)\?'ซิงก์อัตโนมัติเปิดอยู่'/);
  assert.match(s,/if\(auto&&!revision\)throw/,'refuses Worker without ETag');
  assert.match(s,/progressKeyName===LSK/,'refuses legacy Worker');
  assert.match(s,/dirty\(\)\{ if\(autoOn\(\)&&!applying&&autoReady\(\)\)/,'no timers unless enabled');
  assert.doesNotMatch(s,/intentionally local-only until explicit opt-in/);
 });
}
