"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('textbook answer box and backup file input have accessible names',()=>{
 const s=read('pdf-sets.html');
 assert.match(s,/<label class="ps-note" for="exAnswer">/);assert.match(s,/<textarea id="exAnswer"/);
 assert.match(s,/<input type="file" id="file"[^>]*aria-label="/);
});
test('Today card image button is a 44 px touch target',()=>{
 assert.match(read('index.html'),/\.subj \.pic\{position:absolute;top:8px;right:8px;min-width:44px;min-height:44px;/);
});
