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
`accounting-textbook.html` supports the published chapters 1–9 reader. The user selects the original PDF privately in the browser. Textbook answers currently have a separate local export; the main backup does not yet include them. Question crop completeness and physical iPad PDF persistence remain unverified.
