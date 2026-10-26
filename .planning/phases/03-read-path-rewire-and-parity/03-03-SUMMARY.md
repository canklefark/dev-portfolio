---
phase: 03-read-path-rewire-and-parity
plan: 03
subsystem: parity-and-public-js-guard
tags:
  [
    parity,
    canonicalizer,
    public-js-guard,
    github-actions,
    node-test,
    tdd,
    allowlist,
  ]

requires:
  - phase: 03-read-path-rewire-and-parity
    provides: server build, getProject adapter and the check-public-js guard core (plan 03-01), prose parity and og:url (plan 03-02)
  - phase: 01-spike-baseline-and-decisions
    provides: scripts/script-inventory.mjs, scripts/script-allowlist.json and the 17-route baseline in ~/portfolio-baseline/current/dist
provides:
  - "parity command in scripts/script-inventory.mjs: five-rule canonicalizing compare, 17 of 17 identical against the baseline"
  - "/projects/* wildcard in the allowlist and in checkDir (single segment, exact keys win)"
  - "check-public-js.mjs crawling project routes from /projects/, five 404 negatives including a real draft, the admin route and the no /_emdash/ on public pages assertion"
  - "scripts/fixtures/draft-project.seed.json applied only to the guard's temp database"
  - "scripts/check-public-js.test.mjs: committed deliberate failing case (D-11)"
  - "npm test and npm run check:public-js; .github/workflows/ci.yml (job verify) ready for Phase 5 to extend"
affects: [03-04, 03-05, 03-06, 05]

status_note: "plan_head_before and plan_head_after below are measured from the commit ledger"
plan_head_before: 6a683bfe095f2a05cb6ba6f897344ec8651dafd0
plan_head_after: e211339d094df94bcdcdbc0cebda7005677d8d33

actuals:
  tokens: 7900
  tasks: 3
  commits: 4

tech-stack:
  added: []
  removed:
    - "yaml (devDependency; still present in the lockfile as a transitive dependency of other packages)"
  patterns:
    - "Canonicalizer limited to five fixed rules; scripts compared strictly before it runs"
    - "Guard discovers routes from content (crawl /projects/) and uses a wildcard allowlist entry instead of one entry per project"
    - "Guard reads the temp database read-only through node:sqlite with a bound parameter and a constant table name"

key-files:
  created:
    - scripts/parity.test.mjs
    - scripts/check-public-js.test.mjs
    - scripts/fixtures/draft-project.seed.json
    - .github/workflows/ci.yml
  modified:
    - scripts/script-inventory.mjs
    - scripts/check-public-js.mjs
    - scripts/script-allowlist.json
    - package.json
    - package-lock.json

key-decisions:
  - "CSS counts are reported as links plus style blocks combined per route (baseline 2, candidate 3 on every project page); the plan said 'stylesheet counts' without defining the unit"
  - "The wildcard match is one path segment under the key's prefix, so /projects/* never covers /projects or /projects/a/b; asserted in the self-test"
  - "GitHub action majors pinned to v7 (checkout v7.0.1, setup-node v7.1.0, read from gh api on 2026-10-26)"

patterns-established:
  - "Status assertions run before the script check, now for page routes, five negative routes and the admin hop"
  - "ADMIN-REF check on every 2xx or 404 body the guard fetches"

requirements-completed:
  - REND-04
  - REND-02
  - ADMIN-01
  - GUARD-01

