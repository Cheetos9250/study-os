"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {openCourseMetadata,ConflictError,DATABASE}=require("../lib/study-os-course-metadata-store.js");
test("metadata persistence remains an isolated, opt-in database",()=>{
  assert.equal(DATABASE,"study-os-course-metadata-v1");
  assert.equal(ConflictError.name,"ConflictError");
  const source=fs.readFileSync(path.join(__dirname,"../lib/study-os-course-metadata-store.js"),"utf8");
  assert.doesNotMatch(source,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|study-acc|study-eco|study-math|deleteDatabase/);
  assert.match(source,/transaction\(STORE,"readwrite"\)/);
  assert.match(source,/revision!==expectedRevision/);
  assert.match(source,/normalizeMetadata\(backup\)/);
});
test("metadata store never opens browser storage without explicit caller factory",async()=>{
  await assert.rejects(openCourseMetadata(),TypeError);
});
