import {test} from 'node:test';
import assert from 'node:assert/strict';
import {syncOneSubject,CloudSyncError} from './client.mjs';

const initial=()=>({study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}});
const base={baseUrl:'https://staging.example',subject:'eng',syncKey:'FAKE_TEST_ONLY'};

test('client uses application revision when Cloudflare rewrites ETag to weak',async()=>{
 let local=initial(),calls=0,ifMatch=null;
 const fetchImpl=async(uri,opts)=>{
  calls++;
  if(opts.method==='GET')return new Response(JSON.stringify(initial()),{
   status:200,headers:{ETag:'W/"0"','X-Sync-Revision':'"0"'}
  });
  ifMatch=opts.headers['If-Match'];
  return new Response('{"ok":true}',{status:200,headers:{ETag:'W/"1"','X-Sync-Revision':'"1"'}});
 };
 local.srs.s.mine={ts:100,due:200};
 const result=await syncOneSubject({...base,loadLocal:()=>local,saveLocal:x=>{local=x},fetchImpl});
 assert.equal(calls,2);
 assert.equal(ifMatch,'"0"');
 assert.equal(result.revision,'"1"');
 assert.ok(local.srs.s.mine);
});

test('client refuses weak-only ETag instead of forging strong validator',async()=>{
 let calls=0;
 const fetchImpl=async()=>{
  calls++;
  return new Response(JSON.stringify(initial()),{status:200,headers:{ETag:'W/"0"'}});
 };
 await assert.rejects(syncOneSubject({...base,loadLocal:initial,saveLocal:()=>{},fetchImpl}),
  e=>e instanceof CloudSyncError&&/revision/.test(e.message));
 assert.equal(calls,1,'no PUT allowed without strong application revision');
});

test('malformed application revision fails closed, even if ETag looks strong',async()=>{
 let calls=0;
 const fetchImpl=async()=>{
  calls++;
  return new Response(JSON.stringify(initial()),{
   status:200,headers:{ETag:'"0"','X-Sync-Revision':'bad'}
  });
 };
 await assert.rejects(syncOneSubject({...base,loadLocal:initial,saveLocal:()=>{},fetchImpl}),
  /strong CAS revision/);
 assert.equal(calls,1);
});
