"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const planner = require("../lib/study-os-planner.js");
const input = {subject:"acc",title:" Adjusting entries ",date:"2026-11-13",minutes:30};
test("new plan is unfinished and separate from observed learning progress", () => {
  const before = JSON.stringify(input);
  const record = planner.createSession(input,"test-id",1000);
  assert.equal(record.title,"Adjusting entries");
  assert.equal(record.done,false);
  assert.equal(record.revision,1);
  assert.ok(Object.isFrozen(record));
  assert.equal(JSON.stringify(input),before);
  assert.notEqual(planner.DB_NAME,"study-acc");
});
test("real calendar dates and Bangkok midnight boundaries", () => {
  assert.equal(planner.validDate("2028-02-29"),true);
  for (const date of ["2026-02-29","2026-04-31","2026-00-10","2026-13-01","13/11/2026",""]) assert.equal(planner.validDate(date),false);
  assert.equal(planner.bangkokDate(Date.parse("2026-11-13T16:59:59Z")),"2026-11-13");
  assert.equal(planner.bangkokDate(Date.parse("2026-11-13T17:00:00Z")),"2026-11-14");
});
test("reject unsupported subjects, whitespace titles, invalid duration and identifiers", () => {
  for (const patch of [{subject:"eng"},{subject:"__proto__"},{title:" "},{title:"x".repeat(161)},{date:"2026-02-30"},{minutes:0},{minutes:241},{minutes:1.5},{minutes:"30"}]) {
    assert.throws(() => planner.createSession({...input,...patch},"id",1000),TypeError);
  }
  assert.throws(() => planner.createSession(input,"<invalid>",1000),TypeError);
});
test("editing preserves identity and explicit completion, and advances revision despite clock rollback", () => {
  const original = planner.createSession(input,"id",1000);
  const done = planner.reviseSession(original,{done:true},1,1001);
  const edited = planner.reviseSession(done,{title:"New topic",date:"2026-11-14",subject:"eco",minutes:45},2,999);
  assert.equal(edited.revision,3);
  assert.equal(edited.createdAt,1000);
  assert.equal(edited.updatedAt,1001);
  assert.equal(edited.done,true);
  assert.equal(original.done,false);
  assert.equal(planner.reviseSession(edited,{done:false},3,1002).done,false);
});
test("stale revisions reject edits instead of silently overwriting another tab", () => {
  const original = planner.createSession(input,"id",1000);
  const current = planner.reviseSession(original,{title:"Other tab"},1,1001);
  assert.throws(() => planner.reviseSession(current,{done:true},1,1002), {name:"ConflictError"});
  assert.equal(current.done,false);
});
test("reject version drift, corrupted records and edits to immutable fields", () => {
  const original = planner.createSession(input,"id",1000);
  for (const patch of [{schemaVersion:2},{revision:0},{revision:NaN},{done:"yes"},{createdAt:-1},{updatedAt:999}]) {
    assert.throws(() => planner.validateSession({...original,...patch}),TypeError);
  }
  for (const patch of [{id:"new"},{schemaVersion:2},{revision:99},{createdAt:500},{unknown:1},null]) {
    assert.throws(() => planner.reviseSession(original,patch,1,1001),TypeError);
  }
});
test("date summary separates planned minutes from explicitly completed plan minutes", () => {
  const first = planner.createSession(input,"first",1000);
  const second = planner.reviseSession(planner.createSession({...input,minutes:45},"second",1000),{done:true},1,1001);
  const tomorrow = planner.createSession({...input,date:"2026-11-14"},"third",1000);
  assert.deepEqual(planner.summarizeDate([first,second,tomorrow],input.date),{count:2,done:1,plannedMinutes:75,completedPlannedMinutes:45});
  assert.deepEqual(planner.summarizeDate([],input.date),{count:0,done:0,plannedMinutes:0,completedPlannedMinutes:0});
});
test("unavailable or denied storage fails without a memory fallback", async () => {
  await assert.rejects(planner.openPlanner(undefined),/unavailable/);
  await assert.rejects(planner.openPlanner({open(){throw new Error("denied");}}),/denied/);
});
test("planner never references legacy storage, secrets, cloud APIs or database deletion", () => {
  const root = path.join(__dirname,"..");
  for (const file of ["lib/study-os-planner.js","lib/study-os-planner-ui.js"]) {
    assert.doesNotMatch(fs.readFileSync(path.join(root,file),"utf8"),/localStorage|sessionStorage|SYNC_KEY|NOTION_TOKEN|fetch\s*\(|XMLHttpRequest|deleteDatabase|innerHTML/);
  }
});
