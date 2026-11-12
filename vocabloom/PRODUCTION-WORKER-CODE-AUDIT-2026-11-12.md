# Production Worker code audit — 12 Nov 2026

**Source:** Worker JavaScript provided by the owner from the Cloudflare dashboard in a private conversation. This is a code-level review, not an independently verified production deployment/bindings inventory. The code is **not** being copied into the public repository. No production edits have been made.

## What must be retained
- GET `/` basic status.
- GET `/quiz` and GET `/cards` retrieve Verified Notion database rows, return the same JSON contract and retain the Notion cache behavior.
- POST `/review`, authenticated by `X-Sync-Key`, updates the Notion `Review Step` and `Last review` properties. **This is a separate write route** and must not be lost when modernizing progress sync.
- GET/PUT `/progress/{acc|eco|math|eng|zh}` use the KV binding `PROGRESS` with keys `progress:acc`, `progress:eco`, `progress:math`, `progress:eng` and `progress:zh`.
- `NOTION_TOKEN`, `SYNC_KEY`, CORS origin allowlist and bindings must be preserved or migrated deliberately; never copy secret values into source files.

## Verified behavior of the supplied JavaScript
1. GET of a missing KV key returns `{"updated":0}`. This is a **synthetic response**, not a stored, complete Study/SRS object. A received placeholder alone is not an authoritative KV backup or proof that all global replicas agree.
2. PUT reads request text, parses JSON, adds `updated = Date.now()` and calls `env.PROGRESS.put` **without** `If-Match`, `ETag`, server-side compare-and-swap or atomic revision. It is a last-writer-wins update and can lose study progress from another device.
3. The current production CORS header allows `Content-Type, X-Sync-Key` but does not list `If-Match` or expose `X-Sync-Revision`. CAS-aware clients cannot safely use the existing production PUT as if it were the new Staging Worker.
4. `MAX_PROGRESS_BYTES = 900 * 1024` is checked against JavaScript string length (UTF-16 units), not actual UTF-8 bytes. Staging uses a **350,000-byte** per-subject limit, so real records need size checks before import.
5. The production PUT accepts any JSON whose `updated` property can be assigned; it does not validate the `study`/`srs` schema. Existing values may therefore vary by age or client; validate each stored record, never assume completeness.
6. The same `SYNC_KEY` authorizes remote progress writes **and** Notion review writes. Do not pass it to untrusted pages, test tools or public logs; keep test credentials separate.
7. The supplied code returns an allowed origin string for all CORS responses even when the caller origin is not on the allowlist. Browsers generally refuse to expose such a response to the mismatched origin, but strict origin denial is preferable in a future migration. Do **not** silently change behavior in production during this read-only audit.
8. No source-level admin KV snapshot/export route exists. A browser Cloud snapshot is only five GET requests and is not a server-side namespace backup.

## Interpretation of the archived read-only snapshot
- `acc` includes a full study/SRS object and one quiz-answer entry; preserve it exactly, including metadata and historical timestamps.
- `eco`, `math`, `eng` and `zh` returned exactly `{"updated":0}`. By this Worker code that is its fallback on a null KV GET, **but the administrative source KV namespace must still be checked** before treating those keys as absent.
- All five `revisions` were null, consistent with the supplied Worker not exposing an atomic validator.
- The different local full backup contains 412 Notion vocabulary cards and no saved local answers from that one browser. Do not use those empty local subject stores to overwrite cloud progress.

## Non-destructive verification now available
The repo includes `experiments/study-sync-cas/inspect-legacy-kv.mjs`, which accepts the locally archived cloud snapshot and optionally an **independently acquired** administrative KV manifest. It computes fingerprints/counts and checks missing versus present keys **with no network or writes**. Its output always says production migration is BLOCKED.

For a future administrative KV manifest, record all five exact keys, with the **original JSON string** if the key exists and `null` if a read-only administrative lookup confirms the key is absent. Keep the manifest private. Never publish its contents in GitHub.

## Remaining required gates
1. Confirm Cloudflare production `study-api` bindings and the actual `PROGRESS` namespace ID and deployed version in Settings/Deployments. No changes.
2. Obtain and separately preserve an administrative KV namespace backup; record capture time, namespace identity and hashes.
3. Reconcile the five production API GET payloads against the original KV source values. Treat any mismatch or stale read as BLOCKED.
4. Freeze old writer versions, make a final source capture and recovery plan, and test a **combined** Worker design preserving `/quiz`, `/cards`, `/review`, while moving only progress to CAS-enabled Durable Objects.
5. Verify staging import of real values after admin validation, including legacy placeholders; never normalize them silently. Verify 401/409/428, two-device races, offline behavior and data readback.
6. Obtain explicit authorization for production cutover only after an independently verified rollback path.

**No go:** Do not change current production `study-api` or `PROGRESS` namespace, switch the site's API URL, enable Auto Sync, execute Legacy Sync, or run a migration/import against production during preparation.

## Up-to-date platform references
- [Workers KV concurrent-write behavior](https://developers.cloudflare.com/kv/api/write-key-value-pairs/)
- [Workers KV eventual consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
- [Wrangler read-only KV list/get commands](https://developers.cloudflare.com/workers/wrangler/commands/kv/)
- [Durable Objects transactional storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/)
