---
phase: 01-spike-baseline-and-decisions
plan: 05
subsystem: docs
tags:
  [
    project-md,
    decisions,
    spike-findings,
    phase-exit,
    npm-audit,
    passkeys,
    node24,
  ]

requires:
  - phase: 01-spike-baseline-and-decisions
    provides: "baseline and parity tooling (01-01), pinned EmDash stack and audit evidence (01-02), Node 24 image and the 22.22.2 floor (01-03), passkey, media and recovery evidence (01-04)"
provides:
  - "PROJECT.md Spike Findings (Phase 1): five evidence-cited answers, confirmed API names, the no-email recovery procedure, seven research tensions and named gates (a) to (l)"
  - "Key Decisions: Dokploy row confirmed in place (one row), eight new rows; Node and Client JS constraints, Validated, Active and Out of Scope wording matched to what the branch enforces"
  - "~/portfolio-baseline/current/spike/phase-exit.txt: clean npm ci, astro check and build reproduce 17/17 identical and 17/17 passed; main untouched; nothing pushed; no spike leftovers"
affects: [phase-02, phase-03, phase-04, phase-05, phase-06]

actuals:
  tokens: 5500
  tasks: 2
  commits: 0
plan_head_before: 36b142d7240eee0ad8e5c9d725863e09230c5482
plan_head_after: 36b142d7240eee0ad8e5c9d725863e09230c5482

tech-stack:
  added: []
  patterns:
    - "Decisions are written only with a cited evidence path under ~/portfolio-baseline/current/spike/, and the verify step fails if a cited path does not exist"
    - "Phase exit is a clean reinstall and rebuild compared against the baseline, never a reuse of an earlier build"

key-files:
  created: []
  modified:
    - .planning/PROJECT.md

key-decisions:
  - "Dokploy self-hosting is confirmed by the spike; Node 24 by default with engines >=22.22.2 under engine-strict; passkeys only with two enrolled and a SQLite recovery procedure; media on the local /app/data volume"
  - "Astro 6 residual advisories (astro critical, @astrojs/node high, sharp high, esbuild low) are a named gate: the user decides before the Phase 5 cutover between accepting the risk and the Astro 7 migration"
  - "The cookie-authenticated write check returned 403 CSRF_REJECTED without X-EmDash-Request, so no Phase 4 or Phase 5 gate was raised for it"

patterns-established:
  - "Where evidence disagrees with research, the evidence is written and the difference stated (Node floor 22.22.2 not 22.16.0; six astro advisories not fewer; data/ must pre-exist; credentials table has no rp id column)"

requirements-completed: [FOUND-03]

coverage:
  - id: D1
    description: "PROJECT.md records evidence-backed answers on EmDash on Node + SQLite without extras, two passkeys and recovery, Node 24 compatibility, media storage and the confirmed API names"
    requirement: FOUND-03
    verification:
      - kind: other
        ref: "Task 1 automated verify: all grep checks OK and the node check printed NODE_CHECK_OK with 16 distinct cited spike paths, all existing under ~/portfolio-baseline/current/"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every research tension has a decision or a named gate with its settling phase, including the Astro 6 advisory gate and the Phase 5 recovery-path gate"
    requirement: FOUND-03
    verification:
      - kind: other
        ref: "PROJECT.md Research tensions table has 7 rows and Named gates lists (a) to (l); Answers table has 5 rows"
        status: pass
    human_judgment: true
    rationale: "Whether each decision wording is the right call is for the author to read; the automated check only proves structure, cited paths and absence of em dashes"
  - id: D3
    description: "Clean reproduction from the committed lockfile reproduces baseline parity, main is untouched, nothing was pushed, and no spike state remains"
    requirement: FOUND-03
    verification:
      - kind: other
        ref: "Task 2 automated verify printed TASK2_VERIFY_OK; phase-exit.txt holds npm_ci=ok, astro_check=ok, build=ok, compare 17/17 identical, check 17/17 passed, main_sha_matches_baseline=true, remote_branch=none, listeners=none"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-23
status: complete
---

# Phase 1 Plan 5: Spike Decisions in PROJECT.md and Phase Exit Check Summary

**PROJECT.md now carries the Phase 1 spike answers, API names, recovery procedure, research tensions and twelve named gates, each backed by an existing evidence file, and a clean reinstall reproduces the baseline at 17/17 identical with main untouched and no spike state left**

## Performance

- **Duration:** about 6 min (21:11Z to 21:17Z)
- **Tasks:** 2 (both auto; this plan has no tracer by design)
- **Files modified in the repo:** 0 tracked. PROJECT.md is untracked and edited on disk only; `phase-exit.txt` lives outside the repo.

## Accomplishments

