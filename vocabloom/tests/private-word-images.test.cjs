'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const images=require(path.join(root,'private-word-images.js'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const integrated=fs.readFileSync(path.join(root,'study-integration.js'),'utf8');
const media=fs.readFileSync(path.join(root,'private-word-images.js'),'utf8');
function blob(type,bytes){return new Blob([Uint8Array.from(bytes)],{type});}
test('Anime attachments use a stable word key shared by integrated cards and main vocabulary',()=>{
 assert.equal(images.keyFor('  ADVENTURE  '),images.keyFor('adventure'));
 assert.equal(images.keyFor('ＡＤＶＥＮＴＵＲＥ'),images.keyFor('adventure'));
 assert.equal(images.keyFor('ad\u200Bventure'),images.keyFor('adventure'));
 assert.equal(images.keyFor('two    words'),images.keyFor('two words'));
});
test('Reject non-images, SVG, spoofed media headers, empty or oversized images',async()=>{
 const png=[137,80,78,71,13,10,26,10,0,0,0,0];
 assert.equal(await images.validateImage(blob('image/png',png)),true);
 assert.equal(await images.validateImage(blob('image/jpeg',[255,216,255,0])),true);
 assert.equal(await images.validateImage(blob('image/webp',[82,73,70,70,0,0,0,0,87,69,66,80])),true);
 await assert.rejects(()=>images.validateImage(blob('image/svg+xml',[60,115,118,103])),/PNG, JPEG/);
 await assert.rejects(()=>images.validateImage(blob('image/png',[60,115,118,103])),/ไม่ตรง/);
 await assert.rejects(()=>images.validateImage(blob('image/jpeg',[])),/PNG, JPEG/);
 await assert.rejects(()=>images.validateImage(blob('image/png',new Array(2*1024*1024+1).fill(0))),/2 MB/);
});
test('Image UI is read-only in flashcards, lessons, games and library until user picks a local file',()=>{
 assert.match(html,/private-word-images\.js/);
 assert.ok(html.indexOf('private-word-images.js')<html.indexOf('study-integration.js'));
 assert.match(html,/class="word-thumb" type="button" data-private-word-image="/);
 assert.match(html,/class="voca-personal-lesson" data-private-word-image="/);
 assert.match(html,/class="game-visual" data-private-word-image="/);
 assert.match(html,/data-private-image-pick=/);
 assert.match(html,/data-private-image-remove=/);
 assert.match(integrated,/class="voca-integrated-photo" data-private-word-image="/);
 assert.match(integrated,/data-private-image-pick=/);
});
test('Personal images are only stored in IndexedDB and never written into progress, backup, service or GitHub',()=>{
 assert.match(media,/indexedDB\.open\(DB_NAME,1\)/);
 assert.match(media,/tx\.objectStore\(STORE\)\.put\(new Blob\(\[file\],\{type:file\.type\}\),key\)/);
 assert.match(media,/tx\.objectStore\(STORE\)\.delete\(key\)/);
 assert.doesNotMatch(media,/fetch\(|XMLHttpRequest|navigator\.sendBeacon|localStorage|sessionStorage|cloudSync|github\.com|notion\.so/i);
 assert.match(media,/image\/png','image\/jpeg','image\/webp/);
 assert.doesNotMatch(media,/image\/svg\+xml/);
});
