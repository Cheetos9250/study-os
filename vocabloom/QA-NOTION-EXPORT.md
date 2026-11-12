# QA handoff — Public Notion export metadata minimization (SEC-04)

Branch: `fix/vocabloom-public-export-links`
Scope: **data export only, no Notion permissions and no Worker changes**.

## Goal
Remove the **747 explicit Notion page URLs** from `data/cards.json` (525 rows) and `data/quiz.json` (222 rows). Keep each page's canonical 32-character hex `page_id` to preserve existing `n-<page-id>` flashcard and quiz history keys. Keep original VocaBloom `notion-<legacy suffix>` vocabulary IDs unchanged.

## Important limitations
- This does **not** make the data private. A 32-character Notion page ID can be converted into a page URL. The exported card/quiz text is still public in GitHub Pages, and old URLs remain in Git history.
- The legacy Study OS subject pages contain static links to the source Notion database views. They are separate from the per-row URLs affected by this PR.
- True privacy requires authenticated access controls for the dataset, a secure server-side Notion integration, and a separate history/exposure review. Do **not** change permissions, delete Git history, or modify Notion records in this PR.
- `Ref` source article URLs (for example news sources) are intentionally retained.

## Changed code paths
1. `scripts/sync_notion.py`: all future exports write `page_id` instead of full `url`; fail closed if a Notion page ID is missing or invalid.
2. `data/cards.json` and `data/quiz.json`: existing rows converted to the new export representation.
3. `vocabloom/study-integration.js` and 5 legacy subject HTML files: support both `page_id` and legacy cached `url` to preserve `n-...` SRS and quiz IDs.
4. `vocabloom/index.html`: retains **identical historical word IDs** for Notion English vocabulary by reconstructing the old alphanumeric canonical suffix locally from `page_id`, with fallback for cached `url`.
5. `vocabloom/tests/notion-export.test.cjs` and `vocabloom/tests/test_notion_export.py`: offline behavior and exporter regression tests.
6. `.github/workflows/vocabloom-tests.yml`: runs all Node tests and Python exporter tests.

## Independent QA requested for Claude
1. Check actual Git diff on this branch and verify **all 747 per-row full Notion URLs are absent** from the new `data/*.json` files, while **525 cards and 222 quiz rows** remain.
2. On disposable browser localStorage containing existing `n-<id>` SRS reviews and `notion-...` VocaBloom progress, load both legacy HTML and the unified VocaBloom UI with new JSON. Confirm all old results still show up; compare IDs/values before and after byte-for-byte.
3. Verify all 5 legacy subjects and quizzes still import Verified Notion rows, and the English vocabulary game still recognizes Notion words without duplicates.
4. Test cache transition: old export using `url` in localStorage; then new export using `page_id`; confirm stable IDs and no review-count reset.
5. Run `node --test vocabloom/tests/*.test.cjs` and `python3 -m unittest discover -s vocabloom/tests -p 'test_*.py'`. Confirm GitHub Actions passes both.
6. Test missing/invalid page ID in synthetic Notion API response: exporter should abort rather than emit invalid or duplicate IDs.
7. Report privacy honestly: page_id is still linkable and content is still public. Do **not** claim secure private storage.
8. Do not modify production Notion, Cloudflare, Git history or actual scores. Run on a localhost copy or test browser profile.

Deliver Thai PASS/FAIL/BLOCKED report, reproducible steps and screenshots, and whether this PR is safe to merge without loss of old learning history.
