# data/ — what each part is

Nothing here is personal data (rule 1 in `AGENTS.md`). The site reads these files as they are; do not move or rename them.

| Path | What | Edit how |
|---|---|---|
| `courses/<course>.js` | Everything one course page needs, as `const D = {...};` on one line (cards, summaries, quiz). Read by the course pages and by Today, Lessons, Grades, Calendar, Stats and search. | Never rewrite with regex. |
| `courses/acc.js` (quiz part), `courses/acc-extra.js` | **Generated** from `acc-questions/` by `node scripts/build-acc-questions.cjs`. | Edit `acc-questions/`, then rebuild. |
| `courses/acc-snapshot.js`, `courses/eco-snapshot.js` | Saved Notion quiz rows (Notion retired 15 Nov 2026). Frozen. | Do not edit. |
| `acc-questions/` | **Source** of the accounting question bank, one JSON line per question per chapter. See `acc-questions/README.md`. | Append only; never change or reorder ids. |
| `math-written/chN.json` | Math written problems (ids `MATH<ch>-<n>`). | |
| `textbook-sos/chN.json` | Textbook-style written answers (built by `scripts/textbook-sos/chN.py`). | Rebuild with the script. |
| `quiz.json`, `cards.json` | Older shared quiz/cards (used by Practice/Flashcards and search). | |
| `formulas.json`, `formulas-slides.json` | Formula sheet page. | |
| `accounting-textbook-index.json`, `accounting-textbook-geometry.json` | Textbook chapter index and page layout for My PDF sets. | |
| `config.json` | Live Worker URLs. | Ask the owner first (rule 5). |

**Reading the repo in a Claude chat:** the accounting questions exist twice (source `acc-questions/` and generated `courses/acc.js` + `courses/acc-extra.js`). One copy is enough to read; the snapshots are frozen history.
