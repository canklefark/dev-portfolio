---
phase: 04-agent-access
fixed_at: 2026-10-26T00:00:00Z
review_path: .planning/phases/04-agent-access/04-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 4: Code Review Fix Report

**Fixed at:** 2026-10-26
**Source review:** .planning/phases/04-agent-access/04-REVIEW.md
**Iteration:** 1

**Summary:**

- Findings in scope: 8 (CR-01, WR-01 to WR-07; Info items excluded)
- Fixed: 8
- Skipped: 0

**Verification ran in the main checkout** (`workflow.use_worktrees` is `false`, so no worktree was created). After every fix: `node --test scripts/emdash-guard.test.mjs` and a `tsc --strict --checkJs` pass over the hook and the test file (both clean). At the end: `npm test`, 164 tests, all passing. The guard test file now passes from any cwd (checked from `/tmp`).

Commits are in the order WR-07, WR-01, WR-06, WR-03, WR-05, CR-01, WR-02, WR-04. WR-07 went first because it hardens the test runner that every later fix relies on. WR-04 went last because its Edit and Write deny rules cover `.claude/**`, so no `.claude` file could be edited after it.

## Fixed Issues

### CR-01: Documented CLI fallback publishes live by default and nothing guards it

**Status:** fixed: requires human verification (logic and matcher behavior)
**Files modified:** `.claude/hooks/emdash-guard.mjs`, `.claude/settings.json`, `scripts/emdash-guard.test.mjs`, `README.md`
**Commit:** e2d394c
**Applied fix:**

- Added a `Bash` PreToolUse entry that runs the same hook command. The hook now reads `tool_input.command` for `Bash` and fails closed when it is missing or not a string.
- Subcommand names come from `node_modules/emdash/dist/cli/index.mjs` rather than the review's guess. The CLI has `content list|get|create|update|delete|publish|unpublish|schedule|restore|translations`, and `media list|upload|get|delete|repair-usage`. There is no CLI `unschedule` or `permanent-delete`.
- Judgment call, minimal but deny-by-default: for `emdash content <sub>` only `list`, `get`, `create`, `update`, `restore` and `translations` pass. Anything else is blocked, which covers publish, unpublish, schedule, delete and any later subcommand. `create` and `update` also need a literal `--draft` word, and `--override-lock` is refused on any content subcommand (consistent with WR-01, because the CLI `update` has that flag). `emdash media delete` is blocked to match the WR-03 block on `media_delete`.
- Parsing: a small shell tokenizer (quotes, backslash escapes, `;|&()` backtick and newline command boundaries, `#` comments) so that `--draft` inside a comment, in a different command, or a `;` inside quoted JSON data are handled correctly. It recognises the bin as `emdash` or `em` (versioned `emdash@x` too) and the `node_modules/emdash/dist/cli/index.mjs` entry, and it looks inside `bash -c`, `bash -lc` and `eval` strings.
- Deny rules added (hook is the real net, rules are a second layer): `Bash(npx emdash content publish|unpublish|schedule|delete *)`, `Bash(npx emdash media delete *)`, the same five for the bare `emdash` spelling, and `Bash(curl *_emdash*)`.
- README: new paragraph in the CLI fallback section, and the residual risk paragraph now says plainly that Bash stays bypassable (curl the rule does not match, the CLI name in a variable, `xargs`, hooks disabled). The check narrows the accidental path and is not a sandbox.
- Known false positive, observed while working: the check splits on newlines, so a Bash heredoc whose body contains a line such as `npx emdash content delete ...` is refused (it blocked one of my own commands). Quoted one-liners such as `git commit -m "... npx emdash content publish ..."` pass. The README says a Write-tool file write avoids it.
- Not covered, on purpose: other CLI groups (`schema create|delete|add-field|remove-field`, `seed`, `site import`, `init`). With `EMDASH_TOKEN` set the server refuses the schema commands by scope. Without it, localhost falls back to a dev bypass with full admin rights, which the README already tells the user to avoid (D-12).

### WR-01: `overrideLock` is allowed on `content_update`, and a test pins it

**Status:** fixed
**Files modified:** `.claude/hooks/emdash-guard.mjs`, `scripts/emdash-guard.test.mjs`, `README.md`
**Commit:** 5a15f83
**Applied fix:** Removed `overrideLock` from `UPDATE_ALLOWED_KEYS` and added a dedicated refusal, so `overrideLock` present with any value (true or false) is blocked with a message about the editor lock (rather than the generic live-write message). Replaced the test that enshrined the old behavior with tests for `true` and `false`, and for slug, locale and migrateBlocks still passing. README now states the guard blocks `overrideLock`.

### WR-02: README opening claim contradicts the rest of the section

**Status:** fixed
**Files modified:** `README.md`
**Commit:** 5bfd424
**Applied fix:** The opening now says content edits through `content_create` and `content_update` (or the CLI with `--draft`) land as drafts, and that menu, taxonomy term, media and byline writes are live as soon as they are made. It points to the later section.

### WR-03: Tool matching is default-allow, but key matching is default-deny

