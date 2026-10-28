---
phase: 01-spike-baseline-and-decisions
verified: 2026-10-23T21:30:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - .dockerignore
  - .gitignore
  - .npmrc
  - .nvmrc
  - .planning/phases/01-spike-baseline-and-decisions/01-01-PLAN.md
  - .planning/phases/01-spike-baseline-and-decisions/01-01-SUMMARY.md
  - .planning/phases/01-spike-baseline-and-decisions/01-02-PLAN.md
  - .planning/phases/01-spike-baseline-and-decisions/01-02-SUMMARY.md
  - .planning/phases/01-spike-baseline-and-decisions/01-03-PLAN.md
  - .planning/phases/01-spike-baseline-and-decisions/01-03-SUMMARY.md
  - .planning/phases/01-spike-baseline-and-decisions/01-04-PLAN.md
  - .planning/phases/01-spike-baseline-and-decisions/01-04-SUMMARY.md
  - .planning/phases/01-spike-baseline-and-decisions/01-05-PLAN.md
  - .planning/phases/01-spike-baseline-and-decisions/01-05-SUMMARY.md
  - Dockerfile
  - astro.config.mjs
  - package-lock.json
  - package.json
  - scripts/script-allowlist.json
  - scripts/script-inventory.mjs
  - src/components/layout/Stack.astro
  - src/live.config.ts
covered_digest: "v3:sha256:723d9e994132b893d53edbe0882d9784f5d8bdaf3fbdfd5ad31dc1a2cfab106e"
behavior_unverified: 0
overrides_applied: 0
---

# Phase 1: Spike, Baseline and Decisions Verification Report

**Phase Goal:** The open platform questions are answered with measured evidence, and the current site is captured as a baseline before anything about it changes
**Verified:** 2026-10-23T21:30:00Z
**Status:** passed
**Re-verification:** No, initial verification

## Goal Achievement

Verification was done against the code and evidence on disk, not the SUMMARY files. I re-ran the build, the compare and check scripts, the script selftest and `astro check`. I also rebuilt the Docker image, ran the container on a loopback port, fetched all 17 routes over HTTP and removed the container, volume and image afterwards.

### Observable Truths (ROADMAP success criteria)

| #   | Truth                                                                                                                                                                                                  | Status   | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A baseline of the current built HTML (home, projects index, 13 projects, About, 404) and a per-route script inventory exist outside the repo, captured before any dependency changes                   | VERIFIED | `~/portfolio-baseline/current` resolves to `/Users/zeikcookson/portfolio-baseline/2026-10-23`. It holds `dist/` with 17 HTML files, `inventory.json` with 17 routes and `MANIFEST.txt` (git_sha f4e5470, astro 6.2.2, Node 24.17.0). The baseline was captured at 16:14 and the first dependency commit (d7743b9) is at 16:31. No baseline HTML or inventory is tracked in the repo.                                                                                                                                                                                                                                                                                                                                                        |
| 2   | `astro build` passes on the pinned set, a Docker image builds locally, and its pages match the baseline in content and scripts                                                                         | VERIFIED | `npm run build` exits 0 on astro 6.4.8, emdash 1.3.1, @astrojs/node 10.1.4, @astrojs/react 5.0.7, react 19.3.1. `compare` reports 17/17 identical and `check` reports 17/17 passed. I rebuilt the Docker image and served it as user `node` with the database created at `/app/data/emdash.db`. The setup status returned `needsSetup:true`, and an HTTP `fetch` compare against the baseline gave 17/17 identical. The container had no `.env`, `.git` or `.planning`. `astro check` reports 0 errors, 0 warnings, 0 hints. Strict check, see below.                                                                                                                                                                                       |
| 3   | `package.json` and the build environment both require Node 22.22.2 or later                                                                                                                            | VERIFIED | `engines.node` is `>=22.22.2` in `package.json` and the lockfile root. `.npmrc` sets `engine-strict=true`, `.nvmrc` is `24`, and the Dockerfile copies `.npmrc` into the build and prod-deps stages. Recorded evidence: Node 20 is refused with EBADENGINE both locally (`engine-strict-node20.txt`) and inside a Docker build (`docker-node20-reject.log`). The 22.16.0 image failed (`docker-node22-reject.log`), and the 22.22.2 image served 17/17 identical pages (`docker-node22.txt`). The raise from 22.16 was a user decision (e0dc5cf) and is reflected in ROADMAP, REQUIREMENTS and PROJECT.                                                                                                                                     |
| 4   | PROJECT.md records written decisions, backed by a local spike, on core EmDash on Node + SQLite without extras, two-passkey enrollment and recovery, Node 24, media storage and the confirmed API names | VERIFIED | The "Spike Findings (Phase 1)" section exists with all five answers. All 16 evidence paths it cites exist under `~/portfolio-baseline/current/spike/`. The numbers I spot-checked match the files: `no-extras.txt` shows `extras=none`. `passkeys-full.txt` shows only the answering credential's counter moving (Second device 1 to 2 on A2-only, Setup passkey 2 to 3 on A1-only). `recovery.txt` shows 1 user and 2 credentials before the delete, 0 and 0 after, with schema counts unchanged. `media.txt` shows 201, 403 CSRF_REJECTED, 200, 206 and a sandbox CSP. `api-names.txt` shows `PortableText` and `EmDashHead` undefined at the `emdash` root. The Node 24 container ran `migrate --check` with exit 0 and nothing pending. |
| 5   | Each open research tension has a recorded decision or is named as a gate in the phase that settles it                                                                                                  | VERIFIED | PROJECT.md has a "Research tensions" table covering media storage, tags storage, stats placement, EmDash version, public JS baseline, Workers/LOADER/Access and rendering mode, each with an outcome and a settling phase. The Named gates (a) to (l) include the Astro 6 residual advisories, which match `npm-audit.json` (4 vulnerabilities: 1 critical astro, 2 high, 1 low).                                                                                                                                                                                                                                                                                                                                                           |

