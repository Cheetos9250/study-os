"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const config = JSON.parse(fs.readFileSync(path.join(root, "data", "config.json"), "utf8"));

test("Study OS primary navigation contains only academic subjects", () => {
  const section = html.match(/<section id="courses"[\s\S]*?<\/section>/);
  assert.ok(section, "academic courses section must exist");
  const keys = [...section[0].matchAll(/data-course="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(keys, ["acc", "eco", "math"]);
  for (const file of ["acc.html", "eco.html", "math.html"]) {
    assert.match(section[0], new RegExp('href="' + file.replace(".", "\\.") + '"'));
    assert.ok(fs.existsSync(path.join(root, file)), file + " must still exist");
  }
  assert.doesNotMatch(section[0], /href="(?:eng|zh)\.html"/);
});
test("Language experience is separate but existing links are preserved", () => {
  assert.match(html, /id="languages"/);
  assert.match(html, /href="vocabloom\/"/);
  for (const file of ["eng.html", "zh.html"]) {
    assert.match(html, new RegExp('href="' + file.replace(".", "\\.") + '"'));
    assert.ok(fs.existsSync(path.join(root, file)), file + " must still exist");
  }
});
test("Academic home is static: no token, storage, network, or score writes", () => {
  assert.doesNotMatch(html, /<script\b|<form\b|\blocalStorage\b|\bsessionStorage\b|\bfetch\s*\(|\/progress\/|SYNC_KEY|NOTION_TOKEN/i);
  assert.match(html, /<html lang="th">/);
  assert.match(html, /viewport/);
});
test("Published content endpoint must remain original", () => {
  assert.deepEqual(config, {api: "https://study-api.kasidit09022550.workers.dev"});
});
