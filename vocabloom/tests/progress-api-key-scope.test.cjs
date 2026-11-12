'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');
const ROOT=join(__dirname,'../..');
const read=path=>readFileSync(join(ROOT,path),'utf8');
const ORIGINAL='https://study-api.kasidit09022550.workers.dev';
const FUTURE='https://example-progress-worker.invalid';
const OLD_KEY='OLD_CONTENT_WORKER_SECRET_SHOULD_NOT_LEAK';
const NEW_KEY='NEW_PROGRESS_WORKER_SECRET';
const SUBJECTS=['acc.html','eco.html','math.html','eng.html','zh.html'];
function config(progress_api){
 return progress_api===null?{api:ORIGINAL}:{api:ORIGINAL,progress_api};
}
function fakeStorage(initial){
 const data=new Map(Object.entries(initial||{}));
 return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),
  removeItem:k=>data.delete(k)};
}
function unified(obj,storage){
 const full=read('vocabloom/unified-progress.js');
 const first=full.indexOf('async function cApiUrl(){');
 const last=full.indexOf('/* ETag/If-Match protects concurrent',first);
 assert.ok(first>=0&&last>first);
 const cloud={api:'',progressSplit:false,enabled:true};
 const ctx={CLOUD:cloud,CLOUD_KEY:'study-sync-key',CLOUD_PROGRESS_KEY:'study-sync-progress-key-v1',
  CLOUD_AUTO:'vocabloom-auto-sync-v1',CLOUD_AUTO_ENDPOINT:'vocabloom-auto-sync-endpoint-v1',cSafeGet:k=>storage.getItem(k),
  cSafeSet:(k,v)=>{storage.setItem(k,v);return true},
  fetch:async()=>({ok:true,json:async()=>obj})};
 vm.runInNewContext(full.slice(first,last)+
  '\nthis.actions={url:cApiUrl,key:cCloudKey,storageKey:cCloudStorageKey};',ctx,{timeout:1000});
 return {cloud,...ctx.actions};
}
function legacy(file,obj,storage){
 const full=read(file),first=full.indexOf("const LSK='study-sync-key'");
 const last=full.indexOf('  const say=',first);
 assert.ok(first>=0&&last>first);
 const ctx={localStorage:storage,fetch:async()=>({ok:true,json:async()=>obj})};
 vm.runInNewContext(full.slice(first,last)+
  '\nthis.actions={cfg,key,hdr,namespace:()=>progressKeyName};',ctx,{timeout:1000});
 return ctx.actions;
}
test('Live default route keeps original key and all previous enabled state',async()=>{
 const storage=fakeStorage({'study-sync-key':OLD_KEY,'study-sync-progress-key-v1':NEW_KEY});
 const v=unified(config(null),storage);
 assert.equal(await v.url(),ORIGINAL);
 assert.equal(v.cloud.progressSplit,false);
 assert.equal(v.cloud.enabled,true);
 assert.equal(v.key(),OLD_KEY);
 assert.equal(v.storageKey(),'study-sync-key');
 for(const file of SUBJECTS){
  const page=legacy(file,config(null),storage);
  assert.equal(await page.cfg(),ORIGINAL,file);
  assert.equal(page.namespace(),'study-sync-key');
  assert.equal(page.hdr()['X-Sync-Key'],OLD_KEY,file);
 }
});
test('Explicitly different progress_api only accepts a separate progress key; old key stays intact',async()=>{
 const storage=fakeStorage({'study-sync-key':OLD_KEY,'study-sync-progress-key-v1':NEW_KEY,
  'vocabloom-auto-sync-v1':'1'});
 const v=unified(config(FUTURE),storage);
 assert.equal(await v.url(),FUTURE);
 assert.equal(v.cloud.progressSplit,true);
 assert.equal(v.cloud.enabled,false);
 assert.equal(storage.getItem('vocabloom-auto-sync-v1'),'0');
 assert.equal(v.key(),NEW_KEY);
 assert.equal(v.storageKey(),'study-sync-progress-key-v1');
 assert.equal(storage.getItem('study-sync-key'),OLD_KEY);
 for(const file of SUBJECTS){
  const page=legacy(file,config(FUTURE),storage);
  assert.equal(await page.cfg(),FUTURE,file);
  assert.equal(page.namespace(),'study-sync-progress-key-v1');
  assert.equal(page.hdr()['X-Sync-Key'],NEW_KEY,file);
 }
});
test('Different endpoint without new key must never silently reuse old Production secret',async()=>{
 const storage=fakeStorage({'study-sync-key':OLD_KEY});
 const v=unified(config(FUTURE),storage);
 assert.equal(await v.url(),FUTURE);
 assert.equal(v.key(),'');
 assert.equal(storage.getItem('study-sync-key'),OLD_KEY);
 for(const file of SUBJECTS){
  const page=legacy(file,config(FUTURE),storage);
  assert.equal(await page.cfg(),FUTURE);
  assert.equal(page.key(),'');
  assert.equal(page.hdr()['X-Sync-Key'],'');
 }
});
test('Same URL in optional progress_api uses original key and does not disable auto sync',async()=>{
 const storage=fakeStorage({'study-sync-key':OLD_KEY,'vocabloom-auto-sync-v1':'1'});
 const v=unified(config(ORIGINAL+'/'),storage);
 assert.equal(await v.url(),ORIGINAL);
 assert.equal(v.key(),OLD_KEY);
 assert.equal(v.cloud.enabled,true);
 assert.equal(storage.getItem('vocabloom-auto-sync-v1'),'1');
 for(const file of SUBJECTS){
  const page=legacy(file,config(ORIGINAL+'/'),storage);
  assert.equal(await page.cfg(),ORIGINAL);
  assert.equal(page.hdr()['X-Sync-Key'],OLD_KEY);
 }
});
test('User-driven key changes/deletion route only to selected endpoint scope',()=>{
 const all=read('vocabloom/unified-progress.js');
 assert.match(all,/cSafeSet\(cCloudStorageKey\(\),k\.trim\(\)\)/);
 assert.match(all,/localStorage\.removeItem\(cCloudStorageKey\(\)\)/);
 assert.match(all,/const api=await cApiUrl\(\),key=cCloudKey\(\);/);
 assert.match(all,/if\(!key\)throw Error\(/);
 for(const file of SUBJECTS){
  const s=read(file);
  assert.match(s,/localStorage\.setItem\(progressKeyName,k\)/,file);
  assert.match(s,/localStorage\.removeItem\(progressKeyName\)/,file);
  assert.match(s,/btnEl\.onclick=async\(\)=>\{ await cfg\(\);/,file);
  assert.match(s,/const base=await cfg\(\);[\s\S]{0,220}if\(!key\(\)\)/,file);
 }
});
