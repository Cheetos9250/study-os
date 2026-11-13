"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const {createSession,reviseSession} = require("../lib/study-os-planner.js");
const {discoverPlans} = require("../lib/study-os-plan-discovery.cjs");
const make = (id,date) => createSession({subject:"acc",title:"Study",date,minutes:30},id,1000);

test("plan discovery separates overdue, today, upcoming and completed", () => {
  const old = make("old","2026-11-12");
  const today = make("today","2026-11-13");
  const future = make("future","2026-11-20");
  const beyond = make("beyond","2026-11-21");
  const completed = reviseSession(make("completed","2026-11-10"),{done:true},1,1001);
  const sessions = [future,completed,today,beyond,old];
  const before = JSON.stringify(sessions);
  const result = discoverPlans(sessions,"2026-11-13");
  assert.deepEqual(result.overdue.map(x=>x.id),["old"]);
  assert.deepEqual(result.today.map(x=>x.id),["today"]);
  assert.deepEqual(result.upcoming.map(x=>x.id),["future"]);
  assert.deepEqual(result.completed.map(x=>x.id),["completed"]);
  assert.equal(JSON.stringify(sessions),before);
  assert.ok(Object.isFrozen(result));
});
test("date-only comparisons handle Bangkok-local day without browser timezone assumptions", () => {
  assert.deepEqual(discoverPlans([make("tomorrow","2026-11-14")],"2026-11-13",0).upcoming,[]);
  assert.equal(discoverPlans([make("tomorrow","2026-11-14")],"2026-11-13",1).upcoming.length,1);
});
test("invalid records and unreasonable horizons fail closed", () => {
  assert.throws(() => discoverPlans([],"2026-02-30"),TypeError);
  assert.throws(() => discoverPlans([],"2026-11-13",91),TypeError);
  assert.throws(() => discoverPlans([{id:"broken"}],"2026-11-13"),TypeError);
});
