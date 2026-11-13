'use strict';
const {chromium,webkit}=require('playwright');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd(),output=process.env.QA_OUTPUT;await fs.mkdir(output,{recursive:true});
 const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(req.method!=='GET'||!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'text/plain'}).end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,results=[];
 try{
  for(const [name,engine] of Object.entries({chromium,webkit})){
   const browser=await engine.launch();try{
    for(const width of [390,820,1280])for(const course of ['acc','eco','math','eng','zh']){
     const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true});const writes=[],errors=[];
     await context.route('**/*',route=>{const req=route.request();if(req.method()!=='GET')writes.push(req.method());return req.method()==='GET'&&new URL(req.url()).origin===base?route.continue():route.abort();});
     async function checkRecovery(file,payload){
      if(width!==390)return;
      const recovered=await browser.newContext();await recovered.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).origin===base?r.continue():r.abort());
      const target=await recovered.newPage();await target.goto(base+'/progress-restore.html',{waitUntil:'domcontentloaded'});await target.locator('#file').setInputFiles(file);await target.locator('#status').getByText(/missing data sets can be restored/).waitFor();
      target.once('dialog',dialog=>dialog.accept());await target.locator('#restore').click();await target.locator('#status').getByText(/Restored/).waitFor();
      for(const [key,value] of Object.entries(payload.entries))assert.equal(await target.evaluate(k=>localStorage.getItem(k),key),value,'restored unsaved dataset differs');
      assert.equal(await target.evaluate(()=>localStorage.getItem('study-sync-key')),null);await recovered.close();
     }
     const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/'+course+'.html',{waitUntil:'domcontentloaded'});await page.locator('.front-t').waitFor();
     const srsKey=await page.evaluate(()=>D.markKey+'-srs'),old=await page.evaluate(k=>localStorage.getItem(k),srsKey);
     await page.evaluate(()=>{localStorage.setItem('study-sync-key','SYNTHETIC-SECRET');const native=Storage.prototype.setItem;window.blockProgress=true;const keys=StudyCourseStorage.courseKeys(D.key,D.markKey);Storage.prototype.setItem=function(key,value){if(window.blockProgress&&keys.includes(key))throw new DOMException('Synthetic quota failure','QuotaExceededError');return native.call(this,key,value);};});
     await page.locator('.card').click();await page.locator('.rate4 .r3').click();await page.locator('.course-save-warning').waitFor();
     assert.equal(await page.evaluate(k=>localStorage.getItem(k),srsKey),old,'failed rating changed stored bytes');assert.equal(await page.evaluate(()=>progressWrites.hasPending()),true);
     const beforeDownload=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
     const pending=page.waitForEvent('download');await page.locator('.course-save-download').click();const download=await pending;
     const downloadedFile=await download.path();const json=JSON.parse(await fs.readFile(downloadedFile,'utf8'));assert.equal(json.format,'study-os-progress-local-backup');assert.notEqual(json.entries[srsKey],old);assert.ok(Object.keys(JSON.parse(json.entries[srsKey]).s).length>0);assert.ok(!JSON.stringify(json).includes('SYNTHETIC-SECRET'));
     await checkRecovery(downloadedFile,json);
     assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage))),beforeDownload,'export wrote browser data');assert.equal(await page.evaluate(()=>progressWrites.hasPending()),true,'export must not claim local save succeeded');
     for(const colorScheme of ['light','dark']){await page.emulateMedia({colorScheme});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'warning overflow');const bounds=await page.locator('.course-save-warning').boundingBox();assert.ok(bounds.y>=0&&bounds.y+bounds.height<1000,'warning exceeds viewport');await page.screenshot({path:path.join(output,`${name}-${width}-${course}-${colorScheme}.png`),fullPage:true});}
     await page.evaluate(()=>{window.blockProgress=false;});await page.locator('.course-save-retry').click();assert.equal(await page.locator('.course-save-warning').isHidden(),true);assert.equal(await page.evaluate(k=>localStorage.getItem(k),srsKey),json.entries[srsKey]);
     let quizValue=null,typingValue=null;
     if(await page.locator('[data-tab="prac"]').isVisible()){
      await page.locator('[data-tab="prac"]').click();const prior=await page.evaluate(()=>localStorage.getItem(KEY));await page.evaluate(()=>{window.blockProgress=true;});await page.locator('#qBody .opt').first().click();await page.locator('.course-save-warning').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),prior);
      if(width===390){const pendingQuiz=page.waitForEvent('download');await page.locator('.course-save-download').click();const quizFile=await (await pendingQuiz).path();const quizBackup=JSON.parse(await fs.readFile(quizFile,'utf8'));await checkRecovery(quizFile,quizBackup);}
      await page.evaluate(()=>{window.blockProgress=false;});await page.locator('.course-save-retry').click();quizValue=await page.evaluate(()=>localStorage.getItem(KEY));assert.ok(Object.keys(JSON.parse(quizValue).ans).length>0);
     }else if(await page.locator('#typBtn').isVisible()){
      await page.evaluate(()=>{window.blockProgress=true;});await page.locator('#typBtn').click();await page.locator('.course-save-warning').waitFor();typingValue=await page.evaluate(()=>TYPING?'1':'0');if(width===390){const pendingTyping=page.waitForEvent('download');await page.locator('.course-save-download').click();const typingFile=await (await pendingTyping).path();await checkRecovery(typingFile,JSON.parse(await fs.readFile(typingFile,'utf8')));}await page.evaluate(()=>{window.blockProgress=false;});await page.locator('.course-save-retry').click();assert.equal(await page.evaluate(()=>localStorage.getItem(D.markKey+'-typ')),typingValue);
     }
     assert.equal(await page.evaluate(()=>progressWrites.hasPending()),false);await page.reload({waitUntil:'domcontentloaded'});await page.locator('.front-t').waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),srsKey),json.entries[srsKey]);
     if(quizValue)assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),quizValue);if(typingValue)assert.equal(await page.evaluate(()=>localStorage.getItem(D.markKey+'-typ')),typingValue);
     assert.equal(await page.locator('.course-save-warning').count(),0);assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);results.push({engine:name,width,course,passed:true,quizRetried:!!quizValue,typingRetried:!!typingValue});console.log('PASS',name,width,course);await context.close();
    }
   }finally{await browser.close();}
  }
 }finally{await fs.writeFile(path.join(output,'results.json'),JSON.stringify({scope:'Synthetic localhost profiles; quota failures intentionally simulated. External fonts/APIs blocked. No real user progress or physical iPad tested.',results},null,2));await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
