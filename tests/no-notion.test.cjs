const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const COURSES=['acc','eco','math','eng','zh'];
const visible=s=>s.split('\n').filter(l=>l.length<20000&&!/^const (D|EMBQ)/.test(l)).join('\n');
test('course pages load cards/questions only from data/ (Notion retired)',()=>{
  for(const c of COURSES){
    const s=visible(R(c+'.html'));
    assert.doesNotMatch(s,/window\.claude\.use\("mcp"\)/,c);
    assert.doesNotMatch(s,/fetch\(api\+'\/'\+name\)/,c);
    assert.match(s,/fetch\('data\/'\+name\+'\.json'/,c);
    assert.match(s,/\nloadStatic\(\);/,c);
    assert.doesNotMatch(s,/Loaded live from Notion|· Notion '/,c);
  }
});
test('saved snapshots are still present so no cards or questions are lost',()=>{
  for(const n of ['quiz','cards']){ const j=JSON.parse(R('data/'+n+'.json')); assert.ok(Array.isArray(j.rows)&&j.rows.length>0,n); }
});
test('WordNest UI no longer mentions Notion',()=>{
  const s=visible(R('vocabloom/index.html'))+visible(R('vocabloom/study-integration.js'))+visible(R('vocabloom/unified-progress.js'));
  assert.doesNotMatch(s,/Notion Verified|synced with Notion|Notion tokens|Changes in Notion|Notion is never modified|sent to Notion/);
});
