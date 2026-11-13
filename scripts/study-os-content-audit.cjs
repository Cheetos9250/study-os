"use strict";
// Read-only diagnostic. Never writes to the bundle, Notion, progress or production.
const fs = require("node:fs");
const path = require("node:path");
const source = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../vocabloom/study-decks.json"), "utf8"));
const normalize = value => String(value).normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
const report = {
  source: "vocabloom/study-decks.json",
  scope: "bundled content only; not Notion Verified",
  subjects: [],
};
for (const deck of source.decks) {
  const seen = new Map();
  const duplicates = [];
  for (const [index, card] of deck.cards.entries()) {
    const key = normalize(card[0]) + "::" + normalize(card[1]);
    if (seen.has(key)) duplicates.push({ first: seen.get(key), second: index, front: card[1], category: card[0] });
    else seen.set(key, index);
  }
  const quizSeen = new Map();
  const quizDuplicates = [];
  for (const [index, quiz] of deck.quiz.entries()) {
    const key = normalize(quiz[0]) + "::" + normalize(quiz[1]);
    if (quizSeen.has(key)) quizDuplicates.push({ first: quizSeen.get(key), second: index, question: quiz[1], category: quiz[0] });
    else quizSeen.set(key, index);
  }
  report.subjects.push({
    key: deck.key,
    cards: deck.cards.length,
    quizzes: deck.quiz.length,
    summaries: deck.sum.length,
    duplicateCardFrontsWithinCategory: duplicates,
    duplicateQuizQuestionsWithinCategory: quizDuplicates,
  });
}
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
