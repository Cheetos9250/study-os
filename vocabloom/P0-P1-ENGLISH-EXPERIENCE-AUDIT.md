# VocaBloom P0 Audit / P1 English-only Experience (non-production)

**Date:** 13 November 2026 (Asia/Bangkok)  
**Baseline:** `main` at `79cd71d8cba833e374a686c7add1710715170733`  
**Working branch:** `feat/vocabloom-p1-english-ui-20261113`  
**Environment:** GitHub source + read-only Notion data source queries; **no production deployment**  
**Change scope:** VocaBloom presentation only; legacy Study OS and data preservation are mandatory.

## P0 findings and evidence

- Repository is `Cheetos9250/study-os`; the repository root has **no README.md** at this baseline. Read the Handoff v1.1 plus `vocabloom/PHASE-6-PRODUCTION-CUTOVER-READINESS.md` and `vocabloom/PHASE-6-WRITER-INVENTORY.md` instead.
- The baseline's latest Pages run was successful: https://github.com/Cheetos9250/study-os/actions/runs/43346617814 . The scheduled Notion export run was successful: https://github.com/Cheetos9250/study-os/actions/runs/43346592049 . These prove GitHub workflow status, **not** browser-level live behavior or Cloudflare progress integrity.
- Open PRs at audit: #1 (legacy Notion loading) and draft #39 (Verified export safety). Do **not** merge or assume either was applied to `main`.
- `vocabloom/study-decks.json` contains five original decks, keys `acc,eco,math,eng,zh`, 757 total built-in cards (221,139,67,51,279). All five `markKey` identities must remain unchanged.
- Read-only Notion query: Flashcards had **583 Verified English Vocab rows**, with **582 distinct (Subject, Chapter, lowercased Front) keys**. The GitHub `data/cards.json` export has **582** English Verified rows, 582 unique page IDs, and both English chapter names match `eng` deck's categories. The one-row difference is explained by deduplication, not an established data-loss incident.
- `data/quiz.json` has **222 Verified rows**: 197 Accounting, 25 Economics, **zero English**. Notion SQL likewise found zero English Quiz rows; the current Quiz data-source subject options include only Accounting, Economics and Math for Life. The built-in English deck has zero quiz records. This is a P2 content gap, **not** a reason to invent English quizzes during P1.
- Existing English capabilities in source: vocabulary screens and lessons, word library, picture/audio pronunciation interfaces, practice games, English cards, SRS and local progress. Browser-level readiness and functionality are **not independently validated** by this audit. Grammar/Reading/Listening/Speaking/Writing/AI tutor are **planned or require a feature-by-feature audit**, not certified deployed.
- `data/config.json` has only `api` pointing to the original content/legacy KV Worker. Keep it unchanged. The legacy KV progress endpoint remains last-writer-wins and a Production CAS cutover is still **NOT authorized**.
- `vocabloom/study-integration.js` originally exposed all five academic/language decks as Study Flashcards, and defaulted to `acc`, conflicting with the new English-first product scope.
- Live Pages HTML and the Cloudflare dashboard/KV binding were **not independently checked** in this session; public website retrieval did not return usable data. No private backup, live KV contents, or staging persistence evidence has been changed or asserted validated.

## P1 implementation on this branch only

1. Add a fixed `UACTIVE_LANGUAGE='eng'` presentation selector and `uVisibleDecks()`; **retain** the complete `USTATE.decks` for all five subjects.
2. Default integrated card experience to English. Render only `eng` cards on home, daily review, and integrated flashcard/quiz tab, using original English card/SRS keys.
3. Reject any non-English `u-subject` UI event, including a fabricated DOM event. Leave all legacy Study OS pages and Notion/Progress writers intact.
4. Rename the integrated navigation label to English Flashcards. Do not rekey, rewrite, migrate, or filter stored data.
5. Add `vocabloom/tests/english-only-ui.test.cjs` to exercise English-only rendering, forbidden subject selection, unchanged five-deck identities, and unchanged content Worker config.

**Changed files** (proposed): `vocabloom/study-integration.js`, `vocabloom/tests/english-only-ui.test.cjs`, and this audit document. The branch makes no modifications to `data/cards.json`, `data/quiz.json`, `data/config.json`, `vocabloom/unified-progress.js`, or legacy `acc/eco/math/eng/zh.html`.

## Risk, validation and remaining gates

