---
phase: 05-dokploy-deploy-and-cutover
plan: 05
subsystem: infra
tags: [dokploy, cloudflare-r2, volume-backup, restore, sqlite, evidence]

requires:
  - phase: 05-dokploy-deploy-and-cutover
    provides: plan 05-04 cutover, proxy and evidence rows C1 to C10, smoke-test script
provides:
  - nightly Dokploy volume backup of portfolio-data to the private R2 bucket portfolio-backups, with the app stopped during the copy
  - one backup restored into the new volume portfolio-restore-test and a scratch app that matched production on doctor and three page hashes
  - the scratch app and volume discarded (user's report), production smoke test passing after the drill
  - 05-EVIDENCE.md complete (13 result rows, Manual deploy and rollback, Named gates a to i, Not covered)
  - PROJECT.md (untracked, edited on disk only) with Phase 5 dispositions of gates c, d and i and the one-passkey outcome
affects: [phase 06, verify-work for phase 05]

status: complete
plan_head_before: 543a174ade25311675507e708f9322835d7ef50d
plan_head_after: 596db6c9506b53ccb68b80cf2e568cbf35062aaa

actuals:
  tokens: 6500
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A restore rehearsal compares doctor output and page hashes between the production and scratch containers, with the scratch app given no domain"

key-files:
  created: []
  modified:
    - .planning/phases/05-dokploy-deploy-and-cutover/05-EVIDENCE.md
    - .planning/PROJECT.md

key-decisions:
  - "B1 and B3 were recorded PARTIAL and NOT REPORTED until the user supplied the backup size, the saved schedule and the discard confirmation, then flipped to PASS; the deletion is attributed to the user's report, not verified by the executor"
  - "Gate (c) is recorded as read: arctic is a direct dependency of emdash and @oslojs/encoding also appears under astro, so the plan's wording of only under @emdash-cms/auth was corrected to the emdash 1.3.1 dependency tree"

patterns-established:
  - "An evidence row stays open and names the missing user report instead of being marked PASS"

requirements-completed: [DEPLOY-05]

duration: n/a
completed: 2026-10-28
---

# Phase 5 Plan 05: Backup and Restore to R2 Summary

**A whole-volume Dokploy backup of the production SQLite and uploads went to a private R2 bucket, restored into a new volume, booted a scratch app with identical `emdash doctor` output and three matching page hashes, and was discarded without disturbing production.**

## Performance

- **Tasks:** 2 of 2
- **Commits:** 3 (evidence only, no code changed)
- **Executor-side work:** record the user's observations, read gate (c) versions, run the smoke test, edit PROJECT.md on disk. Every panel, bucket and host step was the user's.

## Accomplishments

- **B1 PASS.** Run log of 2026-10-28: app scaled to 0 replicas, tar of ./, ./emdash.db, ./emdash.db-wal and ./emdash.db-shm, file `portfolio-data-2026-10-28T12-20-34-866Z.tar`, upload to S3 done, app back to 1 replica. Object size 6.09 MB (user's report). Schedule `0 3 * * *` saved on the Volume Backup (user's report). Retention was not stated and is recorded as the Dokploy default, not reported. The object key is `dev-portfolio-app-waklhr/portfolio-data-2026-10-28T12-20-34-866Z.tar`, so Dokploy used its app-name folder and not the prefix `portfolio` the plan asked for.
- **B2 PASS.** Restore went into the new volume `portfolio-restore-test`. The scratch app `portfolio-scratch` (no domain) booted on it. `emdash doctor --database ./data/emdash.db` printed identical lines in scratch and production: database ok, migrations 90 applied none pending, collections 4 defined, datetime storage canonical (UTC), users 1, all checks passed. Hashes for `/`, `/projects/` and `/about/` were equal in both and none was the empty-page hash.
- **B3 PASS.** The user reported the scratch app deleted and `docker volume rm portfolio-restore-test` run. The executor did not verify the deletion. The executor ran `node scripts/smoke-test.mjs https://dev.zeikcookson.com --attempts 3 --delay-ms 5000` after the drill and it printed `smoke-test: PASS`.
- **Named gates and Not covered** written, covering gates (a) to (i). PROJECT.md records the Phase 5 dispositions of gates (c), (d) and (i) and the one-passkey Outcome, and stays untracked.

## Task Commits

1. **Task 1 (tracer): backup, restore, scratch comparison, discard** - `5eded3e` (B1 PARTIAL, B2 PASS, B3 not reported), then `596db6c` (B1 and B3 PASS after the user's size, schedule and discard reports)
2. **Task 2: named gates, Not covered, PROJECT.md** - `f30bc9e`

## Decisions Made

- B1 and B3 were not recorded as PASS until the missing reports arrived. This follows the plan's rule that PASS needs observed facts.
- Gate (c) uses the versions actually read: arctic 3.7.0, @oslojs/crypto 1.0.1 (1.0.0 under @oslojs/webauthn) and @oslojs/encoding 1.1.0, inside the emdash 1.3.1 dependency tree; none is in the portfolio package.json.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Gate (c) wording corrected to what npm ls shows**

- **Found during:** Task 2
- **Issue:** The plan said the packages sit only under @emdash-cms/auth. `npm ls` shows arctic as a direct dependency of emdash and @oslojs/encoding also under astro.
- **Fix:** The Named gates bullet and the PROJECT.md disposition state the observed tree.
- **Files modified:** 05-EVIDENCE.md, PROJECT.md
- **Commit:** f30bc9e

### Observations that differ from the plan's expectations

- The object prefix is Dokploy's app-name folder, not `portfolio`.
- The first S3 destination test returned 403 AccessDenied; the user fixed the destination form and the cause was not reported.
- The first Restore Volume attempt failed with `tar: Is a directory` because the folder was selected instead of the .tar object. Recorded in B2 and in Not covered.
- The default-branch commit guard was not applicable: the plan and dispatch direct commits on local `main`, so commits were made there. `config.json` was not changed.

## Auth gates

None met by the executor. The R2 key and secret were entered by the user in Dokploy only and never seen.

## Known Stubs

None.

## Threat Flags

None. The plan's register covers the bucket, scratch app and restore surfaces.

## Issues Encountered

None beyond the observations above. `npm test`: 51 tests, 0 failures.

## Next Phase Readiness

Phase 5 evidence is complete and ready for `/gsd-verify-work`. Open items live in the Not covered section: the first Let's Encrypt renewal behind the proxy (about 2026-12-26), the one-passkey lockout risk, no alert on a failed nightly backup, and an unrehearsed rollback.

## Self-Check: PASSED

- 05-EVIDENCE.md, PROJECT.md (untracked) and this file exist.
- Commits 5eded3e, f30bc9e and 596db6c are ancestors of HEAD.
