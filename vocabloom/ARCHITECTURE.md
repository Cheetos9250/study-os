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

## Full Backup / Restore browser validation

The browser harness now also submits three malformed Full Backup variants directly to the actual `cFullRestore` handler in a disposable localStorage profile. It checks that rejected input cannot alter persisted data and cannot set a successful restore status. This is in addition to accepted/cancelled synthetic restore paths and Node-level rollback/async sync-race tests. No actual cloud service or existing learner storage is used. Hosted WebKit emulation is not equivalent to a physical iPad Safari/VoiceOver run.

## Restore daily-counter shape invariant

`cFullRestore` requires same-device `deviceDays` and `studyDays` (when supplied) to be non-array objects before they can enter the local daily-counter state. A backup from a different `deviceId` discards both daily-counter maps, including malformed source values. This preserves device-specific counter isolation and fails closed on same-device invalid types. Regression coverage uses disposable in-memory storage.

## Nested daily-row invariant

The same-device Full Restore importer validates each `deviceDays` and `studyDays` entry as a record. Optional `answered`/`correct` counters must be finite nonnegative numbers; optional `ids` must be an array of strings. This follows the `cLocalRecord` and `cStudyRecord` consumers. The cross-device isolation rule still discards source-device daily counters.

## Explicit Thai-sense distractor guard (2026-11-13)

Each eligible English Practice card now precomputes normalized Thai sense fragments split at explicit comma, semicolon or slash delimiters. Distractor rotation rejects any candidate sharing an **exact** fragment with the correct answer or an already selected wrong option. When three nonoverlapping distractors do not exist, the question is omitted instead of presenting ambiguous options. This is a bounded formatting-based check, not human semantic validation or a translation change. Existing practice IDs, frozen active session snapshots, source exports, SRS and cloud state remain unchanged.

## Read-only semantic review utility

`scripts/audit-thai-distractors.cjs` inspects committed Verified English rows offline and lists potential Thai-meaning collisions using exact substring containment and character-bigram similarity. The output is **review-only** JSON; the utility is not imported by the live application, never mutates Notion/source/progress, and does not suppress runtime choices. `tests/english-distractor-review.test.cjs` verifies stable output and explicitly retains the valid `unsaturated` / `saturated` contrast for human review.

## Session-completion feedback and repeated small-deck variety (2026-11-13)

English Practice displays an in-session completion notice only after **every frozen question has an answer**. It includes correct/total and missed counts and points to the existing Retry mistakes or New set actions. It is derived from `USTATE.practiceAnswers` and `USTATE.practiceQuestions` on render; no new storage keys, SRS/quiz scoring, cloud writes or backup schema changes.

For New set, the existing increment-by-ten rotation is retained for broad content coverage. Its round number now also adjusts distractor start and option order, so a five- or ten-card chapter can change visible options even when ten-step question rotation revisits the same words. Active snapshots and exact Retry mistakes options are still frozen; new sessions remain deterministic for the same source and offset.

## Practice focus continuity (2026-11-13)

The browser-only `uPracticeRefocus` helper restores focus to the inserted answer-feedback status after a Practice response and to the next question heading after Previous/Next, Retry mistakes, or New set. Targets receive `tabindex="-1"` for programmatic focus without entering the regular Tab sequence, and focus requests use `preventScroll`. This is a presentation-level accessibility safeguard: it does not read or write user storage, alter question snapshots, change legacy quiz/SRS behavior or claim physical Safari/VoiceOver certification. A no-DOM guard keeps synthetic Node tests safe.
