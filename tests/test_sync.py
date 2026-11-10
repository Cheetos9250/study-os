import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('sync', Path(__file__).parents[1] / 'scripts/sync_notion.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class SyncTests(unittest.TestCase):
    def test_verified_filter_and_pagination(self):
        with patch.object(sync, 'call', side_effect=[{'results': [1], 'has_more': True, 'next_cursor': 'next'}, {'results': [2], 'has_more': False}]) as call:
            self.assertEqual(sync.fetch_verified('ds'), [1, 2])
            self.assertEqual(call.call_args_list[0].args[1]['filter'], {'property': 'Status', 'select': {'equals': 'Verified'}})
            self.assertEqual(call.call_args_list[1].args[1]['start_cursor'], 'next')

    def test_invalid_cursor_fails_closed(self):
        for cursor in [None, 'repeat']:
            with self.subTest(cursor=cursor), patch.object(sync, 'call', return_value={'results': [], 'has_more': True, 'next_cursor': cursor}):
                with self.assertRaises(SystemExit):
                    sync.fetch_verified('ds')

    def test_build_filters_and_deduplicates(self):
        def row(status, front='hello'):
            return {'id': 'aa-bb', 'properties': {'Status': {'type': 'select', 'select': {'name': status}}, 'Front': {'type': 'title', 'title': [{'plain_text': front}]}}}
        result = sync.build([row('Draft'), row('Verified', ''), row('Verified'), row('Verified')], ['Front'], ['Front'])
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['url'], 'https://app.notion.com/p/aabb')
        self.assertEqual(result[0]['Status'], 'Verified')

    def test_shrink_guard_and_card_dedup(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(sync, 'DATA_DIR', tmp):
            path = Path(tmp) / 'cards.json'
            sync.write_safely('cards.json', [{'Front': str(i)} for i in range(10)])
            before = path.read_bytes()
            with self.assertRaises(SystemExit):
                sync.write_safely('cards.json', [{'Front': 'only'}])
            self.assertEqual(path.read_bytes(), before)
            sync.write_safely('cards.json', [{'Front': str(i)} for i in range(10)] * 2, lambda r: r['Front'])
            self.assertEqual(len(json.loads(path.read_text())['rows']), 10)
