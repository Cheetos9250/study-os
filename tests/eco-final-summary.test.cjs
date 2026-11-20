'use strict';
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const T=require('../scripts/study-today.js');
const D=T.parseCourseData(fs.readFileSync(path.join(__dirname,'..','data/courses/eco.js'),'utf8'));
test('eco summary has the final-exam sections for GDP, business cycle, inflation, AD-AS and fiscal policy',()=>{
  const h=D.sum.map(s=>s.cat+':'+s.h).join('|');
  for(const k of ['g:GDP: นับอะไร','b:ตลาดแรงงาน','i:ใครได้ ใครเสีย','a:AS 3 ช่วง','f:Fiscal policy: เครื่องมือ'])assert.ok(h.includes(k),k);
  assert.ok(D.sum.every(s=>D.cats.some(c=>c[0]===s.cat)&&Array.isArray(s.rows)&&s.rows.every(r=>r.length===2&&r[0]&&r[1])));
});
test('key exam facts are in the summary text',()=>{
  const t=JSON.stringify(D.sum);
  for(const k of ['Real GDP ลดลงติดต่อกันอย่างน้อย **2 ไตรมาส','discouraged workers','Disinflation','Foreign purchases effect','tax multiplier = −3'.replace('tax','Tax')])assert.ok(t.includes(k)||t.includes(k.replace('Tax multiplier','tax multiplier')),k);
});
