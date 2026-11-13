# Study OS — S0 Audit and S1 Academic-first homepage (draft)

Date: 2026-11-13 (Asia/Bangkok)  
Baseline: `79cd71d8cba833e374a686c7add1710715170733` (read via GitHub connector, before this branch).  
Scope: read-only audit + isolated academic homepage candidate. No merge or production change authorized.

## Confirmed repository state

- `Cheetos9250/study-os` is public and uses `main`. Existing `index.html` markets VocaBloom as "All-in-One Study OS", mixing language and academic products.
- Open PRs checked: #1 (old Notion pipeline, nonmergeable); #39 (Verified exporter fail-closed, draft); #41 (English-only VocaBloom UI, draft). This change does not touch their files.
- `data/config.json` still has only `api`, pointing to `https://study-api.kasidit09022550.workers.dev`. No `progress_api` key is published.
- `.github/workflows/sync.yml` includes the 15-minute schedule, but source presence **does not prove** the most recent scheduled job ran.
- Source `acc.html`, `eco.html`, `math.html` all exist and already have flashcard, summary and practice interfaces. The five legacy pages, VocaBloom SRS, browser storage and progress APIs are not modified.

## Notion data inventory (connector read-only SQL)

| Database | Status | Subject | Count |
|---|---|---|---:|
| Flashcards | Verified | English Vocab | 583 |
| Flashcards | Draft | English Vocab | 1 |
| Flashcards | Draft | Accounting | 13 |
| Quiz | Verified | Accounting | 197 |
| Quiz | Verified | Economics | 25 |
| Quiz | Draft | Accounting | 427 |
| Quiz | Draft | Economics | 3 |

On GitHub at inspection: `data/cards.json` has **582** rows, all `English Vocab`; `data/quiz.json` has **222** rows, `Accounting=197`, `Economics=25`. Read-only SQL found one duplicate after normalizing `Subject + Chapter + Front`: the word `rebound` twice in `ศัพท์ข่าว`, explaining 583 → 582. These are export-file rows, **not** all static cards in existing course pages.

**Consequence:** the current Notion Flashcards source has no Verified `Accounting`/`Economics`/`Math for Life` cards. Do not remove bundled/static course content or claim these courses have no flashcards.

## Risk/verification gaps

1. Production Worker deployment, Cloudflare KV namespace and real browser progress could not be verified through source-only GitHub/Notion connectors. The external web fetch was unavailable during this audit; do **not** claim live Pages/API smoke tests passed.
2. Existing Production KV progress uses unconditional writes; CAS Production cutover remains blocked by the documented snapshot, independent backup, staged readback and rollback gates.
3. Test results on another branch or a passing mock CI do not establish production behavior. Browser testing on iPad Safari, older cached tabs, offline and local backup/restore still required before release.
4. #39 exporter safety is a separate draft; do not silently include its changes in this PR.

## S1 candidate: homepage-only changes

- Promote `Accounting`, `Economics`, `Mathematics` as three primary academic cards.
- Link to VocaBloom in a clearly separate language section (not an academic subject).
- Preserve direct `eng.html` and `zh.html` access in a secondary Legacy section.
- Keep links relative, mobile-friendly and dark-mode compatible; **no JavaScript, API call, storage access, secret or progress mutation** in the homepage.
- Add a dedicated static regression workflow. It does not deploy.

## Verification / release gates

- Source-level contracts are automated in `tests/study-os-home.test.cjs`. Check the new PR's CI at its latest head SHA; do not assume success before seeing the run.
- Visual/browser smoke remains **UNVERIFIED** until manually or instrumentally tested.
- No merge, Pages deploy, config change, Notion record write, KV migration or cloud sync consent change on this branch. Owner approval is required for production release.

## Next work after review

- S1: approve/revise the academic homepage and check it on iPad Safari, then separately authorize merge/deploy.
- S2: audit static card/quiz coverage per academic course; decide whether/which Draft items should be Verified only after content review.
- S3/S4: run read-only progress and subject identity regression, then plan safe separation contract without moving legacy data.
