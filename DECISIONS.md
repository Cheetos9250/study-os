# Study OS decisions

## 2026-11-13 — browser-local planner persistence

Use a dedicated IndexedDB database instead of rewriting a shared localStorage JSON array. Readwrite transactions serialize same-browser tabs, and per-record revision checks reject stale edits. This preserves existing learning data and avoids claiming cloud synchronization.

Keep immutable subject IDs (`acc/eco/math`), validate full record/file versions, preserve unsupported data and reject conflicting imports atomically. Use Bangkok calendar dates and label duration as planned minutes. Completion requires a user action and does not alter quiz/SRS statistics.

No deletion, automatic data migration, background network sync or notification registration in this candidate. Editable course metadata is a follow-up with its own compatibility contract.
