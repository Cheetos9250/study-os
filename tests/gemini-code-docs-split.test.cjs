/* Code Docs stay small enough for one setText (owner hit "Document service stopped" at ~475,000 chars, 24 Nov 2026). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','workers/gemini-mcp/study-os-doc.gs'),'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(src,ctx);
test('every part is at most 100,000 characters, a huge file is split into pieces, and nothing is lost',()=>{
  const big='x'.repeat(250000),files=[{path:'a.html',text:'a'.repeat(60000)},{path:'big.js',text:big},{path:'c.css',text:'c'.repeat(70000)}];
  const parts=ctx.codeParts('pages',files);
  for(const p of parts)assert.ok(p.text.length<=100000,p.name+' '+p.text.length);
  assert.ok(parts.every(p=>/\(\d+\/\d+\)$/.test(p.name)));
  const joined=parts.map(p=>p.text).join('');
  assert.equal((joined.match(/x/g)||[]).length,250000,'whole big file kept');
  assert.match(joined,/FILE: big\.js \(piece 1\/3\)/);
  assert.ok(parts.some(p=>p.paths.includes('big.js')));
});
