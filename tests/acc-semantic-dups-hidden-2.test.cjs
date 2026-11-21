const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','data','acc-questions');
test('more reworded repeats (FOB shipping point, gross profit, sales/purchases journal, NSF, internal control) stay hidden',()=>{
  const rows={};for(const f of fs.readdirSync(dir).filter(x=>/^c\d+\.json$/.test(x)))for(const r of JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')))rows[r.id]=r;
  for(const id of ['ps-3','gd-4','gd-87','gd-2','ps-112','pe-50','gd-234','gd-125','x7-3','pe-62'])assert.strictEqual(rows[id].hide,true,id);
  for(const keep of ['pe-3','pe-21','20','28','brc-40','c8x-7','ps-114','29','x9-3'])assert.ok(!rows[keep].hide,'kept '+keep);
});
