---
phase: 04-agent-access
verified: 2026-10-26T19:45:00Z
status: human_needed
score: 6/7 must-haves verified
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
covered_digest: "v3:sha256:9d7033535a3a9ee4f2be489e58af1b7dfe6ea975d14c8cf5886942fb267e2531"
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 2/4
  gaps_closed:
    - "Criterion 4: clean-session connection from the README (E7), retested on the emdash-agent server with the corrected 90-day PAT"
    - "Criterion 2 guard half: deny rules and PreToolUse hook exercised in a live Claude Code session (E6)"
    - "Token expiry deviation from D-07: current claude-agent token is 90 days"
  gaps_remaining: []
  regressions: []
behavior_unverified_items:
  - truth: "Review-added hardening (CR-01, WR-04): the Bash guard refuses `emdash content create|update` without --draft and any --override-lock, the `Bash(curl *_emdash*)` deny rule blocks curl to _emdash paths, and the Edit/Write deny rules on /.claude/** and /.mcp.json hold"
    test: "In a Claude Code session started from the repo root, ask Claude to run `npx emdash content update projects SLUG --data '{}'` without --draft, to curl an _emdash URL, and to Edit .claude/settings.json (use a harmless target and cancel any prompt)"
    expected: "Each is refused before it runs: the first with 'emdash-guard: blocked Bash' naming --draft, the second by the curl deny rule, the third by the Edit deny rule"
    why_human: "Only the CLI publish case was seen live. The other branches are covered by 122 offline tests that run the registered hook command, and I ran the hook by hand on the renamed server, but Claude Code applying the deny-rule path syntax (/.claude/**) and the Bash(curl ...) pattern was never observed."
human_verification:
  - test: "Revoke the Phase 2 full-admin OAuth client 'Claude Code (emdash)' and its tokens in the admin, and clear the saved Claude Code OAuth login for the old server name emdash"
    expected: "The _emdash_oauth_clients and _emdash_oauth_tokens tables hold no row for that client. Claude Code no longer lists a saved sign-in for emdash"
    why_human: "Admin UI and local Claude Code credential step. At verification time (19:28 UTC) the database still held the client (scopes include schema:write, settings:manage, transfer:execute and admin), a refresh token valid to 2027-01-24 and an access token issued 19:02:01Z valid to 20:02:01Z."
  - test: "Run the live checks listed in behavior_unverified_items (Bash create without --draft, curl to _emdash, Edit on .claude/settings.json)"
    expected: "All three refused client-side"
    why_human: "Needs a live Claude Code session; optional hardening evidence, not a ROADMAP criterion"
  - test: "Record the all-fourteen-absent retest in the E6 row of 04-AGENT-ACCESS-PASS.md and refresh the stale 'nine tools', '45 tests' and 'treat AGENT-04 as human_needed' passages there"
    expected: "The evidence file states what was observed after the emdash-agent rename and no longer contradicts itself"
    why_human: "The retest is known to this verification only from the brief, not from any file in the repository"
---

# Phase 4: Agent Access Verification Report

**Phase Goal:** Claude can manage portfolio content through EmDash's MCP server or CLI, using a token that writes drafts and publishes on request but cannot change the schema (ROADMAP wording; amended by D-03, see Requirement Amendment below)
**Verified:** 2026-10-26
**Status:** human_needed
**Re-verification:** Yes, superseding the earlier human_needed verification (2/4). Everything below was re-checked against the repository and the database in this run, not copied from the summaries or the evidence file.

## Verdict

The goal is achieved. All four ROADMAP success criteria are VERIFIED with live evidence, and the database read I ran confirms the two facts that the earlier verification could not: the corrected token is six-scope and 90-day, and the clean-session retest authenticated with that token and not with the saved OAuth login.

The status is `human_needed`, not `passed`, for two reasons that are not gaps in the goal:

1. A full-admin OAuth credential from Phase 2 is still live in the database (details in Human Verification item 1). It is not what the agent session uses any more, but it is exactly the credential that made the first E7 result wrong, and it is still usable.
2. The hardening added after code review (CR-01 and WR-04) was seen live only for the CLI publish case, which makes one truth PRESENT_BEHAVIOR_UNVERIFIED.

