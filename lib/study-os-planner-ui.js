"use strict";
(() => {
  const api = globalThis.StudyOSPlanner;
  const get = id => document.getElementById(id);
  const open = get("open-planner"), form = get("plan-form"), panel = get("planner-content"), status = get("plan-status");
  if (!api || !open || !form || !panel || !status) return;
  const view = get("plan-view-date"), date = get("plan-date"), title = get("plan-title"), subject = get("plan-subject"), minutes = get("plan-minutes");
  let client = null, sessions = [], editing = null, busy = false;
  open.hidden = false;
  view.value = date.value = api.bangkokDate();
  function setBusy(value) {
    busy = value;
    for (const control of panel.querySelectorAll("button,input,select")) control.disabled = value;
    panel.setAttribute("aria-busy",String(value));
  }
  function resetEdit() {
    editing = null; title.value = ""; minutes.value = "30"; date.value = view.value;
    get("plan-save").textContent = "เพิ่มแผน"; get("plan-cancel").hidden = true;
  }
  function render() {
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
        editing = item; subject.value = item.subject; title.value = item.title; date.value = item.date; minutes.value = String(item.minutes);
        get("plan-save").textContent = "บันทึกการแก้ไข"; get("plan-cancel").hidden = false; title.focus();
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
    try { await task(); await reload(); status.textContent = success; return true; }
    catch(error) {
      status.textContent = error.name === "ConflictError" ? "แผนนี้ถูกแก้ไขจากอีกแท็บแล้ว กดอัปเดตรายการและเลือกแก้ไขใหม่ ข้อความที่พิมพ์ไว้ยังอยู่" : "บันทึกหรืออ่านแผนไม่ได้ ข้อความที่พิมพ์ไว้ยังอยู่ กรุณาลองอีกครั้ง";
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
  view.addEventListener("change",() => { if (api.validDate(view.value)) render(); });
  get("plan-today").addEventListener("click",() => { view.value = api.bangkokDate(); render(); });
  get("plan-refresh").addEventListener("click",() => action(async () => {},"อัปเดตรายการแล้ว"));
  get("plan-export").addEventListener("click",() => action(async () => {
    const records = await client.list();
    const payload = {format:"study-os-planner",version:1,exportedAt:new Date().toISOString(),sessions:records};
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
    const link = document.createElement("a"); link.href = url; link.download = `study-os-plans-${api.bangkokDate()}.json`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),1000);
  },"เตรียมไฟล์แผนให้ดาวน์โหลดแล้ว"));
})();
