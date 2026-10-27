---
phase: 05-dokploy-deploy-and-cutover
plan: 04
subsystem: infra
tags: [dokploy, cloudflare, ci, manual-deploy, evidence, emdash]

requires:
  - phase: 05-dokploy-deploy-and-cutover
    provides: plan 05-03 evidence rows C1 to C7, smoke-test script, CI guards
provides:
  - the unused deploy pipeline code removed (deploy.yml, dokploy-deploy.mjs and its test), ci.yml intact
  - main fast-forwarded to emdash-migration by the user, ci green on main, main carries only ci.yml, no deploy run exists
  - the manual deploy and rollback rule written in 05-EVIDENCE.md
  - C8, C9 and C10 recorded as PENDING-USER with every verified fact and the unexplained missing cf-ray
affects:
  [05-05 backups fill B1 to B3, a second pass of 05-04 Task 3 closes C8 to C10]

status: partial
plan_head_before: 1661778597317224ba6f7533cab172b91d03766f
plan_head_after: 513e244e46a5bc45e963d5467a2d173158ec397d

actuals:
  tokens: 9000
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "An open evidence row names exactly which user report is missing instead of being marked PASS"

key-files:
  created: []
  modified:
    - .github/workflows/ci.yml
    - .planning/phases/05-dokploy-deploy-and-cutover/05-EVIDENCE.md
  deleted:
    - .github/workflows/deploy.yml
    - scripts/dokploy-deploy.mjs
    - scripts/dokploy-deploy.test.mjs

key-decisions:
  - "Evidence rows C8 to C10 are not written as PASS while the Dokploy Source, SSL/TLS mode, Always Use HTTPS and passkey reports are missing, and while the answer carries no cf-ray header"

patterns-established:
  - "Parity numbers are recorded even when the proxy header is absent, but the row stays open"

requirements-completed: []

duration: n/a
completed: 2026-10-27
---

# Phase 5 Plan 04: Cutover to main and the Cloudflare proxy Summary

**Unused deploy pipeline code removed, main pushed with green ci and a single workflow, and the manual deploy and rollback rule written; the proxy and Dokploy rows stay open for four user reports and one unexplained observation.**

## Status

Partial. Task 1 is done, Task 2 was done by the user and only partly reported, and Task 3 ran with its open rows left open. Plan requirements are not marked complete.

## Accomplishments

- Task 1 (68e380b): removed `.github/workflows/deploy.yml`, `scripts/dokploy-deploy.mjs` and `scripts/dokploy-deploy.test.mjs`; reworded the DEPLOY-02 comment in `ci.yml`. `npm test` reports 51 tests, 0 failures; the smoke test against production passed.
- Verified for C8: origin/main is 68e380b (tip of emdash-migration); main holds only `ci.yml`; ci run 40545555777 for that sha, event push, concluded success with the `emdash migrate --check` and manifest `git diff --exit-code` steps; no run of a workflow named deploy exists; the smoke test passes.
- Verified for C9: the health route returns product emdash, version 1.3.1; smoke passes; the user's OAuth MCP `content_list` on projects returned an item (total 13).
- Measured for C10: `parity: 17/17 identical` and `check: 17/17 passed`, no UNEXPECTED line.
- Task 3 (513e244): added `## Manual deploy and rollback` after the Results table.

## Open items (PENDING-USER)

1. Whether the Dokploy Source section now reads main and the redeploy finished done (C8).
2. The Cloudflare SSL/TLS mode, Full (strict) required (C9).
3. Whether Always Use HTTPS is off (C9).
4. Whether the passkey sign-in worked behind the proxy (C9).

Unexplained observation: `curl -sI https://dev.zeikcookson.com/` carries no cf-ray and no server: cloudflare header although DNS resolves to Cloudflare. The evidence records this without claiming or denying proxying. The D-16 cf-ray check is not met, so C10 cannot be PASS yet.

## Deviations from Plan

### Judgment calls

**1. [Rule 4 adjacent - scope] Task 3 gates not satisfied, rows left open**

- The plan's third verify gate requires C8 to C10 to be PASS and the first gate requires cf-ray. Neither holds, so the gates were not forced; rows are PENDING-USER per the orchestrator's instruction.

**2. Evidence commit made on main**

- The plan says to commit the evidence on main, and the user had already checked out main for Task 2, so the commit 513e244 sits on local main, ahead of origin/main by one commit. Not pushed.

### Auto-fixed Issues

None.

## Not run

The malformed Host check (C7) was not repeated; C7 stands from plan 05-03 and the origin stays reachable directly.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- 68e380b and 513e244 are ancestors of HEAD.
- The three removed files do not exist; `05-EVIDENCE.md` contains the `## Manual deploy and rollback` section, no dash characters and no IPv4 address.
