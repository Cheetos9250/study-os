# Course Metadata Design (Draft)

Status: design only; **not implemented**. Working branch: `feat/study-os-s1-academic-home-20261113`; PR #44 remains draft.

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

## Required verification before implementation/release
1. Unit tests for schema, validation, immutable IDs/routes, ordering and corrupt backups.
2. Isolated Chromium/WebKit tests for editing, reload, reset, import/export, keyboard navigation, accessibility, storage denial and conflict recovery.
3. Verify legacy progress counts and planner subject links are unchanged, including across tabs.
4. Test actual iPad Safari separately; synthetic WebKit is not physical iPad evidence.
5. No merge, production deployment, Notion mutation or cloud sync without explicit approval.

## Non-goals
- Creating arbitrary new subjects, deleting existing courses, changing legacy progress keys, migrating databases, modifying production Notion, or enabling cross-device synchronization.
