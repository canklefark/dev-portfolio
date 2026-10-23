---
phase: 01-spike-baseline-and-decisions
plan: 03
subsystem: infra
tags: [docker, node24, sqlite, engine-strict, nvmrc, npmrc, parity]

requires:
  - phase: 01-spike-baseline-and-decisions
    provides: "script-inventory compare and check (plan 01-01); EmDash stack with baked ./data paths on the Node standalone adapter (plan 01-02)"
provides:
  - "Multi-stage Dockerfile (base, build, prod-deps, runtime) with ARG NODE_VERSION=24, WORKDIR /app, VOLUME /app/data, USER node, port 4321"
  - ".dockerignore with explicit names only (secrets, git, planning, tooling, local data)"
  - "scripts/script-inventory.mjs fetch subcommand for HTTP parity against a running server"
  - "engines.node >=22.22.2 in package.json and the lockfile root, .npmrc engine-strict=true, .nvmrc 24"
  - "Evidence under ~/portfolio-baseline/current/spike/: docker-build-node24.log, docker-node24.txt, docker-node24-final.txt, docker-node22.txt, docker-node20-reject.log, docker-node22-reject.log, engine-strict-node20.txt, fetched-node24/, fetched-node24-final/, fetched-node22/"
affects: [01-05, phase-05]

actuals:
  tokens: 965
  tasks: 2
  commits: 3
plan_head_before: 9d34799e6009f426f5ff5a7654ebb48fc8307293
plan_head_after: 6927ba5bdc49a380f7a89dbff4bdb44aae6b815c

tech-stack:
  added: []
  patterns:
    - ".npmrc is copied onto the same COPY line as package.json and package-lock.json in both dependency stages, so engine-strict holds for every npm ci in the image"
    - "Container paths (WORKDIR /app plus VOLUME /app/data) match the build-baked relative database and uploads paths"
    - "Spike containers are published on 127.0.0.1 only and removed with their volumes right after the checks"

key-files:
  created:
    - Dockerfile
    - .dockerignore
    - .npmrc
    - .nvmrc
  modified:
    - scripts/script-inventory.mjs
    - package.json
    - package-lock.json

key-decisions:
  - "User decision A at the Task 2 checkpoint: raise the Node floor from the planned 22.16.0 to >=22.22.2. Cause: @emdash-cms/registry-verification@0.3.4 requires node ^22.22.2 || ^24.15.0 || >=26, so an image on Node 22.16.0 failed npm ci under engine-strict with EBADENGINE."
  - ".npmrc is copied into the Docker dependency stages so the floor is a hard error inside image builds, not a warning"

patterns-established:
  - "Floor proof from both sides: the lowest allowed version builds and serves 17/17 identical pages, the next lower supported major is refused with EBADENGINE locally and in Docker"

requirements-completed: [FOUND-01, FOUND-04]

coverage:
  - id: D1
    description: "A Node 24 image builds locally and serves all 17 routes identical to the baseline over HTTP"
    requirement: FOUND-01
    verification:
      - kind: other
        ref: "docker-node24.txt and docker-node24-final.txt: 17 FETCH lines (16 at 200, /404 at 404) and 'compare: 17/17 identical'; node_version=v24.22.1"
        status: pass
    human_judgment: false
  - id: D2
    description: "EmDash creates its SQLite file on the /app/data volume inside the container, reports needsSetup true, and migrate --check exits 0, running as user node with no .env, .git or .planning in /app"
    requirement: FOUND-03
    verification:
      - kind: other
        ref: "docker-node24.txt: user=node, data_dir=emdash.db emdash.db-shm emdash.db-wal, setup_status needsSetup true, migrate_check_exit=0 (Pending: none), app_listing '. .. .emdash data dist node_modules package.json'"
        status: pass
    human_judgment: false
  - id: D3
    description: "package.json and the lockfile root require node >=22.22.2, .npmrc sets engine-strict=true, .nvmrc is 24, and both Docker dependency stages copy .npmrc"
    requirement: FOUND-04
    verification:
      - kind: other
        ref: "plan verify command printed VERIFY_OK; git diff of package-lock.json at commit 6927ba5 is the root engines line only (22.12.0 to 22.22.2 across the plan, no dependency version moved)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Node 20 is refused with EBADENGINE both locally and inside an image build"
    requirement: FOUND-04
    verification:
      - kind: other
        ref: "engine-strict-node20.txt (Required >=22.22.2, Actual node v20.20.2, exit=1) and docker-node20-reject.log (EBADENGINE at npm ci in the prod-deps stage, build_exit=1)"
        status: pass
    human_judgment: false
  - id: D5
    description: "An image built with NODE_VERSION=22.22.2 installs under engine-strict and serves the same 17 pages"
    requirement: FOUND-04
    verification:
      - kind: other
        ref: "docker-node22.txt: node_version=v22.22.2, compare: 17/17 identical, setup_status needsSetup true, sqlite_warning=present"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-10-23
