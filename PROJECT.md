# Study OS

Study OS provides course flashcards, lesson summaries, practice questions and local learning-progress tracking. VocaBloom remains a separate language-learning destination.

## Available basic workflow
1. Open `index.html` and choose Accounting, Economics or Mathematics. Existing English/Chinese vocabulary routes remain available under Study tools.
2. Rate flashcards or answer practice questions. Progress saves in this browser; confirmed quiz reset affects the current course's answer history.
3. Use Home navigation to return, or Back up progress to download a private JSON copy and check its file structure.
4. If datasets are missing, open Restore progress, select a trusted backup, review the dataset/file summary and explicitly confirm. A differing existing dataset blocks the whole restore; identical datasets are skipped. It does not merge individual questions into partially populated datasets.

## Storage and scope
- Use the same browser or Home Screen app context that holds the learning progress. Browser contexts may have separate storage.
- Backup/recovery is manual and local. Credentials, content caches, planner IndexedDB and data existing only in Notion/Cloudflare are excluded.
- Close other Study OS tabs before recovery because browser storage is not transactional across tabs.
- Basic implementation is published; physical iPad Safari/Files verification is still pending. The separate planner/dashboard PR #44 is not part of this release.

## Evidence and continuity
Read `PROGRESS.md` for code release SHAs and CI runs, and `NEXT_STEPS.md` for remaining work. GitHub is the source of truth. Do not use real progress for destructive QA or dispatch Notion sync as a frontend test.

## Accounting textbook workspace
`accounting-textbook.html` supports the published chapters 1–9 reader. The user selects the original PDF privately in the browser. Saved textbook answers/status are included in the main backup/recovery alongside the reader's separate export. The original PDF is excluded and must be selected separately. Question crop completeness and physical iPad PDF persistence remain unverified.

## Reviewed textbook answer checks
The reader has a released local final-quantity checker for QS-6-1 (PR #66). The QS-6-2 monetary-answer expansion is released in PR #67 (2/403 questions total). It compares a final numeric answer with a reviewed calculation and explains the result. The expansion accepts an explicit final-answer line after saved working and offers a reviewed-answer reveal. It does not grade written reasoning, journal entries or unsupported questions, and does not change completion status. No answer/PDF upload or new storage key is involved.

## Frontend release authorization
The owner authorized completed, tested Study OS website changes to be merged and published without asking for release approval again (2026-11-13, Asia/Bangkok). Check the exact PR head, relevant CI, screenshots and live published files. Preserve existing user data and keep PR #44/its branch untouched. This standing frontend authorization does not authorize production database mutations, real-data deletion, backend/cloud migration or changing production sync automation; those retain their separate approval gates.

## Backup comparison
The backup file checker supports read-only comparison against this browser's allowlisted saved progress. It distinguishes identical/differing/browser-only/file-only data; it cannot determine which copy is newer or establish that recovery will succeed. Use the same browser context that holds the answers and do not clear originals based only on file-format validation.

## Course save failures
The five course pages now provide explicit failed-save feedback, user-triggered retry and export of pending in-memory progress through the existing backup format (PR #73). Progress stays browser-local; downloads and exit prompts are not automatic cloud protection.

## Current development focus
Study OS development prioritizes Accounting, Economics, Mathematics and shared study infrastructure. English/Chinese routes remain legacy compatibility surfaces; deeper language-learning feature development belongs to VocaBloom. Regression testing existing language routes does not expand their product scope.

## Multiple tabs
A course-save guard update is in review to refuse overwriting a saved dataset changed since this page opened. Pending drafts remain exportable and learners keep both copies. It uses a best-effort pre-write check; browser-local storage is not an atomic cross-tab database and this does not provide cross-browser synchronization.
