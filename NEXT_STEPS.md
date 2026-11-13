# Next steps

1. Confirm Safari on a physical iPad when available, especially safe-area spacing and the sync settings footer. Automated Chromium coverage does not replace this check.
2. Review pending backup/restore PRs #48/#53 independently before any learning-data operation. They are not part of this UI release.

## Release gate for the current fix
Require successful exact-head CI and inspect 320/390px screenshots. After the authorized UI release, verify live HTML/CSS match tested source. The working-branch PR records the live status, release SHA and deployment run so a later agent can check the current state without repeating a release.

Do not touch PR #44 or write production learning data as part of UI verification.
