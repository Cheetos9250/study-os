/* Everything Gemini reads goes into one Drive folder "Study OS for Gemini" (owner, 24 Nov 2026). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','workers/gemini-mcp/study-os-doc.gs'),'utf8');
test('gatherFiles creates the folder once and moves the Doc, the Sheet and the code Docs into it',()=>{
  const props={DOC_ID:'doc',SHEET_ID:'sheet',CODE_DOCS:JSON.stringify({'Study OS code – index':'c1','Study OS code – pages':'c2'})},parent={},created=[];
  const ctx={PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null,setProperty:(k,v)=>{props[k]=v;}})},
    DriveApp:{createFolder:n=>{created.push(n);return {getId:()=>'F',getUrl:()=>'u',isTrashed:()=>false};},getFolderById:id=>({getId:()=>id,getUrl:()=>'u',isTrashed:()=>false}),
      getFileById:id=>({getParents:()=>{let done=!parent[id];return {hasNext:()=>!done,next:()=>{done=true;return {getId:()=>parent[id]};}};},moveTo:f=>{parent[id]=f.getId();}})}};
  vm.createContext(ctx);vm.runInContext(src,ctx);
  ctx.gatherFiles();ctx.gatherFiles();
  assert.deepEqual(created,['Study OS for Gemini'],'folder made once');
  assert.equal(props.FOLDER_ID,'F');
  for(const id of ['doc','sheet','c1','c2'])assert.equal(parent[id],'F',id);
  assert.match(src,/function refresh\(\)[\s\S]*?refreshSheet\(\);\n  gatherFiles\(\);/);
  assert.match(src,/props\.setProperty\('CODE_DOCS', JSON\.stringify\(docs\)\);\n  gatherFiles\(\);/);
});
