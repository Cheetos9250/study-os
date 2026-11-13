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
- CI 43380131840 passed static-contract and synthetic Chromium/WebKit browser QA for download/restore and corrupt-record protection. CI 43380434836 passed no-JavaScript fallback QA. Last UI warning regression commit 9fdb772 passed CI 43380640662 (both jobs). Further synthetic backup/CAS, oversized-import and 390px dark-mode QA passed CI 43381126032, 43381245830 and 43381271777 at code head 5948042. Any subsequent docs-only head still needs independent CI confirmation.
- All browser tests are synthetic; real iPad Safari, real storage eviction, Cloudflare administration/KV and production backup/restore are not verified.
- Read PROGRESS.md and NEXT_STEPS.md for checkpoints and subsequent CI status; never infer approval to merge, deploy or change production data.


## Latest QA handoff — 2026-11-13

- Draft PR #44 course metadata backup portability, unsaved-export/import protection, rapid double-save serialization, and revision-overflow fail-closed tests passed synthetic Chromium/WebKit + Node CI runs 43381951146, 43382355274, 43382728589, 43383022547 respectively. Full evidence: PROGRESS.md.
- Current candidate has a separate unlinked local course metadata editor. Do not silently expose it, migrate planner/progress stores, or merge/deploy.
- Physical iPad Safari checklist: docs/study-os-course-metadata-ipad-qa-2026-11-13.md. This is an unexecuted manual checklist, not successful hardware QA.
- Preserve exact-head CI verification and no Production writes for every subsequent change.


## Latest planner list handoff — 2026-11-13

- Candidate homepage includes a collapsed chronological overdue/upcoming read-only list that selects dates and focuses the daily plan list without completing a session. CI 43383830130 and mobile CI 43384050769 passed; completion/edit/reload CI 43384365182 passed synthetic Chromium/WebKit + Node.
- Accessibility relationship and cross-tab refresh changes 6741afd/c0154f0/0654f37 need exact-head CI review, not inferred success from old runs. Inspect PROGRESS.md, NEXT_STEPS.md and PR #44 before edits; avoid overlapping live branch writes when another agent changes head.
- Real iPad Safari/VoiceOver, production KV/CAS/cloud and user data restoration remain unverified and approval-gated.


## Academic planner latest handoff — 2026-11-13

- Draft PR #44 now includes collapsed, chronological read-only lists for overdue/upcoming local study plans, with accessible focus target and no automatic completion or new persistence. Existing planner storage and five legacy course routes remain unchanged.
- CI 43383837816, 43384056492, 43384365182, 43384557733 all passed Node and isolated Chromium/WebKit browser jobs. The cross-tab refresh test at 0654f3737 requires exact-head CI verification before claiming success; see PROGRESS.md.
- Course display metadata editor is a separate, unlinked local-only draft; do not attach its settings to the homepage, migrate legacy progress or enable production release.
- Continue from current PR head and PROGRESS.md/NEXT_STEPS.md. Real iPad Safari and live systems remain unverified. No merge/production write without explicit approval.
