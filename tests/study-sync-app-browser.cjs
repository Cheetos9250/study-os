// Browser check of site-wide Cloud sync (scripts/study-sync-app.js) against a local mock CAS Worker.
// Usage: node tests/study-sync-app-browser.cjs [--shots <dir>]
const {chromium}=require('playwright');
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const SECRET='secret-key-1',TODAY='studyos.today.v1';
const shotDir=process.argv.includes('--shots')?process.argv[process.argv.indexOf('--shots')+1]:'';
let rev=0,store={v:1,keys:{}},hits=[];
const srv=http.createServer((q,r)=>{
 const url=q.url.split('?')[0];
 if(url==='/mock-prog/progress/app'){
  hits.push(q.method);
  if(q.headers['x-sync-key']!==SECRET){r.writeHead(401,{'content-type':'application/json'});return r.end('{"error":"bad key"}');}
  const h=()=>({'content-type':'application/json','X-Sync-Revision':'"'+rev+'"'});
  if(q.method==='GET'){r.writeHead(200,h());return r.end(JSON.stringify(store));}
  if(q.method==='PUT'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{
   if(q.headers['if-match']!=='"'+rev+'"'){r.writeHead(409,h());return r.end('{}');}
   store=JSON.parse(b);rev++;r.writeHead(200,h());r.end('{"ok":true}');});return;}
 }
 if(url==='/blank'){r.writeHead(200,{'content-type':'text/html'});return r.end('<!doctype html><title>blank</title>');}
 const f=path.join(root,decodeURIComponent(url==='/'?'/index.html':url));
 if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
 const t={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(f)]||'application/octet-stream';
 r.writeHead(200,{'content-type':t});r.end(fs.readFileSync(f));
});
srv.listen(0,async()=>{
 const base='http://127.0.0.1:'+srv.address().port;
 const exe=['/usr/bin/google-chrome'].find(p=>fs.existsSync(p));
 const b=await chromium.launch(exe?{executablePath:exe}:{});
 let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m);}else console.log('ok  ',m);};const errs=[];
 async function device({setup=true,viewport={width:820,height:1180},scheme='light',seed={}}={}){
  const ctx=await b.newContext({viewport,colorScheme:scheme});
  await ctx.route(/fonts\.|workers\.dev|notion/,r=>r.abort());
  await ctx.route('**/data/config.json',r=>r.fulfill({json:setup?{api:'https://study-api.example.workers.dev',progress_api:base+'/mock-prog'}:{api:'https://study-api.example.workers.dev'}}));
  const page=await ctx.newPage();page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(base+'/blank');
  await page.evaluate(([s,ep,key])=>{for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);
   if(ep){localStorage.setItem('study-sync-progress-key-v1',JSON.stringify({endpoint:ep,key}));localStorage.setItem('study-sync-auto-v1','1');}},
   [seed,setup&&seed.__auto!==false?base+'/mock-prog':'',SECRET]);
  return {ctx,page};
 }
 const timetable=[{id:'c1',day:1,start:'09:00',end:'12:00',name:'Sync Test Class',code:'ACC101',course:'acc'}];
 // A) iPad with data and auto on: uploads on open.
 const A=await device({seed:{[TODAY]:JSON.stringify({exams:[],done:{},tasks:{},timetable})}});
 await A.page.goto(base+'/index.html');
 await A.page.waitForFunction(()=>true);await new Promise(r=>setTimeout(r,2500));
 ok(hits.includes('PUT')&&store.keys[TODAY]&&/Sync Test Class/.test(store.keys[TODAY].value),'device A uploaded its timetable');
 // B) fresh PC with auto on: downloads and the page reloads to show it.
 const B=await device({viewport:{width:1180,height:820}});
 await B.page.goto(base+'/calendar.html');
 await B.page.waitForFunction(()=>/Sync Test Class/.test(localStorage.getItem('studyos.today.v1')||''),null,{timeout:8000}).catch(()=>{});
 await new Promise(r=>setTimeout(r,1500));
 ok(/Sync Test Class/.test(await B.page.evaluate(()=>localStorage.getItem('studyos.today.v1')||'')),'device B received the timetable');
 ok(/Sync Test Class|ACC101/.test(await B.page.locator('body').innerText()),'calendar shows the synced class after the automatic reload');
 // B edits; A gets it on its next visible sync.
 await B.page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('studyos.today.v1'));s.timetable[0].name='Edited On PC';localStorage.setItem('studyos.today.v1',JSON.stringify(s));});
 await B.page.evaluate(()=>window.StudySyncApp.run());await new Promise(r=>setTimeout(r,1200));
 ok(/Edited On PC/.test(store.keys[TODAY].value),'device B uploaded its edit');
 await A.page.evaluate(()=>window.StudySyncApp.run());await new Promise(r=>setTimeout(r,1500));
 ok(/Edited On PC/.test(await A.page.evaluate(()=>localStorage.getItem('studyos.today.v1'))),'device A received the edit');
 // C) not set up (no progress_api): panel explains, no Worker calls.
 const before=hits.length;
 const C=await device({setup:false});
 await C.page.goto(base+'/index.html');await new Promise(r=>setTimeout(r,1500));
 await C.page.evaluate(()=>window.StudySyncApp.open());
 await C.page.waitForFunction(()=>/not set up yet/.test(document.querySelector('#ssaPanel .ssa-st').textContent));
 ok(hits.length===before,'no Worker calls when progress_api is missing');
 ok(await C.page.locator('#ssaPanel .ssa-auto').isDisabled(),'auto toggle disabled when not set up');
 // D) panel opens from the menu on each size and theme, without overflow.
 for(const [w,h] of [[1180,820],[820,1180],[390,844]])for(const scheme of ['light','dark']){
  const D=await device({viewport:{width:w,height:h},scheme,seed:{__auto:false}});
  await D.page.goto(base+'/index.html');
  if(w<900)await D.page.locator('#studyNav .sn-more').click();
  await D.page.locator('#studyNav .sn-sync').click();
  await D.page.waitForSelector('#ssaPanel:not([hidden])');
  const over=await D.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  ok(!over,`panel ${w}x${h} ${scheme}: no horizontal overflow`);
  if(shotDir){fs.mkdirSync(shotDir,{recursive:true});await D.page.screenshot({path:path.join(shotDir,`sync-panel-${w}x${h}-${scheme}.png`)});}
  await D.page.keyboard.press('Escape');ok(await D.page.locator('#ssaPanel').isHidden(),`panel ${w}x${h} ${scheme}: Escape closes`);
  await D.ctx.close();
 }
 ok(errs.length===0,'no page errors '+errs.join(' | '));
 await b.close();srv.close();
 console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
});
