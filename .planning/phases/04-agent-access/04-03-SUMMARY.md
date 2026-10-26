---
phase: 04-agent-access
plan: 03
subsystem: agent-access
tags: [emdash, mcp, pat, evidence, live-pass]
status: partial
requires:
  - 04-01
  - 04-02
provides:
  - Evidence record of the live agent access pass (E1 to E5 passed, E2 negative control, X1 and X2 independent checks)
  - Honest record that E6 (Claude Code guard live) and E7 (fresh README session) were not verified, with the steps to close them
affects: [05-deploy, 06-docs]
tech-stack:
  added: []
  patterns:
    - "evidence file in the 02-MCP-API-PASS style: Results table, Procedure, Not covered"
    - "anonymous curl as the only page oracle, read-only node:sqlite for token facts without selecting token_hash or prefix"
key-files:
  created:
    - .planning/phases/04-agent-access/04-AGENT-ACCESS-PASS.md
  modified: []
key-decisions:
  - "E6 and E7 recorded as NOT VERIFIED rather than inferred from the curl calls; the 45 offline guard tests are cited as the only evidence for E6"
  - "The 7 day token expiry is recorded as a deviation in X1, not a pass, with a recreate-before-real-use note"
requirements-completed:
  - AGENT-01
  - AGENT-03
requirements-addressed:
  - AGENT-02
  - AGENT-04
plan_head_before: ab2e7a5bebffb02fff66e819efd4415e9f4365d0
plan_head_after: 067013b7c7fe6ff0fafa6fe2f48be475d9e5a9f7
commits: 2
actuals:
  tokens: 5500
  tasks: 3
  commits: 2
duration: 15 min
completed: 2026-10-26
---

# Phase 4 Plan 03: Live agent access pass Summary

The scoped `claude-agent` token authenticated over MCP and the CLI, a data edit to a published card stayed off the page until the user published, and schema and settings calls were refused by EmDash; the Claude Code guard (E6) and the fresh README session (E7) were not verified live, and the token was created with a 7 day expiry instead of 90.

## Performance

- **Duration:** 15 min (14:26 to 14:41 local, across the Task 1 session and this continuation)
- **Completed:** 2026-10-26T18:41Z
- **Tasks:** 3 of 3 executed (Task 2 was completed by the orchestrating session by a different route than planned, see Deviations)
- **Files modified:** 1 (the evidence file)

## Results per row

| Row | Outcome                                                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | PASS. MCP `tools/list` and `content_list` (first slug `agency-ops-hub`) with the token; CLI `content list projects --limit 1` returned the same item                                                                    |
| E2  | PASS (Task 1). No header: 401 NOT_AUTHENTICATED. Malformed bearer: 401 INVALID_TOKEN                                                                                                                                    |
| E3  | PASS. Draft created (404 anonymous), user published (200), data edit returned the new sub, `liveData` kept the old one, `draftRevisionId` set, `content_compare` `hasChanges` true, page unchanged before publish       |
| E4  | PASS. After the user published the pending change the anonymous page showed the new sub only (same after a 3 second retry)                                                                                              |
| E5  | PASS. INSUFFICIENT_SCOPE for `schema_create_field` (schema:write), `schema_get_collection` (schema:read), `settings_update` (settings:manage); CLI `schema list` refused with "Token lacks required scope: schema:read" |
| E6  | NOT VERIFIED live. No `mcp__emdash__` tools were loaded; the deny rules and hook were never exercised. Evidence that exists: 45 offline guard tests from 04-01                                                          |
| E7  | NOT VERIFIED. No fresh README-started session was run                                                                                                                                                                   |
| X1  | DEVIATION. One `claude-agent` token, exactly the six scopes, last used during the pass; expiry is 7.04 days after creation, not the 90 days of D-07                                                                     |
| X2  | PASS. No `ec_projects` row for `agent-access-check`, page 404, most recently updated real cards are import-time (2026-10-26T16:23Z)                                                                                     |

## Accomplishments

- Evidence file `04-AGENT-ACCESS-PASS.md` holds the header, state and run-note paragraphs, the nine-row Results table, the Procedure R1 to R13 and a full Not covered section.
- AGENT-02 as amended by D-03 is shown live: the agent drafts, the user publishes (E3 and E4, D-02 held, the page did not change before publish).
- AGENT-03 is shown live: schema and settings refusals came from the EmDash server, over MCP and the CLI.
- Independent read-only checks (X1, X2) used `node:sqlite` read-only with parameterized queries and never selected `token_hash` or `prefix`.
- Not covered records the UI-only steps resting on the user, the curl route of the calls, the outstanding E6 and E7 with the E7 step list, the D-01 amended residual risk, the guard-withheld taxonomy tools, the D-03 amendment, the D-08 Phase 5 token recreation handoff, the 7 day expiry and the `_rev` observation.

## Task Commits

