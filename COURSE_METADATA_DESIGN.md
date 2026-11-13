# Course Metadata Design (Draft)

Status: **unlinked and unreleased opt-in draft**; local-only metadata editing and backup are implemented in PR #44 but are not exposed on production homepage. Working branch: `feat/study-os-s1-academic-home-20261113`; PR #44 remains draft.

## Existing boundaries
- Academic subject identities are fixed: `acc`, `eco`, `math`. Their published routes `acc.html`, `eco.html`, `math.html` and legacy progress keys must not change.
- The homepage course search filters cards in memory only; it does not persist changes.
- Planner sessions reference these stable subject IDs. Existing planner backups and IndexedDB records must remain readable.
- English/Chinese legacy pages remain intact; deep language learning belongs to VocaBloom.

## Proposed v1: editable presentation only
- Allow per-subject display name, optional description, and a preferred course-card order; never permit editing the underlying subject ID or route.
- Validate display name length (1–80 characters), description length (0–240), and a unique permutation of `acc/eco/math`. Reject markup and invalid structures; render using `textContent`, not HTML.
- Keep overrides in a **separate, versioned browser-local store**, not existing progress, planner, Notion or Worker data. No automatic write on page load.
- Use explicit Save and Reset actions. Show the scope (“this browser only”) and an unsaved-changes warning.
- Provide export and import of only course metadata. Validate the complete import before any atomic write, preserve current data on errors, and reject unsupported versions or conflicting records without silent overwrite.
- Preserve the original English/Thai search aliases so custom labels cannot make a course undiscoverable.

## Required verification before release
1. Unit tests for schema, validation, immutable IDs/routes, ordering and corrupt backups.
2. Isolated Chromium/WebKit tests for editing, reload, reset, import/export, keyboard navigation, accessibility, storage denial and conflict recovery.
3. Verify legacy progress counts and planner subject links are unchanged, including across tabs.
4. Test actual iPad Safari separately; synthetic WebKit is not physical iPad evidence.
5. No merge, production deployment, Notion mutation or cloud sync without explicit approval.

## Non-goals
- Creating arbitrary new subjects, deleting existing courses, changing legacy progress keys, migrating databases, modifying production Notion, or enabling cross-device synchronization.

## Implemented foundation — 2026-11-13

- Pure model `lib/study-os-course-metadata.js` validates v1 metadata and supplies defaults. Strictly allows only `acc/eco/math`, `name`, `description`, and an exact course order permutation; rejects unknown fields, markup and control characters. It has no browser storage access or UI integration.
- Node regression `tests/study-os-course-metadata.test.cjs` covers valid Thai names, reordered cards, invalid identities, duplicate order, overlength strings, extra fields and caller immutability. CI 43377242274 pending.
- This checkpoint originally covered the pure model only; subsequent checkpoints introduce an unlinked local editor and store. None is released.

## Isolated persistence prototype — 2026-11-13

- `lib/study-os-course-metadata-store.cjs` (`e4034b3`) implements an **opt-in Node/CommonJS prototype** for a separate IndexedDB database `study-os-course-metadata-v1`, one settings record, revision-checked readwrite transactions, explicit save/reset/import/export and no legacy progress access. No homepage script imports or opens this store yet.
- `tests/study-os-course-metadata-store.test.cjs` (`46b8cd1`) enforces the isolation contract and explicit opening. These are static/Node tests, **not** live IndexedDB browser behavior evidence. Before UI integration, add synthetic Chromium/WebKit transaction tests for stale writes, rollback on invalid import, denied storage and recovery.


## Corrupt-store protection and editor recovery QA — 2026-11-13

- Browser and CommonJS entrypoints now reject a present but malformed IndexedDB record (null, zero/invalid revision, or invalid metadata) on both read and write. Only a genuinely absent record (undefined) uses defaults. A failed save aborts its transaction without overwriting corrupt values.
- Synthetic Chromium/WebKit QA seeds malformed records and checks rejection and raw-record preservation. Dedicated editor QA covers browser JSON download, invalid import, explicit restore, and an IndexedDB-unavailable user interface.
- Shared store parity is checked by Node tests; CommonJS and browser entrypoints must not silently diverge.
- Corruption guard CI 43379924786 completed success at 485c11a. Later UI download/restore and parity CI must be verified at the exact head.
- The draft remains unlinked. No homepage activation, merge, deployment, Notion/KV writes or schema migration. Real iPad Safari and cross-device sync are still unverified.

## Verified fallback/recovery QA checkpoint — 2026-11-13

- Synthetic browser tests for JSON downloads/restore and invalid-import protection passed CI 43380014201 and 43380131840.
- No-JavaScript warning and hidden inert Open button passed CI 43380434836; corrupted saved metadata produces a clear Thai warning and never automatically resets, confirmed in CI 43380640662.
- This evidence is limited to isolated Chromium/WebKit profiles on CI. Physical iPad Safari, actual browser eviction/recovery and live cross-device sync remain untested. The editor stays unlinked and unreleased.
