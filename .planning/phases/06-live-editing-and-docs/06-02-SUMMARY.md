---
phase: 06-live-editing-and-docs
plan: 02
subsystem: docs
tags: [readme, claude-md, emdash, mcp, deploy, rollback]

requires:
  - phase: 06-live-editing-and-docs
    provides: 06-EVIDENCE.md rows E1 to E9 PASS, the proven draft, preview, publish and restore loop
  - phase: 05-dokploy-deploy-and-cutover
    provides: the manual deploy steps, the smoke test and the rehearsed volume restore (05-EVIDENCE.md rows B1 to B3)
provides:
  - README.md replaced with six sections (What this is, Local development, Editing content, Deploying, Rolling back, Agent access)
  - CLAUDE.md surgical additions: draft-first convention, admin-only client JS and no-new-JS rule, no-plugins rule
affects: [verify-work for phase 06]

status: complete
plan_head_before: 0fad66426626ccd76517e714c32a9948c5ead322
plan_head_after: 1161601e16e8cb654b81fe7bf763fb53bc76c8f4
commits: 2

actuals:
  tokens: 1300
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - README.md
    - CLAUDE.md

key-decisions:
  - "Open Question 1 (Task 2): convention, auto-selected from the plan's auto_select default because auto chain was active and the gate was blocking, not blocking-human. Draft-first is documented as a convention with no enforcement claim"

requirements-completed: [DOCS-01, DOCS-02]

coverage:
  - id: D1
    description: "README describes local setup, editing, manual deploy, rollback and agent access, with no starter text, dash, emoji, token text or guard claim"
    requirement: "DOCS-02"
    verification:
      - kind: other
        ref: "Task 1 and Task 3 node gates (headings, required strings, link resolution, no seed command, no token text) plus node scripts/smoke-test.mjs https://dev.zeikcookson.com printing smoke-test: PASS"
        status: pass
    human_judgment: false
  - id: D2
    description: "CLAUDE.md states admin-only client JS, no-new-JS, no-plugins and draft-first, with Stack, Design System and Deployment byte-identical to e2ce3f7"
    requirement: "DOCS-01"
    verification:
      - kind: other
        ref: "Task 3 CLAUDE.md gate (section equality against e2ce3f7, required phrases, no added dash, 30 lines)"
        status: pass
    human_judgment: false

duration: n/a
completed: 2026-10-28
---

# Phase 6 Plan 02: README and CLAUDE.md for the EmDash workflow Summary

The Astro starter README is gone: the new one walks through local setup, the draft, preview, publish and restore loop proven in 06-01, the manual Dokploy deploy, rollback, and the OAuth agent connection, and CLAUDE.md gained the three missing rules and the draft-first sentence.

## Accomplishments

- **Task 1 (tracer), README sections one to five.** Written from the facts in 06-EVIDENCE.md and 05-EVIDENCE.md. The documented deploy check passed against production as written (`smoke-test: PASS`) and every relative link resolves. Local development lists `mkdir -p data` before `npm run dev` and the setup wizard Sample content path, and gives no CLI seed command, so the wrong-database seed trap cannot be hit. Commit `b89b7ac`.
- **Task 2, decision.** See the next heading.
- **Task 3, Agent access and CLAUDE.md.** Commit `1161601`.

## Open Question 1: how the docs describe draft-first

Choice: `convention`, selected automatically under auto mode from the plan's `auto_select` (the gate is `blocking`, not `blocking-human`). Premise check passed before the choice was applied: no guard file in the repo (`.claude/hooks/emdash-guard.mjs`, `.claude/settings.json`, `scripts/emdash-guard.test.mjs` all absent), `.mcp.json` is URL-only with no headers, and the global `~/.claude/settings.json` carries no `mcp__emdash` rule. The README and CLAUDE.md therefore say the agent drafts and the owner publishes, and that nothing enforces it because the OAuth session holds the owner's admin rights. D-07's wording about a client-side publish deny guard is not carried over, because that guard was removed in 882521a.

## README sections

1. What this is
2. Local development
3. Editing content
4. Deploying
5. Rolling back
6. Agent access

## CLAUDE.md lines added or replaced

- `## Content`: one sentence added on the same paragraph, saying Claude edits through the `emdash` MCP server in `.mcp.json` (OAuth, owner's admin rights), saves drafts only, the owner publishes, and that this is a convention nothing enforces.
- `## Code Rules`: the "No client-side JS unless" bullet replaced by one saying no client JS on public routes, client JS runs only under `/_emdash/admin`, and never add a script, modulepreload or module tag to a public route (`npm run check:public-js` fails CI).
- `## Code Rules`: one new bullet, no third-party EmDash plugins (`EMDASH_ENCRYPTION_KEY` stays unset because no plugin declares a secret).
- Node version: confirmed, not edited. `## Deployment` already states the Node 24 image and `engines` >=22.22.2, along with the Dokploy Deploy click, CI-only push and the smoke test.
- `## Stack`, `## Design System` and `## Deployment` are byte-identical to e2ce3f7, and the title line keeps its em dash. The file is 30 lines against a limit of 34.

## Deviations from Plan

None - plan executed exactly as written. Two notes on method:

- The Task 1 and Task 3 gates in the plan contain `_` where a regex `*` was clearly intended (markdown mangling in the plan text). I ran an equivalent script with `*` from the scratchpad, with the same checks.
- The README ends with a trailing Agent access section written by appending from the shell, then checked by the Task 3 gate.

## Known limits

- The rehearsed restore and the preview and draft loop are linked, not re-run, so their claims rest on 05-EVIDENCE.md and 06-EVIDENCE.md.
- The code rollback route is stated in the README as not rehearsed, as in 05-EVIDENCE.md.

## Known Stubs

None.

## Threat Flags

None. Only docs changed. No token, host IP or OAuth value was written; the MCP server is named by URL only (T-06-06, T-06-07 and T-06-08 mitigations hold).

## Self-Check: PASSED

- FOUND: `README.md` and `CLAUDE.md`
- FOUND commits `b89b7ac` and `1161601` on the current branch (ancestors of HEAD)