1. **Task 1: Tracer, live negative control and run procedure** - `6f7cfd5` (docs)
2. **Task 2: Token creation and live run (checkpoint)** - no commit; done by the user (token, both publishes, trash and permanent delete) and the orchestrating session (the calls)
3. **Task 3: Independent checks and completed evidence record** - `067013b` (docs)

**Plan metadata:** committed separately after this file (docs: complete plan).

## Files Created/Modified

- `.planning/phases/04-agent-access/04-AGENT-ACCESS-PASS.md` - the evidence record

## Decisions Made

- E6 is not inferred from the curl calls: those bypass the guard entirely, which is exactly the residual risk in README Residual risk, so the row says NOT VERIFIED and cites only the offline tests.
- The `last_used_at` and scope facts in X1 confirm the calls used this token, but the expiry mismatch is recorded as a deviation rather than rounded into a pass.

## Deviations from Plan

**1. [Process deviation] Task 2 was run by the orchestrating Claude Code session, not by a fresh README session**

- **Found during:** Task 2 (checkpoint)
- **What happened:** At the user's request the orchestrating session made the live calls by JSON-RPC POSTs to the MCP endpoint and by `npx emdash`, with the user's token. The user did the admin steps (token creation, both publishes, trash and permanent delete). The plan expected a fresh session started from the README to do all of it.
- **Effect:** E1, E3, E4 and E5 are real observations against the live server with the real token. E6 and E7 depend on a connected MCP session and could not be observed this way.

**2. [Plan verify not satisfied] Task 3 database check fails on expiry**

- **Issue:** The plan's automated database check requires 89 to 91 days between creation and expiry. The stored token has 7.04 days (created 2026-10-26 18:35:43 UTC, expires 2026-11-02T19:35:42.996Z). The check exits 3 solely at the expiry clause; the single-token, exact-scope, last_used_at and no-leftover-row clauses hold.
- **Handling:** Recorded as a deviation in X1, not a pass. The user should recreate the token with a 90-day expiry before real use. The cause was not investigated.

**3. [Plan verify satisfied by wording] E6 and E7 are not "observed outcomes"**

- **Issue:** The plan's checks only require that no Results cell reads as open. E6 and E7 are filled with NOT VERIFIED and their reasons. That makes the automated row checks pass but does not mean the checks passed, and the summary does not claim it.

**4. [Rule 3 - Blocking] `npm run check:public-js` not run**

- **Issue:** It builds and serves on 127.0.0.1, and the project rule forbids starting servers unasked. This plan changes no source file (only an evidence file), so it is also not expected to be affected. Left for the user or the phase verifier, same as 04-01 and 04-02.

**Total deviations:** 1 process deviation, 1 unmet plan verify clause (expiry), 1 weak verify noted, 1 verification step skipped. **Impact:** E6 and E7 remain open; AGENT-02 (guard part) and AGENT-04 are not live-proven.

## Observation (not a deviation)

`content_update` in E3 was sent with an empty `_rev` (a shell extraction slip) and EmDash accepted it, so the `_rev` optimistic-concurrency token is not strictly enforced on this path. It does not affect AGENT-02 and is recorded in Not covered.

## Known Stubs

None.

## Threat Flags

None new. T-04-11 held: the evidence file contains only `ec_pat_REDACTED`, the secret scan found no token-shaped value in any tracked or untracked file, and database reads never selected `token_hash` or `prefix`. T-04-12 is partly open: X1 shows the calls used this token, but E7 (clean session with no OAuth prompt) was not run. T-04-13 held: exactly the six scopes. T-04-14 held: the page did not change before publish. T-04-15 held: only the throwaway entry was written, and it is gone.

## Issues Encountered

None beyond the deviations.

## User Setup Required

To close the phase:

1. E7 (AGENT-04, D-10): in a new terminal export only `EMDASH_TOKEN`, change to the repository root, follow README Agent access verbatim, confirm `claude mcp list` shows `emdash` Connected, start `claude`, approve the project server, call `content_list` on `projects` with limit 1, and confirm no OAuth prompt. Record the result in the E7 cell.
2. E6: in that same connected session, run R3 and R6 of the Procedure (the nine tools absent, status and taxonomies updates blocked with `emdash-guard: blocked`).
3. Recreate the `claude-agent` token with a 90-day expiry before real use.

## Next Phase Readiness

- Phase 5 handoff (D-08): tokens are deleted with their owning user, so after the database move the token is recreated in the deployed admin with the same six scopes and a 90-day expiry, and the local one is never reused.
- The phase verifier should treat AGENT-04 and the live-guard part of AGENT-02 as human_needed until E6 and E7 are done. AGENT-01 and AGENT-03 are live-verified.

## Self-Check: PASSED

- FOUND: `.planning/phases/04-agent-access/04-AGENT-ACCESS-PASS.md`
- FOUND commits: 6f7cfd5, 067013b
- Evidence file: nine Results rows, none open, no em or en dash, no token-shaped value; `npm test`: 87 pass, 0 fail
- The database check exit 3 on expiry is a documented deviation, not a self-check failure
