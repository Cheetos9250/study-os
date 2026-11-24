/* The practice stopwatch moves below the nav's running-Pomodoro pill (owner saw them overlap, 24 Nov 2026). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
test('stopwatch watches for #snPomo and moves below it',()=>{
  const s=fs.readFileSync(path.join(__dirname,'..','scripts/study-stopwatch.js'),'utf8');
  assert.match(s,/getElementById\('snPomo'\) \? 'calc\(56px \+ env\(safe-area-inset-top\)\)'/);
  assert.match(s,/new MutationObserver\(place\)\.observe\(document\.body, \{ childList: true \}\)/);
});
