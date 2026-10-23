---
phase: "1"
slug: spike-baseline-and-decisions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-23"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Framework**          | None in the repo. Build and CLI assertions; Node's built-in `node --test` only if a script gets unit tests |
| **Config file**        | none — Wave 0 adds `scripts/script-inventory.mjs`, `.npmrc`, `.nvmrc`, `Dockerfile`, `.dockerignore`       |
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type   | Automated Command                                                                                             | File Exists | Status     |
| ------- | ---- | ---- | ----------- | ---------- | --------------- | ----------- | ------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 1-XX-XX | —    | —    | FOUND-02    | —          | N/A             | smoke       | `find ~/portfolio-baseline/<date>/dist -name '*.html' \| wc -l` (expect 17); inventory has 17 routes          | ❌ W0       | ⬜ pending |
| 1-XX-XX | —    | —    | FOUND-01    | —          | N/A             | smoke       | `npm ls astro @astrojs/node @astrojs/react emdash react --depth=0`                                            | n/a         | ⬜ pending |
| 1-XX-XX | —    | —    | FOUND-01    | —          | N/A             | integration | `npm run build && node scripts/script-inventory.mjs compare <baseline>/inventory.json dist/client` exits 0    | ❌ W0       | ⬜ pending |
| 1-XX-XX | —    | —    | FOUND-01    | —          | N/A             | integration | `docker build -t portfolio:spike .`, run, fetch all 17 routes and compare                                     | ❌ W0       | ⬜ pending |
| 1-XX-XX | —    | —    | FOUND-01    | —          | N/A             | smoke       | `curl -s localhost:4400/_emdash/api/setup/status` succeeds; `emdash migrate --check` exits 0 in the container | n/a         | ⬜ pending |
| 1-XX-XX | —    | —    | FOUND-04    | —          | N/A             | smoke       | `engines.node` is `>=22.16.0`; `.nvmrc` is `24`; Node 20 install fails with EBADENGINE                        | ❌ W0       | ⬜ pending |
| 1-XX-XX | —    | —    | FOUND-04    | —          | N/A             | integration | `docker build --build-arg NODE_VERSION=22.16.0 .` then fetch routes                                           | n/a         | ⬜ pending |
| 1-XX-XX | —    | —    | FOUND-03    | —          | N/A             | manual      | grep PROJECT.md for each Spike Findings decision row                                                          | n/a         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `scripts/script-inventory.mjs` — modes `capture`, `compare`, `fetch`
- [ ] `~/portfolio-baseline/<date>/` — baseline captured from `main` before any dependency change
- [ ] `.npmrc`, `.nvmrc`, `Dockerfile`, `.dockerignore`, `src/live.config.ts`
- [ ] No test runner install for this phase

---

## Manual-Only Verifications

| Behavior                                 | Requirement | Why Manual                    | Test Instructions                                                                                                                           |
| ---------------------------------------- | ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Two passkeys enrolled and recovery drill | FOUND-03    | Needs a browser authenticator | Enroll two passkeys against `astro preview` with `EMDASH_SITE_URL` set, sign in with each, then run the recovery SQL drill from RESEARCH.md |
| Decisions written to PROJECT.md          | FOUND-03    | Prose judgment                | Check each Spike Findings row exists with evidence                                                                                          |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 180s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
