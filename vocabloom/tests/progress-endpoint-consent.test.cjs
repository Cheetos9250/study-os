'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../unified-progress.js'),'utf8');
function extract(a,b){const i=src.indexOf(a),j=src.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return src.slice(i,j)}
const funcs=extract('async function cApiUrl(){','/* ETag/If-Match protects concurrent clients');
async function scenario({progressApi,storedConsent='',auto='1',token='FAKE_NEW_KEY',legacy='FAKE_OLD_KEY'}={}){
 const store=new Map([['auto',auto],['consent',storedConsent],['new-token',JSON.stringify({endpoint:'https://progress.test',key:token})],['legacy-token',legacy]]);
 const CLOUD={api:'',progressSplit:false,enabled:auto==='1'},writes=[],calls=[];
 const ctx={CLOUD,CLOUD_AUTO:'auto',CLOUD_AUTO_ENDPOINT:'consent',CLOUD_PROGRESS_KEY:'new-token',CLOUD_KEY:'legacy-token',cSafeGet:k=>store.get(k)||null,cSafeSet:(k,v)=>{writes.push([k,v]);store.set(k,v);return true},fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({api:'https://content.test',...(progressApi?{progress_api:progressApi}:{})})}}};
 const fn=new Function('ctx',`with(ctx){${funcs};return {resolve:cApiUrl,key:cCloudKey}}`);
 const api=fn(ctx);return {url:await api.resolve(),key:api.key(),CLOUD,writes,calls,store};
}
test('A newly split progress endpoint disables inherited Auto Sync before progress writes',async()=>{
 const r=await scenario({progressApi:'https://progress.test'});
 assert.equal(r.url,'https://progress.test');assert.equal(r.CLOUD.progressSplit,true);assert.equal(r.CLOUD.enabled,false);
 assert.deepEqual(r.writes,[['auto','0']]);assert.equal(r.key,'FAKE_NEW_KEY');
 assert.equal(r.calls.length,1);assert.equal(r.calls[0].url,'../data/config.json');
});
test('Explicit endpoint-specific consent is retained for the exact matching URL',async()=>{
 const r=await scenario({progressApi:'https://progress.test',storedConsent:'https://progress.test'});
 assert.equal(r.CLOUD.enabled,true);assert.deepEqual(r.writes,[]);
});
test('A new progress endpoint rejects tokens bound to a different URL',async()=>{
 const r=await scenario({progressApi:'https://another.test',storedConsent:'https://progress.test'});
 assert.equal(r.CLOUD.enabled,false);assert.equal(r.key,'');
});
test('Legacy content endpoint retains legacy credential behavior without modifying consent',async()=>{
 const r=await scenario();
 assert.equal(r.url,'https://content.test');assert.equal(r.CLOUD.progressSplit,false);
 assert.equal(r.key,'FAKE_OLD_KEY');assert.deepEqual(r.writes,[]);
});
test('Missing HTTPS endpoint fails closed without progress network requests',async()=>{
 const r=await scenario({progressApi:'http://insecure.test'}).catch(e=>({error:e}));
 assert.match(String(r.error?.message),/ไม่พบ Cloudflare API/);
});
