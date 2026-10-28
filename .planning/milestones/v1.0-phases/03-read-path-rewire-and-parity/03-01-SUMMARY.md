---
phase: 03-read-path-rewire-and-parity
plan: 01
subsystem: read-path
tags:
  [emdash, astro-server-output, portable-text, public-js-guard, node-test, tdd]

requires:
  - phase: 02-content-model-and-import
    provides: committed .emdash/seed.json with 13 projects, taxonomies and emdash-env.d.ts types
  - phase: 01-spike-baseline-and-decisions
    provides: scripts/script-inventory.mjs, scripts/script-allowlist.json and the 17-route baseline
provides:
  - "Server build (output server, toolbar false) answering project pages from EmDash through getProject"
  - "src/lib/projects.ts EmDash read adapter: ProjectEntry, ProjectDetail, toProject, getSortedProjects, getProject"
  - "scripts/check-public-js.mjs GUARD-01 engine (build, seeded temp server, status assertions, allowlist check)"
  - "formatProjectDate pinned to UTC (IN-01)"
  - "Project markdown, file collection and import tooling deleted; .emdash/seed.json is the only rebuild path"
affects: [03-02, 03-03, 03-04, 03-05, 03-06]

status_note: "plan_head_before and plan_head_after below are measured from the commit ledger"
plan_head_before: a0e5b93950f09d63f640e2a652b9ee6707b88a30
plan_head_after: a6aa47f1bf15fcb2e71b6501e5eb8bab4a2ff99d

actuals:
  tokens: 5000
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Adapter seam: pages and StageCard read ProjectEntry from src/lib/projects.ts, never EmDash types directly"
    - "EmDash returns errors instead of throwing, so every read checks error and throws"
    - "Guard runs the built server from a mkdtemp cwd seeded from the committed seed; the repo data/ is never opened"

key-files:
  created:
    - scripts/check-public-js.mjs
    - src/lib/projects.test.mjs
  modified:
    - astro.config.mjs
    - src/lib/projects.ts
    - src/lib/format.ts
    - src/components/StageCard.astro
    - "src/pages/projects/[...slug].astro"
  deleted:
    - src/content.config.ts
    - src/content/projects/ (13 files)
    - scripts/import-content.mjs
    - scripts/import-content.test.mjs
    - scripts/verify-import.mjs
    - scripts/lib/ (sources.mjs, schema.mjs, entry.mjs)
    - scripts/fixtures/ (bad-date.md, draft-project.md, empty-lists.md)

key-decisions:
  - "getProject returns null unless entry.id equals the requested slug, so a database id never serves a project (each project has one public URL)"
  - "D-03 is met through entry.data.terms hydrated by EmDash's batched term loader; no second getTermsForEntries call"
  - "Detail page body renders through emdash/ui PortableText with no custom components; parity components (heading ids, smart punctuation) are plan 03-02"
  - "The guard's child server binds 127.0.0.1 on an ephemeral port from a temp cwd and is stopped in finally and on SIGINT or SIGTERM"

patterns-established:
  - "Same-commit flip: the reader move and the deletion of its sources land in one commit (79f619c)"
  - "Guard asserts HTTP status of every route before the allowlist check, so an error page cannot pass on fewer scripts"

requirements-completed:
  - REND-01
  - REND-02
  - REND-05
  - ADMIN-01
  - GUARD-01

