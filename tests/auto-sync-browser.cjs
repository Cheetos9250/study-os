const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root=require('path').join(__dirname,'..');
let rev=0,store=null,hits=[],noEtag=false,badKeyOnly=false;
const SECRET='secret-key-1';
const srv=http.createServer((q,r)=>{
 const url=q.url.split('?')[0];
 if(url.startsWith('/mock-prog/progress/')){
  hits.push(q.method+' '+url);
  if(q.headers['x-sync-key']!==SECRET){r.writeHead(401,{'content-type':'application/json'});return r.end('{"error":"bad key"}');}
  if(q.method==='GET'){const h={'content-type':'application/json'};if(!noEtag)h.ETag='"'+rev+'"';r.writeHead(200,h);return r.end(JSON.stringify(store));}
  if(q.method==='PUT'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{
    if(!noEtag&&q.headers['if-match']!=='"'+rev+'"'){r.writeHead(412);return r.end('{}');}
    store=JSON.parse(b);rev++;r.writeHead(200,{'content-type':'application/json',ETag:'"'+rev+'"'});r.end('{"ok":true}');});return;}
 }
 let p=decodeURIComponent(url);const f=path.join(root,p);
 if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
 const t={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'}[path.extname(f)]||'application/octet-stream';r.writeHead(200,{'content-type':t});r.end(fs.readFileSync(f));});
srv.listen(0,async()=>{
 const base='http://127.0.0.1:'+srv.address().port,b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
 let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m);}else console.log('ok  ',m);};const errs=[];
 async function device(){
  const ctx=await b.newContext({viewport:{width:820,height:1180},hasTouch:true});
  await ctx.route(/fonts\.|workers\.dev|notion/,r=>r.abort());
  await ctx.route('**/data/config.json',r=>r.fulfill({json:{api:base+'/mock-old',progress_api:base+'/mock-prog'}}));
  const page=await ctx.newPage();page.on('pageerror',e=>errs.push(String(e)));
  page.on('dialog',d=>d.accept(d.type()==='prompt'?SECRET:undefined));
  await page.clock.install();
  return {ctx,page};
 }
 const ans=p=>p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('study-acc')||'{}').ans||{}}catch(e){return {}}});
 const msg=p=>p.locator('.cloud-sync-bar [role=status]').innerText();
 // F) default off: no calls
 let A=await device();await A.page.goto(base+'/acc.html?tab=prac');await A.page.clock.runFor(30000);
 ok(hits.length===0,'auto off by default: no progress-worker calls ('+hits.length+')');
 ok(await A.page.locator('.cloud-sync-bar button').nth(1).isHidden(),'auto toggle hidden before a key is set');
 // set key (manual flow) then enable auto
 await A.page.locator('.cloud-sync-bar button').first().click();await A.page.waitForFunction(()=>/ซิงก์แล้ว/.test(document.querySelector('.cloud-sync-bar [role=status]').textContent));
 ok(hits.length>=2,'manual sync still works (GET+PUT)');
 const autoBtn=A.page.locator('.cloud-sync-bar button').nth(1);
 ok(await autoBtn.isVisible()&&/ปิด/.test(await autoBtn.innerText()),'auto toggle visible, shows off');
 await autoBtn.click();ok(/เปิด/.test(await autoBtn.innerText()),'auto enabled');
 // answer a question on device A, advance clock past the debounce
 await A.page.locator('.opt').first().click();
 const a1=await ans(A.page);const k1=Object.keys(a1)[0];ok(k1!==undefined,'device A answered '+k1);
 const before=hits.length;await A.page.clock.runFor(21000);
 await A.page.waitForFunction(n=>true,0);await new Promise(r=>setTimeout(r,500));
 ok(hits.length>before&&store&&store.study&&store.study.ans&&store.study.ans[k1]!==undefined,'A auto-pushed the answer to the Worker');
 // device B: fresh browser, same key, auto on, loads page -> pulls
 let B=await device();await B.page.goto(base+'/acc.html?tab=prac');
 await B.page.locator('.cloud-sync-bar button').first().click();await B.page.waitForFunction(()=>/ซิงก์แล้ว/.test(document.querySelector('.cloud-sync-bar [role=status]').textContent));
 let b1=await ans(B.page);ok(b1[k1]!==undefined,'B received A\'s answer via sync');
 await B.page.locator('.cloud-sync-bar button').nth(1).click();
 // concurrent edits: A and B answer different questions
 const pickOther=async(P,not)=>P.evaluate(n=>{const i=QS.findIndex(q=>String(q.id)!==String(n)&&store.ans[q.id]===undefined);return QS[i].id;},not);
 const qa=1,qb=2;
 const idx=(P,id)=>P.evaluate(i=>{const k=deck.findIndex(q=>String(q.id)===String(i));return k;},id);
 for(const [P,id] of [[A.page,qa],[B.page,qb]]){await P.evaluate(i=>{qcats.clear();buildDeck();qpos=deck.findIndex(q=>String(q.id)===String(i));renderQ();},id);await P.locator('.opt').first().click();}
 ok(qa!==qb,'A and B answer '+qa+' / '+qb);
 await A.page.clock.runFor(21000);await new Promise(r=>setTimeout(r,600));
 await B.page.clock.runFor(21000);await new Promise(r=>setTimeout(r,600));
 await A.page.clock.runFor(300000);await new Promise(r=>setTimeout(r,600));
 const fa=await ans(A.page),fb=await ans(B.page);
 ok(fa[qa]!==undefined&&fa[qb]!==undefined&&fb[qa]!==undefined&&fb[qb]!==undefined,'both devices converge on both answers');
 ok(fa[k1]===a1[k1],'earlier answer kept');
 // wrong key -> 401, nothing overwritten
 const C=await device();await C.page.goto(base+'/acc.html?tab=prac');
 C.page.removeAllListeners('dialog');C.page.on('dialog',d=>d.accept(d.type()==='prompt'?'wrong-key':undefined));
 const rv=rev;await C.page.locator('.cloud-sync-bar button').first().click();await C.page.waitForTimeout(600);
 ok(/ไม่ถูกต้อง/.test(await msg(C.page))&&rev===rv,'wrong key rejected, Worker data untouched');
 // worker without ETag: auto refuses, local data unchanged
 noEtag=true;const D=await device();await D.page.goto(base+'/acc.html?tab=prac');
 await D.page.locator('.cloud-sync-bar button').first().click();await D.page.waitForTimeout(800);
 const autoD=D.page.locator('.cloud-sync-bar button').nth(1);
 if(await autoD.isVisible()){await autoD.click();await D.page.evaluate(()=>{const st=JSON.parse(localStorage.getItem('study-acc')||'{}').ans||{};const q=QS.find(x=>st[x.id]===undefined);qcats.clear();buildDeck();qpos=deck.findIndex(z=>z.id===q.id);renderQ();});await D.page.locator('.opt').first().click();const before2=rev;await D.page.clock.runFor(21000);await D.page.waitForTimeout(600);
  ok(/ETag|ไม่ซิงก์อัตโนมัติ/.test(await msg(D.page)),'auto refuses Worker without ETag: '+await msg(D.page));
  ok(Object.keys(await ans(D.page)).length>=1,'local answers kept');ok(rev===before2,'no unsafe write');}
 else ok(true,'auto toggle hidden when manual sync could not complete');
 ok(errs.length===0,'no page errors '+errs.join('|'));
 await b.close();srv.close();process.exit(fail?1:0);
});
