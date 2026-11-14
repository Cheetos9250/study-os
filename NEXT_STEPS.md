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
- QS-6-2/final-line/reveal work: branch `feat/textbook-money-answer-check-20261113`, PR #67, code commit `44364bf`. CI 43457836485 passed all 13 synthetic browser scenarios plus 225 Node / 3 Python tests; full Node/icon CI 43457836637 passed. Released in PR #67 as `61d64f9`; main release CI/live evidence is on the PR.
- Live Worker content checks are blocked by HTTP 403 (`1010` response on `/quiz`) from this environment; do not label live APIs verified. Cloudflare Cron/source/KV need an authorized connector/session.
- Notion safety drafts #39/#50 apply together cleanly on main `8334892`; disposable combined tests passed 5 workflow checks / 6 Python fixtures. Next: verify Actions permission for draft-PR creation and review invalid-pagination/Verified filtering evidence before a separately authorized automation release. Do not dispatch sync or edit production data as QA.
- Next grading action: obtain/review source questions and expected results for additional exercises; no verified bulk answer key is present. Never advertise all 403 as automatically graded.

- Frontend release policy: completed/tested web work may now be published under the owner's standing authorization recorded in PROJECT.md. Do not ask the same frontend release question again; retain separate production-data/backend/sync approval gates.


## Backup comparison handoff
- Backup comparison is released in PR #70 (`489601d`), with exact-main CI, screenshot inspection and live file verification. Next: rehearse differing-file and empty-browser checks on a disposable physical iPad context.
- Continue physical iPad/Files export → choose-file → compare → isolated restore rehearsal; synthetic WebKit is not proof of native Files behavior. No real user backup has been inspected by the agent.
- Preserve PR #68's separate worked-solutions work; do not duplicate its reader/solution changes.


## Save reliability follow-up
- Reader save retry is released in PR #71 (`9323e90`), with exact-main Node/Python/browser CI and live verification. Next: verify native iPad behavior using disposable answers, and preserve the retry/warning functions when integrating separate PR #68 solutions.
- Physical iPad: use disposable answers to test storage failure/retry and Export answers. Browser exit prompts are best-effort and must not be described as guaranteed protection.
- Backup comparison is now released in PR #70 (`489601d`); preserve its read-only behavior and file-selection guards.


## Course save reliability handoff
- Five-course save guard is released in PR #73 (`f1b4b96`) with exact-main CI, final WebKit screenshot review and live file verification. Preserve quiz/SRS/typing schemas, sync callbacks, backup allowlist and inactive-face CSS in future changes.
- Rehearse warning → unsaved backup → retry with disposable progress on physical iPad; never deliberately fill/block the owner's real storage for QA. A browser exit prompt is not guaranteed.
- Keep separate PR #68's textbook solutions and protected PR #44 branch untouched.


## Next independent engineering actions
- CI deduplication is released in PR #75 (`fabdd5c`): real branch/PR trigger counts, superseded-run cancellation and all five exact-main checks verified. Preserve the unchanged test jobs, PR paths, permissions and manual triggers; keep production sync separate.
- Physical iPad remains the main verification gap for Files export/recovery, blocked storage and best-effort exit warnings. Use disposable profiles/data only.
- Notion safety PRs #39/#50 and Worker/source recovery #57/#58 retain separate authorization requirements; live Cloudflare/Cron/source availability is not established by the frontend test results.


## Scope reminder
- Continue academic/shared Study OS infrastructure work. English/Chinese remain legacy compatibility routes; no new language-learning features in this work.
- Keep protected PR #44 and separately active textbook-solution PR #68 branches untouched.


## Next code review
- Cross-tab course-save guard is published in PR #77 (`4ae71f8`) with exact-head/main CI and live byte verification. Preserve draft export/no-overwrite recovery and do not describe localStorage as atomic across tabs.
- Continue source/automation recovery reviews only within their existing authorization gates; keep independent active PR #68 and protected PR #44 branches untouched.


## Reader persistence follow-up
- Course cross-tab guard is released in PR #77 (`4ae71f8`). Preserve its check-before-write behavior, pending drafts and versioned helper pins.
- Textbook-reader baseline guard is published in PR #78 (`503f8dd`), with 248 Node / 3 Python tests, 21 synthetic reader browser journeys and live byte verification. Preserve active PR #68's solutions and reconcile only the small persistence changes during future integration.
- Physical iPad: use disposable progress to rehearse two tabs, draft export and saved-copy backup. Checks are best-effort; no atomic localStorage or cross-browser sync guarantee.

## Today page follow-ups (owner priorities 2026-11-14)
- Owner priorities: Today page (released), exam countdown/plan (released), AI Tutor that answers questions and checks answers (not started; needs cost/backend decision).
- Confirm 26 Nov / 27 Nov / 1 Dec exam scopes with the owner; add `studyos.today.v1` to backup allowlist; deep-link course tabs/chapters from plan tasks.
- Owner approved moving English vocabulary to VocaBloom and increasing privacy (public repo exposes workers.dev account subdomain). Both touch data/backend and need a reviewed plan.

- Notion auto-sync stopped (owner decision, 2026-11-14). Follow-up: move the English cards into VocaBloom, then delete `data/cards.json`, `data/quiz.json`, `scripts/sync_notion.py` and the Notion tests. Owner-side: revoke the Notion token in GitHub secrets if Notion is no longer used.

- Answer checker now covers 12/403. Next: Exercise 8-13 and 8-11 (not single-number answers), printed QS 6-4 (FIFO, missing from the catalog: FIFO ending inventory $494), remaining ch6/ch8 exercises and problems. Fix catalog id mismatches with a progress migration before adding more.

- Add `studyos.home.v1` (own tasks, checklists, cover) to the backup allowlist and later to sync; then consider Notion-style table views for tasks (phase 3).
