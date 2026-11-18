## 2026-11-18 (basics: sync, content check, tap targets)
- Cloud sync now also carries **Pomodoro history** (`studyos.pomolog.v1`) and the **JE Drill score** (`studyos.jedrill.v1`), inside the `home` document as `home._pomolog` / `home._jedrill`. No Worker redeploy is needed. Counts from two devices add up against the last synced base and are never double counted. Today and JE Drill push changes; JE Drill refreshes after a sync.
- Content check before the finals: all 840 multiple-choice questions in Accounting (Ch5–9, 490 in scope), Economics and Math pass checks for structure (answer index, empty or duplicate options, explanation present) and for the arithmetic in their explanations (290 equations). A hand review of 45 random Ch5–9 accounting questions found no errors.
- Bigger tap targets on iPad: Excel step checkboxes, Back up / Restore page links, and Mistakes page links (now buttons).
- Tests: tests/cloud-sync-pomolog-jedrill.test.cjs.
