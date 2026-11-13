# Study OS: encrypted Cloudflare progress KV snapshot

Status: **proposed only**. Do not treat this as a successful production backup; no Cloudflare account access or real data capture has occurred. Related risk: [Issue #49](https://github.com/Cheetos9250/study-os/issues/49) and the [legacy source audit](../vocabloom/PRODUCTION-WORKER-CODE-AUDIT-2026-11-12.md).

## What the proposal does

A deliberately manual, main-branch-only workflow captures the **raw bytes** of the five legacy progress keys from a **specific, owner-selected PROGRESS KV namespace**:

- progress:acc
- progress:eco
- progress:math
- progress:eng
- progress:zh

It reads the exact KV namespace identity first and only makes Cloudflare GET requests. It never imports, writes to KV, modifies Worker code, restores, resets histories, runs a migration, or contacts Notion. It does not use the public Worker endpoint, because a response like {"updated":0} can be the Worker's synthetic fallback rather than a real KV value.

It records value hashes and whether each individual key was fetched. A 404 remains **api_404_unverified**, not proof that a key never existed. It does not merge data, invent progress, or normalize legacy JSON.

The resulting private files are combined into a tar.gz and **encrypted with GPG AES-256 before any GitHub artifact upload**. A round-trip decrypt-and-compare runs on the temporary runner. All plaintext files are deleted in an always-running cleanup step. The only uploaded artifact is encrypted and expires after 7 days.

## Owner setup from GitHub Settings

Settings > Secrets and variables > Actions:

1. **STUDY_CLOUDFLARE_ACCOUNT_ID:** Cloudflare account ID (32 hexadecimal characters).
2. **STUDY_PROGRESS_KV_NAMESPACE_ID:** The verified ID of the production namespace bound to the legacy Worker as PROGRESS (32 hexadecimal characters). Never infer or substitute a staging namespace.
3. **STUDY_KV_READ_TOKEN:** A dedicated Cloudflare token scoped to the selected account and Workers KV Storage Read. Do not grant write, deploy or admin rights.
4. **WORKER_BACKUP_PASSPHRASE:** A unique strong passphrase of at least 20 characters, securely stored outside GitHub. It can reuse the private passphrase used by the separate source-capture workflow if the owner intentionally chooses to manage them together.

Only the owner should configure these secrets. Never send values through chat, PR text, logs, screenshots or public code.

## Manual capture after review and merge

1. Open Actions > Study progress KV snapshot (encrypted, manual, no writes).
2. Select main and tick the explicit confirm_readonly approval.
3. Review the run summary. If namespace verification or any non-404 key GET fails, **do not** treat the run as a backup.
4. Download the encrypted artifact from the completed run and save it to private Files/iCloud Drive or another durable location before it expires in 7 days.
5. On a trusted computer with GnuPG, decrypt and inspect manifest.json and the raw files. Verify their SHA-256 values. Keep a second encrypted copy privately.

## What it does NOT guarantee

- This captures **only five known keys**. Other namespaces, custom progress keys, Notion Review Steps, iPad Safari localStorage, and Study Planner IndexedDB are not included.
- Cloudflare Workers KV is eventually consistent. A single successful API read is a **point-in-time observation**, not an atomic snapshot. Values can change while the workflow runs; 404 observations must be validated against a separate administrative key listing and a second independent read before declaring a key absent.
- The backup cannot itself prove the namespace ID belongs to the active deployed Worker. Independently verify that binding in the Cloudflare dashboard.
- This does not test import/restore. Never overwrite current production history with captured data.
- Encrypted artifacts still require restrictive GitHub repository access and independent storage. Lost encryption passphrases cannot be recovered.

The workflow is for **recovery preparation**, not production migration. Before cutover, reconcile admin KV values with the public Worker GET contract, preserve an independent copy of all live keys, and prove disposable staging recovery.

## Tests

Run node --test tests/study-progress-kv-capture.test.mjs.

The tests use synthetic responses and temporary directories. CI never reads your Cloudflare account.
