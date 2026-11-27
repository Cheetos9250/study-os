# Ecosystem map and data contract (ecosystem/v1)

Two apps make up the owner's personal ecosystem. Each kind of data has **one owner**; the other app only reads it.

| App | Repo | Owns | Stored in |
|---|---|---|---|
| Study OS (this repo, public) | `study-os` | study progress, exams, timetable, study tasks, grades | browser localStorage + progress Worker (KV) |
| Life OS (private) | `personal-life-os` | money, life tasks, habits, journal, goals, bills, check-ins, Telegram | Cloudflare D1 |
| Google Calendar | owner's account | appointments | Google |

Life OS **Today** is the home dashboard. Study OS stays the place to study. No personal data in this repo; secret names only.

## How Life OS reads Study OS

Life OS calls the read-only Worker `study-os-gemini-mcp` through a service binding, with the Bearer token
`STUDY_OS_TOKEN` (Life OS side) = `MCP_READ_TOKEN` (this Worker). Nothing writes back to Study OS.

| Endpoint | Body | Used for |
|---|---|---|
| `GET /plan` | `{v:1, kind:"plan", generated, tasks[], exams[], classes[]}` | Today: tasks due, exam strip, classes |
| `GET /digest` | `{v:1, kind:"digest", generated, courses[], totals}` | Telegram 07:00 message, Study card |
| `GET /export` | Sheet tables | old fallback when `/plan` is missing |

Field shapes (see `docs/ecosystem/v1.fixture.json` for a full example):

- task: `id`, `title`, `date` (`YYYY-MM-DD` or `null`), `pri` (`high`/`medium`/`low`, lowercase), `done` (always `false`: open tasks only), `link` (https or `null`)
- exam: `title`, `date`, `course` (upcoming only, sorted by date)
- class: `day` (0 = Sunday), `start`, `end` (`HH:MM`), `name` (skipped classes left out)
- digest course: `key`, `name`, `cards_due`, `quiz_due`, `answered`, `total`, `correct`, `pct` (or `null`), `recent {days:7, answered, correct, pct}`, `weak [{label, pct, answered}]`

## Rules

1. Adding a field keeps `v:1`. Removing or renaming a field, or changing its type or meaning, is `v:2` and must ship as a new endpoint or behind `?v=2` while v1 still works.
2. `docs/ecosystem/v1.fixture.json` is the shared example. Life OS keeps a copy and tests its parser against it; this repo tests `validate()` (`workers/gemini-mcp/ecosystem-v1.mjs`) against it (`tests/ecosystem-v1.test.cjs`). Change both copies in the same day.
3. The fixture holds sample data only.
4. Changes here need a Worker redeploy (`deploy-gemini-mcp.yml`, owner types DEPLOY). The deploy smoke test checks `/plan` answers `"v":1`.

## Backup and handoff

- Study OS: **Back up** button + cloud sync. Life OS: D1 Time Travel + Download all data.
- Each repo's `HANDOFF.md` is the per-app status; this file is the shared map.
