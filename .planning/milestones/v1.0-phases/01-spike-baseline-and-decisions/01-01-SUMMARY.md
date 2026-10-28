---
phase: 01-spike-baseline-and-decisions
plan: 01
subsystem: testing
tags: [astro, parity, script-inventory, csp-hash, baseline, gitignore]

requires:
  - phase: none
    provides: first plan of the milestone
provides:
  - "17-page baseline of main (HTML, per-route script inventory, MANIFEST) at ~/portfolio-baseline/2026-10-23, outside the repo"
  - "scripts/script-inventory.mjs with capture, compare, derive, check and selftest subcommands"
  - "scripts/script-allowlist.json derived from the baseline (17 routes, 3 classic and 2 module inline hashes)"
  - "local branch emdash-migration carrying all further work; main untouched at f4e5470"
  - "data/ and .emdash/migrations.json ignored while .emdash/ stays trackable"
affects: [01-02, 01-03, 01-04, 01-05, phase-03-guard-01, phase-05-guard-02]

actuals:
  tokens: 4932
  tasks: 2
  commits: 2
plan_head_before: f4e54700d978da2249b4e0ae0c7a3c3377ba1125
plan_head_after: 8572b32830a052b02f497e96aa84d460989204e5

tech-stack:
  added: []
  patterns:
    - "Parity is judged on whitespace-normalized HTML plus the ordered script list, never raw bytes or raw HTML hashes"
    - "Allowlist is derived from the baseline inventory, never hand-edited; generatedFrom pins main@SHA"
    - "Mutation selftest: a guard is trusted only after it detects injected scripts, modulepreload links and edited inline scripts"

key-files:
  created:
    - scripts/script-inventory.mjs
    - scripts/script-allowlist.json
  modified:
    - .gitignore

key-decisions:
  - "Baseline captured at main f4e5470 on Node 24.17.0, npm 11.13.0, astro 6.2.2 before any dependency change"
  - "Script bytes are real UTF-8 byte lengths (console banner is 429, not the 426 string length quoted in research); the CSP hashes are unaffected"
  - "migrations.json is not committed; Phase 5 revisits it with GUARD-02 (Open Question 5)"
  - "The carried .vscode/ gitignore line is committed on emdash-migration, not on main (Open Question 4)"

patterns-established:
  - "scripts/script-inventory.mjs: dispatcher on first argument, usage lines on stderr with exit 2, error: prefix with exit 1 for runtime failures"
  - "Selftest cases run on temp copies under os.tmpdir() and are always removed"

requirements-completed: [FOUND-02]

coverage:
  - id: D1
    description: "Baseline of the 17 built pages from main, captured before any dependency change, with MANIFEST.txt, inventory.json and a current symlink"
    requirement: FOUND-02
    verification:
      - kind: other
        ref: "node scripts/script-inventory.mjs compare ~/portfolio-baseline/current/dist dist (17/17 identical); MANIFEST git_sha equals git rev-parse main"
        status: pass
    human_judgment: false
  - id: D2
    description: "Parity compare and allowlist check proven in both directions by the mutation selftest"
    requirement: FOUND-02
    verification:
      - kind: other
        ref: "node scripts/script-inventory.mjs selftest ~/portfolio-baseline/current/dist scripts/script-allowlist.json (6/6 detected)"
        status: pass
      - kind: other
        ref: "node scripts/script-inventory.mjs check scripts/script-allowlist.json ~/portfolio-baseline/current/dist (17/17 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "data/ and .emdash/migrations.json ignored on the branch while .emdash/types.ts stays trackable"
    requirement: FOUND-02
    verification:
      - kind: other
        ref: "git check-ignore -q data/emdash.db && git check-ignore -q .emdash/migrations.json && ! git check-ignore -q .emdash/types.ts"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-23
status: complete
---

# Phase 1 Plan 1: Baseline, Branch and Parity Tooling Summary

**17-page baseline of main captured outside the repo, work moved onto local branch emdash-migration, and a mutation-tested script inventory with a derived CI allowlist (5 inline CSP hashes, 17 routes)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-23T20:13:30Z
- **Completed:** 2026-10-23T20:19:30Z
- **Tasks:** 2
- **Files modified:** 3 in the repo (2 created, 1 modified), plus the baseline directory outside it

## Accomplishments

