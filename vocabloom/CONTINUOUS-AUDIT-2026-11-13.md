# Continuous development evidence — 2026-11-13

## Baseline

- Correct repository: `Cheetos9250/study-os`, public, default `main`.
- Main captured at `79cd71d8cba833e374a686c7add1710715170733`.
- Continued existing Draft PR #41 head `5bb1261064f71d4a1a72e207136920c85602d27e`; did not mix in Study OS PRs #42/#43/#44, exporter PR #39 or obsolete PR #1.
- Prior branch CI rechecked: run 43359423808 completed successfully at that head.
- Read current Handoff v1.2 plus branch PROGRESS/NEXT_STEPS. PROJECT/ARCHITECTURE/DECISIONS/CHANGELOG were absent and created under `vocabloom/` to avoid claiming ownership of shared academic Study OS docs.

## Read-only system findings

| System | Observation | Limit |
| --- | --- | --- |
| Public VocaBloom Pages | HTTPS GET returned 200, 76,954 bytes | Reachability only, not interactive QA or branch deployment |
| Production Worker `/cards` and `/quiz` | Both returned HTTP 403; inspected `/cards` response has server `envoy`, body `error code: 1010` | Cannot attribute denial to Worker code versus intermediary; no content/KV success claim |
| Notion Flashcards | Schema fetched; single-source SQL returned 583 English Verified, 1 English Draft, 13 Accounting Draft | No record writes |
| Notion Quiz | Schema fetched; single-source SQL returned Accounting 197 Verified/427 Draft, Economics 25 Verified/3 Draft | No Verified English quiz rows returned |
| Committed exports | 582 English Verified cards, 222 academic Verified quizzes | Snapshot, not live Worker content |
| Notion collision | Single-source SQL found `rebound` twice in news chapter | Consistent with issue #40; export count difference is not data-loss proof |
| Cloudflare deployment/KV | No Cloudflare administrative connector available | Deployed code, namespace identity, actual stored five-key data and CAS atomicity unverified |

Multi-source Notion SQL was denied with `entitlement_required`; that operation was not executed. Used supported single-source SQL for the counts above. No plan or subscription changes.

## Changes and data impact

1. The main importer previously returned 573 usable words, including 236 with non-Thai POS tags in `th`. After selecting the Thai field from either pipe order, it returns the same 573 IDs with zero non-Thai meanings. Original source rows and persistent keys are unchanged. Optional Example prefixes no longer appear as sentence text.
2. Practice now filters the selected chapter before deduplicating. Synthetic regression demonstrates that four chapter-B words remain available even when two also occur in chapter A.
3. Retry mistakes retains only answered incorrect questions from the frozen session, preserves their exact options and resets the round's in-memory answers. No mistakes is a no-op; correct/unanswered items are excluded. The action has executable storage-throwing regression coverage.
4. Existing English-only UI, five-deck identities, backup/restore, CAS conflict handling, consent/credential scope and legacy course contracts remain covered by regression tests.

## Verification completed locally

- `node --test vocabloom/tests/*.test.cjs`: **226 passed**, zero failures (baseline 223).
- `python3 -m unittest discover -s vocabloom/tests -p 'test_*.py'`: **3 passed**.
- `node --test experiments/study-sync-cas/*.test.mjs experiments/prod-progress-cas/worker.test.mjs`: **62 passed**, using synthetic/in-memory storage and fake credentials only.
- Before/after parser audit: 573 -> 573 imported words; 236 -> 0 non-Thai meanings; imported ID sequence identical.
- Attempted Playwright Chromium and WebKit: bundled executables absent. System `/usr/bin/chromium` exists but launch failed with `socket() failed: Operation not permitted`; no interactive browser assertions were executed. Physical iPad Safari/VoiceOver remains untested.

## Content QA limits and next work

