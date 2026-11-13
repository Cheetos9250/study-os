#!/usr/bin/env python3
"""Read-only Study OS pilot runner. Never runs a command from Markdown.

Selects an allowlisted task in NEXT_STEPS.md, runs fixed offline regression
commands, and writes a report + GitHub Actions summary. No network API keys,
GitHub mutations, deploy, or production data writes are involved.
"""

import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import subprocess
import sys

TASK_PATTERN = re.compile(
    r'^\s*-\s*\[\s\]\s*\[(P[0-3])\]\s*\[(AUTO-READONLY|APPROVAL):([a-z0-9_-]+)\]\s*(.+?)\s*$'
)
PRIORITY = {'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3}
# Exact, maintained commands. Markdown never supplies executable arguments.
ALLOWLIST = {
    'regression': [
        ['node', '--test', 'vocabloom/tests/*.test.cjs'],
        [sys.executable, '-m', 'unittest', 'discover', '-s', 'vocabloom/tests', '-p', 'test_*.py'],
    ],
}


def parse_tasks(markdown):
    tasks = []
    for line_number, line in enumerate(markdown.splitlines(), 1):
        match = TASK_PATTERN.match(line)
        if match:
            prio, mode, action, title = match.groups()
            tasks.append({
                'priority': prio,
                'mode': mode,
                'action': action,
                'title': title,
                'line': line_number,
            })
    return sorted(tasks, key=lambda task: (PRIORITY[task['priority']], task['line']))


def choose_task(tasks):
    return next((task for task in tasks
                 if task['mode'] == 'AUTO-READONLY' and task['action'] in ALLOWLIST), None)


def run_checks(root, action, timeout_seconds=240):
    checks = []
    for command in ALLOWLIST[action]:
        # Expand only this known test glob to avoid a shell altogether.
        if command[0] == 'node':
            tests = sorted(str(path.relative_to(root)) for path in
                           (root / 'vocabloom/tests').glob('*.test.cjs'))
            if not tests:
                checks.append({'command': 'node --test', 'status': 'missing-tests'})
                continue
            args = ['node', '--test', *tests]
        else:
            args = command
        try:
            proc = subprocess.run(args, cwd=root, capture_output=True, text=True,
                                  timeout=timeout_seconds, check=False)
            checks.append({
                'command': ' '.join(args[:3]) + (' ...' if len(args) > 3 else ''),
                'status': 'passed' if proc.returncode == 0 else 'failed',
                'return_code': proc.returncode,
                'output_tail': (proc.stdout + '\n' + proc.stderr)[-4000:],
            })
        except (OSError, subprocess.TimeoutExpired) as error:
            checks.append({'command': ' '.join(args[:3]), 'status': 'error',
                           'error': str(error)[:400]})
    return checks


def report_markdown(report):
    task = report['selected_task']
    parts = [
        '# Study OS Auto Runner — read-only pilot',
        '',
        f"- UTC: {report['timestamp_utc']}",
        f"- Overall: **{report['status']}**",
        f"- Selected: {task['title'] if task else 'none (fail closed)'}",
        '- Permissions: ' + 'contents: read' + '; no deploy, Git write, secrets or external API',
        '',
        '## Fixed offline checks',
    ]
    parts.extend(f"- **{item['status']}** — {item['command']}"
                 for item in report['checks'])
    if not report['checks']:
        parts.append('- No commands executed')
    parts += ['', '## Pending manual actions',
              '- AI code generation is not enabled; requires explicit setup and separate credentials.',
              '- Workflow scheduling becomes active only if this PR is approved and merged.', '']
    return '\n'.join(parts)


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path.cwd())
    parser.add_argument('--output-dir', type=Path, default=Path('auto-runner-output'))
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args(argv)
    root = args.root.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    next_steps = root / 'NEXT_STEPS.md'
    if not next_steps.is_file():
        tasks = []
        status = 'blocked-missing-next-steps'
    else:
        tasks = parse_tasks(next_steps.read_text(encoding='utf-8'))
        status = 'pending'
    selected = choose_task(tasks)
    checks = []
    if status != 'blocked-missing-next-steps':
        if selected is None:
            status = 'blocked-no-safe-task'
        elif args.dry_run:
            status = 'dry-run'
        else:
            checks = run_checks(root, selected['action'])
            status = 'passed' if checks and all(c['status'] == 'passed' for c in checks) else 'failed'
    report = {
        'timestamp_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
        'status': status,
        'selected_task': selected,
        'pending_approval': [task for task in tasks if task['mode'] == 'APPROVAL'],
        'checks': checks,
    }
    (output_dir / 'auto-runner-report.json').write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    summary = report_markdown(report)
    (output_dir / 'AUTO_RUNNER_STATUS.md').write_text(summary, encoding='utf-8')
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as stream:
            stream.write(summary + '\n')
    print(summary)
    return 0 if status in ('dry-run', 'passed') else 1


if __name__ == '__main__':
    raise SystemExit(main())
