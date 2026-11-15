const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const src=fs.readFileSync(path.join(__dirname,'..','acc.html'),'utf8');
const nums=s=>Number(s.replace(/[$,]/g,''));
test('bank rec errors part 2: 80 English questions, unique, arithmetic checks out',()=>{
  const m=src.match(/const BANKERR2_QUIZ=(\[[\s\S]*?\n\]);/); assert.ok(m);
  const Q=vm.runInNewContext(m[1]); assert.equal(Q.length,80);
  assert.equal(new Set(Q.map(q=>q[1])).size,80);
  for(const q of Q){ assert.equal(q[0],'c8'); assert.equal(q[2].length,4); assert.equal(new Set(q[2]).size,4); assert.equal(q[3],0);
    assert.doesNotMatch(JSON.stringify(q),/[฀-๿]/);
    const e=q[4].match(/^([\d,]+(?: [+−] [\d,]+)+) = ([\d,]+)\.$/);
    if(e){ const t=e[1].split(' '); let v=nums(t[0]); for(let i=1;i<t.length;i+=2) v+= (t[i]==='+'?1:-1)*nums(t[i+1]); assert.equal(v,nums(e[2]),q[1]); assert.equal(q[2][0],'$'+e[2],q[1]); }
  }
  assert.match(src,/id:'err-b'\+\(i\+21\)/);
});
