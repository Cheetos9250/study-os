"use strict";
(() => {
  const input = document.getElementById("course-search");
  const list = document.getElementById("course-list");
  const status = document.getElementById("course-search-status");
  if (!input || !list || !status) return;
  const cards = [...list.querySelectorAll("a[data-course]")];
  const update = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const words = (card.dataset.search || "") + " " + card.textContent;
      const match = words.toLocaleLowerCase().includes(query);
      card.hidden = !match;
      if (match) visible++;
    }
    status.textContent = visible ? `แสดง ${visible} จาก ${cards.length} วิชา` : "ไม่พบรายวิชาที่ตรงกับคำค้น";
  };
  input.addEventListener("input", update);
  input.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !input.value) return;
    input.value = "";
    update();
    event.preventDefault();
  });
})();
