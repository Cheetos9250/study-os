"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const pages=['index.html','flashcards.html','practice.html','hub.html','calendar.html','grades.html','acc.html','eco.html','math.html','eng.html','zh.html','progress-backup.html','progress-restore.html'];
test('Home Screen opens Study OS full screen, inside the site folder',()=>{
  const m=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
  assert.equal(m.display,'standalone');assert.equal(m.start_url,'./index.html');assert.equal(m.scope,'./');
  for(const i of m.icons){const png=fs.readFileSync(path.join(root,i.src));const [w]=i.sizes.split('x').map(Number);
    assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',i.src);assert.equal(png.readUInt32BE(16),w,i.src);}
});
test('every main page links the manifest and the iOS standalone meta',()=>{
  for(const p of pages){const h=fs.readFileSync(path.join(root,p),'utf8');
    assert.match(h,/<link rel="manifest" href="manifest\.webmanifest">/,p);
    assert.match(h,/<meta name="apple-mobile-web-app-capable" content="yes">/,p);
    assert.match(h,/<meta name="apple-mobile-web-app-title" content="Study OS">/,p);}
});
