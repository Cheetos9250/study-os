/* Owner, 25 Nov 2026: explanations say why the right answer is right, never why the other options are wrong. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..'),rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const A=require('../scripts/study-ask-inline.js');
test('accounting bank explanations have one paragraph',()=>{
  for(let c=1;c<=10;c++){ const f='data/acc-questions/c'+c+'.json'; if(!fs.existsSync(path.join(ROOT,f)))continue;
    for(const l of rd(f).split('\n')){ const s=l.trim().replace(/,$/,''); if(!s.startsWith('{'))continue; const o=JSON.parse(s); const e=o.row[4]||'';
      assert.doesNotMatch(e,/\n/,o.id); } } });
test('economics practice explanations have one paragraph',()=>{
  const ctx={window:{}}; vm.runInNewContext(rd('scripts/eco-practice-mcq.js'),ctx);
  for(const o of ctx.window.ECO_PRACTICE_MCQ) assert.doesNotMatch(o.exp||'',/\n/,o.id); });
test('no explanation lists a wrong number with its slip',()=>{
  const slip=/= (forgot|forgets|ignored|multiplied|divided|decimal slips|used|leaves out|counts only|adds|added)/;
  const ctx={window:{}}; vm.runInNewContext(rd('scripts/eco-practice-mcq.js'),ctx);
  for(const o of ctx.window.ECO_PRACTICE_MCQ) assert.doesNotMatch(o.exp||'',slip,o.id); });
test('Ask AI prompts ask only for the right answer',()=>{
  const q={q:'What is 2+2?',opts:['3','4','5','6'],right:1,exp:'Because.'};
  assert.match(A.prompt(q,2),/Do not explain why the other options/);
  assert.doesNotMatch(A.prompt(q,2),/goes wrong/);
  assert.match(A.prompt(q),/only why the correct option is right/); });
