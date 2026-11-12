# VocaBLoom isolated staging gate

Status: PREPARATION ONLY — no Cloudflare resources created or deployed.

## Isolation requirements
- Use a separate Cloudflare Worker named `vocabloom-staging`, never the production Worker.
- Use a separate SQLite-backed Durable Object namespace/class migration using the existing `experiments/study-sync-cas/wrangler.jsonc` prototype; do not bind production Durable Objects, D1, KV, R2, or real Notion tokens.
- Use a staging-only secret `SYNC_KEY`; never reuse a real user key.
- Staging hostnames and route patterns must not overlap production.
- Never place secrets in repository files, build logs, screenshots, or PR comments.

## Deployment gate
1. Confirm actual Worker source, route configuration, and D1 schema before writing deployment automation.
2. Create staging resources only after explicit approval.
3. Apply Durable Object class migrations only to the separately named staging Worker and namespace.
4. Verify missing/invalid key => denied, test key => accepted, production key => denied.
5. Test all five subjects, failed writes, retries, and concurrent updates using synthetic data.
6. Verify no production or real Notion requests occurred.
7. Run staging smoke tests and collect redacted logs.
8. Keep production Cloud Sync blocked until SY-08 lost-update prevention and SY-LIVE pass.

## Current blockers
- SY-08: concurrent GET/PUT can lose updates. Implement server-side optimistic concurrency (revision + If-Match) or atomic merge, then verify collision behavior.
- SY-LIVE: no isolated live staging verification.
- SEC-04: public Notion page URLs exported in JSON; review schema without changing stable card IDs.

## Rollback
- Stop staging deploy/traffic; retain staging data for diagnosis.
- Do not modify production bindings, credentials, or scores.
