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
