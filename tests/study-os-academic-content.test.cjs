"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = JSON.parse(fs.readFileSync(path.join(root, "vocabloom/study-decks.json"), "utf8"));
const expected = {
  acc: { cards: 221, quiz: 42, sum: 16, cats: 9, markKey: "acc-flashcards-v1" },
  eco: { cards: 139, quiz: 60, sum: 11, cats: 7, markKey: "econ-flashcards-v1" },
  math: { cards: 67, quiz: 34, sum: 6, cats: 3, markKey: "math-flashcards-v1" },
  eng: { cards: 51 },
  zh: { cards: 279 },
};

test("bundled source is an explicitly read-only five-subject snapshot", () => {
  assert.equal(source.schemaVersion, 1);
  assert.equal(source.readOnly, true);
  assert.deepEqual(source.decks.map(deck => deck.key), ["acc", "eco", "math", "eng", "zh"]);
});

for (const [key, counts] of Object.entries(expected)) {
  test(key + " bundled content retains its baseline counts and identifiers", () => {
    const deck = source.decks.find(item => item.key === key);
    assert.ok(deck, key + " missing");
    assert.equal(deck.cards.length, counts.cards);
    if (counts.quiz !== undefined) assert.equal(deck.quiz.length, counts.quiz);
    if (counts.sum !== undefined) assert.equal(deck.sum.length, counts.sum);
    if (counts.cats !== undefined) assert.equal(deck.cats.length, counts.cats);
    if (counts.markKey !== undefined) assert.equal(deck.markKey, counts.markKey);
    const categoryKeys = new Set(deck.cats.map(cat => cat[0]));
    assert.equal(categoryKeys.size, deck.cats.length, key + " duplicate categories");
    for (const card of deck.cards) {
      assert.ok(categoryKeys.has(card[0]), key + " unknown card category: " + card[0]);
      assert.ok(typeof card[1] === "string" && card[1].trim(), key + " empty card front");
      assert.ok(typeof card[2] === "string" && card[2].trim(), key + " empty card back");
    }
  });
}

test("academic bundled card identifiers are unique within each subject", () => {
  for (const key of ["acc", "eco", "math"]) {
    const deck = source.decks.find(item => item.key === key);
    const ids = deck.cards.map(card => card[4]);
    assert.ok(ids.every(id => typeof id === "string" && id.trim()), key + " missing card identifier");
    assert.equal(new Set(ids).size, ids.length, key + " duplicate card identifiers");
  }
});

test("existing academic course pages and language legacy pages remain present", () => {
  for (const key of ["acc", "eco", "math", "eng", "zh"]) {
    const html = fs.readFileSync(path.join(root, key + ".html"), "utf8");
    assert.match(html, /<html\b/i);
    assert.match(html, /<script\b/i);
  }
});
