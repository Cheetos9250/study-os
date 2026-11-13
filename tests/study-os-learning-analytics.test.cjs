"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { summarizeLearning } = require("../lib/study-os-learning-analytics.cjs");

test("empty observations remain unknown instead of claiming zero quiz accuracy", () => {
  assert.deepEqual(summarizeLearning({ totalCards: 10 }), {
    totalCards: 10, reviewedCards: 0, reviewCoveragePercent: 0,
    quizAttempts: 0, correctAttempts: 0, quizAccuracyPercent: null,
  });
});
test("zero-card deck has unknown review coverage", () => {
  assert.equal(summarizeLearning({ totalCards: 0 }).reviewCoveragePercent, null);
});
test("reviewed cards deduplicate and quiz accuracy counts attempts", () => {
  assert.deepEqual(summarizeLearning({
    totalCards: 4, reviewedIds: ["a", "a", "b"],
    attempts: [{ correct: true }, { correct: false }, { correct: true }],
  }), {
    totalCards: 4, reviewedCards: 2, reviewCoveragePercent: 50,
    quizAttempts: 3, correctAttempts: 2, quizAccuracyPercent: 66.67,
  });
});
test("reject invalid observations rather than silently corrupt metrics", () => {
  assert.throws(() => summarizeLearning({ totalCards: -1 }), TypeError);
  assert.throws(() => summarizeLearning({ totalCards: 1, reviewedIds: ["a", "b"] }), RangeError);
  assert.throws(() => summarizeLearning({ totalCards: 1, attempts: [{ correct: "yes" }] }), TypeError);
  assert.throws(() => summarizeLearning({ totalCards: 1, reviewedIds: [""] }), TypeError);
});
