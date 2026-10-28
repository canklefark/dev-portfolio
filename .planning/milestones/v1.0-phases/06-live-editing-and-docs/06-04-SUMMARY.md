---
phase: 06-live-editing-and-docs
plan: 04
subsystem: docs
tags: [sweep, stale-references, docs-cleanup, evidence, emdash]

requires:
  - phase: 06-live-editing-and-docs
    provides: 06-02 README and CLAUDE.md, 06-03 deletions and the owner's zshrc and card edits
provides:
  - 06-EVIDENCE.md section Stale references (DOCS-03) with rows S1 to S11, all closed
  - the two tracked docs/superpowers design specs removed with git rm
  - the D-13 sweep recorded as two git grep commands that return no match
affects: [verify-work for phase 06]

status: complete
plan_head_before: f5ffd916473ebba2c7448384f34a46ec3bdbd961
plan_head_after: fba8ce6f71adaa940aa5542b7aac394180acf557
commits: 2

actuals:
  tokens: 4500
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - .planning/phases/06-live-editing-and-docs/06-EVIDENCE.md
  deleted:
    - docs/superpowers/specs/2026-05-14-logbook-quick-capture-design.md
    - docs/superpowers/specs/2026-05-16-friend-portfolio-fork-design.md

key-decisions:
  - "Open Question 3: remove the two tracked specs with git rm. Open Question 4: flag the two symlinked skills and leave them untouched. Both applied from the plan's recommended defaults, delegated by the owner"

requirements-completed: [DOCS-03]

coverage:
  - id: D1
    description: "D-13 sweep over tracked and untracked files outside .planning returns no match, with the two specs removed and the evidence rows S1 to S11 all PASS or FLAGGED"
    requirement: "DOCS-03"
    verification:
      - kind: other
        ref: "Task 3 verify commands (sweep union exit 0 with zero files, evidence gate exit 0, regression gate exit 0, npm test 51 pass 0 fail)"
        status: pass
    human_judgment: false

duration: n/a
completed: 2026-10-28
---

# Phase 6 Plan 04: D-13 stale-reference sweep and phase close Summary

The one-time sweep for the removed markdown workflow now comes back empty: the two stale design specs were removed with git rm, the two symlinked skills are flagged in the evidence file, and rows S1 to S11 are all closed.

## Open Questions 3 and 4: owner reply

The owner delegated the Task 2 decision checkpoint to the orchestrator and asked for no further stops, so the plan's recommended option was applied. The Task 2 premise check passed first (both specs tracked, both skill paths symlinks).

- **Open Question 3: remove.** `git rm` of `docs/superpowers/specs/2026-05-14-logbook-quick-capture-design.md` and `docs/superpowers/specs/2026-05-16-friend-portfolio-fork-design.md`. They stay in git history. The untracked local plans under `docs/superpowers/plans` were left alone.
- **Open Question 4: flag.** `portfolio-logbook` and `portfolio-projects` are symlinks into `ai-skills/development`. They were not edited, unlinked or deleted, and nothing in the ai-skills repository changed.

## Accomplishments

- **Task 1 (tracer), commit `a6636c3`.** Ran the sweep as the union of a plain and an `--untracked` `git grep`: only the two tracked specs matched, so no earlier plan missed a reference. Live state checks passed: the portfolio-update skill, `docs/friend-portfolio-intake.md` and `scripts/log.sh` are absent, `~/.zshrc` has no `portfolio/scripts/log.sh` line, the anonymous dev-portfolio page answers 200 without the three stale phrases, `.emdash/seed.json` equals `e2ce3f7`, and the two untracked plans exist and are gitignored. Appended the `## Stale references (DOCS-03)` section with S4, S6 and S11 open.
- **Task 2 (decision), no commit.** Resolved by the owner delegation above.
- **Task 3, commit `fba8ce6`.** Removed the two specs, filled S4 (PASS), S6 (FLAGGED) and S11 (PASS), reran the sweep (no match from either command) and ran the phase regression gates.

## Sweep commands and result

Run from the repo root. The first command is the plain run and the second adds `--untracked`, because `--untracked` alone skips tracked files under an ignored folder.

```
git grep -n -I -e src/content -e src/data/about -e portfolio-update -e 'scripts/log\.sh' -e friend-portfolio-intake -e logbook/ -- . ':!.planning' ':!package-lock.json'
git grep --untracked -n -I -e src/content -e src/data/about -e portfolio-update -e 'scripts/log\.sh' -e friend-portfolio-intake -e logbook/ -- . ':!.planning' ':!package-lock.json'
```

Result: exit 1 (no match) from both. The plan's gate uses an equivalent `-E` regex; S11 records the `-e` form because a `|` would break the evidence table cell.

## Rows S1 to S11

- S1: PASS, portfolio-update skill absent (moved to the Trash in 06-03).
- S2: PASS, `docs/friend-portfolio-intake.md` deleted.
- S3: PASS, `scripts/log.sh` deleted and no rc file mentions it.
- S4: PASS, both specs removed with git rm (Open Question 3: remove).
- S5: FLAGGED, two gitignored local plans left in place.
- S6: FLAGGED, `portfolio-logbook` and `portfolio-projects` left untouched (Open Question 4: flag).
- S7: PASS, dev-portfolio page free of the three stale phrases.
- S8: FLAGGED, `.emdash/seed.json` holds the Phase 2 snapshot, unchanged since `e2ce3f7`, never hand-edited.
- S9: PASS, six logbook-wording files reviewed and kept as design tone or a CSS class.
- S10: PASS, README.md and CLAUDE.md describe the EmDash workflow.
- S11: PASS, final sweep returns no match.

## Regression checks (Task 3)

- `catalog-cms` page sha1 still equals H0 from row E1.
- The dev-portfolio page has none of the three stale phrases.
- `.emdash/seed.json` equals `e2ce3f7`.
- README keeps its six sections and CLAUDE.md keeps the 06-02 additions.
- `npm test`: 51 tests, 51 pass, 0 fail.
- No file contains the word PENDING, a dash, an IPv4 address or a preview query value; E1 to E9 are all PASS.

## Deviations from Plan

**Process deviation, not a logic change:** the Task 2 blocking decision checkpoint was answered by the orchestrator on the owner's delegation, with the plan's recommended defaults, instead of by a direct owner reply. No other change.

**Minor:** S11 records the `git grep` command with repeated `-e` flags instead of one `-E` alternation, so the evidence table cell holds no pipe character. The pattern set is identical and was run to confirm the same empty result.

## Known Stubs

None.

## Threat Flags

None. Two tracked doc files were deleted and one evidence file was edited. No source, route, config or dependency changed and no package was installed. Nothing was pushed, and `.planning/config.json`, `.emdash/seed.json` and the ai-skills repository were not touched.

## Self-Check: PASSED

- FOUND: `.planning/phases/06-live-editing-and-docs/06-EVIDENCE.md` with section `## Stale references (DOCS-03)`
- MISSING as intended: the two `docs/superpowers/specs` files
- FOUND commits `a6636c3` and `fba8ce6` on `gsd/phase-06-live-editing-and-docs`
