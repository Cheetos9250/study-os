#!/usr/bin/env python3
"""Pull Verified quiz questions and flashcards from Notion into data/*.json.

Needs env NOTION_TOKEN (a Notion integration shared with both databases).
Only standard library is used.
"""
import json, os, sys, time, datetime, urllib.request, urllib.error

API = os.environ.get("NOTION_API_BASE", "https://api.notion.com").rstrip("/")
VERSION = "2025-09-03"
TOKEN = os.environ.get("NOTION_TOKEN", "").strip()

QUIZ_DS = "21fcc8d7-5e96-4061-a02f-d71fc5705812"
CARDS_DS = "7eb4091a-8830-43de-8185-cd26b65d5ce7"

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
MIN_KEEP = 0.8  # refuse to overwrite if new data has < 80% of the old row count

THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
               "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]


def call(path, body):
    req = urllib.request.Request(
        API + path, data=json.dumps(body).encode(), method="POST",
        headers={"Authorization": "Bearer " + TOKEN,
                 "Notion-Version": VERSION,
                 "Content-Type": "application/json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < 4:
                time.sleep(2 * (attempt + 1))
                continue
            raise SystemExit("Notion API error %s on %s: %s" % (e.code, path, e.read().decode()[:400]))
        except urllib.error.URLError as e:
            if attempt < 4:
                time.sleep(2 * (attempt + 1))
                continue
            raise SystemExit("Network error: %s" % e)


def text(prop):
    """Plain text of any Notion property value."""
    if not prop:
        return ""
    t = prop.get("type")
    v = prop.get(t)
    if t in ("title", "rich_text"):
        return "".join(x.get("plain_text", "") for x in (v or []))
    if t in ("select", "status"):
        return (v or {}).get("name", "")
    if t == "multi_select":
        return ", ".join(x.get("name", "") for x in (v or []))
    if t in ("url", "email", "phone_number"):
        return v or ""
    if t == "number":
        return "" if v is None else str(v)
    if t == "formula":
        f = v or {}
        return str(f.get(f.get("type"), "") or "")
    return ""


def fetch_verified(ds_id):
    rows, cursor = [], None
    while True:
        body = {"page_size": 100,
                "filter": {"property": "Status", "select": {"equals": "Verified"}}}
        if cursor:
            body["start_cursor"] = cursor
        data = call("/v1/data_sources/%s/query" % ds_id, body)
        rows.extend(data.get("results", []))
        if not data.get("has_more"):
            return rows
        cursor = data.get("next_cursor")


def build(rows, fields, need):
    out, seen = [], set()
    for page in rows:
        props = page.get("properties", {})
        r = {f: text(props.get(f)) for f in fields}
        if not all(r.get(k, "").strip() for k in need):
            continue
        r["Status"] = "Verified"
        # Keep the existing 32-hex stable card/quiz ID without exporting direct Notion URLs.
        # A page ID can still be used to construct a URL; this is metadata reduction, NOT access control.
        pid = (page.get("id") or "").replace("-", "").lower()
        if len(pid) != 32 or any(c not in "0123456789abcdef" for c in pid):
            raise SystemExit("Invalid Notion page ID encountered during verified export")
        r["page_id"] = pid
        key = pid
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out


def write_safely(name, rows, dedupe_key=None):
    if dedupe_key:
        seen, uniq = set(), []
        for r in rows:
            k = dedupe_key(r)
            if k in seen:
                continue
            seen.add(k)
            uniq.append(r)
        rows = uniq
    path = os.path.join(DATA_DIR, name)
    old = 0
    if os.path.exists(path):
        try:
            old = len(json.load(open(path, encoding="utf-8")).get("rows", []))
        except Exception:
            old = 0
    if old and len(rows) < old * MIN_KEEP:
        raise SystemExit("REFUSING to overwrite %s: new %d rows vs old %d rows (<%d%%)"
                         % (name, len(rows), old, MIN_KEEP * 100))
    now = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=7)
    payload = {"updated": "%d %s %d" % (now.day, THAI_MONTHS[now.month - 1], now.year),
               "rows": rows}
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)
    print("%s: %d rows (was %d)" % (name, len(rows), old))


def main():
    if not TOKEN:
        raise SystemExit("NOTION_TOKEN is not set")
    quiz = build(fetch_verified(QUIZ_DS),
                 ["Question", "Correct", "Wrong 1", "Wrong 2", "Wrong 3",
                  "Explanation", "Chapter", "Subject"],
                 need=["Question", "Correct", "Chapter", "Subject"])
    write_safely("quiz.json", quiz)
    cards = build(fetch_verified(CARDS_DS),
                  ["Front", "Back", "Chapter", "Ref", "Subject"],
                  need=["Front", "Back", "Chapter", "Subject"])
    write_safely("cards.json", cards,
                 dedupe_key=lambda r: (r["Subject"], r["Chapter"], r["Front"].strip().lower()))


if __name__ == "__main__":
    main()
