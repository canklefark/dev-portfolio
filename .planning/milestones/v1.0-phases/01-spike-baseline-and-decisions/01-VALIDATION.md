---
phase: "1"
slug: spike-baseline-and-decisions
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-23"
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Framework**          | None in the repo. Build and CLI assertions; Node's built-in `node --test` only if a script gets unit tests |
| **Config file**        | none - Wave 0 adds `scripts/script-inventory.mjs`, `.npmrc`, `.nvmrc`, `Dockerfile`, `.dockerignore`       |
| **Quick run command**  | `npm run build && node scripts/script-inventory.mjs compare <baseline>/inventory.json dist/client`         |
| **Full suite command** | `npm ci && npx astro check && npm run build`, then the Docker build/run/fetch block                        |
| **Estimated runtime**  | ~30 s quick, ~3 min full (first Docker build)                                                              |

---

## Sampling Rate

- **After every task commit:** build plus inventory compare
- **After every plan wave:** add `astro check` and Docker build/run/fetch
- **Before `/gsd-verify-work`:** all rows green, PROJECT.md decisions present, no stray `data/` or `.emdash/migrations.json` in `git status`
- **Max feedback latency:** 180 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type   | Automated Command                                                                                          | File Exists | Status   |
| ------- | ---- | ---- | ----------- | ---------- | --------------- | ----------- | ---------------------------------------------------------------------------------------------------------- | ----------- | -------- |
| 1-XX-XX | -    | -    | FOUND-02    | -          | N/A             | smoke       | `node --test scripts/parity.test.mjs` and `npm run check:public-js` (17/17 routes PASS, owner-run 2026-10-28) | ✅          | ✅ green |
| 1-XX-XX | -    | -    | FOUND-01    | -          | N/A             | unit        | `node --test scripts/node-floor.test.mjs` (astro 6.4, emdash 1.3, @astrojs/node standalone, react 19)      | ✅          | ✅ green |
| 1-XX-XX | -    | -    | FOUND-01    | -          | N/A             | integration | `node --test scripts/parity.test.mjs scripts/check-public-js.test.mjs`; `npm run check:public-js`          | ✅          | ✅ green |
| 1-XX-XX | -    | -    | FOUND-01    | -          | N/A             | manual      | Docker build/run/fetch, setup status, `emdash migrate --check` in container (see Manual-Only)              | n/a         | manual   |
| 1-XX-XX | -    | -    | FOUND-04    | -          | N/A             | unit        | `node --test scripts/node-floor.test.mjs` (`engines.node` is `>=22.22.2`; `.nvmrc` 24; `engine-strict=true`; Dockerfile `NODE_VERSION` 24) | ✅ | ✅ green |
| 1-XX-XX | -    | -    | FOUND-04    | -          | N/A             | manual      | `docker build --build-arg NODE_VERSION=<floor> .` then fetch routes (see Manual-Only)                      | n/a         | manual   |
| 1-XX-XX | -    | -    | FOUND-03    | -          | N/A             | manual      | grep PROJECT.md for each Spike Findings decision row                                                       | n/a         | manual   |

_Status: ✅ green · ❌ red · ⚠️ flaky · manual (see Manual-Only)_

---

## Wave 0 Requirements

- [x] `scripts/script-inventory.mjs` - modes `capture`, `compare`, `fetch`
- [x] `~/portfolio-baseline/<date>/` - baseline captured from `main` before any dependency change
- [x] `.npmrc`, `.nvmrc`, `Dockerfile`, `.dockerignore`, `src/live.config.ts`
- [x] No test runner install for this phase

---

## Manual-Only Verifications

| Behavior                                 | Requirement | Why Manual                    | Test Instructions                                                                                                                           |
| ---------------------------------------- | ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Docker build, run and fetch of all 17 routes; setup status; `emdash migrate --check` in container | FOUND-01 | Needs a Docker daemon | `docker build -t portfolio:spike .`, run, fetch routes and compare. Evidence in 01-03 and 01-04 SUMMARYs |
| Docker build on the Node floor version | FOUND-04 | Needs a Docker daemon | `docker build --build-arg NODE_VERSION=<floor> .` then fetch routes. Evidence in 01-03 and 01-04 SUMMARYs |
| Two passkeys enrolled and recovery drill | FOUND-03 | Needs a browser authenticator | Enroll two passkeys against `astro preview` with `EMDASH_SITE_URL` set, sign in with each, then run the recovery SQL drill from RESEARCH.md. Only rehearsed locally in Phase 1; the two-passkey requirement was dropped for production on 2026-10-27 (ADMIN-03) |
| Decisions written to PROJECT.md          | FOUND-03    | Prose judgment                | Check each Spike Findings row exists with evidence                                                                                          |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 180s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-10-28
