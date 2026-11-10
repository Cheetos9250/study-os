# Notion → Actions → JSON → Pages audit

## Scope and evidence

Audited commit 7f02bcc90131c64e7fb36fd89d399698f5457834 and all five subject pages.
No live Notion requests, database mutations, status changes, or data regeneration
were performed. Checked-in content is unchanged. GitHub read via Git works, but
API requests are denied by the environment's proxy (CONNECT 403); actual Actions
runs, repository secret configuration, Pages source/build type and deployed
responses could not be verified. No deployment was triggered.

## Existing data contract

* `sync.yml` runs every 15 minutes (GitHub schedules may be delayed) or manually.
  It passes the existing Actions secret `NOTION_TOKEN` only to the sync step.
* `sync_notion.py` uses the standard library and Notion API version 2025-09-03.
  Quiz data source: `21fcc8d7-5e96-4061-a02f-d71fc5705812`; Flashcards:
  `7eb4091a-8830-43de-8185-cd26b65d5ce7`. It queries `Status` as a **select**
  equal to `Verified`, 100 rows per page. The live schema was not inspected;
  do not change this to a status filter without confirming the schema.
* Quiz requires Question, Correct, Chapter, Subject; cards require Front, Back,
  Chapter, Subject. Page IDs are normalized to Notion URLs. Duplicate page IDs
  are removed; cards additionally deduplicate Subject + Chapter + normalized Front.
  Files carry a Bangkok date and rows, not a precise sync timestamp.
* Existing shrink protection rejects a replacement below 80% of the previous
  file's row count. Each file uses temporary-write + replace, but the pair is not
  transactional on disk. An unsuccessful sync prevents the Actions commit step.
  This protects GitHub publication, not manual local sync execution.
* Current snapshot: 222 quiz rows (197 Accounting, 25 Economics), 358 card rows
  (all English Vocab). Absence of other subjects in JSON is not proof of lost
  content: pages also have built-in decks and embedded quizzes, retained here.
* Actions commits changed data, pushes using GITHUB_TOKEN, and explicitly asks
  Pages to rebuild. That API is appropriate for a branch-backed Pages site;
  confirm actual Pages configuration when API access is available. A token push
  alone must not be assumed to trigger another deployment workflow.

## Browser path and confirmed fixes

All five pages share the same loading logic (no bundled app or service worker).
On standalone Pages, JSON is fetched relative to the page with `cache:no-store`.
Subject-specific localStorage stores extra cards, extra quiz rows, ratings and SRS.
Only Verified rows whose Subject and Chapter match the current page are rendered;
quiz needs at least two answer options. Built-in content remains intact.

In a Claude host, the optional connector reads the configured views, filters
Subject, and lets the setters enforce Verified. It retries quiz reads three times.
The eight-page connector limit now fails rather than caching a partial result;
invalid/repeated cursors also fail. The Python cursor loop now fails on malformed
pagination instead of looping forever.

Confirmed defects fixed:

1. A failed/malformed quiz JSON response prevented valid cards from updating.
   Loads now validate independently and retain prior data on a failed source.
2. Invalid quiz cache JSON prevented embedded quiz fallback from loading.
   Cache parsing now has its own fallback; setters also reject foreign subjects.
3. English/Chinese hid practice whenever summaries were absent, making newly
   synchronized questions inaccessible. Only the absent summary is now hidden.
4. Pages rebuild API failures were silently swallowed by `|| true`. They now
   fail the step, making failed publication visible. Sync runs are serialized
   to prevent concurrent checkout/commit/push races.
5. Python now independently rejects non-Verified rows during conversion rather
   than labeling every returned row Verified. The API filter remains unchanged.

## Validation and Safari limits

`python3 -m unittest discover -s tests -v`: pagination/filter payload, invalid
cursors, Verified/required fields/identity deduplication, shrink guard and card
deduplication. These tests run before the workflow receives the Notion token.

`python3 tests/browser_pipeline.py`: Chromium at 1024×1366 with touch, all five
pages; subject/Verified filtering, independent card refresh after quiz HTTP 500,
quiz rendering and tap feedback, malformed cache fallback, denied storage writes,
and connector pagination failure. Tests use a temporary server and mocked
responses; they do not contact Notion or mutate checked-in JSON.

This is not an iPad Safari pass. WebKit launch was attempted, but its binary was
absent. Installing it to a writable path was denied by network policy at
`playwright.download.prss.microsoft.com` (403 Domain forbidden). With Playwright
WebKit installed, run `python3 tests/browser_pipeline.py --webkit`; real iPad
Safari still needs a device check. Storage access is guarded and denied writes
leave in-memory study available, but persistence cannot be guaranteed when Safari
evicts or denies storage. Offline reload is not guaranteed: there is no service
worker and cached data cannot substitute for an unavailable HTML page.

Before approving deployment, inspect the latest successful sync and Pages build,
verify Pages source, compare served JSON to the committed snapshot, and on an iPad
open all five subjects, reveal/rate cards, answer a quiz, reload and confirm saved
progress. Test both normal and restricted/private storage. No UI redesign or
Notion schema change is needed for the fixes in this PR.
