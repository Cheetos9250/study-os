"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const {auditSourceOverlap} = require("../scripts/study-os-source-overlap.cjs");
const bundle = {decks:[{key:"acc",quiz:[["c1"," Same  question? ",["Correct","Other"],0,"Explanation"]]},{key:"eco",quiz:[]},{key:"math",quiz:[]}]};
test("overlap ignores spacing and chapter changes but isolates subjects and flags answer conflicts", () => {
  const rows = [{Subject:"Accounting",Status:"Verified",Chapter:"different",Question:"same question?",Correct:"correct"},{Subject:"Accounting",Status:"Verified",Question:"Same question?",Correct:"Other"},{Subject:"Economics",Status:"Verified",Question:"Same question?",Correct:"Other"}];
  const before = JSON.stringify({bundle,rows});
  const report = auditSourceOverlap(bundle,{rows});
  assert.equal(report[0].exactQuestionMatches.length,2);
  assert.equal(report[0].answerTextConflicts,1);
  assert.equal(report[1].exactQuestionMatches.length,0);
  assert.equal(JSON.stringify({bundle,rows}),before);
});
test("reject unverified or malformed academic source data", () => {
  assert.throws(() => auditSourceOverlap(bundle,{rows:[{Subject:"Accounting",Status:"Draft"}]}),TypeError);
  assert.throws(() => auditSourceOverlap({decks:[]},{rows:[]}),TypeError);
});
test("repository snapshots can be compared without adding their totals", () => {
  const report = auditSourceOverlap(require("../vocabloom/study-decks.json"), require("../data/quiz.json"));
  assert.deepEqual(report.map(row => row.subject), ["acc","eco","math"]);
  assert.deepEqual(report.map(row => row.bundledQuizzes), [42,60,34]);
});
