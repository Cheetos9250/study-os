'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../unified-progress.js'),'utf8');
function extract(a,b){const i=source.indexOf(a),j=source.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return source.slice(i,j)}
const code=extract('function cCloudRevision(response){','function cCloudDebounce(){');
async function scenario({revision='"1"',etag=null,manual=false,enabled=true,conflicts=0,consent=false,mutate=false}={}){
 const decks=[{key:'eng'}],calls={get:0,put:0,applied:0,confirm:0,headers:[],messages:[]};
 const CLOUD={busy:false,enabled,mode:'unknown',api:'https://staging.invalid',pending:false},USTATE={ready:true,decks},ui={page:'other'};
 let local={study:{ans:{local:1},ats:{local:100}},srs:{s:{},m:{day:0,newDone:0}}};
 const response=(status,body,headers={})=>({status,ok:status>=200&&status<300,headers:{get:k=>Object.hasOwn(headers,k)?headers[k]:null},json:async()=>body});
 const ctx={CLOUD,USTATE,ui,CLOUD_MAX_RETRIES:6,CLOUD_AUTO:'auto',CLOUD_LAST:'last',TextEncoder,Date,window:{confirm:()=>{calls.confirm++;return consent}},cCloudNotice:(msg,error)=>calls.messages.push({msg,error}),cApiUrl:async()=>CLOUD.api,cCloudKey:()=> 'FAKE_STAGING_KEY',cSafeSet:()=>true,cLocalSubject:()=>structuredClone(local),cShadowFromLocal:()=>{},cMergeState:(a,remote)=>({study:{ans:{...remote.study?.ans,...a.study.ans},ats:{...remote.study?.ats,...a.study.ats}},srs:a.srs}),cApplySubject:()=>{calls.applied++},render:()=>{},cCloudDebounce:()=>{},fetch:async(url,opts)=>{if(opts.method==='PUT'){calls.put++;calls.headers.push(opts.headers);if(calls.put<=conflicts)return response(412,{});if(mutate)local.study.ans.newer=2;return response(200,{})}calls.get++;return response(200,{study:{ans:{remote:1},ats:{remote:50}},srs:{s:{},m:{day:0,newDone:0}}},{...(revision!==null?{'X-Sync-Revision':revision}:{}),...(etag!==null?{'ETag':etag}:{})})}};
 const fn=new Function('ctx','manual',`with(ctx){${code};return cCloudSync(manual)}`);
 await fn(ctx,manual);
 return {calls,CLOUD,local};
}
test('CAS revision is attached to PUT and successful merge is applied',async()=>{
 const r=await scenario();assert.equal(r.calls.get,1);assert.equal(r.calls.put,1);assert.equal(r.calls.headers[0]['If-Match'],'"1"');assert.equal(r.calls.applied,1);assert.equal(r.CLOUD.mode,'cas');
});
test('CAS conflict 412 retries GET and does not overwrite local until successful retry',async()=>{
 const r=await scenario({conflicts:2});assert.equal(r.calls.get,3);assert.equal(r.calls.put,3);assert.equal(r.calls.applied,1);
});
test('Repeated CAS conflicts stop at retry ceiling without applying local changes',async()=>{
 const r=await scenario({conflicts:8});assert.equal(r.calls.get,6);assert.equal(r.calls.put,6);assert.equal(r.calls.applied,0);assert.equal(r.CLOUD.remoteStatus,'error');
});
test('Weak or malformed revisions fail closed before PUT',async()=>{
 for(const cfg of [{revision:'W/"1"'},{revision:'garbage'},{revision:null,etag:'W/"2"'}]){
 const r=await scenario(cfg);assert.equal(r.calls.put,0);assert.equal(r.calls.applied,0);assert.equal(r.CLOUD.remoteStatus,'error');
 }
});
test('Legacy backend refuses auto sync and requires explicit manual consent',async()=>{
 const auto=await scenario({revision:null});assert.equal(auto.calls.put,0);assert.equal(auto.CLOUD.enabled,false);
 const refused=await scenario({revision:null,manual:true,consent:false});assert.equal(refused.calls.confirm,1);assert.equal(refused.calls.put,0);
 const permitted=await scenario({revision:null,manual:true,consent:true});assert.equal(permitted.calls.confirm,1);assert.equal(permitted.calls.put,1);
});
test('Local answer changed during PUT prevents applying stale snapshot',async()=>{
 const r=await scenario({mutate:true});assert.equal(r.calls.applied,0);assert.equal(r.calls.get,6);assert.equal(r.CLOUD.remoteStatus,'error');assert.equal(r.local.study.ans.newer,2);
});
