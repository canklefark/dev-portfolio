# Phase 4: Agent Access - Research

**Researched:** 2026-10-26
**Domain:** EmDash 1.3.1 personal access tokens (PATs), the `/_emdash/api/mcp` endpoint, the `emdash` CLI, and Claude Code MCP configuration
**Confidence:** HIGH on how EmDash 1.3.1 behaves (read from the installed source and checked against the shipped dist), MEDIUM on Claude Code enforcement options (official docs, not exercised here)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** The agent token carries no publish scope (no `content:publish_own`, `content:publish_any` or `content:publish`). Claude can only create and edit drafts. The user publishes in the admin, or with a separate short-lived elevated token created for that moment. — **Reversibility:** reversible — scopes are set per token and a new token can be minted.
- **D-02:** Edits Claude makes to an already-published entry must become a pending draft revision, with the live page keeping the old copy until published. The researcher must verify EmDash does this for a token with `content:write` and no publish scope. If it does not (writes go live directly), stop and bring it back to the user rather than accepting direct edits, since that breaks ROADMAP criterion 2.
- **D-03:** Requirement wording tension: AGENT-02 and the phase goal say Claude "updates and publishes". With D-01 the publish step is the user's. Record this as an accepted amendment of AGENT-02 (draft by agent, publish by user) in the phase verification and update REQUIREMENTS.md wording to match.
- **D-04:** MCP is the documented primary path: Claude Code connects to the EmDash MCP endpoint (`/_emdash/api/mcp`) with the scoped PAT as a bearer token. The `emdash` CLI (`content`, `taxonomy`, `menu`, `media`) is documented as a fallback for scripting, with the same PAT.
- **D-05:** The agent uses the PAT only. The OAuth session used in Phase 2 (`02-MCP-API-PASS.md`) carries the user's full admin rights, so OAuth is not documented as an agent option.
- **D-06:** Scopes on the agent token: `content:read`, `content:write`, `content:read_drafts` (so Claude can read its own drafts), `media:read`, `media:write`, `menus:manage`, `taxonomies:read`, `taxonomies:write`. Explicitly absent: `schema:*`, `settings:manage`, `users:*`, any admin scope and any publish scope. This is a deliberate superset of the roadmap list: `content:read_drafts` and the taxonomy scopes are added because draft review and tag/category terms as content (Phase 2 D-05, D-09) require them. `menus:manage` lets Claude reorder or remove nav links; accepted.
- **D-07:** The PAT expires after 90 days and lives in an environment variable. A committed `.mcp.json` references the endpoint and token through environment variables (`${EMDASH_MCP_URL}`, `${EMDASH_TOKEN}`); no secret is committed. Rotation steps (recreate in the admin, update the variable) are documented.
- **D-08:** Tokens cascade away with their users. After the Phase 5 database move the token must be recreated; record this as a Phase 5 handoff item, not a Phase 4 task.
- **D-09:** The setup is documented in an "Agent access" section of `README.md`, with the committed `.mcp.json`. Phase 6 folds the workflow into `CLAUDE.md`. The endpoint URL differs per environment (`http://localhost:4321/_emdash/api/mcp` locally, `https://dev.zeikcookson.com/_emdash/api/mcp` after Phase 5) through `EMDASH_MCP_URL`.
- **D-10:** AGENT-04 proof: the user starts a fresh Claude Code session with only the documented environment variables set, following the README verbatim, and a content list call succeeds. Recorded in the evidence file.
- **D-11:** AGENT-01 to AGENT-03 are proven by live MCP calls against the local dev server with the scoped token, recorded in an evidence file in the phase directory in the style of `02-MCP-API-PASS.md`. Record at minimum: the token authenticates; an update to a project card lands as a draft and is absent from the rendered page until published; a schema-changing call (for example `schema_create_field`) is refused; a publish call is refused. No committed test script.

### Claude's Discretion

- Exact evidence-file name and table layout.
- Which project card and which field is the test target (use a throwaway entry or revert every change, as in Phase 2).
- How the README section is worded, within D-04 to D-10 and the project's no-em-dash copy rule.
- How the user creates the PAT (admin UI or CLI) as long as the resulting scopes match D-06.

### Deferred Ideas (OUT OF SCOPE)

- Audit logging or review of agent writes: raised as an option, not selected; revisit if agent use grows.
- Restricting what Claude may do with menus and media beyond the chosen scopes: accepted as is for now.
- Publishing through Claude via an elevated short-lived token: possible per D-01 but no workflow is built in this phase.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID                    | Description                                                                                                  | Research Support                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AGENT-01              | A scoped PAT (content read and write, media, menus; no schema or admin scope) works against the MCP endpoint | Valid scope set and creation path (Standard Stack, Finding 1). Evidence calls E1, E2                                                                                           |
| AGENT-02              | Claude can update and publish a project card through MCP or CLI, with writes landing as drafts by default    | `content_update` stages data edits as a draft revision on `projects` (Finding 3), with live-write exceptions. Publish cannot be withheld by scope (Finding 2). Evidence E3, E4 |
| AGENT-03              | Schema-changing calls are refused for the agent token                                                        | Every schema tool calls `requireScope(extra, "schema:write")`; middleware fails closed to `admin` (Finding 6). Evidence E5                                                     |
| AGENT-04              | The working Claude Code MCP setup is documented                                                              | `.mcp.json` with env expansion, README section, rotation steps, clean-session proof (Code Examples, Pitfalls). Evidence E7                                                     |
| </phase_requirements> |

## Summary

The server side of this phase is small: EmDash 1.3.1 already ships a PAT system, a stateless bearer-authenticated MCP endpoint and a CLI that accepts `EMDASH_TOKEN`. No packages are installed. The work is creating one PAT in the admin, committing a `.mcp.json`, writing the README section, and recording a live evidence pass. But reading the installed source turned up four facts that contradict CONTEXT.md decisions, and the planner has to resolve them with the user before writing tasks.

First, D-06 lists scope names that cannot be put on a token. `content:read_drafts`, `taxonomies:read`, `taxonomies:write` and the `content:publish_*` names are RBAC permissions evaluated against the owning user's role, not token scopes. The PAT creation endpoint rejects any string that is not in `VALID_SCOPES`. Second, and more important, D-01 cannot be enforced by token scope: there is no publish scope, and `content_publish` only requires the `content:write` scope plus a publish permission that the owning admin user already has. A token's effective rights are the user's role intersected with its scopes, so an admin-owned token with `content:write` can publish, delete and permanently delete. No other role works either, because the imported entries have no author, so editing them needs `content:edit_any`, which is the same EDITOR tier that carries `content:publish_any`. Third, D-02 holds only partly: edits to `data` fields on a published entry become a pending draft revision, but `taxonomies`, `seo`, `bylines`, `status` and `publishedAt` writes go straight to the live row. Category and tags are taxonomies in this project, so an agent that sets them on a published card changes the live page at once. Fourth, the CLI `content create` and `content update` publish automatically unless `--draft` is passed.

