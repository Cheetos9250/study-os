# Next steps

## Accounting textbook answer coverage (new request, 2026-11-13)
1. **Partial content ready for review on `feat/accounting-textbook-worked-solutions-20261113`:** 24 source-reviewed original worked solutions, with a reveal-only UI. Do not label all 403 questions answered. Auto-check still supports QS-6-1 only.
2. **Index completeness gate:** compare printed question identifiers in *Fundamental Accounting Principles* chapters 1–9 with current catalog (403 rows). Known missing entries include QS-1-10 and E-1-10. Fix catalog/geometry separately with visual PDF-page checks and regression tests; preserve each existing progress key/ID.
3. **Answer-content gate:** produce original, independently checked step-by-step worked solutions for the remaining **379 currently indexed questions**, ensuring all subparts, journal entries, FIFO/LIFO/weighted-average computations and financial statements are correct. Use user's licensed source PDF; never invent a publisher key or grade.
4. **UI/QA gate:** run exact-head Node tests and isolated Chromium/WebKit flows after draft PR; do not deploy until checks pass and the owner authorizes deployment. Test physical iPad Safari and saved-answer/backup behavior using disposable data. Existing saved notes must not be overwritten by an answer reveal.
5. Merge, production release, Cloudflare/Notion writes and progress migration **require explicit owner authorization**.


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
- Review the local QS-6-1 final-quantity checker and its exact-head browser CI before release. It covers 1/403 questions, not a general AI grader.
- Expand only after obtaining/reviewing each question's expected result and rubric from legitimate source material. Journal-entry and multi-part exercises require structured checks; never infer a verified grade from an arbitrary number in working.
- Keep manual completion status and existing answer storage/backups intact. Use disposable data for device verification.
