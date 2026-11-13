# Study OS

Academic learning workspace for Accounting (`acc`), Economics (`eco`), Mathematics (`math`), and future university subjects. VocaBloom owns language learning. Both still share legacy content and infrastructure; preserve `eng`/`zh` and all existing progress identities.

## Current development

Working branch: `feat/study-os-s1-academic-home-20261113`; draft PR #44. Production branch: `main`. Changes on this branch are not released.

Implemented candidate: device-local study planner (add/edit, explicit completion, Bangkok dates, atomic same-browser tab edits and JSON backup/import), academic course navigation, read-only device progress panel, content inventories and source-overlap diagnostics, pure analytics/parser modules, automated contracts and isolated browser QA. Existing course pages supply flashcards, summaries and practice. The dashboard reports stored answer-map and scheduling-record counts, not correctness, mastery, due cards or cross-device totals.

## Priorities

1. Verify browser behavior and responsive layout on the exact draft build.
2. Complete planner browser verification and editable course metadata, with an independently versioned namespace and no legacy progress migration.
3. Verified question/card identity adapters for accurate learning analytics.
4. Reliable cross-device progress only after independent backup, restore rehearsal and explicit release authorization.

## Operating limits

No merge, production deployment, production database changes, Notion record mutation, KV import/restore, endpoint changes or automatic sync activation without explicit permission. Keep mock/offline evidence separate from live observations. Draft content must not be promoted to Verified automatically.

See ARCHITECTURE.md, PROGRESS.md and NEXT_STEPS.md for current implementation and evidence.