The recommended path is to keep what EmDash does enforce on the server (schema, settings, users, admin and transfer are refused by scope) and add the missing publish guarantee on the client side with committed Claude Code deny rules and a small `PreToolUse` hook, documented honestly as harness enforcement that a shell with the token in its environment can bypass. This needs a user decision (Open Question 1) before planning. ROADMAP's original wording ("writes drafts and publishes on request") matches what the server natively offers, so the AGENT-02 amendment in D-03 may be better stated as "drafts by default, publish is a separate explicit step the user triggers".

**Primary recommendation:** Create the PAT in the admin with scopes `content:read, content:write, media:read, media:write, menus:manage, taxonomies:manage` and a 90-day expiry; commit `.mcp.json` using `${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}` and `${EMDASH_TOKEN}`; get the user's decision on publish enforcement (client-side guard recommended) before writing plans; prove E1 to E7 live against a throwaway entry the user publishes.

## Architectural Responsibility Map

| Capability                                     | Primary Tier                                                                                  | Secondary Tier                                | Rationale                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| Token issuance, storage, expiry                | API / Backend (EmDash admin API, `_emdash_api_tokens`)                                        | Database / Storage                            | SHA-256 hash only is stored; raw token shown once                               |
| Scope and role enforcement                     | API / Backend (middleware `enforceTokenScope` plus per-tool `requireScope` and `requireRole`) | —                                             | Server decides; effective rights are role intersected with scope                |
| Draft versus live separation                   | API / Backend (runtime `handleContentUpdate`, revisions)                                      | Database / Storage                            | Draft data lives in the revisions table, live data in `ec_projects` columns     |
| Rendered page (proof that a draft is not live) | Frontend Server (SSR via `src/lib/projects.ts`)                                               | —                                             | Public read path reads live columns, drafts return 404 (Phase 3)                |
| Publish gate for the agent                     | Client (Claude Code permissions and hooks)                                                    | API / Backend (cannot enforce, see Finding 2) | The server has no publish scope; only the harness can refuse the tool call      |
| Connection config and secrets                  | Client (`.mcp.json`, shell environment)                                                       | —                                             | Endpoint and token come from environment variables, nothing secret is committed |

## Standard Stack

### Core

| Library                   | Version                                                                | Purpose                                       | Why Standard                                          |
| ------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------- |
| emdash                    | 1.3.1 (npm latest, modified 2026-10-18) [VERIFIED: npm registry]       | MCP endpoint, PAT system, `emdash` CLI        | Already the project CMS; already installed, no change |
| @emdash-cms/auth          | 1.3.1 [VERIFIED: node_modules/@emdash-cms/auth/package.json]           | Scope list, `hasScope`, role/permission map   | Owns `VALID_SCOPES` and RBAC                          |
| @modelcontextprotocol/sdk | 1.32.2 [VERIFIED: node_modules/@modelcontextprotocol/sdk/package.json] | Streamable HTTP transport behind the endpoint | Dependency of emdash; no direct use                   |
| Claude Code               | 2.1.308 [VERIFIED: `claude --version`]                                 | MCP client reading `.mcp.json`                | The agent runtime this phase targets                  |

### Supporting

| Tool                                             | Purpose                                                 | When to Use                                    |
| ------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------- |
| `sqlite3` 3.54.0 [VERIFIED: `sqlite3 --version`] | Read-only inspection of `data/emdash.db` for evidence   | Confirm token row, scopes, `draft_revision_id` |
| `curl`                                           | Fetch rendered pages and send negative-control requests | Evidence E3, E4, E2                            |

### Alternatives Considered

