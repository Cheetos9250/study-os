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
        if target.is_file():
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
    assert page.get_by_role("button", name="Retry mistakes (1)").is_enabled()
    page.locator('[data-action="u-q-next"]').click()
    second = page.evaluate("uPracticeQuestions(uDeck('eng'))[1]")
    page.locator(f'[data-action="u-practice-answer"][data-answer="{second["right"]}"]').click()
    page.get_by_role("button", name="Retry mistakes (1)").click()
    retry = page.evaluate("uPracticeQuestions(uDeck('eng'))")
    assert retry == [first], "Retry must preserve exact mistaken prompt/options only"
    assert page.locator("#u-practice-question").inner_text() == first["q"]
    assert page.get_by_role("button", name="Retry mistakes (0)").is_disabled()
    page.get_by_role("button", name="New set", exact=True).click()
    assert page.evaluate("uPracticeQuestions(uDeck('eng')).length") == 10
    page.locator('[data-action="u-cat"][data-cat="e1"]').click()
    assert page.evaluate("uPracticeQuestions(uDeck('eng')).every(q=>q.cat==='e1')")
    assert page.evaluate("JSON.stringify({...localStorage})") == snapshot, "Practice changed persistent storage"

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
