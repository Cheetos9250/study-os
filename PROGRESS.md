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

## Overdue/upcoming navigation — 2026-11-13

- CI run [43369517015](https://github.com/Cheetos9250/study-os/actions/runs/43369517015) **success** for discovery-count regression checkpoint `598771a`, including static-contract and browser-qa. This does not cover later navigation changes.
- Added explicit read-only planner buttons **ดูงานค้าง** (earliest overdue date) and **ดูแผนถัดไป** (nearest upcoming date within 7 days); selection only changes the viewed date, never completion or stored records. Commits `904527e` and `08f3a56`.
- Added Chromium/WebKit synthetic empty-group navigation assertions, commit `5f0f9b0`. Exact-head CI pending. Physical iPad Safari remains unverified. No merge, deployment or production data writes.

## Navigation browser regression — 2026-11-13

- Verified CI [43369814606](https://github.com/Cheetos9250/study-os/actions/runs/43369814606) **success** for empty overdue/upcoming navigation checkpoint `5f0f9b0` (static-contract and browser-qa).
- Added isolated synthetic Chromium/WebKit profile to test **non-empty** overdue/upcoming navigation, exact selected dates, visible titles, incomplete checkbox, and persistence after reload. Commit `3271476`; **exact-head CI pending**.
- Updated `AGENTS.md` handoff commit `dd11889`. No merge/deploy/live writes; physical iPad Safari remains unverified.

- Added Node discovery regressions for chronological overdue/upcoming order, exclusion of completed future plans, immutable groups and inclusive seven-day cutoff. Commit `12e2fd1`; CI pending.

- CI [43370021313](https://github.com/Cheetos9250/study-os/actions/runs/43370021313): **static-contract success, browser-qa failure** at non-empty navigation assertion (`plan-discovery` returned empty text). Added an explicit wait for asynchronous discovery rendering after each save, commit `208c135`; root cause not yet proven and new CI must be checked.

- CI 43370327132: static-contract **success**; browser-qa still in progress at last inspection. Added independent pure discovery tests for completed date edits and same-day vs upcoming partition, commit `2fb864f`; exact-head CI pending.

- CI [43370327132](https://github.com/Cheetos9250/study-os/actions/runs/43370327132) completed **failure**: static-contract passed; browser-qa again observed empty `innerText()` at navigation discovery assertion, despite successful `textContent` wait. Switched the synthetic assertion to `textContent()` to test DOM contents independently of visibility/CSS, commit `b0ef9a1`; verify exact-head CI. Root cause of empty `innerText()` is not yet confirmed.

- CI 43370697293 **failed browser-qa** (static-contract passed). Job log pinpointed `scripts/study-os-planner-browser.cjs:196`, the **post-reload** assertion, not the earlier initial render. The test clicked open then asserted before async IndexedDB reload completed. Added visible planner and discovery waits at this exact post-reload step in commit `37dcad4`; CI pending. This corrects prior tentative diagnosis.

- **Verified:** CI [43371040880](https://github.com/Cheetos9250/study-os/actions/runs/43371040880) completed **success**: both `static-contract` and `browser-qa` passed for fix `37dcad4`. This covers synthetic Chromium/WebKit non-empty overdue/upcoming navigation and post-reload persistence; not a physical iPad Safari test. Updated `AGENTS.md` handoff in `dfe7b96`. No merge, deploy or production writes.

## Multiple-date navigation and accessibility — 2026-11-13

- Expanded isolated synthetic Chromium/WebKit browser navigation fixture to two overdue and two upcoming dates (created in intentionally nonchronological order), asserting oldest overdue and nearest upcoming selection, no implicit completion and persistence after reload. Commit `d66fbd9`.
- Added accessible navigation group name and `aria-controls` / `aria-describedby` links from buttons to list/discovery, commit `2b9f5a0`; static HTML regression commit `64c0c33`. Exact-head CI pending. No production deployment or data changes.

## Course discovery — 2026-11-13

- CI [43371435910](https://github.com/Cheetos9250/study-os/actions/runs/43371435910) **success** for multi-date navigation and accessibility checkpoint (static-contract and browser-qa).
- Added nonpersistent accessible academic course search over the existing stable `acc/eco/math` course cards; searches English and Thai aliases, never touches localStorage/IndexedDB or live Notion. Commits `0dbbb22`, `2f45c73`, static regression `20c55d2`. New CI pending; physical iPad Safari unverified. This is filtering, **not** editable course metadata yet.

- CI 43371847878 static-contract **failed** because the strict homepage script inventory omitted new `lib/study-os-course-search.js`; corrected the expected list in commit `08f8717`. This was a test contract update, not a change to the legacy progress storage. Browser-qa was in progress at diagnosis; verify subsequent CI before claiming success.

- **Verified course-search baseline:** CI [43371919159](https://github.com/Cheetos9250/study-os/actions/runs/43371919159) **success** after strict homepage script inventory fix `08f8717` (static-contract and browser-qa). Added new synthetic Chromium/WebKit browser assertions for Thai/English search, no-match empty state and clearing query across four viewport sizes, commit `0bd4922`; new CI pending. No production writes.

## Course search keyboard usability and metadata design — 2026-11-13

- Verified [CI 43373533213](https://github.com/Cheetos9250/study-os/actions/runs/43373533213) **success** (static-contract + browser-qa) for multilingual course-search regression `0bd4922`.
- Added Escape-to-clear course search (`d582ecf`) and Chromium/WebKit keyboard regression (`a75d89b`); new CI pending.
- Added design-only `COURSE_METADATA_DESIGN.md` (`dc28c05`) defining immutable subject IDs/routes, isolated browser-local presentation overrides, atomic backups, test gates and no production mutation. Editable metadata is not yet implemented.

## Metadata model foundation — 2026-11-13

- CI [43374096872](https://github.com/Cheetos9250/study-os/actions/runs/43374096872) **success**: static-contract and browser-qa passed Escape-to-clear course search tests.
- Added pure course presentation metadata schema/validator (`e169998`) and Node tests (`9b48fb4`) for immutable subject identities, order, text validation and corrupt input. Updated `COURSE_METADATA_DESIGN.md` (`63fd982`). New [CI 43377242274](https://github.com/Cheetos9250/study-os/actions/runs/43377242274) queued at inspection. No UI persistence, production writes, merge or deploy.

## Isolated metadata storage prototype — 2026-11-13

- Verified [CI 43377242274](https://github.com/Cheetos9250/study-os/actions/runs/43377242274) **success** for pure metadata model/tests (static-contract and browser-qa).
- Added opt-in CommonJS IndexedDB metadata store (`e4034b3`) with revision-checked transactions and explicit read/save/reset/import/export; separate database from planner/progress. Added static/Node isolation tests (`46b8cd1`) and design notes (`72c2713`). No homepage integration or production writes; browser concurrency/rollback tests pending.

## Metadata store browser verification — 2026-11-13

- Added browser-loadable isolated store wrapper (`bf3f525`, `7f549bc`) and dedicated synthetic Chromium/WebKit test (`b9a0bc3`) covering two-tab stale revision rejection, invalid import rollback, export, reset and valid restore. Integrated test in CI browser harness (`46ea370`). CI pending; these are isolated browser profiles, **not** physical iPad Safari or production data. No homepage feature activation.

## Opt-in course metadata editor draft — 2026-11-13

- Verified [CI 43378426163](https://github.com/Cheetos9250/study-os/actions/runs/43378426163) **success** for synthetic Chromium/WebKit metadata CAS/rollback tests.
- Added **unlinked** `course-metadata-draft.html` (`8a549c6`) and explicit Save/Reset/Import/Export editor (`fec0760`), canonical browser-compatible store `lib/study-os-course-metadata-store.js` (`eee561a`), and browser reload/persistence QA (`ae14471`). Draft opens a separate local IndexedDB database only after user clicks Open. Does not alter homepage, legacy course IDs, planner data, Notion or production. New CI pending; physical iPad Safari unverified.

## Draft editor conflict and reset QA — 2026-11-13

- CI [43378984252](https://github.com/Cheetos9250/study-os/actions/runs/43378984252): static-contract **success**, browser-qa still in progress at inspection; do not claim complete success yet.
- Expanded synthetic Chromium/WebKit editor QA (`9cf2ed6`) for reset cancel/confirm, stale editor rejection after another tab saves, unsaved field retention and explicit refresh recovery. New CI pending. No homepage exposure, merge, deploy or production writes.


## Course metadata corruption and backup QA — 2026-11-13 (draft, unreleased)

- Fixed malformed IndexedDB record handling on draft PR #44: a present null/invalid revision/invalid payload no longer resembles an empty settings record. Read and save fail closed; the original record is preserved for diagnosis. Browser store commit f3111b5.
- Synthetic Chromium/WebKit corrupt-record assertions added at 485c11a; CI 43379924786 completed success (static-contract and browser-qa). Previous 43379887146 also passed.
- Added browser JSON download/invalid import/explicit restore and unavailable-IndexedDB editor QA at 375b42b. Synced CommonJS/browser store at 7a3e629, Node parity guard at e41cd69. The final exact-head CI for those additions must be checked.
- No production release, homepage activation, merge, external API calls, real data change or cloud migration. Physical iPad Safari and real storage eviction/restore remain unverified.

## Verified metadata accessibility/recovery checkpoint — 2026-11-13

- No-JavaScript fallback is implemented for the unlinked draft editor: warning is visible, inert Open button hidden and editor stays closed. Synthetic Chromium/WebKit browser regression passed CI 43380434836 at 44bb56c.
- Corrupt saved metadata now shows a Thai warning without automatic overwrite/reset. Synthetic browser QA confirms invalid-record rejection, closed editor and explicit retry. CI 43380640662 at 9fdb772 completed **success** for static-contract and browser-qa.
- Previous course metadata JSON download, invalid-import, explicit restore and IndexedDB-denied UI tests passed CI 43380131840 and 43380014201.
- Root PROJECT.md, AGENTS.md, ARCHITECTURE.md and COURSE_METADATA_DESIGN.md were refreshed to distinguish this unlinked draft from released functionality.
- Not validated: physical iPad Safari, browser/OS eviction, live Cloudflare Worker/KV sync or real user backup/restore. PR #44 stays Draft; main and production remain unchanged.


## Metadata import concurrency and mobile QA — 2026-11-13

- Added synthetic end-to-end regression preventing a stale JSON backup from overwriting newer course metadata saved in a second tab. The UI reports a conflict and explicit refresh displays the newer value. Commit c95af794; CI [43381126032](https://github.com/Cheetos9250/study-os/actions/runs/43381126032) completed **success** (static-contract/browser-qa).
- Rejected oversized metadata import (>65536 bytes) with the existing size limit before any write. Regression commit f4fc286; CI [43381245830](https://github.com/Cheetos9250/study-os/actions/runs/43381245830) **success**.
- Tested small-screen 390x844 dark-mode draft editor opening, no horizontal overflow and keyboard focus on course name. Commit 5948042; CI [43381271777](https://github.com/Cheetos9250/study-os/actions/runs/43381271777) **success**, both jobs. Browser tests use synthetic profiles; no physical device or live sync was tested.
- These are safety/QA additions to unlinked draft PR #44. No merge, production deploy, cloud data writes, automatic import or endpoint changes.


## Metadata backup portability, unsaved-draft UX and integer safety — 2026-11-13

- The isolated Chromium/WebKit browser suite now exports a synthetic course-metadata JSON backup, imports it into a **fresh browser context**, reloads and checks the restored Thai name and the unchanged synthetic legacy progress/sync-key values. Commit b25c0eb, [CI 43381951146](https://github.com/Cheetos9250/study-os/actions/runs/43381951146) **success**. This simulates a fresh profile, **not** actual iPad/OS eviction.
- Course editor blocks Export when there is unsaved form text, and requires an extra explicit confirmation before Import can discard unsaved text. Editor change 7c50bab; [CI 43382072820](https://github.com/Cheetos9250/study-os/actions/runs/43382072820) **success**. The initial browser regression at 3740d1f failed because two dialog listeners overlapped (test harness race); test fix 1cd5c9 awaited the dismissed dialog and [CI 43382355274](https://github.com/Cheetos9250/study-os/actions/runs/43382355274) **success**.
- Editor now disables controls while saving and rejects a second rapid submit, preventing self-inflicted stale-revision alerts. Change cd416fc, browser test c79d273; [CI 43382728589](https://github.com/Cheetos9250/study-os/actions/runs/43382728589) **success**. Intermediate test 2e91a77 failed due to an over-escaped revision-matching expression, corrected without changing the application.
- Both browser and CommonJS metadata-store entrypoints refuse to increment a valid saturated revision beyond Number.MAX_SAFE_INTEGER. Existing bytes are retained/readable. Store commits c38a0fe and c74f8be; synthetic browser regression f0aa499, [CI 43383022547](https://github.com/Cheetos9250/study-os/actions/runs/43383022547) **success**.
- Independent PR changed-file inspection found 47 changed paths, none in legacy subject HTML, data/config, VocaBloom, Notion synchronization, or CAS experiment paths. This is a **source diff observation**, not a live environment audit.
- Prepared manual release gate at docs/study-os-course-metadata-ipad-qa-2026-11-13.md. No physical iPad Safari tests, real storage eviction, live data operations or production release were performed. PR #44 remains draft.


## Read-only academic planner group list — 2026-11-13

- Added collapsed, read-only overdue/next-seven-day lists in draft `index.html` and `lib/study-os-planner-ui.js`; items are sorted by `discoverPlans`, rendered as textContent, and select the view date without modifying session completion or storage. Feature commits 6b5227b and c235379.
- Chronological browsing, safe text, focus and no-implicit-completion static + synthetic Chromium/WebKit browser QA passed [CI 43383830130](https://github.com/Cheetos9250/study-os/actions/runs/43383830130) at code commit 79885d0.
- Expanded 390px mobile viewport checks passed [CI 43384050769](https://github.com/Cheetos9250/study-os/actions/runs/43384050769) at e7369f4.
- Completion/edit/reload list regressions (3beba0e/38a854d) passed [CI 43384365182](https://github.com/Cheetos9250/study-os/actions/runs/43384365182).
- Subsequent accessibility link relationship and cross-tab refresh QA changes 6741afd/c0154f0/0654f37 require independent exact-head CI confirmation; older successes do not prove those newer commits.
- These are isolated browser tests, not physical iPad Safari. The course-metadata editor stays unlinked. PR #44 is draft; no merge, deployment, production KV/Notion/Worker/CAS writes or migration were made.


## Planner discovery list and accessibility continuation — 2026-11-13

- Expanded the existing homepage planner's read-only discovery from counts and earliest/nearest date navigation to a collapsed chronological list of **overdue** and **next seven-day upcoming** sessions. Buttons select a session date, update the ordinary planner list and move focus to that list. No implicit done status, schema migration, cloud write or new permissions. Code commits 6b5227b (HTML) and c235379 (UI).
- Added Chromium/WebKit browser assertions for out-of-order dates, chronological group order, date selection without completion and focus behavior, plus Node static contracts; commits 2fc76f2 and 79885d0, [CI 43383837816](https://github.com/Cheetos9250/study-os/actions/runs/43383837816) **success**.
- Added mobile expanded-view wrap/overflow assertions (e7369f4), [CI 43384056492](https://github.com/Cheetos9250/study-os/actions/runs/43384056492) **success**.
- Synthetic browser QA extended to explicit checkbox completion/undo and topic rename, verifying proper discovery counts, removal/reappearance and persistence across reload (38a854d), [CI 43384365182](https://github.com/Cheetos9250/study-os/actions/runs/43384365182) **success**. Read-only buttons now explicitly identify the controlled plan list; c0154f0 passed [CI 43384557733](https://github.com/Cheetos9250/study-os/actions/runs/43384557733).
- An additional test checks explicit "อัปเดตรายการ" after another local tab marks a session complete and later incomplete (0654f3737). Check [CI 43384672610](https://github.com/Cheetos9250/study-os/actions/runs/43384672610) before marking this newest test passed.
- Evidence is static and isolated Chromium/WebKit with synthetic records, **not** real iPad Safari, external service or production data. Draft PR #44 remains unmerged and unlinked metadata editor remains unreleased.


## Planner draft backup safety — 2026-11-13

- Study Planner now tracks unsaved local form input/change events and exposes a visible explicit "ล้างแบบฟอร์ม" action for a new unsaved plan; successful save/cancel clears the draft marker. Existing edit mode continues to use "ยกเลิกการแก้ไข".
- A planner JSON Export from the academic homepage refuses to silently omit unsaved new or edited form values, prompting the learner to save or clear their form. Only persisted planner sessions can be backed up; no backup schema or IndexedDB schema changed.
- Implementation `9fa86fd78b5c05463b7d1081f911afab9a5d24b2`; synthetic Chromium/WebKit new-plan, editing-form and static regressions at `bf5bafebe`, `0138fea17`, and `5080f8b3f`.
- [CI 43385562926](https://github.com/Cheetos9250/study-os/actions/runs/43385562926) and [43385558513](https://github.com/Cheetos9250/study-os/actions/runs/43385558513) both completed **success** at exact implementation/test head `5080f8b3f` (static-contract and browser-qa). Tests use isolated synthetic profiles and block external requests.
- The previous read-only overdue/upcoming list cross-tab refresh regression at `0654f3737` passed [CI 43384672610](https://github.com/Cheetos9250/study-os/actions/runs/43384672610); no automatic completion was introduced.
- Study OS remains in **draft PR #44 only**. No merge, production deployment, Notion/Worker/KV writes, scheduler changes, schema migration or real data restore. Physical iPad Safari, VoiceOver and browser/OS storage eviction remain unverified.


## Safe planner JSON import and WebKit form event regression — 2026-11-13

- Existing draft-only planner `lib/study-os-planner-ui.js` now checks the local versioned backup with `validateBackup` before requesting an explicit import confirmation. Cancel makes no writes; invalid/future-version/oversized files stop before confirmation. Re-selecting the same backup file works after cancel or error. An unsaved add/edit form blocks import and export until it is saved or explicitly cleared.
- The import UI still uses the same `client.importBackup` atomic add/skip/conflict transaction and `study-os-planner-v1` schema; no overwrite, reset, cloud service or data migration was introduced. Browser regression verifies cancel/no writes, fresh synthetic profile restore, idempotent same-file import, unsaved-draft protection and whole-file rollback on conflicts.
- Initial CI on code `8aec38e` failed browser-qa at repeated same-file import. Instrumented synthetic WebKit click tracing showed pointerdown/mousedown/mouseup on the clear-form button **without a click**. Root cause: `markDraft` changed button text during field blur/change, disrupting click synthesis in WebKit. Fix `18ffac5` avoids redundant text/hidden attribute changes. [CI 43388836576](https://github.com/Cheetos9250/study-os/actions/runs/43388836576) and [43388844050](https://github.com/Cheetos9250/study-os/actions/runs/43388844050) both **success** for static Node and synthetic Chromium/WebKit browser QA.
- Added `beforeunload` guard for unsaved planner form drafts; clean/saved/cleared forms do not request a warning. Synthetic browser dispatch and static contracts passed [CI 43389207595](https://github.com/Cheetos9250/study-os/actions/runs/43389207595) and [43389199821](https://github.com/Cheetos9250/study-os/actions/runs/43389199821), both **success** at `d8e3d54`. Actual Safari system warning wording/behavior is platform-controlled and not tested on physical iPad.
- PR #44 remains unmerged Draft. No production deploy, existing lesson/source changes, Notion/Cloudflare Worker/KV mutation, scheduler modification or live progress CAS enablement. A real iPad Safari/VoiceOver test and user-owned backup/restore rehearsal are still release gates.

## Basic course editor usability — 2026-11-13

- Added draft homepage navigation to opt-in course editor (`f66abba`), and safe saved metadata preview linking to unchanged `acc.html`, `eco.html`, `math.html` (`0973a45`, `7d325a6`). Custom labels/order only affect the editor preview; homepage course cards and legacy progress remain unchanged. Browser assertion added (`5192b45`), CI pending. No merge or production deployment.


## Basic homepage course customization — 2026-11-13

- Added deliberate read-only display controls to draft `index.html` (`eb179da`, `fa866b6`): learner can apply saved names/descriptions/order and return to initial presentation without deleting saved settings.
- Added `lib/study-os-course-metadata-home.js` (`a6c1d75`) which validates metadata, updates text via `textContent`, keeps original `acc/eco/math` links/identifiers, refreshes course search, closes IndexedDB connections and fails without modifying cards if storage is denied.
- Added draft editor return link (`c339015`), static source guards (`a77df5b`) and synthetic Chromium/WebKit browser regression for opt-in apply, search, order, no progress changes, reset display and failed storage (`9817c91`). CI not yet verified at time of this note. Nothing merged or deployed; no Notion/Worker/KV/scheduler changes.

- Extended metadata dashboard fail-closed regression (`94b44fa`) to reject corrupt IndexedDB records without replacing default cards, and verify no-JavaScript mode hides the opt-in control. These tests remain pending GitHub Actions verification; browser/device completion must not be asserted before CI finishes.

- Added responsive text wrapping for 80-character editable course names (`a1d98ef`) and a browser regression (`89de60b`) for deliberate refresh after a second revision plus 390px viewport overflow safety. CI evidence for these exact code commits still pending; JavaScript syntax was checked for the earlier home/static/browser files but that alone does not prove browser behavior.

- Additional direct in-memory smoke check of the committed home script with mock DOM and mocked storage: **passed** applying saved labels/order, dispatching search refresh, closing the storage connection, and restoring original display. This is **mock only**, not a Chromium/WebKit CI success. GitHub commit workflow lookup for code SHA `89de60b` returned no PR-triggered runs at final inspection; exact-head CI remains unverified.


## Opt-in course labels: runtime QA and CI trigger correction — 2026-11-13

- Confirmed current Draft PR #44 head and safety restrictions; `main` remains separate and no production releases or migrations were made.
- Updated academic CI workflow `push` and `pull_request` path filters (`6bf155c`) to include course-metadata model/store/editor/home code, draft HTML, unit tests and synthetic browser harness. This closes a missing-trigger gap for these new source files.
- Added `tests/study-os-course-metadata-home.test.cjs` (`48ffc31`) to verify the dashboard does not read metadata before the user clicks, loads validated names/order without changing stable subject URLs, restores the original display only, and rejects corrupt or denied storage without modifying cards.
- Executed all three new cases in a JavaScript V8 mock-context test shim using the committed source: **3/3 passed (mock only)**. This is not a Node CI run, Chromium/WebKit browser result, physical Safari QA or live backend check.
- Updated `PROJECT.md` (`03b1ee0`) to remove obsolete "editor unlinked" language. At last inspection the GitHub connector's PR-triggered commit-run lookup returned **no CI runs** for exact new commits; do not report GitHub CI success until jobs can be independently inspected.
- No merge, deployment, live Notion/Worker/KV, GitHub production content, scheduler or cross-device CAS changes.
