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
    return {engine,courseMetadata:"passed; synthetic IndexedDB CAS, import rollback, reset, export, denied factory and opt-in editor reload"};
  }finally{await context.close();}
};
