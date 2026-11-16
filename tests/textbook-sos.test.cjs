const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const index=JSON.parse(R('data/accounting-textbook-index.json')).items;
const chapters=fs.readdirSync(path.join(__dirname,'..','data','textbook-sos')).filter(f=>/^ch\d\.json$/.test(f));
const num=s=>s?Number(s.replace(/,/g,'')):0;
test('rewritten textbook exercises: valid ids, English, prompt and solution present',()=>{
  assert.ok(chapters.includes('ch5.json'));
  for(const f of chapters){const ch=f.match(/\d/)[0];const list=JSON.parse(R('data/textbook-sos/'+f));
    const ids=new Set(index.filter(i=>i.chapter===ch).map(i=>i.id));
    assert.equal(new Set(list.map(x=>x.id)).size,list.length,f);
    for(const it of list){assert.ok(ids.has(it.id),f+' '+it.id);assert.ok(it.prompt.length>40&&it.solution.length>10,it.id);
      assert.doesNotMatch(it.prompt+it.solution,/[฀-๿]/,it.id);}}
});
test('every journal-entry table in the solutions balances',()=>{
  for(const f of chapters)for(const it of JSON.parse(R('data/textbook-sos/'+f))){const L=it.solution.split('\n');
    for(let i=0;i<L.length;i++){if(!L[i].startsWith('| Date | Account | Debit | Credit |'))continue;let dr=0,cr=0;i+=2;
      while(i<L.length&&L[i].startsWith('|')){const c=L[i].replace(/^\||\|$/g,'').split('|').map(x=>x.trim());dr+=num(c[2]);cr+=num(c[3]);i++;}
      assert.ok(Math.abs(dr-cr)<0.005,it.id+' '+dr+' vs '+cr);}}
});
test('textbook page shows the Study OS version instead of the PDF when one exists',()=>{
  const s=R('accounting-textbook.html');
  assert.match(s,/id="sosView"/);assert.match(s,/id="sosShow"/);assert.match(s,/data\/textbook-sos\/ch'\+ch\+'\.json/);
  assert.match(s,/renderList\(\);if\(!applySos\(q\)\)paint\(\);\}/);assert.match(s,/async function paint\(\)\{if\(sosActive\(\)\)return;/);
});
