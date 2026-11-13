# Study OS progress

Updated: 2026-11-13 (Asia/Bangkok). Branch: `feat/study-os-s1-academic-home-20261113`. Draft PR: https://github.com/Cheetos9250/study-os/pull/44.

## Completed this round

- Inspected repository, remote branches, six open PRs (#1, #39, #41–44), current main and PR #44 branch. Root project Markdown files were absent; prior audits under `docs/` and latest project handoff were read.
- Continued existing PR #44 instead of duplicating PR #43 or merging unrelated exporter/language work.
- Connected conservative academic progress parser to homepage, with explicit reads of six existing keys and no writes/requests. Missing/corrupt/blocked data has distinct UI states. Strengthened stored answer and SRS-record shape validation.
- Added simulated DOM tests for exact key allowlist, no automatic reads, no mutation, isolated failures, refresh and unknown versus zero.
- Added cross-source quiz overlap diagnostic and conflict tests. Current snapshots: acc 42 bundled/197 exported, eco 60/25, math 34/0; zero exact normalized question overlaps. Semantic overlap remains unverified.
- Added isolated Chromium/WebKit CI QA across four viewport sizes, light/dark themes, five legacy course interfaces and JavaScript-disabled home navigation.
- Created project architecture/progress/next-action documentation.

## Offline / mock test evidence

- Baseline before edits: Node 264/264 passed.
- After dashboard and audit changes: Node 271/271 passed via `node --test tests/*.test.cjs vocabloom/tests/*.test.cjs experiments/study-sync-cas/*.test.mjs experiments/prod-progress-cas/*.test.mjs`.
- Academic suite: 32/32 passed, including simulated DOM (not a browser).
- Python exporter: 3/3 passed via `python3 -m unittest discover -s vocabloom/tests -p 'test_*.py'`.
- Browser script syntax checked. Browser results must be recorded separately after exact-head CI finishes.

## Live read-only evidence

- PR #44 baseline SHA `cb92e246b87b18e48f19b0891da0d3bca0c10cfd`: CI run 43359403237 success.
- Production Pages root: HTTP 200, 2085 response bytes. This does not validate the unmerged dashboard.
- Scheduled Notion sync run 43358198111: completed/success, schedule event, created 2026-11-13T03:19:35Z, SHA `79cd71d8cba833e374a686c7add1710715170733`. This is the latest returned run, not proof of a precise 15-minute delivery guarantee.
- Notion fresh read-only aggregates: cards Accounting Draft 13, English Draft 1/Verified 583; quizzes Accounting Draft 427/Verified 197, Economics Draft 3/Verified 25. No Notion writes.
- Worker root and scheduler root returned HTTP 403. Internal functionality, credentials, bindings, Cron execution and KV contents remain unverified. Pages REST endpoint returned 404 without authenticated admin access.

## Blocked / limitations

- Local Playwright bundled Chromium/WebKit executables absent. Installed Chromium fails to launch because process singleton socket creation is denied (`Operation not permitted`). Connected cloud browser cannot reach local preview (`ERR_CONNECTION_REFUSED`). CI browser QA is the isolated fallback; physical iPad Safari remains a manual release gate.
- No access established to Cloudflare administrative deployment/KV/Cron evidence. No cloud progress writes attempted.
- Accurate coverage/quiz accuracy require stable mappings across bundled and external records. Counts are not mastery or percentages.
- Editable course management remains pending. The device-local planner candidate is implemented; see continuation evidence below. Current course management is navigation to existing courses.
- PR #1 remains old/nonmergeable; #39 exporter fail-closed and #41 language changes remain separate drafts. #42/#43 overlap earlier audit/home work; no PR closed automatically.

## Commits and PRs

- `fd8f33e`: dashboard, shared browser parser, source-overlap checks and isolated browser QA; existing draft PR #44.
- Subsequent docs/QA commits and exact-head CI results are appended below.

## Next action

Browser QA at code commit c1392bd passed; proceed with isolated study planning and course metadata contracts in NEXT_STEPS.md. No release approval is inferred.

## Browser QA correction

- First isolated CI run 43360698530 at remote commit `e09dbbbb44181db1ee053b908c848c38788a0321`: static contracts passed; browser job failed waiting for the intentionally hidden summary tab in the English legacy page. This was an incorrect test expectation: English/Chinese legacy decks have no summaries/quizzes. No production/course bug was inferred.
- Corrected QA to exercise academic summary/practice tabs while asserting that language-only legacy tabs remain hidden, and verify card flip on all five subjects. Rerun passed at c1392bd (evidence below).
- Remote changes are published through authenticated GitHub API because local git push lacks credentials. Local checkpoint commits `fd8f33e`/`32492f5` were combined into remote commit `e09dbbb`; they are not remote PR SHAs.
- Live `/cards`, `/quiz` and scheduler probes returned 403 with Cloudflare `error code: 1010`; no application health or Cron success is inferred.
- Cross-source report now preserves original JSON row indices even when subject rows are interleaved.

## Final verified code checkpoint

- Remote code SHA `c1392bdae4ead7ed9449f9e3fb3969f202d03d88`; CI run https://github.com/Cheetos9250/study-os/actions/runs/43361053043 completed **success** (static-contract and browser-qa both success).
- Browser log: `Passed 26 browser scenarios plus JavaScript-disabled checks`. Scope: Chromium and WebKit; home at 390×844, 820×1180, 1180×820, 1440×900 in light/dark themes; academic summary/practice, all five legacy card flips; synthetic answers/storage, external APIs blocked. This is neither live progress sync nor physical iPad Safari.
- Artifact `study-os-browser-qa`, ID `14008860543`, SHA256 `7d46d928ead5981bd143a7dd477b5d3225dfec83c3a83da5e0eaae3d292ed632`: screenshots and machine-readable results. Chromium 820 light and 390 dark screenshots visually inspected; no clipping/overlap observed. WebKit 820 light and 390 dark screenshots also visually inspected with no clipping/overlap observed; extracted results.json contains 26 scenarios.
- Final local full Node regression repeated after audit-index fix: **271/271 passed**. No legacy course source, VocaBloom source/data, production API config, exporter or scheduled sync workflow changed (diff checked against main).
- Subsequent documentation-only commit records this evidence. Use the PR Checks tab for its own exact-head CI status; test evidence above is tied to the named code SHA, not inferred for production.

## Planner continuation — 2026-11-13 (unreleased)

Completed implementation:
- Add and edit academic study plans by subject/date/topic/planned minutes; mark complete/undo only through explicit user action. Default date uses Asia/Bangkok day boundaries.
- Store plans in isolated IndexedDB schema; compare revisions atomically for same-browser tabs. No localStorage/score/secret/cloud accesses by planner modules.
- Preserve drafts on failed/stale edits and distinguish unavailable/corrupt storage. No reset/delete/migration fallback.
- Export planner-only JSON; import adds missing IDs, skips identical records, rejects conflicting/unsupported records and rolls back the entire import transaction.
- Extend browser QA for persistence after reload, date filtering, completion/editing, concurrent add/edit, stale drafts, safe text rendering, backup/restore, idempotency, atomic rollback, blocked/corrupt storage and operations in an already-loaded offline page.

Verification evidence:
- First planner code commit `3130748450d5c552a1a7f947eff2b3f3695c0a7f`; local Node 280/280 and Python exporter 3/3 passed before backup import additions.
- CI run 43363512916: static contracts passed; browser failed because clearing the view date left stale summary text. The change listener now renders the explicit select-date state; regression remains in the browser suite.
- Academic local suite after import additions: 42/42 passed (including 10 planner model tests). Planner code checkpoint and browser evidence are below.

Remaining: editable course metadata, real iPad Safari, browser storage eviction/restore rehearsal, notification scheduling and cross-device plan sync. Production release still requires explicit approval. No Merge, Deploy, Notion/KV/Worker/config changes in this round.

## Verified planner checkpoint

- Remote code SHA `18dd8436cfb5d0fc8bf9f7e16b920924c9c08f32`; [CI run 43364009951](https://github.com/Cheetos9250/study-os/actions/runs/43364009951) **success**: static-contract and browser-qa both passed.
- Full local Node regression after import/date fix: **281/281 passed**. Python exporter remained unchanged; its 3/3 tests passed this round before the import-only extension.
- Browser log: `Passed 28 browser scenarios plus JavaScript-disabled checks`. This includes the existing 26 scenarios plus one full planner flow per Chromium/WebKit engine, each covering persistence, user completion/editing, Bangkok date handling, empty-date UI, concurrent tabs, stale draft preservation, text rendering, planner-only download/import, repeated import, conflict rollback, unsupported/corrupt/denied storage, and an already-loaded offline page. Calendar midnight validation is also covered by Node tests.
- Fresh-profile UI restore imported all 4 exported synthetic records; repeating the import added 0/skipped 4. A conflicting import with an additional new ID aborted without adding that ID or replacing the changed record. Future-version file was rejected. No live data was used.
- Artifact ID `14009228239`, SHA256 `ff7b4747c8dba1fff13b5f5837954050521be626cfdf0a743524250ce226512c`: 20 screenshots plus results.json. JSON confirmed 28 scenarios and passed planner flows for both engines. Chromium mobile 390 and WebKit tablet 820 planner screenshots visually inspected; no clipping/overlap observed.
- Remote files compared with local working files after fetch. Legacy course files, VocaBloom, `data/config.json`, exporter and sync workflow remain unchanged against main.
- Subsequent documentation-only commit records this checkpoint. Its exact-head CI is checked separately; no additional implementation change is inferred from documentation.

Next action: editable academic course metadata while preserving stable subject IDs and legacy storage; then upcoming/overdue plan discovery. Physical iPad Safari, OS/browser-triggered storage eviction and cloud synchronization remain unverified. No production release authorized or performed.

## Plan discovery continuation — 2026-11-13

- Implemented pure, read-only `lib/study-os-plan-discovery.cjs` for overdue, today, upcoming (default next 7 days), and completed planner sessions. Date comparisons use caller-provided Bangkok calendar date; no auto-completion, storage/network writes, or inference of actual study time.
- Added `tests/study-os-plan-discovery.test.cjs` covering classification, horizon boundaries, malformed data, and nonmutation. Added both files to GitHub Actions workflow path filters.
- Code checkpoint `b66f187555f46561a96174d815e293d44ab32994`: GitHub Actions run [43367779307](https://github.com/Cheetos9250/study-os/actions/runs/43367779307) completed **success**. This is CI evidence for that code commit, not a physical iPad test.
- Documentation contract: `docs/study-os-plan-discovery-contract-2026-11-13.md` at `b0eb7642b4f894a47a78f45c31805c8a8649118a`.
- **Not yet integrated into homepage planner UI.** Existing planner, backup/import and browser tests remain unchanged in this checkpoint. No production Merge/Deploy/Notion/Worker/KV changes.
- Next: integrate discovery into homepage planner with explicit action only, retain IndexedDB revision safety, extend Chromium/WebKit QA, and verify exact-head CI. Physical iPad Safari remains unverified.

## Plan discovery homepage integration — 2026-11-13

- Browser-compatible `lib/study-os-plan-discovery.js` added with a Node `.cjs` wrapper. `index.html` loads it before the existing planner UI.
- Existing planner UI now displays counts for overdue, today, next 7 days, and explicitly completed sessions from the **already loaded local planner records**. No new storage keys, network requests, automatic completion, migration or backend writes.
- Code commits `8d3e4eb`, `2baa73b`, `3c2ad8b`, `5fa42b8`, workflow update `dc836b0`. CI for this new integration must be checked separately; prior passing run 43367779307 covered the earlier pure helper only.
- UI has not been verified on a physical iPad. Do not treat this draft as production-ready until exact-head Chromium/WebKit tests and relevant screenshots are reviewed.

## CI regression fix — 2026-11-13

- Integration CI run [43368332244](https://github.com/Cheetos9250/study-os/actions/runs/43368332244) **failed**: static-contract 44/45 passed, browser-qa **success**. Static failure was the homepage script allowlist not yet including the new read-only `lib/study-os-plan-discovery.js`.
- Updated `tests/study-os-home.test.cjs` to expect the new script in its actual load order and assert that the discovery module contains no browser storage/network writes. Fix commit `eeaba6c8d5f1ba332d03ffef4152510ed5938ee8`.
- **Verification pending:** check exact-head CI for fix and do not infer success from prior browser job. No merge/deploy.

## Second CI correction — 2026-11-13

- Run [43368928342](https://github.com/Cheetos9250/study-os/actions/runs/43368928342): browser-qa **success**, static-contract **failure** because the newly added test itself contained an invalid regular expression (over-escaped `fetch\\s*\\(`). This was a test syntax error, not evidence of browser runtime failure.
- Corrected regex escaping in `tests/study-os-home.test.cjs`, commit `e38f3db014d3d4090b5bce0193f8bb1fac29741b`. New CI verification pending; do not report it as passed until observed.

## Autonomous continuation — 2026-11-13

- CI run [43369282612](https://github.com/Cheetos9250/study-os/actions/runs/43369282612) for regex fix commit `e38f3db` completed **success** (static-contract and browser-qa). This evidence applies to that code checkpoint only.
- Extended `scripts/study-os-planner-browser.cjs` to assert discovery counts in the existing Chromium/WebKit synthetic planner flows: empty planner, newly added today's plan, explicitly completed plan, and completed plan edited to tomorrow (must remain completed, **not** upcoming).
- Browser test commits `63e55de` and correction `598771a`. New browser CI result pending; no physical iPad test or live sync. PR #44 stays draft and no production actions were performed.
