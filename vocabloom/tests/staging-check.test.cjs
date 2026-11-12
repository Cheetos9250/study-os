const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const html=readFileSync(join(__dirname,'..','staging-check.html'),'utf8');

test('browser staging checker script parses',()=>{
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script,'inline script missing');
 assert.doesNotThrow(()=>new vm.Script(script[1],{filename:'staging-check.html'}));
});
test('staging checker cannot fetch production or persist secret',()=>{
 assert.match(html,/https:\/\/study-api-cas-staging-only\.kasidit09022550\.workers\.dev/);
 assert.doesNotMatch(html,/study-api\.kasidit09022550\.workers\.dev/);
 assert.match(html,/connect-src https:\/\/study-api-cas-staging-only\.kasidit09022550\.workers\.dev/);
 assert.doesNotMatch(html,/(?:localStorage|sessionStorage|document\.cookie|sendBeacon|XMLHttpRequest|WebSocket|console\.log)\s*[\.(]/);
 assert.doesNotMatch(html,/https:\/\/(?:[^"'<> ]+)\.notion\./);
});
test('browser staging checker uses read-only subject routes and isolated probe writes',()=>{
 assert.match(html,/\/__staging\/health/);
 assert.match(html,/\/__staging\/probe\//);
 assert.match(html,/const SUBJECTS=\['acc','eco','math','eng','zh'\]/);
 assert.match(html,/getRandomValues\(new Uint8Array\(12\)\)/);
 assert.match(html,/if\(method==='PUT'\)/);
 assert.match(html,/headers\['If-Match'\]=etag/);
 assert.match(html,/method==='PUT'\?JSON\.stringify\(body\):undefined/);
 assert.match(html,/secret\.value='';readPassed=false/);
 assert.match(html,/credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'/);
});
