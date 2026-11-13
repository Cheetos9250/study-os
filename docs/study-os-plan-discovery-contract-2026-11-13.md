# Study OS — Plan Discovery Contract

Date: 2026-11-13. Draft PR #44. No production deployment.

## Implementation
- `lib/study-os-plan-discovery.cjs` exports `discoverPlans(sessions, today, horizonDays=7)`.
- Validates the existing planner session schema and a caller-supplied Bangkok-local ISO calendar date.
- Returns four sorted groups: overdue, today, upcoming (tomorrow through inclusive horizon), completed.
- Completed sessions are not flagged overdue. Sessions beyond the horizon are not listed in upcoming.
- Does not read IndexedDB, localStorage, secrets, cloud services or the system clock. No writes or automatic completion.
- Does not infer actual study duration or learning mastery from planned minutes.

## Tests
`tests/study-os-plan-discovery.test.cjs` covers overdue/today/upcoming/completed separation, horizon boundary, invalid dates, invalid records and nonmutation. Workflow path filters include both new files.

## Integration status
Initial checkpoint: pure Node helper only (later integrated into draft homepage; see the newer checkpoint below). Existing planner persistence and browser QA remain separate; preserve explicit completion and revision safety.

## Release constraints
No Merge, Deploy, Notion, Worker, KV, progress migration or production data write without authorization. Physical iPad Safari still requires independent validation.


## Homepage integration and read-only date navigation (2026-11-13)

This earlier "pure helper only" checkpoint is superseded by the following **unreleased** PR #44 changes:

- The existing academic homepage planner now shows overdue, today, inclusive-next-seven-days, and completed counts using already-loaded browser-local sessions. No additional IndexedDB store or data migration.
- A collapsed `details#plan-discovery-details` renders chronological overdue and upcoming session buttons through `textContent`, keeping untrusted titles as text. Each button targets `#plan-list`, selects the existing date view and moves keyboard focus to the list; it never marks sessions done or writes storage.
- An empty state is displayed when both groups are empty; completed sessions stay excluded from overdue/upcoming. The existing "ดูงานค้าง" and "ดูแผนถัดไป" controls still select earliest overdue/nearest upcoming dates.
- Static contracts and isolated Chromium/WebKit QA cover multiple out-of-order dates, date navigation, visible session title, focus target, mobile expanded-list overflow and group sorting. CI 43384056492 (e7369f4) and CI 43384365182 (38a854d) both succeeded in static and browser jobs.
- A later synthetic regression exercises check/uncheck completion, renamed topics, persistence after reload and explicit refresh after cross-tab completion. Code commit 0654f3737: inspect its exact-head CI before claiming it passed.
- This is **not** a cloud reminder, notification, cross-device sync, measured study duration or physical iPad Safari test. PR #44 is Draft, not deployed.
