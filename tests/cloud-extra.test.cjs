"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../scripts/study-cloud.js'),read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('Excel: steps and answers from both devices are kept',()=>{
 const base={done:{a1:true},ans:{x1:2}};
 const m=C.mergeExcel(base,{done:{a1:true,a2:true},ans:{x1:2,x2:0}},{done:{a1:true,b1:true},ans:{x1:2,x3:1}});
 assert.deepEqual(m.done,{a1:true,a2:true,b1:true});assert.deepEqual(m.ans,{x1:2,x2:0,x3:1});
 assert.deepEqual(C.mergeExcel(null,{},{done:{a1:true}}).done,{a1:true},'first sync on a new device');
});
test('PDF sets: answers, key and page notes merge per item; a set added on one device is kept',()=>{
 const set=(ans,key,notes)=>({name:'Quiz 3',n:20,subject:'acc',ans,key,notes});
 const base={sets:{p1:set({1:'a'},{1:'a'},{})}};
 const local={sets:{p1:set({1:'a',2:'b'},{1:'a'},{3:'page 3 note'})}};
 const remote={sets:{p1:set({1:'a',5:'c'},{1:'a',2:'b'},{}),p2:set({},{},{})}};
 const m=C.mergePdfSets(base,local,remote);
 assert.deepEqual(m.sets.p1.ans,{1:'a',2:'b',5:'c'});assert.deepEqual(m.sets.p1.key,{1:'a',2:'b'});assert.deepEqual(m.sets.p1.notes,{3:'page 3 note'});
 assert.ok(m.sets.p2,'set from the other device');
});
test('Textbook answers: per exercise; the newer edit wins when both changed (journal and statement rows ride along)',()=>{
 const base={'QS-9-2':{notes:'a',updated:'2026-11-17T01:00:00Z'}};
 const local={'QS-9-2':{notes:'b',updated:'2026-11-17T03:00:00Z',je:[['Day','Cash','3510','']]},'QS-9-26':{fs:[['Sales','1','']],updated:'2026-11-17T02:00:00Z'}};
 const remote={'QS-9-2':{notes:'c',updated:'2026-11-17T02:00:00Z'},'E-5-21':{notes:'x',updated:'2026-11-16T00:00:00Z'}};
 const m=C.mergeTextbook(base,local,remote);
 assert.equal(m['QS-9-2'].notes,'b');assert.deepEqual(m['QS-9-2'].je,[['Day','Cash','3510','']]);assert.ok(m['QS-9-26']&&m['E-5-21']);
});
test('client: extra subject after home, skipped while the Worker answers 404; Excel and PDF sets pages sync',()=>{
 const s=read('scripts/study-cloud.js');
 assert.match(s,/list\.push\(\{ id: 'extra' \}\);/);
 assert.match(s,/if \(r\.status === 404 && \(s\.id === 'home' \|\| s\.id === 'extra'\)\) return false;/);
 assert.match(s,/EBASEK = 'study-sync-extra-base-v1'/);
 for(const f of ['excel.html','pdf-sets.html']){const h=read(f);assert.match(h,/<script src="scripts\/study-cloud\.js\?v=\d+"><\/script>/,f);assert.match(h,/StudyCloud\.dirty\(\)/,f);}
 assert.ok(!require('../scripts/study-progress-backup.js').keys.includes('study-sync-extra-base-v1'));
});
