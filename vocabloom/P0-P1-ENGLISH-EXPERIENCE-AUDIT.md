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
