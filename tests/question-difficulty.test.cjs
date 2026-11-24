const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const D=require('../scripts/study-qdiff.js');
test('short definitions are Easy, computing with several amounts is harder, error effects are Hard',()=>{
  assert.equal(D.level({q:'What is a contra-revenue account?',opts:['Sales returns','Sales','Cash','Inventory']}),'Easy');
  assert.equal(D.level({q:'Equipment costs 26,000, residual value is 8,000 and useful life is 48 months. Monthly depreciation?',opts:['375','500','542','250']}),'Medium');
  assert.equal(D.level({q:'A bookkeeper mistakenly recorded a $1,500 Freight-Out payment as a debit to Inventory. If 60% was sold and 40% remains, how are Gross Profit and Net Income affected?',opts:['Gross Profit is overstated by $600; Net Income is understated by $600','Gross Profit is understated by $900; Net Income is overstated by $600','Both understated by $900','Gross Profit understated by $1,500; Net Income unaffected']}),'Hard');
});
test('the level is fixed by the question and every bank question gets one of three levels',()=>{
  const q={q:'Book balance $7,950; NSF check $300; service charge $25. Adjusted book balance?',opts:['7,625','7,950','8,275','7,925']};
  assert.equal(D.level(q),D.level(JSON.parse(JSON.stringify(q))));
  const seen={};const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../data/courses/acc.js'),'utf8')+';this.D=D',ctx);
  for(const r of ctx.D.quiz){const l=D.level({q:r[1],opts:r[2]});assert.ok(['Easy','Medium','Hard'].includes(l));seen[l]=1;}
  assert.deepEqual(Object.keys(seen).sort(),['Easy','Hard','Medium']);
  for(const c of['acc','eco','math'])assert.match(fs.readFileSync(path.join(__dirname,'..',c+'.html'),'utf8'),/study-qdiff\.js\?v=\d+/);
});
