---
phase: 04-agent-access
verified: 2026-10-26T20:00:00Z
status: human_needed
score: 2/4 must-haves verified
covered_files:
  - ".claude/hooks/emdash-guard.mjs"
  - ".claude/settings.json"
  - ".mcp.json"
  - ".planning/phases/04-agent-access/04-01-PLAN.md"
  - ".planning/phases/04-agent-access/04-01-SUMMARY.md"
  - ".planning/phases/04-agent-access/04-02-PLAN.md"
  - ".planning/phases/04-agent-access/04-02-SUMMARY.md"
  - ".planning/phases/04-agent-access/04-03-PLAN.md"
  - ".planning/phases/04-agent-access/04-03-SUMMARY.md"
  - "README.md"
  - "scripts/emdash-guard.test.mjs"
covered_digest: "v3:sha256:e16eb5003bf62708b0acf6eef056d366ef31eff4b301feca8cee0f8bb2a7dbee"
behavior_unverified: 2
overrides_applied: 0
behavior_unverified_items:
  - truth: "Criterion 2 (guard half): the agent cannot publish; the draft-only guard (deny rules plus PreToolUse hook) is what keeps publish with the user (AGENT-02 as amended by D-03)"
    test: "In a Claude Code session started from the repo root with the emdash MCP server connected, list tools named mcp__emdash__*, then call content_update with status published on a throwaway entry and again with taxonomies { tag: [] } (procedure R3 and R6 in 04-AGENT-ACCESS-PASS.md)"
    expected: "The nine guarded tools are absent, and both content_update calls are refused with a message starting 'emdash-guard: blocked' before reaching the server"
    why_human: "The hook and deny rules were never exercised inside a live Claude Code session. The 45 offline tests run the registered hook command against synthetic payloads, which proves the hook logic but not that Claude Code loads .claude/settings.json, matches mcp__emdash__.* and applies the deny rules. The pass calls were curl and CLI, which the guard does not cover."
  - truth: "Criterion 4: following the documented Claude Code MCP setup from a clean session produces a working connection (AGENT-04, D-10)"
    test: "In a new terminal export only EMDASH_TOKEN, cd to the repo root, follow README Agent access verbatim: claude mcp list shows emdash Connected, start claude, approve the project server, run content_list on projects with limit 1"
    expected: "emdash is Connected, content_list returns projects, no OAuth prompt appears, and no README step had to be changed or added"
    why_human: "No fresh README-started session has been run (E7 NOT VERIFIED). The README is present and detailed, but the connection path, the ${VAR:-default} expansion in .mcp.json and the absence of an OAuth prompt were never observed."
human_verification:
  - test: "E7: clean session from README (AGENT-04, D-10)"
    expected: "emdash Connected, content_list returns projects, no OAuth prompt, README needs no edits"
    why_human: "Needs a fresh Claude Code session the user starts"
  - test: "E6: guard live in a connected session (AGENT-02 guard half)"
    expected: "Nine tools absent; status and taxonomies content_update refused with 'emdash-guard: blocked'"
    why_human: "Needs a Claude Code session with the emdash MCP tools loaded"
  - test: "Recreate the claude-agent token with a 90-day expiry"
    expected: "Token expires about 90 days after creation (current one expires 2026-11-02, 7 days, a deviation from D-07)"
    why_human: "Token creation is an admin UI step; the 7 day cause was not investigated"
---

# Phase 4: Agent Access Verification Report

**Phase Goal:** Claude can manage portfolio content through EmDash's MCP server or CLI, using a token that writes drafts and publishes on request but cannot change the schema (ROADMAP wording; amended by D-03, see Requirement Amendment below)
**Verified:** 2026-10-26
**Status:** human_needed
**Re-verification:** No, initial verification

## Verdict