coverage:
  - id: D1
    description: "A project page is served by the Node server build from the EmDash entry through getProject, rendering the same title and header markup"
    requirement: REND-01
    verification:
      - kind: integration
        ref: "node scripts/check-public-js.mjs --out DIR (FETCH /projects/catalog-cms/ 200, detail-h1 Catalog CMS, check: 17/17 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A missing project slug and an unmatched route return HTTP 404 with the existing 404 page"
    requirement: REND-02
    verification:
      - kind: integration
        ref: "node scripts/check-public-js.mjs (FETCH /projects/__no_such_slug__/ 404, FETCH /__parity_missing_route__/ 404)"
        status: pass
    human_judgment: false
  - id: D3
    description: "getSortedProjects returns the 13 published projects newest first; /projects/ and home card hrefs equal the baseline order"
    requirement: REND-01
    verification:
      - kind: integration
        ref: "diff of href=/projects/ lists against ~/portfolio-baseline/current/dist for /projects/index.html and /index.html (no output)"
        status: pass
    human_judgment: false
  - id: D4
    description: "toProject maps category, tags, status fields, stats, date and body, with empty values for missing terms, stats and body"
    requirement: REND-01
    verification:
      - kind: unit
        ref: "src/lib/projects.test.mjs#toProject (3 tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "formatProjectDate returns YYYY-MM-DD in UTC while TZ is Pacific/Honolulu"
    requirement: REND-01
    verification:
      - kind: unit
        ref: "src/lib/projects.test.mjs#formatProjectDate"
        status: pass
    human_judgment: false
  - id: D6
    description: "Project markdown, file collection and import tooling are deleted in the commit that moved their last reader"
    requirement: REND-05
    verification:
      - kind: other
        ref: "git show --name-only 79f619c lists src/lib/projects.ts, src/components/StageCard.astro and 23 deletions; test ! -e gate on every removed path"
        status: pass
    human_judgment: false
  - id: D7
    description: "toolbar false and server output leave the committed script allowlist unchanged on every public route"
    requirement: ADMIN-01
    verification:
      - kind: integration
        ref: "node scripts/check-public-js.mjs (check: 17/17 passed, allowlist and script-inventory.mjs unedited)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Prose rendering of project bodies matches the baseline (heading ids, smart punctuation, link styling)"
    requirement: REND-01
    verification: []
    human_judgment: true
    rationale: "Out of scope for this plan by design: bodies render through plain PortableText here (no heading ids, straight apostrophes) and plan 03-02 adds the parity components and the visual check"

duration: 4min
completed: 2026-10-26
status: complete
---

# Phase 3 Plan 01: Read path tracer and project list flip Summary

**Project pages and lists now render from EmDash on a Node server build with a real 404 for a missing slug, proven by a seeded temp-server guard that passes all 17 allowlist routes, with the project markdown, file collection and import tooling deleted in the same commit.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-10-26T15:49:52Z
- **Completed:** 2026-10-26T15:54:07Z
- **Tasks:** 2 (one tracer, one TDD)
- **Files modified:** 7 changed or created, 23 deleted

## Accomplishments

- astro.config.mjs is on `output: "server"` with `toolbar: false`; `src/lib/projects.ts` is now the EmDash adapter with `getProject` rejecting database ids (`entry.id !== slug` returns null) and `getSortedProjects` ordered by `date desc`.
- The detail page does a per-request lookup, returns `new Response(null, { status: 404 })` for a missing slug (Astro re-renders the existing 404 page) and renders the body through `emdash/ui` PortableText.
- `scripts/check-public-js.mjs` builds, seeds a mkdtemp database from `.emdash/seed.json`, starts `dist/server/entry.mjs` on 127.0.0.1 with an ephemeral port, asserts every status before the allowlist check, and always stops the server and removes its temp directories. The repo `data/emdash.db` checksum was identical before and after both runs (36c2cb63...).
- Guard output on the final tree: `FETCH` 200 for `/`, `/about/`, `/projects/` and all 13 project routes; `FETCH /__parity_missing_route__/ 404`; `FETCH /projects/__no_such_slug__/ 404`; `PASS` for all 17 routes; `check: 17/17 passed`; `check-public-js: PASS`.
- `/projects/` (13 cards) and the home page (3 cards) card hrefs equal the baseline in order.
- 23 source and tooling files deleted in the same commit as the list flip; `npx astro check` reports 0 errors at every commit.

## Task Commits

1. **Task 1: Project page from EmDash on the server build, proven by the guard core** - `5789427` (feat, tracer)
2. **Task 2: Project lists from EmDash, markdown and tooling deleted (TDD)**
   - RED: `ee90adb` (test)
   - GREEN: `79f619c` (feat, flips getSortedProjects and carries the 23 deletions)
   - REFACTOR: `a6aa47f` (refactor, static imports in the test)

