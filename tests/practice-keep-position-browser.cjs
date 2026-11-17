// Practice must stay on the current question when the question file loads late or cloud sync refreshes the page data.
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');const root=require('path').join(__dirname,'..');
const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0];const f=path.join(root,decodeURIComponent(u));if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
 const send=()=>{r.writeHead(200,{'content-type':{'.html':'text/html;charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css'}[path.extname(f)]||'x'});r.end(fs.readFileSync(f));};
 if(u==='/data/quiz.json')setTimeout(send,2500);else send();});
srv.listen(0,async()=>{const exe=['/usr/bin/google-chrome'].find(p=>fs.existsSync(p));const b=await chromium.launch(exe?{executablePath:exe}:{});let fail=0;const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fail++;};
 for(const pg of ['acc','eco','math']){const p=await b.newPage();await p.route(/fonts\.|workers\.dev/,r=>r.abort());
  await p.goto('http://127.0.0.1:'+srv.address().port+'/'+pg+'.html?tab=prac');await p.waitForSelector('#qBody .qcard');
  for(let i=0;i<4;i++)await p.click('#qnext');
  const q=()=>p.locator('.qmeta b').innerText();const before=await q();
  await p.waitForTimeout(3500); // questions file arrives
  ok(await q()===before,pg+': stays on '+before+' after the question file loads (now '+await q()+')');
  await p.evaluate(()=>{buildDeck(true);renderQ();}); // what cloud sync does after applying
  ok(await q()===before,pg+': stays after a sync refresh');
  await p.click('#qnext');ok(/^Q 6\//.test(await q()),pg+': Next still works');
  await p.close();}
 await b.close();srv.close();process.exit(fail);});
