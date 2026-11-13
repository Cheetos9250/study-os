# VocaBloom — Next Steps

Updated: 2026-11-13

## Allowed on feature branch without production access

1. Review the remaining `securities filing` partial-headword example and evaluate explicit irregular forms only when source examples require them. Bounded regular matching now imports 581 entries with all 573 previous IDs preserved. Do not edit Notion records or invent examples.
2. Audit ambiguous senses and overlapping Thai distractors before adding new question types. Source example/translation feedback and Retry mistakes are implemented; keep context frozen and SRS isolation intact.
3. Add browser-level invalid-backup/quota-recovery scenarios where needed; these already have offline function-level coverage. The extended content-refresh and disposable Full Backup/Restore flows passed all four Chromium/WebKit viewport cases in round 2. Physical Safari and live cross-device behavior remain separate gates.
4. Keep project/architecture/decision/changelog documents and the current evidence in `CONTINUOUS-AUDIT-2026-11-13.md` aligned. Older P0/P1 audits are historical snapshots; do not replace their recorded results with assumptions.

## Requires a real test environment or user approval

1. Execute `SAFARI-RELEASE-QA.md` on a physical iPad using a disposable browser profile and an approved non-production preview.
2. Independently verify staging CAS persistence, strong revisions and two-client conflict handling with synthetic staging records.
3. Obtain a fresh authoritative private backup of all five production progress subjects before any contemplated migration.
4. Explicitly approve and separately authorize any deployment, `progress_api` cutover, data migration, or Auto Sync enablement. Do not assume a request to “continue” grants these permissions.

## Non-negotiable

Do not merge PR #41, deploy, change Cloudflare Worker/KV/Notion, delete/migrate old progress or expose secrets without explicit authorization. Keep existing `data/config.json` `api` pointing to the original Notion content Worker.
