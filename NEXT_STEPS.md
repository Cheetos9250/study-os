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

## Keyboard search and metadata design — 2026-11-13

- Course-search browser regression CI 43373533213 **success**. Escape-to-clear and browser regression commits `d582ecf`, `a75d89b`; verify [CI 43374096872](https://github.com/Cheetos9250/study-os/actions/runs/43374096872).
- Review `COURSE_METADATA_DESIGN.md` (`dc28c05`) before implementing editable display-only metadata. Preserve IDs/routes and isolate versioned local storage; no production migration or sync.

## Course metadata foundation — 2026-11-13

- Escape-to-clear CI 43374096872 **success**. Pure metadata validator `e169998`, unit tests `9b48fb4`, design update `63fd982`; check [CI 43377242274](https://github.com/Cheetos9250/study-os/actions/runs/43377242274) for the exact model/test checkpoint.
- Next: design and implement versioned isolated browser-local metadata persistence with explicit Save/Reset and atomic export/import; add concurrency, denied-storage and browser QA before UI integration. Stable course IDs/routes and legacy progress must never be mutated. No production deployment or migration.

## Isolated course metadata store prototype — 2026-11-13

- Pure metadata model CI 43377242274 passed both jobs. Added CommonJS IndexedDB prototype `e4034b3` and isolation tests `46b8cd1`. Check [CI 43378166800](https://github.com/Cheetos9250/study-os/actions/runs/43378166800) before marking the prototype tests verified.
- Next: browser-exercise the store in isolated Chromium/WebKit profiles (CAS conflict, atomic invalid-import rollback, reset, denied IndexedDB), then adapt to a browser module and add explicit Save/Reset UI with backup flow. Do not expose the feature or migrate data until these checks pass.

## Metadata browser QA — 2026-11-13

- Browser harness now runs `scripts/study-os-course-metadata-browser.cjs` for Chromium and WebKit, testing opt-in IndexedDB read/write, two-client CAS, invalid import rollback, reset and restore. Verify [CI 43378426163](https://github.com/Cheetos9250/study-os/actions/runs/43378426163) before marking this checkpoint green.
- Next: resolve any browser test failures; then add explicit opt-in metadata editor UI and backup controls, with tests for blocked storage and no legacy-progress writes. Do not merge or deploy without approval.

## Draft metadata editor — 2026-11-13

- CI 43378426163 **success** for synthetic metadata-store CAS/rollback browser QA. New unlinked `course-metadata-draft.html` and `lib/study-os-course-metadata-editor.js` provide explicit opt-in Save/Reset and JSON import/export; browser script is `lib/study-os-course-metadata-store.js`. Verify [CI 43378984252](https://github.com/Cheetos9250/study-os/actions/runs/43378984252) before claiming draft editor browser QA success.
- Next: test confirmation dialogs, stale-form conflict UI, corrupt import rollback, download/reimport and denied IndexedDB. Remove redundant legacy `.cjs` store after verifying canonical `.js` consumers; keep draft unlinked until QA and approval for any production exposure.

## Editor conflict/reset QA — 2026-11-13

- Added `9cf2ed6` browser regression for reset confirmation/cancel, cross-tab stale editor rejection and explicit reload. Verify [CI 43379151530](https://github.com/Cheetos9250/study-os/actions/runs/43379151530); prior draft CI 43378984252 browser job was still in progress at inspection.
- Next: inspect failed CI logs if any, then test corrupt JSON import rollback and downloadable backup round-trip. Keep draft unlinked and production unchanged.


## Corrupt metadata recovery and backup QA — 2026-11-13

- Guard fix f3111b5 plus synthetic corrupt-record test 485c11a passed CI 43379924786 in both jobs. Malformed values must be preserved, not treated as absent.
- Immediately inspect exact-head static and Chromium/WebKit browser jobs for e41cd69 and later documentation commits. UI download/restore, invalid-import and denied-IndexedDB browser paths have not yet been verified green at the final head.
- Once green, consider clearer recovery UI for corrupt local metadata, accessible field-error messages and no-JavaScript fallback checks. Keep editor unlinked until explicitly authorized to expose or release.
- No merge, deploy, Notion/Cloudflare writes, production CAS cutover or real-data restore. Physical iPad Safari and cross-device sync remain release blockers.

## Verified metadata fallback and diagnostics — 2026-11-13

- CI 43380434836 (44bb56c) and CI 43380640662 (9fdb772) both completed **success**: static Node and synthetic Chromium/WebKit browser checks passed for disabled-JavaScript fallback and safe invalid-metadata warning.
- Next work: verify that all documentation-only PR head CI checks still pass; review PR #44 for scope creep and legacy progress isolation. Improve manual course editor accessibility and test physical iPad Safari/backup restore before seeking release authorization.
- Metadata editor is an unlinked draft only; do not assume public deployment, no production CAS cutover, no Notion or KV writes, and no automatic merge.


## Verified metadata import/mobile checkpoint — 2026-11-13

- CI 43381126032 passed cross-tab stale-backup conflict protection; 43381245830 passed oversized JSON import rejection; 43381271777 passed mobile 390px dark-mode overflow/focus QA. All are synthetic Chromium/WebKit plus static-contract, not real iPad Safari.
- Immediate next: inspect exact head after documentation-only changes; perform an independent review of PR #44 and verify physical iPad Safari with an isolated preview (not the production Pages site). Keep the draft metadata editor unlinked.
- Before any authorized release: independently verify user-owned backup/restore, storage eviction/recovery and production KV/CAS safeguards. No merge/deploy/production write without explicit approval.


## Verified metadata portability and transaction UX — 2026-11-13

- Latest code tests: fresh-profile metadata backup restore [CI 43381951146](https://github.com/Cheetos9250/study-os/actions/runs/43381951146) **success**; unsaved-draft export/import confirmation [CI 43382355274](https://github.com/Cheetos9250/study-os/actions/runs/43382355274) **success**; rapid double-save guard [CI 43382728589](https://github.com/Cheetos9250/study-os/actions/runs/43382728589) **success**; revision overflow protection [CI 43383022547](https://github.com/Cheetos9250/study-os/actions/runs/43383022547) **success**. All Chromium/WebKit runs are isolated and synthetic, not physical iPad proof.
- Immediately verify the **exact-head CI status** after this documentation-only commit. If green, next stage is an independent PR #44 review for accessibility, storage isolation and user-facing UX; then a manual physical iPad Safari test per docs/study-os-course-metadata-ipad-qa-2026-11-13.md, using only an isolated preview.
- Do not link the draft metadata editor on the production homepage, merge, deploy, alter Notion/Cloudflare Worker/KV, reset user data or activate cross-device CAS without separate owner approval.


## Academic planner list follow-up — 2026-11-13

- Chronological read-only overdue/upcoming list passed static and synthetic Chromium/WebKit CI 43383830130; mobile-expanded list CI 43384050769; explicit completion/edit/reload tests CI 43384365182.
- Check exact-head CI for accessibility target-relationship and cross-tab view-refresh additions (commits 6741afd, c0154f0, 0654f37), then test physical iPad Safari/VoiceOver in an isolated preview. Verify long-title wrapping, focus, no implicit completion and local backup restore before considering release.
- Next academic priority after usability gates: safe question/card identity adapters for defensible learning analytics. Keep measured study time distinct from planned minutes and avoid inferred accuracy/due counts from raw legacy records.
- PR #44 stays draft. Do not merge, deploy, turn on notifications/cloud sync, or change Notion/Worker/KV/CAS/legacy progress without separate owner approval.


## Read-only planner discovery continuation — 2026-11-13

- CI 43384056492 and 43384365182 confirmed Chromium/WebKit synthetic tests of responsive chronological overdue/upcoming list navigation and updates from explicit completion/undo, edit, and reload. Accessibility target contract CI 43384557733 passed.
- Verify the exact-head CI for new cross-tab refresh behavior (code 0654f3737, run 43384672610); inspect browser job logs if failing. If green, run one independent source review of PR #44 for static/service isolation, mobile/keyboard semantics and no implicit planner mutation.
- Before any live release: physically verify iPad Safari, VoiceOver, real browser storage retention and user-owned backup restore using an isolated preview. Preserve all existing acc/eco/math identities, legacy pages, Notion/Worker/KV config, and all explicit production approval gates.
- Do not merge, deploy, turn on notifications or cross-device sync, or activate data migrations without separate authorization.


## Verified planner draft-backup guard — 2026-11-13

- **Verified:** CI 43385562926 and 43385558513 completed success for unsaved new/editing plan export warnings and reset of the explicit draft form; static and Chromium/WebKit browser checks passed at `5080f8b3f`.
- **Next priority:** independent source review of draft PR #44 for stale cross-tab UX, keyboard/VoiceOver semantics, data safety and CSS layout; then physical iPad Safari and backup restore in an isolated preview. Do not call simulated WebKit evidence physical hardware QA.
- **Safety:** no deployment, merge, Notion/KV/Worker write, change to existing subject pages, content sync or progress CAS cutover without explicit owner authorization.
