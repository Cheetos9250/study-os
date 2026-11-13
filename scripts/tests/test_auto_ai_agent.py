import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

MODULE_PATH = Path(__file__).resolve().parents[1] / "auto_ai_agent.py"
spec = importlib.util.spec_from_file_location("auto_ai_agent", MODULE_PATH)
agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)


class AutoAIAgentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for relative in agent.ALLOWED_FILES:
            candidate = self.root / relative
            candidate.parent.mkdir(parents=True, exist_ok=True)
            candidate.write_text("pass\n" if relative.endswith(".py") else "# Pilot\n")
        (self.root / "NEXT_STEPS.md").write_text(
            "- [ ] [P1] [AUTO-AI:runner-regression] improve tests\n"
        )

    def tearDown(self):
        self.temp.cleanup()

    def test_task_selection_is_explicit(self):
        self.assertEqual(
            agent.select_task((self.root / "NEXT_STEPS.md").read_text()),
            "runner-regression",
        )
        with self.assertRaises(agent.ProposalError):
            agent.select_task("- [ ] [P0] [AUTO-AI:deploy] run production\n")
        with self.assertRaises(agent.ProposalError):
            agent.select_task("- [x] [P1] [AUTO-AI:runner-regression] completed\n")

    def test_path_traversal_is_blocked(self):
        with self.assertRaises(agent.ProposalError):
            agent.validate_proposal({
                "summary": "unsafe",
                "edits": [{"path": "../data/config.json", "content": "oops"}],
            }, self.root)

    def test_symlink_is_blocked(self):
        target = self.root / "docs/AUTO_RUNNER_PILOT.md"
        target.unlink()
        target.symlink_to(self.root / "NEXT_STEPS.md")
        with self.assertRaises(agent.ProposalError):
            agent.safe_path(self.root, "docs/AUTO_RUNNER_PILOT.md")

    def test_duplicate_edits_and_nonexistent_paths_blocked(self):
        payload = {"summary": "test", "edits": [
            {"path": "scripts/auto_dev_pilot.py", "content": "a = 2\n"},
            {"path": "scripts/auto_dev_pilot.py", "content": "a = 3\n"},
        ]}
        with self.assertRaises(agent.ProposalError):
            agent.validate_proposal(payload, self.root)

    def test_invalid_python_rejected(self):
        with self.assertRaises(agent.ProposalError):
            agent.validate_proposal({
                "summary": "invalid",
                "edits": [{"path": "scripts/auto_dev_pilot.py", "content": "def oops(\n"}],
            }, self.root)

    def test_one_request_api_needs_key(self):
        with self.assertRaises(agent.ProposalError):
            agent.call_gemini("hello", "")

    def test_plan_and_apply_fixture_without_api(self):
        output = self.root / "out" / "proposal.json"
        called = []
        def fake_model(prompt, api_key):
            called.append(api_key)
            self.assertIn("runner-regression", agent.TASKS)
            self.assertIn("scripts/auto_dev_pilot.py", prompt)
            return {"summary": "Add deterministic marker",
                    "edits": [{"path": "scripts/auto_dev_pilot.py", "content": "SAFE = True\n"}]}
        result = agent.plan(self.root, output, "test-key", api_call=fake_model)
        self.assertEqual(called, ["test-key"])
        self.assertEqual(result["summary"], "Add deterministic marker")
        self.assertEqual((self.root / "scripts/auto_dev_pilot.py").read_text(), "pass\n")
        applied = agent.apply(self.root, output)
        self.assertEqual(applied["summary"], "Add deterministic marker")
        self.assertEqual((self.root / "scripts/auto_dev_pilot.py").read_text(), "SAFE = True\n")
        self.assertEqual(json.loads(output.read_text())["task_id"], "runner-regression")

    def test_overlarge_edits_rejected(self):
        with self.assertRaises(agent.ProposalError):
            agent.validate_proposal({
                "summary": "huge",
                "edits": [{"path": "docs/AUTO_RUNNER_PILOT.md",
                           "content": "A" * (agent.MAX_FILE_CHARS + 1)}],
            }, self.root)


if __name__ == "__main__":
    unittest.main()
