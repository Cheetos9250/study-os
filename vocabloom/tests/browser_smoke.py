"""Disposable browser QA: all app/content requests fulfilled from this checkout.

Run after installing Playwright and its Chromium/WebKit browsers:
  python3 vocabloom/tests/browser_smoke.py
No live Notion, Worker, KV, secrets, or existing browser profiles are used.
"""
import json
import mimetypes
from pathlib import Path
from urllib.parse import unquote, urlparse

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
ORIGIN = "https://vocabloom.test"
ACADEMIC_KEYS = ["study-" + key for key in ("acc", "eco", "math", "zh")]


def run_case(browser, engine, tablet):
    context = browser.new_context(
        viewport={"width": 820 if tablet else 1440, "height": 1180 if tablet else 1000},
        is_mobile=tablet, has_touch=tablet, service_workers="block",
    )
    unexpected = []
    errors = []
    content = {"refresh": False}

    def route_request(route):
        request = route.request
        url = urlparse(request.url)
        if request.method != "GET":
            unexpected.append(request.method + " " + url.netloc + url.path)
            route.abort()
            return
        if url.netloc == "raw.githubusercontent.com" and url.path == "/Cheetos9250/study-os/main/data/cards.json":
            target = ROOT / "data/cards.json"
        elif url.netloc == "vocabloom.test":
            relative = unquote(url.path).lstrip("/")
            if relative.endswith("/"):
                relative += "index.html"
            target = (ROOT / relative).resolve()
            if not target.is_relative_to(ROOT):
                raise AssertionError("Path outside disposable checkout")
        else:
            # Block external fonts and every real service. No request continues to network.
            if "workers.dev" in url.netloc:
                unexpected.append(request.method + " " + url.netloc + url.path)
            route.abort()
            return
        if target.name == "study-decks.json" and content["refresh"]:
            fixture = json.loads(target.read_text())
            english = next(d for d in fixture["decks"] if d["key"] == "eng")
            english["cards"][0][1] = "changed-word"
            english["cards"][0][2] = "n | เปลี่ยนแล้ว | A changed-word example."
            route.fulfill(body=json.dumps(fixture), content_type="application/json")
        elif target.is_file():
            route.fulfill(body=target.read_bytes(), content_type=mimetypes.guess_type(target)[0] or "application/octet-stream")
        else:
            route.fulfill(status=404, body="Not found in QA checkout")

    context.route("**/*", route_request)
    context.add_init_script("""if(!localStorage.getItem('qa-seeded')){
      for(const key of ['acc','eco','math','zh'])localStorage.setItem('study-'+key,JSON.stringify({ans:{fixture:1},ats:{fixture:1},known:[],rst:0}));
      localStorage.setItem('qa-seeded','1');
    }""")
    page = context.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(ORIGIN + "/vocabloom/")
    page.wait_for_function("USTATE.ready && !notionBusy && USTATE.rows.length > 0")
    # Let the existing one-time legacy bridge settle before checking practice isolation.
    page.wait_for_timeout(700)
    imported = page.evaluate("data.notion.map(w=>({id:w.id,th:w.th,example:w.example}))")
    assert len(imported) >= 570
    assert all(any('\u0e00' <= c <= '\u0e7f' for c in w['th']) for w in imported)
    page.locator('[data-page="studymerge"]:visible').first.click()
    page.locator('[data-action="u-tab"][data-tab="practice"]').click()
    page.wait_for_selector('[data-action="u-practice-answer"]')
    snapshot = page.evaluate("JSON.stringify({...localStorage})")
    first = page.evaluate("uPracticeQuestions(uDeck('eng'))[0]")
    page.locator(f'[data-action="u-practice-answer"][data-answer="{(first["right"] + 1) % 4}"]').click()
    assert page.evaluate("document.activeElement?.classList.contains('notice')"), "Answer feedback lost keyboard focus"
    assert page.get_by_role("button", name="Retry mistakes (1)").is_enabled()
    assert page.get_by_text("Source example", exact=True).is_visible()
    content["refresh"] = True
    page.evaluate("async()=>{await uBoot()}")
    assert page.evaluate("uPracticeQuestions(uDeck('eng'))[0]") == first, "Refresh changed the active question or source explanation"
    content["refresh"] = False
    page.evaluate("async()=>{await uBoot()}")
    assert page.evaluate("JSON.stringify({...localStorage})") == snapshot, "Refresh changed learner storage after original content was restored"
    page.locator('[data-action="u-q-next"]').click()
    assert page.evaluate("document.activeElement?.id === 'u-practice-question'"), "Next should focus the new question"
    second = page.evaluate("uPracticeQuestions(uDeck('eng'))[1]")
    page.locator(f'[data-action="u-practice-answer"][data-answer="{second["right"]}"]').click()
    page.get_by_role("button", name="Retry mistakes (1)").click()
    retry = page.evaluate("uPracticeQuestions(uDeck('eng'))")
    assert retry == [first], "Retry must preserve exact mistaken prompt/options only"
    assert page.evaluate("document.activeElement?.id === 'u-practice-question'"), "Retry should focus its first question"
    assert page.locator("#u-practice-question").inner_text() == first["q"]
    assert page.get_by_role("button", name="Retry mistakes (0)").is_disabled()
    page.get_by_role("button", name="New set", exact=True).click()
    assert page.evaluate("uPracticeQuestions(uDeck('eng')).length") == 10
    assert page.evaluate("document.activeElement?.id === 'u-practice-question'"), "New set should focus its first question"
    page.locator('[data-action="u-cat"][data-cat="e1"]').click()
    assert page.evaluate("uPracticeQuestions(uDeck('eng')).every(q=>q.cat==='e1')")
    assert page.evaluate("JSON.stringify({...localStorage})") == snapshot, "Practice changed persistent storage"
    # Complete a full chapter set in the real DOM, not only in the Node harness.
    chapter_questions = page.evaluate("uPracticeQuestions(uDeck('eng'))")
    assert len(chapter_questions) >= 4
    for i, question in enumerate(chapter_questions):
        page.locator(f'[data-action="u-practice-answer"][data-answer="{question["right"]}"]').click()
        if i + 1 < len(chapter_questions):
            page.locator('[data-action="u-q-next"]').click()
    assert page.get_by_text("Session complete", exact=True).is_visible()
    assert page.locator('.notice[role="status"]').filter(has_text=f"{len(chapter_questions)}/{len(chapter_questions)} correct").is_visible()
    assert page.get_by_role("button", name="Retry mistakes (0)").is_disabled()
    page.get_by_role("button", name="New set", exact=True).click()
    assert page.get_by_text("Session complete", exact=True).count() == 0
    assert page.evaluate("JSON.stringify({...localStorage})") == snapshot, "Completion/new set changed persistent storage"

    academic = page.evaluate("keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]))", ACADEMIC_KEYS)
    page.locator('[data-action="u-tab"][data-tab="cards"]').click()
    page.locator('[data-action="u-mode"][data-mode="browse"]').click()
    card_id = page.evaluate("uCurrent(uDeck('eng')).mid")
    page.locator('[data-action="u-flip"]').click()
    page.locator('[data-action="u-rate"][data-rate="3"]').click()
    schedule = page.evaluate("id=>uReadSrs(uDeck('eng')).s[id]", card_id)
    assert schedule["last"] == 3 and schedule["due"] > schedule["ts"]
    page.reload()
    page.wait_for_function("USTATE.ready && !notionBusy")
    assert page.evaluate("id=>uReadSrs(uDeck('eng')).s[id]", card_id) == schedule
    assert page.evaluate("keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]))", ACADEMIC_KEYS) == academic
    # Full backup and restore use only this disposable browser profile.
    page.locator('[data-page="settings"]:visible').first.click()
    with page.expect_download() as exported:
        page.locator('[data-action="cloud-backup"]').click()
    backup = json.loads(Path(exported.value.path()).read_text())
    assert backup["type"] == "vocabloom-unified-study-backup"
    assert len(backup["subjects"]) == 10
    before_restore = page.evaluate("JSON.stringify({...localStorage})")
    upload = {"name": "synthetic-full-backup.json", "mimeType": "application/json", "buffer": json.dumps(backup).encode()}
    with page.expect_event("dialog") as dialog_event:
        page.locator("#fullRestoreInput").set_input_files(upload)
    dialog_event.value.dismiss()
    assert page.evaluate("JSON.stringify({...localStorage})") == before_restore, "Cancelled restore changed data"
    # Invalid backup structures must fail before confirmation and preserve all browser data.
    for malformed in (
        {**backup, "subjects": []},
        {**backup, "vocabloom": {**backup["vocabloom"], "progress": []}},
        {**backup, "subjects": {k: v for k, v in backup["subjects"].items() if k != "study-eng"}},
    ):
        stable = page.evaluate("JSON.stringify({...localStorage})")
        page.evaluate("""async payload => {
          await cFullRestore({size:1024,text:async()=>JSON.stringify(payload)});
        }""", malformed)
        assert page.evaluate("JSON.stringify({...localStorage})") == stable, "Invalid backup modified browser storage"
        assert page.evaluate("CLOUD.remoteStatus") != "restored locally", "Invalid backup was accepted"
    # Same-device malformed day maps must fail closed without touching progress.
    for key, malformed_value in (("deviceDays", []), ("studyDays", "invalid")):
        malformed = {**backup, "deviceId": page.evaluate("CLOCAL.device"), key: malformed_value}
        stable = page.evaluate("JSON.stringify({...localStorage})")
        page.evaluate("""async payload => {
          await cFullRestore({size:1024,text:async()=>JSON.stringify(payload)});
        }""", malformed)
        assert page.evaluate("JSON.stringify({...localStorage})") == stable, "Malformed daily map modified browser storage"
    # Reject malformed nested daily counters in the real browser restore handler.
    for key, bad_row in (("deviceDays", {"answered": -1}),
                         ("studyDays", {"correct": "invalid"}),
                         ("deviceDays", {"ids": [42]})):
        malformed = {**backup, "deviceId": page.evaluate("CLOCAL.device"),
                     key: {"2026-11-12": bad_row}}
        stable = page.evaluate("JSON.stringify({...localStorage})")
        page.evaluate("""async payload => {
          await cFullRestore({size:1024,text:async()=>JSON.stringify(payload)});
        }""", malformed)
        assert page.evaluate("JSON.stringify({...localStorage})") == stable, "Malformed nested daily row modified storage"
    # Mutate a synthetic record, then restore through the real file input and confirmation.
    page.evaluate("localStorage.setItem('study-acc',JSON.stringify({ans:{changed:2}}))")
    with page.expect_event("dialog") as dialog_event:
        page.locator("#fullRestoreInput").set_input_files(upload)
    dialog_event.value.accept()
    page.wait_for_function("CLOUD.remoteStatus === 'restored locally'")
    assert page.evaluate("JSON.parse(localStorage.getItem('study-acc'))") == backup["subjects"]["study-acc"]
    assert page.evaluate("id=>uReadSrs(uDeck('eng')).s[id]", card_id) == schedule
    # One-shot synthetic quota error during Full Restore must roll back earlier writes.
    before_quota = page.evaluate("JSON.stringify({...localStorage})")
    before_quota_memory = page.evaluate("JSON.stringify({data,CLOCAL:{days:CLOCAL.days,studyDays:CLOCAL.studyDays}})")
    page.evaluate("""() => {
      window.__qaOriginalSetItem = Storage.prototype.setItem;
      window.__qaQuotaFailed = false;
      Storage.prototype.setItem = function(key, value) {
        if(key === 'study-eng' && !window.__qaQuotaFailed) {
          window.__qaQuotaFailed = true;
          throw new DOMException('Synthetic quota failure', 'QuotaExceededError');
        }
        return window.__qaOriginalSetItem.call(this, key, value);
      };
    }""")
    try:
        with page.expect_event("dialog") as quota_dialog:
            page.locator("#fullRestoreInput").set_input_files(upload)
        quota_dialog.value.accept()
        page.wait_for_function("window.__qaQuotaFailed === true")
        page.wait_for_timeout(200)
    finally:
        page.evaluate("""() => {
          Storage.prototype.setItem = window.__qaOriginalSetItem;
          delete window.__qaOriginalSetItem;
        }""")
    assert page.evaluate("JSON.stringify({...localStorage})") == before_quota, "Quota failure did not roll back browser storage"
    assert page.evaluate("JSON.stringify({data,CLOCAL:{days:CLOCAL.days,studyDays:CLOCAL.studyDays}})") == before_quota_memory, "Quota failure did not restore in-memory progress"
    assert not errors, errors
    assert not unexpected, unexpected
    context.close()
    print(json.dumps({"engine": engine, "viewport": "tablet" if tablet else "desktop", "status": "passed", "imported": len(imported), "live_service_requests": 0}))


if __name__ == "__main__":
    with sync_playwright() as playwright:
        for engine in ("chromium", "webkit"):
            browser = getattr(playwright, engine).launch(headless=True)
            try:
                for tablet in (False, True):
                    run_case(browser, engine, tablet)
            finally:
                browser.close()