**Score:** 5/5 truths verified, 0 present but behavior-unverified.

### PLAN must-haves (supplementary)

| Plan  | Must-have                                                                                                                | Status   | Evidence                                                                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 01-01 | `compare` is 17/17 for an unchanged rebuild and detects injected scripts                                                 | VERIFIED | `selftest` returned 6/6 detected (unchanged, inline-classic, modulepreload, external-module, edited-inline, json-ld).                                                                |
| 01-01 | Allowlist is derived from the baseline, with `generatedFrom: main@SHA`                                                   | VERIFIED | `scripts/script-allowlist.json` has `"generatedFrom": "main@f4e54700... astro 6.2.2"`, 3 classic and 2 module inline hashes, and 17 routes.                                          |
| 01-01 | Work is on `emdash-migration`, main still equals the MANIFEST SHA, nothing pushed                                        | VERIFIED | `git rev-parse main` is f4e54700d978da2249b4e0ae0c7a3c3377ba1125, equal to MANIFEST. `git branch -r` shows only `origin/main`, so there is no remote `emdash-migration`.             |
| 01-01 | `data/` and `.emdash/migrations.json` are ignored, `.emdash/types.ts` is not                                             | VERIFIED | `git check-ignore -v` ignores the first two and reports nothing for `.emdash/types.ts`.                                                                                              |
| 01-02 | Pinned stack, standalone adapter, `src/live.config.ts` with `emdashLoader`, SQLite and local media paths                 | VERIFIED | `astro.config.mjs` and `src/live.config.ts` match the plan's patterns. `npm ls` shows the six pinned packages and `no-extras.txt` shows no extras.                                   |
| 01-03 | Dockerfile is multi-stage with `ARG NODE_VERSION=24`, `VOLUME /app/data` and `USER node`                                 | VERIFIED | The Dockerfile has all three. My rebuilt container ran as `node` on Node v24.22.1.                                                                                                   |
| 01-04 | No spike data, containers, volumes, listeners or Chrome processes left behind                                            | VERIFIED | `data/` is absent. No portfolio containers or volumes exist, and nothing listens on 4399, 9333 or 4321. No headless Chrome or preview process is running.                            |
| 01-05 | PROJECT.md keeps a single Dokploy decision row. CLAUDE.md, README, ROADMAP and REQUIREMENTS are not touched by the plan. | VERIFIED | "Self-host on Dokploy" appears once. `git diff main emdash-migration -- CLAUDE.md README.md` is empty. The new text has no em dashes, and the remaining ones are pre-existing lines. |
| 01-05 | Phase exit check (clean install, parity, no leftover state)                                                              | VERIFIED | `spike/phase-exit.txt` records the clean reproduction. I independently re-ran build, compare, check and astro check, and all passed.                                                 |

### Strict parity check (response to review finding WR-05)

