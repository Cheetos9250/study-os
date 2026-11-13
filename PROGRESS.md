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


## Reviewed monetary answers and worked-answer input — released in PR #67
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


## PR #67 authorized website release
- Owner authorized publishing completed/tested website work. PR #67 merged as `61d64f9d9272bbd2bea3176066ebdc6c33c54b8e`; its tested PR head is `b7e7e4dc24ae4346a79d9c2199e26f8aed0aabd7`.
- Exact PR-head CI: answer-check 43458654412 and full Node/icon 43458654422 passed (225 Node, 3 Python, 13 synthetic browser scenarios). Main Pages 43459873288, answer-check 43459874131 and full Node/icon 43459874149 are the release runs; final outcome/live verification is recorded on PR #67 after completion.
- Release adds QS-6-2, explicit final-answer lines and reviewed-solution reveal. Coverage remains 2/403; no backend/source PDF/real-data changes.


## Read-only backup comparison — implementation checkpoint
- Adds exact saved-data comparison between a selected backup and this browser: identical, differing, only in browser, only in file. Results expose dataset labels/counts, never raw answers or credentials. An empty/different browser is not called a successful match.
- Does not infer which differing copy is newer and does not claim file-format validation proves successful recovery. No upload, restore, storage write or new storage key is added.
- File-selection request IDs prevent an older asynchronous read from displaying stale results; a new/invalid selection clears previous comparison. Cross-tab progress events invalidate the comparison, and Compare again explicitly rereads the selected file against current saved data.
- Extended synthetic basic journeys to Chromium/WebKit at 390/820/1280px with light/dark screenshots, comparison/race/cross-tab checks, and a clean-browser preview before isolated recovery. Existing course/PDF/answer data are unchanged.
- Local: 229 Node tests, 3 Python tests, JavaScript syntax and diff checks passed. Exact-head CI/browser evidence tracked on the PR. Physical iPad/Files remains outside controlled QA.
- Branch: feat/backup-file-comparison-20261113. PR #44/#68 branches remain untouched; no Notion dispatch, backend deploy or production-data mutation.


## Textbook failed-save retry
- Found a local-save retry gap: after a failed write, the answer stayed in memory; a later flush of unchanged text returned early without retrying storage. Status-only failures had the same retry gap.
- Track unsaved progress until the existing localStorage write succeeds. Retrying unchanged notes/status now persists the in-memory data, clears only the specific storage error and displays the saved state. Failed writes explicitly display Not saved.
- Add a best-effort browser exit warning while changes remain unsaved. iPad/app termination may not deliver this event; manual Export answers remains the recovery action and includes the in-memory draft. No new key or migration.
- Local: 232 Node tests passed; targeted VM checks exercise the actual persist/flush/warning functions with failing storage. Synthetic Chromium/WebKit adds failure → draft export → retry without editing → failed-status retry → reload verification. CI tracked on PR. No real storage failure/user data is induced.
- Backup-comparison PR #70 released as `489601d`: all release CI passed (Pages 43463559531, Node/icon 43463560763, backup/basic 43463560425, recovery 43463560588). Live backup HTML/versioned JS returned 200 and matched tested source.


## Final release checkpoint for backup comparison and save retry
- PR #70: `489601da480e3d962d08355ce88ea577e8a74d8c`, comparison release CI and live evidence above.
- PR #71: `9323e9088ae2e795863beecda10d08c94d81a6a1`, tested head `ec314f8d481daff94106c058e3f1002a2820e01f`. Exact-main Pages 43465152242, full Node/icon 43465154064 and answer-check 43465154190 all succeeded. 232 Node / 3 Python tests and 15 reader browser scenarios passed. Backup release separately passed 48 basic journeys + 12 recovery scenarios.
- Read-only live check after release: reader HTML, backup HTML and `study-progress-backup.js?v=20261113-compare` returned HTTP 200 and exactly matched tested source. No real progress accessed or changed.
- Initial PR #71 source transfer truncated the reader; CI failed before release. Corrected the source and verified exact local/remote Git tree equality; final code and release checks passed.
- Both features are published. Remaining verification is physical iPad/Files and best-effort exit warning behavior; avoid claiming complete protection or automatic cloud sync. Further solution coverage belongs to separate PR #68; preserve its work and the new save-retry behavior when integrating.


