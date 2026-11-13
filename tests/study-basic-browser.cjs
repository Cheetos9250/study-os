"use strict";
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
(async()=>{
  const root=process.cwd(),output=process.env.QA_OUTPUT;
  await fs.mkdir(output,{recursive:true});
  const server=http.createServer(async(req,res)=>{
    try{
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
      if(!file.startsWith(root+path.sep)||req.method!=='GET'){res.writeHead(403).end();return;}
      const body=await fs.readFile(file),ext=path.extname(file);
      res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json'})[ext]||'text/plain'}).end(body);
    }catch{res.writeHead(404).end();}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port,evidence=[];
  try{
    for(const [engine,type] of Object.entries({chromium,webkit})){
      const browser=await type.launch();
      try{
        for(const width of [390,820]){
          const context=await browser.newContext({viewport:{width,height:1000},acceptDownloads:true});
          const writeAttempts=[];
          await context.route('**/*',route=>{
            const request=route.request(),url=new URL(request.url());
            if(request.method()!=='GET')writeAttempts.push(request.method()+' '+url.pathname);
            return request.method()==='GET'&&(url.origin===base||['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))?route.continue():route.abort();
          });
          const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
          await page.goto(base+'/');
          for(const course of ['acc','eco','math','eng','zh']){
            const link=page.locator(`a[href="${course}.html"]`).first();
            await link.click();await page.locator('.front-t').waitFor();
            await page.locator('.card').click();
            await page.locator('.rate4 .r3').click();
            const stored=await page.evaluate(()=>localStorage.getItem(D.markKey+'-srs'));
            assert.ok(Object.keys(JSON.parse(stored).s).length>0);
            await page.reload();await page.locator('.front-t').waitFor();
            assert.equal(await page.evaluate(()=>localStorage.getItem(D.markKey+'-srs')),stored,'rating did not survive reload');
            assert.equal(await page.locator('.course-links a[href="progress-backup.html"]').count(),1);
            await page.locator('.course-links a[href="./"]').click();
            await page.locator('#welcome-title').waitFor();
            evidence.push({engine,width,course,navigateRateReloadReturn:'passed'});
          }
          await page.evaluate(()=>{localStorage.setItem('study-sync-key','SYNTHETIC-SECRET');localStorage.setItem('study-sync-progress-key-v1','SYNTHETIC-SECRET');});
          await page.getByRole('link',{name:'Back up progress',exact:true}).click();
          const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
          const downloadPromise=page.waitForEvent('download');
          await page.locator('#download').click();const download=await downloadPromise;
          const file=await download.path();const payload=JSON.parse(await fs.readFile(file,'utf8'));
          assert.equal(payload.format,'study-os-progress-local-backup');
          assert.ok(Object.keys(payload.entries).length>=5);assert.ok(!JSON.stringify(payload).includes('SYNTHETIC-SECRET'));
          await page.locator('#backupFile').setInputFiles(file);
          await page.getByText('File structure is valid:',{exact:false}).waitFor();
          assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage))),before,'backup or file check mutated storage');
          assert.deepEqual(writeAttempts,[],'unexpected network write');assert.deepEqual(errors,[]);
          for(const colorScheme of ['light','dark']){
            await page.emulateMedia({colorScheme});await page.evaluate(()=>document.fonts.ready);
            assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
            await page.screenshot({path:path.join(output,`${engine}-${width}-${colorScheme}-backup.png`),fullPage:true});
          }
          await page.locator('a[href="./"]').click();await page.locator('#welcome-title').waitFor();
          evidence.push({engine,width,backupDownloadCheck:'passed',credentialsExcluded:true,storageUnchanged:true,networkWrites:0});
          const recovered=await browser.newContext({viewport:{width,height:1000}});
          await recovered.route('**/*',route=>{const u=new URL(route.request().url());return route.request().method()==='GET'&&(u.origin===base||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))?route.continue():route.abort();});
          const restored=await recovered.newPage();await restored.goto(base+'/progress-restore.html');
          await restored.locator('#file').setInputFiles(file);
          await restored.locator('#status').getByText(/missing data sets can be restored/).waitFor();
          restored.once('dialog',dialog=>dialog.accept());await restored.locator('#restore').click();
          await restored.locator('#status').getByText(/Restored/).waitFor();
          for(const [key,value] of Object.entries(payload.entries))assert.equal(await restored.evaluate(k=>localStorage.getItem(k),key),value);
          await restored.reload();assert.equal(await restored.evaluate(()=>localStorage.getItem('study-sync-key')),null);
          evidence.push({engine,width,nativeCourseBackupRestore:'passed'});await recovered.close();
          await context.close();
        }
      }finally{await browser.close();}
    }
    await fs.writeFile(path.join(output,'results.json'),JSON.stringify({scope:'synthetic localhost only; no real user storage or production API access; WebKit is not physical iPad Safari',evidence},null,2));
    console.log('PASS: Chromium/WebKit navigation, rating persistence, local backup download and file validation');
  }finally{await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
