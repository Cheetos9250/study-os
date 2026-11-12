# VocaBLoom Phase 5 — Data integrity and production audit gate

Updated: 2026-11-12. **Production cutover is BLOCKED. Do not change the live Worker.**

## Verified already
- A local-only VocaBLoom full backup was supplied by the owner and stored privately in their Primary Google Drive under VocaBLoom / Backups. This contains Notion vocabulary and on-device subject stores; it does not prove anything about production KV data.
- The isolated staging Worker study-api-cas-staging-only was tested in the browser. The synthetic CAS probe passed 200/409 collision, retry preservation, and 428 legacy write rejection. This does not verify real data migration.
- The repo has a read-only **Cloud snapshot (read-only)** button in VocaBLoom → Settings → Unified Learning Sync. It sends five authenticated GETs, no PUT. The output uses the vocabloom-cloud-readonly-snapshot format.
- The owner supplied the complete-looking production Worker JavaScript separately for an offline code audit on 12 Nov 2026. The supplied code is **not committed here** and is not an independently verified deployment/bindings inventory. See PRODUCTION-WORKER-CODE-AUDIT-2026-11-12.md for the safe route/storage summary.

## No-credential, no-network audit page
- Open vocabloom/migration-audit.html on project GitHub Pages.
- Select the local full backup JSON file and then the production Cloud snapshot JSON downloaded from the existing Settings button.
- The audit page uses a restrictive CSP with no network connections. It reads both files **only in the browser**, checks format/subjects/revisions and summarizes per-subject counts. Its downloadable audit contains metadata, hashes and counts only, **not** vocabulary, answers, device IDs or SYNC_KEY.
- It deliberately reports BLOCKED_FOR_PRODUCTION_MIGRATION even after two valid backups; this is an integrity preflight, not migration authorization.
- Keep both original JSON files private. Do not commit them or send them to the public GitHub repo.

## Missing gates before any production Worker deployment
1. Confirm the owner-supplied production Worker code corresponds to the **currently deployed revision** and read the actual Cloudflare routes/bindings (including KV namespace and Notion integration) without changing the deployed code. Store securely, not in a public PR if it contains credentials.
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


## Legacy production Cloud snapshot compatibility

Read-only snapshots captured from a legacy Worker can contain an exact object of the form `{"updated":0}` for a subject that has not been populated through the API. This is **metadata-only**, not an explicitly verified blank Study/SRS record. The browser's local backup may be empty while an individual cloud subject contains answers; both originals must be retained.

The offline audit page labels `{"updated":0}` as `legacy-metadata-only`, shows counts as **unknown** rather than zero, and keeps the production cutover gate **BLOCKED**. The strict staging importer still rejects incomplete source records; no automatic normalization or import is approved. Source schema and administrative server-side backup must be reviewed first. Never overwrite a populated subject with local defaults solely because a different device reports zero entries.

The Production Worker has no verified `X-Sync-Revision` or strong `ETag` on any of the five subjects in the latest read-only snapshot. Continuing to press manual Legacy Sync can overwrite remote data; do not enable it during migration preparation.


## Status after owner-provided production Worker audit (12 Nov 2026)

The supplied Worker source confirms that progress GET reads `PROGRESS.get("progress:"+subject)`, falling back to `{"updated":0}` when the returned KV value is null; PUT is an unconditional `PROGRESS.put` and lacks any CAS validator. The existing `/quiz`, `/cards` and Notion-mutating `/review` endpoints must be preserved in a future combined Worker. Source-level review alone does not prove which KV namespace ID is bound to the currently deployed Worker.

Use the **read-only**, offline `experiments/study-sync-cas/inspect-legacy-kv.mjs` gate for a comparison against a separately captured administrative KV manifest. Do not normalize metadata-only placeholders into empty progress objects. A verified server-side backup and explicit cutover approval are still required.


## Offline comparison of Cloud snapshot and administrative KV capture

The owner now has a private capture page at `vocabloom/private-kv-capture.html`. It guides a read-only check of the `PROGRESS` KV namespace's exact `progress:acc`, `progress:eco`, `progress:math`, `progress:eng`, `progress:zh` keys in the Cloudflare Dashboard. An independent administrative lookup is essential: the production Worker synthetically returns `{"updated":0}` when a KV lookup is null.

