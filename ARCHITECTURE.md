# Study OS architecture

## Existing production path (unchanged)

Notion Verified content → `.github/workflows/sync.yml` → `scripts/sync_notion.py` → `data/cards.json` and `data/quiz.json` → GitHub Pages/course pages. The scheduled workflow has concurrency control. Cloudflare `study-sync-scheduler` is separate; source/CI does not prove its deployed Cron configuration.

`data/config.json` retains only `api=https://study-api.kasidit09022550.workers.dev`. The content/review API and legacy progress KV still share that Worker. Production CAS is not enabled by this work. The experimental CAS implementations remain isolated candidates.

## Candidate dashboard

`index.html` → deferred `lib/study-os-legacy-progress-reader.js` → `lib/study-os-dashboard.js`.

The parser is one shared implementation, exported to browser `StudyOSProgress` or Node through its `.cjs` compatibility wrapper. On an explicit button click, the dashboard reads only:

| Course | Answers | SRS |
|---|---|---|
| acc | study-acc | acc-flashcards-v1-srs |
| eco | study-eco | econ-flashcards-v1-srs |
| math | study-math | math-flashcards-v1-srs |

No storage enumeration, key/secret access, network request or storage write occurs in this panel. Unknown data remains unknown. Each subject fails independently for malformed or blocked storage. Rendering uses textContent. Navigation works with JavaScript disabled. The pure analytics module is not connected to the panel because identity mappings are not verified.

## Validation

`tests/*.test.cjs`: source, parser, analytics, simulated DOM, content audit and overlap contracts. `scripts/study-os-browser-check.cjs`: localhost server, fresh synthetic profiles, blocked external routes, Chromium/WebKit, mobile/tablet/desktop viewports, both color schemes, course tab/quiz/card checks and no-JavaScript navigation. No production API/storage writes. WebKit automation is not physical iPad Safari verification.

`study-os-source-overlap.cjs` compares normalized question text within academic subjects across bundled and exported snapshots. Different chapters do not hide exact text matches. Text differences in correct answers are flagged for review, not automatically resolved. This is not semantic deduplication or proof of content correctness.
