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
