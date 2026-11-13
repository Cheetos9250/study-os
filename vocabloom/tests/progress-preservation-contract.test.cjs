'use strict';
// Offline P1/P2 regression: pure merge behavior and backup safety contract.
// No production API, browser storage, secrets, or user data are accessed.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../unified-progress.js'),'utf8');
function extract(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Cannot locate '+start);
 return source.slice(a,b);
}
const merge=new Function(extract('function cMergeState(a,b){','function cApplySubject(d,merged){')+'\nreturn cMergeState;')();

test('SRS merge retains cards from both devices and newest revision for collisions',()=>{
 const local={study:{ans:{a:'yes'},ats:{a:100},known:['one'],rst:0},srs:{s:{a:{ts:100,due:200},local:{ts:50,due:90}},m:{day:2,newDone:1}}};
 const remote={study:{ans:{a:'no',b:'yes'},ats:{a:90,b:110},known:['two'],rst:0},srs:{s:{a:{ts:90,due:150},remote:{ts:70,due:100}},m:{day:2,newDone:3}}};
 const before=JSON.stringify({local,remote});
 const out=merge(local,remote);
 assert.deepEqual(out.study.ans,{a:'yes',b:'yes'});
 assert.deepEqual(out.study.known,['one','two']);
 assert.deepEqual(Object.keys(out.srs.s).sort(),['a','local','remote']);
 assert.equal(out.srs.s.a.due,200);
 assert.deepEqual(out.srs.m,{day:2,newDone:3});
 assert.equal(JSON.stringify({local,remote}),before,'Pure merge must not mutate its inputs');
});

test('SRS merge respects reset timestamp and later daily counters',()=>{
 const local={study:{ans:{old:'yes',fresh:'yes'},ats:{old:10,fresh:120},known:[],rst:100},srs:{s:{x:{ts:1}},m:{day:4,newDone:2}}};
 const remote={study:{ans:{old:'no',later:'yes'},ats:{old:20,later:130},known:[],rst:0},srs:{s:{x:{ts:2}},m:{day:5,newDone:1}}};
 const out=merge(local,remote);
 assert.deepEqual(out.study.ans,{fresh:'yes',later:'yes'});
 assert.equal(out.study.rst,100);
 assert.equal(out.srs.s.x.ts,2);
 assert.deepEqual(out.srs.m,{day:5,newDone:1});
});

test('Full restore rejects incomplete subject backups before user confirmation or writes',()=>{
 const body=extract('async function cFullRestore(file){','async function cForgetKey(){');
 assert.match(body,/payload\.version!==1/);
 assert.match(body,/for\(const d of USTATE\.decks\)/);
 assert.match(body,/!owns\(k1\)\|\|!owns\(k2\)/);
 assert.match(body,/throw Error\('ไม่มีข้อมูลวิชา '/);
 const validation=body.indexOf("throw Error('ไม่มีข้อมูลวิชา '");
 const confirmation=body.indexOf('window.confirm(');
 const firstWrite=body.indexOf('cSafeSet(key,value)');
 assert.ok(validation>=0&&confirmation>validation&&firstWrite>confirmation);
 assert.match(body,/saved=Object\.fromEntries/);
 assert.match(body,/localStorage\.removeItem\(key\)/);
 assert.match(body,/if\(oldData\)data=oldData/);
 assert.match(body,/ยังไม่ได้ส่งข้อมูลขึ้น Cloudflare/);
});

test('Full restore does not silently sync or overwrite endpoint credentials',()=>{
 const body=extract('async function cFullRestore(file){','async function cForgetKey(){');
 assert.doesNotMatch(body,/cCloudSync\(/);
 assert.doesNotMatch(body,/fetch\(/);
 assert.doesNotMatch(body,/CLOUD_KEY\s*\]/);
 assert.doesNotMatch(body,/CLOUD_PROGRESS_KEY\s*\]/);
 assert.match(body,/if\(CLOUD\.busy\)/);
});
