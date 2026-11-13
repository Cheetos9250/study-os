# VocaBloom P0 baseline and P1 English-only QA — 2026-11-13

**Environment:** GitHub source and GitHub Actions PR CI only. **No production deploy, migration, merge, Notion write, KV write, or Worker change.**

## Baseline
- Repository: `Cheetos9250/study-os`
- Starting `main`: `79cd71d8cba833e374a686c7add1710715170733` (Notion verified-data sync).
- P1 feature branch: `feat/vocabloom-p1-english-ui-20261113`; draft PR #41.
- Open prior PRs reviewed: #1 (old Notion pipeline audit), #39 (draft fail-closed Verified exporter). Do not merge or overwrite them as part of P1.
- Production content/legacy progress API in `data/config.json`: `https://study-api.kasidit09022550.workers.dev`; no `progress_api` override.

## Source inventory (read-only)
| Source | Observed | P1 treatment |
| --- | --- | --- |
| `vocabloom/index.html` | Existing English vocabulary lessons, games, local progress, English Verified import, speech synthesis | Preserve |
| `vocabloom/study-integration.js` | Previously showed five subjects; initially selected Accounting | English-only presentation; do not change storage |
| `vocabloom/study-decks.json` | 5 decks, 757 original cards: acc 221, eco 139, math 67, eng 51, zh 279 | Preserve all |
| `data/cards.json` | 582 Verified English Vocab rows; 582 unique page IDs; 572 news and 10 general B1–B2 chapter labels | Preserve full export; English filter at display |
| `data/quiz.json` | 222 Verified rows: Accounting 197, Economics 25; **no English Verified quiz rows** | Preserve; English quiz content remains a P2 gap |
| `vocabloom/unified-progress.js` | Five-subject progress bridge, SRS, backup/restore, sync guards | Unchanged |
| `scripts/sync_notion.py` | Verified Notion export | Unchanged; PR #39 separately addresses pagination/status safety |
| `acc.html`, `eco.html`, `math.html`, `eng.html`, `zh.html` | Legacy Study OS pages | Unchanged |

**Important count distinction:** English integrated card display combines 51 bundled cards and up to 582 Verified rows. Some entries may overlap semantically; this is not a claim of 633 unique vocabulary terms. Existing in-app English word library is a separate collection.

## P0 feature audit
| Capability | Status | Notes |
| --- | --- | --- |
| English vocabulary learning / games / local stats | Existing | Present in `index.html`; full device/browser acceptance not yet independently checked |
| English flashcards / spaced repetition | Existing | Shared SRS integration, existing localStorage keys |
| English Verified flashcards | Existing | 582 rows in latest export; category labels match English deck |
| English quizzes from Verified Notion | Missing | Current export contains only Accounting and Economics |
| Browser backup/restore | Existing | Regression tested; not proof of live multi-device safety |
| Cross-device progress sync | Guarded legacy / production CAS blocked | Legacy KV last-writer-wins; no production CAS cutover |
| Grammar, reading, listening curricula | Planned / audit needed | Audio pronunciation does not equal listening-comprehension curriculum |
| Speaking assessment, writing feedback, AI tutor | Planned | Do not claim these are deployed |
| Chinese/HSK UI | Future v2 | Legacy Chinese data remains intact |

## P1 implementation
- English is the default subject and the only visible integrated deck in VocaBloom.
- Home/review cards and integrated panel only list English.
- Hidden subject-selection events are rejected.
- All five decks, canonical SRS IDs, original subject pages, verified exports and sync code remain unchanged.
- New offline regression: `vocabloom/tests/english-only-ui.test.cjs`.

## CI evidence
- GitHub Actions `VocaBloom regression checks`, run **43350662413**, completed **success** at feature commit `2fcba0ec347e187929b62cd95382014f8e98a389`.
- Both steps passed: `Validate VocaBloom and Study OS` (Node tests), `Validate Notion exporter data contract` (Python unit tests).
- This is repository CI only, **not** live iPad Safari QA or Cloudflare CAS verification.

## Remaining P1 release gates
1. Confirm no non-English menu appears in rendered VocaBloom on iPad Safari and desktop; CI covers mocked render and source invariants.
2. Check English 51 bundled + Verified rows render, review rating, refresh and local SRS persistence without resetting prior progress.
3. Check legacy Study OS all five pages continue to work; verify no changed keys or endpoint routes.
4. Test backup/restore in disposable profiles; never restore over real data.
5. Keep PR draft until owner explicitly authorizes merge/deployment.

## P2 next candidates
- Introduce a small, independently tested English-only quiz bank or Verified English quiz ingestion path; do not fabricate Verified status.
- Review B1–B2 coverage and duplicates, keeping stable canonical IDs and SRS progress.
- Add focused offline learning acceptance tests for iPad-sized UI and keyboard/speech features.

## Rollback
No production rollback is needed because P1 has not been merged or deployed. Revert the P1 branch commits or close draft PR #41. Do **not** modify the original five-deck JSON or production KV.