- Baseline of main at f4e5470 (Node 24.17.0, npm 11.13.0, astro 6.2.2) lives at `~/portfolio-baseline/2026-10-23/` with `dist/` (17 HTML files), `inventory.json`, `MANIFEST.txt` and an empty `spike/` directory. `~/portfolio-baseline/current` points at it.
- `scripts/script-inventory.mjs` provides `capture`, `compare`, `derive`, `check` and `selftest`. Compare uses `normalize()` (whitespace between `>` and `<` removed) plus the ordered script list. A rebuild on the branch compares 17/17 identical.
- The selftest injects six mutations (unchanged, inline classic script, modulepreload, external module, edited inline script, JSON-LD) into temp copies. All six behave as expected: compare differs on exactly the mutated route, check fails the four executable mutations, and JSON-LD and unchanged pass check.
- `scripts/script-allowlist.json` was generated by `derive` with `generatedFrom` `main@f4e54700d978da2249b4e0ae0c7a3c3377ba1125 astro 6.2.2`. It matches the measured research values exactly: 3 classic hashes, 2 module hashes, `/404` at script 5 and module 2, every other route at script 4 and module 1, no external scripts, no modulepreload.
- `.gitignore` now ignores `data/` and `.emdash/migrations.json`; `.emdash/types.ts` is not ignored, so Phase 2 can commit generated types.

## Task Commits

1. **Task 1: Baseline from main, branch emdash-migration, and a proven capture/compare parity path** - `313666c` (feat)
2. **Task 2: Derive the committed allowlist, add the check subcommand, and ignore EmDash runtime files** - `8572b32` (feat)

**Plan metadata:** recorded in the docs commit that follows this summary.

## Files Created/Modified

- `scripts/script-inventory.mjs` - Inventory, parity compare, allowlist derive and check, and mutation selftest CLI (reused by GUARD-01 in Phase 3)
- `scripts/script-allowlist.json` - Derived per-route script and modulepreload counts plus the inline hash set
- `.gitignore` - Carries the previously uncommitted `.vscode/` line (trailing spaces untouched) and adds the EmDash runtime ignores
- Outside the repo: `~/portfolio-baseline/2026-10-23/{dist,inventory.json,MANIFEST.txt,spike}` and the `current` symlink

## Decisions Made

- Baseline provenance is recorded as it was, including the porcelain status (` M .gitignore` and untracked or modified `.planning` files), so the baseline can be tied to the exact tree it was built from.
- `bytes` in the inventory is the UTF-8 byte length, not the JavaScript string length. The console banner reads 429 bytes against the 426 quoted in the plan interfaces block, because it contains multi-byte characters. The sha256 values are over the exact text and match research.
- `compare` fails when the route sets differ, and reports a script-level reason before a normalized-HTML offset when both differ.
- `check` evaluates routes found in DIST_DIR only, as specified; a route present in the allowlist but missing from a build is not reported by `check` (compare covers route-set drift).

## Deviations from Plan

None - plan executed exactly as written.

The type-check of the script was not possible: `@types/node` is not installed and installing packages is outside this plan, so the `// @ts-check` annotations are checked by the editor only. The script was exercised end to end through the plan's verify commands instead.

## Issues Encountered

None. The precondition held (main working tree, branch main, no emdash-migration branch, Node v24.17.0), and `npm ci` plus `npm run build` produced 17 HTML files on the first run. `git rev-parse main` still equals the MANIFEST git_sha, and nothing was pushed.

## Known Stubs

None.

## Threat Flags

None. The script reads local HTML and writes only to paths it is given or to `os.tmpdir()` temp copies that are removed in a `finally` block.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plans 01-02 to 01-05 can address the baseline only through `~/portfolio-baseline/current` and prove "unchanged" with `compare`, `check` and `selftest`.
- Plan 01-03 adds the `fetch` subcommand named in the interfaces block.
- `.gitignore` is still carrying `.vscode/` on the branch; main's working tree no longer has that modification.

## Self-Check: PASSED

- FOUND: scripts/script-inventory.mjs, scripts/script-allowlist.json, ~/portfolio-baseline/current/{dist,inventory.json,MANIFEST.txt,spike}
- FOUND commits on HEAD: 313666c, 8572b32
- Plan verification re-run: compare 17/17 identical, selftest 6/6 detected with allowlist, check 17/17 passed, branch emdash-migration, main equals MANIFEST git_sha

---

_Phase: 01-spike-baseline-and-decisions_
_Completed: 2026-10-23_
