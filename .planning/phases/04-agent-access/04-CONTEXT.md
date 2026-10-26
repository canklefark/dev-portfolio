# Phase 4: Agent Access - Context

**Gathered:** 2026-10-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Claude can manage portfolio content through EmDash's MCP server (CLI as fallback) using a scoped personal access token that writes drafts and cannot change the schema. A change Claude makes lands as a draft and reaches the rendered page only after an explicit publish by the user. A schema-changing call with the agent token is refused. The Claude Code MCP setup is documented and works from a clean session, with the endpoint URL set per environment.

Everything here is proven locally against the dev server. Hosting, the live endpoint and the passkey admin belong to Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Publish authority

- **D-01:** The agent token carries no publish scope (no `content:publish_own`, `content:publish_any` or `content:publish`). Claude can only create and edit drafts. The user publishes in the admin, or with a separate short-lived elevated token created for that moment. — **Reversibility:** reversible — scopes are set per token and a new token can be minted.
- **D-01 (amended 2026-10-26, post-research):** EmDash has no publish scope; rights are the owner's role intersected with token scopes, so token scope alone cannot withhold publish. Enforcement is client-side: Claude Code deny rules for publish-class tools (publish, unpublish, schedule, delete, permanent delete) plus a `PreToolUse` hook. Residual risk (the token sits in Claude's environment, so Bash or REST could bypass the harness) is stated plainly in the README. — **Reversibility:** reversible.
- **D-02:** Edits Claude makes to an already-published entry must become a pending draft revision, with the live page keeping the old copy until published. The researcher must verify EmDash does this for a token with `content:write` and no publish scope. If it does not (writes go live directly), stop and bring it back to the user rather than accepting direct edits, since that breaks ROADMAP criterion 2.
- **D-03:** Requirement wording tension: AGENT-02 and the phase goal say Claude "updates and publishes". With D-01 the publish step is the user's. Record this as an accepted amendment of AGENT-02 (draft by agent, publish by user) in the phase verification and update REQUIREMENTS.md wording to match.
- **D-03 (amended):** The AGENT-02 amendment stands (draft by agent, publish by user), now enforced by the client-side guard in D-01 rather than by token scope. Update REQUIREMENTS.md wording accordingly.

### Access path and auth

- **D-04:** MCP is the documented primary path: Claude Code connects to the EmDash MCP endpoint (`/_emdash/api/mcp`) with the scoped PAT as a bearer token. The `emdash` CLI (`content`, `taxonomy`, `menu`, `media`) is documented as a fallback for scripting, with the same PAT.
- **D-05:** The agent uses the PAT only. The OAuth session used in Phase 2 (`02-MCP-API-PASS.md`) carries the user's full admin rights, so OAuth is not documented as an agent option.

### Token scopes and lifecycle

- **D-06:** Scopes on the agent token: `content:read`, `content:write`, `content:read_drafts` (so Claude can read its own drafts), `media:read`, `media:write`, `menus:manage`, `taxonomies:read`, `taxonomies:write`. Explicitly absent: `schema:*`, `settings:manage`, `users:*`, any admin scope and any publish scope. This is a deliberate superset of the roadmap list: `content:read_drafts` and the taxonomy scopes are added because draft review and tag/category terms as content (Phase 2 D-05, D-09) require them. `menus:manage` lets Claude reorder or remove nav links; accepted.
- **D-06 (amended):** `content:read_drafts`, `taxonomies:read`, `taxonomies:write` are RBAC permissions, not token scopes, and token creation rejects them. Actual scope set: `content:read`, `content:write`, `media:read`, `media:write`, `menus:manage`, `taxonomies:manage`. `content:write` implies `menus:manage` and `taxonomies:manage`, so those cannot be withheld. `schema:read` is NOT added (decided: keep locked).
- **D-12 (new):** Taxonomy, SEO, byline, `status` and `publishedAt` writes on published cards go straight to the live row (no draft revision), so D-02 holds only for `data` fields. The `PreToolUse` hook blocks agent writes to those on published cards; tag/category/SEO changes are made in the admin. CLI fallback must always pass `--draft` and `EMDASH_TOKEN` must be set (otherwise localhost falls back to dev-bypass full admin); use `content list` rather than `whoami` as the auth proof.
- **D-07:** The PAT expires after 90 days and lives in an environment variable. A committed `.mcp.json` references the endpoint and token through environment variables (`${EMDASH_MCP_URL}`, `${EMDASH_TOKEN}`); no secret is committed. Rotation steps (recreate in the admin, update the variable) are documented.
- **D-08:** Tokens cascade away with their users. After the Phase 5 database move the token must be recreated; record this as a Phase 5 handoff item, not a Phase 4 task.

