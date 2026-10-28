# Phase 4: Agent Access - Pattern Map

**Mapped:** 2026-10-26
**Files analyzed:** 8 (6 new, 2 modified plus 1 doc amendment)
**Analogs found:** 5 / 8 (the rest are config files with no in-repo analog; use RESEARCH.md examples)

## File Classification

| New/Modified File                                                            | Role                      | Data Flow                                    | Closest Analog                                                                             | Match Quality           |
| ---------------------------------------------------------------------------- | ------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------- |
| `.claude/hooks/emdash-guard.mjs`                                             | utility (PreToolUse hook) | request-response (stdin JSON, exit code)     | `scripts/check-public-js.mjs` (header, JSDoc, exit code, `// @ts-check`)                   | role-match (style only) |
| `scripts/emdash-guard.test.mjs`                                              | test                      | transform (pipe JSON in, assert exit/stderr) | `scripts/check-public-js.test.mjs` (spawnSync of a script, `node:test`)                    | exact                   |
| `.claude/settings.json` (modify, currently `{}`)                             | config                    | n/a                                          | none                                                                                       | no analog               |
| `.mcp.json` (new)                                                            | config                    | n/a                                          | none                                                                                       | no analog               |
| `README.md` (modify, "Agent access" section)                                 | docs                      | n/a                                          | none in README (Astro starter text); table style from README Commands table                | partial                 |
| `.planning/phases/04-agent-access/04-AGENT-ACCESS-PASS.md`                   | evidence record           | n/a                                          | `.planning/phases/02-content-model-and-import/02-MCP-API-PASS.md`                          | exact                   |
| `.planning/REQUIREMENTS.md` (modify AGENT-01, AGENT-02 wording, lines 50-53) | docs                      | n/a                                          | existing lines in same file                                                                | exact                   |
| `package.json`                                                               | config                    | n/a                                          | no change needed: `test` glob `scripts/*.test.mjs` (line 13) already picks up the new test | n/a                     |

All analog paths above were confirmed git-tracked (`git ls-files`).

## Pattern Assignments

### `scripts/emdash-guard.test.mjs` (test, transform)

**Analog:** `scripts/check-public-js.test.mjs`

**Header and imports** (lines 1-16):

```javascript
// @ts-check
// Committed deliberate failing case for the public-JS allowlist check (D-11): ...
// run: node --test scripts/check-public-js.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
```

**Spawn-the-script helper pattern** (lines 39-50). Copy this shape, but feed JSON on stdin via the `input` option and return `status` plus `stderr`:

```javascript
function inventory(args) {
  const result = spawnSync(
    process.execPath,
    ["scripts/script-inventory.mjs", ...args],
    { encoding: "utf8" },
  );
  return { status: result.status, stdout: result.stdout };
}
```

Adapt to:

```javascript
function guard(payload) {
  const r = spawnSync(process.execPath, [".claude/hooks/emdash-guard.mjs"], {
    input: JSON.stringify(payload),
    encoding: "utf8",
  });
  return { status: r.status, stderr: r.stderr };
}
```

**Assertion style** (lines 79-86, 98-100): `describe` / `it`, `assert.equal(result.status, 0, result.stdout)` with the output as the failure message, `assert.match(...)` on message text. Cases to cover per RESEARCH Pattern 3: `content_update` with each of `status`, `publishedAt`, `seo`, `bylines`, `taxonomies` exits 2; plain `data`-only update exits 0; `content_create` with `status: "published"` or `publishedAt` exits 2; `content_create` without status exits 0. Payload shape: `{ tool_name: "mcp__emdash__content_update", tool_input: {...} }`.

Notes: use `import.meta.url`-free relative paths like the analog (tests run from repo root via `npm test`). Tests are TS-checked JS (`// @ts-check`), so JSDoc-type helpers.

---

### `.claude/hooks/emdash-guard.mjs` (utility, request-response)

**Analog:** `scripts/check-public-js.mjs` (style only; no existing hook)

**Conventions to copy:**

- First line `// @ts-check`, then a header comment block stating purpose, usage, and decision IDs (lines 1-8: "Public-JS guard (GUARD-01): ..." with `// usage:`). Reference D-01 and D-12.
- Named constants at top in UPPER_SNAKE (lines 28-43), e.g. `const BLOCKED_UPDATE_KEYS = ["status","publishedAt","seo","bylines","taxonomies"]`.
- JSDoc-typed pure functions (lines 50-54, 69-75): export a pure `check(toolName, toolInput)` returning a reason string or null so it is testable; the stdin wrapper stays thin.
- Exit-code reporting at the bottom (lines 440-445): `console.log(...)` then `process.exitCode = ...`. For the hook, write the reason to stderr and set `process.exitCode = 2` to block (CLAUDE.md "no any" applies; use `unknown` plus narrowing).
- Error path (lines 433-436): catch, print `error: ${error instanceof Error ? error.message : error}`. For a guard, malformed stdin should fail closed (exit 2).

**Core logic source:** RESEARCH.md "Pattern 3" (lines 272-304) and "Finding 3" `DRAFT_ONLY_UPDATE_KEYS` (emdash-runtime.ts:304-313). Block on `content_update` when any of `status`, `publishedAt`, `seo`, `bylines`, `taxonomies` is a defined key; block on `content_create` when `status === "published"` or `publishedAt` is present.

---

### `.claude/settings.json` (config)

**No in-repo analog** (file is currently `{}`). Use RESEARCH.md Pattern 3 verbatim (deny list of `mcp__emdash__content_publish`, `_unpublish`, `_schedule`, `_delete`, `_permanent_delete`; `PreToolUse` matcher `mcp__emdash__content_(create|update)`; command `node .claude/hooks/emdash-guard.mjs`). Deny rules use bare tool names, no parentheses. Write plain JSON (no comments, no trailing commas; the RESEARCH block is jsonc). Note `.claude/skills/emil-design-eng` is a tracked entry in the same dir, so only edit `settings.json`.

