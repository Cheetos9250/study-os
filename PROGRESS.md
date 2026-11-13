# Study OS progress

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
`fix/study-os-mobile-sync-overlap-20261113`

## Scope boundaries
PR #44 remains untouched. No Notion sync dispatch, production data changes or backend deployment is included.


## Basic study workflow and read-only backup — PR #48
- Reviewed the existing allowlist-based backup: only the five courses' quiz/SRS/typing settings and VocaBloom progress are included; sync credentials and content caches are excluded.
- Added homepage links to backup and both existing language courses, plus Home/Backup navigation on all five course pages.
- Aligned the backup page fonts and dark-mode button text with the current design; made the file picker keyboard-focusable with a visible label focus indicator.
- Backup export and file inspection are read-only. No restore or automatic upload is included. PR #53 remains separate.
- Synthetic Chromium/WebKit journeys cover course navigation, card rating persistence after reload, download, credential exclusion and validation without storage mutation. Exact-head results and release status are recorded in PR #48.
- Physical Safari/iPad export into Files/iCloud Drive still needs device verification. A downloadable copy is not proof of a tested restore.
