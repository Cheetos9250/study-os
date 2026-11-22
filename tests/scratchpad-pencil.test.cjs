const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../scripts/study-scratch.js'),'utf8');
test('Apple Pencil writes without scrolling the page; fingers scroll once a pencil is used',()=>{
  assert.match(s,/touchType === 'stylus'/);
  assert.match(s,/addEventListener\('touchmove'[\s\S]*?preventDefault[\s\S]*?\{ passive: false \}/);
  assert.match(s,/if \(!fingerSet\) fingerDraw = false/);
  assert.match(s,/Finger: scrolls/);
  assert.doesNotMatch(s,/style\.touchAction = 'pan-y'/,'pan-y let the pencil scroll the page');
});
