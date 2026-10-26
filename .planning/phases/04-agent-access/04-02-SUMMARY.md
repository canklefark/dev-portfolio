---
phase: 04-agent-access
plan: 02
subsystem: agent-access
tags: [readme, docs, mcp, emdash, requirements]
status: complete
requires:
  - 04-01
provides:
  - README Agent access section covering token creation, session connection, guard boundaries, CLI fallback, rotation and residual risk
  - AGENT-01 and AGENT-02 amended to the guarantees EmDash 1.3.1 can give
affects: [04-03, 05-deploy, 06-docs]
tech-stack:
  added: []
  patterns:
    - "per-environment values for MCP (full path) and CLI (origin only) listed side by side"
    - "every documented CLI write carries --draft; the list call, not whoami, is the authentication proof"
key-files:
  created: []
  modified:
    - README.md
    - .planning/REQUIREMENTS.md
key-decisions:
  - "Agent access section appended after the starter text without touching it (Phase 6 DOCS-02 rewrites the rest)"
  - "Residual risk stated plainly: the publish block is a Claude Code guard, and the token itself can publish, unpublish and delete"
  - "AGENT-01 and AGENT-02 amended per D-03 and D-06 amended; AGENT-03, AGENT-04 and the traceability rows left unchanged (still Pending until 04-03 verifies)"
requirements-completed: []
requirements-addressed:
  - AGENT-01
  - AGENT-02
  - AGENT-04
plan_head_before: c59673c60970ffb2770d1e59002e14be4969459c
plan_head_after: 33c80c796ec26404dd3a1cd7987c3ebc2306232c
commits: 2
actuals:
  tokens: 2250
  tasks: 2
  commits: 2
duration: 6 min
completed: 2026-10-26
---

# Phase 4 Plan 02: Agent access documentation Summary

README now documents the working agent setup (scoped token, env-expanded `.mcp.json`, Claude Code guard, safe CLI fallback, rotation, residual risk), and AGENT-01 and AGENT-02 state the scopes and the client-side draft guarantee that EmDash 1.3.1 can actually support.

## Accomplishments

- `README.md` gained `## Agent access` after the Discord paragraph, with seven subsections in order: Environment variables, Create the agent token, Connect a Claude Code session, What the agent can and cannot do, CLI fallback, Rotation and recovery, Residual risk. Every existing starter line is unchanged.
- Environment table lists `EMDASH_TOKEN`, `EMDASH_MCP_URL` (full path) and `EMDASH_URL` (origin only) with local and deployed values.
- Token steps name `claude-agent`, the six scopes, the 90-day expiry and the page `/_emdash/admin/settings/api-tokens`; the only example value is `ec_pat_REDACTED`.
- Connection steps use `claude mcp list` (Connected), the one-time project-server approval, `/mcp` and a `content_list` proof, and tell the user to decline any OAuth sign-in for emdash.
- Guard boundaries name all nine denied tools, the blocked `content_update` keys (`status`, `publishedAt`, `seo`, `bylines`, `taxonomies` and anything outside the draft-only set) and the `content_create` rules, and state that the guard runs in Claude Code, not EmDash.
- CLI fallback requires `EMDASH_TOKEN` and `EMDASH_URL`, explains the stored-credentials and localhost dev-bypass hazards with `npx emdash logout --url`, carries `--draft` on every write, and uses `content list` rather than `whoami` as the proof.
- `.planning/REQUIREMENTS.md`: AGENT-01 and AGENT-02 replaced with the two plan sentences; AGENT-03, AGENT-04 and the four Phase 4 traceability rows unchanged (Pending).

## Amended requirement sentences

- AGENT-01: scoped token with `content:read`, `content:write`, `media:read`, `media:write`, `menus:manage`, `taxonomies:manage`; no schema, settings, transfer or admin scope; D-06 amended note.
- AGENT-02: Claude creates and updates a project card with every write landing as a draft, the user publishes as a separate step in the admin, a committed Claude Code guard (deny rules and a PreToolUse hook) refuses publish-class calls and live-write arguments; D-01, D-03 and D-12 amended note.

## Wording decisions within D-04 to D-10

- The environment table's local cell for `EMDASH_MCP_URL` also says "also the default when unset", because `.mcp.json` carries that default.
- The intro and Residual risk say the user publishes "in the admin" and never imply EmDash refuses publish for this token.
- Token step 4 notes the form defaults to 30 days so the 90-day choice is not missed.
- A "Lands as a draft" bullet tells the user to close an entry in the admin before an agent write, because the editor lock refuses agent writes.

## Task Commits

| Task | Name                                                                           | Commit  |
| ---- | ------------------------------------------------------------------------------ | ------- |
| 1    | Tracer: README Agent access connection path                                    | 3839e68 |
| 2    | Guard boundaries, CLI fallback, rotation, residual risk; AGENT-01 and AGENT-02 | 33c80c7 |

The tracer feedback gate ran in auto mode: the Task 1 verify was re-run end to end and passed before Task 2 expanded the section.

## Verification

- Task 1 node check, Task 2 README node check and the REQUIREMENTS check all exit 0 (no missing item, no em or en dash, no token-shaped value, every CLI create or update line carries `--draft`, no runnable forbidden CLI line, traceability rows unchanged).
- `npm test`: 87 pass, 0 fail.
- `git diff --name-only` over the plan's commits lists only `README.md` and `.planning/REQUIREMENTS.md`.

## Deviations from Plan

### Auto-fixed Issues

None for code. One verification step was skipped by judgment.

**1. [Rule 3 - Blocking] Verification step not run: `npm run check:public-js`**

- **Found during:** plan-level verification
- **Issue:** The script builds and serves the app on 127.0.0.1, and the project rule forbids starting servers unasked. This plan touches no public route (README and REQUIREMENTS only).
- **Fix:** Skipped, same as plan 04-01. Left for the user or the phase verifier.

**2. [Plan instruction over default] `requirements mark-complete` not run**

- **Issue:** The plan says the four AGENT traceability rows stay Pending until 04-03 verifies them live.
- **Fix:** Skipped the mark-complete step so the rows stay Pending.

**Total deviations:** 1 verification step skipped by judgment, 1 state step skipped by plan instruction. **Impact:** none on scope.

## Known Stubs

None.

## Threat Flags

None. T-04-07 to T-04-10 are mitigated as planned: only `ec_pat_REDACTED` appears, the OAuth warning is in place, the CLI section requires `EMDASH_TOKEN` and `EMDASH_URL`, and every CLI write carries `--draft`.

## Issues Encountered

None. A PostToolUse formatter realigned the Markdown table after the first edit; the content was unchanged.

## Next

Ready for 04-03 (live proof of the setup and AGENT-03 refusal evidence). AGENT-01, AGENT-02 and AGENT-03 stay Pending until that verification.

## Self-Check: PASSED

- FOUND: README.md (`## Agent access`), .planning/REQUIREMENTS.md
- FOUND commits: 3839e68, 33c80c7
