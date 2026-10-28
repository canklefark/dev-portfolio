# Phase 4: Agent Access - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-26
**Phase:** 4-Agent Access
**Areas discussed:** Publish authority, MCP vs CLI path, Token lifecycle, Setup docs and environments, Verification method

---

## Publish authority

| Option | Description | Selected |
|--------|-------------|----------|
| Write-only token, publish elsewhere | content:write, no publish scope; user publishes in admin or with elevated token | ✓ |
| Token includes publish | One token writes and publishes | |
| Two tokens | Standing draft token plus publish token enabled on demand | |

**User's choice:** Write-only token, publish elsewhere
**Notes:** Edits to published entries must become pending drafts (selected over direct edit and "you decide"). Creates a wording tension with AGENT-02 ("updates and publishes"), recorded as D-03.

---

## MCP vs CLI path

| Option | Description | Selected |
|--------|-------------|----------|
| MCP primary, CLI fallback | Bearer PAT over MCP; CLI documented as fallback | ✓ |
| MCP only | | |
| CLI primary | | |

**User's choice:** MCP primary, CLI fallback
**Notes:** PAT only for Claude (selected over documenting OAuth too, since OAuth carries full admin rights).

---

## Token lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| content:read_drafts | Read own drafts | ✓ |
| media:read + media:write | Upload and reuse images | ✓ |
| menus:manage | Edit nav | ✓ |
| taxonomies:read + taxonomies:write | Add tag and category terms | ✓ |

**User's choice:** All four scope groups, in addition to content read/write
**Notes:** Storage: env var with 90-day expiry (selected over no expiry and macOS keychain).

---

## Setup docs and environments

| Option | Description | Selected |
|--------|-------------|----------|
| README section + committed .mcp.json | Env-var-referenced endpoint and token | ✓ |
| docs/agent-access.md + .mcp.json | | |
| CLAUDE.md only | | |

**User's choice:** README section + committed .mcp.json
**Notes:** Clean-session proof: fresh claude session following the docs verbatim (selected over user-only run).

---

## Verification method

| Option | Description | Selected |
|--------|-------------|----------|
| Live MCP calls, recorded | Evidence file like 02-MCP-API-PASS.md | ✓ |
| Committed script | Repeatable assertions | |

**User's choice:** Live MCP calls, recorded

---

## Claude's Discretion

Evidence file naming and layout, test target entry, README wording, and how the PAT is created (admin UI or CLI) within the chosen scopes.

## Deferred Ideas

- Audit logging of agent writes
- Tighter limits on menus and media
- A Claude-driven publish workflow via an elevated short-lived token
