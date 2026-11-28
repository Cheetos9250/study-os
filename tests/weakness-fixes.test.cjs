'use strict';
/* 28 Nov 2026 weakness fixes: storage meter, CSP on every page, "Report a problem" link, Notion box retired. */
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const rd=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const S=require('../scripts/study-storage.js');
function mem(o){const k=Object.keys(o);return{length:k.length,key:i=>k[i],getItem:x=>o[x]??null,setItem(){throw Error('write');},removeItem(){throw Error('delete');}};}
test('usage counts key + value as UTF-16 bytes, biggest first, never writes',()=>{
  const u=S.usage(mem({a:'xx',bigger:'y'.repeat(100)}));
  assert.strictEqual(u.bytes,(1+2+6+100)*2);assert.deepStrictEqual(u.top[0],['bigger',212]);assert.ok(u.ratio<S.WARN);
});
test('usage survives a storage that throws',()=>{assert.strictEqual(S.usage({get length(){throw Error('x');}}).bytes,0);});
test('fmt',()=>{assert.strictEqual(S.fmt(2048),'2 KB');assert.strictEqual(S.fmt(3*1048576),'3.00 MB');});
test('nav loads the storage warning; backup page shows the meter and stays read-only',()=>{
  assert.match(rd('scripts/study-nav.js'),/study-storage\.js\?v=1/);
  const b=rd('progress-backup.html');assert.match(b,/id="storage"/);assert.match(b,/study-storage\.js/);
  assert.doesNotMatch(b,/localStorage\.(?:setItem|removeItem)/);assert.match(b,/Not in this file/);
});
test('every user page has the script-src CSP and loads scripts only from allowed hosts',()=>{
  const pages=fs.readdirSync(path.join(__dirname,'..')).filter(f=>f.endsWith('.html')).concat(['vocabloom/index.html']);
  const ok=/^https:\/\/(cdnjs\.cloudflare\.com|accounts\.google\.com|apis\.google\.com)\//;
  for(const p of pages){const s=rd(p);
    assert.match(s,/http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline'/,p);
    assert.strictEqual((s.match(/Content-Security-Policy/g)||[]).length,1,p);
    for(const m of s.matchAll(/<script[^>]*\ssrc="(https?:[^"]+)"/g)) assert.match(m[1],ok,p+' '+m[1]);}
});
test('answered questions link to Feedback with the question filled in; feedback reads ?msg=',()=>{
  const e=rd('scripts/study-course-engine.js');assert.match(e,/function reportLink\(q\)/);assert.match(e,/askAI\(q,ch\)\)\+reportLink\(q\)/);
  assert.match(rd('feedback.html'),/get\('msg'\)/);
});
test('Notion save box is never shown',()=>{assert.match(rd('scripts/study-course-engine.js'),/Notion is retired[^\n]*\n\s*box\.hidden=true; return;/);});
