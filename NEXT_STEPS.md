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

## Non-empty navigation QA checkpoint — 2026-11-13

- CI 43369814606 passed static and browser QA for the empty-group navigation implementation.
- Commit `3271476` adds independent Chromium/WebKit synthetic profile coverage for non-empty overdue/upcoming groups, dates, incomplete status and reload persistence. Check [CI 43370021313](https://github.com/Cheetos9250/study-os/actions/runs/43370021313), fix any failures, and update this document with actual result.
- After green CI: consider explicit overdue/upcoming list views and more accessible status messages; do not modify production or conflate synthetic WebKit with physical iPad Safari.

## Browser QA failure checkpoint — 2026-11-13

- Run 43370021313 failed browser-qa at non-empty navigation discovery text; static-contract passed. Commit `208c135` adds explicit asynchronous render waits in the synthetic browser test; CI 43370327132 pending. If it fails, inspect browser job logs and DOM/console before changing application code. Do not infer a production defect from a test-only failure.

- Run 43370327132 failed browser-qa: `innerText()` returned empty despite a preceding `textContent` wait. Commit `b0ef9a1` switches the synthetic navigation assertion to `textContent()`; monitor [CI 43370697293](https://github.com/Cheetos9250/study-os/actions/runs/43370697293). If still red, inspect visibility, page state and test data rather than masking a product issue.

- CI 43370697293 failure localized to **post-reload** assertion at browser test line 196. Commit `37dcad4` waits for planner visibility and persisted discovery after reopening; verify [CI 43371040880](https://github.com/Cheetos9250/study-os/actions/runs/43371040880). If green, update AGENTS.md handoff and continue planner usability/accessibility checks. No production release authorization.

## Verified green navigation checkpoint — 2026-11-13

- CI 43371040880 **success** for both static-contract and browser-qa at `37dcad4` (synthetic Chromium/WebKit). The post-reload test race is resolved.
- Next priorities: improve planner date-navigation accessibility and test chronological selection across multiple overdue/upcoming dates; evaluate course-management requirements without migrating or modifying existing data. Physical iPad Safari remains unverified. Keep PR #44 draft and do not deploy or merge without approval.

## Multi-date planner QA — 2026-11-13

- Commits `d66fbd9`, `2b9f5a0`, `64c0c33` expand synthetic browser navigation to 2 overdue + 2 upcoming dates and add accessible group/relationship markup with static regression checks. Check [CI 43371435910](https://github.com/Cheetos9250/study-os/actions/runs/43371435910) before marking this checkpoint verified.
- Next: inspect course-management data boundaries and user-facing course navigation; do not create/migrate production course records or enable cloud sync without explicit approval.

## Course search checkpoint — 2026-11-13

- Multi-date navigation CI 43371435910 passed both static-contract and browser-qa. Course search commits `0dbbb22`, `2f45c73`, `20c55d2` add accessible local-only filtering with no persisted metadata or changes to course identity. Verify [CI 43371847878](https://github.com/Cheetos9250/study-os/actions/runs/43371847878) before marking course search verified.
- Next: add isolated browser QA for Thai/English course search and no-match reset; design editable course metadata as a separate schema with stable IDs and backup guarantees, without touching production data.

## Course search browser regression — 2026-11-13

- CI 43371919159 passed static-contract/browser-qa after `08f8717`. New browser regression commit `0bd4922` checks Thai/English search, empty state and reset across Chromium/WebKit and four viewports. Verify [CI 43373533213](https://github.com/Cheetos9250/study-os/actions/runs/43373533213) before claiming the new test passes.
- Editable course metadata remains a design task: preserve `acc/eco/math` IDs and legacy progress keys, use separate local namespace and atomic backup/import, do not migrate or mutate production data without approval.
