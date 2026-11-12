"""Offline regression tests for the public Notion export representation."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
import sync_notion  # noqa: E402


class TestNotionExport(unittest.TestCase):
    def page(self, identifier, front):
        return {
            "id": identifier,
            "url": "https://app.notion.com/p/" + identifier.replace("-", ""),
            "properties": {
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


if __name__ == "__main__":
    unittest.main()
