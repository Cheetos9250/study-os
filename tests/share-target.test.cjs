"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('manifest: share_target posts images to tutor.html inside scope',()=>{
 const m=JSON.parse(read('manifest.webmanifest')),s=m.share_target;
 assert.equal(s.method,'POST');assert.equal(s.enctype,'multipart/form-data');
 assert.equal(s.action,'tutor.html?share=1');assert.ok(fs.existsSync(path.join(root,'tutor.html')));
 assert.deepEqual(s.params.files,[{name:'photo',accept:['image/*']}]);
});
function runSW(){
 const store=new Map(),listeners={};
 const self={location:{href:'https://x.test/study-os/sw.js',origin:'https://x.test'},addEventListener:(n,f)=>{listeners[n]=f;},clients:{claim(){}},skipWaiting(){}};
 const caches={async open(){return{async put(k,v){store.set(k,v);},async match(k){return store.get(k);},async delete(k){return store.delete(k);}};},async keys(){return[];}};
 vm.runInNewContext(read('sw.js'),{self,caches,URL,Response,fetch(){throw new Error('no network');}});
 return{store,listeners};
}
async function post(L,file,url='https://x.test/study-os/tutor.html?share=1'){
 const fd=new FormData();if(file)fd.append('photo',file);
 const req=new Request(url,{method:'POST',body:fd});let out;
 L.listeners.fetch({request:req,respondWith:p=>{out=p;}});return out&&await out;
}
test('sw: shared image is kept in a non-studyos cache and redirected',async()=>{
 const t=runSW(),r=await post(t,new Blob([Buffer.from('89504e47','hex')],{type:'image/png'}));
 assert.equal(r.status,303);assert.equal(r.headers.get('location'),'https://x.test/study-os/tutor.html?shared=1');
 const kept=t.store.get('shared-image');assert.ok(kept);assert.equal(kept.headers.get('content-type'),'image/png');
 assert.doesNotMatch(read('sw.js'),/SHARE_CACHE = 'studyos-/);
});
test('sw: non-image or missing file redirects to shared=0 and stores nothing',async()=>{
 const t=runSW();
 let r=await post(t,new Blob(['hi'],{type:'text/plain'}));assert.equal(r.headers.get('location'),'https://x.test/study-os/tutor.html?shared=0');
 r=await post(t,null);assert.equal(r.headers.get('location'),'https://x.test/study-os/tutor.html?shared=0');
 assert.equal(t.store.size,0);
});
test('sw: other POSTs are left to the browser',async()=>{
 const t=runSW();assert.equal(await post(t,new Blob(['x'],{type:'image/png'}),'https://x.test/study-os/other.html?share=1'),undefined);
});
test('tutor page reads the shared photo once and explains the iPad fallback',()=>{
 const h=read('tutor.html');
 assert.match(h,/caches\.open\('share-inbox-v1'\)/);assert.match(h,/c\.delete\('shared-image'\)/);
 assert.match(h,/iPad: use the Photo button/);assert.match(h,/id="photoBtn"/);
});
