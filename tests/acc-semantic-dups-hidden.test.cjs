const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const IDS=['pe-2','gd-122','gd-182','gd-123','gd-133','gd-131','gd-1','pe-32','pe-4','pe-28','ps-59','gd-58','gd-68','ps-63','gd-177','gd-178','ps-110','gd-128','pe-61','173','gd-130','gd-124','gd-274'];
test('same-question repeats (reworded, same answer) stay hidden; the older one stays visible',()=>{
  const rows={};for(const f of fs.readdirSync(path.join(__dirname,'..','data','acc-questions')).filter(x=>/^c\d+\.json$/.test(x)))for(const r of JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','acc-questions',f),'utf8')))rows[r.id]=r;
  for(const id of IDS){assert.ok(rows[id],id);assert.strictEqual(rows[id].hide,true,id);}
  for(const keep of ['17','20','pe-1','27','74','pe-24','ps-71','26','c8x-1','c8x-2','x7-2','x9-2','35','ps-117','x7-5','ps-266','ps-109','ps-171','ps-112','ps-123','ps-118'])assert.ok(!rows[keep].hide,'kept '+keep);
});
