/* Owner, 25 Nov 2026: the left sidebar stays put. Its rubber-band colour pads must not add scroll height. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const js=fs.readFileSync(path.join(__dirname,'../scripts/study-nav.js'),'utf8');
test('sidebar pads are fixed, not absolute (absolute pads made the sidebar scroll a full screen)',()=>{
  assert.match(js,/#studyNav::before,#studyNav::after\{content:"";position:fixed;left:0;width:224px/);
  assert.doesNotMatch(js,/#studyNav::before,#studyNav::after\{content:"";position:absolute/); });
test('sidebar never scrolls and its item height follows the visible height',()=>{
  assert.match(js,/#studyNav\{overflow:hidden;overscroll-behavior:none;touch-action:none/);
  assert.match(js,/min-height:clamp\(30px,4\.2dvh,44px\)/); });
