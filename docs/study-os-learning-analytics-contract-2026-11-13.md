# Study OS — Learning Analytics Contract (offline prototype)

Date: 2026-11-13. Draft PR #44. **Not connected to production or existing user progress.**

## Implemented
- `lib/study-os-learning-analytics.cjs`: pure function `summarizeLearning({totalCards, reviewedIds?, attempts?})`.
- Input observations are supplied by the caller, not read from localStorage, Notion, Cloudflare KV or the Worker.
- `reviewedIds` is deduplicated within a subject before computing reviewed-card coverage.
- `attempts` requires an explicit Boolean `correct`; quiz accuracy counts **attempts**, not distinct questions.
- Zero quiz attempts yield `quizAccuracyPercent: null` (unknown), not 0%. Zero total cards yield `reviewCoveragePercent: null`.
- Invalid inputs fail closed. Function returns an immutable summary object.

## Definitions
- **Review coverage** = distinct observed reviewed card IDs / total cards × 100. This is not mastery, SRS due, or completion.
- **Quiz accuracy** = correct observed attempts / observed attempts × 100. This is not an exam grade or distinct-question success.
- **Unobserved** means no supported observation source; do not infer a learner's actual progress from bundled card counts.
- All percentages round to two decimal places.

## Not implemented / blocked
- Existing per-subject storage format adapters; need a read-only schema audit and sample data with secrets removed.
- Merging cross-device progress, Notion events, or Cloudflare KV; needs independent backup, rollback and approval.
- SRS due count and streaks; require verified timestamps, timezone and recurrence semantics.
- Dashboard integration and iPad runtime testing; current module is Node-only and is not bundled into browser pages.
- Any claim that offline test fixtures represent live learner performance.

## Next safe action
Audit the existing per-subject localStorage data formats and identify a read-only adapter with explicit version handling. Keep production keys, backend endpoints, and source data untouched.
