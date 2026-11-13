"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

test("read-only bundle audit reports no normalized duplicate fronts or quiz questions within category", () => {
  const output = execFileSync(process.execPath, [path.join(__dirname, "../scripts/study-os-content-audit.cjs")], { encoding: "utf8" });
  const report = JSON.parse(output);
  assert.equal(report.scope, "bundled content only; not Notion Verified");
  assert.deepEqual(report.subjects.map(item => item.key), ["acc", "eco", "math", "eng", "zh"]);
  for (const item of report.subjects) {
    assert.deepEqual(item.duplicateCardFrontsWithinCategory, [], item.key + " has duplicate card fronts");
    assert.deepEqual(item.duplicateQuizQuestionsWithinCategory, [], item.key + " has duplicate quiz questions");
  }
});