status: complete
---

# Phase 1 Plan 3: Node 24 Container and the Node 22.22.2 Floor Summary

**Multi-stage Node 24 image serving 17/17 baseline-identical pages on a volume-backed EmDash SQLite file, with engines >=22.22.2 enforced through engine-strict in npm and in the image, proven by a Node 22.22.2 image that passes and Node 20 that is refused**

## Performance

- **Duration:** about 45 min across the original run and this continuation
- **Completed:** 2026-10-23
- **Tasks:** 2 (1 tracer, 1 auto) plus one human decision checkpoint
- **Files modified:** 4 created and 3 modified in the repo, plus evidence files outside it

## Accomplishments

- `fetch BASE_URL BASELINE_DIST_DIR OUT_DIR` in `scripts/script-inventory.mjs` takes the route list from the baseline, requests `/404` via an unmatched path expecting 404, writes bodies to the baseline's relative paths and finishes with `compare`. No dependency was added.
- The Dockerfile builds on `node:${NODE_VERSION}-alpine` (default 24), runs `npm ci` and `npm run build` in a build stage, `npm ci --omit=dev` in a prod-deps stage, and assembles a runtime stage owned by `node` with `data` and `node_modules/.astro` writable. `VOLUME /app/data` matches the baked `file:./data/emdash.db` and `./data/uploads` paths.
- Task 1 evidence (Node 24, v24.22.1): 17/17 identical, `user=node`, `emdash.db` plus `-shm` and `-wal` under `/app/data`, `needsSetup` true, `migrate_check_exit=0` with "Pending: none", image 661MB arm64, and an app listing with no `.env`, `.git` or `.planning`.
- Floor raised to `>=22.22.2`: `package.json`, the lockfile root, `.npmrc` (`engine-strict=true`) and `.nvmrc` (`24`). The Dockerfile now copies `.npmrc` with the manifests in both dependency stages.
- Local Node 24 proof after the change: `npm ci` 0, `npm run build` 0, compare 17/17 identical, check 17/17 passed. The rebuilt default image gave 17/17 identical again (`docker-node24-final.txt`, v24.22.1), so Node 24 still passes.
- Rejection side: Node 20.20.2 fails `npm ci` with EBADENGINE locally (`Required: {"node":">=22.22.2"}`) and inside `docker build --build-arg NODE_VERSION=20 --target prod-deps`, which exits 1 at `npm ci`.
- Acceptance side: `docker build --build-arg NODE_VERSION=22.22.2` succeeds, and the container reports `node_version=v22.22.2`, 17/17 identical, `needsSetup` true and `sqlite_warning=present` (the expected Node 22 SQLite ExperimentalWarning, research Pitfall 9).
- No `pf-spike`, `pf-spike22` container or `pf-spike*-data` volume remains. The images `portfolio:spike` and `portfolio:spike22` stay as local layer cache.

## Decision Checkpoint (Task 2)

The first Task 2 attempt used the planned floor of 22.16.0. The 22.16.0 image failed `npm ci` under engine-strict with EBADENGINE because `@emdash-cms/registry-verification@0.3.4` requires `^22.22.2 || ^24.15.0 || >=26.0.0` while the container had v22.16.0 (log kept as `docker-node22-reject.log`). Per the plan's prohibition on silently changing the floor, execution stopped and returned a checkpoint. The user chose option A, raise the floor to `>=22.22.2`. The orchestrator updated the plan documents (commit `e0dc5cf`), and this continuation applied the new floor to `package.json` and the lockfile and reran the proofs with `NODE_VERSION=22.22.2`.