The review noted that `compare` collapses whitespace between tags, which could hide a rendered difference. I ran stricter checks against the baseline and the fresh `dist/client`:

- Removing only whitespace that contains a newline: 17 of 17 pages identical.
- Replacing newline whitespace with a single space, compared from `<body` onward: 17 of 17 pages identical.
- The only whitespace differences are in `<head>`, between the `<style>` and `<link>` tags, from the newer Astro compiler. Nothing renders from them.

Parity therefore holds in the rendered body and does not rest only on the tolerant compare. The new `dist/client/_astro/*.js` files are EmDash admin bundles. No public page references them, and `check` passed 17/17 with 0 external scripts and 0 modulepreload.

### Required Artifacts

| Artifact                                                                 | Status   | Details                                                                                                       |
| ------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| `scripts/script-inventory.mjs`                                           | VERIFIED | 606 lines with capture, compare, derive, check, fetch and selftest. It ran successfully in every mode I used. |
| `scripts/script-allowlist.json`                                          | VERIFIED | Derived, with 17 routes. `check` passes.                                                                      |
| `astro.config.mjs`, `src/live.config.ts`                                 | VERIFIED | The build and the container boot use them.                                                                    |
| `package.json`, `package-lock.json`                                      | VERIFIED | Pins and engines are as specified.                                                                            |
| `Dockerfile`, `.dockerignore`, `.npmrc`, `.nvmrc`                        | VERIFIED | Present and effective, as proven by the image build and the EBADENGINE logs.                                  |
| `.gitignore`                                                             | VERIFIED | Ignore rules are in place.                                                                                    |
| `.planning/PROJECT.md`                                                   | VERIFIED | Spike Findings section, tensions, gates, API names and recovery procedure are present.                        |
| `~/portfolio-baseline/current/{dist,inventory.json,MANIFEST.txt,spike/}` | VERIFIED | Present outside the repo.                                                                                     |

### Key Links

| From                          | To                            | Status | Details                                                                                                                                        |
| ----------------------------- | ----------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| allowlist                     | baseline inventory            | WIRED  | `generatedFrom` carries `main@f4e5470`, and `derive` output reproduces the hash set.                                                           |
| `compare`                     | baseline `dist`               | WIRED  | Used successfully against both the build output and the HTTP fetch of the container.                                                           |
| Dockerfile                    | `.npmrc`                      | WIRED  | `COPY package.json package-lock.json .npmrc ./` appears in both the build and prod-deps stages, and the EBADENGINE log proves it takes effect. |
| Dockerfile `VOLUME /app/data` | baked `file:./data/emdash.db` | WIRED  | The container created `/app/data/emdash.db` on the volume.                                                                                     |
| PROJECT.md                    | allowlist and spike evidence  | WIRED  | The allowlist is named, and every cited evidence path exists.                                                                                  |

### Data-Flow Trace (Level 4)

Not applicable. The phase produces tooling, configuration and recorded decisions. It has no dynamic-data rendering, and the public pages are unchanged.

### Behavioral Spot-Checks

| Behavior                       | Command                                                                      | Result                                                                 | Status |
| ------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------ |
| Build passes on pinned set     | `npm run build`                                                              | exit 0                                                                 | PASS   |
| Parity vs baseline             | `script-inventory.mjs compare ~/portfolio-baseline/current/dist dist/client` | 17/17 identical                                                        | PASS   |
| Script allowlist               | `script-inventory.mjs check scripts/script-allowlist.json dist/client`       | 17/17 passed                                                           | PASS   |
| Guard detects regressions      | `script-inventory.mjs selftest ... baseline allowlist`                       | 6/6 detected                                                           | PASS   |
| Type check                     | `npx astro check`                                                            | 0 errors, 0 warnings, 0 hints                                          | PASS   |
| Docker image builds and serves | `docker build`, `docker run`, `script-inventory.mjs fetch`                   | 17/17 identical over HTTP, setup status `needsSetup:true`, user `node` | PASS   |

### Probe Execution

No `probe-*.sh` scripts are declared or present for this phase. SKIPPED.

### Requirements Coverage

Every ID in the PLAN frontmatter was matched against REQUIREMENTS.md. The plans claim FOUND-02 (01-01), FOUND-01 and FOUND-03 (01-02), FOUND-01 and FOUND-04 (01-03), FOUND-03 (01-04) and FOUND-03 (01-05). The traceability table maps exactly FOUND-01 to FOUND-04 to Phase 1. There are no orphaned requirements.

