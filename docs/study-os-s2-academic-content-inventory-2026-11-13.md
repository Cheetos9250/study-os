# Study OS — S2 Academic Content Inventory (read-only)

Date: 2026-11-13. Source baseline: `main` and the same shared legacy deck file, `vocabloom/study-decks.json`. No Notion status change, migration or production write.

## Source definitions

- **Bundled**: rows in `vocabloom/study-decks.json` (derived from embedded original subject pages). This is not a count of Notion records and is not proof that all content is accurate.
- **Verified Notion export**: rows in `data/cards.json` and `data/quiz.json` that passed the exporter. These are distinct sources; do not blindly add quiz totals without deduplication.
- **Draft Notion**: not published to production. A large Draft backlog is not verified content.
- **Summary**: bundled summary entries in the shared deck, not necessarily standalone notes or a complete textbook.

## Inventory from current source

| Subject | Bundled cards | Bundled quiz | Bundled summaries | Bundled categories | Verified Notion cards | Verified Notion quiz | Draft Notion cards | Draft Notion quiz |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Accounting (`acc`) | 221 | 42 | 16 | 9 | 0 | 197 | 13 | 427 |
| Economics (`eco`) | 139 | 60 | 11 | 7 | 0 | 25 | 0 | 3 |
| Mathematics (`math`) | 67 | 34 | 6 | 3 | 0 | 0 | 0 | 0 |

These counts were calculated from the deck arrays and read-only Notion aggregate queries. Bundled IDs are unique within each deck (221/221, 139/139, 67/67). The legacy content and Notion quizzes may overlap conceptually or exactly; a source-to-source duplicate audit is required before any combined total is marketed.

## Shared language content: retain, do not promote

- `eng`: 51 bundled cards; `zh`: 279 bundled cards. These are legacy shared-data subjects and **must not be deleted**.
- `data/cards.json` has 582 English rows; Notion has 583 Verified English rows. One duplicate normalized front `rebound` in chapter `ศัพท์ข่าว` was observed in Notion; check exporter dedupe logic before editing any record.

## Findings / next safe development priorities

1. **P0 — No destructive cleanup:** Preserve the existing deck, localStorage keys (`acc-flashcards-v1`, `econ-flashcards-v1`, `math-flashcards-v1`), progress data and legacy pages.
2. **P1 — Practice discovery:** Surface bundled flashcards, quizzes and summaries from each course page. Do not falsely label bundled content as Notion Verified.
3. **P1 — Mathematics coverage:** There is no Verified Notion quiz or card in this database; the 67 bundled cards and 34 bundled quizzes remain important.
4. **P1 — Accounting review queue:** 427 Draft quiz questions need content verification, not mass approval. Audit duplicates, correct answer, distractors, explanation and chapter before changing Status.
5. **P2 — Source identity contract:** Keep stable `acc/eco/math/eng/zh` IDs, `markKey`, Notion Subject labels and legacy progress keys. Add automated contract tests before any shared integration changes.
6. **P2 — Learning analytics:** Define measurable completion/due/accuracy from existing SRS keys and quiz answers. Avoid merging distinct storage namespaces without a verified compatibility plan.
7. **P3 — Cross-device reliability:** Versioned CAS remains blocked until independent administrative KV backup, staged readback and rollback approval.

## Verification status

- GitHub connector source inventory: **verified**.
- Notion status aggregates: **verified read-only**.
- Content correctness, duplicates between bundled and Notion, browser runtime, iPad Safari, Cloudflare live Worker and KV: **not verified**.
- No deployment, merge, Notion writes or KV writes performed.
