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
Pure Node helper only; not yet shown in homepage planner. Existing planner persistence and browser QA remain separate. A future UI integration should preserve explicit completion, existing IndexedDB schema, concurrent-tab revision checks, import/backup and failure messages. Re-run both browser engines after UI integration.

## Release constraints
No Merge, Deploy, Notion, Worker, KV, progress migration or production data write without authorization. Physical iPad Safari still requires independent validation.
