# Study OS — physical iPad Safari QA for course metadata (manual, unreleased)

**Status:** TEST PLAN ONLY. No physical iPad Safari verification has been performed by this document.

**Repository:** `Cheetos9250/study-os` — draft PR #44, branch `feat/study-os-s1-academic-home-20261113`.
**Component:** unlinked `course-metadata-draft.html`, isolated `study-os-course-metadata-v1` browser IndexedDB.

## Safety prerequisites

1. Use an **isolated static preview of the draft branch** on a non-production origin, with matching `lib/` files. Do not point `study-os` production Pages or Cloudflare Worker at the draft. A GitHub raw-file view alone is not proof of an executable preview.
2. Use synthetic course names only. Do not import or overwrite a student's actual browser profile, Notion data, KV data, scores or progress. Record the exact Git commit SHA, preview origin, iPad model, iPadOS/Safari version and test date.
3. Export any user-owned data independently before a future release; these tests must not delete real data. Browser-private contexts have different lifetime limits than normal Safari.
4. Keep all external API requests disabled where supported, or independently verify that the isolated editor makes none. Do not test production credentials.

## Checklist (real device, synthetic data)

- [ ] With JavaScript disabled, opening the draft page shows a meaningful Thai warning; Open is hidden and no edit form appears.
- [ ] With JavaScript enabled, before pressing Open, the editor is hidden and no implicit metadata write occurs.
- [ ] Open shows three stable academic IDs (`acc/eco/math`) and default names; no English/Chinese subject is added or removed.
- [ ] Edit a Thai/English display name and description. Save explicitly, reopen in the same browser profile and confirm persistence. Published course routes remain `acc.html`, `eco.html`, `math.html`.
- [ ] Confirm Reset cancel preserves changes, Reset accept restores defaults and never edits academic progress or the study planner.
- [ ] With a typed unsaved draft, Export warns that the edits are not yet saved. Save first, download JSON through Safari into Files and inspect that it contains only metadata, no tokens, grades, progress or secrets.
- [ ] Use a **separate test profile** with empty synthetic metadata; import the downloaded JSON using Files, explicitly confirm and reload. Names and order match the export.
- [ ] Import malformed, future-version and oversized synthetic JSON files. Each fails without changing the last valid record. No automatic reset/delete occurs.
- [ ] Open two tabs, modify/save in one tab, then try saving or importing an older revision from the other. A conflict is displayed and the newer stored record is preserved; explicitly Refresh to recover.
- [ ] If site data is intentionally blocked in a disposable profile, the editor displays an error and stays hidden; do not treat failure as permission to reset.
- [ ] Test 390px-equivalent portrait and landscape widths: no horizontal overflow, controls at least comfortably tappable, focused inputs stay visible above the software keyboard.
- [ ] Use VoiceOver: field labels, status messages, focus order, buttons, file input entry and reset confirmations are understandable and reachable.
- [ ] Inspect synthetic local progress and planner data before/after metadata changes: no change. Confirm no external/Cloudflare/Notion calls originated from the editor.

## Evidence and release decision

Record each item as PASS/FAIL/BLOCKED and attach **redacted** screenshots or video, Safari console/network notes if available, browser storage readback, and the exact candidate commit SHA. Synthetic Chromium/WebKit CI is supplementary evidence and **cannot substitute** for this physical-device gate.

**Release remains blocked without separate owner approval.** Do not merge PR #44, link the draft editor in production, deploy, migrate existing storage, change the Worker/KV/Notion/scheduler, or activate progress CAS as a consequence of this checklist.