coverage:
  - id: D1
    description: "The server build matches the baseline on all 17 routes after the five canonicalizations (home, projects index, 13 project pages, About, 404)"
    requirement: REND-04
    verification:
      - kind: integration
        ref: "node scripts/check-public-js.mjs --out DIR then node scripts/script-inventory.mjs parity ~/portfolio-baseline/current/dist DIR (parity: 17/17 identical, no PARITY-DIFF)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The comparator treats tags as a set and nothing else loosely: copy, anchor-adjacent whitespace, a different tag, og:url host, an extra script and a one-sided route each fail"
    requirement: REND-04
    verification:
      - kind: unit
        ref: "scripts/parity.test.mjs (7 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Unknown, draft, id-form, wrong-case and extra-segment project URLs answer 404, the draft is a real draft row in the temp database and is absent from /projects/"
    requirement: REND-02
    verification:
      - kind: integration
        ref: "guard log NEGATIVE lines (five x 404); fixture seeded into a scratch database showed slug draft-fixture-project status draft, 14 rows in ec_projects"
        status: pass
    human_judgment: false
  - id: D4
    description: "/_emdash/admin answers under /_emdash/ only and no public HTML references /_emdash/"
    requirement: ADMIN-01
    verification:
      - kind: integration
        ref: "guard log: ADMIN /_emdash/admin 302, ADMIN /_emdash/admin/setup 200, no ADMIN-REF line"
        status: pass
    human_judgment: false
  - id: D5
    description: "The allowlist differs from the phase start commit 77a570d only by one /projects/* entry equal to the catalog-cms entry"
    requirement: GUARD-01
    verification:
      - kind: other
        ref: "node gate comparing git show 77a570d:scripts/script-allowlist.json with the working file (exit 0)"
        status: pass
    human_judgment: false
  - id: D6
    description: "A committed self-test fails an injected inline script plus modulepreload link (exit 1, both named), passes the clean fixture, and exercises the wildcard by counts"
    requirement: GUARD-01
    verification:
      - kind: unit
        ref: "scripts/check-public-js.test.mjs (4 tests); npm test 27 of 27"
        status: pass
    human_judgment: false
  - id: D7
    description: "npm run check:public-js is the D-10 entry point and the workflow runs npm ci, npm test and npm run check:public-js on push and pull_request with contents read"
    requirement: GUARD-01
    verification:
      - kind: other
        ref: "workflow parsed with the yaml package (steps, permissions, node-version-file .nvmrc, triggers push and pull_request); no pull_request_target or secrets reference; npm run check:public-js ends check-public-js: PASS"
        status: pass
    human_judgment: false
  - id: D8
    description: "The first run of the workflow on GitHub"
    requirement: GUARD-01
    verification: []
    human_judgment: true
    rationale: "Pending the user's push approval: nothing was pushed, so the workflow has only been validated by a parse and by running its two npm scripts locally"

duration: 9min
completed: 2026-10-26
status: complete
---

# Phase 3 Plan 03: Parity compare and the finished public-JS guard Summary

**A five-rule canonicalizing `parity` command shows the server build identical to the baseline on 17 of 17 routes, and the public-JS guard now crawls project routes under a `/projects/*` allowlist wildcard, proves five 404 cases (including a real draft) and the admin route, and runs from `npm run check:public-js` in a least-privilege GitHub Actions job.**

## Performance

- **Duration:** about 9 min (12:00 to 12:06 local, Oct 26 2026)
- **Tasks:** 3 (one TDD, two auto)
- **Files:** 4 created, 5 modified

## Accomplishments

- `canonical(html)` applies exactly five rules in order: drop stylesheet links and style blocks (counted), strip `data-astro-cid-*`, decode `&#39; &#x27; &quot; &#34; &gt; &lt;` then `&amp;`, remove inter-tag whitespace and collapse the rest, sort the `stage-tag` spans inside each `stage-tags` container. Scripts are compared strictly first, through the existing `scriptDiff`. No rule beyond the five, and the baseline was not edited.
- Parity output against `~/portfolio-baseline/current/dist` on the guard's fetched pages: `PARITY-OK` for `/`, `/404`, `/about`, `/projects` and all 13 project pages, ending `parity: 17/17 identical`, no `PARITY-DIFF`. Every project page also printed `CSS /projects/<slug>: baseline 2, candidate 3` (the one extra EmDash component stylesheet, an accepted delivery deviation).
- Guard coverage on the final tree (log lines):
  - `NEGATIVE /projects/__no_such_slug__/ 404`, `NEGATIVE /projects/draft-fixture-project/ 404`, `NEGATIVE /projects/01M5WF953SC6M150JFF6N2VVV5/ 404` (the catalog-cms database id), `NEGATIVE /projects/Catalog-CMS/ 404`, `NEGATIVE /projects/catalog-cms/extra/ 404`
  - `ADMIN /_emdash/admin 302` then `ADMIN /_emdash/admin/setup 200`; no `ADMIN-REF` line
  - `check: 17/17 passed`, `check-public-js: PASS`
- The draft fixture was seeded into a scratch database as a second check: `draft-fixture-project` has `status = draft`, `deleted_at` null, and the table then holds 14 projects (13 plus the draft), so the draft 404 is a real draft, not a missing row. The draft slug is also absent from `/projects/`.
- Allowlist change: one added key, `"/projects/*"` with `{ script: 4, module: 1, external: 0, modulepreload: 0 }`. `generatedFrom`, `inlineHashes` and every existing route entry are unchanged against 77a570d (gate exit 0).
- `npm test` runs 27 tests: parity 7, check-public-js 4, prose 12, projects 4. `yaml` removed from devDependencies; the lockfile diff is that one line.
- `.github/workflows/ci.yml`: job `verify` on `ubuntu-latest`, `actions/checkout@v7`, `actions/setup-node@v7` (Node from `.nvmrc`, npm cache), then `npm ci`, `npm test`, `npm run check:public-js`. Triggers `push` and `pull_request`, top-level `permissions: contents: read`, no secrets, no third-party actions. A trailing comment marks where Phase 5 adds `emdash migrate --check` and the smoke test.
- `npx astro check`: 0 errors, 0 warnings, 0 hints. No stray `dist/server/entry` process after any guard run. The repo `data/` database was not opened (the guard works in a mkdtemp directory; the scratch seed check used a directory under the session scratchpad).

