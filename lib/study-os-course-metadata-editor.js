"use strict";
(() => {
  const $=id=>document.getElementById(id);
  const {SUBJECTS,normalizeMetadata}=globalThis.StudyOSCourseMetadata;
  const {openCourseMetadata,ConflictError}=globalThis.StudyOSCourseMetadataStore;
  const status=$("metadata-status"), editor=$("editor");
  let store=null,revision=null,dirty=false;
  function announce(message){status.textContent=message;}
  function show(data){
    for(const id of SUBJECTS){
      $("name-"+id).value=data.courses[id].name;
      $("description-"+id).value=data.courses[id].description;
    }
    $("metadata-order").value=data.order.join(",");
    dirty=false;
  }
  function collect(){
    const courses={};
    for(const id of SUBJECTS) courses[id]={name:$("name-"+id).value,description:$("description-"+id).value};
    return normalizeMetadata({version:1,courses,order:$("metadata-order").value.split(",").map(x=>x.trim())});
  }
  async function reload(){
    const current=await store.read();
    revision=current.revision;
    show(current.metadata);
    announce("โหลดข้อมูลล่าสุดแล้ว · Revision "+revision);
  }
  async function perform(action){
    try{
      const result=await action();
      revision=result.revision;
      show(result.metadata);
      announce("บันทึกสำเร็จ · Revision "+revision);
    }catch(error){
      if(error instanceof ConflictError) announce("ข้อมูลเปลี่ยนในแท็บอื่น กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก");
      else announce("ดำเนินการไม่ได้: "+error.message);
    }
  }
  $("metadata-open").addEventListener("click",async()=>{
    if(store)return;
    try{
      store=await openCourseMetadata(indexedDB);
      await reload();
      editor.hidden=false;
      $("metadata-open").hidden=true;
    }catch(error){
      if(store){store.close();store=null;}
      announce("เปิดเครื่องมือไม่ได้: "+error.message);
    }
  });
  $("metadata-form").addEventListener("input",()=>{dirty=true;});
  $("metadata-form").addEventListener("submit",event=>{
    event.preventDefault();
    perform(()=>store.save(collect(),revision));
  });
  $("metadata-refresh").addEventListener("click",()=>{
    if(dirty&&!confirm("ละทิ้งการแก้ไขที่ยังไม่บันทึก?"))return;
    reload().catch(error=>announce("โหลดข้อมูลไม่ได้: "+error.message));
  });
  $("metadata-reset").addEventListener("click",()=>{
    if(!confirm("คืนค่าชื่อและคำอธิบายรายวิชาเริ่มต้นในเบราว์เซอร์นี้?"))return;
    perform(()=>store.reset(revision));
  });
  $("metadata-export").addEventListener("click",async()=>{
    try{
      const backup=await store.exportBackup();
      const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}));
      const a=document.createElement("a");
      a.href=url;a.download="study-os-course-metadata.json";a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      announce("ดาวน์โหลดข้อมูลรายวิชาแล้ว");
    }catch(error){announce("ส่งออกไม่ได้: "+error.message);}
  });
  $("metadata-import").addEventListener("click",()=>$("metadata-file").click());
  $("metadata-file").addEventListener("change",async()=>{
    const file=$("metadata-file").files[0];
    $("metadata-file").value="";
    if(!file)return;
    try{
      if(file.size>65536)throw new TypeError("ไฟล์ใหญ่เกินไป");
      const data=normalizeMetadata(JSON.parse(await file.text()));
      if(!confirm("นำเข้าข้อมูลรายวิชาจากไฟล์นี้?"))return;
      await perform(()=>store.importBackup(data,revision));
    }catch(error){announce("นำเข้าไม่ได้: "+error.message);}
  });
  window.addEventListener("beforeunload",event=>{if(dirty){event.preventDefault();event.returnValue="";}});
})();
