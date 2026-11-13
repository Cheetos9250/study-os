# VocaBloom — Next Steps

Updated: 2026-11-13

## Allowed on feature branch without production access

1. Define morphology-aware example eligibility for the nine excluded English entries listed in `CONTINUOUS-AUDIT-2026-11-13.md`; keep `securities filing` partial-headword handling explicit. Preserve imported IDs and do not edit Notion records.
2. Extend session-only practice with sentence context/explanations after auditing ambiguous senses and distractors. Retry mistakes and cross-chapter duplicate handling are implemented and regression-tested; keep SRS isolation intact.
3. Review CAS client and offline candidate Worker contracts with synthetic data; keep all testing off production.
4. Keep `PROGRESS.md`, `NEXT_STEPS.md`, and `P0-P1-ENGLISH-EXPERIENCE-AUDIT.md` aligned after verified work.

## Requires a real test environment or user approval

1. Execute `SAFARI-RELEASE-QA.md` on a physical iPad using a disposable browser profile and an approved non-production preview.
2. Independently verify staging CAS persistence, strong revisions and two-client conflict handling with synthetic staging records.
3. Obtain a fresh authoritative private backup of all five production progress subjects before any contemplated migration.
4. Explicitly approve and separately authorize any deployment, `progress_api` cutover, data migration, or Auto Sync enablement. Do not assume a request to “continue” grants these permissions.

## Non-negotiable

Do not merge PR #41, deploy, change Cloudflare Worker/KV/Notion, delete/migrate old progress or expose secrets without explicit authorization. Keep existing `data/config.json` `api` pointing to the original Notion content Worker.
