# VocaBloom changelog

All entries below describe an unmerged proposal, not a production release.

## 2026-11-13 — Continuous language development

- Fixed main vocabulary import selecting POS tags instead of Thai meanings for 236 committed Verified words; 573 imported words and their original IDs remain preserved.
- Removed the optional Example prefix from imported pipe-format example sentences.
- Fixed selected-chapter practice losing words deduplicated against another chapter; normalized practice identity comparisons with NFKC.
- Added session-only Retry mistakes for answered incorrect questions without changing SRS, quiz scores or cloud data.
- Added regression coverage for both importer field orders, invalid meaning fields, committed-data translations, cross-chapter duplicates and retry isolation.
- Added project/architecture/decision documentation and current evidence/next steps.
- Added an isolated Chromium/WebKit desktop/tablet browser harness and CI with read-only permissions; real service requests are blocked. Browser execution results are recorded in the audit.

## 2026-11-13 — Round 2 (proposal only)

- Accept reviewed regular inflections in examples while requiring complete tokens and phrasal particles; import 581 committed English words with no loss of the previous 573 IDs.
- Keep partial `securities filing` example excluded; do not rewrite source text.
- Show supplied source examples, translations and references after practice answers; freeze and HTML-escape context.
- Add eligibility/security regression tests and browser scenarios for active content refresh, Full Backup download and cancelled/accepted disposable Full Restore.
- Removed redundant nested distractor deduplication and added a 1,000-card correctness regression; local Node suite now 233 passing tests.
- Verified optimized generation with 233 Node tests, 3 Python tests and all four extended hosted browser cases; narrowed browser push path triggers to relevant app/test/data files.

## 2026-11-13 — Backup safety browser regression (unmerged)

- Extended isolated Chromium/WebKit desktop/tablet QA to reject three malformed Full Backup variants: invalid subjects array, invalid VocaBloom progress array, and missing English subject key.
- Verified each rejection leaves browser storage unchanged; tests use synthetic fixtures and block live services.
- Both CI workflows passed for implementation SHA `f269d5f9514580f75785e71a430042a8db282c68`: regression run `43367785010` and browser run `43367784703`.
- No production data, Worker, Notion, site configuration or existing learner progress changed.
