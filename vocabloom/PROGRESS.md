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

### Practice generation performance follow-up

- Removed a redundant nested duplicate scan from distractor generation; the candidate pool already has unique normalized meanings.
- Local regression now **233 Node tests passed**, including 1,000-card option correctness. One local real-export measurement improved from 843 ms to 3 ms for ten generated questions; physical-device performance is unmeasured.
- Audited 650 rotated question instances with zero exact shared Thai-meaning atoms between the correct option and distractors. This is structural QA, not a complete semantic review.

### Verified performance follow-up CI

- Final application/test SHA `20f27cc8656296d55840bec2fff5208571b4145c`: regression https://github.com/Cheetos9250/study-os/actions/runs/43364282209 and browser https://github.com/Cheetos9250/study-os/actions/runs/43364281981 completed **success**. All four extended browser cases passed with 581 imported words and zero live service requests.
- Browser workflow path filters now track app HTML/JS/JSON, tests, data exports and the workflow itself, so documentation-only push commits do not reinstall browsers. The job's permissions and isolated execution are unchanged.

### Browser malformed-backup regression extension

- Added isolated Chromium/WebKit browser checks to `tests/browser_smoke.py` that submit three synthetic invalid Full Backup structures (subjects array, progress array, missing English subject) to the actual restore handler and assert no browser storage changes or successful restore status.
- Source commit: `f269d5f9514580f75785e71a430042a8db282c68`. Browser workflow: https://github.com/Cheetos9250/study-os/actions/runs/43367784703 . At documentation time the browser run was **in progress**, not yet verified as passed. Node regression run https://github.com/Cheetos9250/study-os/actions/runs/43367785010 completed **success**.
- The test runs in a disposable mocked browser profile with no live Worker/Notion/KV requests. It does not exercise real Safari on iPad or real cross-device synchronization.

### Browser malformed-backup gate — verified