| Instead of                | Could Use                                                                           | Tradeoff                                                                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin UI token creation   | `POST /_emdash/api/admin/api-tokens`                                                | The CLI has no token command; the API needs a session plus `X-EmDash-Request: 1`. UI is simpler (Claude's Discretion item)                                                |
| Client-side publish guard | A first-party `content:beforePublish` plugin that cancels `origin.source === "mcp"` | Real server-side refusal for MCP, but not for REST/CLI with the PAT, and it adds a plugin against the planned "no-plugins rule" (DOCS-01). Needs a spike [ASSUMED wiring] |
| Admin-owned PAT           | PAT for a lower-role user                                                           | Not viable: see Finding 2                                                                                                                                                 |

**Installation:** none. No packages are added in this phase.

**Version verification:** `npm view emdash version` returned `1.3.1`, matching `node_modules/emdash/package.json`. [VERIFIED: npm registry]

## Package Legitimacy Audit

No external packages are installed in this phase, so the legitimacy gate does not apply.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Key Findings (read before planning)

### Finding 1: D-06 scope names are not valid token scopes

`VALID_SCOPES` in `node_modules/@emdash-cms/auth/src/tokens.ts:46-60` is:

```ts
export const VALID_SCOPES = [
  "content:read",
  "content:write",
  "media:read",
  "media:write",
  "schema:read",
  "schema:write",
  "taxonomies:manage",
  "menus:manage",
  "settings:read",
  "settings:manage",
  "mcp:tools",
  ...TRANSFER_SCOPES,
  "admin",
] as const;
```

[VERIFIED: node_modules/@emdash-cms/auth/src/tokens.ts:46-60] The create-token route validates with `scopes: z.array(z.string().refine(isValidScope)).min(1)` [VERIFIED: node_modules/emdash/src/astro/routes/api/admin/api-tokens/index.ts:19-24], and the admin form offers exactly these values [VERIFIED: node_modules/@emdash-cms/admin/dist/index.js:2574-2589, `API_TOKEN_SCOPES`]. `content:read_drafts`, `content:publish_own`, `content:publish_any`, `taxonomies:read` and the CONTEXT names `schema:manage`, `taxonomies:write`, `users:*` appear only in the `Permissions` table (`"content:read_drafts": Role.CONTRIBUTOR`, `"content:publish_own": Role.AUTHOR`, `"taxonomies:read": Role.SUBSCRIBER`) [VERIFIED: node_modules/@emdash-cms/auth/src/rbac.ts:18,31,43], which is checked against the owner's role, not the token.

Consequences for the plan:

- Corrected scope set that matches D-06's intent: `content:read`, `content:write`, `media:read`, `media:write`, `menus:manage`, `taxonomies:manage`.
- Draft reading needs no extra scope. `content_list` and `content_get` require only `content:read`; whether drafts are returned is decided by `canReadDrafts`, which tests the user's role (`hasPermission({ role: payload.userRole }, "content:read_drafts")`) [VERIFIED: node_modules/emdash/src/mcp/server.ts:757-760].
- `content:write` already implies `menus:manage` and `taxonomies:manage` through `IMPLICIT_SCOPE_GRANTS = new Map([["content:write", ["menus:manage", "taxonomies:manage"]]])` [VERIFIED: node_modules/@emdash-cms/auth/src/tokens.ts:95-97]. Listing them explicitly documents intent; omitting them would not remove the capability. D-06's "menus accepted" stands, and taxonomy writes cannot be withheld from a `content:write` token at all.
- Absent scopes are refused as intended: schema tools, settings tools, users and transfer need their own scopes, and unmatched REST paths default to `admin` (Finding 6).
- Side effect of omitting `schema:read`: Claude cannot call `schema_get_collection` or `schema_list_collections` (both `requireScope(extra, "schema:read")`) [VERIFIED: node_modules/emdash/src/mcp/server.ts:2238,2273], so it must learn field names from `content_get` output and `emdash-env.d.ts`. See Open Question 3.

### Finding 2: Publish cannot be withheld by token scope (D-01)

`content_publish` checks `requireScope(extra, "content:write")` and then ownership with `requireOwnership(extra, ownerId, "content:publish_own", "content:publish_any")` against the **user's role** [VERIFIED: node_modules/emdash/src/mcp/server.ts:1684,1694]. The same holds for `content_unpublish`, `content_schedule` and for `content_update`/`content_create` with `status` set (`requireOwnership(... "content:publish_own", "content:publish_any")` at line 1449; `hasPermission(user, "content:publish_own")` at line 1272). The REST publish route uses `requireOwnerPerm(user, authorId, "content:publish_own", "content:publish_any")` [VERIFIED: node_modules/emdash/src/astro/routes/api/content/[collection]/[id]/publish.ts:65] and the middleware maps `["/_emdash/api/content", "WRITE", "content:write"]` [VERIFIED: node_modules/emdash/src/astro/middleware/auth.ts:776]. A bearer token resolves to the live user row (`locals.user = user; locals.tokenScopes = resolved.scopes`) [VERIFIED: node_modules/emdash/src/astro/middleware/auth.ts:693-695]. The stated policy is "effective permissions = role permissions ∩ token scopes" [VERIFIED: node_modules/@emdash-cms/auth/src/rbac.ts, `clampScopes` comment].

So a PAT created in the admin (creation requires `user.role >= Role.ADMIN`, token belongs to that user) [VERIFIED: api-tokens/index.ts:56-58] carries admin rights narrowed only by scope. With `content:write` it can also call `content_delete`, `content_unpublish`, `content_schedule` and `content_permanent_delete` (`requireRole(extra, Role.ADMIN)` is satisfied by the owner) [VERIFIED: server.ts:1649].

A lower-role owner does not help. The local database has one user, `dev@emdash.local`, role 50 (admin), and every `ec_projects` row has an empty `author_id` [VERIFIED: sqlite3 -readonly data/emdash.db]. For an entry with no recorded owner, `canActOnOwn` skips the "own" branch and requires the "any" permission [VERIFIED: rbac.ts, `canActOnOwn` comment "falls through to the any-permission check"], and `content:edit_any` and `content:publish_any` are both `Role.EDITOR` [VERIFIED: rbac.ts:24,32]. A CONTRIBUTOR could only edit its own drafts, and menus and taxonomy writes need EDITOR. No role edits existing project cards without also being able to publish them.

Options for the user (Open Question 1):

| Option                                        | What it enforces                                                                                                                                                                                                                                                                                                                                                | Residual gap                                                                                                                                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Client guard (recommended)                 | Committed `.claude/settings.json` deny rules on `mcp__emdash__content_publish`, `_unpublish`, `_schedule`, `_delete`, `_permanent_delete`, plus a `PreToolUse` hook that blocks `status`, `publishedAt`, `seo`, `bylines`, `taxonomies` arguments on `content_update` and `status` on `content_create`. Harness-enforced, so Claude cannot talk its way past it | Token is in Claude's environment, so a Bash `curl` with it can publish. Bash deny rules on args are documented as fragile [CITED: code.claude.com/docs/en/permissions]                                  |
| B. Accept native behavior                     | Nothing extra: drafts by default, publish is a convention                                                                                                                                                                                                                                                                                                       | Violates the user's stated wish ("enforced by token scope, not by convention")                                                                                                                          |
| C. First-party `content:beforePublish` plugin | Server cancels publishes whose `origin.source` is `"mcp"` (event carries `origin: ContentActionOrigin` with `{ source: "api" \| "mcp" \| ... }`) [VERIFIED: node_modules/emdash/src/plugins/types.ts:1397-1403,1476-1479]                                                                                                                                       | REST publishes use `origin: { source: originSource }` with `"api"` for both the admin UI and a PAT, so they cannot be told apart [VERIFIED: publish.ts:97,110]. Adds a plugin; plugin wiring unverified |
| D. Upstream change                            | A real publish scope in EmDash                                                                                                                                                                                                                                                                                                                                  | Not available in 1.3.1                                                                                                                                                                                  |

No option gives an absolute guarantee while an admin-owned PAT sits in the agent's environment. Say so in the README and the evidence file.

### Finding 3: D-02 holds for `data` fields only; taxonomies and SEO go live

All four collections declare `"supports": ["drafts","revisions","preview","seo"]` [VERIFIED: .emdash/seed.json, and `_emdash_collections` in data/emdash.db]. In `emdash-runtime.ts`, when the collection supports revisions, a data edit is written as a new revision and stored as the entry's draft revision, and the live columns are not touched ("Draft data lives only in the revisions table") [VERIFIED: node_modules/emdash/src/emdash-runtime.ts:3860-3862 and 4052-4066]. The MCP tool description says the same: "When status is not set, a change to a published item is staged as a draft, so the response shows the new values while the live version keeps the old ones until content_publish" [VERIFIED: server.ts:1340-1342].

The exception is the set of keys that are **not** draft-only:

```ts
const DRAFT_ONLY_UPDATE_KEYS = new Set([
  "data",
  "slug",
  "locale",
  "skipRevision",
  "references",
  "actor",
  "migrateBlocks",
  "replaceBlocks",
]);
```

[VERIFIED: node_modules/emdash/src/emdash-runtime.ts:304-313] Any other defined key (`taxonomies`, `seo`, `bylines`, `status`, `publishedAt`, `authorId`) sets `liveMetaTouched`, and the update is applied to the live row through `handleContentUpdate`; the source comment reads "Public HTML comes from live columns / SEO / taxonomies, not draft revisions" [VERIFIED: emdash-runtime.ts:4047-4050]. This project stores `category` and `tags` as taxonomy terms read through `d.terms` [VERIFIED: src/lib/projects.ts:46,50]. So `content_update` with `taxonomies` on a published card changes the live page immediately.

D-02 says to stop and bring a failure back to the user. The core case (card fields: title, summary, sub, project_status, time_label, period, stats, body, date) passes; the taxonomy and SEO case does not. Recommend, subject to the user's call, that the hook (Finding 2, Option A) block those keys on `content_update`, that the README tells Claude to change category and tags in the admin, and that the evidence test uses a data field. Also live by design and accepted in D-06: `menu_*`, `taxonomy_*` (term create/update/delete), and `media_*` writes.

`content_get` returns the draft overlay as `data` with the published values in `liveData` and a `draftRevisionId` [VERIFIED: server.ts:1150-1156 comment "handleContentGet overlays the draft revision onto item.data and moves the published values to item.liveData"], which gives an API-level check next to the rendered-page check.

### Finding 4: The CLI fallback publishes by default and can silently use dev bypass

- `emdash content create` and `emdash content update` publish unless `--draft` is passed: `// Auto-publish unless --draft is set` followed by `if (!args.draft) { await client.publish(...) }` [VERIFIED: node_modules/emdash/src/cli/commands/content.ts:201-204, same pattern in `update`]. Every documented CLI example must carry `--draft`. `content update` also requires `--rev` from a prior `content get`.
- Auth resolution is `--token`, then `EMDASH_TOKEN`, then stored OAuth credentials in `~/.config/emdash/auth.json`, then dev bypass when the URL is localhost [VERIFIED: client-factory.ts:42-55]. With no token set, a local CLI call silently runs as the full-admin dev user and would produce a false pass. Evidence runs must export `EMDASH_TOKEN` and `EMDASH_URL`.
- The CLI base URL is the site origin (`EMDASH_URL`, default `http://localhost:4321`) [VERIFIED: client-factory.ts:39], whereas the MCP URL carries the path. These are two variables.
- `emdash whoami` calls `/_emdash/api/auth/me` with the bearer token [VERIFIED: node_modules/emdash/src/cli/commands/login.ts:476-478]. That path matches no `SCOPE_RULES` entry and is not in the public route lists, so the middleware falls through to "No rule matched — default to admin scope (fail-closed)" [VERIFIED: auth.ts:867-870]. Expect a 403 for the scoped PAT. This is an inference from reading, not a run; confirm during evidence and use `content list` as the authentication proof instead (the planner should not make `whoami` a pass criterion).
- `emdash login` is an OAuth device flow that stores full-admin credentials; it contradicts D-05 for agent use and must not appear in the agent docs.

### Finding 5: Bearer auth and the MCP endpoint

The MCP endpoint is bearer-only and stateless. A request with no valid token gets 401 (`mcpUnauthorizedResponse`), CSRF is skipped for token auth, and invalid or expired tokens return `INVALID_TOKEN` with a `WWW-Authenticate` header pointing at OAuth discovery [VERIFIED: auth.ts:268-322]. The endpoint skips path-level scope checks (`if (pathname === MCP_ENDPOINT_PATH) return null;`) because each tool enforces its own [VERIFIED: auth.ts:843-846]. `GET` and `DELETE` return 405 [VERIFIED: node_modules/emdash/src/astro/routes/api/mcp.ts]. Practical effect: a wrong or expired token can make Claude Code offer an OAuth sign-in. Completing it would give the agent the user's full admin rights, contrary to D-05. The README must say: if `/mcp` shows "Needs authentication", do not authorize; fix the token.

### Finding 6: What a schema call returns

Every schema tool starts with a `requireScope` call: `schema_create_field` requires `schema:write` (server.ts:2592), `schema_create_collection` `schema:write` (2420), `schema_get_collection` `schema:read` (2273), and `settings_update` `settings:manage` (3824). `requireScope` throws `EmDashAuthError("Insufficient scope: requires <scope>", "INSUFFICIENT_SCOPE")` [VERIFIED: server.ts:667-675]. The tool wrapper converts it to an error envelope carrying the code [VERIFIED: server.ts:463-498]. REST equivalents return `INSUFFICIENT_SCOPE` with HTTP 403 from the middleware [VERIFIED: auth.ts:859-870]. This satisfies AGENT-03 for the schema and settings surface.

Other live-effect tools still open to this token and worth documenting as accepted or blocked by the guard: `content_delete` (soft delete removes the page from the site), `content_unpublish`, `content_schedule`, `revision_restore` (replaces the draft only, not live), `menu_*`, `taxonomy_*`, `media_*`, `byline_*`.

## Architecture Patterns

### System Architecture Diagram

```
Claude Code session (env: EMDASH_MCP_URL, EMDASH_TOKEN)
   |
   |  .mcp.json: type http, url ${EMDASH_MCP_URL:-...}, Authorization: Bearer ${EMDASH_TOKEN}
   v
[Client-side guard, Option A]  .claude/settings.json deny rules + PreToolUse hook
   |   (blocks publish-class tools and live-write arguments before the request leaves)
   v
POST /_emdash/api/mcp  -- Astro auth middleware
   |   token prefix ec_pat_ -> hash lookup -> expiry check -> user row -> locals.tokenScopes
   |   (no valid token -> 401 INVALID_TOKEN)
   v
MCP tool handler: requireScope(tool scope) -> requireRole -> ownership/permission
   |            \-> missing scope: INSUFFICIENT_SCOPE (schema_*, settings_*, users, transfer)
   v
handleContentUpdate (runtime)
   |-- data/slug  -> new revision -> entry.draft_revision_id   (draft, not live)
   |-- taxonomies/seo/bylines/status/publishedAt -> live row   (live immediately)
   v
SQLite data/emdash.db
   ^
   |  public GET /projects/{slug} reads live columns and live term links (draft slug -> 404)
User admin session (passkey) -> Publish -> revision promoted to live -> page changes
```

### Recommended Project Structure

```
.mcp.json                         # new, committed, no secrets
.claude/settings.json             # Option A only: deny rules + hook registration (currently "{}")
.claude/hooks/emdash-guard.mjs    # Option A only: reads tool_input JSON on stdin, exits 2 to block
scripts/emdash-guard.test.mjs     # Option A only: node --test, piped JSON cases (picked up by npm test glob)
README.md                         # replace Astro starter text only where needed; add "Agent access" section
.planning/phases/04-agent-access/04-AGENT-ACCESS-PASS.md   # evidence file (name is discretionary)
.planning/REQUIREMENTS.md         # AGENT-01 and AGENT-02 wording amended (D-03)
```

### Pattern 1: Project-scoped MCP server over HTTP with env expansion

**What:** One committed `.mcp.json`; endpoint and secret both come from the environment.
**When to use:** Always for this phase (D-07, D-09).
**Example:**

```json
{
  "mcpServers": {
    "emdash": {
      "type": "http",
      "url": "${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}",
      "headers": {
        "Authorization": "Bearer ${EMDASH_TOKEN}"
      }
    }
  }
}
```

Source: shape and `${VAR:-default}` expansion in `url` and `headers` per [CITED: code.claude.com/docs/en/mcp]. The default on the URL is a recommended refinement of D-07/D-09 so that a clean local session needs only `EMDASH_TOKEN`; `EMDASH_MCP_URL` is still the per-environment override (Phase 5 sets `https://dev.zeikcookson.com/_emdash/api/mcp`). Claude Code prompts before using a project-scoped server in interactive sessions [CITED: code.claude.com/docs/en/mcp], so the README must mention the one-time approval. Do not use `ANTHROPIC_*`, `AWS_BEARER_TOKEN_BEDROCK`, `HTTPS_PROXY` or `NPM_TOKEN` as variable names; Claude Code blanks those in remote `url` and `headers` [CITED: code.claude.com/docs/en/mcp]. `EMDASH_TOKEN` is not affected.

### Pattern 2: Creating the PAT

Admin UI at `/_emdash/admin/settings/api-tokens` [VERIFIED: node_modules/@emdash-cms/admin/dist/index.js:85228 route `/settings/api-tokens`]. Name it for its purpose (for example `claude-agent`), tick exactly the six scopes in Finding 1, set expiry to 90 days (the form default is 30 days; the option list is none, 7, 30, 90 days and 1 year) [VERIFIED: admin dist index.js:49660-49700 and 50255], copy the `ec_pat_...` value once (only the hash is stored) [VERIFIED: api-tokens.ts header comment], and export it. Verify the saved scope list afterwards in the token list or with `sqlite3 -readonly data/emdash.db "select name,scopes,expires_at from _emdash_api_tokens"`. Tokens are listed per owner and revoked from the same page [VERIFIED: api-tokens handler `handleApiTokenList`, `handleApiTokenRevoke`].

### Pattern 3: Client guard hook (Option A only)

Claude Code deny rules for MCP tools use the bare tool name with no parentheses; a rule with parentheses on an `mcp__` tool is skipped, so argument filtering has to be a hook [CITED: code.claude.com/docs/en/permissions]. A `PreToolUse` command hook receives `tool_name` and `tool_input` as JSON on stdin and blocks with exit code 2 (stderr is shown as the reason) [CITED: code.claude.com/docs/en/hooks]. Matcher `mcp__emdash__.*` is a regex because it contains `.` and `*` [CITED: code.claude.com/docs/en/hooks]. Deny rules are evaluated even when a hook returns allow, and deny wins over allow [CITED: code.claude.com/docs/en/permissions].

```jsonc
// .claude/settings.json (Option A)
{
  "permissions": {
    "deny": [
      "mcp__emdash__content_publish",
      "mcp__emdash__content_unpublish",
      "mcp__emdash__content_schedule",
      "mcp__emdash__content_delete",
      "mcp__emdash__content_permanent_delete",
    ],
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__emdash__content_(create|update)",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/emdash-guard.mjs",
          },
        ],
      },
    ],
  },
}
```

The hook rejects `content_update` when `status`, `publishedAt`, `seo`, `bylines` or `taxonomies` is present, and `content_create` when `status === "published"` or `publishedAt` is present. The hook can be unit-tested offline by piping JSON, which fits the existing `node --test` setup in `package.json`.

### Anti-Patterns to Avoid

- **Documenting `emdash login` or the OAuth consent as an agent path.** It carries full admin (D-05).
- **Using `emdash whoami` as the authentication proof.** Likely 403 for a non-admin scope set (Finding 4); use `content list`.
- **Running CLI evidence with no `EMDASH_TOKEN` on localhost.** Falls through to dev bypass and proves nothing.
- **Editing a post body through the API during evidence.** Markdown to Portable Text conversion is lossy risk; Phase 2 recorded "body not rewritten through the API". Use a short plain field.
- **Writing the token into `.mcp.json`, README examples, the evidence file or `.claude/settings.json`.** Use placeholders such as `ec_pat_REDACTED`.

## Don't Hand-Roll

| Problem                           | Don't Build                                                    | Use Instead                                                    | Why                                                                                          |
| --------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Token generation, hashing, expiry | A custom token table or script                                 | The admin API tokens page                                      | EmDash generates `ec_pat_` tokens, stores SHA-256 only, checks expiry on every request       |
| Scope enforcement                 | A proxy in front of `/_emdash/api/mcp` that filters tool names | Token scopes (server) plus Claude Code deny rules (client)     | A proxy is a second auth surface to maintain and secure, and Phase 5 would have to deploy it |
| MCP client config per environment | Separate `.mcp.json` per environment or a generator script     | `${EMDASH_MCP_URL:-...}` expansion                             | Claude Code expands env vars in `url` and `headers`                                          |
| Draft review                      | Custom diff tooling                                            | `content_compare`, `content_get` (`liveData`), `revision_list` | Built in; `content_compare` returns live and draft plus a changes flag                       |

**Key insight:** The server already implements nearly everything. The only missing piece is a publish scope, and that cannot be added without upstream change; closing it with extra server code would add more risk than it removes.

## Runtime State Inventory

Not a rename, refactor or migration phase. Omitted. One state item carries forward: PATs live in `_emdash_api_tokens` with `foreign key ("user_id") references "users" ("id") on delete cascade` [VERIFIED: sqlite3 -readonly data/emdash.db `.schema _emdash_api_tokens`], so the Phase 1 recovery procedure (delete users) and the Phase 5 database move both remove the token (D-08, Phase 5 handoff).

## Common Pitfalls

### Pitfall 1: Token creation rejects D-06's scope names

**What goes wrong:** `POST /api-tokens` returns a validation error for `content:read_drafts`, `taxonomies:read` or `taxonomies:write`, or the admin form simply has no such checkbox.
**Why it happens:** Those names are RBAC permissions, not token scopes (Finding 1).
**How to avoid:** Use the six valid scopes; record the correction in the evidence file and in the CONTEXT/REQUIREMENTS amendment.
**Warning signs:** A plan task that says "select content:read_drafts".

### Pitfall 2: The "draft-only" token can still publish

**What goes wrong:** Claude (or a prompt-injected instruction in fetched content) calls `content_publish` or `content_update` with `status: "published"` and the server accepts it.
**Why it happens:** Publish rights come from the owner's admin role, not the token (Finding 2).
**How to avoid:** Decide Open Question 1; if Option A, ship deny rules plus the hook and test both. State the Bash-with-token residual risk.
**Warning signs:** An evidence row "publish refused" with a server error code. The server will not produce one.

### Pitfall 3: A "draft" edit that is actually live

**What goes wrong:** Claude sets tags or category (or SEO) on a published card and the page changes with no publish step.
**Why it happens:** `taxonomies`, `seo`, `bylines` are not in `DRAFT_ONLY_UPDATE_KEYS` (Finding 3).
**How to avoid:** Test target must be a `data` field; guard or document the live-write keys.
**Warning signs:** Response shows `liveContentChanged` not false, or the rendered page changes before publish.

### Pitfall 4: CLI commands publish on their own

**What goes wrong:** `emdash content update projects slug --data '{...}' --rev X` without `--draft` writes the revision and then publishes it.
**Why it happens:** CLI auto-publishes (Finding 4).
**How to avoid:** Every README CLI example uses `--draft`; prefer MCP for writes; consider leaving CLI writes out of the documented path and listing only read commands plus `--draft` writes.

### Pitfall 5: CLI evidence run as the dev admin

**What goes wrong:** A CLI call without `EMDASH_TOKEN` on localhost succeeds as full admin; schema calls "succeed" and break AGENT-03 evidence, or worse, appear to pass.
**How to avoid:** `export EMDASH_TOKEN` and `EMDASH_URL` first; run `emdash schema list` with the PAT and expect 403; record the command line with the token redacted.

### Pitfall 6: Stale revision token

**What goes wrong:** `content_update` fails with `CONFLICT` or a missing `_rev` validation error.
**Why it happens:** `_rev` is required on `content_update`, `content_publish`, `content_discard_draft` and must come from a fresh `content_get` [VERIFIED: server.ts:1401 `_rev: z.string({ error: REV_MISSING_ERROR })`].
**How to avoid:** Document "read, then update" in the README; the entry-edit lock also refuses writes while another editor holds the entry open in the admin (`refuseLockedEntry`) [VERIFIED: server.ts:833-844], so close the entry in the browser or pass `overrideLock` deliberately.

### Pitfall 7: OAuth prompt on a bad token

**What goes wrong:** An expired or mistyped token leads Claude Code to start an OAuth flow, and approving it grants full admin.
**How to avoid:** README warning (Finding 5); rotation steps; `claude mcp list` to see status before use.

### Pitfall 8: Environment variable not visible to Claude Code

**What goes wrong:** `${EMDASH_TOKEN}` stays literal or empty and the server returns 401.
**Why it happens:** Claude Code reads its own process environment; `.env` files are not loaded. Unset variables without a default load with a warning in `claude mcp list` and the literal text is used [CITED: code.claude.com/docs/en/mcp].
**How to avoid:** `export EMDASH_TOKEN=...` in the shell (or a shell profile or direnv) before starting `claude`; README clean-session steps use `claude mcp list` first.

### Pitfall 9: The token is readable by the agent

**What goes wrong:** `EMDASH_TOKEN` is in the environment of every Bash call Claude makes.
**How to avoid:** Accept and document; keep scopes minimal and expiry at 90 days; the token never appears in committed files. This is why Finding 2 Option A is a guard, not a guarantee.

### Pitfall 10: Per-environment drift

**What goes wrong:** CLI uses `EMDASH_URL` (origin), MCP uses `EMDASH_MCP_URL` (full path); one gets updated and the other does not.
**How to avoid:** README lists both side by side with local and Phase 5 values.

## Code Examples

### Fresh-session setup (README "Agent access" core, wording must avoid em dashes)

```bash
# 1. In the admin (Settings, API tokens) create a token with exactly these scopes:
#    content:read, content:write, media:read, media:write, menus:manage, taxonomies:manage
#    Expiry: 90 days. Copy the ec_pat_... value; it is shown once.
export EMDASH_TOKEN='ec_pat_REDACTED'
# Optional. Defaults to the local dev server when unset.
export EMDASH_MCP_URL='http://localhost:4321/_emdash/api/mcp'
claude            # approve the project-scoped "emdash" server on first run
# in the session:  /mcp   then ask: "list the projects with content_list"
```

### Rotation

```bash
# Admin: create a replacement token (same scopes, 90 days), then revoke the old one.
export EMDASH_TOKEN='ec_pat_NEW_REDACTED'   # then restart claude
```

### CLI fallback (always `--draft`, always an explicit token)

```bash
export EMDASH_URL='http://localhost:4321'            # origin only, no path
emdash content list projects --json
emdash content get projects <slug> --json            # note the _rev value
emdash content update projects <slug> --draft --rev <_rev> --data '{"time_label":"ACTIVE"}'
emdash content get projects <slug> --published --json   # live copy is unchanged
```

`--published` ("Return published data only (ignore pending draft)") and `--draft` are real flags [VERIFIED: node_modules/emdash/src/cli/commands/content.ts:111-131,183-186,238-240].

### Evidence plan (D-11), against the user-started dev server

Use a throwaway entry so no real card is touched. Sequence for the planner: the agent creates `agent-access-check` as a draft with `content_create` (omit `status`); the user publishes it in the admin; the agent edits one `data` field; checks; the user publishes; checks; the user trashes and permanently deletes it in the admin. If the user prefers a real card, edit a data field, run `content_discard_draft` to revert the staged change, and prove the post-publish half with the throwaway entry instead.

| #   | Check                          | Call                                                                                                                                             | Expected                                                                                                                                                                                                                   |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Token authenticates            | `content_list projects limit 1` via Claude Code `/mcp`; scopes verified by `sqlite3 -readonly` on `_emdash_api_tokens`                           | Items returned; stored scopes equal the six; `expires_at` about 90 days out                                                                                                                                                |
| E2  | Negative control               | `curl -X POST` the endpoint with a malformed token, and with no header                                                                           | 401, `INVALID_TOKEN` and 401 respectively                                                                                                                                                                                  |
| E3  | Edit lands as draft            | `content_get`, then `content_update` of one data field, then `content_get`, `content_compare`; `curl` the rendered page                          | Update response shows the new value; `content_get` shows `liveData` unchanged and a `draftRevisionId`; rendered HTML lacks the new value; `content_compare` reports changes                                                |
| E4  | Appears only after publish     | User publishes in the admin; `curl` the page again                                                                                               | New value present                                                                                                                                                                                                          |
| E5  | Schema refused                 | `schema_create_field` on a throwaway collection name; `schema_get_collection projects`; `settings_update`; CLI `emdash schema list`              | `INSUFFICIENT_SCOPE` (`requires schema:write` / `schema:read` / `settings:manage`); CLI 403                                                                                                                                |
| E6  | Publish refused (Option A)     | `content_publish` and `content_update` with `status: "published"` from Claude                                                                    | Refused by the Claude Code deny rule or hook, with the hook's message. Record clearly that this is client-side. Optional user-run control with `curl` showing the server itself would accept, to document the residual gap |
| E7  | Clean session (AGENT-04, D-10) | New shell with only `EMDASH_TOKEN` (and optionally `EMDASH_MCP_URL`) set, README followed verbatim, `claude mcp list` then a `content_list` call | Server listed as connected; list succeeds. User-run, recorded                                                                                                                                                              |

Evidence record format follows `02-MCP-API-PASS.md`: a header paragraph (date, server URL, who ran it, target entry, reverts) then a Check / Result table, then a "Not covered" paragraph [VERIFIED: .planning/phases/02-content-model-and-import/02-MCP-API-PASS.md].

## State of the Art

| Old Approach                                                        | Current Approach                                                                          | When Changed | Impact                                                                     |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| `content:write` was the only scope checked for menus and taxonomies | Separate `menus:manage` and `taxonomies:manage`, with `content:write` still implying both | Before 1.3.1 | List them explicitly; they cannot be withheld from a `content:write` token |
| Fixed token scope list                                              | Plugin MCP scopes `mcp:tools:<pluginId>` plus site-transfer scopes                        | In 1.3.x     | Not used here; do not grant `mcp:tools` or `transfer:*`                    |

**Deprecated/outdated:** CONTEXT.md's "Scope names found in the installed package" list mixes token scopes with RBAC permissions; treat `VALID_SCOPES` as the only source for token scopes.

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                                                         | Section                                   | Risk if Wrong                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| A1  | `emdash whoami` returns 403 for the scoped PAT (inferred from middleware fall-through, not run)                                                                                                                                                               | Finding 4                                 | Low: the plan uses `content list` as the proof either way         |
| A2  | A first-party `content:beforePublish` plugin could be registered through `astro.config.mjs` and would receive `origin.source === "mcp"`                                                                                                                       | Finding 2 Option C                        | Medium: only matters if the user picks Option C; needs a spike    |
| A3  | Setting `EMDASH_TOKEN` through Claude Code's `env` settings would also feed `.mcp.json` expansion                                                                                                                                                             | Pitfall 8 (not recommended in the README) | Low: README uses the shell environment, which is documented       |
| A4  | The scoped PAT will be accepted by `GET /_emdash/api/content/...` REST paths used by the CLI for `content list`, `taxonomy`, `menu`, `media` (middleware rules map them to `content:read`, `taxonomies`/`menus` GET to `content:read`, media to `media:read`) | Finding 4                                 | Low: confirmed by reading `SCOPE_RULES`, not run                  |
| A5  | The rendered page reflects live columns and live term links only (Phase 3 read path), so a staged draft revision does not change it                                                                                                                           | Architecture diagram                      | Medium: E3 checks it live; if wrong, stop per D-02                |
| A6  | No registry-published EmDash documentation contradicts the source reading (the docs site was not reachable: the guessed URL returned 404 and web search found nothing)                                                                                        | Sources                                   | Low: the installed 1.3.1 source is the authority for this project |

## Open Questions

1. **How is "the agent cannot publish" enforced, given EmDash has no publish scope?** (BLOCKING for planning)
   - What we know: D-01 and D-06 assume a scope that does not exist; any admin-owned `content:write` token can publish, delete and permanently delete; no non-admin role can edit the existing unowned cards without also holding publish rights (Finding 2).
   - What's unclear: whether the user accepts a client-side guard (Option A), wants to try a server plugin (Option C), or wants to fall back to ROADMAP's original "drafts by default, publishes on request" wording (Option B).
   - Recommendation: Option A, documented as harness enforcement with the Bash-and-token residual risk. The planner should open with a `checkpoint:decision` task and amend D-01, D-06 and D-03 in CONTEXT/REQUIREMENTS once answered.

2. **Do taxonomy and SEO edits on published cards need to be blocked?** (D-02 says to bring this back)
   - What we know: `data` edits stage as drafts; `taxonomies`, `seo`, `bylines`, `status`, `publishedAt` are live (Finding 3).
   - What's unclear: whether the user wants Claude to be able to retag live cards.
   - Recommendation: block them in the hook and make tag and category changes an admin task; allow `taxonomies` on `content_create` only if the user wants Claude to tag brand-new drafts.

3. **Add `schema:read` to the token?**
   - What we know: without it Claude cannot call `schema_get_collection`; it can still see field names in `content_get` output and `emdash-env.d.ts`. `schema:read` is read-only, but D-06 lists `schema:*` as absent and ROADMAP says "no schema scope".
   - Recommendation: leave it off, per the locked decision; mention the option in the README only if field discovery proves painful.

4. **Keep the `${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}` default?**
   - Recommendation: yes. It keeps a clean local session at one variable and does not change the Phase 5 mechanism.

5. **Throwaway entry or a real card for E3/E4?**
   - Recommendation: throwaway `agent-access-check`, created as a draft by the agent, published and finally deleted by the user. It is the only way to cover both the "draft stays hidden" and "appears after publish" halves without touching real copy.

## Environment Availability

| Dependency                            | Required By                           | Available                                                                                       | Version                                          | Fallback                                                  |
| ------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| Node                                  | `npm test`, hook script, emdash CLI   | yes                                                                                             | v24.17.0 [VERIFIED: `node --version`]            | (floor is >=22.22.2 in package.json)                      |
| `emdash` CLI                          | Fallback path                         | yes                                                                                             | node_modules/.bin/emdash and `em` present, 1.3.1 | `npx emdash`                                              |
| Claude Code                           | MCP client, E7                        | yes                                                                                             | 2.1.308                                          | none needed                                               |
| sqlite3                               | Read-only evidence checks             | yes                                                                                             | 3.54.0                                           | Admin token list screen                                   |
| curl                                  | Rendered-page checks, E2              | yes (standard macOS tool; not re-probed because a combined probe command was permission-denied) | —                                                | Browser                                                   |
| EmDash dev server on `localhost:4321` | All live evidence                     | not probed; user starts it (project rule: never start `astro dev` autonomously)                 | —                                                | Evidence tasks are `checkpoint:human-action` for the user |
| Admin passkey login on localhost      | Creating the PAT, publishing, cleanup | user-side; local DB has one user `dev@emdash.local`, role 50 [VERIFIED: sqlite3]                | —                                                | none; user-run                                            |

**Missing dependencies with no fallback:** none, but every live step needs the user to start the dev server and sign in to the admin.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------- |
| Framework          | Node built-in `node:test` on Node 24.17.0                                               |
| Config file        | none; script in `package.json`: `node --test "scripts/*.test.mjs" "src/lib/*.test.mjs"` |
| Quick run command  | `node --test scripts/emdash-guard.test.mjs` (Option A only)                             |
| Full suite command | `npm test`                                                                              |

### Phase Requirements to Test Map

| Req ID           | Behavior                                                    | Test Type                                     | Automated Command                                                                                                                        | File Exists?       |
| ---------------- | ----------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| AGENT-01         | PAT with the six scopes authenticates against MCP           | live manual (D-11 forbids a committed script) | E1 plus `sqlite3 -readonly data/emdash.db "select scopes,expires_at from _emdash_api_tokens"`                                            | evidence file only |
| AGENT-02         | Data edit lands as draft, live page unchanged until publish | live manual                                   | E3, E4 (`curl` the page before and after)                                                                                                | evidence file only |
| AGENT-02 (guard) | Hook blocks publish-class and live-write arguments          | unit (Option A)                               | `node --test scripts/emdash-guard.test.mjs`                                                                                              | Wave 0             |
| AGENT-03         | Schema and settings calls refused for the PAT               | live manual                                   | E5                                                                                                                                       | evidence file only |
| AGENT-04         | `.mcp.json` is valid, secret-free, uses env expansion       | static                                        | `node -e "JSON.parse(require('fs').readFileSync('.mcp.json','utf8'))"` and `git grep -n "ec_pat_" -- . ':!node_modules'` returns nothing | Wave 0             |
| AGENT-04         | Clean-session connection works                              | live manual (user)                            | E7                                                                                                                                       | evidence file only |

### Sampling Rate

- **Per task commit:** `npm test` (hook tests, if Option A) and the two static checks above.
- **Per wave merge:** `npm test` and `npm run check:public-js` (CI runs it; confirms no public JS regression, not affected by this phase).
- **Phase gate:** Evidence file complete with E1 to E7 recorded, `npm test` green, REQUIREMENTS.md amended.

### Wave 0 Gaps

- [ ] `scripts/emdash-guard.test.mjs` and `.claude/hooks/emdash-guard.mjs` (Option A only)
- [ ] No framework install needed; `node:test` already runs in CI

## Security Domain

### Applicable ASVS Categories

| ASVS Category               | Applies | Standard Control                                                                                    |
| --------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| V2 Authentication           | yes     | EmDash PAT (`ec_pat_`, 256-bit random, SHA-256 stored, expiry checked per request); never hand-roll |
| V3 Session Management       | no      | Bearer tokens, no session on the MCP endpoint                                                       |
| V4 Access Control           | yes     | Token scopes intersected with owner role; fail-closed `admin` default for unmatched REST paths      |
| V5 Input Validation         | yes     | EmDash zod schemas on tool and REST inputs (e.g. date and stats validation seen in Phase 2)         |
| V6 Cryptography             | yes     | EmDash token generation via Oslo.js; never hand-roll                                                |
| V14 Configuration / secrets | yes     | Token only in the shell environment; `.mcp.json` carries references; `.env` is gitignored           |

### Known Threat Patterns for this stack

| Pattern                                                                 | STRIDE                     | Standard Mitigation                                                                       |
| ----------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| Token committed or pasted into docs/evidence                            | Information Disclosure     | `${EMDASH_TOKEN}` reference only; redact as `ec_pat_REDACTED`; `git grep ec_pat_` check   |
| Over-scoped token (admin, `settings:manage`, `mcp:tools`, `transfer:*`) | Elevation of Privilege     | Exactly six scopes; verify stored scopes in the database after creation                   |
| Prompt-injected agent publishes, deletes or retags live content         | Tampering                  | Option A guard (deny rules plus hook); 90-day expiry; admin reviews drafts before publish |
| OAuth consent accepted from a failed-token prompt                       | Elevation of Privilege     | README warning; PAT-only policy (D-05)                                                    |
| CLI dev bypass makes tests pass as full admin                           | Spoofing (false assurance) | Explicit `EMDASH_TOKEN` and `EMDASH_URL` in every CLI evidence run                        |
| Agent reads the token from its own environment                          | Information Disclosure     | Accepted and documented; short expiry; rotation steps                                     |
| Leaked token reaches a public endpoint after Phase 5                    | Elevation of Privilege     | Recreate the token after the database move (D-08); do not reuse the local one             |

## Sources

### Primary (HIGH confidence)

- Installed source, EmDash 1.3.1: `node_modules/@emdash-cms/auth/src/tokens.ts` (lines 46-117), `src/rbac.ts`; `node_modules/emdash/src/mcp/server.ts`, `src/emdash-runtime.ts`, `src/astro/middleware/auth.ts`, `src/astro/routes/api/mcp.ts`, `src/astro/routes/api/admin/api-tokens/index.ts`, `src/api/handlers/api-tokens.ts`, `src/cli/client-factory.ts`, `src/cli/commands/content.ts`, `src/cli/commands/login.ts`, `src/plugins/types.ts`; shipped dist checked for `VALID_SCOPES` and `DRAFT_ONLY_UPDATE_KEYS`
- `node_modules/@emdash-cms/admin/dist/index.js` (token page, scope list, expiry options, route)
- Local database `data/emdash.db` (read-only): users, `_emdash_api_tokens` schema, collection `supports`, entry `author_id`
- `npm view emdash` (1.3.1 latest)
- Project files: CONTEXT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, `02-MCP-API-PASS.md`, `.emdash/seed.json`, `src/lib/projects.ts`, `package.json`, `.github/workflows/*`

### Secondary (MEDIUM confidence)

- code.claude.com/docs/en/mcp (`.mcp.json` format, env expansion, project-scope approval, status commands)
- code.claude.com/docs/en/permissions (MCP deny rule syntax, parentheses skipped for `mcp__` rules, deny precedence, Bash argument patterns fragile)
- code.claude.com/docs/en/hooks (`PreToolUse` input, MCP matcher, exit code 2 blocking)

### Tertiary (LOW confidence)

- None. The EmDash documentation site could not be reached (guessed URL returned 404, searches returned nothing relevant), so no claim here rests on it.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH, nothing new is installed and versions were read from disk and the registry
- Architecture and Findings 1 to 6: HIGH, read from source files opened this session; not yet exercised live (E1 to E7 do that)
- Claude Code guard options: MEDIUM, from official docs, not run in this session
- Pitfalls: HIGH for the EmDash behaviors, MEDIUM for Claude Code behaviors

**Research date:** 2026-10-26
**Valid until:** 2026-11-25 (EmDash 1.3.x is stable but modified 2026-10-18; re-check `VALID_SCOPES` and `DRAFT_ONLY_UPDATE_KEYS` if emdash is bumped)
