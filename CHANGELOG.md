# Changelog

## 2026-11-14 (Monday quiz practice)
- Added 14 embedded Accounting practice questions for the 16 Nov quiz: 7 on cost flow (ch6: FIFO, weighted average, specific ID, inventory error carry-over, lower of cost and NRV, consistency) and 7 on bank reconciliation (ch8: reconciling items, adjusted balances, NSF/service-charge entries, book error). Questions are appended at the end of the embedded set so existing answer history (indexed by position) is unchanged.

## 2026-11-14
- PR #77: course saves/retries check the original saved bytes before writing; conflicting progress remains saved and pending drafts stay exportable. Release `4ae71f8`.
- PR #78: the textbook reader protects other-tab answers, keeps unsaved working exportable and refuses to overwrite unreadable/corrupt initial data. Release `503f8dd`.
- These checks are best effort, not atomic cross-tab transactions or cross-browser sync. No learning content, solution coverage, production data or backend automation changed.
- Validation and release evidence: see PROGRESS.md. Physical iPad/Safari/Files rehearsal remains pending.

## 2026-11-14 (Today page)
- Added `today.html`: exam countdown, due cards for the three academic courses, weak chapters and a daily study plan; linked from the homepage. Course progress is read-only; settings use the new `studyos.today.v1` key.

- Usability: 44px touch targets on course pages, rating buttons hidden until reveal, Today link in course navigation, and Today plan buttons that open the exact chapter tab (summary, cards, Practice).

- Textbook reader: chapter chips, deep links, split question/answer view on wide screens, jump bar on narrow ones, loading message while a stored PDF reopens, and a Today link to the chapter. Checked with a synthetic 1,210-page PDF only; no real textbook or progress was used.
