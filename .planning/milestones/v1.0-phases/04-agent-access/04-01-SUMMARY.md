---
phase: 04-agent-access
plan: 01
subsystem: agent-access
tags: [mcp, claude-code, hooks, guard, emdash]
status: complete
requires: []
provides:
  - committed project-scoped emdash MCP server config with env-expanded url and bearer header
  - Claude Code deny rules and PreToolUse hook that keep the agent draft-only
affects: [04-02, 04-03, 05-deploy]
tech-stack:
  added: []
  patterns:
    - "PreToolUse command hook with `|| exit 2` fallback so a crash or missing file blocks"
    - "allowlist of draft-only keys instead of a blocklist of live-write keys"
    - "tests run the exact command registered in settings.json"
key-files:
  created:
    - .mcp.json
    - .claude/hooks/emdash-guard.mjs
    - scripts/emdash-guard.test.mjs
  modified:
    - .claude/settings.json
key-decisions:
  - "Nine tools guarded by bare-name deny rules and again by BLOCKED_TOOLS in the hook: content_publish, content_unpublish, content_schedule, content_unschedule, content_delete, content_permanent_delete, taxonomy_create, taxonomy_update, taxonomy_delete"
  - "content_update is checked against a nine-key allowlist (collection, id, locale, data, slug, _rev, overrideLock, migrateBlocks, replaceBlocks); content_create against an eleven-key allowlist with status limited to draft and publishedAt refused"
  - "Schema, settings and site tools are deferred by the hook so the AGENT-03 refusal comes from the server's INSUFFICIENT_SCOPE"
  - "Hook runs its main block unconditionally (no entry-point check), because a path comparison that fails would exit 0 and fail open"
requirements-completed:
  - AGENT-02
  - AGENT-03
  - AGENT-04
plan_head_before: 80576f982cc14fd439ec081790538503dd2e02ce
plan_head_after: a2384b6ecb80eb5970a021543f37e30d2c7d4e84
commits: 3
actuals:
  tokens: 3700
  tasks: 2
  commits: 3
duration: 5 min
completed: 2026-10-26
---

# Phase 4 Plan 01: Client config and draft-only guard Summary

Committed `.mcp.json` for the emdash MCP endpoint (url and token from the environment) plus a Claude Code deny list and fail-closed PreToolUse hook that stop the agent from publishing, changing live card metadata or editing taxonomy definitions.

## Accomplishments

- `.mcp.json`: one HTTP server `emdash`, url `${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}`, header `Authorization: Bearer ${EMDASH_TOKEN}`, no token value.
- `.claude/settings.json`: `permissions.deny` holds exactly nine bare `mcp__emdash__` names (no parentheses) and `hooks.PreToolUse` registers matcher `mcp__emdash__.*` with command `node "$CLAUDE_PROJECT_DIR/.claude/hooks/emdash-guard.mjs" || exit 2`.
- `.claude/hooks/emdash-guard.mjs`: constants `TOOL_PREFIX`, `BLOCKED_TOOLS`, `UPDATE_ALLOWED_KEYS`, `CREATE_ALLOWED_KEYS`; `check(toolName, toolInput)` plus a stdin wrapper that exits 2 on any read, parse or shape error.
- `scripts/emdash-guard.test.mjs`: 45 tests (picked up by the existing `npm test` glob, `package.json` unchanged) run the registered command through `runRegisteredHook` for config, update, create, guarded tools, deferred tools, fail-closed cases and deny-list parity.

## Task Commits

| Task      | Name                                                                                  | Commit  |
| --------- | ------------------------------------------------------------------------------------- | ------- |
| 1         | Tracer: MCP config to registered guard hook, content_update status refused end to end | 17ef085 |
| 2 (RED)   | Failing cases for the full rule set                                                   | 4a33f5e |
| 2 (GREEN) | Deny rules, blocked tools, content_create rules, fail-closed cases                    | a2384b6 |

The tracer feedback gate ran in auto mode: the tracer verify (test suite, config check, strict tsc) was re-run and passed before expansion.

## Flagged Planner Decisions (carried out as planned)

- Hook registered for every `mcp__emdash__` tool, so it also blocks the nine denied tools as a second layer.
- `content_unschedule` is guarded (cancelling a scheduled publish is a publish-state change).
- `taxonomy_create`, `taxonomy_update`, `taxonomy_delete` are guarded; term tools stay open.
- `content_update` uses an allowlist, so a key added by a later EmDash version is refused until reviewed.
- `.mcp.json` URL carries the localhost default; `EMDASH_MCP_URL` still overrides per environment.

## Verification

- `node --test scripts/emdash-guard.test.mjs`: 45 pass, 0 fail. `npm test`: 87 pass, 0 fail.
- `.mcp.json` and deny-list node checks exit 0; strict tsc over the hook and test exits 0 with no `{any}`.
- `npx astro check`: 0 errors, 0 warnings, 0 hints. `git diff --quiet -- package.json` exits 0.
- No `ec_pat_` value and no em or en dash in the new files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed an entry-point check and the export from the hook**

- **Found during:** Task 1
- **Issue:** My first draft wrapped the main block in an `import.meta.url` versus `argv[1]` comparison. A mismatch (for example a project path with spaces, which URL-encodes) would skip the block and exit 0, failing open.
- **Fix:** The main block runs unconditionally and `check` is not exported, matching the plan's fail-closed design.
- **Files modified:** .claude/hooks/emdash-guard.mjs
- **Commit:** 17ef085

**2. [Rule 3 - Blocking] Verification step not run: `npm run check:public-js`**

- **Found during:** plan-level verification
- **Issue:** The plan lists check:public-js, but it builds and serves the app on 127.0.0.1, while the plan also says it starts no server and the project rule is never to start servers unasked. This plan touches no public route.
- **Fix:** Skipped. Left for the user or the phase verifier.

**Total deviations:** 1 auto-fixed (Rule 1), 1 verification step skipped by judgment. **Impact:** none on scope.

## Known Stubs

None.

## Threat Flags

None. The plan's threat register (T-04-01 to T-04-05, T-04-SC) is mitigated; T-04-06 (a Bash `curl` with the token in the environment) stays accepted per D-01 amended and is for 04-02 to state in the README.

## Issues Encountered

None.

## Next

Ready for 04-02.

## Self-Check: PASSED

- FOUND: .mcp.json, .claude/settings.json, .claude/hooks/emdash-guard.mjs, scripts/emdash-guard.test.mjs
- FOUND commits: 17ef085, 4a33f5e, a2384b6
