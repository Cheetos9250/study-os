"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
module.exports=async function checkCourseMetadata(browser,base,engine){
  const context=await browser.newContext({viewport:{width:820,height:1180}});
  await context.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  try{
    const page=await context.newPage();
    await page.goto(base);
    await page.addScriptTag({content:await fs.readFile(path.join(root,"lib/study-os-course-metadata.js"),"utf8")});
    await page.addScriptTag({content:await fs.readFile(path.join(root,"lib/study-os-course-metadata-store.js"),"utf8")});
    const result=await page.evaluate(async()=>{
      const {openCourseMetadata,ConflictError,DATABASE}=globalThis.StudyOSCourseMetadataStore;
      const first=await openCourseMetadata(indexedDB);
      const second=await openCourseMetadata(indexedDB);
      const initial=await first.read();
      if(initial.revision!==0) throw new Error("unexpected initial metadata");
      const changed=globalThis.StudyOSCourseMetadata.defaultMetadata();
      changed.courses.acc.name="บัญชีทดสอบ";
      const saved=await first.save(changed,0);
      if(saved.revision!==1) throw new Error("bad revision");
      let stale=false;
      try {await second.save(changed,0);} catch(error){stale=error instanceof ConflictError;}
      if(!stale) throw new Error("stale writer was not rejected");
      let invalid=false;
      try {await second.importBackup({version:999},1);} catch(error){invalid=error instanceof TypeError;}
      if(!invalid) throw new Error("invalid import accepted");
      const after=await second.read();
      if(after.revision!==1||after.metadata.courses.acc.name!=="บัญชีทดสอบ") throw new Error("invalid import changed stored metadata");
      const exported=await first.exportBackup();
      if(exported.courses.acc.name!=="บัญชีทดสอบ") throw new Error("export mismatch");
      const reset=await second.reset(1);
      if(reset.revision!==2||reset.metadata.courses.acc.name!=="Accounting") throw new Error("reset mismatch");
      const restored=await first.importBackup(exported,2);
      if(restored.revision!==3||restored.metadata.courses.acc.name!=="บัญชีทดสอบ") throw new Error("import mismatch");
      first.close();second.close();
      return {database:DATABASE,revision:restored.revision,stale,invalid};
    });
    assert.deepEqual(result,{database:"study-os-course-metadata-v1",revision:3,stale:true,invalid:true});
    // Denied storage is tested in a fresh browser profile; no real data is touched.
    const denied=await browser.newContext();
    try{
      await denied.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
      const blocked=await denied.newPage();
      await blocked.goto(base);
      await blocked.addScriptTag({content:await fs.readFile(path.join(root,"lib/study-os-course-metadata.js"),"utf8")});
      await blocked.addScriptTag({content:await fs.readFile(path.join(root,"lib/study-os-course-metadata-store.js"),"utf8")});
      const rejected=await blocked.evaluate(async()=>{
        try{await globalThis.StudyOSCourseMetadataStore.openCourseMetadata(null);return false;}
        catch(error){return error instanceof TypeError;}
      });
      assert.equal(rejected,true);
    }finally{await denied.close();}
    // Fail closed when IndexedDB already contains a malformed record: never treat null
    // or revision zero as an empty database and overwrite it. Synthetic profile only.
    const corruptContext=await browser.newContext();
    try{
      await corruptContext.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
      const corruptPage=await corruptContext.newPage();
      await corruptPage.goto(base);
      await corruptPage.addScriptTag({content:await fs.readFile(path.join(root,"lib/study-os-course-metadata.js"),"utf8")});
      await corruptPage.addScriptTag({content:await fs.readFile(path.join(root,"lib/study-os-course-metadata-store.js"),"utf8")});
      const corruptionProtected=await corruptPage.evaluate(async()=>{
        const {openCourseMetadata,DATABASE}=globalThis.StudyOSCourseMetadataStore;
        const defaults=globalThis.StudyOSCourseMetadata.defaultMetadata();
        const store=await openCourseMetadata(indexedDB);
        const connection=await new Promise((resolve,reject)=>{
          const req=indexedDB.open(DATABASE,1);
          req.onsuccess=()=>resolve(req.result);
          req.onerror=()=>reject(req.error);
        });
        function raw(mode,value){
          return new Promise((resolve,reject)=>{
            const tx=connection.transaction("settings",mode);
            const request=mode==="readwrite" ?
              tx.objectStore("settings").put(value,"academic") :
              tx.objectStore("settings").get("academic");
            let result;
            request.onsuccess=()=>{result=request.result;};
            tx.oncomplete=()=>resolve(result);
            tx.onabort=()=>reject(tx.error);
            tx.onerror=()=>reject(tx.error);
          });
        }
        try{
          for(const [record,revision] of [
            [null,0],
            [{revision:0,metadata:defaults},0],
            [{revision:1,metadata:{version:999}},1]
          ]){
            await raw("readwrite",record);
            let readRejected=false,writeRejected=false;
            try{await store.read();}catch(error){readRejected=error instanceof TypeError;}
            try{await store.save(defaults,revision);}catch(error){writeRejected=error instanceof TypeError;}
            if(!readRejected||!writeRejected) throw new Error("corrupt metadata was accepted");
            const unchanged=await raw("readonly");
            if(JSON.stringify(unchanged)!==JSON.stringify(record)) throw new Error("corrupt metadata was overwritten");
          }
          return true;
        }finally{connection.close();store.close();}
      });
      assert.equal(corruptionProtected,true);
      await corruptPage.goto(base+"/course-metadata-draft.html");
      await corruptPage.locator("#metadata-open").click();
      await corruptPage.locator("#metadata-status").filter({hasText:"ระบบจะไม่เขียนทับหรือลบข้อมูลเดิม"}).waitFor();
      assert.equal(await corruptPage.locator("#editor").isVisible(),false);
      assert.equal(await corruptPage.locator("#metadata-open").isVisible(),true);
    }finally{await corruptContext.close();}
    const draft=await context.newPage();
    await draft.goto(base+"/course-metadata-draft.html");
    assert.equal(await draft.locator("#editor").isVisible(),false);
    await draft.locator("#metadata-open").click();
    await draft.locator("#editor").waitFor({state:"visible"});
    assert.equal(await draft.locator("#name-acc").inputValue(),"บัญชีทดสอบ");
    await draft.locator("#name-acc").fill("บัญชีแก้ไข");
    await draft.locator("#metadata-form button[type=submit]").click();
    await draft.locator("#metadata-status").filter({hasText:"บันทึกสำเร็จ"}).waitFor();
    await draft.reload();
    await draft.locator("#metadata-open").click();
    await draft.locator("#editor").waitFor({state:"visible"});
    assert.equal(await draft.locator("#name-acc").inputValue(),"บัญชีแก้ไข");
    assert.equal(await draft.locator("#metadata-order").inputValue(),"acc,eco,math");
    assert.equal(await draft.locator("#name-eco").inputValue(),"Economics");
    // Cancel reset: preserve existing metadata and revision.
    draft.once("dialog",dialog=>dialog.dismiss());
    await draft.locator("#metadata-reset").click();
    assert.equal(await draft.locator("#name-acc").inputValue(),"บัญชีแก้ไข");
    // Accept reset: explicit user confirmation, no implicit writes.
    draft.once("dialog",dialog=>dialog.accept());
    await draft.locator("#metadata-reset").click();
    await draft.locator("#metadata-status").filter({hasText:"บันทึกสำเร็จ"}).waitFor();
    assert.equal(await draft.locator("#name-acc").inputValue(),"Accounting");
    // Stale editor cannot silently overwrite a second tab's changes.
    const other=await context.newPage();
    await other.goto(base+"/course-metadata-draft.html");
    await other.locator("#metadata-open").click();
    await other.locator("#editor").waitFor({state:"visible"});
    await other.locator("#name-eco").fill("เศรษฐศาสตร์");
    await other.locator("#metadata-form button[type=submit]").click();
    await other.locator("#metadata-status").filter({hasText:"บันทึกสำเร็จ"}).waitFor();
    await draft.locator("#name-math").fill("คณิตศาสตร์");
    await draft.locator("#metadata-form button[type=submit]").click();
    await draft.locator("#metadata-status").filter({hasText:"ข้อมูลเปลี่ยนในแท็บอื่น"}).waitFor();
    assert.equal(await draft.locator("#name-math").inputValue(),"คณิตศาสตร์");
    // Explicit refresh can recover after conflict.
    draft.once("dialog",dialog=>dialog.accept());
    await draft.locator("#metadata-refresh").click();
    await draft.locator("#metadata-status").filter({hasText:"โหลดข้อมูลล่าสุดแล้ว"}).waitFor();
    assert.equal(await draft.locator("#name-eco").inputValue(),"เศรษฐศาสตร์");
    assert.equal(await draft.locator("#name-math").inputValue(),"Mathematics");
    // Real browser download / restore uses only synthetic metadata, never user files.
    const [download]=await Promise.all([
      draft.waitForEvent("download"),
      draft.locator("#metadata-export").click()
    ]);
    assert.equal(download.suggestedFilename(),"study-os-course-metadata.json");
    const backup=JSON.parse(await fs.readFile(await download.path(),"utf8"));
    assert.equal(backup.courses.eco.name,"เศรษฐศาสตร์");
    const beforeImport=await draft.locator("#name-eco").inputValue();
    await draft.locator("#metadata-file").setInputFiles({
      name:"invalid-course-metadata.json",mimeType:"application/json",
      buffer:Buffer.from(JSON.stringify({version:999}))
    });
    await draft.locator("#metadata-status").filter({hasText:"นำเข้าไม่ได้"}).waitFor();
    assert.equal(await draft.locator("#name-eco").inputValue(),beforeImport);
    await draft.locator("#metadata-file").setInputFiles({
      name:"oversized-course-metadata.json",mimeType:"application/json",
      buffer:Buffer.alloc(65537,32)
    });
    await draft.locator("#metadata-status").filter({hasText:"ไฟล์ใหญ่เกินไป"}).waitFor();
    assert.equal(await draft.locator("#name-eco").inputValue(),beforeImport);
    await draft.locator("#name-acc").fill("บัญชีชั่วคราว");
    await draft.locator("#metadata-form button[type=submit]").click();
    await draft.locator("#metadata-status").filter({hasText:"บันทึกสำเร็จ"}).waitFor();
    assert.equal(await draft.locator("#name-acc").inputValue(),"บัญชีชั่วคราว");
    draft.once("dialog",dialog=>dialog.accept());
    await draft.locator("#metadata-file").setInputFiles({
      name:"study-os-course-metadata.json",mimeType:"application/json",
      buffer:Buffer.from(JSON.stringify(backup))
    });
    await draft.waitForFunction(()=>document.getElementById("name-acc").value==="Accounting");
    assert.equal(await draft.locator("#name-eco").inputValue(),"เศรษฐศาสตร์");
    // A downloaded backup cannot silently overwrite a newer edit from another tab.
    await other.locator("#metadata-refresh").click();
    await other.locator("#metadata-status").filter({hasText:"โหลดข้อมูลล่าสุดแล้ว"}).waitFor();
    await other.locator("#name-eco").fill("เศรษฐศาสตร์อีกแท็บ");
    await other.locator("#metadata-form button[type=submit]").click();
    await other.locator("#metadata-status").filter({hasText:"บันทึกสำเร็จ"}).waitFor();
    draft.once("dialog",dialog=>dialog.accept());
    await draft.locator("#metadata-file").setInputFiles({
      name:"stale-study-os-course-metadata.json",mimeType:"application/json",
      buffer:Buffer.from(JSON.stringify(backup))
    });
    await draft.locator("#metadata-status").filter({hasText:"ข้อมูลเปลี่ยนในแท็บอื่น"}).waitFor();
    assert.equal(await draft.locator("#name-eco").inputValue(),"เศรษฐศาสตร์");
    await draft.locator("#metadata-refresh").click();
    await draft.locator("#metadata-status").filter({hasText:"โหลดข้อมูลล่าสุดแล้ว"}).waitFor();
    assert.equal(await draft.locator("#name-eco").inputValue(),"เศรษฐศาสตร์อีกแท็บ");
    // An unavailable IndexedDB must not open the editor or trigger any implicit reset.
    const blockedEditor=await context.newPage();
    await blockedEditor.addInitScript(()=>Object.defineProperty(window,"indexedDB",{configurable:true,value:undefined}));
    await blockedEditor.goto(base+"/course-metadata-draft.html");
    await blockedEditor.locator("#metadata-open").click();
    await blockedEditor.locator("#metadata-status").filter({hasText:"เปิดเครื่องมือไม่ได้"}).waitFor();
    assert.equal(await blockedEditor.locator("#editor").isVisible(),false);
    const withoutScripts=await browser.newContext({javaScriptEnabled:false});
    try{
      await withoutScripts.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
      const disabledPage=await withoutScripts.newPage();
      await disabledPage.goto(base+"/course-metadata-draft.html");
      assert.equal(await disabledPage.locator("noscript p[role=alert]").isVisible(),true);
      assert.equal(await disabledPage.locator("#metadata-open").isVisible(),false);
      assert.equal(await disabledPage.locator("#editor").isVisible(),false);
    }finally{await withoutScripts.close();}
    // Small-screen keyboard/viewport contract, isolated from the tablet editor state.
    const mobile=await browser.newContext({viewport:{width:390,height:844},colorScheme:"dark",hasTouch:true});
    try{
      await mobile.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
      const mobilePage=await mobile.newPage();
      await mobilePage.goto(base+"/course-metadata-draft.html");
      assert.equal(await mobilePage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await mobilePage.locator("#metadata-open").click();
      await mobilePage.locator("#editor").waitFor({state:"visible"});
      assert.equal(await mobilePage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await mobilePage.locator("#name-acc").focus();
      assert.equal(await mobilePage.evaluate(()=>document.activeElement.id),"name-acc");
      assert.equal(await mobilePage.locator("label").count()>=7,true);
    }finally{await mobile.close();}
    return {engine,courseMetadata:"passed; synthetic IndexedDB CAS, import rollback, reset, export, denied factory and opt-in editor reload"};
  }finally{await context.close();}
};
