# Study OS progress

## Accounting textbook reader usability improvements (2026-11-13; PR #64)
- The reader defaults to all four question types, and its search finds questions by identifier/title across all studied Chapters 1–9 even if another chapter/type is selected (e.g. P-6-2B).
- Remembers the last question separately from the previous answer/status storage and reopens it after reload.
- On mobile, question selection collapses the picker and scrolls to the exercise. Previous/next controls are disabled at the ends; an empty search clears old answer text.
- Node tests exercise the actual global filter function, selected type behavior, question-number search, and resume wiring. No textbook pages are published; PDF remains imported locally in the browser.
- Browser-local progress and PDF caching still need hands-on Safari/iPad testing. No cross-device syncing was added.


## Accounting textbook in-page practice reader — chapters 1–9 (2026-11-13; PR #63)
- Restricted the new in-page textbook reader to exactly **Chapters 1–9**, ending at **Accounting for Receivables**, matching the currently studied course scope. The catalog now contains **403 numbered question references** and **36 section-level metadata references**; none of chapters 10–26 or appendices appear in the interface or published catalog/geometry JSON.
- Replaced the directory-plus-Drive-link interface with a responsive one-question-at-a-time workspace: chapter/type/search filters, original question image, answer/working field, progress status and previous/next controls on one page.
- User selects the original, private 1,210-page PDF once on their own iPad; PDF.js renders original printed questions inside Study OS to preserve calculations, tables and diagrams. The source PDF stays browser-local via IndexedDB when storage quotas permit; it is not published or uploaded to GitHub/Cloudflare.
- **401/403** question headings match automatically cropped geometry; **2/403** use a full source-page fallback. Next-page navigation never crosses beyond the selected chapter boundary; exact crop/question completeness remains unaudited.
- Reuses `studyos.accounting.textbook.progress.v1`; browser-local answers/progress, backup import/export; no cross-device sync. Existing Accounting course progress and flashcards were not modified.
- Static tests now assert exactly nine chapters, 403 numbered questions, 401 matched regions, two fallbacks, scope guards, source rendering and privacy. Real iPad Safari rendering and IndexedDB retention still need live-device QA.

## Accounting textbook exercise index (feature branch, not yet released)
- Added a source-linked **reference index**, not an unauthorized public copy of the textbook exercises, for *Fundamental Accounting Principles* (24th edition) from the owner's Google Drive.
- Automatic PDF extraction created 1,361 individual Quick Study / Exercise / Problem references and 104 broader section references spanning chapters 1–26 and selected appendices. These are **candidate references, not an audited guarantee of every question**; some PDF text has nonstandard glyph encodings, so manual reconciliation is required.
- Added `accounting-textbook.html` to search and filter the references, jump to the owner's original PDF, track per-question status, write personal notes, and export/import a backup of this catalog's progress.
- The catalog uses a new local-only key (`studyos.accounting.textbook.progress.v1`), separate from existing accounting quiz/flashcard progress and from the main Study OS backup/sync tools; it is not synced across devices.
- This change preserves existing content and does not upload source text to the public repository. Physical iPad Safari and live deployment unverified.


This entry covers the course UI work on 2026-11-13, not a complete infrastructure audit.

## Completed
- English academic homepage and subject icons released in PR #51.
- VocaBloom font family applied to course pages in PR #52; remaining Mono labels removed in PR #54.
- Course heading, tab and control icons released in PR #55 (main `6a33f29f84b873ac03443122fd45b56cb6af4432`).
- Fixed Cloud Sync settings covering the Notion save action on narrow screens: the toolbar now follows course content in document flow, with safe-area margins and wrapping.
- Made all available study tabs visible together on narrow screens, with icons above labels instead of horizontal scrolling.
- Sync logic, learning content, storage keys and production data are unchanged.

## Validation
- Local regression: Node 184/184 and Python 3/3 passed; `git diff --check` passed.
- Course browser workflow covers five courses at 320, 390, 820 and 1280px in light/dark modes, including toolbar positioning and save-button overlap.
- Browser QA uses isolated localhost and disposable browser storage. External study APIs and writes are blocked.
- Exact-head CI, screenshots, commit and release evidence are recorded in the corresponding pull request; release requires passing checks.
- Physical iPad Safari has not been tested.
- Initial 40-case run passed, but screenshot inspection found the practice tab outside the visible navigation at 320px. Added the layout fix and a visible-tab bounds assertion; final exact-head evidence is tracked in PR #56.

