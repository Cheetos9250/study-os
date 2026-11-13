"use strict";
// Compare snapshots only. This report never merges, approves or edits content.
const SUBJECTS = Object.freeze({acc:"Accounting",eco:"Economics",math:"Math for Life"});
const normalize = text => String(text).normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
function auditSourceOverlap(bundle, exported) {
  if (!Array.isArray(bundle?.decks) || !Array.isArray(exported?.rows)) throw new TypeError("invalid content snapshots");
  return Object.entries(SUBJECTS).map(([subject, label]) => {
    const deck = bundle.decks.find(item => item.key === subject);
    if (!deck || !Array.isArray(deck.quiz)) throw new TypeError("missing academic quiz deck");
    const rows = exported.rows.filter(row => row.Subject === label);
    if (rows.some(row => row.Status !== "Verified" || typeof row.Question !== "string" || !row.Question.trim() || typeof row.Correct !== "string" || !row.Correct.trim())) throw new TypeError("invalid Verified quiz export");
    const matches = [];
    for (const [bundledIndex, quiz] of deck.quiz.entries()) {
      if (!Array.isArray(quiz) || typeof quiz[1] !== "string" || !quiz[1].trim() || !Array.isArray(quiz[2]) || !Number.isInteger(quiz[3]) || typeof quiz[2][quiz[3]] !== "string") throw new TypeError("invalid bundled quiz");
      for (const [exportIndex, row] of rows.entries()) {
        if (normalize(quiz[1]) === normalize(row.Question)) matches.push({
          bundledIndex, exportIndex, question: quiz[1],
          answerTextMatches: normalize(quiz[2][quiz[3]]) === normalize(row.Correct),
        });
      }
    }
    return {subject, bundledQuizzes:deck.quiz.length, exportedQuizzes:rows.length,
      exactQuestionMatches:matches, answerTextConflicts:matches.filter(match => !match.answerTextMatches).length};
  });
}
if (require.main === module) {
  const fs = require("node:fs");
  const path = require("node:path");
  const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
  console.log(JSON.stringify({scope:"offline snapshot comparison; exact normalized question text within subject, across chapters; no semantic or correctness claim",subjects:auditSourceOverlap(read("vocabloom/study-decks.json"),read("data/quiz.json"))}, null, 2));
}
module.exports = {auditSourceOverlap};
