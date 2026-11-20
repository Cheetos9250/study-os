const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=path.join(__dirname,'..'),SRC=path.join(ROOT,'data','acc-questions');
test('acc question files are generated from data/acc-questions',()=>{
  const r=cp.spawnSync(process.execPath,[path.join(ROOT,'scripts','build-acc-questions.cjs'),'--check'],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
});
test('chapter files: unique ids, right chapter, valid rows',()=>{
  const seen=new Set(); let n=0;
  for(const f of fs.readdirSync(SRC).filter(f=>/^c\d+\.json$/.test(f))){
    for(const e of JSON.parse(fs.readFileSync(path.join(SRC,f),'utf8'))){ n++;
      assert.ok(!seen.has(e.id),'duplicate '+e.id); seen.add(e.id);
      const [cat,q,opts,right,exp]=e.row; assert.equal(cat,f.replace('.json',''),e.id);
      assert.ok(q&&Array.isArray(opts)&&opts.length>=2&&opts.length<=6,e.id); assert.ok(Number.isInteger(right)&&right>=0&&right<opts.length,e.id); assert.equal(new Set(opts).size,opts.length,e.id); assert.ok(typeof exp==='string'&&exp,e.id); }
  }
  assert.ok(n>=464,'bank has '+n);
});
test('ids used by saved answers still exist (main rows and every extra-set id)',()=>{
  const ids=new Set(); for(const f of fs.readdirSync(SRC).filter(f=>/^c\d+\.json$/.test(f))) for(const e of JSON.parse(fs.readFileSync(path.join(SRC,f),'utf8'))) ids.add(e.id);
  const meta=JSON.parse(fs.readFileSync(path.join(SRC,'_sets.json'),'utf8'));
  for(const s of meta.sets) for(let k=s.from;k<s.from+s.count;k++) assert.ok(ids.has(s.pre+k),s.pre+k);
  for(const i of [0,1,2,100,200,228]) assert.ok(ids.has(String(i)),'main row '+i);
});
