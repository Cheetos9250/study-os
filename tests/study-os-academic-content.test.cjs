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


test("academic quiz items have valid choices, answers and explanations", () => {
  for (const key of ["acc", "eco", "math"]) {
    const deck = source.decks.find(item => item.key === key);
    const categories = new Set(deck.cats.map(cat => cat[0]));
    for (const [index, item] of deck.quiz.entries()) {
      assert.ok(Array.isArray(item) && item.length >= 5, key + " quiz " + index + " malformed");
      const [cat, question, options, answer, explanation] = item;
      assert.ok(categories.has(cat), key + " quiz " + index + " unknown category");
      assert.ok(typeof question === "string" && question.trim(), key + " quiz " + index + " missing question");
      assert.ok(Array.isArray(options) && options.length >= 2, key + " quiz " + index + " missing choices");
      assert.ok(options.every(option => typeof option === "string" && option.trim()), key + " quiz " + index + " blank choice");
      assert.ok(Number.isInteger(answer) && answer >= 0 && answer < options.length, key + " quiz " + index + " invalid answer index");
      assert.ok(typeof explanation === "string" && explanation.trim(), key + " quiz " + index + " missing explanation");
    }
  }
});

test("academic summaries have valid headings, category references and table rows", () => {
  for (const key of ["acc", "eco", "math"]) {
    const deck = source.decks.find(item => item.key === key);
    const categories = new Set(deck.cats.map(cat => cat[0]));
    for (const [index, item] of deck.sum.entries()) {
      assert.ok(categories.has(item.cat), key + " summary " + index + " unknown category");
      assert.ok(typeof item.h === "string" && item.h.trim(), key + " summary " + index + " missing heading");
      assert.ok(Array.isArray(item.head) && item.head.length >= 2, key + " summary " + index + " missing table headings");
      assert.ok(Array.isArray(item.rows) && item.rows.length > 0, key + " summary " + index + " missing rows");
      assert.ok(item.rows.every(row => Array.isArray(row) && row.length === item.head.length), key + " summary " + index + " inconsistent columns");
    }
  }
});


test("all five legacy course pages retain their existing progress storage namespaces", () => {
  for (const deck of source.decks) {
    const html = fs.readFileSync(path.join(root, deck.key + ".html"), "utf8");
    assert.ok(typeof deck.markKey === "string" && deck.markKey.trim(), deck.key + " missing progress namespace");
    assert.ok(html.includes(deck.markKey), deck.key + " page no longer references " + deck.markKey);
  }
});

test("academic course pages retain their three learning modes", () => {
  for (const key of ["acc", "eco", "math"]) {
    const html = fs.readFileSync(path.join(root, key + ".html"), "utf8");
    for (const tab of ["cards", "sum", "prac"]) {
      assert.ok(html.includes('data-tab="' + tab + '"'), key + " missing " + tab + " tab");
      assert.ok(html.includes('id="tab-' + tab + '"'), key + " missing " + tab + " panel");
    }
  }
});
