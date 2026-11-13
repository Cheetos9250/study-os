# VocaBloom architecture

## Current proposal

- `index.html`: English vocabulary app, local lessons/games/progress, read-only Verified English import from the existing public GitHub export.
- `study-integration.js`: English-only presentation over the shared five-deck source, integrated flashcards/SRS, Verified quizzes and session-only vocabulary practice.
- `unified-progress.js`: bridges vocabulary progress with legacy card schedules; handles backup/restore, endpoint-bound credentials, endpoint-bound Auto Sync consent and optional sync.
- `study-decks.json`: all five legacy decks remain intact, including 279 Chinese cards. English uses `eng` and `eng-vocab-v1`; do not rename persistent identities for a UI refactor.
- `../data/cards.json` and `quiz.json`: shared Notion Verified exports. `scripts/sync_notion.py` and the existing scheduled workflow own export production; this branch does not change them.
- `../data/config.json`: existing content `api` only. No production `progress_api` cutover.

## Data boundaries

The main English importer and integrated deck reader are separate adapters. Both must parse meaning-first and POS-first pipe rows. Main vocabulary imports retain the historical `notion-...` IDs; integrated cards retain `n-...` IDs. Fix parsing without changing either identity scheme.

Vocabulary Practice stores its frozen questions and answers only in `USTATE`. Retry mistakes uses the exact answered incorrect questions/options from the current snapshot, clears that round's answers, and starts at question one. It neither reads nor writes SRS, legacy quiz scores or cloud progress. Changing chapter and New set reset the snapshot. Chapter filtering occurs before practice deduplication.

Legacy production KV is not atomic CAS. Experimental staging and production-candidate CAS code lives under `experiments/`; its offline in-memory tests are not production verification. The existing Notion `/cards`, `/quiz`, `/review` service must stay separate from any future CAS progress endpoint.

## Separation plan

Continue language-only adapters/navigation first. Do not remove academic/Chinese data, shared backup coverage or writer guards. A separate backend/data migration requires authoritative private five-subject backups, staging persistence/concurrency evidence, old-writer reconciliation and explicit approval. See `PHASE-6-PRODUCTION-CUTOVER-READINESS.md`.

## Browser QA boundary

`tests/browser_smoke.py` creates disposable Chromium/WebKit profiles. A route handler serves app files and the English export from the checked-out tree, blocks external services and all non-GET requests, and checks that Practice leaves persistent storage unchanged. It then exercises a synthetic flashcard schedule and reload without altering academic fixture records. The dedicated CI uses Ubuntu 24.04 with a pinned Playwright dependency; it does not deploy or use application secrets. Tablet emulation is not physical iPad evidence.

## Round 2 eligibility and answer context

The English importer checks complete normalized English token sequences. POS-guided regular noun/verb forms allow reviewed examples with inflections; phrasal-verb particles remain mandatory. General irregular forms and partial-headword matches remain unsupported. Existing imported IDs are derived exactly as before; the original 573-word set is preserved and eight eligible entries are added.

`uPracticeContext` reads supplied examples/translations from the same Back field used for meanings. Frozen question objects now carry that context and their source reference. Answer feedback escapes every text field; no example is synthesized. Context is withheld until the learner answers, then remains stable through source refresh and Retry mistakes.