The first-party `vocabloom/migration-audit.html` page can now accept three private local files:
1. Local full backup from the learner's browser.
2. Read-only Cloud snapshot with the five API GET responses.
3. Optional private administrative KV capture manifest produced from the actual bound KV namespace, not from the API fallback.

All comparison occurs within the browser and the page uses a CSP with `connect-src 'none'`, never connects to Cloudflare, and never uploads progress or keys. The report contains only format checks, per-subject statuses, file checksums and aggregate counts. It checks KV key absence versus present raw JSON, detects API mismatches, and refuses to mark a *stored* metadata-only payload as stageable. Even if all five KV entries match, the status stays `BLOCKED_FOR_PRODUCTION_MIGRATION` until writers are frozen, a server-side backup is independently verified, and the production migration + rollback procedure is approved.

Cloudflare documents navigation via **Workers KV → target namespace → KV Pairs**. Never use Add entry, Edit, Delete or other mutation buttons while capturing these values. A manual five-key export is NOT an atomic/simultaneous snapshot and is NOT a substitute for a separate administrative namespace backup.


## Phase 5 staging preview — private/offline, not a deployment

The owner archived two backups in a private Google Drive folder: a VocaBLoom browser backup and a read-only Cloud API snapshot. A separately downloaded original production KV value for `progress:acc` was compared to its Cloud API snapshot and matched; a screenshot of the admin KV Pairs UI listed one key, but this **does not replace** independently marking all five keys as present/absent in a final administrative capture.

A future staging preview requires a **manually verified** `vocabloom-production-kv-capture-v1` manifest containing the true bound Namespace ID and exact five key states from the production Cloudflare KV UI. The generated preview is refused unless the manifest and Cloud API snapshot agree on all five subjects. A source key marked absent can be translated to an empty staging schema **only if** (a) that absence was confirmed in the KV UI and (b) the API returned the exact synthetic `{"updated":0}` fallback. A present key with incomplete progress remains BLOCKED.

Two equivalent **offline only** preparation options are available:

- Open `vocabloom/migration-audit.html` in the browser, select Local Backup, Cloud Snapshot and Private KV Capture. Only after a complete match, the page enables **Download staging preview (private)**. The CSP blocks all network access; no credentials are requested, and no Worker writes are possible.
- On a private machine with Node.js 22+, run `node experiments/study-sync-cas/prepare-staging-preview.mjs --cloud /private/cloud.json --kv-manifest /private/kv.json --output /private/staging-preview.json`. It rejects invalid/mismatched/incomplete values and refuses to write data inside the public repository. Output file creation is exclusive with private permissions. Its status `STAGING_PREVIEW_READY_NOT_DEPLOYED` does **not** authorize production cutover.

The resulting artifact is shaped for the existing `import-staging.mjs` validation, but **do not run the import/apply operation** until isolated staging has been independently backed up, the original KV keys have been reconfirmed, and the owner has approved a specific staging-only import. The staging Worker has no Notion read/review endpoints; it is not a drop-in replacement for production `study-api`.

No Cloudflare network request, Worker deploy or Production KV mutation occurs during the preview.


## iPad/browser workflow for downloaded KV original

The owner already downloaded the raw `progress:acc` object from the Cloudflare `study-progress` namespace and stored the original privately in Google Drive under `VocaBLoom / Backups / Cloudflare KV Originals`.

To minimize manual JSON copying, `vocabloom/private-kv-capture.html` accepts an **on-device file selection** for each verified-present subject. The page does **not** access Google Drive accounts itself; the user opens/downloads the file through their device Files/Drive picker. An original Cloudflare file named `progress_acc` (no extension) or a renamed `progress-acc-kv-original-YYYY-MM-DD.json` is accepted for subject `acc`. Wrong-subject file names, malformed JSON, over-limit values and files containing credential fields are rejected. The original bytes of the JSON text remain unchanged inside the private output manifest. The page has no network connections or remote-write controls.

The remaining four subjects are **not** silently filled in: the user must select `confirmed absent` for each after reading the `KV Pairs` list for the correct bound namespace. The user must copy the 32-character namespace **ID** from the Cloudflare namespace Settings page (this is an identifier, not a secret). Until that evidence and all five selections are present, the form refuses to produce a capture manifest. The old Dashboard screenshot is a historical read and does not make the export atomic. The last direct admin check and freeze still remain before any staging import.

No production data, Worker, KV namespace, or secret values were modified by this file-picker enhancement.
