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
Course pages and the textbook reader now refuse to overwrite saved progress changed since the page opened (PR #77/#78). Pending drafts remain exportable so learners can keep both copies. These are best-effort pre-write checks; browser-local storage is not an atomic cross-tab database and this does not provide cross-browser synchronization. Close other tabs before recovery and keep both the pending draft export and a backup of the saved copy when a conflict appears.

## Today page
`today.html` (logic in `scripts/study-today.js`) shows the exam countdown, cards due across Accounting/Economics/Mathematics, weak chapters (embedded Practice accuracy below 70%, at least 2 answers) and a daily chapter plan. It reads course progress read-only and writes only `studyos.today.v1` (exam list, chapter completion). That key is not yet in the backup allowlist. Default exams: 16 Nov Accounting quiz (ch6 cost flow + ch8 bank reconciliation, confirmed by owner); 26 Nov Accounting, 27 Nov Economics, 1 Dec Mathematics (scopes are assumptions until the owner confirms them on the page). Weak-spot analysis counts embedded questions only; Notion-synced extra questions use dynamic IDs and are excluded.

## iPad usability and deep links
Course pages use 44px touch targets (chips, buttons, tabs, question-number cells, nav links; shared `assets/study-course-layout.css`). Card rating buttons stay hidden until the card is flipped. Academic course pages link to Today, and `scripts/study-course-nav.js` supports `course.html?tab=cards|sum|prac&cat=<chapter id>` by clicking the existing tab/chip controls; it reads and writes no progress. Today's plan tasks use these links (summary → cards → Practice for that chapter).

## Textbook reader usability
`accounting-textbook.html` has chapter chips 1–9, deep links (`?ch=6`, `?ch=6&type=Problem%20A`, `?q=QS-6-2`; invalid values are ignored and resume still works otherwise), a split question/answer view at 980px and wider, a jump bar on narrower screens and 44px targets. While a stored PDF is reopening it shows a loading message instead of a Choose PDF prompt. The PDF lives in the storage of the browser context where it was chosen: Safari tab and Home Screen app do not share it. Today's accounting chapter tasks link to the matching textbook chapter. Answer checking coverage is unchanged (2/403).