- Both CI runs for code/test SHA `f269d5f9514580f75785e71a430042a8db282c68` completed **success**: [regression 43367785010](https://github.com/Cheetos9250/study-os/actions/runs/43367785010), [isolated Chromium/WebKit browser 43367784703](https://github.com/Cheetos9250/study-os/actions/runs/43367784703).
- The isolated browser test now rejects synthetic invalid Full Backup shapes (subjects array, progress array, missing English subject) without changing disposable localStorage. It also covers backup cancellation and accepted synthetic restore from prior rounds.
- This verifies the mocked browser path, **not** a physical iPad Safari or live Cloudflare/KV write.
- Documentation alignment is being updated in this branch; this note supersedes the earlier `in progress` browser status recorded above.

### Documentation reconciliation and quota rollback browser test

- Reconciled `CHANGELOG.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `NEXT_STEPS.md`, `PROJECT.md`, `PROGRESS.md` and the continuous audit with verified browser restore results. Created `AGENTS.md` for cross-agent continuation and release boundaries.
- Added a one-shot synthetic `QuotaExceededError` in disposable browser Full Restore, then asserted that all localStorage values return to their pre-restore snapshot. Test code SHA: `e79267315c0f3d28286f8d1c8d7ae651b0d2383f`. CI runs [browser 43368381323](https://github.com/Cheetos9250/study-os/actions/runs/43368381323) and [regression 43368381319](https://github.com/Cheetos9250/study-os/actions/runs/43368381319) were **queued at time of writing**. Do not count this scenario as passed until both workflows complete.
- No live progress writes, Worker/KV/Notion modifications, merge or deployment.

### Quota rollback CI result and deeper in-memory check

- The earlier browser quota-write rollback test at SHA `e79267315c0f3d28286f8d1c8d7ae651b0d2383f` **passed** in [isolated browser run 43368381323](https://github.com/Cheetos9250/study-os/actions/runs/43368381323); [regression run 43368381319](https://github.com/Cheetos9250/study-os/actions/runs/43368381319) also **passed**. These verify disposable browser localStorage rollback, not live user data.
- Added a stricter assertion at SHA `c7d287357360fbdc10c7ea33f3e7a10ded3f9413` to compare the in-memory `data`, `CLOCAL.days` and `CLOCAL.studyDays` snapshots before/after a one-shot synthetic quota failure. This follow-up needs its **own** CI confirmation and must not inherit the earlier success claim.

### Daily-counter backup validation hardening

- Verified the previous in-memory quota rollback browser extension: [browser 43368920021](https://github.com/Cheetos9250/study-os/actions/runs/43368920021) and [regression 43368920096](https://github.com/Cheetos9250/study-os/actions/runs/43368920096) both completed **success**.
- Found a separate restore-validation gap: same-device `deviceDays` and `studyDays` accepted arrays and scalars because `typeof [] === 'object'`. Updated `unified-progress.js` to reject malformed same-device daily maps before confirmation/writes, while ignoring cross-device daily maps as before. Added executable regression cases for both behaviors at SHA `ef260b87a69167a802fd61020ef84099db29a635`.
- New regression/browser workflows [43369307639](https://github.com/Cheetos9250/study-os/actions/runs/43369307639) and [43369307661](https://github.com/Cheetos9250/study-os/actions/runs/43369307661) were **in progress** when documented. No production data was touched.

### Continuous follow-up — browser daily-map restore validation

- Verified the earlier daily-map code/test commit `ef260b87a69167a802fd61020ef84099db29a635`: regression [43369307639](https://github.com/Cheetos9250/study-os/actions/runs/43369307639) and browser [43369307661](https://github.com/Cheetos9250/study-os/actions/runs/43369307661) both **success**. The documentation head `4d288f6e3dc0963f963dc46353903a4598b0176e` also passed browser [43369380885](https://github.com/Cheetos9250/study-os/actions/runs/43369380885) and regression [43369380820](https://github.com/Cheetos9250/study-os/actions/runs/43369380820).
- Added an actual-browser rejection check for same-device malformed `deviceDays` and `studyDays` maps using disposable storage, code/test SHA `2c8569bd9693d2998b3f5dd80749764637bc973a`. [Browser CI 43369918907](https://github.com/Cheetos9250/study-os/actions/runs/43369918907) and [regression CI 43369918882](https://github.com/Cheetos9250/study-os/actions/runs/43369918882) were **in progress** when documented; verify before claiming success.

### Nested daily-row restore validation — pending CI

- Verified previous malformed same-device daily-map browser tests at SHA `2c8569bd9693d2998b3f5dd80749764637bc973a`: [browser 43369918907](https://github.com/Cheetos9250/study-os/actions/runs/43369918907) and [regression 43369918882](https://github.com/Cheetos9250/study-os/actions/runs/43369918882) completed **success**.
- Inspected actual `cLocalRecord` and `cStudyRecord` consumers. Added same-device Full Restore validation of nested daily rows: record-shaped entries, finite nonnegative numeric `answered`/`correct`, and string-array `ids` when present. Added synthetic tests rejecting malformed rows and preserving valid counters, code/test SHA `f5b6c75b2c6dc475e82dfcdaae909394a5c7c304`.
- CI for this newest code/test SHA was still queued/running at documentation time. No live service or production storage changes.

### Nested daily-row CI verified; browser assertions extended

- Implementation SHA `f5b6c75b2c6dc475e82dfcdaae909394a5c7c304`: [regression 43370356856](https://github.com/Cheetos9250/study-os/actions/runs/43370356856) and [isolated browser 43370356909](https://github.com/Cheetos9250/study-os/actions/runs/43370356909) both completed **success**.
- Added direct browser checks for nested same-device daily counter failures (negative answered, nonnumeric correct, non-string IDs), asserting unchanged disposable localStorage at code/test SHA `f737cf7886ba797c86d2e6ef9fa503cd4b8e8f13`. This **new** browser extension awaits its own CI confirmation.
- This remains isolated Chromium/WebKit QA, not real iPad Safari or staging Cloudflare persistence.

### Historical Full Backup compatibility checks

- Direct browser nested-row rejection at SHA `f737cf7886ba797c86d2e6ef9fa503cd4b8e8f13` verified: [browser 43370623091](https://github.com/Cheetos9250/study-os/actions/runs/43370623091) and [regression 43370623145](https://github.com/Cheetos9250/study-os/actions/runs/43370623145) both **success**. Documentation head `55f1d0e4a84f390b353e20113b2cdf68128ef5a5` also passed browser 43370709823 and regression 43370709811.
- Added isolated execution tests for legacy same-device backups missing optional daily maps, day rows missing optional counters/IDs, and malformed cross-device counters being discarded. Test SHA `7b7f66a1fc5b40cf4f5ad60fa56920b54ec87076`. **CI pending**; no production backup was inspected or restored.

### Legacy backup CI confirmed; malformed file guard tests added

- Synthetic legacy backup compatibility tests at SHA `7b7f66a1fc5b40cf4f5ad60fa56920b54ec87076` passed [regression 43371209483](https://github.com/Cheetos9250/study-os/actions/runs/43371209483) and [isolated browser 43371209508](https://github.com/Cheetos9250/study-os/actions/runs/43371209508). Documentation head `4676985e21eb4985bfa97e640260d2cd9185da65` also passed browser 43371264483 and regression 43371264339.
- Extended disposable Full Restore execution harness to test oversized file rejection and invalid JSON without confirmation, writes or network calls, test SHA `743619988c916903d44fc2c74c15924771a3700a`. [Regression 43371443779](https://github.com/Cheetos9250/study-os/actions/runs/43371443779) and [browser 43371443800](https://github.com/Cheetos9250/study-os/actions/runs/43371443800) **in progress** at writing time. No production changes.

### Full Restore cloud UI rollback — CI pending

- Verified prior oversized-file/invalid-JSON test SHA `743619988c916903d44fc2c74c15924771a3700a`: [regression 43371443779](https://github.com/Cheetos9250/study-os/actions/runs/43371443779) and [isolated browser 43371443800](https://github.com/Cheetos9250/study-os/actions/runs/43371443800) both **success**.
- Inspected `cFullRestore` exception handling and found that post-write `render()` failure could roll back storage and progress but leave `CLOUD.studyMergedDays` and `CLOUD.remoteStatus` changed. Added snapshot/rollback for both fields at SHA `5555154e547b840b72c6c99a65daeba16141bf9c`, and a synthetic render-failure execution regression at SHA `a535b1babdde470e13ea07dd40a0c89d83df28be`. **New CI not yet verified**. No production writes.

### CI failure found and corrected — awaiting rerun

- Regression run [43371899898](https://github.com/Cheetos9250/study-os/actions/runs/43371899898) for SHA `a535b1babdde470e13ea07dd40a0c89d83df28be` **failed** 1/243: BR-08 actual Full Backup round-trip. Root cause: the new snapshot called `structuredClone(undefined)` when a legacy test fixture omitted `CLOUD.studyMergedDays`.
- Corrected snapshot to preserve an undefined cache without cloning it, fix SHA `cc1bcaf9bbdf5c1f584d15b0096d03b652a30f2d`. This is a compatibility correction, not evidence of passing tests. Verify fresh regression and browser CI before release consideration.

### Restore cloud-state rollback verified and expanded

- Fix SHA `cc1bcaf9bbdf5c1f584d15b0096d03b652a30f2d` passed [regression 43372068149](https://github.com/Cheetos9250/study-os/actions/runs/43372068149) and [isolated browser 43372068107](https://github.com/Cheetos9250/study-os/actions/runs/43372068107).
- Extended synthetic failure regression to start with a **populated** cloud merged-day cache and a `synced` status and verify both survive a post-write render failure. Test SHA `3b2ad6d636dafa72816594cc26b6d6841807c35a`; its own CI is pending. No production data accessed.

### English practice meaning fail-closed hardening

- Prior populated cloud-cache rollback test SHA `3b2ad6d636dafa72816594cc26b6d6841807c35a` passed [regression 43373593892](https://github.com/Cheetos9250/study-os/actions/runs/43373593892) and [isolated browser 43373594003](https://github.com/Cheetos9250/study-os/actions/runs/43373594003).
- Inspected `uPracticeMeaning` and tightened the multiline fallback so English-only text cannot be displayed as a Thai answer. Implementation SHA `af933c54817bb691ad8df8c73a918e7d2a2ade9d`, synthetic examples test SHA `7d7355ee6f3de5ecab4a1c685cf74e86ca76feec`. Fresh CI pending. This does not modify source vocabulary, quiz records or SRS.

### English meaning guard CI regression and fixture correction

- [Regression 43374162891](https://github.com/Cheetos9250/study-os/actions/runs/43374162891) for test SHA `7d7355ee6f3de5ecab4a1c685cf74e86ca76feec` **failed** the existing HTML escaping fixture: its malicious sample used English-only `Back` and was now correctly excluded from the Thai-meaning pool.
- Updated the test fixture to contain Thai meaning text plus malicious HTML so it still tests output escaping without contradicting the new eligibility rule, SHA `ae12e71181274941cf264bee1353728058fab48c`. Fresh CI **pending**; failure is recorded, not hidden. No production changes.

### Verified source provenance across rotated English practice questions

- Previous English meaning guard fixture fix SHA `ae12e71181274941cf264bee1353728058fab48c` passed [regression 43374289061](https://github.com/Cheetos9250/study-os/actions/runs/43374289061) and [isolated browser 43374289044](https://github.com/Cheetos9250/study-os/actions/runs/43374289044).
- Added a source-grounding regression over rotated English practice sets: every displayed Thai option must match a committed Verified English vocabulary meaning and the correct answer must match its source headword. Test SHA `410c109dff6e6db7efee9e80d72b02062bbdd18e`; [regression 43377262906](https://github.com/Cheetos9250/study-os/actions/runs/43377262906) and [browser 43377262767](https://github.com/Cheetos9250/study-os/actions/runs/43377262767) queued at documentation time. This structural provenance test is not a human linguistic review.

### Source provenance test CI failure corrected

- [Regression 43377262906](https://github.com/Cheetos9250/study-os/actions/runs/43377262906) **failed** in the new test because the Thai Unicode regex was double-escaped; a valid Thai option `ความคืบหน้าครั้งสำคัญ` was incorrectly rejected. This was a test assertion bug, not evidence of incorrect vocabulary.
- Corrected the regex at SHA `9aa646bf7afc40777e5ef30928afa94b724368d1`. Fresh CI requires verification. No production or content changes.

### English distractor whitespace-equivalence hardening

- Verified source-provenance test fix SHA `9aa646bf7afc40777e5ef30928afa94b724368d1` passed [regression 43377373010](https://github.com/Cheetos9250/study-os/actions/runs/43377373010) and [isolated browser 43377372983](https://github.com/Cheetos9250/study-os/actions/runs/43377372983).
- Inspected English practice question generation: duplicate meaning/headword keys previously normalized Unicode/case but not internal whitespace. Updated normalization at SHA `9067a8a7c9266d273c3dea5f88215258021eacdf` to collapse whitespace before deduplication, preventing visibly equivalent answer options. Added synthetic test SHA `dd8f1e4a44dfa2cbf282e0d33934fa31f73f9a53`; regression 43378205242 and browser 43378205248 were in progress at documentation time. Existing source records, quiz provenance, and SRS remain unchanged.

### Whitespace test assertion correction

- Previous whitespace deduplication implementation/test SHA `dd8f1e4a44dfa2cbf282e0d33934fa31f73f9a53` passed [regression 43378205242](https://github.com/Cheetos9250/study-os/actions/runs/43378205242) and [isolated browser 43378205248](https://github.com/Cheetos9250/study-os/actions/runs/43378205248).
- On audit, found the synthetic test's **assertion** used a double-escaped regex and therefore did not actually collapse whitespace in the option-comparison assertion, although its fixed test inputs exercised the code. Corrected test-only regex at SHA `97c93f0435fb2c8de27115351237f28cdb6bd648`. CI regression 43378451795 and browser 43378451810 pending at writing time. No runtime or production change.

### Invisible Unicode separator deduplication

- Corrected whitespace assertion SHA `97c93f0435fb2c8de27115351237f28cdb6bd648` passed [regression 43378451795](https://github.com/Cheetos9250/study-os/actions/runs/43378451795) and [isolated browser 43378451810](https://github.com/Cheetos9250/study-os/actions/runs/43378451810).
- Extended English practice headword/Thai-meaning duplicate keys to strip invisible U+200B–U+200D and U+FEFF before collapsing whitespace, preventing duplicate choices from hidden separators. Final code SHA `c0690cf48412017e867af79c89b17477fdbaab6f`, synthetic test SHA `8e155a9e54ec8ede3997bc0b5d2eac614f8ca565`. Regression 43379006639 and browser 43379006644 queued at documentation time. No source row or progress changes.

### Rotated Verified-question normalized option audit

- Invisible-separator guard SHA `8e155a9e54ec8ede3997bc0b5d2eac614f8ca565` passed [regression 43379006639](https://github.com/Cheetos9250/study-os/actions/runs/43379006639) and [isolated browser 43379006644](https://github.com/Cheetos9250/study-os/actions/runs/43379006644).
- Added a regression checking every option in rotated Verified English practice questions for duplicates after Unicode NFKC, invisible-separator stripping and whitespace normalization. Test-only final SHA `6775d45b667e12298409b3557f9ca6081d8916af`; regression 43379340424 and browser 43379338387 pending at documentation time. This checks mechanical duplicates, not whether semantically similar Thai translations are acceptable distractors. No source/progress/production writes.

### Thai-sense ambiguity guard — implementation and CI

- Read-only review of the committed 582 Verified English rows found one exact shared Thai sense between different whole-meaning strings: `hinge on` (`ขึ้นอยู่กับ`) and `contingent on` (`ขึ้นอยู่กับ; มีเงื่อนไขว่า`).
- Implemented a conservative source-preserving answer/distractor guard at `study-integration.js`; synthetic collision and rotated real-data regression assertions were added at code/test SHA `1a2b4e96a8583fcf50b75e78d336ef0b0cd32fa7`.
- [Regression CI 43380366218](https://github.com/Cheetos9250/study-os/actions/runs/43380366218) completed **success**. [Isolated browser CI 43380366207](https://github.com/Cheetos9250/study-os/actions/runs/43380366207) was **in progress** when this entry was written; do not claim a pass without inspecting the final result.
- Exact punctuation-separated senses only; broader linguistic ambiguity still needs human review. No merge, deploy, private backup inspection, Notion edits or Worker/KV calls.

### Safe small-chapter fallback

- Improved the English Practice empty-state text for a four-word pool whose two meanings share the same Thai sense. A new synthetic execution test verifies zero misleading questions and no answer buttons. Code/test SHA `6c427d2b59c16f12a39dbadaf9ee76fbf8417678`.
- Earlier exact-sense guard browser [43380366207](https://github.com/Cheetos9250/study-os/actions/runs/43380366207) and regression [43380366218](https://github.com/Cheetos9250/study-os/actions/runs/43380366218) both completed **success**.
- For the new small-pool code/test SHA, [regression 43380708719](https://github.com/Cheetos9250/study-os/actions/runs/43380708719) completed **success**; [browser 43380708685](https://github.com/Cheetos9250/study-os/actions/runs/43380708685) was **in progress** at documentation time. No production service was accessed.

### Offline Thai distractor review

- Built `scripts/audit-thai-distractors.cjs` and `tests/english-distractor-review.test.cjs` at test SHA `4f43f9ec599fbfec69fff9b71b7c0643e95e7e00`. The tool only reads committed English source data and reports approximate Thai substring/bigram candidates; it does not affect the app, SRS, cloud or source data.
- Initial read-only scan over 582 Verified English rows flagged 87 *review candidates*, including opposite meanings (`unsaturated` / `saturated`) that must not be automatically excluded. See `THAI-DISTRACTOR-REVIEW-2026-11-13.md`.
- [Regression 43381193510](https://github.com/Cheetos9250/study-os/actions/runs/43381193510) completed **success**; isolated browser [43381193520](https://github.com/Cheetos9250/study-os/actions/runs/43381193520) was **in progress** when recorded. Previous empty-state code/test SHA `6c427d2b59c16f12a39dbadaf9ee76fbf8417678` passed regression 43380708719 and browser 43380708685.