This verifies field parsing, provenance and structural validity, not expert approval of every translation. Nine committed examples remain excluded by the existing exact-headword rule: `hollow out`, `modify`, `hinge on`, `ramp up`, `authority`, `edge up`, `securities filing`, `account for`, `rally`. Most use valid inflections; `securities filing` uses only `filing`. Decide morphology-aware matching separately without modifying source content or IDs. Chinese remains deferred; 279 legacy Chinese cards preserved, Pinyin accuracy not re-certified.

## Release status

No merge, production deployment, Notion mutation, Worker/KV write, migration, secret change or Auto Sync activation. Real cross-device preservation still requires staging persistence/atomicity tests and authoritative private production backups. Browser and live-backend gaps remain release gates; offline successes do not close them.

## Browser automation follow-up

Added `tests/browser_smoke.py` and `.github/workflows/vocabloom-browser-tests.yml` after the first implementation CI passed (runs 43360419238/43360414670 at `2122559e4ae3a218983baaf7da17db97a9dd8996`). The first browser run 43360646671 at `b1d43dd0582da5591d7e1deae6baef2131857df3` failed during browser dependency installation: `ubuntu-latest` resolved to Ubuntu 26.04, unsupported by the pinned Playwright 1.56 package. No browser assertions ran in that attempt. Pinned the browser job to supported Ubuntu 24.04 in `17aaf38ada559e4f4ea5849360980fb70ed0f145`; final execution evidence follows below.

### Verified hosted browser result

