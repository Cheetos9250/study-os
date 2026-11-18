"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
test('My PDF sets written panel: answers with Textbook Exercises, tables for book exercises (no answer check)',()=>{
 const s=read('pdf-sets.html');
 assert.match(s,/const TBP='studyos\.accounting\.textbook\.progress\.v1';/);
 assert.match(s,/StudyJE\.mount\(\$\('pjeBox'\),\{answer:\[\],rows:rec\.bje\|\|\[\],noCheck:true/);
 assert.match(s,/StudyFS\.mount\(\$\('pfsBox'\),\{answer:\{title:tb\.title\|\|'Statement',rows:\[\]\},rows:rec\.bfs\|\|\[\],noCheck:true/);
 assert.match(s,/<script src="scripts\/je-grid\.js\?v=\d+"><\/script>\s*<script src="scripts\/fs-grid\.js\?v=\d+"><\/script>/);
 for(const f of ['scripts/je-grid.js','scripts/fs-grid.js']){const g=read(f);assert.match(g,/opts\.noCheck\?'':/,f);assert.match(g,/container-type:inline-size\}@container \(max-width:560px\)/,f);}
});
test('book tables are validated on restore',()=>{
 const R=require('../scripts/study-progress-restore.js');
 const snap=v=>JSON.stringify({format:'study-os-progress-local-backup',version:1,origin:'https://x.test',createdAt:new Date().toISOString(),entries:{'studyos.accounting.textbook.progress.v1':JSON.stringify(v)}});
 const mem=()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
 R.plan(mem(),snap({'QS-9-2':{bje:[['Day','Cash','3510','']],bfs:[['Sales','1','']]}}),'https://x.test');
 assert.throws(()=>R.plan(mem(),snap({'QS-9-2':{bje:[[1]]}}),'https://x.test'));
 assert.throws(()=>R.plan(mem(),snap({'QS-9-2':{bfs:'x'}}),'https://x.test'));
});
