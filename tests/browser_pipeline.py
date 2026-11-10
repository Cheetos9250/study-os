"""Run with Python Playwright installed; uses a temporary local HTTP server."""
import functools
import http.server
import json
import sys
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parents[1]
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = 'http://127.0.0.1:%d/' % server.server_port
try:
    with sync_playwright() as p:
        browser = (p.webkit.launch() if '--webkit' in sys.argv else
                   p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox']))
        context = browser.new_context(viewport={'width': 1024, 'height': 1366}, has_touch=True)
        for subject in ['acc', 'eco', 'math', 'eng', 'zh']:
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.route('https://fonts.googleapis.com/**', lambda r: r.abort())
            page.goto(base + subject + '.html', wait_until='networkidle')
            # Use real page metadata to construct matching and foreign fixtures.
            meta = page.evaluate('({subject:SUBJ,chapter:CATS[1][1],key:QKEY})')
            card = dict(Status='Verified', Subject=meta['subject'], Chapter=meta['chapter'], Front='pipeline front', Back='pipeline back', url='https://app.notion.com/p/testcard')
            quiz = dict(card, Question='pipeline question', Correct='yes', **{'Wrong 1': 'no'})
            page.evaluate('rows=>{setExt(rows);setExtQ(rows)}', [card, dict(card, Subject='foreign'), dict(card, Status='Draft')])
            assert page.evaluate("CARDS.filter(c=>String(c.mid).startsWith('n-')).length") == 1
            # Failed quiz fetch still refreshes cards; no dependency on storage writes.
            page.route('**/data/quiz.json', lambda r: r.fulfill(status=500, body='failure'))
            page.route('**/data/cards.json', lambda r: r.fulfill(json={'rows': [card]}))
            page.evaluate('loadStatic()')
            assert page.evaluate("CARDS.some(c=>c.f==='pipeline front')")
            page.unroute('**/data/quiz.json')
            page.route('**/data/quiz.json', lambda r: r.fulfill(json={'rows': [quiz, dict(quiz, Subject='foreign'), dict(quiz, Status='Draft')]}))
            page.evaluate('loadStatic()')
            assert page.evaluate("QS.filter(q=>String(q.id).startsWith('n-')).length") == 1
            page.locator('[data-tab="prac"]').tap()
            page.locator('#qBody .opt').first.tap()
            assert page.locator('#qBody .explain').is_visible()
            # Storage denial (e.g. restricted Safari storage) must not block rendering.
            page.evaluate('''async () => {
                const original=Storage.prototype.setItem;
                Storage.prototype.setItem=()=>{throw new DOMException('blocked','QuotaExceededError')};
                try{ await loadStatic(); }finally{ Storage.prototype.setItem=original; }
            }''')
            assert page.evaluate("QS.some(q=>q.q==='pipeline question')")
            result=page.evaluate('''async () => {
                mcp={callTool:async()=>({payload:{results:[],has_more:true,next_cursor:'repeat'}})};
                try{ await fetchRows(Q_VIEW); return false; }catch(e){return true;}finally{mcp=null;}
            }''')
            assert result, 'partial connector results must not be accepted'
            page.evaluate('localStorage.setItem(QKEY,"broken json")')
            page.route('**/data/quiz.json', lambda r: r.fulfill(status=500))
            page.reload(wait_until='networkidle')
            assert page.evaluate("QS.filter(q=>String(q.id).startsWith('n-')).length === EMBQ.length")
            assert not errors, errors
            print(subject, 'pipeline regression checks passed')
            page.close()
        browser.close()
finally:
    server.shutdown()
