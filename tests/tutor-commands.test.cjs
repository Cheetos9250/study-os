/* AI tutor: typed commands (/quiz 10 inventory, /explain, /summary, /example, /check, /mistakes, /plan, /new, /help). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const A=require('../scripts/study-tutor.js'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('commands parse with an optional number and topic',()=>{
  assert.deepEqual(A.command('/quiz 10 inventory costing'),{kind:'quiz',n:'10',topic:'inventory costing'});
  assert.deepEqual(A.command('/QUIZ'),{kind:'quiz',n:'',topic:''});
  assert.deepEqual(A.command(' /explain FIFO '),{kind:'explain',topic:'FIFO'});
  assert.deepEqual(A.command('/check Dr Cash 500\nCr Revenue 500'),{kind:'check',topic:'Dr Cash 500\nCr Revenue 500'});
  assert.deepEqual(A.command('/help'),{action:'help'});assert.deepEqual(A.command('/new'),{action:'new'});
  assert.deepEqual(A.command('/xyz'),{action:'unknown',name:'xyz'});
  assert.equal(A.command('What is 1/2?'),null);assert.equal(A.command('hello /quiz'),null);
});
test('prompts follow the command; quiz count is kept between 1 and 20',()=>{
  assert.match(A.quick('quiz',{n:'10',topic:'inventory'}),/จากเรื่อง inventory ทีละข้อ รวม 10 ข้อ/);
  assert.match(A.quick('quiz',{n:'99'}),/รวม 20 ข้อ/);
  assert.match(A.quick('summary',{chapter:'05 Merchandising',course:'Accounting'}),/^สรุปบท 05 Merchandising วิชา Accounting/);
  assert.match(A.quick('example',{topic:'GDP'}),/เรื่อง GDP 1 ข้อ/);
  assert.match(A.quick('check',{topic:'Dr Cash 500'}),/:\nDr Cash 500$/);
});
test('help lists every command; /help and /new stay on the device',()=>{
  const h=A.help();for(const c of A.COMMANDS)assert.ok(h.includes('| '+c[0]),c[0]);
  const p=R('tutor.html');
  assert.match(p,/const msgs=chat\.filter\(m=>!m\.error&&!m\.local\);/,'local help is never sent to the AI');
  assert.match(p,/runQuick\(cmd\.kind,\{n:cmd\.n,topic:cmd\.topic,show:t\}\)/);
  assert.match(p,/placeholder="Ask anything, or type \/help for commands/);
});