---

### `.mcp.json` (config)

**No in-repo analog.** Use RESEARCH.md Pattern 1 (lines 253-264):

```json
{
  "mcpServers": {
    "emdash": {
      "type": "http",
      "url": "${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}",
      "headers": { "Authorization": "Bearer ${EMDASH_TOKEN}" }
    }
  }
}
```

Static check from RESEARCH Validation: JSON parses; `git grep -n "ec_pat_" -- . ':!node_modules'` returns nothing (also applies to README, evidence file, settings; use `ec_pat_REDACTED` placeholders).

---

### `.planning/phases/04-agent-access/04-AGENT-ACCESS-PASS.md` (evidence, n/a)

**Analog:** `.planning/phases/02-content-model-and-import/02-MCP-API-PASS.md`

**Structure to copy** (lines 1-24):

1. H1 `# Phase 4: EmDash agent access pass (evidence record)`.
2. One header paragraph: who ran it and when, server URL (`http://localhost:4321/_emdash/api/mcp`), auth method (scoped PAT, redacted), target entry (throwaway `agent-access-check`), and what was reverted/deleted (line 3 pattern).
3. A "state at the time" paragraph (line 5 pattern): record the scope correction (D-06 amended to six real scopes) and the client-side publish guard caveat.
4. Two-column table `| Check | Result |` with backtick-quoted tool calls on the left and concrete outcomes (`Rejected: INSUFFICIENT_SCOPE ...`) on the right (lines 7-22). Rows E1 to E7 from RESEARCH "Evidence plan" (lines 428-436). Mark E6 explicitly as client-side refusal; E7 as user-run.
5. Closing `Not covered by this pass:` paragraph (line 24), e.g. the Bash-with-token residual risk and UI-only steps.

No em dashes anywhere (project copy rule); use periods, commas or colons.

---

### `README.md` "Agent access" section (docs)

**No in-repo analog for the content.** README is still the Astro starter. Only the existing Commands table (lines 32-39, `| Command | Action |` with `:---` alignment) is a style reference for the env var table (`EMDASH_TOKEN`, `EMDASH_MCP_URL`, `EMDASH_URL`, with local and Phase 5 values side by side per Pitfall 10).

Content comes from RESEARCH.md "Code Examples" (lines 392-422): fresh-session setup, rotation, CLI fallback with `--draft`. Required warnings: do not authorize an OAuth prompt (Finding 5), project-scoped server approval on first run, `emdash login` not documented, residual risk of the token being in Claude's environment, tag/category/SEO changes made in the admin (D-12), use `content list` not `whoami` as the proof. Insert as a new `##` section; do not rewrite the starter text beyond what is needed. Keep fenced code blocks tagged `bash`/`json` like the existing `sh`/`text` fences. Prettier formatting is evident in the repo (aligned tables).

---

### `.planning/REQUIREMENTS.md` (docs amendment, D-03)

**Analog:** the same file, lines 50-53. Existing format:

```
- [ ] **AGENT-02**: Claude can update and publish a project card through MCP or CLI, with writes landing as drafts by default
```

Amend AGENT-01 (scope list wording) and AGENT-02 ("Claude drafts and updates a project card through MCP or CLI; the user publishes") keeping the `- [ ] **ID**: sentence` shape. Traceability table rows (lines 131-134) stay `| AGENT-0N | Phase 4 | Pending |` until verification.

---

## Shared Patterns

### No secrets in committed files

**Apply to:** `.mcp.json`, README section, evidence file, `.claude/settings.json`
Reference env vars only; placeholder `ec_pat_REDACTED`. `.env` is gitignored (`.gitignore` line "environment variables").

### Script header and typing convention

**Source:** `scripts/check-public-js.mjs` lines 1-8, `scripts/check-public-js.test.mjs` lines 1-4
`// @ts-check`, a purpose comment, a `run:`/`usage:` line. `node:`-prefixed built-in imports; JSDoc types (no `any`, per CLAUDE.md).

### Tests auto-collected by `npm test`

**Source:** `package.json` line 13: `node --test "scripts/*.test.mjs" "src/lib/*.test.mjs"`; CI runs `npm test` (`.github/workflows/ci.yml`). A new `scripts/emdash-guard.test.mjs` runs in CI with no config change. The hook lives under `.claude/hooks/`, outside both globs, so only the test file needs to be under `scripts/`.

### Evidence discipline

**Source:** `02-MCP-API-PASS.md`: revert or delete every change, say what is not covered, never claim UI-only behavior without a user session.

### Workflow rules (from STATE.md / memory)

Never start `astro dev` autonomously (all live evidence tasks are user-run checkpoints); never `git push`; no em dashes in copy.

## No Analog Found

| File                       | Role   | Data Flow | Reason                                                                           |
| -------------------------- | ------ | --------- | -------------------------------------------------------------------------------- |
| `.claude/settings.json`    | config | n/a       | Currently `{}`; no existing permissions or hooks config. Use RESEARCH Pattern 3. |
| `.mcp.json`                | config | n/a       | None exists. Use RESEARCH Pattern 1.                                             |
| README "Agent access" body | docs   | n/a       | README is the untouched Astro starter. Use RESEARCH Code Examples.               |

## Metadata

**Analog search scope:** `scripts/`, `src/lib/`, `.claude/`, `.github/workflows/`, `.planning/phases/02-*`, `README.md`, `package.json`, `.planning/REQUIREMENTS.md`
**Files scanned:** about 15 tracked files read or listed
**Pattern extraction date:** 2026-10-26