No gap was found: every artifact the phase promised exists, is substantive and is wired, and the live observations that were made hold up under independent re-checking. The phase is not `passed` because two must-haves rest on live behavior nobody has observed: the Claude Code guard in a real session (E6) and the clean-session connection from the README (E7). The status is `human_needed`, not `passed`, and the two items below must be done by the user.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| #   | Truth                                                                                                                                             | Status                                          | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A scoped personal access token (content read and write, media and menus, no schema or admin scope) authenticates against the MCP endpoint         | VERIFIED                                        | Independent read-only query of `data/emdash.db` in this verification: exactly one token `claude-agent`, scopes `content:read, content:write, media:read, media:write, taxonomies:manage, menus:manage`, `last_used_at` 2026-10-26T18:37:51Z (written during the pass, so the token was used). E1 recorded MCP `tools/list` and `content_list` succeeding and the CLI `content list` succeeding. E2: no token gives 401 NOT_AUTHENTICATED, a malformed token 401 INVALID_TOKEN. Caveat: the 7 day expiry is a deviation from D-07 (see Warnings).                          |
| 2   | Claude updates a project card through MCP or CLI, the change lands as a draft, and it appears on the rendered page only after an explicit publish | PARTIAL: VERIFIED + PRESENT_BEHAVIOR_UNVERIFIED | Draft half VERIFIED live (E3, E4): an update to a published throwaway card returned `data.sub` new, `liveData.sub` old, `draftRevisionId` set, `content_compare` hasChanges true, anonymous page unchanged until the user published, then showed the new copy. The calls were curl JSON-RPC and CLI, not MCP tools in a live session, but they are the same wire calls and X1 shows the token was used. Guard half (the agent cannot itself publish) is PRESENT_BEHAVIOR_UNVERIFIED: files wired and 45 offline tests pass, never run live (E6). Counted as not verified. |
| 3   | A schema-changing call made with the agent token is refused                                                                                       | VERIFIED                                        | E5: `schema_create_field` INSUFFICIENT_SCOPE (schema:write), `schema_get_collection` (schema:read), `settings_update` (settings:manage), CLI `schema list` "Token lacks required scope: schema:read". Refused by the EmDash server, not by the guard. Confirmed in source: `node_modules/emdash/dist/astro/routes/api/mcp.mjs` registers the schema and settings tools behind `requireScope`; the hook defers those tools (offline tests "defers schema_create_field", "defers settings_update"), so the refusal is the server's.                                         |
| 4   | Following the documented Claude Code MCP setup from a clean session produces a working connection, with the endpoint URL set per environment      | PRESENT_BEHAVIOR_UNVERIFIED                     | Documented: `README.md` lines 45 to 118 ("Agent access") cover env vars (EMDASH_MCP_URL full path, EMDASH_URL origin), token creation, the four connection steps and the OAuth warning. `.mcp.json` carries `${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}` and `Bearer ${EMDASH_TOKEN}`, no secret. Not proven: E7 was never run, so Connected status, `content_list` from that session and no OAuth prompt are unobserved. Counted as not verified.                                                                                                          |

**Score:** 2/4 truths verified (2 present and wired, behavior-unverified: criterion 2 guard half, criterion 4)

### Requirement Amendment (D-03, D-01, D-12 amended)

ROADMAP Phase 4 goal and criterion 2 still say the agent "publishes on request" / the change appears "after an explicit publish". REQUIREMENTS.md AGENT-02 was amended by the user on 2026-10-26: the agent drafts, the user publishes as a separate step, and a committed Claude Code guard enforces it, because EmDash 1.3.1 has no publish scope and a token inherits its owner's role. This verification records that amendment as accepted (D-03 requires it be recorded here). Criterion 2's "appears on the rendered page only after an explicit publish" is consistent with the amendment and was proven live (E4); only the goal sentence's "publishes on request" is stale. ROADMAP.md was not edited by this verification; updating the goal wording is recommended (Warning W2).

### Required Artifacts

