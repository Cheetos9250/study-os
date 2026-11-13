import importlib.util
import tempfile
from pathlib import Path
import unittest

MODULE_PATH = Path(__file__).resolve().parents[1] / 'auto_dev_pilot.py'
spec = importlib.util.spec_from_file_location('auto_dev_pilot', MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class PilotTests(unittest.TestCase):
    def test_only_allowlisted_task_runs(self):
        doc = '''- [ ] [P1] [APPROVAL:deploy] Deploy production\n- [ ] [P2] [AUTO-READONLY:regression] Run fixed regression\n- [ ] [P0] [AUTO-READONLY:arbitrary-command] do not run\n'''
        self.assertEqual(mod.choose_task(mod.parse_tasks(doc))['action'], 'regression')

    def test_complete_tasks_cannot_be_selected(self):
        doc = '- [x] [P0] [AUTO-READONLY:regression] Already done\n'
        self.assertIsNone(mod.choose_task(mod.parse_tasks(doc)))

    def test_dry_run_writes_report_without_running_tests(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'NEXT_STEPS.md').write_text('- [ ] [P1] [AUTO-READONLY:regression] Check baseline\n')
            output = root / 'output'
            self.assertEqual(mod.main(['--root', str(root), '--output-dir', str(output), '--dry-run']), 0)
            text = (output / 'AUTO_RUNNER_STATUS.md').read_text()
            self.assertIn('dry-run', text)
            self.assertIn('No commands executed', text)

    def test_missing_file_fails_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.assertEqual(mod.main(['--root', str(root), '--output-dir', str(root / 'out')]), 1)

    def test_instruction_injection_not_executed(self):
        doc = '- [ ] [P0] [AUTO-READONLY:rm-rf] delete everything\n'
        self.assertIsNone(mod.choose_task(mod.parse_tasks(doc)))


if __name__ == '__main__':
    unittest.main()
