'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../scripts/study-course-storage.js'),backup=require('../scripts/study-progress-backup.js');
const origin='https://cheetos9250.github.io';
function store(){const values=new Map(),blocked=new Set(),writes=[];return {values,blocked,writes,getItem:k=>values.has(k)?values.get(k):null,setItem(k,v){writes.push(k);if(blocked.has(k))throw Error('QuotaExceededError');values.set(k,v);}};}
test('course mapping permits only the actual three progress datasets',()=>{
 assert.deepEqual(core.courseKeys('acc','acc-flashcards-v1'),['study-acc','acc-flashcards-v1-srs','acc-flashcards-v1-typ']);
 for(const [course,mark] of [['__proto__','x'],['acc','wrong'],['other','x']])assert.throws(()=>core.courseKeys(course,mark),/Unknown/);
});
test('failed writes retain only the latest answer and can retry without editing',()=>{
 const s=store(),counts=[],g=core.createGuard(s,['study-acc'],n=>counts.push(n));s.blocked.add('study-acc');
 assert.equal(g.write('study-acc','old draft'),false);g.write('study-acc','latest draft');assert.equal(s.getItem('study-acc'),null);assert.equal(g.hasPending(),true);
 s.blocked.clear();assert.equal(g.retry(),true);assert.equal(s.getItem('study-acc'),'latest draft');assert.equal(g.hasPending(),false);assert.equal(counts.at(-1),0);
});
test('partial retry preserves remaining failed datasets',()=>{
 const s=store(),g=core.createGuard(s,['study-acc','acc-flashcards-v1-srs']);s.blocked.add('study-acc');s.blocked.add('acc-flashcards-v1-srs');
 g.write('study-acc','answer');g.write('acc-flashcards-v1-srs','schedule');s.blocked.delete('study-acc');assert.equal(g.retry(),false);assert.equal(s.getItem('study-acc'),'answer');assert.equal(g.hasPending(),true);
 s.blocked.clear();g.retry();assert.equal(s.getItem('acc-flashcards-v1-srs'),'schedule');assert.equal(g.hasPending(),false);
});
test('unsaved backup overlays pending raw data without changing storage or exporting secrets',()=>{
 const s=store();s.values.set('study-acc','old stored answer');s.values.set('study-eco','other course');s.values.set('study-sync-key','SECRET');s.blocked.add('study-acc');
 const g=core.createGuard(s,['study-acc']);g.write('study-acc','new unsaved answer');const before=[...s.values],writes=s.writes.length;
 const snapshot=g.snapshot(backup,origin,new Date('2026-11-13T16:00:00Z')),text=snapshot.text,json=JSON.parse(text);assert.equal(snapshot.partial,false);
 assert.equal(json.entries['study-acc'],'new unsaved answer');assert.equal(json.entries['study-eco'],'other course');assert.doesNotMatch(text,/SECRET/);assert.deepEqual([...s.values],before);assert.equal(s.writes.length,writes);assert.equal(g.hasPending(),true);assert.equal(backup.inspectSnapshot(text,origin).count,2);
});
test('invalid writes cannot touch credentials or create a pending secret',()=>{
 const s=store(),g=core.createGuard(s,['study-acc']);assert.throws(()=>core.createGuard(s,['study-sync-key']),/Invalid/);assert.throws(()=>g.write('study-sync-key','secret'),/Invalid/);assert.throws(()=>g.write('study-acc',{}),/Invalid/);assert.equal(g.hasPending(),false);assert.equal(s.writes.length,0);
});
test('all course writes use the guard while existing sync callbacks remain present',()=>{
 const fs=require('node:fs'),path=require('node:path');
 for(const course of ['acc','eco','math','eng','zh']){
  const html=fs.readFileSync(path.join(__dirname,'../'+course+'.html'),'utf8');
  assert.match(html,/study-course-storage\.js/);assert.match(html,/study-progress-backup\.js/);assert.match(html,/study-course-save\.css/);
  assert.match(html,/progressWrites\.write\(KEY,JSON\.stringify\(store\)\); window\.__xs&&window\.__xs\.dirty\(\)/);
  assert.match(html,/progressWrites\.write\(D\.markKey\+'-srs'/);assert.match(html,/progressWrites\.write\(D\.markKey\+'-typ'/);
 }
});

test('blocked reads still allow a clearly partial pending-only backup',()=>{
 const s=store();s.blocked.add('study-acc');const g=core.createGuard(s,['study-acc']);g.write('study-acc','pending raw answer');s.getItem=()=>{throw Error('Storage denied');};
 const result=g.snapshot(backup,origin,new Date('2026-11-13T16:00:00Z'));assert.equal(result.partial,true);assert.deepEqual(JSON.parse(result.text).entries,{'study-acc':'pending raw answer'});assert.equal(g.hasPending(),true);
});

test('a queued retry never overwrites another tab saved after the failure',()=>{
 const s=store();s.values.set('study-acc','original');const g=core.createGuard(s,['study-acc']);s.blocked.add('study-acc');g.write('study-acc','my draft');
 s.values.set('study-acc','other tab');s.blocked.clear();const writes=s.writes.length;
 assert.equal(g.retry(),false);assert.equal(s.values.get('study-acc'),'other tab');assert.equal(s.writes.length,writes);assert.equal(g.hasPending(),true);assert.equal(g.hasConflicts(),true);
 const saved=g.snapshot(backup,origin,new Date());assert.equal(JSON.parse(saved.text).entries['study-acc'],'my draft');assert.equal(s.values.get('study-acc'),'other tab');
 g.write('study-acc','my later draft');assert.equal(s.values.get('study-acc'),'other tab','editing does not bypass a conflict');assert.equal(JSON.parse(g.snapshot(backup,origin,new Date()).text).entries['study-acc'],'my later draft');
});
test('a stale page detects a conflict even without a preceding quota failure',()=>{
 const s=store(),first=core.createGuard(s,['study-acc']),second=core.createGuard(s,['study-acc']);
 assert.equal(first.write('study-acc','first tab'),true);assert.equal(second.write('study-acc','second tab'),false);assert.equal(s.getItem('study-acc'),'first tab');assert.equal(second.hasConflicts(),true);
});
test('an identical value saved elsewhere resolves pending state without another write',()=>{
 const s=store(),g=core.createGuard(s,['study-acc']);s.blocked.add('study-acc');g.write('study-acc','same');s.values.set('study-acc','same');
 const writes=s.writes.length;assert.equal(g.retry(),true);assert.equal(s.writes.length,writes);assert.equal(g.hasPending(),false);assert.equal(g.hasConflicts(),false);
});
test('partial retry saves independent datasets while retaining a conflict',()=>{
 const s=store(),g=core.createGuard(s,['study-acc','acc-flashcards-v1-srs']);s.blocked.add('study-acc');s.blocked.add('acc-flashcards-v1-srs');g.write('study-acc','quiz draft');g.write('acc-flashcards-v1-srs','schedule draft');
 s.values.set('study-acc','other quiz');s.blocked.clear();assert.equal(g.retry(),false);assert.equal(s.getItem('study-acc'),'other quiz');assert.equal(s.getItem('acc-flashcards-v1-srs'),'schedule draft');assert.equal(g.hasConflicts(),true);
});
test('unknown initial storage never overwrites data revealed after reads recover',()=>{
 const s=store();s.values.set('study-acc','existing');let denied=true;const get=s.getItem;s.getItem=k=>{if(denied)throw Error('Denied');return get(k);};const g=core.createGuard(s,['study-acc']);
 g.write('study-acc','new draft');assert.equal(s.writes.length,0);denied=false;assert.equal(g.retry(),false);assert.equal(s.getItem('study-acc'),'existing');assert.equal(g.hasConflicts(),true);
});
test('unrelated course changes do not block a local save',()=>{
 const s=store(),g=core.createGuard(s,['study-acc']);s.values.set('study-eco','other course');assert.equal(g.write('study-acc','answer'),true);assert.equal(s.getItem('study-eco'),'other course');assert.equal(g.hasConflicts(),false);
});
