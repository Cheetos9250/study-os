const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),cp=require('child_process'),path=require('path');
const root=path.join(__dirname,'..');
const F=()=>JSON.parse(fs.readFileSync(path.join(root,'data/formulas.json'),'utf8'));
test('formulas.json is up to date with the course data',()=>{
 const before=fs.readFileSync(path.join(root,'data/formulas.json'),'utf8');
 cp.execFileSync('node',[path.join(root,'scripts/build-formulas.cjs')],{stdio:'pipe'});
 const after=fs.readFileSync(path.join(root,'data/formulas.json'),'utf8');
 assert.strictEqual(after,before,'run node scripts/build-formulas.cjs and commit');
});
test('every formula line exists in the course data (nothing invented)',()=>{
 const f=F();
 for(const c of Object.keys(f.courses)){
  const D=new Function(fs.readFileSync(path.join(root,'data/courses',c+'.js'),'utf8')+';return D;')();
  const norm=s=>String(s).replace(/\*\*/g,'').replace(/\s+/g,' ').trim();
  const hay=norm(JSON.stringify([D.cards,D.sum]).replace(/\\n/g,' '));
  assert.ok(f.courses[c].items.length>10,c);
  for(const i of f.courses[c].items.filter(i=>!/\.pdf$/.test(i.ref)))for(const l of i.formula.split('\n'))assert.ok(hay.includes(norm(JSON.stringify(l).slice(1,-1))),c+': '+l);
 }
});
test('page, nav link',()=>{
 assert.match(fs.readFileSync(path.join(root,'formulas.html'),'utf8'),/data\/formulas\.json/);
 assert.match(fs.readFileSync(path.join(root,'scripts/study-nav.js'),'utf8'),/formulas\.html/);
});
test('slide-PDF formulas carry their PDF name',()=>{
 const s=JSON.parse(fs.readFileSync(path.join(root,'data/formulas-slides.json'),'utf8'));
 for(const c of Object.keys(s).filter(k=>k!=='note'))for(const e of s[c]){assert.ok(e.ch&&e.title&&e.formula&&/\.pdf$/.test(e.ref),e.title);}
 assert.ok(F().courses.eco.items.filter(i=>/\.pdf$/.test(i.ref)).length===s.eco.length);
});
