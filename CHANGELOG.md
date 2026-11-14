# Changelog

## 2026-11-14 (Monday quiz practice)
- Added 14 embedded Accounting practice questions for the 16 Nov quiz: 7 on cost flow (ch6: FIFO, weighted average, specific ID, inventory error carry-over, lower of cost and NRV, consistency) and 7 on bank reconciliation (ch8: reconciling items, adjusted balances, NSF/service-charge entries, book error). Questions are appended at the end of the embedded set so existing answer history (indexed by position) is unchanged.
- Added a 200-question English practice bank: 100 cost flow (Ch06: ownership, cost components, FIFO/weighted average/specific ID, periodic vs perpetual, error carry-over, lower of cost and NRV, turnover, gross profit method) and 100 bank reconciliation (Ch08: reconciling items by side, adjusted balances, journal entries, errors, controls). Numeric items are generated from formulas and every wrong option names a specific mistake. Appended at the end, so saved progress is unchanged.
- Translated all 60 embedded Accounting practice questions and feedback to English. Position, correct option and option count are unchanged, so saved answers stay valid. Flashcards, summaries and Notion-synced questions are unchanged.
- Added periodic-system COGS: 2 Ch06 flashcards (formula; perpetual vs periodic) and 4 questions (formula, why count, multi-item calculation with returns/discounts/freight-in, FIFO periodic). Appended at the end, so saved progress is unchanged.
- Rewrote 15 older embedded questions (ch3, ch6, ch8, ch9) whose stems were incomplete or unclear (e.g. "Outstanding checks ปรับที่?", "Weighted avg เฉลี่ย 110 ขาย 12"): full scenarios, clearer options, richer feedback. Position, correct option and option count are unchanged, so saved answers stay valid.

## 2026-11-14
- PR #77: course saves/retries check the original saved bytes before writing; conflicting progress remains saved and pending drafts stay exportable. Release `4ae71f8`.
- PR #78: the textbook reader protects other-tab answers, keeps unsaved working exportable and refuses to overwrite unreadable/corrupt initial data. Release `503f8dd`.
- These checks are best effort, not atomic cross-tab transactions or cross-browser sync. No learning content, solution coverage, production data or backend automation changed.
- Validation and release evidence: see PROGRESS.md. Physical iPad/Safari/Files rehearsal remains pending.

## 2026-11-14 (Today page)
- Added `today.html`: exam countdown, due cards for the three academic courses, weak chapters and a daily study plan; linked from the homepage. Course progress is read-only; settings use the new `studyos.today.v1` key.

- Usability: 44px touch targets on course pages, rating buttons hidden until reveal, Today link in course navigation, and Today plan buttons that open the exact chapter tab (summary, cards, Practice).

- Textbook reader: chapter chips, deep links, split question/answer view on wide screens, jump bar on narrow ones, loading message while a stored PDF reopens, and a Today link to the chapter. Checked with a synthetic 1,210-page PDF only; no real textbook or progress was used.

## 2026-11-14 (stop Notion auto-sync)
- Removed `.github/workflows/sync.yml` (15-minute Notion exporter that pushed to `main`). `data/cards.json` is kept because VocaBloom still fetches it; it is now a frozen snapshot, so new Notion rows no longer appear. `scripts/sync_notion.py`, `data/quiz.json` and their tests are kept until the English cards move into VocaBloom. Re-enable by restoring the workflow from git history.

## 2026-11-14 (practice: multi-chapter)
- Practice tab (acc/eco/math): tap several chapter chips to practice them together; "ทั้งหมด" clears the selection. New "ข้อที่ยังไม่ทำ" filter; with "ข้อที่ผิด" also on, it shows both (unanswered + wrong). Deep links still select one chapter. eng/zh unchanged.
