## Accounting textbook follow-up (PR #68, current state 2026-11-14)
1. **Do not publish prematurely.** New source-reviewed coverage is 50 questions and total draft coverage is 79/403 indexed IDs. Earlier drafts not uniformly verified; 324 indexed IDs still lack drafts. Original printed book has additional omitted/mislabeled question headings.
2. **Fix remaining catalog omissions and numbering safely.** Chapter 2 QS 2-1..4 and E 2-1..4 crop/title pairs were repaired without changing local progress IDs. Several other Chapter 2 IDs remain misnumbered (automated labels such as QS-2-31..35), and printed QS 1-10/E 1-10/E 1-17 are missing. Before rekeying, design/export a local-progress migration or ID alias plan.
3. **Continue verified batches.** Work from the owner's PDF and preserve problem page(s), figures, supporting calculations, and rubric. QS 2-3 needed Chart of Accounts appendix on PDF pages 1134–1135; do not assume all exercises fit only the chapter's page span.
4. **Run exact-head QA before release.** Test solutions and geometry, perform isolated browser navigation/saved-answer regression, and inspect actual rendered private PDF on iPad. In-session data validation is not a substitute for GitHub Actions CI or device testing. No production-data or backend changes.

## Accounting textbook full-solution completion (PR #68; not yet published)
1. **Repair the question catalog before assigning remaining answers.** The automated 403-ID catalog omits printed questions (e.g. QS-1-10, E-1-10, E-1-17) and assigns some Chapter 2 labels/crops to the wrong printed question (QS-2-1..4, E-2-1..4). Audit source pages and preserve/migrate user-local saved answers before renumbering.
2. **Audit older draft solutions.** 65 draft entries currently exist; 36 added in the latest continuation are source-reviewed, and 29 earlier drafts have not been consistently verified. No draft equals an official answer key or automatic grader.
3. **Finish coverage in verified batches.** 338 currently indexed question IDs have no draft, plus additional printed questions missing from the catalog. Attach source PDF page(s) and use the `verification` marker only after reading the real question, numbers and figures.
4. **QA and release gate.** Run exact-head tests and synthetic responsive browser checks, then inspect private PDF crop and saved progress on a disposable physical iPad. Do not merge PR #68 or publish the worked solutions until catalog/source correctness and current-head CI are established. Keep real progress, PDF, Notion, backend and sync safe.

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
