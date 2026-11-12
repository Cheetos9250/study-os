# VocaBloom Safe Sync protocol — release and migration guide

Updated: 2026-11-12. **No production Worker deployment or data migration has occurred.**

## What the frontend now does

The existing VocaBloom app and all five legacy Study OS pages have been made compatible with the staging CAS Worker protocol in `experiments/study-sync-cas/`.

- **Versioned Worker**: `GET /progress/{subject}` must return `ETag: "0"` (or another quoted decimal version), exposed to browser JavaScript using `Access-Control-Expose-Headers: ETag`. `PUT` includes `If-Match`. Conflicts HTTP 409 or 412 cause a fresh GET, deterministic merge, and up to six attempts. The app never applies a stale remote snapshot to localStorage after a failed server PUT.
- **Legacy Worker without ETag**: VocaBloom **disables background Auto Sync without writing anything** and explains why. Manual Sync is possible only after a second explicit warning/confirmation, and is **not concurrency-safe**. The five legacy subject pages already require manual click and confirmation for any network progress write; they continue to work in legacy mode.
- **In-flight local updates**: If a learner answers a card while a network PUT is in flight, the clients detect the local record change and, where a versioned Worker exists, refetch and retry rather than overwrite newer local progress.
- **Backup/Restore**: Full backup remains local JSON, never includes the SYNC_KEY. SRS IDs and the stable Notion `page_id` export remain unchanged. LocalStorage remains the immediate persistence layer.
- **Secrets**: `SYNC_KEY` is in request headers/localStorage only; do not include in URLs, logs, screenshots, snapshots or Git commits.

## Read-only remote snapshot in Settings

VocaBloom provides **Cloud snapshot (read-only)** when a SYNC_KEY is configured. The learner must actively click and confirm. It performs five sequential GETs (`/progress/acc`, `eco`, `math`, `eng`, `zh`) and **zero PUTs**. The downloaded JSON contains remote `study` and `srs` data and any exposed ETag revisions, **not** the SYNC_KEY. If any subject fails or returns malformed/oversized data, the app aborts without downloading an incomplete file.

This is separate from **Local backup**: the remote snapshot does not export the browser's unsynced changes or game-only progress. It is **not** an automatic restore mechanism and must not be uploaded wholesale without validation against the actual Worker data contract. Without ETag support the five GETs are not one atomic cross-subject snapshot. Do not save the file on a shared university computer.

## Checks that pass in GitHub Actions

`node --test vocabloom/tests/*.test.cjs` covers safe CAS GET/PUT, 409 conflicts, in-flight edits, legacy auto-disable, explicit legacy consent, server errors, repeat conflicts, all five legacy pages and preexisting progress/backup behavior.

`python3 -m unittest discover -s vocabloom/tests -p 'test_*.py'` validates Notion exports.

**Important: these are fake Worker responses in Node.js, not live Cloudflare tests.** GitHub Pages deployment is not proof of data-sync functionality.

## Real-world cutover is blocked

A safe production rollout cannot proceed until:

1. Retrieve the **actual current production Worker source** for `study-api.kasidit09022550.workers.dev`. The GitHub repository does not contain it. Audit its authentication, CORS, Notion review endpoint, existing `/progress` routes and any other writers.
2. Back up and verify existing server-side study data for `acc`, `eco`, `math`, `eng`, `zh` using an authorized administrative process. Record counts/checksums and recovery steps. Do not use an exported browser dataset as a substitute for server backup.
3. Deploy a **separate** staging Worker named differently from Production with a separate Durable Object namespace, test key and isolated dataset. Run real concurrent two-device tests. Cloudflare SQLite-backed Durable Objects offer transactional, strongly consistent storage, but production behavior must be verified.
4. Test the new ETag and `If-Match` headers through actual browser CORS preflight. Especially ensure `Access-Control-Allow-Headers` lists `If-Match` and `Access-Control-Expose-Headers` lists `ETag`.
5. Plan a **freeze / data-copy / verification / cutover / rollback** procedure to move the current KV progress into SQLite Durable Objects without treating absence of a record as empty progress. Freeze writes during the migration and check all five subjects' data.
6. Verify all legacy HTML pages and VocaBloom have updated after CDN caching, because older clients use unconditional PUT. The CAS Worker prototype deliberately replies 428 to such writes. Old clients must not be silently allowed to overwrite snapshots.
7. Run realistic staging tests: simultaneous writes, offline, 401/409/412/428/500 responses, malformed JSON, changed local progress during PUT, quiz answer timestamp conflicts, and device-day deduplication.
8. Only after authenticated staging QA, a verified backup, and explicit authorization should the live Worker be changed.

## Explicit limitations

- **Legacy manual sync still has a lost-update risk**. It is allowed only because the user deliberately confirms the warning. Prefer Full Backup while the live Worker is legacy.
- Two clients rating the **same** card within one timestamp resolution can still have an ambiguous conflict outcome under last-timestamp-wins. The CRDT/merge policy needs product review if this app becomes multi-user.
- A 32-character Notion `page_id` remains public and reconstructible into a Notion page link; reducing explicit links does not make content private.
- Production Cloud Sync is not marked "ready" until the server migration and live multi-device tests pass.

References: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/ and https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
