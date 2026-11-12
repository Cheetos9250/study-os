"""Offline regression tests for the public Notion export representation."""
import sys
import unittest
from unittest.mock import patch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
import sync_notion  # noqa: E402


class TestNotionExport(unittest.TestCase):
    def page(self, identifier, front):
        return {
            "id": identifier,
            "url": "https://app.notion.com/p/" + identifier.replace("-", ""),
            "properties": {
                "Status": {"type": "select", "select": {"name": "Verified"}},
                "Front": {
                    "type": "title",
                    "title": [{"plain_text": front}],
                },
                "Back": {
                    "type": "rich_text",
                    "rich_text": [{"plain_text": "คำแปล"}],
                },
            },
        }

    def test_public_export_uses_stable_page_id_without_direct_url(self):
        page = self.page("01234567-89ab-cdef-0123-456789abcdef", "apple")
        rows = sync_notion.build([page], ["Front", "Back"], ["Front", "Back"])
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["page_id"], "0123456789abcdef0123456789abcdef")
        self.assertNotIn("url", rows[0])
        self.assertEqual(rows[0]["Status"], "Verified")

    def test_duplicate_pages_are_removed_without_changing_id(self):
        identifier = "01234567-89ab-cdef-0123-456789abcdef"
        rows = sync_notion.build(
            [self.page(identifier, "apple"), self.page(identifier, "apple")],
            ["Front", "Back"],
            ["Front", "Back"],
        )
        self.assertEqual(len(rows), 1)

    def test_invalid_ids_fail_closed(self):
        with self.assertRaises(SystemExit):
            sync_notion.build(
                [self.page("invalid", "apple")], ["Front", "Back"], ["Front", "Back"]
            )

    def test_draft_and_missing_status_are_never_published(self):
        for status in ("Draft", None):
            with self.subTest(status=status):
                page = self.page("01234567-89ab-cdef-0123-456789abcdef", "apple")
                if status is None:
                    del page["properties"]["Status"]
                else:
                    page["properties"]["Status"]["select"]["name"] = status
                self.assertEqual(
                    sync_notion.build([page], ["Front", "Back"], ["Front", "Back"]),
                    [],
                )

    def test_pagination_rejects_empty_or_repeated_cursor(self):
        for cursor in (None, ""):
            with self.subTest(cursor=cursor):
                with patch.object(sync_notion, "call", return_value={
                    "results": [], "has_more": True, "next_cursor": cursor
                }):
                    with self.assertRaises(SystemExit):
                        sync_notion.fetch_verified("synthetic-data-source")

        with patch.object(sync_notion, "call", side_effect=[
            {"results": [], "has_more": True, "next_cursor": "same"},
            {"results": [], "has_more": True, "next_cursor": "same"},
        ]):
            with self.assertRaises(SystemExit):
                sync_notion.fetch_verified("synthetic-data-source")

    def test_valid_pagination_keeps_verified_query_filter(self):
        with patch.object(sync_notion, "call", side_effect=[
            {"results": ["page-1"], "has_more": True, "next_cursor": "next"},
            {"results": ["page-2"], "has_more": False},
        ]) as call:
            self.assertEqual(
                sync_notion.fetch_verified("synthetic-data-source"),
                ["page-1", "page-2"],
            )
            self.assertEqual(
                call.call_args_list[0].args[1]["filter"],
                {"property": "Status", "select": {"equals": "Verified"}},
            )
            self.assertEqual(call.call_args_list[1].args[1]["start_cursor"], "next")


if __name__ == "__main__":
    unittest.main()
