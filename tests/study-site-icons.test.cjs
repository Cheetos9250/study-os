"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
test('Study OS pages expose the shared browser and iOS icons',()=>{
  for(const page of ['index.html','acc.html','eco.html','math.html','eng.html','zh.html','progress-backup.html']){
    const html=fs.readFileSync(path.join(root,page),'utf8');
    assert.match(html,/<link rel="icon" type="image\/x-icon" href="assets\/favicon.ico">/,page);
    assert.match(html,/<link rel="icon" type="image\/svg\+xml" href="assets\/favicon.svg">/,page);
    assert.match(html,/<link rel="apple-touch-icon" sizes="180x180" href="assets\/apple-touch-icon.png">/,page);
  }
});
test('icons contain valid local SVG, ICO and 180px PNG assets',()=>{
  const svg=fs.readFileSync(path.join(root,'assets/favicon.svg'),'utf8');
  assert.match(svg,/viewBox="0 0 64 64"/);assert.doesNotMatch(svg,/<script|foreignObject|href=|https?:\/\/(?!www.w3.org)/i);
  const ico=fs.readFileSync(path.join(root,'assets/favicon.ico'));
  assert.equal(ico.readUInt16LE(0),0);assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),3);
  const png=fs.readFileSync(path.join(root,'assets/apple-touch-icon.png'));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),180);assert.equal(png.readUInt32BE(20),180);
});
test('VocaBloom retains its separate existing icon',()=>{
  assert.match(fs.readFileSync(path.join(root,'vocabloom/index.html'),'utf8'),/href="\.\/favicon.svg"/);
});
