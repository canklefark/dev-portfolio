---
phase: 04-agent-access
reviewed: 2026-10-26T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - .claude/hooks/emdash-guard.mjs
  - .claude/settings.json
  - .mcp.json
  - scripts/emdash-guard.test.mjs
findings:
  critical: 1
  warning: 7
  info: 3
  total: 11
status: issues_found
---

# Phase 4: Code Review Report

**Reviewed:** 2026-10-26
**Depth:** standard (EmDash 1.3.1 MCP route and runtime in `node_modules/emdash` read to verify the guard's assumptions)
**Files Reviewed:** 4 (plus the README "Agent access" section, skimmed for wrong claims)
**Status:** issues_found

## Summary

The core guard logic is sound where it applies. I ran the hook by hand and checked it against `node_modules/emdash/dist/astro/routes/api/mcp.mjs` and `emdash-runtime-*.mjs`:

- `UPDATE_ALLOWED_KEYS` matches EmDash's `DRAFT_ONLY_UPDATE_KEYS` plus the identity keys (`collection`, `id`, `_rev`, `overrideLock`). Every other key reaches the live row, so the allowlist is correct and default-deny for keys.
- The nine blocked tool names exist and match the deny list.
- The fail-closed wrapper works. Malformed stdin, a missing `tool_name`, a non-object `tool_input` and a missing hook file all exit 2.
- No token value is committed. `git grep ec_pat_` only finds `ec_pat_REDACTED` placeholders.

The weaknesses are at the edges of the guard:

- The guard's perimeter is the MCP tool name only. The documented CLI fallback publishes by default and is not covered.
- Tool-level matching is default-allow.
- The guard permits `overrideLock`, which contradicts the README.
- The README's opening sentence contradicts its own later section.
- Some dead code and a few test gaps.

## Critical Issues

### CR-01: Documented CLI fallback publishes live by default and nothing guards it

**File:** `.claude/settings.json:15-27` (also `README.md` "CLI fallback")
**Issue:** The hook matcher is `mcp__emdash__.*` and there are no Bash rules. The README tells the agent to use `npx emdash content create|update` as the fallback with the same token. I verified in `node_modules/emdash/dist/cli/index.mjs` (lines 519-536 and 577-598) that both commands call `client.publish(...)` unless `--draft` is passed. So the one documented agent workflow outside MCP publishes to the live site if the agent forgets one flag, and `emdash content publish|unpublish|schedule|delete` are one command away. This is not only a malicious-curl case. It is an accidental bypass of D-01 in the supported path. The README's residual-risk paragraph covers curl and "a CLI write without `--draft`", but accepting a risk that a 10-line Bash hook removes is a weak position, and the intro claims "Every write the agent makes lands as a draft".
**Fix:** Add a `Bash` PreToolUse matcher to `.claude/settings.json` that routes to the same script (or a sibling). Handle `tool_name === "Bash"` by parsing `tool_input.command`:

```js
// in check(): Bash branch, fail closed on anything that names the emdash CLI
if (toolName === "Bash" && typeof toolInput?.command === "string") {
  const c = toolInput.command;
  if (
    /\bemdash\b[^|;&]*\bcontent\s+(publish|unpublish|schedule|unschedule|delete|permanent-delete)\b/.test(
      c,
    )
  )
    return "CLI publish-class commands are the user's (D-01).";
  if (
    /\bemdash\b[^|;&]*\bcontent\s+(create|update)\b/.test(c) &&
    !/--draft\b/.test(c)
  )
    return "CLI create/update must pass --draft (D-12).";
}
```

Also add `deny` entries such as `Bash(npx emdash content publish:*)` and `Bash(curl*_emdash/api*)`. This will not be exhaustive, so keep the residual-risk text, but it covers the accidental path.

## Warnings

### WR-01: `overrideLock` is allowed on `content_update`, and a test pins it

**File:** `.claude/hooks/emdash-guard.mjs:23` and `scripts/emdash-guard.test.mjs:133-144`
**Issue:** `overrideLock` is in `UPDATE_ALLOWED_KEYS`. Running the hook with `{..., "overrideLock": true}` exits 0. The README says "an entry open in the editor holds a lock that refuses agent writes", but the agent can defeat that lock by passing one boolean. The write is still a staged draft revision, but it can clobber an in-progress editor session, which is the case the lock exists for. The test "lets slug, locale, overrideLock and migrateBlocks through" enshrines the behavior.
**Fix:** Remove `overrideLock` from `UPDATE_ALLOWED_KEYS`, or allow only `false`/absent:

```js
if (toolInput.overrideLock === true)
  return "overrideLock bypasses the editor lock. Close the entry in the admin instead.";
```

Update the test to expect exit 2 for `overrideLock: true`. The server's lock refusal then surfaces to the agent as the README describes.

### WR-02: README opening claim contradicts the rest of the section

**File:** `README.md:47` versus `README.md` "What the agent can and cannot do"
**Issue:** "Every write the agent makes lands as a draft" is wrong. The README's own list says menu tools, taxonomy term create/update/delete, media tools and byline tools are live immediately, and CLI writes without `--draft` publish. `content_update` with `overrideLock` also touches locked entries (WR-01). A reader who stops at the first paragraph gets a false safety model.
**Fix:** Reword to: "Content edits made through `content_create` and `content_update` land as drafts. Menu, taxonomy-term, media and byline writes are live (see below)."

### WR-03: Tool matching is default-allow, but key matching is default-deny

**File:** `.claude/hooks/emdash-guard.mjs:73-113`
**Issue:** Any `mcp__emdash__*` tool not named in `BLOCKED_TOOLS`, `content_create` or `content_update` returns `null` (defers). EmDash 1.3.1 registers about 70 tools. The comment on `UPDATE_ALLOWED_KEYS` says an allowlist refuses new keys "until reviewed", but the same reasoning is not applied to tools. A new publish-class tool in a later EmDash version (or one I did not enumerate) passes. Verified: `mcp__emdash__media_delete` and `mcp__emdash__menu_set_items` exit 0, as do `taxonomy_delete_term` and `byline_delete`.
These are irreversible live deletions, while `content_delete` is blocked. The README labels the surface "accepted", but the inconsistency is unexplained: a trashed card is recoverable via `content_restore`, whereas `media_delete`, `taxonomy_delete_term` and `menu_delete` are not.
**Fix:** Either invert to an explicit allowlist of permitted tools (`content_list|get|create|update|compare|discard_draft|duplicate|translations`, `taxonomy_list*`, `schema_get*`, `search`, plus the intended menu/media/term tools), or add the destructive live tools (`media_delete`, `menu_delete`, `taxonomy_delete_term`, `byline_delete`) to `BLOCKED_TOOLS` and the deny list. Update the README and the 9-name assertion to match.

### WR-04: The agent can edit the guard itself

**File:** `.claude/settings.json:2-14`
**Issue:** The only deny rules are for the emdash tools. Nothing prevents the agent from using Edit/Write/Bash on `.claude/hooks/emdash-guard.mjs`, `.claude/settings.json`, `.mcp.json` or `.claude/settings.local.json` (for example `permissions.allow` entries or hook removal in the local settings). The README residual-risk text mentions "a session whose settings disable hooks" but treats it as an external risk. It is also an in-session one.
**Fix:** Add denies:

```json
"Edit(.claude/**)", "Write(.claude/**)", "Edit(.mcp.json)", "Write(.mcp.json)"
```

This is a soft barrier only (Bash can still write), but it removes the casual path.

### WR-05: Guard is coupled to the literal server name `emdash`

**File:** `.claude/hooks/emdash-guard.mjs:12,73` and `.claude/settings.json:19`
**Issue:** Both the matcher and the in-script check key on `mcp__emdash__`. If the same endpoint is ever registered under another name (a user-scope `~/.claude.json` entry, a plugin-provided server `mcp__plugin_*__`, a second server for the Phase 5 deployed site, or the `claude.ai` connector route), every call skips the hook and the deny list. The README says to reuse the same server name with a different `EMDASH_MCP_URL`, which holds today, but the failure mode is silent.
**Fix:** Match on the tool suffix rather than the server prefix, for example matcher `mcp__.*` with `/^mcp__[^_].*?__(content_|taxonomy_)/` in the script, or add a test that fails when `.mcp.json` defines any server name other than `emdash`. The existing test already asserts one server, so also note the dependency in the README.

### WR-06: `content_create` has a dead `publishedAt` branch

**File:** `.claude/hooks/emdash-guard.mjs:92-94`
**Issue:** `publishedAt` is not in `CREATE_ALLOWED_KEYS`, so the allowlist check at lines 86-91 always returns first. Running the hook with `publishedAt` prints "publishedAt is not a key a new draft may carry", not the dedicated message. The branch can never execute. The tests "publishedAt date" and "publishedAt null" pass via the generic path, so they would also stay green if the branch were deleted, and they do not verify it.
**Fix:** Delete lines 92-94 and put the explanation in the allowlist comment, or remove the key from the allowlist reasoning and check `publishedAt` before the allowlist if the specific message matters.

### WR-07: Test gaps in `scripts/emdash-guard.test.mjs`

**File:** `scripts/emdash-guard.test.mjs`
**Issue:**

- No case for `content_update` with `status: "draft"`, which on EmDash unpublishes. It is blocked only by the allowlist and is not asserted.
- No case for `content_create` with `tool_input` as an array or string, only `null`.
- No case for a non-string `tool_name` (for example a number), though the guard has a branch for it.
- `runRegisteredHook` returns `{status: 0}` without running anything when no matcher entry matches. A broken matcher (typo) that also matches no tool would make the entire suite vacuous apart from the single registration test. Hook cases should assert that an entry was found.
- `registeredEntries()` and `entry.hooks[0]` assume one hook. A second hook would be silently ignored.
- The tests read `.claude/settings.json` relative to the process cwd, so `node --test scripts/emdash-guard.test.mjs` fails from any other directory. Resolve paths from `import.meta.url`.
- The "hook file is missing" case passes because of the `|| exit 2` wrapper, but it conflates a missing file with a missing `node`. There is no case where the hook file exits 1 mid-run.
- No test pins that `overrideLock: true` is refused, which is the behavior WR-01 recommends.
  **Fix:** Add the cases above, make `runRegisteredHook` throw when no entry matches a `mcp__emdash__*` name, and use a `new URL("../.claude/settings.json", import.meta.url)` root.

## Info

### IN-01: Token scopes grant what the guard then forbids

**File:** `README.md` "Create the agent token" and `.claude/hooks/emdash-guard.mjs:37-39`
**Issue:** `taxonomy_create|update|delete` require `taxonomies:manage` (mcp.mjs lines 2085, 2115 and 2137), which the README token includes. The server would permit what the hook blocks, so taxonomy definition protection is client-side only, unlike the schema and settings tools, which the server refuses. The README says the guard is a second layer for this case, which is accurate, but "`AGENT-03` taxonomy definitions" reads as if the server also refuses them. Drop the scope if term tools are not needed, or state the limitation.

### IN-02: Hook has no explicit timeout and relies on blocking stdin

**File:** `.claude/settings.json:21-22` and `.claude/hooks/emdash-guard.mjs:117`
**Issue:** `readFileSync(0)` blocks until stdin closes, and a hook timeout in Claude Code is non-blocking, so a hung read would fail open. Realistically stdin always closes. Setting `"timeout": 10` on the hook entry makes the intent explicit and bounds the case. `readFileSync(0)` can also throw `EAGAIN` on some platforms, which fails closed but would block every emdash call with a confusing message.

### IN-03: `.mcp.json` permits a plain-HTTP override of the token destination

**File:** `.mcp.json:5-8`
**Issue:** `EMDASH_MCP_URL` can be set to any scheme and host, and the bearer token is sent to it. The default is localhost, and the README documents an https deployed URL. A note in the README ("never set an http:// remote") would cover this, or the token should be a separate one per environment, which the README already says.

---

_Reviewed: 2026-10-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
