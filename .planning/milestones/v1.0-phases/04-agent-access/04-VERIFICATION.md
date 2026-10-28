---
phase: 04-agent-access
verified: 2026-10-26T19:35:02Z
status: passed
score: 7/7 must-haves verified
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
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "Review hardening: CLI create/update without --draft and --override-lock are refused, curl to _emdash and Edit/Write on /.claude/** and /.mcp.json are denied"
    reason: "Hardening added by code review (CR-01, WR-04), not a ROADMAP success criterion and not a plan must-have. Present, wired, covered by 122 offline tests that run the registered hook command, and every hook branch was run by hand. Only the CLI publish refusal was seen live in Claude Code. The user's re-verification brief classifies the remaining live hardening checks as optional warnings, not blockers."
    accepted_by: "user, explicitly in the session on 2026-10-26 after the orchestrator flagged that the earlier attribution was the orchestrator's own framing"
    accepted_at: "2026-10-26T19:35:02Z"
re_verification:
  previous_status: human_needed
  previous_score: 6/7
  gaps_closed:
    - "Blocking item: Phase 2 full-admin OAuth client 'Claude Code (emdash)' and its tokens revoked (database now holds 0 client rows and 0 OAuth token rows)"
    - "ROADMAP Phase 4 goal wording aligned with the AGENT-02 amendment (b41a5cb)"
    - "Evidence file 04-AGENT-ACCESS-PASS.md refreshed for the retests and the emdash-agent rename (b41a5cb)"
  gaps_remaining: []
  regressions: []
---

# Phase 4: Agent Access Verification Report

**Phase Goal:** Claude can manage portfolio content through EmDash's MCP server or CLI, using a token that writes drafts for the user to publish and cannot change the schema (ROADMAP wording after b41a5cb; it now matches the AGENT-02 amendment)
**Verified:** 2026-10-26T19:35:02Z
**Status:** passed
**Re-verification:** Yes, final pass after the user revoked the Phase 2 OAuth credentials. The state below was re-read from the database and the repository in this run.

## Verdict

The phase goal is achieved and the one blocking item from the previous report is cleared. Nothing regressed.

What I checked in this run, read-only (`sqlite3 -readonly`, no server started, no `_emdash` path requested, no hash, prefix or token value selected):