## Task Commits

1. **Task 1: Node 24 container and HTTP parity fetch** - `9f541ba` (feat)
2. **Task 2: Enforce the Node 22.22.2 floor** - `6927ba5` (feat)

The measured commit count of 3 includes `e0dc5cf`, the orchestrator's docs commit that records the user's floor decision. **Plan metadata:** recorded in the docs commit that follows this summary.

## Files Created/Modified

- `Dockerfile` - four-stage Node image with `ARG NODE_VERSION=24`, `.npmrc` copied into both dependency stages
- `.dockerignore` - explicit exclusions, no markdown rule, no `src/content` entry
- `.npmrc` - `engine-strict=true`
- `.nvmrc` - `24`
- `package.json`, `package-lock.json` - `engines.node` `>=22.22.2` (lockfile change is the root engines line only)
- `scripts/script-inventory.mjs` - `fetch` subcommand

## Decisions Made

- Floor is `>=22.22.2` (user decision A), which is also EmDash's own floor and the lowest version `@emdash-cms/registry-verification@0.3.4` accepts on the 22 line.
- `.npmrc` is shipped into the Docker build so the floor is enforced in images, not only on a developer machine.
- Phase 5 inherits the container layout: WORKDIR `/app`, volume at `/app/data`, port 4321, `EMDASH_SITE_URL` supplied at run time.

## Deviations from Plan

### Auto-fixed Issues

None. The floor change was a plan-level user decision recorded above, not an auto-fix.

**Total deviations:** 0 auto-fixed. One checkpoint resolved with the user's decision (floor 22.16.0 to 22.22.2). Impact: the plan's acceptance criteria now read 22.22.2 and all pass.

## Authentication Gates

None.

## Issues Encountered

- Two shell commands that redirected Node 20 `npm ci` output straight into `~/portfolio-baseline/current/spike/` were denied by the permission layer. The same check was run with output captured in the session scratchpad, and its verbatim output was saved to `engine-strict-node20.txt` with the file-write tool. The run itself (Node v20.20.2, EBADENGINE, exit 1) is real; only the way the file was written differs. No permission setting was changed.
- The scratch directory for the Node 20 check lived in the session scratchpad rather than `mktemp -d`, so the repo's `node_modules` was never touched.
- `npm install --package-lock-only` printed the known audit summary (the four residual advisories from plan 01-02) and moved no dependency version.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-01-10 was covered by `.dockerignore` and an app listing free of `.env`, `.git` and `.planning`; T-01-11 by `user=node`; T-01-12 by loopback-only publishing and immediate removal of containers and volumes; T-01-13 by `emdash.db` appearing under `/app/data`; T-01-14 by the Node 20 refusals, and T-01-SC by official `node` images and `npm ci` from the committed lockfile with no new package.

## User Setup Required

None.

## Next Phase Readiness

- Plan 01-05 has container-side evidence for the Node 24 decision (v24.22.1 serves 17/17 identical with `migrate --check` 0) and for the Node 22.22.2 floor, plus the cause of the floor change for the decision record. FOUND-03 stays pending until that plan finishes.
- Phase 5 can reuse the Dockerfile as written; it must supply `EMDASH_SITE_URL` and mount a volume at `/app/data`.

## Self-Check: PASSED

- FOUND: `Dockerfile`, `.dockerignore`, `.npmrc`, `.nvmrc`, `package.json`, `package-lock.json`, `scripts/script-inventory.mjs`
- FOUND: `docker-node24.txt`, `docker-node24-final.txt`, `docker-node22.txt`, `docker-node20-reject.log`, `docker-node22-reject.log`, `engine-strict-node20.txt` in `~/portfolio-baseline/current/spike/`
- FOUND commits on HEAD: `9f541ba`, `6927ba5`
- Verified at the end: plan verify command VERIFY_OK, local compare 17/17 identical, no `pf-spike*` container or volume

---

_Phase: 01-spike-baseline-and-decisions_
_Completed: 2026-10-23_