| Artifact                         | Expected                                                                   | Status             | Details                                                                                                                                                                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.mcp.json`                      | One http server `emdash`, env-expanded url and bearer header, no secret    | VERIFIED           | Read in full. Tracked in git. No token value; repo-wide scan for `ec_pat_` followed by 10 or more token characters found nothing.                                                                                                             |
| `.claude/settings.json`          | Nine deny rules and a PreToolUse hook on `mcp__emdash__.*`                 | VERIFIED           | Read in full. Nine bare deny names match `BLOCKED_TOOLS` in the hook. Hook command `node "$CLAUDE_PROJECT_DIR/.claude/hooks/emdash-guard.mjs" \|\| exit 2` fails closed on crash or missing file. Tracked.                                    |
| `.claude/hooks/emdash-guard.mjs` | Fail-closed guard: blocked tools, update allowlist, create rules           | VERIFIED           | Read in full. `content_update` is an allowlist (a key added by a later EmDash version is refused), `content_create` blocks `publishedAt` and any non-draft status, schema/settings/site tools are deferred, any parse or shape error exits 2. |
| `scripts/emdash-guard.test.mjs`  | Offline tests picked up by `npm test`                                      | VERIFIED           | Ran `node --test scripts/emdash-guard.test.mjs` here: 45 tests, 45 pass, 0 fail (includes deny-rule parity and fail-closed cases). Tests execute the command registered in settings.json.                                                     |
| `README.md` Agent access         | Token, connection, guard boundaries, CLI fallback, rotation, residual risk | VERIFIED (content) | Present, seven subsections, residual risk stated plainly, every CLI write carries `--draft`, no em dash. Whether it works from a clean session is criterion 4, unverified.                                                                    |
| `04-AGENT-ACCESS-PASS.md`        | Evidence record with honest statuses                                       | VERIFIED           | E6 and E7 recorded NOT VERIFIED, X1 recorded DEVIATION, token appears only as `ec_pat_REDACTED`. The record does not overclaim.                                                                                                               |
| `.planning/REQUIREMENTS.md`      | AGENT-01 and AGENT-02 amended                                              | VERIFIED           | AGENT-01 lists the six scopes; AGENT-02 says draft by agent, publish by user, guard-enforced. AGENT-01 and AGENT-03 marked complete; AGENT-02 and AGENT-04 left pending, which matches this verdict.                                          |

### Key Link Verification

| From                         | To                               | Via                                             | Status                 | Details                                                                                                                |
| ---------------------------- | -------------------------------- | ----------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `.claude/settings.json`      | `.claude/hooks/emdash-guard.mjs` | PreToolUse command with `$CLAUDE_PROJECT_DIR`   | WIRED (statically)     | Command string runs under the offline tests. Claude Code loading it live is E6, unobserved.                            |
| `.claude/settings.json` deny | hook `BLOCKED_TOOLS`             | same nine names                                 | WIRED                  | Parity test passes.                                                                                                    |
| `.mcp.json` server name      | `mcp__emdash__` matcher          | Claude Code names tools `mcp__<server>__<tool>` | PARTIAL (unobserved)   | Server key is `emdash`, matching the matcher and deny rules by construction; no live session has shown the tool names. |
| `.mcp.json` url and header   | README env var table             | `EMDASH_MCP_URL`, `EMDASH_TOKEN`                | WIRED                  | Names and defaults match between the file and the README.                                                              |
| Token                        | EmDash MCP endpoint              | Bearer header                                   | WIRED (live, via curl) | `last_used_at` written during the pass; 401s without a token.                                                          |

### Data-Flow Trace (Level 4)

Not applicable. The phase renders no dynamic data. The one end-to-end flow (agent write, draft revision, publish, rendered page) is covered by E3 and E4. This verification re-probed read-only: `GET /projects/agent-access-check/` answers 404 (cleanup holds) and `GET /projects/catalog-cms/` answers 200.

### Behavioral Spot-Checks

| Behavior                                    | Command                                                                              | Result                                                                                      | Status                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Guard logic and fail-closed behavior        | `node --test scripts/emdash-guard.test.mjs`                                          | 45 pass, 0 fail                                                                             | PASS                                       |
| Token rows and scopes (no token value read) | read-only `node:sqlite` selecting name, scopes, expires_at, created_at, last_used_at | One row, six exact scopes, expires 2026-11-02T19:35:42Z against created 2026-10-26 18:35:43 | PASS for scopes; expiry deviates from D-07 |
| Throwaway entry removed                     | read-only count on `ec_projects` by slug, plus anonymous `curl`                      | count 0, HTTP 404                                                                           | PASS                                       |
| Real card renders                           | anonymous `curl` of `/projects/catalog-cms/`                                         | HTTP 200                                                                                    | PASS                                       |

No server was started; the two `curl` calls hit the dev server the user already had running, with no cookies and no writes. The full `npm test` suite and `npm run check:public-js` were not run: the phase changes no public route or source under `src/`, and `check:public-js` builds and serves.

### Probe Execution

Step 7c: no `probe-*.sh` is declared by any plan or exists under `scripts/`. SKIPPED (no probes).

### Prohibitions (all judgment-tier, per ADR-550 D4)

| Prohibition                                                                                                                    | Verdict                                                                                 | Evidence                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| No token value committed in `.mcp.json`, settings, hook, tests                                                                 | Verified by inspection (non-authoritative judgment)                                     | Files read; repo scan for real-looking `ec_pat_` values found none; README and pass file use `ec_pat_REDACTED`. |
| `content_update` with status, publishedAt, seo, bylines, taxonomies blocked; `content_create` non-draft or publishedAt blocked | Offline-tested; live unverified, FLAG: unverified-prohibition, human review recommended | Allowlist code and 45 passing tests; not exercised in a live session (E6).                                      |
| Hook must not block schema, settings, site tools                                                                               | Verified by inspection                                                                  | Hook defers all non-listed tools; tests "defers schema_create_field", "defers settings_update" pass.            |
| No dev server started, no push                                                                                                 | Held in this verification                                                               | Only read-only `curl` to an already running server; no push.                                                    |
| Token never printed or recorded                                                                                                | Held                                                                                    | Evidence file clean; this verification selected no `token_hash` or `prefix`.                                    |
| No real card edited during the pass                                                                                            | Verified (executor X2 and my re-check)                                                  | Zero `agent-access-check` rows; executor reported real cards untouched since import.                            |
| Agent token carries only the six scopes                                                                                        | Verified                                                                                | Independent database read matches exactly.                                                                      |

The one flagged item (guard live behavior) is also the E6 human item, so it is not silently absorbed.

### Requirements Coverage

| Requirement | Source Plan         | Description                                                                              | Status      | Evidence                                                                                                                                                             |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AGENT-01    | 04-01, 04-02, 04-03 | Scoped token (six scopes) works against the MCP endpoint                                 | SATISFIED   | Independent scope check and E1. Token lifetime deviation tracked separately.                                                                                         |
| AGENT-02    | 04-01, 04-02, 04-03 | Agent drafts, user publishes, guard refuses publish-class calls and live-write arguments | NEEDS HUMAN | Draft-then-publish proven live (E3, E4). Guard enforcement offline-tested only; E6 outstanding.                                                                      |
| AGENT-03    | 04-01, 04-03        | Schema-changing calls refused for the agent token                                        | SATISFIED   | E5 refusals from the server, confirmed against the MCP source. Taxonomy-definition withholding is guard-side and rides on E6 but is not the AGENT-03 schema refusal. |
| AGENT-04    | 04-01, 04-02, 04-03 | Working Claude Code MCP setup documented                                                 | NEEDS HUMAN | Documentation exists; the working-from-clean-session claim (E7) is unobserved.                                                                                       |

No orphaned requirements: REQUIREMENTS.md maps only AGENT-01 to AGENT-04 to Phase 4 and all four are claimed by plans.

### Anti-Patterns Found

None blocking. No TBD, FIXME or XXX markers, no stubs and no em or en dashes in the phase files (grep over the shipped files returned zero).

### Warnings

| ID  | Item                                                             | Impact                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Token created with a 7 day expiry, not 90 (D-07)                 | Independently confirmed. The token stops working on 2026-11-02, so the E7 session must happen before then or use a new token. README documents 90 days and notes the form defaults to 30, so the 7 day cause is unexplained and worth a look when recreating. |
| W2  | ROADMAP Phase 4 goal still says "publishes on request"           | Doc drift against the amended AGENT-02. Criterion 2 itself is consistent. Recommend editing the goal sentence to "writes drafts that the user publishes".                                                                                                     |
| W3  | `_rev` accepted empty on `content_update` (pass observation)     | Optimistic concurrency is not enforced on this path, so a stale agent write is not guaranteed refused. Does not break AGENT-02 (the edit still lands as a draft). README tells Claude to pass `_rev`; the server will not insist.                             |
| W4  | E1, E3 to E5 came from curl and CLI in the orchestrating session | Disclosed in the evidence file. They exercise the same server paths, but they are not an MCP tool session, which is why criteria 2 (guard) and 4 stay open.                                                                                                   |
| W5  | Residual risk accepted by the user (D-01 amended)                | The token itself can publish and delete; the guard is client-side and bypassable with curl, CLI without `--draft`, or hooks disabled. Stated in the README. Not a gap.                                                                                        |

### Human Verification Required

#### 1. E7: clean session from the README (AGENT-04, D-10)

**Test:** In a new terminal export only `EMDASH_TOKEN`, change to the repo root, follow README Agent access verbatim: `claude mcp list` shows `emdash` Connected, start `claude`, approve the project server, call `content_list` on `projects` with limit 1.
**Expected:** Connected, a project list returned, no OAuth prompt, and no README step changed or added.
**Why human:** Needs a fresh Claude Code session. Record the outcome in the E7 row of `04-AGENT-ACCESS-PASS.md`.

#### 2. E6: guard live in a connected session (AGENT-02 guard half)

**Test:** In that same connected session, run R3 and R6 of the procedure: list `mcp__emdash__*` tools, then try `content_update` with `status` published and with `taxonomies { "tag": [] }` on a throwaway entry.
**Expected:** The nine guarded tools are absent; both calls are blocked with `emdash-guard: blocked` before reaching the server.
**Why human:** Deny rules and the hook have never run inside Claude Code. Note that any refusal seen is client-side, not an EmDash refusal.

#### 3. Recreate the token with a 90 day expiry

**Test:** Create a new `claude-agent` token in the admin with the six scopes and a 90 day expiry, replace `EMDASH_TOKEN`, revoke the old one.
**Expected:** Expiry about 90 days out. Do this before E7 if it is after 2026-11-02.
**Why human:** Admin UI step. Optionally re-run the read-only expiry check afterwards.

### Gaps Summary

No gaps (nothing failed or is missing). The phase is code-complete and documented, AGENT-01 and AGENT-03 are live-proven and independently re-checked, and the draft-then-publish behavior is live-proven. Two behavior-dependent items remain unobserved: the Claude Code guard in a live session and the README connection from a clean session. When E6 and E7 are recorded as PASS, this phase can move to `passed`. If either fails, it becomes `gaps_found` with the README or guard wiring as the fix target.

---

_Verified: 2026-10-26_
_Verifier: Claude (gsd-verifier)_
