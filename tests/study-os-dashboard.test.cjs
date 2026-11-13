"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
function mount(values = {}, denied = false) {
  // Minimal DOM simulation, not a browser or layout test.
  const element = () => ({ children: [], textContent: "", hidden: true,
    append(...nodes) { this.children.push(...nodes); },
    replaceChildren(...nodes) { this.children = nodes; },
    addEventListener(name, callback) { this[name] = callback; },
  });
  const nodes = Object.fromEntries(["read-progress", "progress-results", "progress-status"].map(id => [id, element()]));
  const reads = [];
  const context = vm.createContext({
    document: { getElementById: id => nodes[id], createElement: element },
    localStorage: {
      getItem(key) { reads.push(key); if (denied) throw Error("blocked"); return values[key] ?? null; },
      setItem() { assert.fail("must not write"); }, removeItem() { assert.fail("must not delete"); },
    },
    fetch() { assert.fail("must not send requests"); },
  });
  for (const file of ["study-os-legacy-progress-reader.js", "study-os-dashboard.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "../lib", file), "utf8"), context);
  }
  return { nodes, reads, click: () => nodes["read-progress"].click(), text: () => nodes["progress-results"].children.map(row => row.children[1].textContent) };
}
test("dashboard reads only six academic keys on explicit request and never touches secrets", () => {
  const values = { "study-acc": JSON.stringify({ans:{q1:0}}), "acc-flashcards-v1-srs": JSON.stringify({s:{c1:{due:123}}}) };
  const before = JSON.stringify(values);
  const app = mount(values);
  assert.deepEqual(app.reads, []);
  assert.equal(app.nodes["read-progress"].hidden, false);
  app.click();
  assert.deepEqual(app.reads, ["study-acc", "acc-flashcards-v1-srs", "study-eco", "econ-flashcards-v1-srs", "study-math", "math-flashcards-v1-srs"]);
  assert.match(app.text()[0], /ข้อที่เคยตอบ: 1/);
  assert.match(app.text()[1], /ยังไม่มีข้อมูล/);
  assert.equal(JSON.stringify(values), before);
  values["study-acc"] = JSON.stringify({ans:{}});
  app.click();
  assert.match(app.text()[0], /ข้อที่เคยตอบ: 0/);
  assert.equal(app.nodes["progress-results"].children.length, 3);
});
test("one corrupt subject does not hide healthy subjects or expose raw values", () => {
  const app = mount({"study-acc":"<secret broken json>","study-eco":JSON.stringify({ans:{q1:1}})});
  app.click();
  assert.match(app.text()[0], /อ่านข้อมูลไม่ได้/);
  assert.doesNotMatch(app.text().join(""), /secret/);
  assert.match(app.text()[1], /ข้อที่เคยตอบ: 1/);
  assert.match(app.nodes["progress-status"].textContent, /2 จาก 3/);
});
test("blocked storage reports unavailable without writes or fabricated zero progress", () => {
  const app = mount({}, true);
  app.click();
  assert.ok(app.text().every(text => text.includes("อ่านข้อมูลไม่ได้")));
  assert.match(app.nodes["progress-status"].textContent, /0 จาก 3/);
});
