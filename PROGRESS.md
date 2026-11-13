# Study OS progress

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
