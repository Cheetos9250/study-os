# Study OS — S0 live-source audit and S1 safe implementation plan

Date: 2026-11-13 (Asia/Bangkok)  
Scope: academic Study OS, `acc`, `eco`, `math`; protect legacy `eng`, `zh`.  
Status: **READ-ONLY EVIDENCE / NO PRODUCTION CUTOVER**. This document does not authorize merge, deploy, migration, restoration, or writes to Notion/KV.

## Sources and baseline

- Repository: `Cheetos9250/study-os`, default branch `main`; observed HEAD `79cd71d8cba833e374a686c7add1710715170733` (scheduled sync commits can change HEAD).
- Open PRs observed: #1 (Notion pipeline), #39 (fail-closed Verified exporter), #41 (VocaBloom English-only UI). Keep Study OS changes independent of these PRs.
- `data/config.json` retains the existing content API; no proposed endpoint changes.
- `.github/workflows/sync.yml` schedules Notion export every 15 minutes. This is configuration evidence, not proof of every live execution.
- `.github/workflows/vocabloom-tests.yml` runs Node regression and Python exporter-contract tests; `.github/workflows/study-sync-cas-tests.yml` runs prototype tests. These do not prove production KV safety.
- PR #39 workflow run 43277095303: success; PR #41 workflow run 43351890620: success. CI alone is not production validation.

## Live-source content counts

Observed from GitHub exported JSON:
| Export | Rows | Subject breakdown |
| --- | ---: | --- |
| `data/cards.json` | 582 | English Vocab: 582 |
| `data/quiz.json` | 222 | Accounting: 197; Economics: 25 |

Observed from Notion data-source queries:
| Data source | Status | Subject | Count |
| --- | --- | --- | ---: |
| Flashcards | Draft | Accounting | 13 |
| Flashcards | Draft | English Vocab | 1 |
| Flashcards | Verified | English Vocab | 583 |
| Quiz | Draft | Accounting | 427 |
| Quiz | Draft | Economics | 3 |
| Quiz | Verified | Accounting | 197 |
| Quiz | Verified | Economics | 25 |

A Notion duplicate query found two Verified English Vocab entries with normalized Front `rebound` in chapter `ศัพท์ข่าว`. This explains a plausible one-row discrepancy between 583 Notion Verified and 582 exported, but exporter deduplication logic still requires direct code verification before declaring this the proven cause.

**Do not infer zero academic flashcards or Math lessons from the Verified export**: legacy academic HTML and bundled decks may contain additional embedded content. A comprehensive per-subject inventory is still pending.

## Architecture and migration guardrails

1. Study OS owns academic UI for `acc`, `eco`, `math`. VocaBloom owns language UI, English-first.
2. Legacy `eng` and `zh` IDs, decks, localStorage keys, progress keys, and routes must remain available until a separately approved migration.
3. Do not modify `data/config.json` `api` to point at CAS-only staging. The production content worker serves `/cards`, `/quiz`, `/review`.
4. Do not enable auto-sync, overwrite progress, import KV, or cut over production CAS.
5. An empty/default GET `{ "updated": 0 }` is not proof of an empty KV namespace. Backup must be independently verified before migration.
6. The UI must never claim that local data is cloud-synced unless the backend confirms it.
7. Avoid storing or exposing API keys and user progress in a public repository or public test logs.

## S1 implementation checklist (isolated draft PR)

- [ ] Inspect current `index.html`, `acc.html`, `eco.html`, `math.html` navigation and links in full.
- [ ] Academic-first dashboard: Accounting, Economics, Math for Life, with clear entry points to existing study pages; avoid representing VocaBloom as a fourth academic subject.
- [ ] Preserve the old language routes and data paths, but separate their navigation from the academic dashboard.
- [ ] Preserve all original subject page behavior and existing progress storage keys.
- [ ] Add focused navigation/content contract tests for all five legacy subject IDs and broken links.
- [ ] Test with keyboard and narrow iPad viewport, including Safari where feasible; report untested device/browser combinations honestly.
- [ ] Document rollback as reverting the UI-only commit, with no data restore required.
- [ ] Open as draft PR; **do not merge or deploy**.

## S2/S3 blockers and evidence required

- Count embedded academic flashcards, quizzes, summaries and practice modules in each subject page; compare against Notion Verified and exported JSON.
- Check whether existing quiz UI filters by subject and chapter correctly.
- Test SRS, local backup/restore, and five-subject progress-key compatibility without touching production user data.
- Confirm the production API contract through read-only GET checks when available; avoid POST/PUT against production.
- Validate actual Cloudflare KV contents and backup hashes only through an authorized administrative read-only workflow; connector read access has not established this.
- CAS production cutover remains blocked until independent backup, writer inventory, conflict handling, rollback, and explicit owner approval.

## Change log

2026-11-13: Initial S0 evidence-based audit and S1 checklist. Documentation only. No application code, Notion records, GitHub Pages configuration, Worker, KV, or production progress changed.
