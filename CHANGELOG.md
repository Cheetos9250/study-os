# Changelog

## 2026-11-13 — unreleased, draft PR #44

- Add academic dashboard panel for explicit read-only display of device-local answered-question and scheduled-card counts.
- Share progress parser across browser and Node, preserving CommonJS callers; reject malformed answer selections/SRS records.
- Add source overlap/answer-conflict diagnostic without deduplicating or modifying content.
- Add simulated DOM behavior contracts and isolated Chromium/WebKit responsive/legacy browser CI.
- Record current infrastructure observations, test evidence, boundaries and project continuation instructions in root Markdown files.

Production impact: none until separately authorized merge/deployment. No changes to Notion records, Worker bindings, KV data, API configuration, legacy course files or VocaBloom source/content.

## 2026-11-13 — study planning candidate (unreleased)

- Add device-local academic study plans with dates, topics, planned minutes, editing and explicit completion.
- Use isolated versioned IndexedDB storage with atomic revision checks for same-browser tabs; preserve stale drafts and unknown data.
- Add planner-only JSON backup/import with idempotent skips and all-or-nothing conflict handling.
- Fix stale plan summary when the view date is cleared; retain browser regression.
- Extend Chromium/WebKit QA for planner persistence, editing, concurrent tabs, backup/restore, failure states and loaded-page offline operations.

No production release or legacy learning-data mutation.
