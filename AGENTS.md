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

## Current handoff
- The homepage has an academic planner with local add/edit/complete, conflict-safe IndexedDB persistence and planner-only backup/import.
- Pure plan discovery groups overdue/today/upcoming/completed. Draft homepage displays counts and provides read-only overdue/upcoming date navigation.
- CI run 43369814606 passed the empty-state navigation checkpoint. Non-empty synthetic Chromium/WebKit tests were added in `3271476`; failures 43370021313, 43370327132 and 43370697293 localized to a post-reload assertion race. Commit `37dcad4` waits for IndexedDB-backed UI reload; verify CI 43371040880 before claiming success. Physical iPad Safari remains unverified.
- Read `PROGRESS.md` and `NEXT_STEPS.md` for subsequent updates; these take precedence over this handoff snapshot.