| Requirement | Source Plan         | Description                                                                   | Status    | Evidence                                                                              |
| ----------- | ------------------- | ----------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------- |
| FOUND-01    | 01-02, 01-03        | Dependencies bumped and pinned, `astro build` passes with the site unchanged  | SATISFIED | Build, 17/17 compare and 17/17 allowlist check re-run, plus the Docker image.         |
| FOUND-02    | 01-01               | Baseline of built HTML and per-route script inventory stored outside the repo | SATISFIED | `~/portfolio-baseline/current/` holds 17 pages and a 17-route inventory.              |
| FOUND-03    | 01-02, 01-04, 01-05 | Spike records written decisions in PROJECT.md                                 | SATISFIED | The Spike Findings section answers all five questions with existing evidence files.   |
| FOUND-04    | 01-03               | Node floor raised to 22.22.2+ in `package.json` and the build environment     | SATISFIED | engines, engine-strict, `.nvmrc`, the Dockerfile, and the accept and reject evidence. |

### Anti-Patterns Found

None. A scan of the files changed in this phase found no TBD, FIXME, XXX, TODO or HACK markers, and no stub or placeholder implementations.

### Code Review (advisory, 01-REVIEW.md)

The review has 0 critical findings, 7 warnings and 6 info items. These are advisory and do not fail the goal. I checked each against the phase goal.

| ID    | Summary                                                                                                                                     | Effect on this phase                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WR-01 | Node is PID 1 with no SIGTERM handling, so redeploys hang until SIGKILL                                                                     | None. Fix in Phase 5 (tini or `init: true`).                                                                                                                         |
| WR-02 | The branch's `.nvmrc` 24, engine-strict and the 22.22.2 floor could break the Cloudflare Pages build of `main` if merged before the cutover | None while the work stays on the local branch. It is a real merge hazard and is not recorded in PROJECT.md. Record it as a Phase 5 precondition.                     |
| WR-03 | `readAllowlist` is fail-open on malformed route entries                                                                                     | None now. Harden before Phase 3 reuses it for GUARD-01.                                                                                                              |
| WR-04 | The regex HTML parser can misclassify a script, as the reviewer confirmed with a test                                                       | None now. Harden before GUARD-01 (use a real parser).                                                                                                                |
| WR-05 | `normalize` collapses meaningful inline whitespace                                                                                          | I tested this directly and the rendered body is identical (see the strict check above), so the Phase 1 parity claim holds. Fix before Phase 3 relies on the compare. |
| WR-06 | `data/` is ignored but must exist before EmDash can open SQLite, so a fresh clone fails on the first run                                    | None for the phase goal. The finding is documented in the spike answer. Fix with `data/.gitkeep` or a pre-script before Phase 2.                                     |
| WR-07 | `.gitignore` covers only `.env` and `.env.production`                                                                                       | None now. Fix before secrets arrive in Phase 5.                                                                                                                      |

### Observations (non-blocking)

- Phase 1 still shows `[ ]` in the ROADMAP.md phase list, although all 5 plans are `[x]` and REQUIREMENTS.md marks FOUND-01 to FOUND-04 complete. This is an orchestrator bookkeeping item for phase close.
- Local `main` has 5 unpushed commits ahead of `origin/main`. All are GSD planning commits made before the baseline capture, from 15:11 to 16:12. No source code is affected. They will publish if `main` is pushed.
- The passkey drills used Chrome virtual authenticators. PROJECT.md states this and the one transient "Authentication failed" openly. Real-device enrollment is scheduled as ADMIN-03 in Phase 5, so it is not a Phase 1 gap.
- The Cloudflare Pages build of `main` still runs on the old Node setting until the Phase 5 cutover. PROJECT.md says so. "Build environment" for FOUND-04 is therefore satisfied by the branch (npm, nvm and Docker), and `main` is deliberately untouched.

### Human Verification Required

None.

### Gaps Summary

No gaps. All five roadmap success criteria and all four requirement IDs are backed by code and evidence that I re-checked, not by SUMMARY claims. The baseline predates every dependency change. The pinned build and the Docker image serve pages identical to the baseline, both byte-wise in the rendered body and under the script allowlist. The Node 22.22.2 floor is enforced and proven from both sides. PROJECT.md records the spike decisions, tensions and gates, and every evidence path it cites exists.

---

_Verified: 2026-10-23T21:30:00Z_
_Verifier: Claude (gsd-verifier)_
