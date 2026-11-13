"use strict";
(() => {
  // Opt-in, read-only course presentation on the draft homepage.
  // Never changes stable subject IDs, destination hrefs, planner state or legacy progress.
  const list=document.getElementById("course-list");
  const load=document.getElementById("course-metadata-apply");
  const revert=document.getElementById("course-metadata-default");
  const status=document.getElementById("course-metadata-status");
  const search=document.getElementById("course-search");
  if(!list || !load || !revert || !status || !search)return;
  const model=globalThis.StudyOSCourseMetadata;
  const storage=globalThis.StudyOSCourseMetadataStore;
  if(!model || !storage){
    status.textContent="ไม่สามารถเปิดโมดูลรายวิชาได้ กรุณาโหลดหน้าอีกครั้ง";
    load.disabled=true;
    return;
  }
  const defaults=[...list.querySelectorAll("a[data-course]")].map((card,index)=>({
    id:card.dataset.course,
    card,
    name:card.querySelector("h3").textContent,
    description:card.querySelector("p").textContent,
    number:card.querySelector(".num").textContent,
    order:index
  }));
  const byId=new Map(defaults.map(row=>[row.id,row]));
  // Anchor URLs and data-course never come from browser storage.
  const render=(metadata)=>{
    const validated=model.normalizeMetadata(metadata);
    for(const [index,id] of validated.order.entries()){
      const original=byId.get(id);
      original.card.querySelector("h3").textContent=validated.courses[id].name;
      original.card.querySelector("p").textContent=validated.courses[id].description;
      original.card.querySelector(".num").textContent="COURSE "+String(index+1).padStart(2,"0");
      list.append(original.card);
    }
    // Refresh existing search results, including custom Thai/English titles.
    search.dispatchEvent(new Event("input",{bubbles:true}));
  };
  load.hidden=false;
  load.addEventListener("click",async()=>{
    if(load.disabled)return;
    load.disabled=true;
    load.setAttribute("aria-busy","true");
    let client;
    try{
      client=await storage.openCourseMetadata(globalThis.indexedDB);
      const saved=await client.read();
      render(saved.metadata);
      revert.hidden=false;
      status.textContent=saved.revision===0
        ?"ยังไม่มีชื่อรายวิชาที่บันทึกไว้ จึงแสดงชื่อเริ่มต้น"
        :"แสดงชื่อรายวิชาที่บันทึกไว้ในเบราว์เซอร์นี้แล้ว (Revision "+saved.revision+")";
    }catch(error){
      // A denied/corrupt IndexedDB read must never replace cards with untrusted data.
      status.textContent="อ่านชื่อรายวิชาที่บันทึกไว้ไม่ได้ ข้อมูลบนหน้าจอยังไม่เปลี่ยน กรุณาตรวจสอบหน้าจัดการรายวิชา";
    }finally{
      if(client)client.close();
      load.disabled=false;
      load.removeAttribute("aria-busy");
    }
  });
  revert.addEventListener("click",()=>{
    for(const row of defaults){
      row.card.querySelector("h3").textContent=row.name;
      row.card.querySelector("p").textContent=row.description;
      row.card.querySelector(".num").textContent=row.number;
      list.append(row.card);
    }
    search.dispatchEvent(new Event("input",{bubbles:true}));
    revert.hidden=true;
    status.textContent="แสดงชื่อเริ่มต้นแล้ว ข้อมูลที่เคยบันทึกไว้ไม่ได้ถูกลบ";
  });
})();
