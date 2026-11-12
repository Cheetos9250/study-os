'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const pages=['acc.html','eco.html','math.html','eng.html','zh.html'];
const root=path.join(__dirname,'../..');
function iife(src){
 const start=src.lastIndexOf('window.__xs=(()=>{');
 const finish=src.lastIndexOf('})();');
 assert.ok(start>=0&&finish>start,'Legacy sync module was not found');
 return src.slice(start,finish+5);
}
function fixture(html,{hasKey=true,allow=true,putOK=true,versioned=false,conflicts=0,editDuringWrite=false}={}){
 const calls=[],storage=new Map();
 if(hasKey)storage.set('study-sync-key','QA_TEST_KEY');
 let confirmations=0,saveCount=0,promptCount=0,timerCount=0,visibilityHandlers=0,button=null,revision=0,remainingConflicts=conflicts,edited=false;
 let cloudState={study:{ans:{},ats:{},known:[],rst:0},srs:{s:{},m:{day:0,newDone:0}}};
 const nodes=[];
 const context={
  localStorage:{
   getItem:k=>storage.get(k)||null,
   setItem:(k,v)=>storage.set(k,String(v)),
   removeItem:k=>storage.delete(k)
  },
  window:{
   prompt(){promptCount++;return 'QA_TEST_KEY'},
   confirm(){confirmations++;return allow}
  },
  document:{
   body:{appendChild(el){nodes.push(el)}},
   createElement(tag){
    const el={tag,style:{},children:[],append(...children){this.children.push(...children)},setAttribute(){},textContent:'',onclick:null};
    if(tag==='button')button=el;
    return el;
   },
   addEventListener(){visibilityHandlers++},
   visibilityState:'visible'
  },
  fetch:async (url,opt={})=>{
   const method=opt.method||'GET';calls.push({url:String(url),method,headers:opt.headers||{}});
   if(url==='data/config.json')return {ok:true,status:200,json:async()=>({api:'https://worker-staging.invalid'})};
   if(!String(url).includes('/progress/'))throw Error('Unexpected URL '+url);
   if(method==='GET')return {ok:true,status:200,headers:{get:k=>versioned&&k.toLowerCase()==='etag'?'"'+revision+'"':null},json:async()=>JSON.parse(JSON.stringify(cloudState))};
   if(!putOK)return {ok:false,status:409};
   if(versioned){
    if(remainingConflicts>0){
     remainingConflicts--;revision++;cloudState.srs.s.external={ts:500,due:9000};
     return {ok:false,status:409};
    }
    if(opt.headers?.['If-Match']!=='"'+revision+'"')return {ok:false,status:409};
   }
   cloudState=JSON.parse(opt.body);revision++;
   if(editDuringWrite&&!edited){
    edited=true;context.srs['during-write']={ts:600,due:10000};
   }
   return {ok:true,status:200};
  },
  D:{key:'acc'},store:{ans:{0:1},ats:{0:123},rst:0,known:[]},
  srs:{local:{ts:123,due:10000}},meta:{day:0,newDone:0},
  save:()=>{saveCount++},saveS:()=>{saveCount++},
  buildDeck:()=>{},renderQ:()=>{},cardsRow:()=>{},renderCard:()=>{},renderSync:()=>{},
  shown:false,setTimeout:()=>{timerCount++},clearTimeout:()=>{},console
 };
 vm.createContext(context);
 new vm.Script(iife(html),{filename:'legacy-sync.js'}).runInContext(context);
 return {context,calls,storage,get saveCount(){return saveCount},get confirmations(){return confirmations},
 get promptCount(){return promptCount},get timerCount(){return timerCount},get visibilityHandlers(){return visibilityHandlers},
 get button(){return button},remote:()=>JSON.parse(JSON.stringify(cloudState)),async flush(){await new Promise(resolve=>setImmediate(resolve))}};
}
for(const filename of pages){
 const content=fs.readFileSync(path.join(root,filename),'utf8');
 test(filename+' keeps existing scores locally and sends no automatic Cloudflare progress writes',async()=>{
  const f=fixture(content);
  await f.flush();
  f.context.window.__xs.dirty();
  await f.context.window.__xs.sync(false);
  await f.flush();
  assert.equal(f.calls.filter(x=>x.url.includes('/progress/')).length,0);
  assert.equal(f.storage.get('study-sync-key'),'QA_TEST_KEY');
  assert.equal(f.context.store.ans[0],1);
  assert.equal(f.timerCount,0);
  assert.equal(f.visibilityHandlers,0);
  assert.match(f.button.textContent,/ด้วยตนเอง/);
 });
 test(filename+' requires explicit confirmation before manual GET and PUT',async()=>{
  const denied=fixture(content,{allow:false});
  await denied.flush();await denied.context.window.__xs.sync(true);
  assert.equal(denied.calls.filter(x=>x.url.includes('/progress/')).length,0);
  assert.equal(denied.confirmations,1);
  const accepted=fixture(content);
  await accepted.flush();await accepted.context.window.__xs.sync(true);
  const cloud=accepted.calls.filter(x=>x.url.includes('/progress/'));
  assert.deepEqual(cloud.map(x=>x.method),['GET','PUT']);
  assert.equal(accepted.confirmations,1);
  assert.equal(accepted.saveCount,2,'Local state should apply after confirmed remote PUT');
 });
 test(filename+' does not overwrite local state after rejected remote PUT',async()=>{
  const f=fixture(content,{putOK:false});
  await f.flush();await f.context.window.__xs.sync(true);
  const methods=f.calls.filter(x=>x.url.includes('/progress/')).map(x=>x.method);
  assert.deepEqual(methods,['GET','PUT']);
  assert.equal(f.saveCount,0);
  assert.equal(f.context.store.ans[0],1);
 });
}


for(const filename of pages){
 const content=fs.readFileSync(path.join(root,filename),'utf8');
 test(filename+' performs ETag/If-Match manual sync when backend supports revisions',async()=>{
  const f=fixture(content,{versioned:true});
  await f.flush();await f.context.window.__xs.sync(true);
  const puts=f.calls.filter(x=>x.method==='PUT');
  assert.equal(puts.length,1);
  assert.equal(puts[0].headers['If-Match'],'"0"');
  assert.equal(f.saveCount,2);
 });
 test(filename+' retries 409 conflicts and retains both device cards',async()=>{
  const f=fixture(content,{versioned:true,conflicts:1});
  await f.flush();await f.context.window.__xs.sync(true);
  assert.deepEqual(f.calls.filter(x=>x.url.includes('/progress/')).map(x=>x.method),['GET','PUT','GET','PUT']);
  assert.ok(f.remote().srs.s.local);
  assert.ok(f.remote().srs.s.external);
  assert.ok(f.context.srs.external);
 });
 test(filename+' does not overwrite a card answered during an in-flight PUT',async()=>{
  const f=fixture(content,{versioned:true,editDuringWrite:true});
  await f.flush();await f.context.window.__xs.sync(true);
  assert.ok(f.remote().srs.s['during-write']);
  assert.ok(f.context.srs['during-write']);
  assert.equal(f.calls.filter(x=>x.method==='PUT').length,2);
 });
}
