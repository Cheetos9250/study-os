# Accounting question bank

One file per chapter (`c1.json` … `c9.json`), one question per line:
`{"id":"err-b23","row":["c8","Question?",["right answer","wrong","wrong","wrong"],0,"Explanation"],"hide":true}`

- `row` = `[chapter, question, options, index of the right option, explanation, case text (only for sets with "case": true)]`. The right option is written first; the page shuffles them.
- Ids are what saved answers use, so never change, reorder or delete one. `"0"`, `"1"` … are the rows of `D.quiz` in `data/courses/acc.js` (the id is the row position). `err-3`, `brc-12` … belong to a set listed in `_sets.json` (`pre` + number).
- **Add a question:** append a line at the end of its chapter file with the next free id of the newest set, and raise that set's `count` in `_sets.json`. For a new batch, add a set to `_sets.json` with a new prefix and a new seed.
- `"hide": true` keeps a near-duplicate out of practice (answers stay saved).
- After editing run `node scripts/build-acc-questions.cjs`. It rewrites the quiz part of `data/courses/acc.js` and all of `data/courses/acc-extra.js`; commit all of them. `--check` fails when they are out of date (the test suite runs it).
