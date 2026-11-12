'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','private-kv-capture.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const source=script?.slice(script.indexOf('function verifyRawKvValue('),script.indexOf("\nel('download').addEventListener"));
const subjects=['acc','eco','math','eng','zh'];
const namespace='0123456789abcdef0123456789abcdef';
function fixture(config={}){
 const rows=subjects.map(subject=>{
  const setting=config[subject]||{status:'absent'};
  return {dataset:{subject},querySelector:(type)=>
   type==='select'?{value:setting.status}:{value:setting.raw||''}};
 });
 const ctx={rows:{children:rows},TextEncoder,
  el:(name)=>name==='namespace'?{value:config.namespace||namespace}:null,
  MAX:900*1024,Date};
 vm.runInNewContext(source+'\nthis.validate=validate;this.readOriginalKvFile=readOriginalKvFile;',ctx,{timeout:1000});
 return ctx.validate;
}
test('Page uses no-network CSP and does not persist copied KV data',()=>{
 assert.ok(script);
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/form-action 'none'/);
 assert.doesNotMatch(script,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\b|\blocalStorage\b|\bsessionStorage\b|\bdocument\.cookie\b/);
 assert.doesNotMatch(script,/location\.(?:href|search|hash)|window\.open\s*\(/);
});
test('Manifest captures exactly five scoped keys; preserves raw text byte-for-byte',()=>{
 const raw=' { "study" : {"ans": {"32":0}}, "srs":{},"updated":123 } \n';
 const doc=fixture({acc:{status:'present',raw}})();
 assert.equal(doc.format,'vocabloom-production-kv-capture-v1');
 assert.equal(doc.version,1);
 assert.equal(doc.entries['progress:acc'],raw);
 assert.equal(doc.entries['progress:eco'],null);
 assert.equal(Object.keys(doc.entries).length,5);
 assert.equal(doc.namespaceId,namespace);
});
test('Missing, unchecked, partial and invalid values all fail closed',()=>{
 assert.throws(fixture({eco:{status:'unknown'}}),/ยังไม่ได้ตรวจ/);
 assert.throws(fixture({acc:{status:'present',raw:''}}),/ยังไม่ใส่ Raw JSON/);
 assert.throws(fixture({acc:{status:'present',raw:'{bad'}}),/ไม่ใช่ JSON/);
 assert.throws(fixture({acc:{status:'present',raw:'[]'}}),/JSON object/);
 assert.throws(fixture({acc:{status:'present',raw:'null'}}),/JSON object/);
 assert.throws(fixture({namespace:'not-the-binding-id'}),/Namespace ID/);
});
test('Refuses suspicious pasted secrets and oversized raw values',()=>{
 assert.throws(fixture({acc:{status:'present',raw:'{"SYNC_KEY":"secret"}'}}),/Secret/);
 const big='{"blob":"'+('x'.repeat(900*1024))+'"}';
 assert.throws(fixture({acc:{status:'present',raw:big}}),/เกินขนาด/);
});
test('Original KV file chooser accepts Cloudflare progress_acc with no extension',async()=>{
 const ctx={TextEncoder,MAX:900*1024};
 vm.runInNewContext(source+'\nthis.readOriginalKvFile=readOriginalKvFile;',ctx,{timeout:1000});
 const raw=' { "study":{"ans":{"32":0}}, "srs":{}, "updated":1794467041811 } ';
 const file={name:'progress_acc',size:new TextEncoder().encode(raw).length,text:async()=>raw};
 assert.equal(await ctx.readOriginalKvFile(file,'acc'),raw);
 const renamed={...file,name:'progress-acc-kv-original-2026-11-12.json'};
 assert.equal(await ctx.readOriginalKvFile(renamed,'acc'),raw);
});
test('File chooser rejects other subjects, cloud snapshot, secrets and unrecognizable names',async()=>{
 const ctx={TextEncoder,MAX:900*1024};
 vm.runInNewContext(source+'\nthis.readOriginalKvFile=readOriginalKvFile;',ctx,{timeout:1000});
 const get=(name,raw)=>({name,size:new TextEncoder().encode(raw).length,text:async()=>raw});
 await assert.rejects(ctx.readOriginalKvFile(get('progress_eco','{"updated":0}'),'acc'),/ชื่อไฟล์/);
 await assert.rejects(ctx.readOriginalKvFile(get('snapshot.json','{"updated":0}'),'acc'),/ชื่อไฟล์/);
 await assert.rejects(ctx.readOriginalKvFile(get('progress_acc','{"subjects":{}}'),'acc'),/Cloud Snapshot/);
 await assert.rejects(ctx.readOriginalKvFile(get('progress_acc','{"SYNC_KEY":"bad"}'),'acc'),/Secret/);
 await assert.rejects(ctx.readOriginalKvFile(get('progress_acc','not-json'),'acc'),/JSON/);
 await assert.rejects(ctx.readOriginalKvFile(get('progress_acc','[]'),'acc'),/JSON object/);
});
test('Never asks for staging SYNC_KEY or enables production writes',()=>{
 assert.doesNotMatch(html,/\b(?:If-Match|wrangler deploy|kv key put|kv key delete|PUT\s*\/progress)\b/);
 assert.match(html,/BLOCKED · ห้ามย้าย Production/);
 assert.match(script,/SUBJECTS=\['acc','eco','math','eng','zh'\]/);
 assert.match(script,/'progress:'\+subject/);
});
