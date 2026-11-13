"use strict";
// Pure, offline analytics over caller-supplied observations. No storage or network access.
// Unknown/unobserved values are deliberately null, never treated as zero achievement.
function summarizeLearning(input) {
  if (!input || !Number.isInteger(input.totalCards) || input.totalCards < 0) throw new TypeError("totalCards must be a nonnegative integer");
  const attempts = input.attempts === undefined ? [] : input.attempts;
  const reviewedIds = input.reviewedIds === undefined ? [] : input.reviewedIds;
  if (!Array.isArray(attempts) || !Array.isArray(reviewedIds)) throw new TypeError("attempts and reviewedIds must be arrays");
  const unique = new Set();
  for (const id of reviewedIds) {
    if (typeof id !== "string" || !id.trim()) throw new TypeError("reviewed IDs must be nonempty strings");
    unique.add(id);
  }
  if (unique.size > input.totalCards) throw new RangeError("reviewed cards exceed total cards");
  let correct = 0;
  for (const attempt of attempts) {
    if (!attempt || typeof attempt.correct !== "boolean") throw new TypeError("attempt.correct must be boolean");
    if (attempt.correct) correct++;
  }
  return Object.freeze({
    totalCards: input.totalCards,
    reviewedCards: unique.size,
    reviewCoveragePercent: input.totalCards ? Math.round(unique.size / input.totalCards * 10000) / 100 : null,
    quizAttempts: attempts.length,
    correctAttempts: correct,
    quizAccuracyPercent: attempts.length ? Math.round(correct / attempts.length * 10000) / 100 : null,
  });
}
module.exports = { summarizeLearning };