- Automated CI: **PASS** on draft PR #41 at commit `c69ff92b00a39de3e00139695b3c1d130979940b`, run https://github.com/Cheetos9250/study-os/actions/runs/43351073664 . **180/180 Node tests** and **3/3 Python tests** passed; the three new P1 isolation tests are included. This is repository CI, not live browser or Cloudflare QA.
- Cross-device/real-browser QA **not yet completed**: iPad Safari, university browser, offline/cache behavior, local Full Backup/Restore, SRS continuity across refresh, and all five legacy Study OS subjects. These need careful non-destructive tests on a dedicated test profile.
- Cloudflare runtime/Production KV and any CAS Staging writes **not tested**. Production migration remains blocked without separate approvals, independently validated backups, writer freeze, and rollback gates.
- Current content `api` and optional `progress_api` selection unchanged; no secret changes, Auto Sync enablement, import, merge, or deploy.
- **Rollback for code proposal:** close the draft PR or revert these branch-only commits; since no data/schema changes occur and `main` is untouched, the historical state remains available. This is *not* an authorization to reset browser-local progress.

## P1 acceptance

- [x] English-only filter and default were implemented on a separate branch.
- [x] Original five decks and all shared sync/legacy files were preserved in the proposed diff.
- [x] PR/Actions regression results verified for this branch (run `43351073664`, 180 Node and 3 Python passed).
- [ ] Real iPad Safari/manual visual QA completed.
- [ ] Independent live Worker/Notion behavior/backup verification completed (read-only only).
- [ ] Owner approval for future merge or deploy (not requested or implied here).

**Status:** P0 repository/Notion audit complete with remaining live-environment limitations; P1 implemented in a feature branch and GitHub CI passed. Real iPad browser and Cloudflare read-only QA are still outstanding. **No merge, no Production deploy, no data migration.**

## Follow-up P1 verification — Handoff v1.2 (13 Nov 2026)

- Handoff v1.2 now explicitly separates VocaBloom (language-first) and Study OS (academic subjects). This feature branch remains a **UI-only proposal** with no merge/deploy/migration.
- Added `vocabloom/tests/english-entrypoint-contract.test.cjs` to check desktop and mobile/iPad navigation source, viewport declaration, English-only Verified import parser, stable historical Notion word IDs, deduplication, original five deck identities, and unchanged production content endpoint. Tests compile the pure parser without loading the application; **no network, storage or live Worker actions**.
- Found and corrected two test assumptions during CI: the mobile navigation legitimately includes Settings, and the historical Notion word ID retains the last 40 alphanumeric characters. These were **test fixture errors**, not app defects.
- Final CI for code commit `2e53db1cfe59183877d16d79bf26d1a6b2f8086d`: GitHub Actions run https://github.com/Cheetos9250/study-os/actions/runs/43351838716 — **success**. This confirms the branch's offline test suite, not real Safari or Cloudflare Production behavior.
- Still blocked for release: actual iPad Safari interaction, full local backup/restore on disposable profile, read-only live Cloudflare/KV validation, and explicit owner approval for any merge or deployment.

## P1/P2 safety follow-up — offline progress and backup contracts

- Added `vocabloom/tests/progress-preservation-contract.test.cjs` (4 offline tests) for two-device SRS/answer merge, newest card revision selection, reset timestamp handling, day counters, five-deck restore completeness, confirmation-before-write, rollback scaffolding, and absence of cloud sync during local restore.
- GitHub Actions push run https://github.com/Cheetos9250/study-os/actions/runs/43352012898 at code SHA `577e6e4a0ed4257c952fad234ad59d7304e62229`: **success**. This is offline CI only; no actual backup was imported and no Worker was contacted.
- These tests are not a proof that legacy KV last-writer-wins is safe; Production CAS remains blocked and all iPad/live QA gates remain open.

## P2 English Verified vocabulary parser fix — branch only

- Repository export inspected at the branch baseline: 582 Verified English rows. The existing VocaBloom `parseNotionExport` accepted 412 using only the historical pipe-separated `Back` format; multiline news entries with `Example:` were skipped.
- Updated `vocabloom/index.html` to support both the historical `part of speech | meaning | example` and the Verified multiline `part of speech — meaning\\nExample: sentence` format. Original `notion-...` word ID derivation, dedupe, subject/status filter, storage key, and SRS progress remain unchanged.
- Recount with the same eligibility checks: **573 of 582** Verified rows are eligible after the patch (up from 412). The remaining nine are not silently rewritten or invented; their examples use different inflections, omit the exact headword, or use a different phrasing. A later content-quality review should decide whether to relax that validation without affecting identity.
- Added regression assertions for current news entries including breakthrough, preservation, deluge, ambassador and pedestrian; original pipe-format regression still runs.
- GitHub Actions CI: https://github.com/Cheetos9250/study-os/actions/runs/43352286978 at SHA `16a47bdd7c6db2e9759874be8b159dfdad2374e9` — **success**. This is GitHub CI, not deployed app behavior. No Notion writes or Worker/KV changes.
- English Verified **quiz** records remain absent; this fix only increases imported vocabulary availability. Do not describe derived practice games as Notion Verified quizzes.

## P2 English Vocabulary Practice — session-only proposal