## Course progress save feedback and recovery
- Found silent localStorage write failures in all five course quiz/SRS/typing save paths. Added one shared, course-scoped guard that retains the latest failed dataset in memory, displays an Unsaved learning progress banner, and retries on explicit user action.
- Download unsaved backup overlays pending values onto the existing allowlisted snapshot format, so newer in-memory ratings/answers/preferences are included instead of only old stored bytes. It excludes credentials and never writes during export. A download does not clear pending state or claim that browser storage succeeded.
- Existing sync dirty callbacks and manual-sync behavior are retained; no backend/progress endpoint changes. No new storage key or learning-content edits. Reader/PR #68 work remains separate. Exit warnings are best-effort; iPad may omit them.
- Local validation: 239 Node tests, 3 Python tests, syntax/diff checks passed. Compared embedded course data against main: unchanged for all five pages. Initial integration check caught a missing CSS link in the legacy implicit-head markup; corrected before PR.
- New synthetic Chromium/WebKit CI covers 30 course/viewport journeys at 390/820/1280px with light/dark screenshots: rating save failure, secret-free unsaved backup, retry, quiz or typing retry, and reload persistence. Existing basic/backup QA is also required before release. Physical iPad remains unverified.
- Branch: fix/course-progress-save-feedback-20261113. Exact-head CI/PR/release evidence tracked in the corresponding PR.

- If stored data cannot be read/included, draft export falls back to a clearly labelled partial backup containing pending in-memory datasets only. It does not imply that other stored data was backed up.


## Published course save-reliability checkpoint — PR #73
- Released as `f1b4b9622545e7d2f2e5133b0c23414ae071fe0e`, tested PR head `efcb4559a6de2631dfdba4a60b3b8e2b8392ce62`. All exact-main CI succeeded: Pages 43470097860, Node/icon 43470098754, VocaBloom regression 43470098727, basic/backup 43470098900 and course reliability 43470098896.
- Evidence: 239 Node tests, 3 Python tests; 30 course-save journeys plus 48 existing basic/backup journeys in synthetic Chromium/WebKit. Save journeys cover five courses × 390/820/1280px, light/dark screenshots, quota failure, partial export on blocked reads, explicit retry, reload, and clean-profile recovery of exported files at 390px. No real user progress was used.
- Screenshot inspection caught reversed inactive card text in WebKit. Explicit CSS visibility now hides the inactive face; tests verify both flip states and the new card after rating. Final WebKit 390px dark screenshot shows the proper question. Screenshots were settled at scroll-top with reduced motion for inspection.
- Live read-only verification after deployment: all five course HTML pages, versioned guard JS, save CSS and backup JS returned HTTP 200 and exactly matched tested files. Embedded learning content and sync callbacks were preserved.
- Screenshots/results: https://github.com/Cheetos9250/study-os/actions/runs/43469468689/artifacts/14059384694 . Physical iPad/Files and exit prompts remain outside controlled QA; no guarantee of protection on app termination or automatic cloud sync.
- No backend deployment, production-data mutation, Notion dispatch or changes to PR #44/#68 branches. Further source/solution work must preserve the new guards and inactive-face rules.


## Study OS CI deduplication — 2026-11-14
- Restricts push-triggered checks to main in five Study OS test workflows: course storage, backup/basic, restore, site icons and accounting answer checks. Existing pull_request paths, manual triggers, permissions and all job steps are preserved.
- Adds concurrency scoped by workflow/event/PR number. Only superseded pull_request runs may be cancelled; non-PR groups use unique run IDs so main/manual checks do not share a pending queue. No Pages, Notion sync, Cloudflare or VocaBloom workflow changes.
- Local: all five YAML files parsed with PyYAML; compared parsed jobs, permissions, PR paths and manual events to base main and confirmed unchanged. 239 Node tests, 3 Python tests and diff checks passed. No permanent mirror tests added for this configuration-only change.
- Actual GitHub trigger/cancellation evidence and exact-head CI are tracked on the PR before release. App HTML, language features, learning data and progress storage are unchanged.
- Branch: chore/study-os-ci-dedup-20261114. Product focus reaffirmed: academic study/shared infrastructure; legacy language regression remains compatibility only.

- Real GitHub observation for PR #75: the branch push produced zero runs before PR creation. Opening the PR produced exactly one pull_request run for each of the five affected workflows (43472558146, 43472558183, 43472558270, 43472558275, 43472558173), without duplicate push runs. A documentation follow-up while those checks are running exercises the superseded-PR cancellation policy; final results and exact head are recorded on PR #75.