**Status:** fixed: requires human verification (judgment on which tools to block)
**Files modified:** `.claude/hooks/emdash-guard.mjs`, `.claude/settings.json`, `scripts/emdash-guard.test.mjs`, `README.md`
**Commit:** 1bcca81
**Applied fix:** Kept an explicit blocked set and added a pattern backstop, `(^|_)(publish|unpublish|schedule|unschedule|delete)(_|$)`, for emdash tools the list does not name yet (for example a future `media_bulk_delete`). The pattern skips the `schema_`, `settings_` and `site_` families, so the server's INSUFFICIENT_SCOPE refusal is still what shows for AGENT-03 (the existing tests defer `schema_create_field` and `settings_update`).

Newly blocked tools (five, added to `BLOCKED_TOOLS`, the deny rules, the README and the tests, taking the total from nine to fourteen):

- `taxonomy_delete_term`
- `menu_delete`
- `menu_set_items`
- `media_delete`
- `byline_delete`

Read tools and the allowed draft writes stay open: `content_list|get|create|update|compare|discard_draft|duplicate|restore|translations`, `revision_restore`, `menu_create|update|get|list`, `media_upload|get|list|update`, `taxonomy_create_term|update_term|list|get`, `byline_create|update|get|list`, and `search`. `menu_set_items` is the only way to reorder or remove menu entries, so the agent can no longer edit menu items at all (menu create and update still work). That follows the instruction, but it narrows what D-06 ("`menus:manage` lets Claude reorder or remove nav links; accepted") gave the agent, so the user may want to confirm it.

### WR-04: The agent can edit the guard itself

**Status:** fixed: requires human verification (deny rule path syntax not exercised in a live session)
**Files modified:** `.claude/settings.json`, `scripts/emdash-guard.test.mjs`, `README.md`
**Commit:** 26c78bf
**Applied fix:** Added `Edit(/.claude/**)`, `Write(/.claude/**)`, `Edit(/.mcp.json)` and `Write(/.mcp.json)`. The leading slash is project-root relative in Claude Code permission syntax. `/.claude/**` covers the hook path, `settings.json` and `settings.local.json`. A test pins the four rules. README states the limit: Bash can still write those files, and lifting the rule is how the user edits the guard on purpose.

Side effect to know about: `/.claude/**` also covers `.claude/skills/`, so Claude can no longer edit the tracked project skill (`emil-design-eng`) with Edit or Write. I followed the requested `.claude/**` scope and noted this in the README. Narrowing to `.claude/settings*.json` plus `.claude/hooks/**` is a one-line change if the skill edits matter.

### WR-05: Guard is coupled to the literal server name `emdash`

**Status:** fixed: requires human verification (matcher behavior in a live session)
**Files modified:** `.claude/hooks/emdash-guard.mjs`, `.claude/settings.json`, `scripts/emdash-guard.test.mjs`, `README.md`
**Commit:** f5437b7
**Applied fix:** The hook now parses `mcp__<server>__<tool>` and acts on the tool part under any server whose name contains `emdash`, case-insensitively. The settings matcher became `mcp__.*[Ee][Mm][Dd][Aa][Ss][Hh].*`, because Claude Code matchers are plain regexes without a case-insensitive flag. I did not match every `mcp__*` tool, since that would spawn the hook for every unrelated connector call and could over-block other servers that happen to expose a `content_delete`. Tests cover `claude_ai_EmDash`, `plugin_emdash_emdash` and `EMDASH`, and show that `mcp__other__...` is not routed and is deferred if the hook is run on it. Documented limit, in the README and the hook comment: a server name without `emdash` in it is not guarded. The deny rules still name `mcp__emdash__` tools only. Other server names rely on the hook.

### WR-06: `content_create` has a dead `publishedAt` branch

**Status:** fixed
**Files modified:** `.claude/hooks/emdash-guard.mjs`, `scripts/emdash-guard.test.mjs`
**Commit:** ca79f4b
**Applied fix:** Deleted the unreachable branch and recorded the intent in the `CREATE_ALLOWED_KEYS` comment (`publishedAt` is refused by the allowlist like any other key). The tests did not verify the old branch, so I added one that asserts the actual message, "publishedAt is not a key a new draft may carry".

### WR-07: Test gaps in `scripts/emdash-guard.test.mjs`

**Status:** fixed
**Files modified:** `scripts/emdash-guard.test.mjs`
**Commit:** 5dce3f3
**Applied fix:**

- `runRegisteredHook` now runs every matching entry and every hook in it, returns the first non-zero result, and throws when nothing matches (opt out with `expectMatch: false` for the "not routed" case). A test asserts the throw.
- Paths resolve from `import.meta.url` (`ROOT`), and hook commands spawn with `cwd` set to the OS temp dir, so a cwd-dependent command would fail. Verified by running the file from `/tmp`.
- New checks that every PreToolUse entry and every hook in it is a fail-closed guard command, and that every registered command exits 2 on malformed input.
- New cases: `content_update` with `status: "draft"`; `tool_input` as array, string and null for both `content_update` and `content_create`; a non-string `tool_name`; and a hook file that exits 1 mid-run (the wrapper turns it into 2, distinct from the missing-file case).
- The `overrideLock: true` refusal case belongs to WR-01 and was added there.

## Skipped Issues

None.

---

_Fixed: 2026-10-26_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