No truth FAILED. No artifact is missing, a stub, or unwired.

## Goal Achievement

### Observable Truths

ROADMAP Success Criteria first (the contract), then the plan and review additions.

| #   | Truth                                                                                                                                                                        | Status                      | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | SC1: a PAT scoped to content read and write, media and menus, with no schema or admin scope, authenticates against the MCP endpoint                                          | VERIFIED                    | `sqlite3 -readonly` on `data/emdash.db` (selecting name, scopes, created_at, expires_at, last_used_at only): exactly one token `claude-agent`, scopes `content:read, content:write, media:read, media:write, taxonomies:manage, menus:manage`, created 2026-10-26 19:06:36, expires 2027-01-24T20:06:36Z (90.04 days), last used 2026-10-26T19:25:59Z. E1 and E2 (live): MCP `tools/list` and `content_list` succeed with it, no token gives 401 NOT_AUTHENTICATED, a malformed token 401 INVALID_TOKEN. The earlier 7-day expiry deviation is closed: it belonged to a token that was replaced.                                                                                                                                                                                                                        |
| 2   | SC2 (flow): Claude updates a project card, the change lands as a draft, and it reaches the rendered page only after an explicit publish                                      | VERIFIED                    | E3 and E4, live on a throwaway card: `content_update` of `sub` on a published card returned the new value, `content_get` showed `data.sub` new, `liveData.sub` old and a `draftRevisionId`, `content_compare` reported changes, the anonymous page kept the old copy, then showed the new copy only after the user published in the admin. This is a state-transition truth and a live test exercised it, so it is behaviorally proven. The calls were JSON-RPC and CLI rather than MCP tools in a tool session, but they are the same wire calls with the same token. Cleanup holds: count of `ec_projects` rows for `agent-access-check` is 0, and the newest `updated_at` values are the 16:23Z import, so no real card was edited.                                                                                  |
| 3   | SC2 (guard half, AGENT-02 as amended): the agent cannot publish, unpublish, schedule or delete, and cannot write live fields on a published card                             | VERIFIED                    | E6, live in a fresh Claude Code session: `content_publish`, `content_delete`, `taxonomy_create`, `menu_set_items` and `media_delete` absent from the session's tools, `content_update` with `status: published` and with `taxonomies { tag: [] }` blocked by emdash-guard before reaching the server, `npx emdash content publish` refused by the Bash guard. The brief reports a later retest that confirmed all fourteen deny-ruled tools absent. That retest is not written in the evidence file, so it rests on the brief; the deny rules are one uniform mechanism, five of fourteen were seen live, all fourteen names exist in `node_modules/emdash/dist/astro/routes/api/mcp.mjs` (checked one by one) and match the hook's set (parity test), so I accept it. Refusal is client-side, as the requirement says. |
| 4   | SC3: a schema-changing call made with the agent token is refused                                                                                                             | VERIFIED                    | E5, twice: first by curl, then in a real Claude Code session on the corrected PAT (second retest). `schema_get_collection` INSUFFICIENT_SCOPE (schema:read), `schema_create_field` INSUFFICIENT_SCOPE (schema:write, no field created), `settings_update` INSUFFICIENT_SCOPE (settings:manage), CLI `schema list` exit 1 "Token lacks required scope: schema:read". The refusal is EmDash's own: the hook defers `schema_*`, `settings_*` and `site_*` (I ran the hook by hand on `mcp__emdash-agent__schema_create_field`: exit 0).                                                                                                                                                                                                                                                                                    |
| 5   | SC4: following the documented Claude Code setup from a clean session produces a working connection, with the endpoint URL set per environment                                | VERIFIED                    | E7 retest: from the repo's `.mcp.json` with only `EMDASH_TOKEN` exported, no OAuth prompt, `content_list` on `projects` returned 1 item (collection total 13). Independent check of the claim: the PAT `last_used_at` is 19:25:59Z, and the newest row in `_emdash_oauth_tokens` is an access token created 19:02:01Z, before the PAT even existed (19:06:36Z), so no OAuth token was issued during or after the retest. `${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}` default expansion was exercised by that run. Per environment: the `EMDASH_MCP_URL` and `EMDASH_URL` rows in the README table document the deployed values; setting them to the deployed host cannot be observed until Phase 5.                                                                                                      |
| 6   | D-05: the agent session authenticates with the PAT only, never with saved full-admin OAuth credentials                                                                       | VERIFIED                    | Root cause of the first E7 failure (Claude Code prefers saved OAuth state keyed by server name over the Authorization header) was fixed by registering the server as `emdash-agent` (commit 2b9e127; `.mcp.json`, `.claude/settings.json`, the test file and the README all use the new name consistently). The database evidence in row 5 shows the PAT in use and no new OAuth token. The README explains the naming and says never to choose authenticate for this server. The credential itself still exists, see Human Verification item 1.                                                                                                                                                                                                                                                                        |
| 7   | Review hardening: CLI `create`/`update` without `--draft` and `--override-lock` are refused, `curl` to `_emdash` and Edit/Write on `/.claude/**` and `/.mcp.json` are denied | PRESENT_BEHAVIOR_UNVERIFIED | Present and wired: `settings.json` carries a second PreToolUse entry for `Bash` and the deny rules; the hook has `checkBash`, `shellCommands` and `checkCliCommand`. `npm test`: 164 tests, 164 pass; the guard file alone is 122 tests and also passes from another cwd. I ran the hook by hand on the renamed server: `content_update` with status exit 2, plain data update exit 0, `menu_set_items` exit 2, `schema_create_field` exit 0, `npx emdash content update` without `--draft` exit 2, with `--draft` exit 0, `content publish` exit 2, garbage stdin exit 2. Live, only the CLI publish refusal was observed. Whether Claude Code honors the `/.claude/**` path form and the `Bash(curl *_emdash*)` pattern has not been seen.                                                                            |

