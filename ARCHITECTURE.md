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

## Device-local study planner (unreleased)

`lib/study-os-planner.js` supplies validation/model logic and an IndexedDB adapter; `lib/study-os-planner-ui.js` wires the academic home UI. The database `study-os-planner-v1` (version 1), store `sessions`, is opened only after an explicit click. No existing score/SRS/localStorage data is read, migrated, reset or written by the planner.

Each record has schemaVersion, immutable id/createdAt, subject (`acc/eco/math`), title, date (calendar YYYY-MM-DD), planned minutes, explicit Boolean done, revision and updatedAt. Bangkok midnight determines the default date. Only a user's checkbox action marks done; completed planned minutes are not measured study duration.

Readwrite transactions serialize writes across same-browser tabs. Edits compare expected revision inside the transaction; a stale form is rejected, preserving its typed draft. Concurrent additions have independent IDs. This is browser-local concurrency protection, not Cloudflare CAS or cross-device synchronization.

Backup export includes only planner records. Import validates the entire file before mutation, accepts missing IDs, skips identical IDs, and aborts the entire transaction for changed/unsupported records. No blind overwrite, database reset, deletion or cloud call is available. A malformed existing record prevents normal loading and is preserved for diagnosis. Browser storage can still be cleared/evicted by the browser; downloadable backups are user-managed. Physical iPad Safari and browser-eviction recovery remain unverified.

Tests: model/validation in `tests/study-os-planner.test.cjs`; actual Chromium/WebKit persistence, concurrent tabs, stale forms, export/import/idempotency/rollback, malformed/blocked storage and already-loaded offline operation in `scripts/study-os-planner-browser.cjs`. Existing legacy course checks remain enabled.

## Course display metadata editor (unlinked, unreleased)

The course metadata draft is a separate opt-in HTML page at course-metadata-draft.html; it is **not linked by the homepage**. The canonical browser-compatible module is lib/study-os-course-metadata-store.js, with matching CommonJS entrypoint for offline tests. Metadata is validated by lib/study-os-course-metadata.js and written only after explicit user action to IndexedDB study-os-course-metadata-v1 / settings / academic. No course page, planner record, legacy progress key, Cloudflare API or Notion data is edited by this feature.

The schema fixes subject IDs acc/eco/math, permits only validated display name, description and ordering, and retains the original published routes. The store uses readwrite transactions and expected-revision checks; stale tabs cannot silently overwrite newer metadata. JSON download/import is course-metadata-only and validates before a write. Reset and import require explicit confirmation. Invalid present records, including null, zero revision and bad payload, fail closed rather than falling back to empty defaults. The UI does not automatically delete, reset or migrate corrupt data.

Tests: tests/study-os-course-metadata.test.cjs and tests/study-os-course-metadata-store.test.cjs cover schema/isolation/entrypoint parity. scripts/study-os-course-metadata-browser.cjs runs with isolated Chromium and WebKit profiles for actual IndexedDB CAS, malformed records, conflict/reload, denied storage, JSON download/restore and disabled JavaScript fallback. Browser profiles use synthetic data and block external requests. This is not physical iPad Safari or real-device storage-eviction verification.


## Planner discovery list (draft-only)

The existing local study planner calls `StudyOSPlanDiscovery.discoverPlans(sessions, bangkokDate())` after loading validated IndexedDB sessions; the pure classifier does not use storage, wall clock, network or secrets. The homepage summarizes overdue/today/7-day upcoming/completed counts. A collapsed, chronologically ordered, read-only list provides buttons for overdue/upcoming sessions. Selecting a button only changes the selected date, re-renders the existing plan list and focuses its accessible target; it does not complete a plan or persist a change. Content uses `textContent`, and stable academic IDs determine course labels. Underlying completion is only changed by the existing explicit checkbox action with revision-safe IndexedDB persistence.

Automated Chromium/WebKit synthetic QA validates empty/nonempty groups, multiple dates, mobile overflow, list navigation, completion/edit refresh and cross-tab readback. This is not evidence of a physical iPad Safari session or live backend sync. The homepage feature remains confined to draft PR #44.


## Planner form draft/export safeguards (unreleased)

The academic planner UI tracks unsaved form input/change events only in memory, not by adding a storage key. Export continues to serialize **persisted** records from the existing isolated planner IndexedDB store. If the current add/edit form has uncommitted changes, Export displays a Thai warning rather than silently omitting the draft from the downloaded JSON. The learner can explicitly save or clear the draft. Existing versioned backup/import, stable subject identities, transaction revisions and local-only scope are unchanged. Synthetic browser tests verify the warning for both new plans and edits; no production/cloud sync or physical iPad validation is implied.


## Planner import consent and unsaved-draft browser behavior (draft-only)

`lib/study-os-planner-ui.js` handles JSON file selection entirely in the browser: it clears the file input for repeat selection, checks the 1 MiB limit, parses JSON, prevalidates the versioned schema through `StudyOSPlanner.validateBackup`, blocks when a local study form draft is unsaved, and requests explicit user consent before calling `client.importBackup`. Cancellation and failed prevalidation cause no writes. The existing `study-os-planner-v1` IndexedDB import transaction remains atomic for add/skip/conflict. Neither the schema nor production API settings change.

An input blur may emit a form `change` event after mouse/pointer press but before click. The planner's `markDraft` handler therefore updates the cancel button label only if its value actually changed, avoiding a reproduced WebKit click suppression. A `beforeunload` guard requests confirmation only for uncommitted local form edits. Native iPad Safari behavior and storage eviction/recovery still require physical-device testing.
