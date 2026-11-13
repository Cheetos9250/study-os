"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
module.exports = async function checkPlanner(browser,base,engine,output) {
  const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,acceptDownloads:true});
  await context.route("**/*",route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror",error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__dbOpens = 0;
    const original = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function(...args) { window.__dbOpens++; return original.apply(this,args); };
  });
  try {
    await page.goto(base);
    assert.equal(await page.evaluate(() => window.__dbOpens),0,"no automatic database creation");
    await page.evaluate(() => localStorage.setItem("study-sync-key","SYNTHETIC-DO-NOT-EXPORT"));
    await page.locator("#open-planner").click();
    await page.locator("#planner-content").waitFor({state:"visible"});
    const today = await page.locator("#plan-date").inputValue();
    assert.match(await page.locator("#plan-discovery").innerText(),/งานค้าง 0 · วันนี้ 0 · 7 วันข้างหน้า 0 · เสร็จแล้ว 0/);
    assert.match(await page.locator("#plan-discovery-list").textContent(),/ยังไม่มีงานค้างหรือแผนใน 7 วันข้างหน้า/);
    await page.locator("#plan-overdue").click();
    assert.match(await page.locator("#plan-status").innerText(),/ไม่มีแผนค้าง/);
    await page.locator("#plan-upcoming").click();
    assert.match(await page.locator("#plan-status").innerText(),/ไม่มีแผนใน 7 วันข้างหน้า/);
    // Export cannot silently omit an unsaved new plan; explicit form reset preserves stored data.
    await page.locator("#plan-title").fill("Unsaved planner export QA");
    assert.equal(await page.locator("#plan-cancel").isVisible(),true);
    await page.locator("#plan-export").click();
    await page.locator("#plan-status").filter({hasText:"มีข้อมูลแผนที่ยังไม่บันทึก"}).waitFor();
    assert.equal(await page.locator("#plan-title").inputValue(),"Unsaved planner export QA");
    await page.locator("#plan-cancel").click();
    assert.equal(await page.locator("#plan-title").inputValue(),"");
    assert.equal(await page.locator("#plan-cancel").isVisible(),false);
    assert.match(await page.locator("#plan-summary").innerText(),/0 รายการ/);
    await page.locator("#plan-title").fill("   ");
    await page.locator("#plan-save").click();
    await page.locator("#plan-status").filter({hasText:"บันทึกหรืออ่านแผนไม่ได้"}).waitFor();
    assert.equal(await page.locator("#plan-title").inputValue(),"   ");
    assert.match(await page.locator("#plan-summary").innerText(),/0 รายการ/);
    await page.locator("#plan-title").fill("ทบทวน Adjusting Entries");
    await page.locator("#plan-save").click();
    await page.getByText("บันทึกแผนแล้ว",{exact:true}).waitFor();
    assert.match(await page.locator("#plan-summary").innerText(),/1 รายการ · วางแผน 30 นาที · เสร็จแล้ว 0/);
    assert.match(await page.locator("#plan-discovery").innerText(),/งานค้าง 0 · วันนี้ 1 · 7 วันข้างหน้า 0 · เสร็จแล้ว 0/);
    await page.reload(); await page.locator("#open-planner").click();
    await page.locator("#planner-content").waitFor({state:"visible"});
    assert.match(await page.locator("#plan-list").innerText(),/Adjusting Entries/);
    await page.locator("#plan-list input[type=checkbox]").check();
    await page.getByText("บันทึกแผนแล้ว",{exact:true}).waitFor();
    assert.match(await page.locator("#plan-summary").innerText(),/เสร็จแล้ว 1 รายการ/);
    assert.match(await page.locator("#plan-discovery").innerText(),/งานค้าง 0 · วันนี้ 0 · 7 วันข้างหน้า 0 · เสร็จแล้ว 1/);
    await page.locator("#plan-list button").click();
    await page.locator("#plan-title").fill("ทบทวน Demand and Supply");
    await page.locator("#plan-subject").selectOption("eco");
    await page.locator("#plan-minutes").fill("45");
    const tomorrow = await page.evaluate(date => new Date(Date.parse(date+"T00:00:00Z")+86400000).toISOString().slice(0,10),today);
    await page.locator("#plan-date").fill(tomorrow);
    await page.locator("#plan-save").click();
    await page.getByText("บันทึกแผนแล้ว",{exact:true}).waitFor();
    assert.equal(await page.locator("#plan-view-date").inputValue(),tomorrow);
    assert.equal(await page.locator("#plan-list a").getAttribute("href"),"eco.html");
    assert.match(await page.locator("#plan-summary").innerText(),/วางแผน 45 นาที · เสร็จแล้ว 1/);
    assert.match(await page.locator("#plan-discovery").innerText(),/งานค้าง 0 · วันนี้ 0 · 7 วันข้างหน้า 0 · เสร็จแล้ว 1/);
    // An empty date picker must not cause a render error.
    await page.locator("#plan-view-date").fill("");
    assert.match(await page.locator("#plan-summary").innerText(),/เลือกวันที่/);
    await page.locator("#plan-view-date").fill(tomorrow);

    // Real same-browser tabs share IndexedDB; readwrite transactions serialize edits.
    const other = await context.newPage();
    await other.goto(base);
    for (const tab of [page,other]) await tab.evaluate(async () => { window.__planner = await StudyOSPlanner.openPlanner(indexedDB); });
    const id = await page.evaluate(async () => (await window.__planner.list())[0].id);
    const revision = await page.evaluate(async () => (await window.__planner.list())[0].revision);
    const attempts = await Promise.all([page,other].map((tab,index) => tab.evaluate(async ({id,revision,index}) => {
      try { await window.__planner.update(id,{title:"Concurrent edit "+index},revision); return "saved"; }
      catch(error) { return error.name; }
    },{id,revision,index})));
    assert.deepEqual(attempts.sort(),["ConflictError","saved"]);
    await Promise.all([page,other].map((tab,index) => tab.evaluate(async ({index,tomorrow}) => {
      await window.__planner.add({subject:"math",title:"Concurrent add "+index,date:tomorrow,minutes:15},crypto.randomUUID());
    },{index,tomorrow})));
    assert.equal(await page.evaluate(async () => (await window.__planner.list()).length),3);
    // UI stale edits preserve the typed draft and do not replace newer persisted content.
    await page.locator("#plan-refresh").click();
    await page.getByText("อัปเดตรายการแล้ว",{exact:true}).waitFor();
    await page.locator("#plan-list button").first().click();
    await page.locator("#plan-title").fill("Unsaved draft");
    await other.evaluate(async id => {
      const record = (await window.__planner.list()).find(item => item.id === id);
      await window.__planner.update(id,{title:"Newer saved topic"},record.revision);
    },id);
    await page.locator("#plan-save").click();
    await page.locator("#plan-status").filter({hasText:"อีกแท็บ"}).waitFor();
    assert.equal(await page.locator("#plan-title").inputValue(),"Unsaved draft");
    assert.equal(await other.evaluate(async id => (await window.__planner.list()).find(item => item.id === id).title,id),"Newer saved topic");
    await page.locator("#plan-cancel").click();
    await page.locator("#plan-refresh").click();
    await page.getByText("อัปเดตรายการแล้ว",{exact:true}).waitFor();
    // Text is rendered as text; saved records are never injected as markup.
    await page.locator("#plan-title").fill('<img src=x onerror="window.__injected=1">');
    await page.locator("#plan-date").fill(tomorrow);
    await page.locator("#plan-save").click();
    await page.getByText("บันทึกแผนแล้ว",{exact:true}).waitFor();
    assert.equal(await page.locator("#plan-list img").count(),0);
    assert.equal(await page.locator("#plan-discovery-list img").count(),0);
    assert.equal(await page.evaluate(() => window.__injected),undefined);
    // Show actual upcoming list on mobile: rows wrap safely, no horizontal scroll.
    await page.locator("#plan-discovery-details summary").click();
    assert.equal(await page.locator('#plan-discovery-list li[data-plan-group="upcoming"]').count()>0,true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    const downloaded = page.waitForEvent("download");
    await page.locator("#plan-export").click();
    const file = await downloaded;
    const backup = JSON.parse(await fs.readFile(await file.path(),"utf8"));
    assert.equal(backup.format,"study-os-planner"); assert.equal(backup.sessions.length,4);
    assert.doesNotMatch(JSON.stringify(backup),/SYNTHETIC-DO-NOT-EXPORT|study-sync-key/);
    assert.equal(await page.evaluate(() => localStorage.getItem("study-sync-key")),"SYNTHETIC-DO-NOT-EXPORT");
    // Restore in a fresh isolated browser profile, repeat idempotently, then prove
    // conflicting imports abort all writes (including a new record queued first).
    const restored = await browser.newContext({viewport:{width:820,height:1180}});
    await restored.route("**/*",route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    try {
      const target = await restored.newPage(); await target.goto(base);
      await target.locator("#open-planner").click();
      await target.locator("#planner-content").waitFor({state:"visible"});
      const upload = payload => ({name:"planner-backup.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(payload))});
      await target.locator("#plan-file").setInputFiles(upload(backup));
      await target.getByText("นำเข้าเพิ่ม 4 รายการ · มีอยู่แล้ว 0 รายการ",{exact:true}).waitFor();
      await target.locator("#plan-file").setInputFiles(upload(backup));
      await target.getByText("นำเข้าเพิ่ม 0 รายการ · มีอยู่แล้ว 4 รายการ",{exact:true}).waitFor();
      await target.evaluate(async () => { window.__restored = await StudyOSPlanner.openPlanner(indexedDB); });
      const persisted = await target.evaluate(() => window.__restored.list());
      assert.deepEqual(persisted.map(item => item.id).sort(),backup.sessions.map(item => item.id).sort());
      await target.evaluate(async id => {
        const current = (await window.__restored.list()).find(item => item.id === id);
        await window.__restored.update(id,{title:"Updated since export"},current.revision);
      },backup.sessions[0].id);
      const newRecord = require("../lib/study-os-planner.js").createSession({subject:"acc",title:"Must roll back",date:tomorrow,minutes:10},"rollback-candidate",1000);
      await target.locator("#plan-file").setInputFiles(upload({...backup,sessions:[newRecord,...backup.sessions]}));
      await target.locator("#plan-status").filter({hasText:"จึงไม่นำเข้าหรือเขียนทับ"}).waitFor();
      assert.equal(await target.evaluate(async () => (await window.__restored.list()).length),4);
      assert.equal(await target.evaluate(async () => (await window.__restored.list()).some(item => item.id === "rollback-candidate")),false);
      await target.locator("#plan-file").setInputFiles(upload({...backup,version:99}));
      await target.locator("#plan-status").filter({hasText:"บันทึกหรืออ่านแผนไม่ได้"}).waitFor();
      assert.equal(await target.evaluate(async () => (await window.__restored.list()).length),4);
    } finally { await restored.close(); }
    // Operations in an already loaded page do not require network access.
    await context.setOffline(true);
    await page.locator("#plan-title").fill("Offline loaded-page plan");
    await page.locator("#plan-save").click();
    await page.getByText("บันทึกแผนแล้ว",{exact:true}).waitFor();
    await context.setOffline(false);
    await page.screenshot({path:path.join(output,`${engine}-planner-mobile.png`),fullPage:true});
    await page.setViewportSize({width:820,height:1180});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    await page.screenshot({path:path.join(output,`${engine}-planner-tablet.png`),fullPage:true});
    assert.deepEqual(errors,[]);
    // Unknown record versions must be preserved, never reset on a failed read.
    await page.evaluate(async () => {
      const db = await new Promise((resolve,reject) => { const r=indexedDB.open(StudyOSPlanner.DB_NAME,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error); });
      await new Promise((resolve,reject) => {const tx=db.transaction("sessions","readwrite");tx.objectStore("sessions").add({id:"future-version",schemaVersion:99,privateMarker:"PRESERVE"});tx.oncomplete=resolve;tx.onabort=reject;}); db.close();
    });
    await page.reload(); await page.locator("#open-planner").click();
    await page.locator("#plan-status").filter({hasText:"ยังเปิดแผนไม่ได้"}).waitFor();
    assert.equal(await page.locator("#planner-content").isVisible(),false);
    assert.equal(await page.evaluate(async () => {
      const r=indexedDB.open(StudyOSPlanner.DB_NAME,1);const db=await new Promise(resolve=>r.onsuccess=()=>resolve(r.result));
      const tx=db.transaction("sessions","readonly");const q=tx.objectStore("sessions").get("future-version");
      return new Promise(resolve=>{q.onsuccess=()=>{resolve(q.result.privateMarker);db.close();};});
    }),"PRESERVE");
  } finally { await context.close(); }
  const denied = await browser.newContext();
  try {
    const tab = await denied.newPage();
    await tab.addInitScript(() => Object.defineProperty(window,"indexedDB",{get(){throw new DOMException("blocked","SecurityError");}}));
    await tab.goto(base); await tab.locator("#open-planner").click();
    await tab.locator("#plan-status").filter({hasText:"ยังเปิดแผนไม่ได้"}).waitFor();
    assert.equal(await tab.locator("#planner-content").isVisible(),false);
  } finally { await denied.close(); }
  // Separate synthetic browser profile: non-empty navigation must select a date without completing plans.
  const navigation = await browser.newContext({viewport:{width:820,height:1180},hasTouch:true});
  try {
    await navigation.route("**/*",route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const tab = await navigation.newPage();
    await tab.goto(base);
    await tab.locator("#open-planner").click();
    await tab.locator("#planner-content").waitFor({state:"visible"});
    const current = await tab.locator("#plan-date").inputValue();
    const shift = (days) => new Date(Date.parse(current+"T00:00:00Z")+days*86400000).toISOString().slice(0,10);
    for (const [dateValue,label] of [[shift(-1),"Overdue recent QA"],[shift(4),"Upcoming later QA"],[shift(-2),"Overdue navigation QA"],[shift(2),"Upcoming navigation QA"]]) {
      await tab.locator("#plan-title").fill(label);
      await tab.locator("#plan-date").fill(dateValue);
      await tab.locator("#plan-save").click();
      await tab.getByText("บันทึกแผนแล้ว",{exact:true}).waitFor();
      await tab.waitForFunction(expected => document.querySelector("#plan-discovery")?.textContent?.includes(expected),label === "Overdue recent QA" ? "งานค้าง 1" : label === "Upcoming later QA" ? "7 วันข้างหน้า 1" : label === "Overdue navigation QA" ? "งานค้าง 2" : "7 วันข้างหน้า 2");
    }
    assert.match(await tab.locator("#plan-discovery").textContent(),/งานค้าง 2 · วันนี้ 0 · 7 วันข้างหน้า 2 · เสร็จแล้ว 0/);
    await tab.locator("#plan-discovery-details summary").click();
    const overdueButtons=tab.locator('#plan-discovery-list li[data-plan-group="overdue"] button');
    const upcomingButtons=tab.locator('#plan-discovery-list li[data-plan-group="upcoming"] button');
    assert.equal(await overdueButtons.count(),2);
    assert.equal(await upcomingButtons.count(),2);
    assert.match(await overdueButtons.first().textContent(),/Overdue navigation QA/);
    assert.match(await overdueButtons.last().textContent(),/Overdue recent QA/);
    assert.match(await upcomingButtons.first().textContent(),/Upcoming navigation QA/);
    assert.match(await upcomingButtons.last().textContent(),/Upcoming later QA/);
    await overdueButtons.first().click();
    assert.equal(await tab.locator("#plan-view-date").inputValue(),shift(-2));
    assert.equal(await tab.evaluate(()=>document.activeElement.id),"plan-list");
    assert.equal(await tab.locator("#plan-list input[type=checkbox]").isChecked(),false);
    await upcomingButtons.first().click();
    assert.equal(await tab.locator("#plan-view-date").inputValue(),shift(2));
    assert.equal(await tab.locator("#plan-list input[type=checkbox]").isChecked(),false);
    await tab.locator("#plan-overdue").click();
    assert.equal(await tab.locator("#plan-view-date").inputValue(),shift(-2));
    assert.match(await tab.locator("#plan-list").innerText(),/Overdue navigation QA/);
    await tab.locator("#plan-upcoming").click();
    assert.equal(await tab.locator("#plan-view-date").inputValue(),shift(2));
    assert.match(await tab.locator("#plan-list").innerText(),/Upcoming navigation QA/);
    assert.equal(await tab.locator("#plan-list input[type=checkbox]").isChecked(),false);
    // Explicit completion updates discovery atomically; never count done items as upcoming.
    await tab.locator("#plan-list input[type=checkbox]").check();
    await tab.getByText("บันทึกแผนแล้ว",{exact:true}).waitFor();
    await tab.waitForFunction(() => document.querySelector("#plan-discovery")?.textContent?.includes("7 วันข้างหน้า 1 · เสร็จแล้ว 1"));
    assert.equal(await tab.locator('#plan-discovery-list li[data-plan-group="upcoming"]').count(),1);
    assert.doesNotMatch(await tab.locator("#plan-discovery-list").textContent(),/Upcoming navigation QA/);
    await tab.locator("#plan-list input[type=checkbox]").uncheck();
    await tab.getByText("บันทึกแผนแล้ว",{exact:true}).waitFor();
    await tab.waitForFunction(() => document.querySelector("#plan-discovery")?.textContent?.includes("7 วันข้างหน้า 2 · เสร็จแล้ว 0"));
    assert.equal(await tab.locator('#plan-discovery-list li[data-plan-group="upcoming"]').count(),2);
    // Editing the topic refreshes the displayed read-only row, preserving the session identity.
    await tab.locator("#plan-list button").first().click();
    await tab.locator("#plan-title").fill("Upcoming edited QA");
    await tab.locator("#plan-save").click();
    await tab.getByText("บันทึกแผนแล้ว",{exact:true}).waitFor();
    await tab.waitForFunction(() => document.querySelector("#plan-discovery-list")?.textContent?.includes("Upcoming edited QA"));
    assert.doesNotMatch(await tab.locator("#plan-discovery-list").textContent(),/Upcoming navigation QA/);
    await tab.reload();
    await tab.locator("#open-planner").click();
    await tab.locator("#planner-content").waitFor({state:"visible"});
    await tab.waitForFunction(() => document.querySelector("#plan-discovery")?.textContent?.includes("7 วันข้างหน้า 2"));
    assert.match(await tab.locator("#plan-discovery").textContent(),/งานค้าง 2 · วันนี้ 0 · 7 วันข้างหน้า 2 · เสร็จแล้ว 0/);
    assert.match(await tab.locator("#plan-discovery-list").textContent(),/Upcoming edited QA/);
    assert.doesNotMatch(await tab.locator("#plan-discovery-list").textContent(),/Upcoming navigation QA/);
    // Another same-origin tab may explicitly complete a plan. Refresh must show its
    // latest revision without silently updating or completing any records itself.
    const secondary=await navigation.newPage();
    await secondary.goto(base);
    await secondary.evaluate(async()=>{
      window.__crossTabPlanner=await StudyOSPlanner.openPlanner(indexedDB);
      const record=(await window.__crossTabPlanner.list()).find(item=>item.title==="Upcoming edited QA");
      if(!record)throw new Error("missing synthetic cross-tab plan");
      await window.__crossTabPlanner.update(record.id,{done:true},record.revision);
    });
    await tab.locator("#plan-refresh").click();
    await tab.getByText("อัปเดตรายการแล้ว",{exact:true}).waitFor();
    await tab.waitForFunction(()=>document.querySelector("#plan-discovery")?.textContent?.includes("7 วันข้างหน้า 1 · เสร็จแล้ว 1"));
    assert.doesNotMatch(await tab.locator("#plan-discovery-list").textContent(),/Upcoming edited QA/);
    await secondary.evaluate(async()=>{
      const record=(await window.__crossTabPlanner.list()).find(item=>item.title==="Upcoming edited QA");
      await window.__crossTabPlanner.update(record.id,{done:false},record.revision);
      window.__crossTabPlanner.close();
    });
    await tab.locator("#plan-refresh").click();
    await tab.getByText("อัปเดตรายการแล้ว",{exact:true}).waitFor();
    await tab.waitForFunction(()=>document.querySelector("#plan-discovery")?.textContent?.includes("7 วันข้างหน้า 2 · เสร็จแล้ว 0"));
    assert.match(await tab.locator("#plan-discovery-list").textContent(),/Upcoming edited QA/);
  } finally { await navigation.close(); }
  return {engine,planner:"passed; synthetic IndexedDB: persistence, editing, explicit completion, dates, concurrent tabs, stale draft, export/import, idempotency, atomic rollback, denied/corrupt storage, loaded-page offline"};
};
