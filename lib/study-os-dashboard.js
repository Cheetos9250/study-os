"use strict";
// Explicit read-only access to six academic keys. Never enumerate storage or read secrets.
(() => {
  const button = document.getElementById("read-progress");
  const results = document.getElementById("progress-results");
  const status = document.getElementById("progress-status");
  if (!button || !results || !status || !globalThis.StudyOSProgress) return;
  const { KEYS, parseLegacyProgress } = globalThis.StudyOSProgress;
  const subjects = { acc: "Accounting", eco: "Economics", math: "Mathematics" };
  const count = value => value === null ? "ยังไม่มีข้อมูล" : String(value);
  button.hidden = false;
  button.addEventListener("click", () => {
    const rows = [];
    let failures = 0;
    for (const [subject, name] of Object.entries(subjects)) {
      const row = document.createElement("div");
      row.className = "progress-row";
      const heading = document.createElement("h3");
      heading.textContent = name;
      const description = document.createElement("p");
      try {
        const snapshot = {};
        for (const key of ["study-" + subject, KEYS[subject] + "-srs"]) {
          snapshot[key] = localStorage.getItem(key);
        }
        const progress = parseLegacyProgress(subject, snapshot);
        description.textContent = `ข้อที่เคยตอบ: ${count(progress.answeredQuestionCount)} · การ์ดที่มีตารางทบทวน: ${count(progress.scheduledCardCount)}`;
      } catch {
        failures++;
        description.textContent = "อ่านข้อมูลไม่ได้ ข้อมูลอาจไม่รองรับหรือเบราว์เซอร์ปิดกั้นการเข้าถึง";
      }
      row.append(heading, description);
      rows.push(row);
    }
    results.replaceChildren(...rows);
    status.textContent = failures ? `อ่านข้อมูลได้ ${3 - failures} จาก 3 วิชา โดยไม่ได้แก้ไขข้อมูลเดิม` : "อ่านข้อมูลแล้ว หากเพิ่งเรียนเพิ่มให้กดอ่านความก้าวหน้าอีกครั้ง";
  });
})();
