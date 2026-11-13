# Study OS — Legacy Progress Read-Only Schema Audit

Date: 2026-11-13. Source: existing `acc.html`, `eco.html`, `math.html` on draft branch. No browser storage, Worker, KV or Notion data read or written.

## Observed keys and behavior

| Subject | Quiz/known storage key | SRS storage key |
|---|---|---|
| Accounting | `study-acc` | `acc-flashcards-v1-srs` |
| Economics | `study-eco` | `econ-flashcards-v1-srs` |
| Mathematics | `study-math` | `math-flashcards-v1-srs` |

- Course script initializes `store={known:[],ans:{}}`, loads JSON from `study-${D.key}`, and saves the entire object.
- `ans` maps question IDs to selected answer indices. The UI compares each selected index with its own `q.right` for correctness; counting answer-map keys alone **cannot** establish accuracy.
- `known` is a legacy array and is **not** equivalent to SRS mastery.
- SRS key stores JSON object `{s, m, lim}` where `s` maps card IDs to scheduling records; count is only scheduled cards, not necessarily cards due or reviewed today.
- Additional keys exist for typing preferences, external content caches, and cross-device sync secrets. These are **out of scope** and must never be exposed to analytics logs or exported.

## Added safe adapter

`lib/study-os-legacy-progress-reader.cjs` accepts an explicitly supplied snapshot object with only the two academic progress keys. It parses in memory, validates JSON shapes and returns counts plus observation flags. It **does not** read localStorage itself, mutate data, make network requests or derive accuracy/coverage without reliable mappings.

Missing keys return `null` for unknown counts; malformed JSON fails closed. `quizAccuracyPercent` and `reviewCoveragePercent` remain `null` because existing quiz-answer maps and SRS keys need verified mapping to question/card identities before deriving reliable values.

## Integration blockers

1. Validate stable IDs and quiz right-answer mapping for both bundled and external Notion content.
2. Audit exact SRS `due`, `st`, and scheduling semantics, including Asia/Bangkok time boundaries.
3. Design read-only browser integration with no credential exposure and no writes.
4. Preserve existing local keys, cloud sync compatibility and reset semantics.
5. Obtain explicit authorization and independent backup/rollback evidence before any production progress migration or sync changes.

## Verification

Static source audit: completed. Unit tests: added to non-deploy GitHub Actions. Browser runtime and live data: **not tested**. No production merge or deployment.
