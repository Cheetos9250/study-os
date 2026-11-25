const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
test('operating-cycle repeat ps-17 stays hidden; the older pe-12 stays',()=>{
  const rows={};for(const r of JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','acc-questions','c5.json'),'utf8')))rows[r.id]=r;
  assert.strictEqual(rows['ps-17'].hide,true); assert.ok(!rows['pe-12'].hide);
});
