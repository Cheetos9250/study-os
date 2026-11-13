# Study OS

Study OS is an academic-focused learning system. Current subjects include Accounting, Economics and Mathematics. Language-learning features are being separated into VocaBloom; existing English/Chinese study paths and user progress must remain compatible during migration.

## Stack (verified from current GitHub repository)

- Static HTML frontend on GitHub Pages
- Notion Verified-data exporter in `scripts/sync_notion.py`
- GitHub Actions workflow `sync.yml` every 15 minutes
- Cloudflare Worker API configured through `data/config.json`
- Existing regression tests in `vocabloom/tests`

## Development rules

- No automatic merge, Production deploy, KV/Notion edits, or secret changes.
- Keep Study OS academic and VocaBloom language-learning scopes distinct.
- Use draft PRs and reviewable offline test evidence for proposed changes.
- This initial Auto Runner is **read-only** and **does not autonomously write code**.