- Added a `Vocabulary Practice` tab to the English integrated panel. Questions are deterministically generated from existing English vocabulary cards, with four distinct Thai-meaning options and a ten-question session. `New set` rotates to the next ten vocabulary entries.
- The tab is labeled **practice generated from existing English vocabulary**, explicitly distinct from the `Verified Quizzes (0)` tab. No Notion Quiz rows are invented or written.
- Practice answers exist only in `USTATE.practiceAnswers` in memory. They do **not** write `study-eng`, `eng-vocab-v1-srs`, `vocabloom_mvp_v1`, or Cloudflare; existing flashcard SRS and Verified quiz answer handling are unchanged.
- Added `vocabloom/tests/english-practice.test.cjs` for 10-question generation, deterministic answer options, both vocabulary meaning formats, and absence of persistence in practice action.
- GitHub Actions CI for code SHA `836c17e695f7f401ac23005968b71de30bcc9133`: https://github.com/Cheetos9250/study-os/actions/runs/43352649466 — **success**. Earlier failing runs were caused by incorrect escaping in new tests/code and were fixed before this passing run.
- This remains an **unmerged feature-branch proposal**, not a tested live iPad/Safari or deployed Production feature. Release gates from Handoff v1.2 remain open.

## P2 chapter-filter and practice continuity QA

- Fixed an English Practice integration defect: selecting a chapter now constrains both questions and distractor meanings to that chapter, rather than drawing from the entire English deck.
- Changing chapter clears the in-memory practice answers, resets the practice offset, and returns to question one. No persistent progress keys, Notion records, or Cloudflare/KV data were modified.
- Extended `english-practice.test.cjs` with chapter filtering, missing-chapter empty state, and session-reset checks. GitHub Actions CI passed at SHA `d5bb29a9f22f0afa80497d4d52e54a4c796bbd70`, run https://github.com/Cheetos9250/study-os/actions/runs/43352826565 .
- Browser/iPad Safari, live Cloudflare, backup/restore and cross-device concurrency remain unverified. No merge/deployment authorized.

## P2 practice snapshot consistency — offline QA

- Discovered a correctness risk: `uPracticeQuestions` regenerated its questions on every render. A Verified content refresh while the learner was answering could replace question text, options or answer indexes mid-session.
- Added an in-memory `USTATE.practiceQuestions` snapshot. The first valid practice set is frozen until the learner explicitly selects `New set` or changes chapter; then answers and snapshot are cleared. This does not write to SRS, `study-eng`, Notion, KV, or any other persistent progress store.
- Extended `english-practice.test.cjs` with a simulated content change during an active session and an explicit reset/reload check. CI: https://github.com/Cheetos9250/study-os/actions/runs/43353516522 — **success** at SHA `5d9ed1f87023cf9c1d51f58deb37c6856d19fe80`. Earlier intermediate CI failures were corrected by updating the new test contract.
- Limitation: this is a source-level/offline regression test, not a real iPad Safari/browser test. Cross-device legacy KV last-writer-wins safety remains unverified. No merge, deployment or production data mutation authorized.

## P2 practice action isolation — executable offline test

- Added a Node.js test that invokes the actual `uAction` handler with mock deck and in-memory session, while mocking `localStorage.getItem/setItem` to throw if accessed.
- Verified: first answer records the selected option; a second answer cannot overwrite it; switching to Flashcards and back preserves the active session; `New set` clears answers and frozen question snapshot.
- This is stronger than source-string checks, but still not an end-to-end browser/iPad test. It does not exercise live Notion, Cloudflare KV, cross-device CAS, or Production storage.
- GitHub Actions CI passed for SHA `6660bfb734a9903c1f3064bd7e460f5b1fc5ae65`: https://github.com/Cheetos9250/study-os/actions/runs/43353704504 .
- PR #41 remains draft; no merge or deployment.

## P2 real-export integration data contract

- Added `vocabloom/tests/english-integration-data.test.cjs`, executing the real integrated `uCards`, `uQuiz`, and `uPracticeQuestions` functions against the committed `study-decks.json`, `data/cards.json`, and `data/quiz.json` exports.
- Verified English integrated cards exceed the original 51-card deck, retain unique card IDs, and generate ten local practice questions; English Verified quiz count remains zero and no practice content is presented as a Notion Verified quiz.
- Verified a simulated Draft English row is excluded without changing the original deck or existing quiz data. Legacy deck quiz counts remain `[42,60,34,0,0]`, and the committed Notion quiz export contains 222 rows, none English.
- GitHub Actions CI passed at SHA `b89cf5543748fce29bf63ba85d51367f0c6b6270`: https://github.com/Cheetos9250/study-os/actions/runs/43353863921 .
- Tests are repository-data and offline runtime tests only; not live Notion/Worker/KV, actual iPad Safari or production cross-device sync tests. No deployment or merge authorized.
