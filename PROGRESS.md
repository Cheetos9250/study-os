## Accounting textbook continuation — 79 drafts (2026-11-14, PR #68)

- Source read: owner's original *Fundamental Accounting Principles, 24e* PDF; current study scope Chapters 1–9. **79 of 403 indexed question IDs** have drafted worked solutions; **324 indexed IDs remain without a draft**, and the index is not a complete audit of the printed book.
- Added **14 source-reviewed answers this turn**: QS 2-1 through 2-4; E 2-1 through 2-4; E 2-7, 2-8, 2-9; P 2-1A, P 2-7A, P 2-1B. Completed the missing part (c) of E 2-6. Source pages checked: PDF 94, 96, 97, 100, 103 and the chart of accounts on PDF 1134–1135. The 36 previously source-reviewed drafts remain; **50 are marked PDF-reviewed, 29 older drafts still carry mixed/incomplete review status**.
- Fixed *eight incorrect question-image/title pairings* in Chapter 2: QS 2-1..4 and E 2-1..4; kept every original ID stable to avoid losing saved progress. All other suspect auto-indexed question titles and PDF crops remain to be audited. Known missing printed questions include QS 1-10, E 1-10 and E 1-17; Chapter 2 QS 2-10..15 are still misnumbered in the automated index.
- The reader now distinguishes **PDF-checked** answers from **unverified draft** answers instead of labeling all entries source-reviewed. This does not change stored student answers, progress, the private PDF, answer checking, Cloudflare, Notion or sync.
- In-session validation: 79 unique indexed answer IDs; nonempty explanations and accurate source page links; 50 source-reviewed markers; eight inspected crop/label pairs; **13 independently recomputed accounting figures all passed**. This is not the same as Node/CI or physical-iPad testing. Exact-head CI and the real iPad reader remain unverified.
- PR #68 remains **unmerged and unreleased**. Older 65-answer status further below is a historical snapshot superseded by this note.

## Textbook worked solutions — 65 drafts, unreleased (2026-11-13)

- Branch `feat/accounting-textbook-worked-solutions-20261113`, PR #68. **65/403 indexed question IDs** have drafted solutions; **338/403 remain without a draft**. The catalog itself is not a fully audited record of all printed questions.
- In the latest continuation **36 solutions were checked against the original private PDF** (29 Chapter 1 exercises/problems on pages 56–67 and seven Chapter 2 Quick Study/exercise entries on pages 94–96). These entries have `verification: source-reviewed-2026-11-13`. The 29 preceding drafts have mixed/mostly incomplete source validation; do not advertise 65 verified answers.
- All worked solutions live in `data/accounting-textbook-solutions.json` behind `Show Worked Solution`; student answers, progress and private PDF stay unchanged. `tests/accounting-textbook-solutions.test.cjs` validates the current record counts/IDs.
- Detected an important index defect: PDF text extraction scrambled some labels and crops. Printed QS-1-10, E-1-10, E-1-17 are missing from the catalog, while Chapter 2 QS-2-1 through QS-2-4 and E-2-1 through E-2-4 have permuted titles/geometry. Fix with user progress preservation before bulk authoring.
- Corrected numerical issues in P-1-9B's alternate financing and E-2-6's credit sales. No production merge/release. Exact-head GitHub Actions, physical iPad rendering and PDF source reconciliation remain outstanding.

## Accounting textbook full-solution request (2026-11-13; PR #68)
- Current draft answer coverage: **26/403 indexed questions** (377 have no draft). The index itself is not confirmed complete against the printed textbook.
- The latest commit added QS-1-5 and E-1-1 based on the owner's local PDF text, pages 51 and 54. Existing 24 drafts require individual PDF/source verification; previous claims that all were source-reviewed were not sufficiently evidenced and have been corrected in metadata and PR description.
- The opt-in reveal UI remains on draft PR #68, **not merged and not deployed**. The user authorized release only after every question is answered and checked. Do not release incomplete answer coverage.
- Next: verify each existing draft against source, audit missing catalog identifiers, solve remaining questions including multipart workings, run exact-head CI and physical iPad PDF/backup QA, then release once complete and tested.

# Study OS progress

## Source-reviewed Accounting textbook worked solutions (2026-11-13; feature branch)
- Source: the owner's private `Acc textbook.pdf` (Wild & Shaw, *Fundamental Accounting Principles*, 24th ed.) verified in Google Drive and visually checked against PDF pages 51–57 and 268. The original PDF and copyrighted question pages were **not** copied to GitHub.
- Added `data/accounting-textbook-solutions.json` with **24 original worked answers and explanations** tied to existing question IDs: 23 from Chapter 1 and one for QS-6-1. These are source-reviewed worked solutions, **not publisher-verified keys**. The existing deterministic auto-check remains only QS-6-1.
- Updated `accounting-textbook.html` with a deliberate **Show worked solution** action that is separate from **Check answer** and the user's own notes. Solution text is safely inserted using `textContent`, hidden initially and on navigation, and unavailable questions are explicitly identified. Failed solution fetch does not block the original textbook reader.
- 403 questions remain indexed; **379 indexed questions still lack a reviewed answer**. The PDF-derived index itself has known possible omissions: e.g. printed QS-1-10 and Exercise 1-10 are missing from the index, so the scope is **not** independently proven complete.
- Existing user progress keys, status flags, backup/restore contract, PDF import/cache, Notion data, API, VocaBloom, and Cloudflare were **not modified**. Feature branch only; **no merge, production deploy, or live user-data tests**.
- Automated assertions added for catalog identifiers, PDF-page provenance, 24/403 coverage, and reveal UI. Status of remote CI and physical iPad Safari testing must be recorded separately after checking their actual results.
- Next: independently verify all worked calculations, audit the printed question list vs the 403-entry index, then continue solving the remaining 379 in reviewed batches before declaring full coverage.


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


## Local textbook final-answer checking — in review
- Adds a local Check answer control and deterministic quantity check for QS-6-1 only (1 of 403 indexed questions). The reviewed calculation is 1,300 − 20 + 350 + 80 = 1,710 units, based on the owner's original-question screenshot, not a publisher answer key.
- Explains ownership, excludes unsaleable damaged units and accepts equivalent whole-number/unit formatting. Working, journal entries and reasoning are not automatically graded. Unsupported questions cannot receive guessed grades.
- Feedback clears when editing, changing question, finding no results or reloading. Checking saves current notes through the existing path but never marks a question completed or persists a grade. No new storage key, PDF access or upload is added.
- Local validation: 222 Node tests and 3 Python tests passed; diff and JavaScript syntax checks passed. Synthetic Chromium/WebKit CI covers light/dark at 390/820/1280px, state invalidation, persistence and checker-load failure. Exact code-head `ea8b9f21b28dbbdeb46bae72cfc27dc01f64a1b6`: CI 43451198276 passed, including 13 synthetic browser scenarios and screenshots; full Node/icon CI 43451198282 also passed. WebKit 390px dark screenshot inspected. Local browser launch could not run because the installed Playwright browser executable is absent; CI browser execution succeeded. Physical iPad and PDF rendering remain unverified.
- Branch: feat/textbook-answer-check-20261113. Production release and PR status must be checked separately; no backend/data changes.
