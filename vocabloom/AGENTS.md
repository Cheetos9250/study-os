# AGENTS.md — VocaBloom (language learning only)

This file augments the root `AGENTS.md` for `vocabloom/` work. Also apply these rules when changing the legacy language entry points `eng.html` or `zh.html` from the repository root.

## Product scope
- VocaBloom is **a language-learning platform**, not a general all-subject study app.
- Prioritize English learning, roughly B1 → B2, with vocabulary, contextual examples, flashcards, quizzes, spaced repetition, mistake review and transparent learning progress. Chinese/HSK can be added progressively without disrupting English.
- Keep Accounting, Economics, Mathematics, and other general academic course workflows owned by Study OS. Preserve existing legacy datasets/features until a migration is explicitly approved and verified.
- Avoid building duplicate app shells, Workers, KV namespaces, or parallel progress sources while the two products share this repository.

## Inspect before editing
- Review relevant implementation files such as `index.html`, `study-integration.js`, `unified-progress.js`, `study-decks.json`, the root `eng.html`/`zh.html`, and config references.
- Read relevant contracts and operational reviews: `PHASE-5-DATA-INTEGRITY.md`, `PHASE-6-PRODUCTION-CUTOVER-READINESS.md`, `PHASE-6-WRITER-INVENTORY.md`, `SAFE-SYNC-ROLLOUT.md`, `STAGING-GATE.md`, `QA-LEGACY-SYNC.md`, and `QA-NOTION-EXPORT.md`.
- Compare open PRs and the exact-head VocaBloom regression CI before assuming an earlier change has landed.

## Safety-critical invariants
- Never write to production KV/Worker/Notion or perform progress imports, migration/cutover, real Auto Sync, progress resets, or history overwrites without explicit user approval. A passing staging/mock test does **not** authorize production migration.
- Maintain endpoint-scoped sync consent, duplicate/replay protection, version/CAS safeguards and account/device separation. Do not enable Auto Sync by default.
- Preserve Verified-only Notion export and fail-closed behavior on ambiguous/incomplete data. Do not expose secrets or real learning data in logs or fixtures.
- Any UI change must preserve offline/error/empty states and must not present unconfirmed writes as successful progress updates.

## Verification and handoff
- From the repository root, run applicable nonmutating tests:
  - `node --test vocabloom/tests/*.test.cjs`
  - `python3 -m unittest discover -s vocabloom/tests -p 'test_*.py'`
- Add regression cases for sync/consent/progress changes; use fake endpoints and synthetic fixtures. Test browser behavior if feasible and be precise about unsupported real-device tests.
- Work autonomously on a focused branch and **draft PR**, but do not merge, deploy, modify live data, or turn on cutover workflows without approval.
- Report exact branch/commit/PR, test evidence, current sync/migration gate, known risks and next steps. Update GitHub Markdown handoff/status files where they truly exist; never claim Project Sources or `main` were updated if only a PR branch changed.