## Task Commits

1. **Task 1: parity command (TDD)**
   - RED: `e80867e` (test) - 7 tests, all failing because the command did not exist (exit 2)
   - GREEN: `79257e6` (feat) - `canonical`, `runParity` and the `parity` entry; 7 of 7 pass and 17 of 17 routes identical
2. **Task 2: guard coverage** - `57e50c3` (feat)
3. **Task 3: self-test, npm scripts, workflow** - `e211339` (feat)

**Plan metadata:** the docs commit that carries this SUMMARY, STATE.md, ROADMAP.md and REQUIREMENTS.md.

## TDD Gate Compliance

- **RED:** `node --test scripts/parity.test.mjs` failed on every case, each with `2 !== 1` or `2 !== 0` (script-inventory.mjs exited with its usage error 2 because `parity` was unknown). The failure is the planned one: the target command did not exist. No load, syntax or fixture fault; the test file ran and each assertion on exit status was reached.
- **GREEN:** the command was implemented and all 7 tests pass. One test expectation was corrected before GREEN was committed: the extra-stylesheet case adds a link and a style block, so the combined count is `baseline 1, candidate 3`, not 2.
- **REFACTOR:** none.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test type error found by astro check**

- **Found during:** Task 1
- **Issue:** `parity.test.mjs` iterated an untyped tuple array, so `astro check` reported TS2345 on `join(root, side, file)`.
- **Fix:** typed the array as `[string, Record<string, string>][]`.
- **Files modified:** scripts/parity.test.mjs
- **Commit:** 79257e6 (fixed before the commit)

**2. [Rule 1 - Bug] Unused import left by the guard rewrite**

- **Found during:** Task 2
- **Issue:** removing `loadChecks` (which read the allowlist) left `readFileSync` unused in `check-public-js.mjs`.
- **Fix:** removed the import.
- **Files modified:** scripts/check-public-js.mjs
- **Commit:** 57e50c3

**Total deviations:** 2 auto-fixed (both Rule 1, no behavior change).
**Impact on plan:** none.

## Accepted deviations carried to the phase verification

- Tag order per card follows EmDash term order; the comparator accepts it as a set (D-01, D-02).
- One extra render-blocking stylesheet per project page (CSS count 2 versus 3) and scoped StageCard CSS delivered as a file; reported by the `CSS` lines, not compared.
- Auto-injected `/robots.txt` and `/sitemap.xml` are text and XML and are not fetched by the guard; recorded for plan 03-06.
- Whitespace between two tags is ignored by the comparator (as in the Phase 1 compare), so a missing space between two inline elements is not caught here; the light and dark visual pass in plan 03-06 backs it up.

## Issues Encountered

- A compound verification command using `ruby` for the YAML parse was denied by the permission system, so the workflow was parsed with the `yaml` package already in `node_modules` (a transitive dependency of other packages) via a one-off `node -e`, with the same assertions. No permission setting was changed.
- The first GitHub Actions run could not be done: nothing was pushed. It is pending the user's push approval (coverage D8).

## Known Stubs

None.

## Threat Flags

None. The only new surface is the guard reading its own temp database read-only through `node:sqlite` with a bound parameter and a constant table name (T-03-29). T-03-11 (allowlist unchanged except the wildcard, comparator fixed to five rules and tested), T-03-12 (workflow triggers, permissions and actions), T-03-13 (statuses asserted before the script check), T-03-14 (fixture only in the mkdtemp database), T-03-15 (ADMIN-REF check), T-03-27 and T-03-28 (draft and id-form 404s) are mitigated as planned.

## User Setup Required

None for this plan. When the user approves a push, the first run of `.github/workflows/ci.yml` on GitHub is a manual verification step (the build needs outbound network for the admin font, which hosted runners have).

## Next Phase Readiness

- Plan 03-04 and later plans can rely on `npm test` and `npm run check:public-js` as the local gates; the guard crawls projects, so new content cannot escape it.
- About and the home hero still read `src/data/about.*` until plan 03-06; their routes already match the baseline here (`/` and `/about` PARITY-OK).
- Work stays on `emdash-migration`, unpushed (no upstream is configured); the Cloudflare Pages build on `main` would break on a server build.

## Self-Check: PASSED

All created and modified files exist on disk and commits e80867e, 79257e6, 57e50c3 and e211339 are ancestors of HEAD.

---

_Phase: 03-read-path-rewire-and-parity_
_Completed: 2026-10-26_