**Plan metadata:** the docs commit that carries this SUMMARY, STATE.md and ROADMAP.md.

## TDD Gate Compliance

- **RED:** `src/lib/projects.test.mjs` run with the TAP reporter failed 4 of 4. The target test "formats UTC midnight as YYYY-MM-DD in a zone behind UTC" failed with `TypeError: format.formatProjectDate is not a function`. `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK` (reason `target_test_failed`).
- **Semantic assessment:** the target executed and failed for the planned reason (the formatter did not exist). The three `toProject` tests also failed, with `ERR_UNSUPPORTED_ESM_URL_SCHEME` for `astro:content`, because `projects.ts` still imported the file collection until the flip; they load the module with a dynamic import inside each test so that failure stayed per-test and the file still produced a valid RED.
- **GREEN:** `formatProjectDate` plus the `getSortedProjects` flip removed the `astro:content` import, and all 4 tests passed.
- **REFACTOR:** the test switched from the dynamic loader and namespace import to plain static imports; 4 of 4 still pass.

## Files Created/Modified

- `astro.config.mjs` - server output, emdash `toolbar: false`
- `src/lib/projects.ts` - EmDash read adapter (ProjectEntry, ProjectDetail, toProject, getProject, getSortedProjects)
- `src/pages/projects/[...slug].astro` - per-request lookup, 404 on null, PortableText body
- `src/components/StageCard.astro` - `ProjectEntry` prop type (markup unchanged)
- `src/lib/format.ts` - `formatProjectDate` with `timeZone: "UTC"`
- `scripts/check-public-js.mjs` - GUARD-01 engine, flags `--skip-build` and `--out DIR`
- `src/lib/projects.test.mjs` - node:test cases for the mapping and the UTC formatter

## Decisions Made

- Compare `entry.id` to the requested slug in `getProject` (research Pattern 1 gotcha: `getEmDashEntry` also resolves ULIDs).
- No `getTermsForEntries` call: `entry.data.terms` is already hydrated by the same batched loader (D-03 interpretation recorded in the plan).
- Leave `src/live.config.ts`, `src/data/about.ts` and `src/data/about.md` in place; About and the home hero still read them until plan 03-06.

## Phase 2 follow-ups

- D-08 closes ME-01, ME-02, ME-05, ME-06, LO-01 to LO-05, IN-02, IN-04 and IN-05 as obsolete (the importer, verifier, their tests and fixtures are deleted; git history keeps them).
- IN-01 is done here (`formatProjectDate`, UTC-pinned, zone-independent test).
- IN-03 is done in plan 03-04.

## Deviations from Plan

None - plan executed as written, with two bookkeeping notes.

- The plan prose says 22 deleted files; the frontmatter `files_deleted` list and the commit hold 23 (13 project files, `src/content.config.ts`, three import scripts, three `scripts/lib` files, three fixtures).
- The RED step needed the per-test dynamic import described under TDD Gate Compliance, because Task 1 left the `astro:content` import in `projects.ts` for Task 2 to remove; a static import would have crashed the whole file (an INVALID_RED load failure). The refactor commit restored plain static imports.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** none.

## Issues Encountered

None. No auth gates. `.astro/` did not need to be deleted after the collection was removed.

## Known Stubs

None.

## Threat Flags

None. The guard's loopback server is the planned D-10 check (T-03-06) and is stopped before the script exits; no stray `dist/server/entry` process remained after either run.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03-02 can add the prose parity components: detail bodies currently render through plain PortableText (no heading ids, straight apostrophes), so a normalized parity compare against the baseline will still show those differences.
- About and the home hero still read `src/data/about.*`; plan 03-06 moves them and deletes those files in the same commit.
- The Cloudflare Pages build on `main` would break on a server build; this work stays on `emdash-migration`, unpushed.

## Self-Check: PASSED

All created and modified files exist on disk and commits 5789427, ee90adb, 79f619c and a6aa47f are ancestors of HEAD.

---

_Phase: 03-read-path-rewire-and-parity_
_Completed: 2026-10-26_
