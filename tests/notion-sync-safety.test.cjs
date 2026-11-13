"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yml = fs.readFileSync(path.join(__dirname, "..", ".github", "workflows", "sync.yml"), "utf8");

test("scheduled Notion sync cannot push directly to main or trigger a Pages release", () => {
  assert.doesNotMatch(yml, /^\s*git\s+push\b/m);
  assert.doesNotMatch(yml, /gh api -X POST|pages\/builds|git commit -m/);
  assert.doesNotMatch(yml, /^\s*pages:\s*write\s*$/m);
  assert.match(yml, /github\.ref == 'refs\/heads\/main'/);
});

test("Notion updates are proposed as reviewable draft PRs", () => {
  assert.match(yml, /peter-evans\/create-pull-request@v7/);
  assert.match(yml, /^\s*pull-requests:\s*write\s*$/m);
  assert.match(yml, /^\s*draft:\s*true\s*$/m);
  assert.match(yml, /^\s*base:\s*main\s*$/m);
  assert.match(yml, /^\s*branch:\s*automation\/notion-verified-content\s*$/m);
});

test("sync only stages existing data files, not source/config or user secrets", () => {
  const match = yml.match(/^\s*add-paths:\s*\|\s*\n((?:\s{12,}[^\n]+\n)*)/m);
  assert.ok(match, "add-paths allowlist is missing");
  const paths = match[1].trim().split(/\n/).map(s => s.trim()).filter(Boolean);
  assert.deepEqual(paths, ["data/cards.json", "data/quiz.json"]);
  assert.match(yml, /NOTION_TOKEN: \$\{\{ secrets\.NOTION_TOKEN \}\}/);
  assert.match(yml, /python3 scripts\/sync_notion\.py/);
});

test("schedule remains manual/scheduled and does not run on a pull request", () => {
  assert.match(yml, /^\s*schedule:\s*$/m);
  assert.match(yml, /^\s*workflow_dispatch:\s*$/m);
  assert.doesNotMatch(yml, /^\s*pull_request:\s*$/m);
  assert.doesNotMatch(yml, /^\s*push:\s*$/m);
});

test("the exporter passes fixture validation before opening a content PR", () => {
  const exportStep = yml.indexOf("python3 scripts/sync_notion.py");
  const checkStep = yml.indexOf("python3 -m unittest discover -s vocabloom/tests");
  const nodeStep = yml.indexOf("node --test vocabloom/tests/*.test.cjs");
  const prStep = yml.indexOf("uses: peter-evans/create-pull-request@v7");
  assert.ok(exportStep >= 0 && exportStep < checkStep);
  assert.ok(checkStep < nodeStep && nodeStep < prStep);
});
