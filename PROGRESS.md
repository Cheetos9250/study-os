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
- Study planning and editable course management are pending; current course management is navigation to existing courses.
- PR #1 remains old/nonmergeable; #39 exporter fail-closed and #41 language changes remain separate drafts. #42/#43 overlap earlier audit/home work; no PR closed automatically.

## Commits and PRs

- `fd8f33e`: dashboard, shared browser parser, source-overlap checks and isolated browser QA; existing draft PR #44.
- Subsequent docs/QA commits and exact-head CI results are appended below.

## Next action

Browser QA at code commit c1392bd passed; proceed with isolated study planning and course metadata contracts in NEXT_STEPS.md. No release approval is inferred.

## Browser QA correction

- First isolated CI run 43360698530 at remote commit `e09dbbbb44181db1ee053b908c848c38788a0321`: static contracts passed; browser job failed waiting for the intentionally hidden summary tab in the English legacy page. This was an incorrect test expectation: English/Chinese legacy decks have no summaries/quizzes. No production/course bug was inferred.
- Corrected QA to exercise academic summary/practice tabs while asserting that language-only legacy tabs remain hidden, and verify card flip on all five subjects. Rerun pending.
- Remote changes are published through authenticated GitHub API because local git push lacks credentials. Local checkpoint commits `fd8f33e`/`32492f5` were combined into remote commit `e09dbbb`; they are not remote PR SHAs.
- Live `/cards`, `/quiz` and scheduler probes returned 403 with Cloudflare `error code: 1010`; no application health or Cron success is inferred.
- Cross-source report now preserves original JSON row indices even when subject rows are interleaved.

## Final verified code checkpoint

- Remote code SHA `c1392bdae4ead7ed9449f9e3fb3969f202d03d88`; CI run https://github.com/Cheetos9250/study-os/actions/runs/43361053043 completed **success** (static-contract and browser-qa both success).
- Browser log: `Passed 26 browser scenarios plus JavaScript-disabled checks`. Scope: Chromium and WebKit; home at 390×844, 820×1180, 1180×820, 1440×900 in light/dark themes; academic summary/practice, all five legacy card flips; synthetic answers/storage, external APIs blocked. This is neither live progress sync nor physical iPad Safari.
- Artifact `study-os-browser-qa`, ID `14008860543`, SHA256 `7d46d928ead5981bd143a7dd477b5d3225dfec83c3a83da5e0eaae3d292ed632`: screenshots and machine-readable results. Chromium 820 light and 390 dark screenshots visually inspected; no clipping/overlap observed. WebKit 820 light and 390 dark screenshots also visually inspected with no clipping/overlap observed; extracted results.json contains 26 scenarios.
- Final local full Node regression repeated after audit-index fix: **271/271 passed**. No legacy course source, VocaBloom source/data, production API config, exporter or scheduled sync workflow changed (diff checked against main).
- Subsequent documentation-only commit records this evidence. Use the PR Checks tab for its own exact-head CI status; test evidence above is tied to the named code SHA, not inferred for production.
