# Study API Worker source — read-only recovery capture

Status: **proposed in a draft PR; not deployed or run against Cloudflare**.

The existing Study API at study-api.kasidit09022550.workers.dev has privately audited legacy source, but GitHub does not contain an independently verified copy of the live deployed Worker. Do not redeploy either experimental Worker to replace production. See [Worker audit](../vocabloom/PRODUCTION-WORKER-CODE-AUDIT-2026-11-12.md) and [recovery issue #49](https://github.com/Cheetos9250/study-os/issues/49).

## Scope

- Workflow: .github/workflows/study-worker-source-capture.yml
- Fetch script: scripts/capture-study-worker-source.mjs
- Offline test: tests/study-worker-source-capture.test.mjs
- Manual read-only GET only: downloads current script bytes (including multipart module bundles), active deployment metadata and sanitized version identifiers and code ETags.
- AES-256 GPG encryption before artifact upload; round-trip decryption and byte comparison.
- Only the encrypted archive is stored as a GitHub artifact, for **7 days**. Plaintext intermediate files are removed even after a failure.
- This is a **source archive**, not a database backup, production migration, or proof of restore.

## One-time GitHub setup by owner

Open repository Settings > Secrets and variables > Actions, and configure:

1. **STUDY_CLOUDFLARE_ACCOUNT_ID:** Your Cloudflare account ID (32 hex digits).
2. **STUDY_WORKER_READ_TOKEN:** A dedicated, least-privilege Cloudflare token that can read the Study Worker script and deployment/version metadata. Use the narrowest supported account/Worker scope and Workers Scripts Read / Workers Content Read-Only, plus metadata read only if necessary. Avoid write/admin permissions.
3. **WORKER_BACKUP_PASSPHRASE:** A unique passphrase at least 20 characters long. Save it separately in a password manager; do not reuse Sync or Notion credentials.

Never paste token values or source snapshots into GitHub issues, PR comments, logs, screenshots, Notion or chat.

## Manual execution after separate review and merge

1. On GitHub, open Actions > **Study Worker source snapshot (encrypted, manual, no deploy)**.
2. Select branch main, click Run workflow, and explicitly approve confirm_readonly.
3. If token permissions or preflight fail, stop. Do not replace the dedicated read-only token with an admin token.
4. From the workflow run, download the encrypted study-worker-source artifact to private Files/iCloud Drive. Record the encrypted file SHA-256 from the run summary.
5. On a trusted computer with GnuPG, decrypt the .tar.gz.gpg file to a private .tar.gz and check the source bytes against the SHA-256 recorded in manifest.json. Do not publish plaintext.
6. Keep at least one second encrypted copy before the 7-day GitHub artifact expires.

## Important limitations

The [Cloudflare Worker script download endpoint](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/methods/get/) downloads current script content. [Deployment metadata](https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/deployments/) records the version IDs serving traffic. These are different sources of evidence. **This workflow cannot establish that the downloaded script matches every active version**, especially with traffic splitting or an uploaded-but-not-deployed script.

It does not capture secrets, binding values, PROGRESS KV records, Notion data or persistent history.

Before closing recovery issue #49:
- Independently match source content to each active deployed version and preserve their precise code hashes.
- Privately capture binding names, required secret availability (not values in logs), namespace identity and an administrative KV backup with record verification.
- Test GET /, GET /quiz, GET /cards, POST /review and legacy progress GET/PUT against synthetic/disposable staging state.
- Prove a controlled rollback and obtain authorization before any production cutover.

**This archive reduces the risk of losing all source code. It is not a complete recovery plan.**

## Offline test

Run node --test tests/study-worker-source-capture.test.mjs.

The tests use synthetic responses, with no Cloudflare network access. CI runs those tests on the PR without triggering the manual snapshot.