- Task 1: PROJECT.md gained `## Spike Findings (Phase 1)` between the Key Decisions table and `## Current Milestone`, with Answers (5 rows), Confirmed API names, Admin recovery procedure (7 steps plus what the drill showed), Research tensions (7 rows) and Named gates (a) to (l). It cites 16 distinct evidence files and the check confirmed every one exists.
- Key Decisions: the Dokploy row is updated in place to `Confirmed by Phase 1 spike (see Spike Findings)` and still appears once. Eight rows were appended (pinned stack, static output with the Node adapter, one /app/data volume, local media, Node 24 with the >=22.22.2 floor, passkeys only, the public JS rule, staying on Astro 6).
- Constraints now match the branch: `**Node**` names Node 24, `>=22.22.2` and engine-strict; `**Client JS**` names scripts/script-allowlist.json. The Validated and Active bullets and the Out of Scope token (`1.0` to `1.x`) were rewritten as specified, and the footer reads `2026-10-23 after the Phase 1 spike`.
- Evidence beat research in four places, each stated in the text: the Node floor is 22.22.2 (not 22.16.0) because of @emdash-cms/registry-verification@0.3.4; the audit lists six astro advisories; `data/` must exist before first boot; the credentials table has no rp id column so the rpId follows EMDASH_SITE_URL.
- Named gate (a) lists every residual advisory with severity and GHSA id from `spike/npm-audit.json` (astro 6, @astrojs/node 2, sharp 3, esbuild 1) with the mitigations in force and the Phase 5 decision. Gate (b), the extra recovery path (GitHub login versus an ingress block), is a Phase 5 gate. Gate (k) is recorded as enforced: `upload_without_header_status` is 403.
- Task 2: `rm -rf node_modules dist`, `npm ci` (engine-strict, Node 24.17.0) exit 0, `npx astro check` 0 errors 0 warnings 0 hints, `npm run build` exit 0, compare 17/17 identical, check 17/17 passed. `git rev-parse main` equals the MANIFEST git_sha f4e5470, `origin/emdash-migration` does not exist, `data/` and `.emdash/migrations.json` are untracked and `data/` is absent, no tracked file is modified, no `pf-spike` container or volume remains, and nothing listens on ports 4399, 4400, 4401 or 9333.

## Task Commits

1. **Task 1: Record spike answers, tensions, gates and Key Decisions in PROJECT.md** - no commit (PROJECT.md is untracked on purpose and was never `git add`ed)
2. **Task 2: Phase exit check** - no commit (changes no repo file; evidence written to `phase-exit.txt`)

The measured commit count between `plan_head_before` and HEAD at write time is 0. The docs commit that follows this summary is metadata only.

## Files Created/Modified

- `.planning/PROJECT.md` - edited on disk, untracked, not committed
- Outside the repo: `~/portfolio-baseline/current/spike/phase-exit.txt`

## Decisions Made

- Where the plan allowed a choice, the wording stays within the plan text; the only additions were evidence-backed notes (the Node floor cause in the Node row, the astro advisory count, the data/ prerequisite, the real-device note on the one transient passkey failure).
- Gate (l): the 01-02 summary listed no generated file as a Phase 2 decision, so the gate records that and notes `.emdash/types.ts` stays trackable (from 01-01).
- The `## Current Milestone` target-features line still says "zero client JS" for public pages. The plan did not list that line for rewording and prohibits other edits beyond its list, so it is left as is and noted here for the next phase transition.

## Deviations from Plan

None - plan executed exactly as written.

Two process notes, not deviations: the plan's `node -e` verify was run as an equivalent script file in the session scratchpad (`verify-task1.mjs`) because earlier plans saw commands containing `process.env` denied; it applies the same checks and uses `os.homedir()` for the path. A PostToolUse formatter re-aligned the Key Decisions table padding after the edits; content is unchanged.

## Issues Encountered

- The shell redirect fallback was not needed. `phase-exit.txt` was written with the file-write tool and the notes line in it says command output was captured in the scratchpad.
- Plan 01-04's one unexplained single "Authentication failed" on an A2-only sign-in is carried into the passkeys Answers row as a caveat with the real-device Phase 5 enrollment as the final check.
- npm install output still prints the four known audit findings; nothing was changed because they are the recorded Astro 6 gate.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. T-01-21 held (every cited path exists, 16 cited against a minimum of 8), T-01-22 accepted, T-01-23 held (main equals the baseline SHA, no origin/emdash-migration, no push run), T-01-SC held (`npm ci` from the committed lockfile, no new package).

## User Setup Required

None.

## Next Phase Readiness

- Phase 1 has all five plans complete. FOUND-03 is satisfied: its acceptance criteria all passed, so it is marked complete in REQUIREMENTS.md (an untracked file, edited on disk only).
- Phase 2 inherits gates for the tags field, the stats repeater and the about entry shape. Phase 3 inherits the rendering-mode measurement and the anonymous GUARD-01 check. Phase 5 inherits the Astro 6 advisory decision, the extra recovery path, the deprecated auth dependencies, amd64 image testing, session store location, security headers, EMDASH_SITE_URL and the migrations.json decision.
- Stale items for later: the CLAUDE.md rewrite is DOCS-01 in Phase 6, and the Current Milestone target-features wording in PROJECT.md.

## Self-Check: PASSED

- FOUND: `.planning/PROJECT.md` with all five new subsections; `git ls-files .planning/PROJECT.md` prints nothing
- FOUND: `~/portfolio-baseline/current/spike/phase-exit.txt` with every required line
- Task 1 and Task 2 automated verify commands both passed; `data/` absent; no pf-spike container or volume; nothing listening on 4399, 4400, 4401 or 9333
- Commits: 0 measured between `plan_head_before` and HEAD, as expected for a plan that changes no tracked file

---

_Phase: 01-spike-baseline-and-decisions_
_Completed: 2026-10-23_