At code/workflow SHA `17aaf38ada559e4f4ea5849360980fb70ed0f145`, browser run [43360796688](https://github.com/Cheetos9250/study-os/actions/runs/43360796688) and duplicate push run [43360785239](https://github.com/Cheetos9250/study-os/actions/runs/43360785239) completed **success**. Job `131673559726` logs explicitly report four passed cases: Chromium desktop, Chromium tablet, WebKit desktop, WebKit tablet. Each imported 573 English words and reported zero live service requests. Regression run [43360796750](https://github.com/Cheetos9250/study-os/actions/runs/43360796750) also completed **success** at that SHA.

The browser harness exercised actual DOM clicks for wrong/correct answers, Retry mistakes, New set, chapter selection and flashcard rating, verified Practice left browser storage unchanged, and confirmed the synthetic English SRS schedule survived reload while academic fixture records remained unchanged. This is hosted Linux browser emulation using disposable synthetic progress and mocked content/services, **not** physical iPad Safari/VoiceOver or live cross-device/Cloudflare validation. The final documentation commit does not change tested application code or the browser harness.

## Continuous round 2 — English examples, explanations and browser recovery QA

Baseline `fb1caf114cd5bd8dac094fcd9fa5db12994abdbe`; implementation `bd4135fa15dc336910e4f4f77e250288d466b2ef` on the same PR #41 branch. Repository/PR refreshed; no new live Worker/KV/Notion claim is made in this round.

### Import eligibility and preservation

Replaced arbitrary substring eligibility with complete English token sequences. POS is read from the existing source Back field. Regular noun plural and verb inflection rules are bounded; multiword noun phrases vary the last token, and recognized phrasal verbs vary their first token while retaining their particles. `admit` and `flop` have explicitly audited doubled-consonant forms. This is not a general lemmatizer, irregular-verb engine or semantic validator.

Committed export: **573 -> 581 imported words**. Newly accepted: `hollow out`, `modify`, `hinge on`, `ramp up`, `authority`, `edge up`, `account for`, `rally`. Before/after comparison finds **zero lost previous IDs**. `securities filing` remains excluded; its sentence only says `filing`. No content was edited to manufacture a match.

New tests cover positive regular forms, POS restrictions, phrasal-particle preservation, substring false positives (`art` in `quarter`, `port` in `report`), unsupported derivations, malformed doubled forms, case/NFKC matching and canonical IDs. Existing 573 words with legitimate inflected examples remain eligible.

### Practice source context

Added parsing for legacy Thai-labeled examples, pipe-separated examples/translations, and multiline English/Thai examples. Feedback appears only after answering, uses supplied text, includes source metadata when present, and HTML-escapes examples, translations and references. It is part of the existing frozen question snapshot and Retry mistakes reuses it unchanged. It never writes Practice scores or SRS.

### Verification scope

- Local Node regression: **232 passed**, zero failures.
- Local Python exporter: **3 passed**.
- Browser harness expanded to perform mocked content/deck refresh during an answered question and verify frozen prompt/options/context, unchanged learner storage after restoring fixtures, Full Backup download, cancelled restore with no writes, and accepted restore from a disposable JSON file after changing a synthetic academic record.
- Source/data/config/legacy course pages and sync implementation remain outside this implementation diff. No production backup/restore or remote data writes are performed.
- Hosted browser/CI results are recorded after completion below. The previous round's success does not prove the extended harness passes.

### Round 2 hosted result — verified

At `bd4135fa15dc336910e4f4f77e250288d466b2ef`, [regression 43363405764](https://github.com/Cheetos9250/study-os/actions/runs/43363405764) and [browser 43363405759](https://github.com/Cheetos9250/study-os/actions/runs/43363405759) returned **success**. Browser job `131681983704` logs were inspected: Chromium desktop/tablet and WebKit desktop/tablet each passed, imported **581** words, and reported **0 live service requests**. Each case completed the expanded refresh, backup-download and cancelled/accepted synthetic restore assertions before printing passed.

Final diff checks confirmed no changes in `data/`, `scripts/sync_notion.py`, `unified-progress.js`, `study-decks.json` or any of the five legacy subject pages. No merge, production deployment, live import/restore, Notion/KV/Worker mutation, secret change or Auto Sync activation occurred. Documentation follows this tested implementation without changing its application or test code.

### Practice generation follow-up

The subsequent distractor audit exposed a nested duplicate search in every candidate option, even though the pool already guarantees normalized unique meanings. Replaced it with exclusion of the current card and deterministic rotation of the existing unique pool. Question IDs, answer correctness, four-option uniqueness and frozen-session behavior remain preserved; newly created sets may have a different valid option order.

- Local regression: **233 Node tests passed**, including a new 1,000-card correctness case.
- One same-environment, ten-question real-export generation measurement: **843 ms before, 3 ms after**. This is a single illustrative local measurement, not an iPad benchmark or performance guarantee.
- Checked **650 generated question instances** across rotated sessions after the change: no correct/distractor pair shared an exact semicolon/comma-separated Thai meaning atom. Nine shared-meaning groups exist in the source. This limited structural audit does **not** certify semantic uniqueness of every possible translation or chapter.
- No persistent Practice answers, SRS, data export, sync or source IDs changed. Hosted regression/browser results for this performance commit are recorded after verification below.

### Final application CI

At `20f27cc8656296d55840bec2fff5208571b4145c`, [233-test Node / Python regression 43364282209](https://github.com/Cheetos9250/study-os/actions/runs/43364282209) and [extended browser run 43364281981](https://github.com/Cheetos9250/study-os/actions/runs/43364281981) completed **success**. Browser logs confirmed the four Chromium/WebKit desktop/tablet cases, each importing 581 words with no live service requests. This verifies the optimized distractor generator together with context, refresh and synthetic backup/restore flows.

Narrowed browser workflow path triggers to app HTML/JS/JSON, tests, exported data and the workflow itself. Documentation-only push commits can skip browser installation without bypassing relevant application changes. Job execution and read-only permissions are unchanged. The subsequent handoff/workflow-filter commit does not alter the tested application/test code. Physical iPad and live sync gates remain open.

### Later browser malformed-backup regression — verified

- Implementation SHA `f269d5f9514580f75785e71a430042a8db282c68` extends `vocabloom/tests/browser_smoke.py` with three malformed restore payloads: subjects array, VocaBloom progress array and missing English subject.
- Each is passed to the real `cFullRestore` in a disposable, fully mocked Chromium/WebKit browser profile; assertions require no localStorage mutation and no successful restore state.
- [Regression run 43367785010](https://github.com/Cheetos9250/study-os/actions/runs/43367785010) and [isolated browser run 43367784703](https://github.com/Cheetos9250/study-os/actions/runs/43367784703) both completed **success**. No real Worker/Notion/KV requests were permitted by the browser harness.
- This closes the pending CI status from the earlier PROGRESS entry. Physical iPad Safari, VoiceOver and staging CAS persistence remain **unverified**. No merge, deploy or production data write occurred.

### In-memory quota rollback and daily-map hardening

- Browser CI [43368920021](https://github.com/Cheetos9250/study-os/actions/runs/43368920021) and regression CI [43368920096](https://github.com/Cheetos9250/study-os/actions/runs/43368920096) completed **success** for the added in-memory rollback assertion at SHA `c7d287357360fbdc10c7ea33f3e7a10ded3f9413`.
- Inspected actual `cFullRestore` code and identified permissive `typeof value === 'object'` validation of same-device daily counters. Updated code and added mock execution tests to reject arrays/null/scalars for same-device backups; cross-device daily maps remain ignored. Tests SHA `ef260b87a69167a802fd61020ef84099db29a635`.
- New CI [regression 43369307639](https://github.com/Cheetos9250/study-os/actions/runs/43369307639) and [browser 43369307661](https://github.com/Cheetos9250/study-os/actions/runs/43369307661) pending at documentation time. No live backup import, iPad testing, or Worker/KV/Notion changes.

### Daily-map fix verified and browser regression extended

- Code/test SHA `ef260b87a69167a802fd61020ef84099db29a635` verified by [regression 43369307639](https://github.com/Cheetos9250/study-os/actions/runs/43369307639) and [browser 43369307661](https://github.com/Cheetos9250/study-os/actions/runs/43369307661), both **success**. Documentation head `4d288f6e3dc0963f963dc46353903a4598b0176e` also passed both workflows (43369380820 and 43369380885).
- New browser-level same-device malformed day-map rejection check at `2c8569bd9693d2998b3f5dd80749764637bc973a`, pending [browser 43369918907](https://github.com/Cheetos9250/study-os/actions/runs/43369918907) and [regression 43369918882](https://github.com/Cheetos9250/study-os/actions/runs/43369918882). All browser fixtures block real services. No physical iPad or staging CAS claim.

### Nested daily row validation follow-up

- Previous same-device malformed-map browser scenario at SHA `2c8569bd9693d2998b3f5dd80749764637bc973a` passed [browser 43369918907](https://github.com/Cheetos9250/study-os/actions/runs/43369918907) and [regression 43369918882](https://github.com/Cheetos9250/study-os/actions/runs/43369918882).
- Reviewed `cLocalRecord`/`cStudyRecord` and hardened nested per-day restore validation; tests added at `f5b6c75b2c6dc475e82dfcdaae909394a5c7c304`. This newer change has **not yet been verified by CI** at writing time. All tests use synthetic records and no production endpoint.

### Nested daily-row hosted QA follow-up

- Implementation SHA `f5b6c75b2c6dc475e82dfcdaae909394a5c7c304` passed regression [43370356856](https://github.com/Cheetos9250/study-os/actions/runs/43370356856) and browser [43370356909](https://github.com/Cheetos9250/study-os/actions/runs/43370356909).
- Additional direct browser rejection scenarios at `f737cf7886ba797c86d2e6ef9fa503cd4b8e8f13`; regression [43370623145](https://github.com/Cheetos9250/study-os/actions/runs/43370623145) **success**, browser [43370623091](https://github.com/Cheetos9250/study-os/actions/runs/43370623091) **in progress** when recorded. No production activity.

### Historical restore compatibility regression

- Nested browser daily-row rejection passed [43370623091](https://github.com/Cheetos9250/study-os/actions/runs/43370623091) and regression [43370623145](https://github.com/Cheetos9250/study-os/actions/runs/43370623145). Documentation head `55f1d0e4a84f390b353e20113b2cdf68128ef5a5` also passed browser 43370709823 and regression 43370709811.
- New synthetic tests at `7b7f66a1fc5b40cf4f5ad60fa56920b54ec87076` cover omitted optional daily maps, sparse rows and malformed cross-device data; **new CI unverified** at documentation time. No live user backup read or write.

### Legacy compatibility and malformed file gates

- Legacy backup tests SHA `7b7f66a1fc5b40cf4f5ad60fa56920b54ec87076`: [regression 43371209483](https://github.com/Cheetos9250/study-os/actions/runs/43371209483) and [browser 43371209508](https://github.com/Cheetos9250/study-os/actions/runs/43371209508) **success**.
- New oversized/invalid-JSON restore execution tests SHA `743619988c916903d44fc2c74c15924771a3700a`; [regression 43371443779](https://github.com/Cheetos9250/study-os/actions/runs/43371443779) and [browser 43371443800](https://github.com/Cheetos9250/study-os/actions/runs/43371443800) **pending** at documentation time. Disposable mock storage only; no live restore.

### Restore cloud UI rollback

- Oversized/invalid JSON backup guard SHA `743619988c916903d44fc2c74c15924771a3700a` passed [regression 43371443779](https://github.com/Cheetos9250/study-os/actions/runs/43371443779) and [browser 43371443800](https://github.com/Cheetos9250/study-os/actions/runs/43371443800).
- Fixed post-write render-error cloud UI cache/status rollback at `5555154e547b840b72c6c99a65daeba16141bf9c`; regression harness test at `a535b1babdde470e13ea07dd40a0c89d83df28be`. **New CI pending**; synthetic test only, no production restore.

### CI failure found and corrected — awaiting rerun

- Regression run [43371899898](https://github.com/Cheetos9250/study-os/actions/runs/43371899898) for SHA `a535b1babdde470e13ea07dd40a0c89d83df28be` **failed** 1/243: BR-08 actual Full Backup round-trip. Root cause: the new snapshot called `structuredClone(undefined)` when a legacy test fixture omitted `CLOUD.studyMergedDays`.
- Corrected snapshot to preserve an undefined cache without cloning it, fix SHA `cc1bcaf9bbdf5c1f584d15b0096d03b652a30f2d`. This is a compatibility correction, not evidence of passing tests. Verify fresh regression and browser CI before release consideration.

### Restore cloud-state rollback verified and expanded

- Fix SHA `cc1bcaf9bbdf5c1f584d15b0096d03b652a30f2d` passed [regression 43372068149](https://github.com/Cheetos9250/study-os/actions/runs/43372068149) and [isolated browser 43372068107](https://github.com/Cheetos9250/study-os/actions/runs/43372068107).
- Extended synthetic failure regression to start with a **populated** cloud merged-day cache and a `synced` status and verify both survive a post-write render failure. Test SHA `3b2ad6d636dafa72816594cc26b6d6841807c35a`; its own CI is pending. No production data accessed.

### English practice meaning fail-closed check

- Cloud cache rollback test `3b2ad6d636dafa72816594cc26b6d6841807c35a` passed regression 43373593892 and browser 43373594003.
- Added Thai-script requirement for multiline generated practice meanings at `af933c54817bb691ad8df8c73a918e7d2a2ade9d`; tests `7d7355ee6f3de5ecab4a1c685cf74e86ca76feec`. CI pending at documentation time. No changes to production Notion, Worker or KV.

### English meaning guard CI regression and fixture correction

- [Regression 43374162891](https://github.com/Cheetos9250/study-os/actions/runs/43374162891) for test SHA `7d7355ee6f3de5ecab4a1c685cf74e86ca76feec` **failed** the existing HTML escaping fixture: its malicious sample used English-only `Back` and was now correctly excluded from the Thai-meaning pool.
- Updated the test fixture to contain Thai meaning text plus malicious HTML so it still tests output escaping without contradicting the new eligibility rule, SHA `ae12e71181274941cf264bee1353728058fab48c`. Fresh CI **pending**; failure is recorded, not hidden. No production changes.

### English practice Verified-source provenance

- Prior Thai meaning guard fix passed regression 43374289061 and browser 43374289044.
- New rotated question source-provenance regression SHA `410c109dff6e6db7efee9e80d72b02062bbdd18e` checks Thai options against committed Verified rows and answer/headword mapping. CI queued: regression 43377262906, browser 43377262767. No source content or production writes. This does not establish semantic quality of distractors.

### Source provenance test CI failure corrected

- [Regression 43377262906](https://github.com/Cheetos9250/study-os/actions/runs/43377262906) **failed** in the new test because the Thai Unicode regex was double-escaped; a valid Thai option `ความคืบหน้าครั้งสำคัญ` was incorrectly rejected. This was a test assertion bug, not evidence of incorrect vocabulary.
- Corrected the regex at SHA `9aa646bf7afc40777e5ef30928afa94b724368d1`. Fresh CI requires verification. No production or content changes.

### Whitespace-equivalent English practice distractors

- Prior Verified source provenance test passed regression 43377373010 and browser 43377372983.
- Whitespace-normalized question/distractor deduplication code SHA `9067a8a7c9266d273c3dea5f88215258021eacdf`; synthetic regression SHA `dd8f1e4a44dfa2cbf282e0d33934fa31f73f9a53`. CI pending: regression 43378205242 and browser 43378205248. No live Notion/Worker/KV access or real progress migration.

### Correct whitespace assertion semantics

- Whitespace fix passed regression 43378205242 and browser 43378205248. The synthetic assertion accidentally used a double-escaped `\\s` regex, making the normalized uniqueness check weaker than intended. Corrected at SHA `97c93f0435fb2c8de27115351237f28cdb6bd648`; regression 43378451795 and browser 43378451810 pending. No production changes.

### Invisible separator normalization

- Whitespace assertion fix passed regression 43378451795 and browser 43378451810.
- Strip invisible U+200B–U+200D/U+FEFF before whitespace normalization in English practice deduplication. Final implementation SHA `c0690cf48412017e867af79c89b17477fdbaab6f`, test SHA `8e155a9e54ec8ede3997bc0b5d2eac614f8ca565`. Regression 43379006639 and browser 43379006644 queued. No production access.

### Rotated question normalized uniqueness

- Invisible separator fix passed regression 43379006639 and browser 43379006644.
- New test SHA `6775d45b667e12298409b3557f9ca6081d8916af` checks normalized uniqueness of generated Verified English practice options over rotated sets. CI regression 43379340424 and browser 43379338387 pending. No production access; human semantic review remains open.

### Explicit Thai sense collision — branch-only development

- Source: committed `data/cards.json`, 582 Verified English rows; a local read-only JavaScript scan of normalized meanings found one exact punctuation-delimited overlap, `hinge on` ↔ `contingent on` (`ขึ้นอยู่กับ`). It is an exact-format screening result, not a full semantic audit.
- Implemented `uPracticeSenses` and `uPracticeSharesSense` in `study-integration.js`; distractors now avoid any shared explicit Thai sense with each other or the answer. An ambiguous small pool can yield fewer than ten practice questions rather than misleading options.
- Added synthetic overlap fixtures and rotated real Verified data assertions in `tests/english-practice.test.cjs` and `tests/english-content-quality.test.cjs`.
- Implementation/test head `1a2b4e96a8583fcf50b75e78d336ef0b0cd32fa7`; regression [43380366218](https://github.com/Cheetos9250/study-os/actions/runs/43380366218) **success**; isolated browser [43380366207](https://github.com/Cheetos9250/study-os/actions/runs/43380366207) **in progress** when recorded. All existing service calls stay blocked within hosted browser tests. No merge, production writes or migration.
