"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('service worker: network first, versioned cache, skips config.json and other origins',()=>{
 const s=read('sw.js');
 assert.match(s,/const VERSION = 'studyos-v\d+'/);
 assert.match(s,/self\.skipWaiting\(\)/);assert.match(s,/self\.clients\.claim\(\)/);
 assert.match(s,/name\.startsWith\('studyos-'\) && name !== CACHE\) await caches\.delete\(name\)/);
 assert.match(s,/const SKIP = \/\\\/data\\\/config\\\.json\$\//);
 assert.match(s,/if \(!sameOrigin\(url\) \|\| SKIP\.test\(url\.pathname\)\) return false;/);
 assert.match(s,/if \(req\.method !== 'GET'\) return false;/);
 assert.doesNotMatch(s,/localStorage|indexedDB/i,'never touches study data');
 for(const f of ['index.html','acc.html','practice.html','calendar.html','data/quiz.json'])assert.ok(s.includes("'"+f+"'"),f+' precached');
 for(const m of s.matchAll(/'((?:[\w-]+\/)*[\w-]+\.(?:html|json|webmanifest))'/g))assert.ok(fs.existsSync(path.join(root,m[1])),m[1]+' exists');
});
test('every page registers it through the theme script, https only',()=>{
 const t=read('scripts/study-theme.js');
 assert.match(t,/location\.protocol==='https:'/);
 assert.match(t,/new URL\('\.\.\/sw\.js',cs\.src\)/);
});
