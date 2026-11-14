# VocaBloom autonomous development instructions

## Product boundary
VocaBloom is for language learning only: English vocabulary first, multilingual later. Do not add general academic courses. Study OS retains Accounting, Economics and Math. Preserve all five historical deck IDs, local storage keys, SRS histories and backup/restore compatibility.

## Source of truth and startup
GitHub repository `Cheetos9250/study-os` is the authoritative code and documentation source. Before editing, read this file, `PROJECT.md`, `ARCHITECTURE.md`, `PROGRESS.md`, `NEXT_STEPS.md`, `DECISIONS.md` and the most recent evidence in `CONTINUOUS-AUDIT-2026-11-13.md`. Check branch head, Draft PR #41, CI status and existing changes. The working branch is `feat/vocabloom-p1-english-ui-20261113`; verify this is still current rather than assuming it.

## Execution
Choose the next highest-priority safe task from `NEXT_STEPS.md`. Inspect existing code/tests first, implement small reversible changes, and add executable regressions. Run the relevant CI and inspect results; mark pending or failing checks honestly. Continue with additional safe tasks without asking the user to repeat “continue.” Do not claim local or live checks were performed without actual evidence.

## Documentation after each verified change
Update `PROGRESS.md` (actual work and verified evidence), `NEXT_STEPS.md` (remaining blockers), `CHANGELOG.md` (behavioral changes), `DECISIONS.md` (material architecture/product choices), and `ARCHITECTURE.md` (system boundaries when changed). Update `PROJECT.md` only for changes in mission, scope or repository pointers. Append to the audit with SHA, CI links, tested environment and limitations. Do not rewrite historical test results. Commit docs on the same feature branch so another chat/agent can resume from GitHub.

## Safety
No merge, deployment, production Worker/KV/Notion writes, real progress migration, Auto Sync activation, secret exposure or destructive data cleanup without specific owner authorization. Synthetic browser tests must block real services and use disposable storage. Treat iPad Safari/VoiceOver and real staging CAS persistence as unverified until separately evidenced. Never mistake a request to continue development for permission to modify production.

## Handoff checklist
Record feature branch, latest code SHA, CI run IDs/status, changed files, what passed/failed, remaining tasks, and explicit production release gates. GitHub is the source of truth; Google Drive handoff copies may be older.
