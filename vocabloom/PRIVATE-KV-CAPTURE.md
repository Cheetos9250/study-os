# Phase 5: Private KV Capture (browser-assisted, zero network)

This tool supports the owner of VocaBLoom, who already has access to Cloudflare's dashboard and previously created independent local and API Cloud snapshot backups.

## Purpose

Capture **the exact five original KV values** (or verified missing keys) from the namespace bound as `PROGRESS` to the existing production Worker `study-api`. Unlike the API's `{"updated":0}` fallback, a direct KV namespace read can distinguish a missing key from a stored value.

The page **does not connect to Cloudflare**. It never obtains credentials or writes to KV. Browser Content-Security-Policy blocks external connections, and it uses no localStorage, cookies, or analytics.

## Simple workflow

1. In Cloudflare Workers & Pages open `study-api`, select **Settings → Bindings**, and identify the KV Namespace actually bound to variable **PROGRESS**. **Do not select the staging Durable Object.**
2. Open the Cloudflare account's **Storage & Databases → KV** page and select that **same namespace**. This is an account/admin dashboard step, not an API call in the VocaBLoom page.
3. In **KV Pairs**, inspect the precise keys `progress:acc`, `progress:eco`, `progress:math`, `progress:eng`, `progress:zh`. Never add, edit or delete any entry.
4. Open `https://cheetos9250.github.io/study-os/vocabloom/private-kv-capture.html` and enter the checked Namespace ID (32 hex digits).
5. For each key, select **present** and paste the **raw stored JSON value** from the KV dashboard, or select **verified missing** only after confirming its absence in that exact namespace. Never substitute text copied from VocaBLoom's **Cloud snapshot (read-only)** because the production Worker returns synthetic `{"updated":0}` for absent KV keys.
6. Select the **download** control. The file `vocabloom-private-admin-kv-manifest.json` is generated in the current browser; retain privately under **VocaBLoom / Backups** in the user's own Drive.
7. Use the existing offline `experiments/study-sync-cas/inspect-legacy-kv.mjs` against this manifest and the archived Cloud snapshot. Do not post raw JSON to public issues, commits or social media.

## Limits: this is NOT yet a production cutover backup

- **Manual copy verification:** The page cannot independently authenticate the source namespace, source revision or the dashboard's stated result.
- **Not atomic:** The five keys are checked separately. A continuing writer may modify values between copies; KV is eventually consistent and may also serve an older read. A final migration needs a freeze of every writing client, an independently verified server-side namespace export and recovery procedure.
- **Not a full namespace archive:** This tool only captures the five subject keys known from the supplied Worker source; if further production features use other keys, back them up separately through an authorized administrative process.
- **Privacy:** the manifest contains real study progress. Do not commit it to GitHub or share links. If a shared/university PC was used, move the file to the owner's private Drive and clear it from Downloads.
- **No write operations:** No Worker deploy, no `PUT`, no `kv key put`, no `kv key delete`, no Sync Now, no Auto Sync, no restore.
- **Strict cutover gate:** Producing a manifest never authorizes migration. Confirm source data, tested rollback, and preserve Notion `/quiz`, `/cards`, `/review` endpoints before any production switch.

## References

Cloudflare documentation explains where KV namespaces are managed and how bindings work:

- https://developers.cloudflare.com/kv/concepts/kv-namespaces/
- https://developers.cloudflare.com/kv/get-started/