## Working branch
`feat/study-os-textbook-progress-backup-20261113`

## Scope boundaries
PR #44 remains untouched. No Notion sync dispatch, production data changes or backend deployment is included.


## Basic study workflow and read-only backup — PR #48
- Reviewed the existing allowlist-based backup: only the five courses' quiz/SRS/typing settings and VocaBloom progress are included; sync credentials and content caches are excluded.
- Added homepage links to backup and both existing language courses, plus Home/Backup navigation on all five course pages.
- Aligned the backup page fonts and dark-mode button text with the current design; made the file picker keyboard-focusable with a visible label focus indicator.
- Backup export and file inspection are read-only. No restore or automatic upload is included. PR #53 remains separate.
- Synthetic Chromium/WebKit journeys cover course navigation, card rating persistence after reload, download, credential exclusion and validation without storage mutation. Exact-head results and release status are recorded in PR #48.
- Physical Safari/iPad export into Files/iCloud Drive still needs device verification. A downloadable copy is not proof of a tested restore.


## Browser and Home Screen icons
- Added shared Study OS book icons: scalable SVG favicon, 16/32/48px ICO fallback, and 180px Apple touch icon.
- Linked icons from the home, all five course pages and backup page. VocaBloom retains its own icon.
- Icon assets are local; no content, scripts, progress data or sync behavior changed.
- Existing iOS Home Screen shortcuts may need to be re-added to refresh cached artwork; physical-device appearance remains unverified.


## Missing-only progress recovery — PR #53
- Integrated the existing local-only restore tool with the released backup page, homepage and icons/fonts.
- Review confirmed full-file conflict refusal, immediate pre-write checks, read-back verification, and rollback limited to this operation's unchanged new keys. Browser localStorage is not transactional across tabs; close other Study OS tabs first.
- Added readable dataset/file preview and fixed asynchronous file-selection races so an older selection cannot re-enable restore.
- Extended synthetic checks for cancellation, race handling, repeated restore, quota rollback and concurrent changes. No real user progress is read or restored by QA.
- Exact-head CI/release evidence is tracked in PR #53. Physical iPad Safari/PWA storage and Files flow remain unverified.

- Also added explicit confirmation before clearing course quiz answers; browser checks verify cancel preserves answers, confirmed reset leaves flashcard schedules intact, and a new answer persists after reload.
- The first integrated browser run timed out navigating to a course in WebKit. Added explicit URL/load waits and failure diagnostics before repeating the full journey suite.


## Published basic readiness checkpoint — 2026-11-13
- Code release: `617b7d79f7de63c988d9da7edad09a8a4ea3c7b6`, PR #53. It includes local backup/recovery, readable file preview, latest-selection protection and confirmation before clearing quiz answers.
- Exact code-head CI on main: all successful. Pages 43418073049; full Node/icon 43418073485; regression 43418073560; basic/backup 43418073460; recovery 43418073589.
- Local: 206 Node tests, 3 Python tests and diff checks passed. Chromium/WebKit synthetic evidence covers 28 study/backup/native-recovery journeys plus 12 recovery scenarios (40 total).
- Live read-only checks: home, five courses, backup, restore and restore JS returned HTTP 200 and matched tested source. No real user progress was exported, reset or restored by the agent.
- Physical iPad Safari/PWA/Files behavior remains unverified. No automatic cloud backup, production cloud-data recovery or complete Study Planner is claimed.


## Main backup coverage for textbook answers
- Added the reader's existing `studyos.accounting.textbook.progress.v1` data to the main allowlist; saved answer text, status and timestamps are preserved unchanged.
- Missing-only recovery validates textbook record types and blocks differing existing textbook progress for the entire restore, using the existing no-overwrite behavior.
- Preview names the dataset Accounting textbook answers. Backup/recovery pages explicitly exclude the original PDF; no IndexedDB/PDF, catalog, geometry, reader source or production data changes are included.
- Synthetic Chromium/WebKit tests save an answer in the actual reader UI without selecting a PDF, reload it, export it through the main backup, recover into a clean browser context, and reopen the reader to verify exact notes/status.
- Physical iPad/PDF rendering and storage retention are still unverified; this change only covers answer-progress backup.


