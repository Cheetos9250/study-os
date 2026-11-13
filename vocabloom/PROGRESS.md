# VocaBloom — Development Progress

Updated: 2026-11-13 (feature branch only)

## Scope

VocaBloom is a **language-learning application**. English B1–B2 is the first learning experience; Chinese and other languages follow later. Accounting, Economics and Math belong to Study OS, not the VocaBloom presentation. The five legacy deck IDs, storage keys, SRS and quiz data remain preserved.

## Current state

- Branch: `feat/vocabloom-p1-english-ui-20261113`, Draft PR #41. **Not merged or deployed**.
- English-only navigation and integrated English Flashcards, chapter filtering, local-only Vocabulary Practice (10 questions/4 distinct Thai options), and Verified quiz provenance are implemented on the branch.
- Practice answers stay in session and do not modify Study OS quizzes, SRS or progress. Invalid/missing choices are rejected, chapter changes reset the session, and active questions are frozen during asynchronous content refresh.
- Verified English content audit against committed `data/cards.json`: 582 rows, 413 pipe-formatted (236 meaning-first, 177 part-of-speech-first) and 169 multiline. The meaning parser now supports both pipe orders. There are no Verified English quiz records in the committed quiz export; generated Practice is clearly labeled as distinct.
- Executable Node tests exercise disposable mock Full Backup/Restore, local rollback and async sync races; client-side CAS/legacy sync, endpoint-specific consent and credential scoping; committed English content quality. GitHub Actions passed for the final code/test commit `beefd11d628bd0bc87424dbaea7785c93e1b0800`.
- Practice accessibility improvements add polite live status announcements for scores and answer feedback, question descriptions on options, and explicit selected-answer state. Node regression passed at commit `6fd9a8b6e7895158c312559ea364179a14efae55` (run 43359349142). Physical iPad VoiceOver remains untested.
- The detailed evidence and links are in `P0-P1-ENGLISH-EXPERIENCE-AUDIT.md`.

## Safety boundary

No merge, production deploy, Notion change, Cloudflare Worker/KV change, production migration, Auto Sync activation or real progress writes were performed. Node mock results **do not** establish actual Safari or backend CAS behavior.

## Release gate

**BLOCKED** pending physical iPad Safari/VoiceOver testing and independent staging CAS atomicity/readback verification, plus explicit owner authorization for any production deployment or migration. See `SAFARI-RELEASE-QA.md` and `PHASE-6-PRODUCTION-CUTOVER-READINESS.md`.

## Continuous development — 2026-11-13

- Continued from PR #41 head `5bb1261`, preserving the existing working proposal.
- Fixed the main vocabulary importer independently of the earlier integrated Practice fix: 236 POS-tag translations now read the Thai field correctly. All 573 imported IDs and word count are unchanged.
- Fixed cross-chapter practice deduplication and added Retry mistakes using only current-session incorrect answers, with no SRS/cloud/persistent score writes.
- Local verification: **226 Node regressions + 3 Python exporter tests + 62 synthetic CAS tests passed**. Browser launch attempted but blocked by the environment's socket permissions; no browser pass claimed.
- Read-only refresh: Pages GET 200; Worker content GETs 403; Notion English Verified 583 versus committed 582 with the known two-sense `rebound` duplicate. Administrative KV and live cross-device data remain unverified.
- See `CONTINUOUS-AUDIT-2026-11-13.md` for exact scope, commands, sources and limitations; new `PROJECT.md`/`ARCHITECTURE.md`/`DECISIONS.md`/`CHANGELOG.md` provide continuation context.

### Hosted browser gate completed

- Added `tests/browser_smoke.py` and the read-only no-deploy browser workflow. Initial dependency failure on Ubuntu 26.04 was corrected by pinning Ubuntu 24.04.
- **Four browser cases passed**: Chromium and WebKit, each desktop and tablet viewport. Real DOM interaction, practice storage isolation, synthetic SRS persistence after reload, and academic fixture preservation were verified with all services mocked.
- Tested code/workflow SHA: `17aaf38ada559e4f4ea5849360980fb70ed0f145`. Browser CI: https://github.com/Cheetos9250/study-os/actions/runs/43360796688 ; Node/Python regression CI: https://github.com/Cheetos9250/study-os/actions/runs/43360796750 — both **success**, logs inspected.
- This closes the hosted browser automation gap only. Physical Safari/VoiceOver, actual production progress and staging CAS persistence remain open release gates. No production release or merge occurred.

## Continuous round 2 — inflected examples and source feedback

- Baseline: `fb1caf114cd5bd8dac094fcd9fa5db12994abdbe`, existing PR #41; implementation `bd4135fa15dc336910e4f4f77e250288d466b2ef`.
- English importer now checks whole token sequences and POS-guided regular inflections. Eight previously excluded entries are usable, increasing the committed-data import from **573 to 581**. All previous 573 IDs remain present; source examples, source rows and persistent IDs are unchanged. `securities filing` remains excluded because its example omits `securities`.
- Practice feedback now displays the source example after answering, with a translated example and source label when available. Context is frozen with the question snapshot, escaped for HTML and omitted when not supplied. No generated examples, SRS updates or persistent Practice scores.
- Local regression: **232 Node tests and 3 Python exporter tests passed**. Hosted Chromium/WebKit coverage now additionally checks source refresh during an active answer and disposable Full Backup/Restore including cancellation. Hosted browser results are verified below.

### Round 2 CI evidence

- Implementation `bd4135fa15dc336910e4f4f77e250288d466b2ef`: regression run https://github.com/Cheetos9250/study-os/actions/runs/43363405764 and browser run https://github.com/Cheetos9250/study-os/actions/runs/43363405759 both completed **success**.
- Browser job `131681983704` logs show **4 passed** cases (Chromium/WebKit, desktop/tablet), each importing 581 words and reporting zero live service requests. The extended content-refresh and disposable download/cancelled-restore/accepted-restore assertions executed as part of each case.
- Data/config, five legacy course pages, shared decks, Notion exporter and unified-progress code were unchanged in this round. Hosted browser emulation remains distinct from physical iPad/Safari and actual cross-device KV tests.
