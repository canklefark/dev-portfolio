---
phase: 05-dokploy-deploy-and-cutover
plan: 01
subsystem: infra
tags: [github-actions, dokploy, smoke-test, node-test, deploy]

requires:
  - phase: 03-read-path-rewire-and-parity
    provides: check-public-js.mjs conventions (crawl pattern, string-or-null result, exit codes) and the scripts/*.test.mjs npm test glob
provides:
  - scripts/smoke-test.mjs, GUARD-03 smoke check with an exported check(base) and a retrying CLI
  - scripts/dokploy-deploy.mjs, D-04 trigger-and-wait with exported deploy(options) and latestDeployment(body)
  - .github/workflows/deploy.yml, CI-gated deploy that runs trigger-and-wait then smoke, no rollback
  - node:test suites for both scripts, including a deploy-then-smoke chain test
affects:
  [
    05-03 real-panel verification of Dokploy list order and status values,
    05-04 first real deploy and secrets,
  ]

plan_head_before: dc5a7714077fe00c63efb07fea08dbc4a163196c
plan_head_after: 978b34ae5a90a304e6373b1cbeec88218945498a

actuals:
  tokens: 7750
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "CLI scripts guard their entry with import.meta.url === pathToFileURL(process.argv[1]).href so tests can import the exported function"
    - "Tests that spawn a CLI use async spawn with a promise on close, because the fake servers live in the test process"
    - "Secrets reach scripts only through step-level env; scripts never print headers, keys or response bodies"

key-files:
  created:
    - scripts/smoke-test.mjs
    - scripts/dokploy-deploy.mjs
    - scripts/smoke-test.test.mjs
    - scripts/dokploy-deploy.test.mjs
    - .github/workflows/deploy.yml
  modified: []

key-decisions:
  - "The trigger-and-wait logic lives in a tested Node script instead of inline curl and jq, so the assumed Dokploy response shape (A1, A2) is unit-tested now"
  - "The deploy job runs only for a successful push-triggered ci run on main of this repository, or a dispatch on main (T-05-01)"
  - "No package installed: both scripts use only node: built-ins"

patterns-established:
  - "String-or-null check result with PASS/FAIL final line and exit 0, 1, 2 (inherited from check-public-js, reused by both new scripts)"

requirements-completed: [GUARD-03]

coverage:
  - id: D1
    description: "smoke-test.mjs passes only when /, /projects/ and the first linked project page answer 200 with no redirect, retries on failure, exits 2 on bad arguments"
    requirement: GUARD-03
    verification:
      - kind: unit
        ref: "scripts/smoke-test.test.mjs (9 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "dokploy-deploy.mjs triggers application.deploy and exits 0 only after a newer deployment is done; error, cancelled, timeout and refused key fail; no POST when the list cannot be read; https enforced; key never printed"
    requirement: GUARD-03
    verification:
      - kind: unit
        ref: "scripts/dokploy-deploy.test.mjs (9 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "deploy.yml structure: workflow_run after ci on main plus dispatch, hardened job condition, no persisted credentials, secrets only in the deploy step env, deploy then smoke as the last steps, no rollback"
    requirement: GUARD-03
    verification:
      - kind: other
        ref: "node -e js-yaml structure check from 05-01-PLAN.md Task 1 verify"
        status: pass
    human_judgment: false
  - id: D4
    description: "The assumed Dokploy list order and status values (A1, A2) match the real panel, and the workflow runs green on GitHub"
    requirement: GUARD-03
    verification: []
    human_judgment: true
    rationale: "The real panel and GitHub runners are never contacted in this plan; plan 05-03 exercises the API and plan 05-04 makes the first real run"

duration: 3min
completed: 2026-10-27
status: complete
---

# Phase 5 Plan 1: Deploy pipeline repo half Summary

**A CI-gated GitHub Actions deploy that triggers Dokploy application.deploy through a tested Node script, waits for a newer deployment to reach done, then smoke-checks /, /projects/ and the first project page, with no rollback and the API key never printed.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-10-27T11:51:00Z
- **Completed:** 2026-10-27T11:54:05Z
- **Tasks:** 2
- **Files modified:** 5 (all created)

## Accomplishments

- GUARD-03 has a smoke check that treats any 3xx as a failure (`redirect: "manual"`), crawls the project link from the live /projects/ body, and retries network errors so a cold container does not crash it.
- D-04 has a trigger-and-wait script that records the newest deployment before the POST and only accepts a different, newer one, so it cannot pass against the old container.
- deploy.yml cannot reach the Dokploy secrets from a pull request or a fork run.
- The tracer gate passed: the workflow structure check, the deploy-then-smoke chain test and strict tsc all passed before Task 2 started.
- `npm test`: 182 tests, 182 pass, 0 fail (18 of them new).

## Task Commits

1. **Task 1: Tracer, deploy.yml to dokploy-deploy.mjs to smoke-test.mjs on one happy path** - `e4e6165` (feat)
2. **Task 2: Failure modes for both scripts** - `978b34a` (test)

**Plan metadata:** recorded in the docs(05-01) commit that follows this file.

## Exported Signatures

```js
// scripts/smoke-test.mjs
export async function check(base)            // (string) => Promise<string | null>
// scripts/dokploy-deploy.mjs
export function latestDeployment(body)       // (unknown) => { id: string, status: string } | null
export async function deploy(options)        // ({ url, apiKey, appId, intervalMs, timeoutMs }) => Promise<string | null>
```

## Exact Reason Texts

smoke-test.mjs `check`:

- `<path> answered <status>` (for example `/ answered 500`, `/ answered 301`, `/projects/alpha/ answered 500`)
- `no project link on /projects/`
- `<path> request failed: <error message>`

CLI lines: `smoke-test: attempt <i>/<n> failed: <reason>` for every failed attempt, then `smoke-test: PASS` or `smoke-test: FAIL (<reason>)`. Exit 0, 1, or 2 (usage line on stderr).

dokploy-deploy.mjs `deploy`:

- `deployment <id> ended with status <status>` (error or cancelled)
- `timed out after <timeoutMs> ms waiting for a new deployment` plus ` (last seen: <id> <status>)` when one was seen
- `deployment.all answered <status>` and `application.deploy answered <status>`
- `deployment.all did not return a deployment list`
- `deployment.all request failed: <message>` and `application.deploy request failed: <message>`

CLI lines: `dokploy-deploy: newest deployment before the trigger: <id or none>`, `dokploy-deploy: deploy requested`, `dokploy-deploy: deployment <id> is <status>` on each change, then `dokploy-deploy: PASS` or `dokploy-deploy: FAIL (<reason>)`. Exit 2 for a missing variable (names only on stderr), a plain http `DOKPLOY_URL` outside 127.0.0.1, localhost and ::1 (no request made), or bad flags.

## deploy.yml Job Condition (as written)

```yaml
if: >-
  (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main') ||
  (github.event.workflow_run.conclusion == 'success' &&
  github.event.workflow_run.event == 'push' &&
  github.event.workflow_run.head_branch == 'main' &&
  github.event.workflow_run.head_repository.full_name == github.repository)
```

Trigger: `workflow_run` of `[ci]`, `types: [completed]`, `branches: [main]`, plus `workflow_dispatch`. Concurrency group `deploy`, `cancel-in-progress: false`. `permissions: contents: read`, `timeout-minutes: 30`, checkout with `persist-credentials: false`, setup-node from `.nvmrc` with no cache and no install step. Last two steps: `node scripts/dokploy-deploy.mjs` (step env from the three `DOKPLOY_*` secrets) then `node scripts/smoke-test.mjs https://dev.zeikcookson.com`.

## Files Created/Modified

- `scripts/smoke-test.mjs` - GUARD-03 check plus retrying CLI
- `scripts/dokploy-deploy.mjs` - Dokploy trigger-and-wait, list parser and CLI
- `scripts/smoke-test.test.mjs` - 9 node:test cases against a local node:http site
- `scripts/dokploy-deploy.test.mjs` - 9 node:test cases against a fake Dokploy API, including the deploy-then-smoke chain
- `.github/workflows/deploy.yml` - the CI-gated deploy workflow

## Decisions Made

- `deploy()` distinguishes an empty list (valid, a new application has no deployments) from an unreadable body (a failure) through an internal `readLatest` that returns `undefined`, `null` or a deployment. The exported `latestDeployment` maps both non-deployment cases to `null` as the contract requires.
- A status missing from a list item is read as `unknown` and keeps the wait going.
- The project page checked is the first slug in document order on /projects/, using the crawl pattern from check-public-js.mjs.

## Deviations from Plan

None - plan executed exactly as written.

Notes that are not deviations:

- Task 2 is marked `tdd="true"`, but Task 1 already implemented both scripts to the full interfaces contract (the plan told Task 1 to write the scripts "exactly to the contract"). All 14 new tests therefore passed on their first run, with no RED phase and no script change in Task 2. The commit is `test(05-01)` only.
- A formatter hook reformatted `dokploy-deploy.mjs` after the first write, and `npx prettier --write` was run on the two test files before the Task 2 commit. No behavior change.
- `.planning/PROJECT.md`, `config.json`, `milestone.lock`, `research/` and `state.json` were already untracked before this plan and were left alone.

## Issues Encountered

None.

## Risks for Later Plans

- A non-2xx answer from `deployment.all` during the wait returns immediately as a failure, per the plan's contract. If Dokploy briefly answers 502 while it restarts its own services mid-deploy, the run would go red on a healthy deploy. Plan 05-03 runs the script against the real panel and will show whether this happens; if it does, tolerate non-2xx polling answers until the timeout.
- The Dokploy list order and status values (A1, A2) are handled tolerantly (newest by `createdAt`, any unknown status keeps waiting) but remain unverified against the real panel.
- Cloudflare bot protection on a proxied hostname could return 403 to the GitHub runner and fail the smoke test (research Pitfall 7); production DNS is planned DNS-only in 05-04.
- The three repository secrets `DOKPLOY_URL`, `DOKPLOY_API_KEY` and `DOKPLOY_APP_ID` do not exist yet; the user sets them in plans 05-03 and 05-04.

## Known Stubs

None.

## Threat Flags

None. The new surface (workflow_run trigger with secrets, API key over the network, public job logs) is the surface already covered by T-05-01 to T-05-05 in the plan's threat model.

## Verification Results

- `node --test scripts/dokploy-deploy.test.mjs scripts/smoke-test.test.mjs`: 18 tests, 18 pass
- deploy.yml structure check (js-yaml, command from the plan): exit 0
- Strict tsc on the four scripts and tests: exit 0
- All 14 behavior titles and 4 Task 1 titles present in their test files
- `npm test`: 182 tests, 182 pass, 0 fail
- Both scripts start with `// @ts-check` and a usage comment, import only `node:` built-ins
- No push, no workflow dispatch, no real Dokploy call, no dev server; every server in the tests is on 127.0.0.1

## Self-Check: PASSED

- FOUND: scripts/smoke-test.mjs, scripts/dokploy-deploy.mjs, scripts/smoke-test.test.mjs, scripts/dokploy-deploy.test.mjs, .github/workflows/deploy.yml
- FOUND commits: e4e6165, 978b34a (both ancestors of HEAD)
