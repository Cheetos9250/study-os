# Next steps

1. Confirm Safari on a physical iPad when available, especially safe-area spacing and the sync settings footer. Automated Chromium coverage does not replace this check.
2. Check PR #48 for the current read-only backup release evidence. Verify export/download and file selection on physical iPad Safari using the same browser or Home Screen app as study progress.
3. Keep missing-only restore PR #53 separate until reviewed and tested on a disposable physical-device profile. Never overwrite real progress during QA.

## Release gate for the current fix
Require successful exact-head CI and inspect 320/390px screenshots. After the authorized UI release, verify live HTML/CSS match tested source. The working-branch PR records the live status, release SHA and deployment run so a later agent can check the current state without repeating a release.

Do not touch PR #44 or write production learning data as part of UI verification.
