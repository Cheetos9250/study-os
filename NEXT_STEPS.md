# Next steps

## Highest priority
1. Rehearse the published backup → file check → restore flow on physical iPad Safari using disposable data. Repeat for Home Screen/PWA context if used. Chromium/WebKit simulations passed but do not establish real-device behavior.
2. Confirm the actual study browser has a privately saved backup before clearing browser storage or changing devices. The agent has not accessed or backed up real user progress.
3. Perform a separate read-only audit of the live Cloudflare/Notion/scheduler state and backend source availability before claiming automatic or cross-device protection.

## Product work
The basic study, local backup and missing-only recovery workflow is published in PR #53. Keep PR #44 and its branch untouched under the existing instruction; its broader dashboard/planner is separate.

## Verification rules
- Use synthetic data and isolated browser profiles for reset/restore tests.
- For future UI changes, require relevant exact-head CI, inspect responsive screenshots and verify published files after an authorized release.
- No production learning-data write, deletion, cloud migration or Notion sync dispatch is part of UI QA.

## Current textbook workspace
The chapters 1–9 reader is published in PR #63. Preserve its private-PDF workflow and the 403-question scope. Its answer data is now included in the main backup. Rehearse that round trip on a disposable physical iPad context; the original PDF is not part of the backup. Do not modify the original PDF or catalog data during backup integration.


## Textbook answer checking
- QS-6-1 was released in PR #66 (`8334892`), with exact-main CI and read-only live verification. Review the QS-6-2 monetary-answer expansion and its synthetic browser CI; coverage is 2/403, not a general AI grader.
- Expand only after obtaining/reviewing each question's expected result and rubric from legitimate source material. Journal-entry and multi-part exercises require structured checks; never infer a verified grade from an arbitrary number in working.
- Keep manual completion status and existing answer storage/backups intact. Use disposable data for device verification.


## Current handoff
- QS-6-2/final-line/reveal work: branch `feat/textbook-money-answer-check-20261113`, PR #67, code commit `44364bf`. CI 43457836485 passed all 13 synthetic browser scenarios plus 225 Node / 3 Python tests; full Node/icon CI 43457836637 passed. Release state must be checked on the PR.
- Live Worker content checks are blocked by HTTP 403 (`1010` response on `/quiz`) from this environment; do not label live APIs verified. Cloudflare Cron/source/KV need an authorized connector/session.
- Next infrastructure action: reconcile the existing Notion exporter safety drafts #39/#50 and review their failure/pagination behavior without dispatching sync or editing production data.
- Next grading action: obtain/review source questions and expected results for additional exercises; no verified bulk answer key is present. Never advertise all 403 as automatically graded.
