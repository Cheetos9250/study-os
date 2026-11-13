# Study OS — Agent Handoff and Safety

## Repository and current work
- Single source of truth: `Cheetos9250/study-os`.
- Active academic UI/planner work: draft PR #44, branch `feat/study-os-s1-academic-home-20261113`.
- Before making changes, inspect current `main`, PR #44 head, PRs, CI, and read `PROJECT.md`, `ARCHITECTURE.md`, `PROGRESS.md`, `NEXT_STEPS.md`.
- Prefer finishing existing tasks and CI failures before creating new overlapping implementations.

## Scope
- Study OS covers academic Accounting, Economics and Mathematics; VocaBloom owns dedicated language learning.
- Preserve existing subject identifiers `acc`, `eco`, `math` and legacy English/Chinese routes.
- Planner uses isolated IndexedDB `study-os-planner-v1`; existing progress/quiz/SRS keys are legacy and must not be migrated or reset implicitly.
- Avoid counting raw answer-map entries as accuracy or raw SRS records as mastered/reviewed cards.

## Development loop
1. Audit existing code and current GitHub Actions before changing it.
2. Make focused changes on a working branch and add automated regression coverage.
3. Distinguish Node/mock/static tests, synthetic Chromium/WebKit browser tests, live API evidence, and physical iPad Safari.
4. Fix CI failures, rerun checks, inspect artifacts where available.
5. Update `PROGRESS.md`, `NEXT_STEPS.md`, and relevant architecture/decision docs; record commit SHAs, PR and CI run IDs with exact statuses.
6. Commit verified changes and documentation to the working branch; do not report pending tests as passed.

## Strict approval gates
- No merge, production deployment, Worker/KV/Notion production writes or deletions, database migration, scheduler activation or endpoint cutover without explicit user approval.
- Cross-device progress sync requires independently verified backup, readback, rollback and writer inventory/freeze before any production CAS cutover.
- Do not expose browser sync keys or Notion credentials in logs, analytics, exports or documentation.

## Current handoff — 2026-11-13

- Academic dashboard and opt-in planner live only in draft PR #44; local planning supports explicit completion, revision-safe multi-tab edits, backup/import and overdue/upcoming discovery. Course search is in-memory and route identities are fixed.
- Separate unlinked course-metadata draft editor and isolated IndexedDB store support explicit Save, Reset, JSON download/import, cross-tab revision conflict protection and strict acc/eco/math identities. No production homepage integration or cloud sync.
- Fixed corrupt metadata record handling (null, invalid revision/payload) to fail closed, preserve existing raw records and show a no-auto-reset warning. Browser and CommonJS store sources match.
- CI 43380131840 passed static-contract and synthetic Chromium/WebKit browser QA for download/restore and corrupt-record protection. CI 43380434836 passed no-JavaScript fallback QA. Last UI warning regression commit 9fdb772 passed CI 43380640662 (both jobs). Subsequent documentation-only commits still require their own exact-head status checks.
- All browser tests are synthetic; real iPad Safari, real storage eviction, Cloudflare administration/KV and production backup/restore are not verified.
- Read PROGRESS.md and NEXT_STEPS.md for checkpoints and subsequent CI status; never infer approval to merge, deploy or change production data.
