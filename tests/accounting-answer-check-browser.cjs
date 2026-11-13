'use strict';
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
(async()=>{
 const root=process.cwd(),output=process.env.QA_OUTPUT;
 await fs.mkdir(output,{recursive:true});
 const server=http.createServer(async(req,res)=>{try{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(req.method!=='GET'||!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'})[path.extname(file)]||'application/octet-stream'}).end(body);
 }catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port,results=[];
 try{
  for(const [name,engine] of Object.entries({chromium,webkit})){
   const browser=await engine.launch();
   try{for(const width of [390,820,1280])for(const colorScheme of ['light','dark']){
    const context=await browser.newContext({viewport:{width,height:1000},colorScheme});
    const requests=[],errors=[];
    await context.route('**/*',route=>{const r=route.request();if(r.method()!=='GET')requests.push(r.method());return r.method()==='GET'&&new URL(r.url()).origin===base?route.continue():route.abort();});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/accounting-textbook.html',{waitUntil:'domcontentloaded'});
    await page.locator('.q-item').first().waitFor({state:'attached'});
    await page.locator('#search').fill('QS-6-1');
    await page.waitForFunction(()=>current?.id==='QS-6-1');
    await page.locator('#answer').fill('1710');
    await page.locator('#checkAnswer').click();
    assert.match(await page.locator('#checkFeedback').innerText(),/Correct final quantity: 1,710 units/);
    assert.equal(await page.locator('#questionStatus').inputValue(),'new','check must not mark completed');
    assert.equal(await page.locator('#checkFeedback').getAttribute('data-result'),'correct');
    await page.screenshot({path:path.join(output,`${name}-${width}-${colorScheme}-correct.png`),fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'horizontal overflow');
    await page.locator('#answer').fill('1730');
    assert.equal(await page.locator('#checkFeedback').isHidden(),true,'editing invalidates old feedback');
    await page.locator('#checkAnswer').click();assert.equal(await page.locator('#checkFeedback').getAttribute('data-result'),'incorrect');
    await page.locator('#answer').fill('1300-20+350+80=1710');await page.locator('#checkAnswer').click();assert.equal(await page.locator('#checkFeedback').getAttribute('data-result'),'format','do not guess from working');
    await page.locator('#answer').fill('');await page.locator('#checkAnswer').click();assert.equal(await page.locator('#checkFeedback').getAttribute('data-result'),'empty');
    await page.locator('#answer').fill('1,710 units');await page.locator('#checkAnswer').click();
    const saved=await page.evaluate(()=>localStorage.getItem(PROGRESS_KEY));
    assert.equal(JSON.parse(saved)['QS-6-1'].notes,'1,710 units');
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>current?.id==='QS-6-1');
    assert.equal(await page.locator('#answer').inputValue(),'1,710 units');assert.equal(await page.locator('#checkFeedback').isHidden(),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem(PROGRESS_KEY)),saved,'reload preserves progress');
    await page.locator('#search').fill('QS-6-2');await page.waitForFunction(()=>current?.id==='QS-6-2');
    assert.equal(await page.locator('#checkAnswer').isDisabled(),false);assert.match(await page.locator('#checkScope').innerText(),/15,450/);assert.equal(await page.locator('#checkFeedback').isHidden(),true);
    await page.locator('#answer').fill('250 for transportation in\n300 for shipping insurance');await page.locator('#checkAnswer').click();
    assert.equal(await page.locator('#checkFeedback').getAttribute('data-result'),'format','partial working must not receive a guessed grade');
    await page.locator('#answer').fill('250 for transportation in\n300 for shipping insurance\nFinal answer: $15,450.00');await page.locator('#checkAnswer').click();
    assert.equal(await page.locator('#checkFeedback').getAttribute('data-result'),'correct');assert.match(await page.locator('#checkFeedback').innerText(),/import duties/);
    assert.equal(await page.locator('#questionStatus').inputValue(),'new');
    await page.screenshot({path:path.join(output,`${name}-${width}-${colorScheme}-money-correct.png`),fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'money feedback overflow');
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>current?.id==='QS-6-2');
    assert.match(await page.locator('#answer').inputValue(),/Final answer: \$15,450.00/);assert.equal(await page.locator('#checkFeedback').isHidden(),true);
    await page.locator('#answer').fill('$15,450.01');await page.locator('#checkAnswer').click();assert.equal(await page.locator('#checkFeedback').getAttribute('data-result'),'incorrect','one cent difference must fail');
    const beforeReveal=await page.evaluate(()=>localStorage.getItem(PROGRESS_KEY));
    await page.locator('#showAnswer').click();assert.equal(await page.locator('#checkFeedback').getAttribute('data-result'),'solution');
    assert.equal(await page.evaluate(()=>localStorage.getItem(PROGRESS_KEY)),beforeReveal,'reveal must not change stored working/status');
    await page.locator('#search').fill('QS-6-9');await page.waitForFunction(()=>current?.id==='QS-6-9');
    assert.equal(await page.locator('#checkAnswer').isDisabled(),true);assert.equal(await page.locator('#showAnswer').isDisabled(),true);
    assert.match(await page.locator('#checkScope').innerText(),/2 of 403 questions/);assert.equal(await page.locator('#checkFeedback').isHidden(),true);
    await page.locator('#search').fill('no-such-question');assert.equal(await page.locator('#checkAnswer').isDisabled(),true);assert.match(await page.locator('#checkScope').innerText(),/Select a question/);
    assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
    results.push({engine:name,width,colorScheme,passed:true});console.log('PASS',name,width,colorScheme);
    await context.close();
   }}finally{await browser.close();}
  }
  // Disposable contexts simulate a browser quota failure; never use real progress.
  for(const [name,engine] of Object.entries({chromium,webkit})){
   const browser=await engine.launch();try{
    const context=await browser.newContext({viewport:{width:390,height:1000},acceptDownloads:true});
    await context.route('**/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).origin===base?r.continue():r.abort());
    const page=await context.newPage();await page.goto(base+'/accounting-textbook.html',{waitUntil:'domcontentloaded'});await page.locator('.q-item').first().waitFor({state:'attached'});
    const question=await page.evaluate(()=>current.id);
    await page.evaluate(()=>{const native=Storage.prototype.setItem;window.allowProgressWrites=false;Storage.prototype.setItem=function(key,value){if(key===PROGRESS_KEY&&!window.allowProgressWrites)throw new DOMException('Synthetic quota failure','QuotaExceededError');return native.call(this,key,value);};});
    await page.locator('#answer').fill('SYNTHETIC-UNSAVED-WORKING');await page.locator('#answer').blur();
    await page.locator('#saveStatus').getByText(/Not saved/).waitFor();assert.equal(await page.evaluate(()=>progressDirty),true);assert.equal(await page.evaluate(()=>localStorage.getItem(PROGRESS_KEY)),null);
    const pendingDownload=page.waitForEvent('download');await page.locator('details.settings summary').click();await page.locator('#export').click();
    const downloaded=await pendingDownload;const exported=JSON.parse(await fs.readFile(await downloaded.path(),'utf8'));
    assert.equal(exported.progress[question].notes,'SYNTHETIC-UNSAVED-WORKING','manual export must include the in-memory draft even while storage fails');
    await page.evaluate(()=>{window.allowProgressWrites=true;});await page.locator('#answer').focus();await page.locator('#answer').blur();
    await page.waitForFunction(()=>!progressDirty);assert.match(await page.evaluate(()=>localStorage.getItem(PROGRESS_KEY)),/SYNTHETIC-UNSAVED-WORKING/);assert.equal(await page.locator('#error').isHidden(),true);
    await page.evaluate(()=>{window.allowProgressWrites=false;});await page.locator('#questionStatus').selectOption('doing');assert.equal(await page.evaluate(()=>progressDirty),true);
    await page.evaluate(()=>{window.allowProgressWrites=true;window.dispatchEvent(new Event('pagehide'));});await page.waitForFunction(()=>!progressDirty);
    await page.reload({waitUntil:'domcontentloaded'});await page.locator('.q-item').first().waitFor({state:'attached'});assert.equal(await page.locator('#answer').inputValue(),'SYNTHETIC-UNSAVED-WORKING');assert.equal(await page.locator('#questionStatus').inputValue(),'doing');
    results.push({engine:name,scenario:'quota failure, draft export, unchanged-note retry and failed-status retry',passed:true});console.log('PASS',name,'save retry');await context.close();
   }finally{await browser.close();}
  }
  // Script delivery failure must preserve working and leave checking unavailable.
  const browser=await chromium.launch();try{
   const context=await browser.newContext();await context.route('**/*',r=>new URL(r.request().url()).origin!==base||r.request().url().includes('accounting-answer-check.js')?r.abort():r.continue());
   const page=await context.newPage();await page.goto(base+'/accounting-textbook.html',{waitUntil:'domcontentloaded'});await page.locator('.q-item').first().waitFor({state:'attached'});
   assert.match(await page.locator('#checkScope').innerText(),/could not load/);assert.equal(await page.locator('#checkAnswer').isDisabled(),true);assert.equal(await page.locator('#showAnswer').isDisabled(),true);
   await page.locator('#answer').fill('Still editable');await page.locator('#answer').blur();assert.match(await page.evaluate(()=>localStorage.getItem(PROGRESS_KEY)),/Still editable/);
   results.push({engine:'chromium',scenario:'checker script unavailable; saving preserved',passed:true});await context.close();
  }finally{await browser.close();}
 }finally{await fs.writeFile(path.join(output,'results.json'),JSON.stringify({scope:'Synthetic localhost answer checking. External fonts, PDF engine and study APIs blocked; no real PDF/user data or physical iPad tested.',results},null,2));await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
