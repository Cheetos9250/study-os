# VocaBLoom Phase 5 — Data integrity and production audit gate

Updated: 2026-11-12. **Production cutover is BLOCKED. Do not change the live Worker.**

## Verified already
- A local-only VocaBLoom full backup was supplied by the owner and stored privately in their Primary Google Drive under VocaBLoom / Backups. This contains Notion vocabulary and on-device subject stores; it does not prove anything about production KV data.
- The isolated staging Worker study-api-cas-staging-only was tested in the browser. The synthetic CAS probe passed 200/409 collision, retry preservation, and 428 legacy write rejection. This does not verify real data migration.
- The repo has a read-only **Cloud snapshot (read-only)** button in VocaBLoom → Settings → Unified Learning Sync. It sends five authenticated GETs, no PUT. The output uses the vocabloom-cloud-readonly-snapshot format.
- This repository **does not contain the actual current production study-api Worker source**. Do not infer its routes, storage bindings, data contracts, or backup capabilities from the staging prototype.

## No-credential, no-network audit page
- Open vocabloom/migration-audit.html on project GitHub Pages.
- Select the local full backup JSON file and then the production Cloud snapshot JSON downloaded from the existing Settings button.
- The audit page uses a restrictive CSP with no network connections. It reads both files **only in the browser**, checks format/subjects/revisions and summarizes per-subject counts. Its downloadable audit contains metadata, hashes and counts only, **not** vocabulary, answers, device IDs or SYNC_KEY.
- It deliberately reports BLOCKED_FOR_PRODUCTION_MIGRATION even after two valid backups; this is an integrity preflight, not migration authorization.
- Keep both original JSON files private. Do not commit them or send them to the public GitHub repo.

## Missing gates before any production Worker deployment
1. Obtain the current **complete production Worker code**, routes and bindings (including KV namespace and Notion integration). Inspect safely without changing the deployed code. Store securely, not in a public PR if it contains credentials.
2. Obtain a **server-side** point-in-time backup of the source KV data and any related data. The browser Cloud snapshot is a separate read-only export, not a verified server-admin backup.
3. Validate the five subjects acc, eco, math, eng and zh from source backup and browser snapshot, including byte counts/hashes and every data field. Do not assume an absent record is empty.
4. Make a staging import plan with no production target. Check legacy schema, 350 KB per-subject limit and new SQLite Durable Object namespace. Apply only to isolated staging after independent backup.
5. Freeze all real progress writers before final source capture. Audit older browser versions and other writers, record the cutover window and rollback checkpoints.
6. Validate data copy on staging, compare deterministic hashes, simulate a two-device session and verify malformed/401/409/412/428/error paths.
7. Obtain explicit approval for production cutover **only after** full backup, Worker source audit, tests and rollback plan. Production must keep its Notion routes and existing clients functioning correctly.

## Recovery policy
- Retain the original Worker source and source storage snapshot intact. Do not delete or overwrite any production namespace, routes or secrets during preparation.
- If validation fails, halt all imports/writes and restore from an independently verified source snapshot according to a separately approved rollback plan.
- Never paste live keys into chats, public GitHub commits, browser URLs, screenshots or audit outputs.

## One required authorized action for the real Cloud snapshot
Open VocaBLoom **Settings → Unified Learning Sync → Cloud snapshot (read-only)** and download its JSON using the **production** SYNC_KEY only. Do not click Sync now or Full restore. Save the downloaded file privately, then compare it with the local backup using the offline audit page. A production snapshot cannot be retrieved automatically from GitHub credentials; it requires authorized read access to the live Cloudflare Worker.
