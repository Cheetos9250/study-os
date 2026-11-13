"use strict";
(() => {
  const api = globalThis.StudyOSPlanner;
  const get = id => document.getElementById(id);
  const open = get("open-planner"), form = get("plan-form"), panel = get("planner-content"), status = get("plan-status");
  if (!api || !open || !form || !panel || !status) return;
  const view = get("plan-view-date"), date = get("plan-date"), title = get("plan-title"), subject = get("plan-subject"), minutes = get("plan-minutes");
  let client = null, sessions = [], editing = null, busy = false, dirty = false;
  open.hidden = false;
  view.value = date.value = api.bangkokDate();
  function setBusy(value) {
    busy = value;
    for (const control of panel.querySelectorAll("button,input,select")) control.disabled = value;
    panel.setAttribute("aria-busy",String(value));
  }
  function resetEdit() {
    editing = null; dirty = false; title.value = ""; minutes.value = "30"; date.value = view.value;
    get("plan-save").textContent = "เพิ่มแผน"; get("plan-cancel").hidden = true;
  }
  function render() {
    const discovery = globalThis.StudyOSPlanDiscovery;
    const discoveryBox = get("plan-discovery");
    if (discoveryBox && discovery) {
      const groups = discovery.discoverPlans(sessions,api.bangkokDate());
      discoveryBox.textContent = `งานค้าง ${groups.overdue.length} · วันนี้ ${groups.today.length} · 7 วันข้างหน้า ${groups.upcoming.length} · เสร็จแล้ว ${groups.completed.length} รายการ (เฉพาะแผนในเบราว์เซอร์นี้)`;
      const discoveryList = get("plan-discovery-list");
      if (discoveryList) {
        const listRows=[];
        for (const [group,label] of [["overdue","งานค้าง"],["upcoming","แผนถัดไป"]]) {
          for (const item of groups[group]) {
            const row=document.createElement("li");
            row.dataset.planGroup=group;
            const button=document.createElement("button");
            button.type="button";
            button.textContent=`${label} · ${item.date} · ${item.title} · ${api.SUBJECTS[item.subject]} · ${item.minutes} นาที`;
            button.setAttribute("aria-label",`ดูแผนวันที่ ${item.date}: ${item.title}`);
            button.setAttribute("aria-controls","plan-list");
            button.addEventListener("click",()=>{
              view.value=item.date;
              render();
              status.textContent=`แสดงแผนวันที่ ${item.date} จากรายการ${label}`;
              get("plan-list").focus();
            });
            row.append(button);
            listRows.push(row);
          }
        }
        if (!listRows.length) {
          const empty=document.createElement("li");
          empty.textContent="ยังไม่มีงานค้างหรือแผนใน 7 วันข้างหน้า";
          listRows.push(empty);
        }
        discoveryList.replaceChildren(...listRows);
      }
    }
    if (!api.validDate(view.value)) {
      get("plan-summary").textContent = "เลือกวันที่เพื่อดูแผน"; get("plan-list").replaceChildren(); return;
    }
    const summary = api.summarizeDate(sessions,view.value);
    get("plan-summary").textContent = `${summary.count} รายการ · วางแผน ${summary.plannedMinutes} นาที · เสร็จแล้ว ${summary.done} รายการ (เวลาตามแผน ${summary.completedPlannedMinutes} นาที)`;
    const rows = sessions.filter(item => item.date === view.value).map(item => {
      const row = document.createElement("li"); row.className = "plan-row";
      const label = document.createElement("label");
      const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = item.done;
      checkbox.setAttribute("aria-label",`เรียนเสร็จ: ${item.title}`);
      const text = document.createElement("span"); text.textContent = `${item.title} · ${api.SUBJECTS[item.subject]} · ${item.minutes} นาที`;
      const link = document.createElement("a"); link.href = item.subject + ".html"; link.textContent = "เปิดวิชา";
      const edit = document.createElement("button"); edit.type = "button"; edit.textContent = "แก้ไข";
      edit.setAttribute("aria-label",`แก้ไขแผน: ${item.title}`);
      checkbox.addEventListener("change",() => action(async () => { await client.update(item.id,{done:checkbox.checked},item.revision); }));
      edit.addEventListener("click",() => {
        editing = item; dirty = false; subject.value = item.subject; title.value = item.title; date.value = item.date; minutes.value = String(item.minutes);
        get("plan-save").textContent = "บันทึกการแก้ไข"; get("plan-cancel").hidden = false; get("plan-cancel").textContent = "ยกเลิกการแก้ไข"; title.focus();
        status.textContent = "กำลังแก้ไขแผน เลือกบันทึกหรือยกเลิก";
      });
      label.append(checkbox,text); row.append(label,link,edit); return row;
    });
    if (!rows.length) { const empty = document.createElement("li"); empty.textContent = "ยังไม่มีแผนสำหรับวันที่เลือก"; rows.push(empty); }
    get("plan-list").replaceChildren(...rows);
  }
  async function reload() { sessions = await client.list(); render(); }
  async function action(task, success = "บันทึกแผนแล้ว") {
    if (busy) return false;
    setBusy(true); status.textContent = "กำลังบันทึกหรืออ่านแผน…";
    try { const result = await task(); await reload(); status.textContent = typeof success === "function" ? success(result) : success; return true; }
    catch(error) {
      status.textContent = error.name === "ImportConflictError" ? "ไฟล์มีแผนที่ต่างจากรายการปัจจุบัน จึงไม่นำเข้าหรือเขียนทับรายการใด กรุณาตรวจไฟล์ก่อน" : error.name === "ConflictError" ? "แผนนี้ถูกแก้ไขจากอีกแท็บแล้ว กดอัปเดตรายการและเลือกแก้ไขใหม่ ข้อความที่พิมพ์ไว้ยังอยู่" : "บันทึกหรืออ่านแผนไม่ได้ ข้อความที่พิมพ์ไว้ยังอยู่ กรุณาลองอีกครั้ง";
      // Restore checkbox state without replacing a draft or reading another namespace.
      render(); return false;
    } finally { setBusy(false); }
  }
  open.addEventListener("click",async () => {
    open.disabled = true; status.textContent = "กำลังเปิดแผน…";
    try {
      if (!client) client = await api.openPlanner(globalThis.indexedDB);
      await reload(); panel.hidden = false; open.hidden = true;
      status.textContent = "เปิดแผนแล้ว บันทึกเฉพาะเบราว์เซอร์นี้";
    } catch { status.textContent = "ยังเปิดแผนไม่ได้ เบราว์เซอร์อาจปิดกั้นการบันทึกหรือข้อมูลไม่รองรับ กรุณาลองอีกครั้ง"; }
    finally { open.disabled = false; }
  });
  function markDraft(){
    dirty=true;
    const cancel=get("plan-cancel");
    const label=editing ? "ยกเลิกการแก้ไข" : "ล้างแบบฟอร์ม";
    // WebKit may suppress a click if blur/change replaces button text between
    // pointerdown and mouseup. Never mutate this button when its label is unchanged.
    if(cancel.textContent!==label)cancel.textContent=label;
    if(cancel.hidden)cancel.hidden=false;
  }
  form.addEventListener("input",markDraft);
  form.addEventListener("change",markDraft);
  form.addEventListener("submit",async event => {
    event.preventDefault();
    const input = {subject:subject.value,title:title.value,date:date.value,minutes:Number(minutes.value)};
    const saved = await action(async () => {
      if (editing) await client.update(editing.id,input,editing.revision);
      else await client.add(input,crypto.randomUUID());
      view.value = input.date;
    });
    if (saved) resetEdit();
  });
  get("plan-cancel").addEventListener("click",() => { resetEdit(); status.textContent = "ยกเลิกการแก้ไขแล้ว"; });
  view.addEventListener("change",render);
  get("plan-today").addEventListener("click",() => { view.value = api.bangkokDate(); render(); });
  for (const [button,group] of [["plan-overdue","overdue"],["plan-upcoming","upcoming"]]) {
    get(button).addEventListener("click",() => {
      const records = globalThis.StudyOSPlanDiscovery.discoverPlans(sessions,api.bangkokDate())[group];
      if (!records.length) { status.textContent = group === "overdue" ? "ไม่มีแผนค้าง" : "ไม่มีแผนใน 7 วันข้างหน้า"; return; }
      view.value = records[0].date;
      render();
      status.textContent = group === "overdue" ? "แสดงแผนค้างวันที่เก่าที่สุด" : "แสดงแผนถัดไปวันที่ใกล้ที่สุด";
    });
  }
  get("plan-refresh").addEventListener("click",() => action(async () => {},"อัปเดตรายการแล้ว"));
  get("plan-import").addEventListener("click",() => get("plan-file").click());
  get("plan-file").addEventListener("change",async event => {
    const file = event.target.files[0];
    // Permit selecting the same file again after cancel, failure or a blocked draft.
    event.target.value = "";
    if (!file || busy) return;
    function warnDraft() {
      if (!dirty) return false;
      status.textContent = "มีข้อมูลแผนที่ยังไม่บันทึก กรุณาบันทึกแผนหรือกดล้างแบบฟอร์มก่อนนำเข้า";
      return true;
    }
    if (warnDraft()) return;
    let backup;
    try {
      if (file.size > 1024*1024) throw new TypeError("backup too large");
      backup = JSON.parse(await file.text());
      api.validateBackup(backup);
    } catch {
      status.textContent = "บันทึกหรืออ่านแผนไม่ได้ ไฟล์แผนไม่ถูกต้องหรือมีขนาดเกินกำหนด";
      return;
    }
    // Reading Files is asynchronous: the learner might have typed a draft meanwhile.
    if (busy || warnDraft()) return;
    if (!confirm(`ยืนยันนำเข้าแผน ${backup.sessions.length} รายการ? ระบบจะเพิ่มเฉพาะแผนที่ยังไม่มี และหยุดทั้งหมดหากข้อมูลขัดแย้ง`)) {
      status.textContent = "ยกเลิกการนำเข้าแล้ว ไม่มีข้อมูลเปลี่ยนแปลง";
      return;
    }
    await action(() => client.importBackup(backup),
      result => `นำเข้าเพิ่ม ${result.added} รายการ · มีอยู่แล้ว ${result.skipped} รายการ`);
  });
  get("plan-export").addEventListener("click",() => {
    if (dirty) {
      status.textContent="มีข้อมูลแผนที่ยังไม่บันทึก กรุณาบันทึกแผนหรือกดล้างแบบฟอร์มก่อนดาวน์โหลด";
      return;
    }
    return action(async () => {
    const records = await client.list();
    const payload = {format:"study-os-planner",version:1,exportedAt:new Date().toISOString(),sessions:records};
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    const link = document.createElement("a"); link.href = url; link.download = `study-os-plans-${api.bangkokDate()}.json`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),1000);
    },"เตรียมไฟล์แผนให้ดาวน์โหลดแล้ว");
  });
})();
