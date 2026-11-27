// Real-browser offline check: pill when offline, practice questions render with the network off, "new version" bar after a sw.js change.
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');let swSuffix='';
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0];const f=path.join(root,decodeURIComponent(u==='/'?'/index.html':u));
 if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
 let body=fs.readFileSync(f);if(u==='/sw.js')body=Buffer.concat([body,Buffer.from(swSuffix)]);
 r.writeHead(200,{'content-type':MIME[path.extname(f)]||'application/octet-stream','cache-control':'no-store'});r.end(body);});
srv.listen(0,async()=>{
 const base='http://127.0.0.1:'+srv.address().port;
 const exe=['/usr/bin/google-chrome'].find(p=>fs.existsSync(p));const b=await chromium.launch(exe?{executablePath:exe}:{});
 let fail=0;const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fail++;};const errs=[];
 const ctx=await b.newContext({viewport:{width:1180,height:820}});await ctx.route(/fonts\.|workers\.dev|cdnjs/,r=>r.abort());
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(base+'/index.html');
 await p.evaluate(async()=>{await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;});
 await p.reload();await p.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:15000});
 await p.waitForSelector('#studyNav');await p.waitForTimeout(2500); // let the precache finish
 ok(await p.locator('#studyOffline').count()===0&&await p.locator('#studyUpdate').count()===0,'online: no offline pill, no update bar');
 ok(await p.evaluate(()=>!!window.StudyOffline),'offline script loaded by the theme script');
 await ctx.setOffline(true);await p.waitForSelector('#studyOffline',{timeout:5000});
 ok((await p.locator('#studyOffline').innerText()).startsWith('Offline'),'offline pill appears');
 await p.goto(base+'/acc.html?tab=prac');await p.waitForTimeout(2000);
 ok(await p.locator('#qBody .cell').count()>0,'offline: practice questions render ('+await p.locator('#qBody .cell').count()+' cells)');
 ok(await p.locator('#studyOffline').count()===1,'pill still shown on the next page');
 await ctx.setOffline(false);await p.waitForFunction(()=>!document.getElementById('studyOffline'),null,{timeout:5000});
 ok(true,'pill goes away when back online');
 // a new deploy: sw.js changes, the page that was open is told, and offers Reload
 swSuffix='\n/* v2 */\n';
 await p.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
 await p.waitForSelector('#studyUpdate',{timeout:15000});
 ok((await p.locator('#studyUpdate').innerText()).includes('New version'),'update bar appears after a new sw.js');
 await Promise.all([p.waitForNavigation(),p.locator('#studyUpdate button',{hasText:'Reload'}).click()]);
 ok(await p.locator('#studyUpdate').count()===0,'Reload applies it (bar gone)');
 ok(errs.filter(e=>!/Failed to fetch|NetworkError|net::/.test(e)).length===0,'no page errors '+errs.join(' | '));
 await b.close();srv.close();console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
});