## Local textbook final-answer checking — released in PR #66
- Adds a local Check answer control and deterministic quantity check for QS-6-1 only (1 of 403 indexed questions). The reviewed calculation is 1,300 − 20 + 350 + 80 = 1,710 units, based on the owner's original-question screenshot, not a publisher answer key.
- Explains ownership, excludes unsaleable damaged units and accepts equivalent whole-number/unit formatting. Working, journal entries and reasoning are not automatically graded. Unsupported questions cannot receive guessed grades.
- Feedback clears when editing, changing question, finding no results or reloading. Checking saves current notes through the existing path but never marks a question completed or persists a grade. No new storage key, PDF access or upload is added.
- Local validation: 222 Node tests and 3 Python tests passed; diff and JavaScript syntax checks passed. Synthetic Chromium/WebKit CI covers light/dark at 390/820/1280px, state invalidation, persistence and checker-load failure. Exact code-head `ea8b9f21b28dbbdeb46bae72cfc27dc01f64a1b6`: CI 43451198276 passed, including 13 synthetic browser scenarios and screenshots; full Node/icon CI 43451198282 also passed. WebKit 390px dark screenshot inspected. Local browser launch could not run because the installed Playwright browser executable is absent; CI browser execution succeeded. Physical iPad and PDF rendering remain unverified.
- Branch: feat/textbook-answer-check-20261113. Released with owner authorization as `833489203629500839e090a7b8963532d21bdc43`. Exact-main Pages 43452770281, full Node/icon 43452770477 and answer-check 43452770417 passed; live HTML and versioned script matched tested source. No backend/data changes.


## Reviewed monetary answers and worked-answer input — in review
- Extends the local checker to QS-6-2 inventory cost: $14,000 + $250 + $300 + $900 = $15,450, reviewed against the owner's displayed question. Advertising, sales staff salaries and shrub trimming are excluded. Coverage is now 2/403, not a complete answer key.
- Parses USD amounts to integer cents with strict grouping/decimal/currency checks; quantity answers remain unit-specific. No rounding, arithmetic evaluation or guessing from arbitrary numbers in working.
- Supports saved working with one explicit last line (`Final answer: $15,450.00`, or Thai label); unlabelled partial working and competing final answers remain ungraded. Existing notes/status/backup formats remain unchanged.
- Adds Show reviewed answer for supported questions without marking them completed or changing their answer. Guidance and unsupported coverage come from rule metadata instead of a hardcoded QS-6-1 string.
- Local validation: 225 Node tests and 3 Python tests passed, diff/syntax checks passed. Code head `44364bf77847f4c74ffc6c25366dae4a6b107499`: answer-check CI 43457836485 and full Node/icon CI 43457836637 passed. The 13 synthetic browser scenarios now exercise both unit and monetary answers, final-line working, one-cent mismatch, reveal and persistence. Inspected WebKit 390px dark and Chromium 820px light screenshots. Controlled physical iPad verification remains pending; owner screenshots show original PDF questions and saved notes, but do not establish reload/backup retention.
- Branch: feat/textbook-money-answer-check-20261113. PR/release evidence tracked separately.


## Read-only infrastructure checkpoint (2026-11-13)
- Main before this branch: `8334892`; Pages 43452770281 and answer-check 43452770417 passed. A later scheduled Notion sync run 43455344492 reports success. This is workflow evidence, not an end-to-end verification of Notion content freshness or the Cloudflare Cron scheduler.
- Current `.github/workflows/sync.yml` still runs every 15 minutes, commits `data` and pushes directly to main, then requests a Pages rebuild if data changes. Safety PRs #39/#50 remain separate drafts; no workflow dispatch or changes were made in this round. Review those PRs together before changing production automation.
- GET-only probes of the configured public Worker `/quiz` and `/cards` returned HTTP 403; a diagnostic `/quiz` response reported `error code: 1010` (server header `envoy`). This does not prove the user-facing service is down; this execution environment could not validate its live content. No authentication, bypass attempts, progress reads or writes were performed. No Cloudflare connector was available to inspect Cron/source/KV.
- Offline CAS simulations passed: production candidate 14/14 and prototype 48/48. These are simulated tests, not deployed-backend evidence. Production Worker source and cloud-data recovery remain pending in draft PRs #57/#58.

- Reconciled the current patches from PR #39 (`db92f7d`) and PR #50 (`d138ad5`) in a disposable detached worktree based on main `8334892`: both applied without conflicts. Combined offline validation passed 5 workflow safety tests, 6 Python exporter fixture tests and diff checks. This validates patch compatibility/fixtures only, not GitHub Actions permission to open PRs or real Notion pagination/content. Existing drafts and production workflow remain untouched.
