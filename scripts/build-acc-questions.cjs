#!/usr/bin/env node
/* Accounting question bank: one source file per chapter -> the two data files the site reads.

   Edit:   data/acc-questions/c1.json … c9.json   (one question per line)
   Build:  node scripts/build-acc-questions.cjs          writes data/courses/acc.js (quiz only) and data/courses/acc-extra.js
   Check:  node scripts/build-acc-questions.cjs --check  fails if the generated files are out of date
   Split:  node scripts/build-acc-questions.cjs --split  one-time: wrote the chapter files from the old data files

   Ids never change (saved answers use them):
     "0", "1" …        rows of D.quiz in data/courses/acc.js (the id is the row's position, so never remove or reorder)
     "<pre><n>"        rows of an extra set listed in data/acc-questions/_sets.json (err-1, err-b21, brc-5 …)
   New question: add a line at the END of its chapter file with the next free id — in the newest extra set
   (raise its "count" in _sets.json) or in a new set (give it a new prefix and a new seed). Hide a near-duplicate with "hide":true. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..'),SRC=path.join(ROOT,'data','acc-questions'),ACC=path.join(ROOT,'data','courses','acc.js'),EXTRA=path.join(ROOT,'data','courses','acc-extra.js');
const CATS=['c1','c2','c3','c4','c5','c6','c7','c8','c9'];
/* JSON with ", " and ": " separators and raw Unicode: the format the data files already use */
function py(x){ if(Array.isArray(x)) return '['+x.map(py).join(', ')+']';
  if(x&&typeof x==='object') return '{'+Object.keys(x).map(k=>JSON.stringify(k)+': '+py(x[k])).join(', ')+'}';
  return JSON.stringify(x); }
const read=f=>fs.readFileSync(f,'utf8');

function readOld(){
  const t=read(ACC),lines=t.split('\n'),i=lines.findIndex(l=>l.startsWith('const D = '));
  const D=JSON.parse(lines[i].slice(10).replace(/;\s*$/,''));
  const ctx={window:{}}; vm.runInNewContext(read(EXTRA),ctx);
  return {D,lines,i,X:ctx.window.StudyCourseExtra,extraText:read(EXTRA)};
}
function split(){
  const {D,lines,i,X,extraText}=readOld(); fs.mkdirSync(SRC,{recursive:true});
  const hide=new Set(X.hide||[]), by={}; CATS.forEach(c=>by[c]=[]);
  const add=(id,row)=>{ (by[row[0]]||(by[row[0]]=[])).push(Object.assign({id:String(id),row},hide.has(String(id))?{hide:true}:{})); };
  D.quiz.forEach((row,n)=>add(n,row));
  const setsMeta=[]; const labels=[...extraText.matchAll(/\/\*\s*([^*]+?)\s*\*\/\s*\{pre:/g)].map(m=>m[1]);
  X.sets.forEach((s,k)=>{ setsMeta.push(Object.assign({label:labels[k]||s.pre,pre:s.pre,from:s.from,seed:s.seed},s.case?{case:true}:{},{count:s.rows.length})); s.rows.forEach((row,n)=>add(s.pre+(n+s.from),row)); });
  const known=new Set(Object.values(by).flat().map(e=>e.id));
  const meta={accHeader:lines.slice(0,i).join('\n'),extraHeader:extraText.slice(0,extraText.indexOf('window.StudyCourseExtra')).replace(/\n$/,''),sets:setsMeta,hideElsewhere:(X.hide||[]).filter(h=>!known.has(String(h)))};
  fs.writeFileSync(path.join(SRC,'_sets.json'),JSON.stringify(meta,null,1)+'\n');
  for(const c of Object.keys(by)) fs.writeFileSync(path.join(SRC,c+'.json'),'[\n'+by[c].map(e=>' '+JSON.stringify(e)).join(',\n')+'\n]\n');
}
function load(){
  const meta=JSON.parse(read(path.join(SRC,'_sets.json'))),all=new Map();
  for(const f of fs.readdirSync(SRC).filter(f=>/^c\d+\.json$/.test(f)).sort()) for(const e of JSON.parse(read(path.join(SRC,f)))){
    if(all.has(e.id)) throw new Error('duplicate id '+e.id+' in '+f); if(e.row[0]!==f.replace('.json','')) throw new Error('id '+e.id+' is in '+f+' but its chapter is '+e.row[0]); all.set(e.id,e); }
  return {meta,all};
}
function build(){
  const {meta,all}=load();
  const main=[]; for(let n=0;all.has(String(n));n++) main.push(all.get(String(n)));
  const used=new Set(main.map(e=>e.id)), hide=main.filter(e=>e.hide).map(e=>e.id);
  const sets=meta.sets.map(s=>{ const rows=[]; for(let n=s.from;n<s.from+s.count;n++){ const e=all.get(s.pre+n); if(!e) throw new Error('missing id '+s.pre+n+' (set '+s.label+')'); used.add(e.id); rows.push(e.row); if(e.hide) hide.push(e.id); } return {s,rows}; });
  for(const id of all.keys()) if(!used.has(id)) throw new Error('id '+id+' is not in D.quiz (ids 0..'+(main.length-1)+') or in any set of _sets.json');
  const t=read(ACC).split('\n'),i=t.findIndex(l=>l.startsWith('const D = ')); const D=JSON.parse(t[i].slice(10).replace(/;\s*$/,'')); D.quiz=main.map(e=>e.row); t[i]='const D = '+py(D)+';';
  const hideAll=[...hide,...(meta.hideElsewhere||[])];
  const ex=meta.extraHeader+'\nwindow.StudyCourseExtra={\nhide:'+py(hideAll)+',\nsets:[\n'+sets.map(({s,rows})=>'/* '+s.label+' */ {pre:'+JSON.stringify(s.pre)+',from:'+s.from+',seed:'+s.seed+(s.case?',case:true':'')+',rows:[\n'+rows.map(r=>JSON.stringify(r)).join(',\n')+'\n]}').join(',\n')+'\n]};\n';
  return {acc:t.join('\n'),extra:ex};
}
const mode=process.argv[2];
if(mode==='--split') split();
else{ const out=build();
  if(mode==='--check'){ if(read(ACC)!==out.acc||read(EXTRA)!==out.extra){ console.error('data/courses/acc.js or acc-extra.js is out of date: run node scripts/build-acc-questions.cjs'); process.exit(1); } console.log('acc question files are up to date'); }
  else { fs.writeFileSync(ACC,out.acc); fs.writeFileSync(EXTRA,out.extra); console.log('built data/courses/acc.js and acc-extra.js'); } }
module.exports={py};