**Score:** 6/7 truths verified (1 present and wired, behavior-unverified: truth 7)

### Requirement Amendment (D-03, D-01, D-12)

ROADMAP Phase 4 goal still says the token "publishes on request". REQUIREMENTS.md AGENT-02 was amended by the user on 2026-10-26: the agent drafts, the user publishes as a separate step, enforced by a committed Claude Code guard, because EmDash 1.3.1 has no publish scope and a token inherits its owner's role. D-03 asks that this be recorded in the verification as an accepted amendment, and it is. SC2 ("appears on the rendered page only after an explicit publish") agrees with the amendment and was proven live. Only the goal sentence is stale. The ROADMAP was not edited by this verification (Warning W1).

Two plan-level statements were overtaken by later, deliberate changes and are not gaps: 04-01 says the server is named `emdash` and nine tools are denied; the shipped state is the server `emdash-agent` (2b9e127) and fourteen tools (WR-03, 1bcca81).

### Required Artifacts

| Artifact                         | Expected                                                                                                         | Status              | Details                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.mcp.json`                      | One http server, env-expanded URL and bearer header, no secret                                                   | VERIFIED            | Read in full. Server `emdash-agent`, url `${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}`, header `Bearer ${EMDASH_TOKEN}`. Tracked in git.                                                                                                                                                  |
| `.claude/settings.json`          | Fourteen tool deny rules, CLI and curl deny rules, `.claude` and `.mcp.json` edit denies, two PreToolUse entries | VERIFIED            | Read in full. All fourteen names exist in the EmDash MCP source. Matcher `mcp__.*[Ee][Mm][Dd][Aa][Ss][Hh].*` tested against `mcp__emdash-agent__content_update` (match), `mcp__emdash__content_update` (match), `mcp__other__x` (no match). Hook command ends in `\|\| exit 2` (fail closed). Tracked. |
| `.claude/hooks/emdash-guard.mjs` | Fail-closed guard: blocked tools, destructive-name backstop, update allowlist, create rules, Bash CLI check      | VERIFIED            | Read in full (299 lines). `overrideLock` refused, `content_update` default-deny on keys, schema/settings/site deferred. No debt markers.                                                                                                                                                               |
| `scripts/emdash-guard.test.mjs`  | Offline tests picked up by `npm test`                                                                            | VERIFIED            | Ran: 122 pass, 0 fail alone; `npm test` 164 of 164. Tests run the command registered in settings.json and throw if no entry matches, so they are not vacuous.                                                                                                                                          |
| `README.md` Agent access         | Token, connection, guard boundaries, CLI fallback, rotation, residual risk                                       | VERIFIED            | Read in full. Matches the shipped files (name `emdash-agent`, fourteen tools, `/.claude/**`), states the client-side residual risk plainly, every CLI write has `--draft`, no em or en dashes.                                                                                                         |
| `04-AGENT-ACCESS-PASS.md`        | Evidence record with honest statuses                                                                             | VERIFIED with drift | Honest where it speaks, and the retracted first E7 is explained. It has stale passages (Warning W3).                                                                                                                                                                                                   |
| `.planning/REQUIREMENTS.md`      | AGENT-01 to AGENT-04 amended and marked                                                                          | VERIFIED            | AGENT-01 and AGENT-02 amended; all four marked complete, consistent with this verdict for the requirements themselves.                                                                                                                                                                                 |

### Key Link Verification

| From                         | To                               | Via                                                                | Status | Details                                                                                                                          |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/settings.json` hook | `.claude/hooks/emdash-guard.mjs` | `node "$CLAUDE_PROJECT_DIR/.claude/hooks/emdash-guard.mjs"`        | WIRED  | Loaded and effective in a live session (E6: guard blocks seen).                                                                  |
| `.mcp.json` server key       | deny rules and hook matcher      | `mcp__emdash-agent__<tool>`, and any server name containing emdash | WIRED  | Deny rules removed the guarded tools from the live tool list; matcher is name-agnostic by design so the rename did not break it. |
| deny rules                   | hook `BLOCKED_TOOLS`             | same fourteen names                                                | WIRED  | Parity test passes; names confirmed in the EmDash MCP source.                                                                    |
| `.mcp.json` URL and header   | README env table                 | `EMDASH_MCP_URL`, `EMDASH_TOKEN`                                   | WIRED  | Names and default match; default exercised live in E7.                                                                           |
| Token                        | EmDash MCP endpoint              | Bearer header                                                      | WIRED  | `last_used_at` moved to 19:25:59Z in the clean-session retest; 401 without it.                                                   |

### Data-Flow Trace (Level 4)

Not applicable to files (the phase renders no dynamic data). The one end-to-end flow, agent write to draft revision to publish to rendered page, is covered by truth 2.

### Behavioral Spot-Checks

| Behavior                                               | Command                                                              | Result                                            | Status |
| ------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------- | ------ |
| Full test suite                                        | `npm test` (run once)                                                | 164 tests, 164 pass, 0 fail                       | PASS   |
| Guard test independent of cwd                          | `node --test <abs path>` from the temp dir                           | 122 pass, 0 fail                                  | PASS   |
| Hook on the renamed server, status write               | hook on `mcp__emdash-agent__content_update` with `status: published` | exit 2, message cites D-12                        | PASS   |
| Hook lets a data draft edit through                    | hook on `content_update` with `data` only                            | exit 0                                            | PASS   |
| Hook blocks `menu_set_items`                           | hook on `mcp__emdash-agent__menu_set_items`                          | exit 2                                            | PASS   |
| Hook defers schema tools                               | hook on `mcp__emdash-agent__schema_create_field`                     | exit 0 (server refuses, AGENT-03)                 | PASS   |
| Bash guard: update without `--draft`, with it, publish | hook on three Bash payloads                                          | exit 2, exit 0, exit 2                            | PASS   |
| Fail closed                                            | hook on non-JSON stdin                                               | exit 2                                            | PASS   |
| Token row                                              | `sqlite3 -readonly`, name, scopes, dates only                        | six scopes, 90.04 days, last used 19:25:59Z       | PASS   |
| No OAuth token issued after the PAT existed            | `sqlite3 -readonly`, token_type, client_id, scopes, dates only       | newest OAuth row 19:02:01Z, PAT created 19:06:36Z | PASS   |
| Throwaway entry removed                                | `sqlite3 -readonly` count by slug                                    | 0                                                 | PASS   |

No server was started and no `_emdash` path was requested. The queries never selected `token_hash`, `refresh_token_hash` or `prefix`. `check:public-js` was not run, and that is correct: the Phase 4 commits touch only `.claude/`, `.mcp.json`, `README.md` and `scripts/emdash-guard.test.mjs` outside `.planning/` (checked with git), so no public route changed.

### Probe Execution

SKIPPED. No plan declares a `probe-*.sh` and none exists under `scripts/`.

### Prohibitions (all judgment-tier, per ADR-550 D4)

| Prohibition                                                                      | Verdict                                                               | Evidence                                                                                                                                                                       |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No token value committed in `.mcp.json`, settings, hook, tests, README, evidence | Verified (non-authoritative judgment)                                 | `git grep` for `ec_pat_` followed by 10 or more token characters finds only the placeholders `ec_pat_not_a_real_token` and `ec_pat_NEW_REDACTED` in plan and research text.    |
| `content_update` live-write arguments and non-draft `content_create` blocked     | Live for status and taxonomies on update; offline-tested for the rest | Flag: unverified-prohibition for the non-draft `content_create` branch only, human review recommended. It is the same hook and allowlist logic and 122 offline tests cover it. |
| Hook must not block schema, settings or site tools                               | Verified                                                              | Hand run exit 0 on `schema_create_field`; tests "defers schema_create_field" and "defers settings_update" pass; live INSUFFICIENT_SCOPE came from the server.                  |
| No dev server started, no push                                                   | Held in this verification                                             | Database reads and offline commands only. Nothing pushed.                                                                                                                      |
| Token never printed or recorded                                                  | Held                                                                  | No hash or prefix column was selected here. The evidence file uses `ec_pat_REDACTED`.                                                                                          |
| No real card edited during the pass                                              | Verified                                                              | Zero `agent-access-check` rows, newest real `updated_at` is the import.                                                                                                        |
| Agent token carries only the six scopes                                          | Verified                                                              | Database read matches exactly.                                                                                                                                                 |
| Every CLI write documented with `--draft`                                        | Verified                                                              | README examples read; the hook refuses the omission.                                                                                                                           |

### Requirements Coverage

| Requirement | Source Plan         | Description                                                                              | Status    | Evidence                                                                                                  |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| AGENT-01    | 04-01, 04-02, 04-03 | Scoped six-scope token works against the MCP endpoint                                    | SATISFIED | Truth 1, database read and E1.                                                                            |
| AGENT-02    | 04-01, 04-02, 04-03 | Agent drafts, user publishes, guard refuses publish-class calls and live-write arguments | SATISFIED | Truths 2 and 3. Draft-then-publish live; guard live for tool absence, status and taxonomies, CLI publish. |
| AGENT-03    | 04-01, 04-03        | Schema-changing calls refused for the agent token                                        | SATISFIED | Truth 4, refused by the server, twice, the second time in a real session on the corrected PAT.            |
| AGENT-04    | 04-01, 04-02, 04-03 | Working Claude Code MCP setup documented                                                 | SATISFIED | Truth 5, retest passed after the README was corrected for the rename.                                     |

No orphaned requirements: REQUIREMENTS.md maps only AGENT-01 to AGENT-04 to Phase 4 and all four are claimed.

### Anti-Patterns Found

None. No TBD, FIXME, XXX, TODO or HACK in the shipped files, no stubs, no em or en dashes in them. Code review findings CR-01 and WR-01 to WR-07 are fixed in code (commits e2d394c, 5a15f83, 5bfd424, 1bcca81, 26c78bf, f5437b7, ca79f4b, 5dce3f3) and I confirmed the behaviors above by running the hook, not from the fix report.

### Warnings

| ID  | Item                                                                                                               | Impact                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | ROADMAP Phase 4 goal says "publishes on request"; the Phase 4 checkbox and `3/3 plans` row are not marked complete | Doc drift against amended AGENT-02. Suggested goal wording: "writes drafts that the user publishes, and cannot change the schema". Not edited here.                                                                                                                                                                                                                                                                                     |
| W2  | Full-admin OAuth client and live tokens still in the database                                                      | See Human Verification 1. Not used by the agent session any more, but valid today (access token to 20:02:01Z, refresh token to 2027-01-24). A saved sign-in for the old name `emdash` also remains on the user's machine; `.claude/settings.local.json` (untracked by global gitignore) still lists `emdash` under enabled servers although `.mcp.json` no longer defines it.                                                           |
| W3  | Evidence file `04-AGENT-ACCESS-PASS.md` contradicts itself in places                                               | The header says E6 and E7 were not run; the Not covered section says the guard was exercised only by "the nine deny rules" and "45 offline tests", tells the verifier to treat AGENT-04 as `human_needed`, and tells the E7 runner to expect a server named `emdash`; row X1 describes the revoked 7-day token. The all-fourteen-absent retest is not recorded at all. None of this changes a verdict, but the file is the audit trail. |
| W4  | E6's live `content_update` and Bash blocks were seen under the old server name                                     | E6 ran before the rename, with the same committed matcher (name-agnostic) and the same hook. The matcher test and the hand run above show the renamed server is covered, but a live block of `content_update status` on `emdash-agent` is not recorded. Low risk.                                                                                                                                                                       |
| W5  | `_rev` accepted empty on `content_update` in E3                                                                    | Optimistic concurrency is not enforced on this path, so a stale agent write is not guaranteed refused. Does not break AGENT-02, because the edit still lands as a draft.                                                                                                                                                                                                                                                                |
| W6  | Residual risk accepted by the user (D-01 amended)                                                                  | The token can itself publish and delete. The guard is client-side and bypassable by curl patterns the rule does not match, a CLI name held in a variable, `xargs`, or disabled hooks. Stated plainly in the README. Not a gap.                                                                                                                                                                                                          |
| W7  | Deployed endpoint not exercised                                                                                    | `EMDASH_MCP_URL` pointing at `https://dev.zeikcookson.com/...` and a recreated token belong to Phase 5 (D-08 handoff recorded in README and the evidence file).                                                                                                                                                                                                                                                                         |

### Human Verification Required

#### 1. Revoke the Phase 2 full-admin OAuth client and its tokens (security hygiene)

**Test:** In the admin, revoke the OAuth client "Claude Code (emdash)" and its tokens. On the machine running Claude Code, clear the saved OAuth login for the server name `emdash`.
**Expected:** `_emdash_oauth_clients` and `_emdash_oauth_tokens` hold no row for that client, and the agent session still works on the PAT.
**Why human:** Admin UI and local credential step. The client carries `schema:write`, `settings:manage`, `transfer:execute` and `admin`, which is the opposite of the phase's intent, and it is live now.

#### 2. Optional live check of the review hardening (truth 7)

**Test:** In a session started from the repo root, ask Claude to run `npx emdash content update projects SLUG --data '{}'` without `--draft`, to `curl` an `_emdash` URL, and to Edit `.claude/settings.json`. Choose harmless targets and cancel any prompt.
**Expected:** Each is refused before it runs.
**Why human:** Needs a live Claude Code session. This is hardening beyond the ROADMAP criteria, so it does not hold the phase goal open by itself.

#### 3. Update the evidence file

**Test:** Add the all-fourteen-absent retest to the E6 row and correct the stale passages listed in W3.
**Expected:** The record agrees with itself and with this verification.
**Why human:** Only the user who ran the retest can state what was observed.

### Gaps Summary

No gaps. Every ROADMAP success criterion is met and live-proven, the requirements AGENT-01 to AGENT-04 are satisfied, and the two things that held the first verification at `human_needed` (E6 and E7) are now observed and independently cross-checked against the database. The remaining items are one live security cleanup (the old OAuth client), one optional live check of review-added hardening, and evidence-file housekeeping. When item 1 is done, the phase can move to `passed` without a re-run of this verification beyond a read-only database check.

---

_Verified: 2026-10-26_
_Verifier: Claude (gsd-verifier)_
