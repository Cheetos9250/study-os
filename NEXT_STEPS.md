# Study OS next actions

## Immediate

1. Planner code checkpoint 18dd843 passed static and Chromium/WebKit QA (run 43364009951). Recheck exact-head CI after future changes; fix failures on the same working branch.
2. Use CI screenshot artifacts for future layout comparisons; physical iPad Safari remains unverified until actually tested.
3. Planner, atomic tab edits, backup/restore/idempotency/conflict rollback and mobile/tablet screenshots are verified with synthetic browser profiles. Next improve upcoming/overdue plan discovery; retain explicit completion and isolated storage.
4. Add editable academic course metadata after defining stable subject identities and restore behavior. Keep original acc/eco/math/eng/zh pages and shared content intact.
5. Validate bundled/external question and card identity mapping before deriving accuracy, coverage, due counts or streaks from real progress.

## Release and infrastructure blockers

- Explicit owner authorization required before merge or production deploy. PR #44 stays draft.
- iPad Safari on real hardware, local backup/restore, cached legacy tabs and cross-device progress require separate verification. Passing WebKit fixtures is not proof of these.
- Cloudflare read-only admin access/evidence is needed to verify deployed Worker, KV namespace, scheduler bindings and Cron runs. HTTP 403 is not a successful health check.
- Production CAS needs independent raw KV backup with checksums, staged restore/readback, writer inventory/freeze, rollback rehearsal and explicit cutover approval. Never change content `api` to a CAS-only endpoint.
- Review #39 independently; do not silently combine exporter behavior with the academic UI change. Do not bulk-verify Notion Draft rows.

## Verification commands

- `node --test tests/*.test.cjs vocabloom/tests/*.test.cjs experiments/study-sync-cas/*.test.mjs experiments/prod-progress-cas/*.test.mjs`
- `python3 -m unittest discover -s vocabloom/tests -p 'test_*.py'`
- `node scripts/study-os-content-audit.cjs`
- `node scripts/study-os-source-overlap.cjs`
- `node scripts/study-os-browser-check.cjs` (requires Playwright Chromium/WebKit; isolated localhost/synthetic data only)

## Planner follow-up

After current QA passes: add editable course display metadata with stable subject IDs; extend planner discovery to upcoming/overdue plans; verify iPad Safari and restore from downloaded plan backup after browser storage loss in an isolated profile. Future cross-device plan sync needs its own reviewed schema/authorization; do not attach it to legacy progress KV automatically. Reminders are not implemented or scheduled.

## Current handoff — 2026-11-13 (after plan discovery CI)

1. **Completed:** pure `discoverPlans` helper and tests; code commit `b66f187`, CI run 43367779307 **success**. Contract: `docs/study-os-plan-discovery-contract-2026-11-13.md`.
2. **Next:** integrate overdue/today/upcoming summaries into the existing homepage planner UI without changing IndexedDB schema or implicit completion. Preserve draft edits, atomic imports, and explicit user completion.
3. Extend isolated Chromium/WebKit browser QA for classification, stale state, mobile/tablet layout, and blocked/corrupt storage; check exact-head CI and screenshots.
4. Add editable academic course display metadata only after a separate stable-ID and backup contract; avoid altering `acc`/`eco`/`math` keys or academic page contents.
5. Physical iPad Safari, storage-eviction recovery and cross-device plan sync are still unverified; do not claim production readiness.

Safety: PR #44 remains draft. Do not merge, deploy, modify Notion, Worker, KV, API config, or production data without explicit authorization.

## Integration checkpoint — 2026-11-13

- Plan discovery is now wired to the draft homepage planner: overdue/today/7-day upcoming/completed **counts only**. No automatic actions.
- **Immediate:** check CI for `dc836b0` and subsequent exact-head commits; investigate any failing static/browser tests, and inspect synthetic Chromium/WebKit planner screenshots.
- **Then:** add browser regression assertions for the four discovery counts, including edits, date changes and explicit completion. Keep existing backup/import and multi-tab guarantees.
- **Later:** optional filters/lists and course metadata after tests; real iPad Safari and production release remain blocked pending separate validation/approval.

## Autonomous continuation checkpoint — 2026-11-13

- CI 43369282612 passed for regex-fix commit `e38f3db`.
- New Chromium/WebKit synthetic planner assertions for discovery counts were committed at `598771a`; check CI run 43369517015 and fix any failures before proceeding.
- Added root `AGENTS.md` for cross-chat/agent handoff, source-of-truth rules, test evidence boundaries and production approval gates.
- Next implement more granular overdue/upcoming planner views only after the existing discovery-count browser regression is green; then consider editable course metadata with stable IDs and isolated backup semantics.

## Navigation checkpoint — 2026-11-13

- Discovery count browser regression CI 43369517015 **success**.
- Explicit overdue/upcoming date-navigation buttons are implemented on draft PR #44; verify exact-head Chromium/WebKit CI for `5f0f9b0` and extend tests to non-empty overdue/upcoming groups before claiming full coverage.
- Preserve the local-only planner, stable academic IDs, conflict-safe revisions and backup semantics. No release, merge or live sync without approval.
