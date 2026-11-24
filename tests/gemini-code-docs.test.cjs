/* Apps Script copies the public source code into Google Docs for Gemini (owner, 24 Nov 2026).
   Runs the real script with stubbed Google services and this checkout as the "GitHub" repo. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const root=path.join(__dirname,'..'),src=fs.readFileSync(path.join(root,'workers/gemini-mcp/study-os-doc.gs'),'utf8');
function run(sha){
  const files=cp.execSync('git ls-files',{cwd:root}).toString().trim().split('\n');
  const props={},docs={},fetched=[];
  const res=(code,text)=>({getResponseCode:()=>code,getContentText:()=>text});
  const ctx={
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null,setProperty:(k,v)=>{props[k]=v;},deleteProperty:k=>{delete props[k];}})},
    UrlFetchApp:{fetch:u=>{fetched.push(u);return res(200,JSON.stringify({sha,tree:files.map(p=>({type:'blob',path:p}))}));},
      fetchAll:reqs=>reqs.map(r=>{fetched.push(r.url);const p=decodeURIComponent(r.url.split('/main/')[1]);return res(200,fs.readFileSync(path.join(root,p),'utf8'));})},
    DocumentApp:{create:n=>{const id='d'+Object.keys(docs).length;docs[id]={name:n,text:''};return {getId:()=>id};},
      openById:id=>({getBody:()=>({setText:t=>{docs[id].text=t;}}),saveAndClose:()=>{},getUrl:()=>'u'})},
    Utilities:{formatDate:()=>'2026-11-24 10:00'},ScriptApp:{getProjectTriggers:()=>[],deleteTrigger:()=>{}},Logger:{log:()=>{}}};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  return {ctx,props,docs,fetched,files};
}
test('copies app code into Docs under the Google Docs size limit, with an index of every file',()=>{
  const {ctx,docs,props,files}=run('abc');ctx.refreshCode();
  const list=Object.values(docs),index=list.find(d=>d.name==='Study OS code – index');
  assert.ok(index,'index Doc');assert.ok(list.length>=6);
  for(const d of list)assert.ok(d.text.length<1000000,d.name+' is '+d.text.length+' chars');
  for(const f of ['scripts/study-course-engine.js','index.html','AGENTS.md','vocabloom/wordnest.js','assets/study-eink.css','workers/gemini-mcp/worker.mjs'])
    assert.ok(index.text.includes('  '+f),f+' in index');
  assert.ok(list.some(d=>d.text.includes('===== FILE: scripts/study-review.js =====')));
  for(const f of files.filter(p=>/^(data|tests)\/|^\.claude\/|CHANGELOG\.md$/.test(p)))assert.ok(!index.text.includes('  '+f+'\n'),f+' left out');
  assert.equal(props.CODE_SHA,'abc');
});
test('skips the copy when the repo has not changed, and needs no Study OS token',()=>{
  const r=run('same');r.ctx.refreshCode();const n=r.fetched.length;r.ctx.refreshCode();
  assert.equal(r.fetched.length,n+1,'second run only reads the tree');
  assert.doesNotMatch(src.slice(src.indexOf('Study OS code → Google Docs')),/STUDY_OS_TOKEN|Authorization/);
});
