/* Drive question inbox, Apps Script side (owner, 25 Nov 2026): only recent files, newest first, capped, cached in the folder. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=fs.readFileSync(path.join(__dirname,'../workers/inbox/study-os-inbox.gs'),'utf8');
const DAY=86400000;
function md(subject,chapter,qs){return 'Subject: '+subject+'\nChapter: '+chapter+'\n'+qs.map(q=>'\n---\nQuestion: '+q+'\nA) a\nB) b\nC) c\nD) d\nAnswer: B\nExplanation: because.\n').join('');}
function world(files){
  const triggers=[],log=[];let created=[];
  const mk=(name,text,ageDays,mime)=>{const f={name,text,t:Date.now()-ageDays*DAY,mime:mime||'text/markdown'};
    f.getName=()=>f.name;f.getLastUpdated=()=>new Date(f.t);f.getMimeType=()=>f.mime;f.getBlob=()=>({getDataAsString:()=>f.text});f.setContent=s=>{f.text=s;f.t=Date.now();};return f;};
  const list=files.map(x=>mk(x[0],x[1],x[2],x[3]));
  const folder={getFiles:()=>{let i=0;return{hasNext:()=>i<list.length,next:()=>list[i++]};},
    getFilesByName:n=>{const m=list.filter(f=>f.name===n);let i=0;return{hasNext:()=>i<m.length,next:()=>m[i++]};},
    createFile:(n,s,mime)=>{const f=mk(n,s,0,mime);list.push(f);created.push(n);return f;},getUrl:()=>'https://drive/folder'};
  const ctx={DriveApp:{getFoldersByName:()=>({hasNext:()=>true,next:()=>folder}),createFolder:()=>folder},
    MimeType:{GOOGLE_DOCS:'docs',PLAIN_TEXT:'text/plain'},DocumentApp:{},Logger:{log:m=>log.push(m)},
    ScriptApp:{getProjectTriggers:()=>triggers,deleteTrigger:t=>triggers.splice(triggers.indexOf(t),1),
      newTrigger:fn=>({timeBased:()=>({everyMinutes:m=>({create:()=>triggers.push({getHandlerFunction:()=>fn,m})})})})},
    ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({s,setMimeType:()=>({s})})},JSON,Date,Object,String,Number,Math,Array};
  vm.createContext(ctx);vm.runInContext(SRC,ctx);
  return {ctx,list,triggers,created,get:e=>JSON.parse(ctx.doGet(e).s)};
}
test('only files changed in the last 7 days are read, newest file first, repeats keep the newest copy',()=>{
  const w=world([['old.md',md('Accounting','06 Inventory',['Old one?']),9],['mid.md',md('Accounting','06 Inventory',['Mid one?','Shared?']),3],['new.md',md('Accounting','06 Inventory',['New one?','Shared?']),0.1],['note.pdf','x',0.1,'application/pdf']]);
  const j=w.get({parameter:{fresh:'1'}});
  assert.deepEqual(j.rows.map(r=>r.Question),['New one?','Shared?','Mid one?']);assert.equal(j.files,3);assert.equal(j.errors.length,0);
});
test('rows are capped at MAX_ROWS, newest first, and total says how many there were',()=>{
  const qs=Array.from({length:60},(_,i)=>'Question number '+i+'?');
  const w=world([['a.md',md('Economics','Macro · GDP',qs),0.2]]);w.ctx.MAX_ROWS=25;
  const j=w.get({parameter:{fresh:'1'}});assert.equal(j.rows.length,25);assert.equal(j.total,60);
});
test('the answer is cached in _inbox-cache.json and served from it until ?fresh=1',()=>{
  const w=world([['a.md',md('Accounting','05 Merchandising',['First?']),0.1]]);
  assert.equal(w.get().rows.length,1);assert.deepEqual(w.created,['_inbox-cache.json']);
  w.list[0].text=md('Accounting','05 Merchandising',['First?','Second?']);   // the folder changes after the cache was written
  assert.equal(w.get().rows.length,1,'fresh cache is served, not rebuilt');
  assert.equal(w.get({parameter:{fresh:'1'}}).rows.length,2,'fresh=1 rebuilds');
  assert.equal(w.created.length,1,'the cache file is updated in place, not duplicated');
});
test('a stale cache (older than 15 minutes) is rebuilt on request; the cache file is never parsed as questions',()=>{
  const w=world([['a.md',md('Accounting','05 Merchandising',['First?']),0.1]]);w.get();
  const c=w.list.find(f=>f.name==='_inbox-cache.json');c.t=Date.now()-20*60000;
  w.list[0].text=md('Accounting','05 Merchandising',['First?','Again?']);
  assert.equal(w.get().rows.length,2);assert.ok(!w.get({parameter:{fresh:'1'}}).errors.length);
});
test('setup creates the folder and exactly one 10-minute refresh trigger, even when run twice',()=>{
  const w=world([]);w.ctx.setup();w.ctx.setup();
  assert.equal(w.triggers.length,1);assert.equal(w.triggers[0].getHandlerFunction(),'refresh');assert.equal(w.triggers[0].m,10);
});
test('a failure comes back as JSON with an error, not a crash',()=>{
  const w=world([]);w.ctx.DriveApp.getFoldersByName=()=>{throw new Error('no drive');};
  const j=w.get();assert.deepEqual(j.rows,[]);assert.match(j.errors[0],/no drive/);
});
