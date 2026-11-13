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