### Setup docs and environments

- **D-09:** The setup is documented in an "Agent access" section of `README.md`, with the committed `.mcp.json`. Phase 6 folds the workflow into `CLAUDE.md`. The endpoint URL differs per environment (`http://localhost:4321/_emdash/api/mcp` locally, `https://dev.zeikcookson.com/_emdash/api/mcp` after Phase 5) through `EMDASH_MCP_URL`.
- **D-10:** AGENT-04 proof: the user starts a fresh Claude Code session with only the documented environment variables set, following the README verbatim, and a content list call succeeds. Recorded in the evidence file.

### Verification method

- **D-11:** AGENT-01 to AGENT-03 are proven by live MCP calls against the local dev server with the scoped token, recorded in an evidence file in the phase directory in the style of `02-MCP-API-PASS.md`. Record at minimum: the token authenticates; an update to a project card lands as a draft and is absent from the rendered page until published; a schema-changing call (for example `schema_create_field`) is refused; a publish call is refused. No committed test script.

### Claude's Discretion

- Exact evidence-file name and table layout.
- Which project card and which field is the test target (use a throwaway entry or revert every change, as in Phase 2).
- How the README section is worded, within D-04 to D-10 and the project's no-em-dash copy rule.
- How the user creates the PAT (admin UI or CLI) as long as the resulting scopes match D-06.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning

- `.planning/ROADMAP.md` — Phase 4 goal and success criteria
- `.planning/REQUIREMENTS.md` — AGENT-01 to AGENT-04 (AGENT-02 wording amended per D-03)
- `.planning/PROJECT.md` — Spike Findings, including the cookie-authenticated write CSRF note (k) and "recreate any agent tokens" in the recovery drill
- `.planning/STATE.md` — workflow rules (ask before running astro dev/preview; no git push)
- `.planning/phases/02-content-model-and-import/02-MCP-API-PASS.md` — prior MCP evidence format and the OAuth session it used
- `.planning/phases/02-content-model-and-import/02-CONTEXT.md` — D-05 and D-09 (taxonomies are content, so the agent can add terms)
- `.planning/phases/03-read-path-rewire-and-parity/03-CONTEXT.md` — draft handling on the read path (drafts return 404)

### Code and tooling

- `astro.config.mjs` — emdash integration, `/_emdash/api/mcp` endpoint host
- `node_modules/emdash/dist/cli/index.mjs` — `emdash` CLI (`login`, `whoami`, `content`, `schema`, `taxonomy`, `menu`, `media`)
- `README.md` — gets the "Agent access" section
- `CLAUDE.md` — Phase 6 updates it; do not rewrite it here

No external specs beyond the above; the researcher should confirm scope names and PAT creation against EmDash 1.3.x docs and source.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `02-MCP-API-PASS.md`: template for the evidence record and the list of MCP tool names already exercised (`schema_get_collection`, `menu_get`, `settings_get`, content update calls).
- `emdash` CLI already installed with `content`, `taxonomy`, `menu`, `media` and `whoami` commands for the fallback path.
- Scope names found in the installed package: `content:read`, `content:write`, `content:read_drafts`, `content:publish_own`, `content:publish_any`, `schema:read`, `schema:write`, `schema:manage`, `media:read`, `media:write`, `menus:manage`, `taxonomies:read`, `taxonomies:write`, `taxonomies:manage`, `settings:read`, `settings:manage`, `users:read`, `users:manage`.

### Established Patterns

- The read path excludes drafts and returns a real 404 for draft slugs (Phase 3), so "appears only after publish" can be checked by fetching the rendered page.
- Cookie-authenticated writes require the `X-EmDash-Request` header (CSRF); bearer-token calls are a different path to verify.
- No `.mcp.json` exists in the repo yet.

### Integration Points

- Dev server at `http://localhost:4321/_emdash/api/mcp` (user starts it; never start it autonomously).
- Phase 5 moves the endpoint to dev.zeikcookson.com and recreates the token; the env-var-based config means no file change.

</code_context>

<specifics>
## Specific Ideas

The user wants the guarantee enforced by token scope, not by convention: a token that cannot publish or touch the schema, so draft-first holds even if Claude is told to do otherwise.

</specifics>

<deferred>
## Deferred Ideas

- Audit logging or review of agent writes: raised as an option, not selected; revisit if agent use grows.
- Restricting what Claude may do with menus and media beyond the chosen scopes: accepted as is for now.
- Publishing through Claude via an elevated short-lived token: possible per D-01 but no workflow is built in this phase.

</deferred>

---

*Phase: 4-Agent Access*
*Context gathered: 2026-10-26*