| Check                                                           | Result                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_emdash_oauth_clients` row count                               | 0 (was 1, full-admin client)                                                                                                                                                                                                                                          |
| `_emdash_oauth_tokens` row count                                | 0 (was an access token and a refresh token valid to 2027-01-24)                                                                                                                                                                                                       |
| `_emdash_api_tokens` row count                                  | 1                                                                                                                                                                                                                                                                     |
| That token's name and scopes                                    | `claude-agent`; `content:read`, `content:write`, `media:read`, `media:write`, `taxonomies:manage`, `menus:manage`, exactly six, no schema, settings, transfer or admin scope                                                                                          |
| Expiry                                                          | created 2026-10-26 19:06:36, expires 2027-01-24T20:06:36.931Z, 90.04 days                                                                                                                                                                                             |
| `last_used_at`                                                  | 2026-10-26T19:25:59.508Z, unchanged since the previous verification (the token was not used again, and the OAuth credential is gone)                                                                                                                                  |
| Files changed since the previous verification (bd1dab2 to HEAD) | only `.planning/ROADMAP.md` (goal wording) and `04-AGENT-ACCESS-PASS.md` (evidence refresh), per `git diff --stat`. The guard, settings, `.mcp.json`, README and test file are byte-identical; `verification.fingerprint` returns the same `covered_digest` as before |
| `npm test` (run once)                                           | 164 tests, 164 pass, 0 fail                                                                                                                                                                                                                                           |
| Token-shaped strings in tracked files                           | `git grep` for `ec_pat_` followed by 10 or more token characters: no match                                                                                                                                                                                            |
| Working tree                                                    | no uncommitted changes to tracked files (untracked `.planning/PROJECT.md`, `config.json`, `milestone.lock`, `research/`, `state.json` pre-date this phase's work and are not part of it)                                                                              |

## Goal Achievement

### Observable Truths

ROADMAP Success Criteria first (the contract), then the plan and review additions. Evidence for rows 1 to 6 is unchanged from the previous run except where noted, because none of the covered files changed (identical digest).

| #   | Truth                                                                                                                                                                | Status            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | SC1: a PAT scoped to content read and write, media and menus, with no schema or admin scope, authenticates against the MCP endpoint                                  | VERIFIED          | Database read this run: exactly one token, six scopes, 90.04 days (table above). Live evidence E1 and E2 from the earlier run: `tools/list` and `content_list` succeed with it, no token gives 401 NOT_AUTHENTICATED, a malformed token 401 INVALID_TOKEN.                                                                                                                                                                                                                                                                               |
| 2   | SC2 (flow): Claude updates a project card, the change lands as a draft, and it reaches the rendered page only after an explicit publish                              | VERIFIED          | E3 and E4, live on a throwaway card: draft revision created, `liveData` unchanged, anonymous page kept the old copy until the user published. A live test exercised the state transition. Cleanup holds (0 `agent-access-check` rows).                                                                                                                                                                                                                                                                                                   |
| 3   | SC2 (guard half, AGENT-02 as amended): the agent cannot publish, unpublish, schedule or delete, and cannot write live fields on a published card                     | VERIFIED          | E6 live: guarded tools absent from the session, `content_update` with `status` and with `taxonomies` blocked by emdash-guard, CLI publish refused. The retest confirming all fourteen deny-ruled tools absent is now written into the evidence file (b41a5cb), closing the earlier gap that it rested on the brief alone. All fourteen names exist in the EmDash MCP source and match the hook set (parity test).                                                                                                                        |
| 4   | SC3: a schema-changing call made with the agent token is refused                                                                                                     | VERIFIED          | E5, twice (curl, then a real Claude Code session on the corrected PAT): INSUFFICIENT_SCOPE for `schema_get_collection`, `schema_create_field`, `settings_update`; CLI `schema list` exit 1. Refusal is EmDash's own, the hook defers `schema_*`, `settings_*`, `site_*`.                                                                                                                                                                                                                                                                 |
| 5   | SC4: following the documented Claude Code setup from a clean session produces a working connection, with the endpoint URL set per environment                        | VERIFIED          | E7 retest on `emdash-agent` with only `EMDASH_TOKEN` exported: no OAuth prompt, `content_list` returned 1 item, PAT `last_used_at` moved. The deployed host cannot be observed until Phase 5 (warning W7).                                                                                                                                                                                                                                                                                                                               |
| 6   | D-05: the agent session authenticates with the PAT only, never with saved full-admin OAuth credentials                                                               | VERIFIED          | The server is registered as `emdash-agent` (2b9e127) so saved OAuth state cannot override the header, and the credential that caused the first E7 failure no longer exists: 0 OAuth client rows and 0 OAuth token rows.                                                                                                                                                                                                                                                                                                                  |
| 7   | Review hardening: CLI `create`/`update` without `--draft` and `--override-lock` refused, `curl` to `_emdash` and Edit/Write on `/.claude/**` and `/.mcp.json` denied | PASSED (override) | Present and wired (second PreToolUse entry for `Bash`, deny rules, `checkBash`, `shellCommands`, `checkCliCommand`); 122 guard tests plus `npm test` 164 of 164 pass this run. Live only for the CLI publish case (and a curl to an `_emdash` path denied in the orchestrating session, per the evidence file). Accepted as a warning, not a blocker, per the override in the frontmatter. It was PRESENT_BEHAVIOR_UNVERIFIED in the previous report and is still not proven live for every branch; see W4 and the optional check below. |

**Score:** 7/7 truths verified (1 by override).

### Requirement Amendment (D-03, D-01, D-12)

REQUIREMENTS.md AGENT-02 was amended by the user on 2026-10-26: the agent drafts and the user publishes as a separate step, enforced by a committed client-side Claude Code guard, because EmDash 1.3.1 has no publish scope. The ROADMAP goal sentence ("publishes on request") was the stale part; commit b41a5cb changed it to "writes drafts for the user to publish and cannot change the schema", which agrees with AGENT-02 and with SC2. Verified in `.planning/ROADMAP.md` line 140. Warning W1 from the previous report is closed except for the bookkeeping noted below.

### Required Artifacts

| Artifact                         | Expected                                                                      | Status   | Details                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| `.mcp.json`                      | One http server, env-expanded URL and bearer header, no secret                | VERIFIED | Unchanged (identical digest). Server `emdash-agent`.                     |
| `.claude/settings.json`          | Fourteen deny rules, CLI and curl denies, edit denies, two PreToolUse entries | VERIFIED | Unchanged.                                                               |
| `.claude/hooks/emdash-guard.mjs` | Fail-closed guard                                                             | VERIFIED | Unchanged; tests pass.                                                   |
| `scripts/emdash-guard.test.mjs`  | Offline tests picked up by `npm test`                                         | VERIFIED | 164 of 164 pass this run.                                                |
| `README.md` Agent access         | Token, connection, guard boundaries, CLI fallback, rotation, residual risk    | VERIFIED | Unchanged.                                                               |
| `04-AGENT-ACCESS-PASS.md`        | Evidence record with honest statuses                                          | VERIFIED | Refreshed in b41a5cb, see stale-statement check below.                   |
| `.planning/REQUIREMENTS.md`      | AGENT-01 to AGENT-04 amended and marked                                       | VERIFIED | Lines 50 to 53 are `[x]`; the traceability rows 131 to 134 say Complete. |

### Key Link Verification

| From                         | To                               | Via                                                         | Status | Details                                                                             |
| ---------------------------- | -------------------------------- | ----------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| `.claude/settings.json` hook | `.claude/hooks/emdash-guard.mjs` | `node "$CLAUDE_PROJECT_DIR/.claude/hooks/emdash-guard.mjs"` | WIRED  | Unchanged since the live E6 blocks.                                                 |
| `.mcp.json` server key       | deny rules and hook matcher      | `mcp__emdash-agent__<tool>`                                 | WIRED  | Unchanged.                                                                          |
| deny rules                   | hook `BLOCKED_TOOLS`             | same fourteen names                                         | WIRED  | Parity test passes this run.                                                        |
| `.mcp.json` URL and header   | README env table                 | `EMDASH_MCP_URL`, `EMDASH_TOKEN`                            | WIRED  | Unchanged.                                                                          |
| Token                        | EmDash MCP endpoint              | Bearer header                                               | WIRED  | The PAT is the only credential left in the database; no fallback credential exists. |

### Data-Flow Trace (Level 4)

Not applicable to files. The one end-to-end flow (agent write to draft to publish to rendered page) is truth 2.

### Behavioral Spot-Checks

| Behavior                | Command                                                       | Result                                             | Status |
| ----------------------- | ------------------------------------------------------------- | -------------------------------------------------- | ------ |
| Full test suite         | `npm test` (once)                                             | 164 pass, 0 fail                                   | PASS   |
| OAuth client revoked    | `sqlite3 -readonly`, `count(*)` on `_emdash_oauth_clients`    | 0                                                  | PASS   |
| OAuth tokens revoked    | `sqlite3 -readonly`, `count(*)` on `_emdash_oauth_tokens`     | 0                                                  | PASS   |
| Agent token intact      | `sqlite3 -readonly`, name, scopes, dates only                 | one row, six scopes, 90.04 days                    | PASS   |
| No committed token      | `git grep -E 'ec_pat_[A-Za-z0-9]{10,}'`                       | no match                                           | PASS   |
| Covered files unchanged | `verification.fingerprint` and `git diff --stat bd1dab2 HEAD` | same digest; only ROADMAP and evidence file differ | PASS   |

`check:public-js` was not run, which is correct: Phase 4 touches only `.claude/`, `.mcp.json`, `README.md`, `scripts/emdash-guard.test.mjs` and `.planning/`, so no public route changed.

### Documentation Checks Requested

| Check                                                    | Result                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git log` shows the evidence and ROADMAP cleanup         | PASS. `b41a5cb docs(04): update evidence record for retests and the emdash-agent rename; align ROADMAP goal with AGENT-02 amendment` touches exactly `.planning/ROADMAP.md` (1 line) and `04-AGENT-ACCESS-PASS.md`.                                                                                                                 |
| ROADMAP goal matches the AGENT-02 amendment              | PASS. Goal now reads "writes drafts for the user to publish and cannot change the schema".                                                                                                                                                                                                                                          |
| REQUIREMENTS.md marks AGENT-01 to AGENT-04 complete      | PASS, checkboxes and traceability table.                                                                                                                                                                                                                                                                                            |
| `04-AGENT-ACCESS-PASS.md` has no stale "nine deny rules" | PASS. The guard is described as fourteen deny rules plus the hook. The word "nine" survives once, inside the E6 row, as the true historical fact that nine of the fourteen tools were not individually confirmed in the first live run; the Not covered section then states the retest confirmed all fourteen. Not a contradiction. |
| No stale "45 tests"                                      | PASS. The file now says 122 offline tests (164 across `npm test`). No "45" remains.                                                                                                                                                                                                                                                 |
| No stale "human_needed for AGENT-04"                     | PASS. No `human_needed` string remains in the file; E7 is recorded as PASS after the retest.                                                                                                                                                                                                                                        |
| No stale server name in the procedure                    | PASS. R1 now says `emdash-agent`; the remaining mentions of `emdash` as a server name describe the retracted first run.                                                                                                                                                                                                             |
| Token expiry statement                                   | PASS. X1 now records the current 90.04-day token and the two replaced tokens.                                                                                                                                                                                                                                                       |

### Prohibitions (all judgment-tier, per ADR-550 D4)

| Prohibition                                        | Verdict                                                                                               | Evidence                                                                                             |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| No token value committed                           | Verified (non-authoritative judgment)                                                                 | `git grep` finds no token-shaped string.                                                             |
| Non-draft `content_create` blocked                 | Flag: unverified-prohibition for the non-draft `content_create` branch only, human review recommended | Same hook and allowlist logic, 122 offline tests; not seen live. Covered by the override on truth 7. |
| Hook must not block schema, settings or site tools | Verified                                                                                              | Unchanged hook; tests pass.                                                                          |
| No dev server started, no push                     | Held                                                                                                  | Read-only database access and offline commands only; nothing pushed.                                 |
| Token never printed or recorded                    | Held                                                                                                  | `token_hash`, `refresh_token_hash` and `prefix` were never selected.                                 |
| Agent token carries only the six scopes            | Verified                                                                                              | Database read this run.                                                                              |

### Requirements Coverage

| Requirement | Status    | Evidence                                |
| ----------- | --------- | --------------------------------------- |
| AGENT-01    | SATISFIED | Truth 1, database read this run and E1. |
| AGENT-02    | SATISFIED | Truths 2 and 3.                         |
| AGENT-03    | SATISFIED | Truth 4.                                |
| AGENT-04    | SATISFIED | Truth 5.                                |

No orphaned requirements.

### Anti-Patterns Found

None. Covered code files are unchanged since the previous scan (no TBD, FIXME, XXX, TODO, HACK, stubs).

### Warnings (none blocking)

| ID  | Item                                                                                                         | Impact                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| W1  | ROADMAP bookkeeping: the Phase 4 checkbox (line 23) is still `[ ]` and the progress row (line 204) says `3/3 | In Progress`                                                                                                                                                                                                                                                                                                                                                                                                                                           | The goal wording is fixed, but the completion markers are not. This is normally written by the phase-complete step, and I did not edit ROADMAP in this verification. |
| W2  | Local Claude Code state not checkable from the repository                                                    | The user reports the old sign-in was cleared. The saved Claude Code credential lives outside the repo and database, so I cannot confirm it. It no longer matters for the credential itself (the server-side client and tokens are deleted, so any saved copy is dead). Untracked `.claude/settings.local.json` still lists `emdash` under enabled servers although `.mcp.json` no longer defines it; harmless, can be tidied.                          |
| W3  | Hardening seen live only for the CLI publish case (truth 7, override)                                        | Bash `create`/`update` without `--draft`, the `Bash(curl *_emdash*)` deny pattern and the Edit deny on `/.claude/**` and `/.mcp.json` rest on 122 offline tests and hand-run hook exits. Optional live check: in a session from the repo root, ask Claude to run `npx emdash content update projects SLUG --data '{}'` without `--draft`, to curl an `_emdash` URL, and to Edit `.claude/settings.json`, and expect each to be refused before it runs. |
| W4  | E6's live `content_update` and Bash blocks were seen under the old server name                               | The matcher is name-agnostic and the hand run covers `emdash-agent`; low risk.                                                                                                                                                                                                                                                                                                                                                                         |
| W5  | `_rev` accepted empty on `content_update` (E3)                                                               | Does not break AGENT-02, because the edit still lands as a draft.                                                                                                                                                                                                                                                                                                                                                                                      |
| W6  | Residual risk accepted by the user (D-01 amended)                                                            | The token itself can publish and delete; the guard is client-side. Stated in the README.                                                                                                                                                                                                                                                                                                                                                               |
| W7  | Deployed endpoint untested until Phase 5                                                                     | `EMDASH_MCP_URL` pointing at the deployed host and a recreated token belong to Phase 5 (D-08 handoff recorded).                                                                                                                                                                                                                                                                                                                                        |

### Gaps Summary

No gaps. The one blocking item (full-admin OAuth client and tokens) is cleared: both OAuth tables hold zero rows, and the database now contains only the six-scope, 90-day `claude-agent` token. The ROADMAP goal and the evidence file were corrected in b41a5cb, and REQUIREMENTS.md marks AGENT-01 to AGENT-04 complete. Nothing in the covered files changed since the previous verification.

Caveat on the verdict: `passed` relies on treating the review-added hardening checks (truth 7) as a warning accepted by the user, via the override above, as the final re-verification brief instructs. Under the strict decision tree a present-but-not-live-tested truth routes to `human_needed`. If you want that live check done first, delete the override and the status becomes `human_needed` again.

---

_Verified: 2026-10-26T19:35:02Z_
_Verifier: Claude (gsd-verifier)_
