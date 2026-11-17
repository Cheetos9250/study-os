// Offline check: install sw.js on a local server, go offline, pages still open; study data untouched.
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0];const f=path.join(root,decodeURIComponent(u==='/'?'/index.html':u));
 if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end();}
 r.writeHead(200,{'content-type':{'.html':'text/html;charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'}[path.extname(f)]||'application/octet-stream'});r.end(fs.readFileSync(f));});
srv.listen(0,async()=>{
 const base='http://127.0.0.1:'+srv.address().port;
 const exe=['/usr/bin/google-chrome'].find(p=>fs.existsSync(p));const b=await chromium.launch(exe?{executablePath:exe}:{});
 let fail=0;const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fail++;};const errs=[];
 const ctx=await b.newContext({viewport:{width:820,height:1180}});await ctx.route(/fonts\.|workers\.dev|cdnjs/,r=>r.abort());
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(base+'/index.html');
 await p.evaluate(()=>localStorage.setItem('study-acc',JSON.stringify({ans:{x:1},ats:{},known:[]})));
 // the theme script registers on https only; register directly here (localhost is a secure context)
 await p.evaluate(async()=>{await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;});
 await p.reload();await p.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:15000});
 const keys=await p.evaluate(async()=>{const c=await caches.open((await caches.keys())[0]);return (await c.keys()).map(r=>new URL(r.url).pathname);});
 ok(keys.some(k=>k.endsWith('/acc.html'))&&keys.some(k=>/study-nav\.js$/.test(k))&&keys.some(k=>k.endsWith('/data/quiz.json')),'core pages, linked scripts and data precached ('+keys.length+')');
 ok(!keys.some(k=>k.endsWith('/data/config.json')),'config.json never cached');
 await ctx.setOffline(true);
 for(const u of ['/index.html','/acc.html?tab=prac','/calendar.html','/practice.html']){
  let loaded=false;try{const r=await p.goto(base+u,{timeout:15000});loaded=!!r&&r.ok();}catch(e){}
  ok(loaded&&await p.locator('#studyNav').count()===1,'offline: '+u+' opens with the nav');
 }
 ok(await p.evaluate(()=>JSON.parse(localStorage.getItem('study-acc')).ans.x===1),'study data untouched');
 await ctx.setOffline(false);
 ok(errs.filter(e=>!/Failed to fetch|NetworkError|net::/.test(e)).length===0,'no page errors '+errs.join(' | '));
 await b.close();srv.close();console.log(fail?fail+' failed':'all passed');process.exit(fail?1:0);
});
