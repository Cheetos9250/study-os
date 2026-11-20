const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','data','acc-questions');
// Questions on topics the teacher's Ch5-9 slides do not cover (hidden 20 Nov 2026, ids kept, answers kept).
const HIDDEN='ps-199 ps-209 ps-210 ps-211 gd-194 gd-205 gd-224 c8x-6 gd-199 ps-195 gd-214 c8x-3 ps-216 gd-219 c8x-10 pe-56 ps-181 gd-203 ps-198 gd-204 c8x-8 pe-45 ps-180 gd-195 ps-197 x9-7 ps-258 gd-240 gd-253 gd-254 gd-269 gd-280 ps-84 gd-76 ps-270 gd-275 ps-99 gd-93 gd-170 ps-152 ps-278'.split(' ');
test('off-slide questions are hidden, not deleted',()=>{
  const rows={};
  for(const f of fs.readdirSync(dir).filter(f=>/^c\d+\.json$/.test(f)))for(const r of JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')))rows[r.id]=r;
  for(const id of HIDDEN){assert.ok(rows[id],id+' kept');assert.strictEqual(rows[id].hide,true,id+' hidden');}
});
test('hidden list has no duplicates',()=>assert.strictEqual(new Set(HIDDEN).size,HIDDEN.length));
