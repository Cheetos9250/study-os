"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseLegacyProgress } = require("../lib/study-os-legacy-progress-reader.cjs");

test("no snapshot data stays unknown rather than zero progress", () => {
  assert.deepEqual(parseLegacyProgress("acc", {}), {
    subject:"acc",studyObserved:false,srsObserved:false,legacyKnownCount:null,
    answeredQuestionCount:null,scheduledCardCount:null,quizAccuracyPercent:null,reviewCoveragePercent:null,
  });
});
test("legacy snapshot parses distinct known IDs and answer/SRS map sizes without writes", () => {
  const snapshot = {
    "study-eco":JSON.stringify({known:["c1","c1","c2"],ans:{"q1":0,"q2":2}}),
    "econ-flashcards-v1-srs":JSON.stringify({s:{"card-a":{due:123},"card-b":{due:456}},m:{day:0,newDone:0}}),
  };
  const before = JSON.stringify(snapshot);
  const result = parseLegacyProgress("eco", snapshot);
  assert.equal(result.legacyKnownCount, 2);
  assert.equal(result.answeredQuestionCount, 2);
  assert.equal(result.scheduledCardCount, 2);
  assert.equal(result.quizAccuracyPercent, null);
  assert.equal(result.reviewCoveragePercent, null);
  assert.equal(JSON.stringify(snapshot), before);
});
test("reject malformed snapshots and unsupported subjects", () => {
  assert.throws(() => parseLegacyProgress("zh", {}), TypeError);
  assert.throws(() => parseLegacyProgress("math", {"study-math":"not json"}), TypeError);
  assert.throws(() => parseLegacyProgress("acc", {"study-acc":"[]"}), TypeError);
  assert.throws(() => parseLegacyProgress("acc", {"study-acc":JSON.stringify({known:"yes"})}), TypeError);
});

test("malformed stored answers and SRS records fail closed", () => {
  for (const ans of [{q1:null},{q1:-1},{q1:1.5},{q1:"0"}]) {
    assert.throws(() => parseLegacyProgress("acc", {"study-acc":JSON.stringify({ans})}), TypeError);
  }
  for (const s of [{c1:null},{c1:[]},{c1:3}]) {
    assert.throws(() => parseLegacyProgress("acc", {"acc-flashcards-v1-srs":JSON.stringify({s})}), TypeError);
  }
});
