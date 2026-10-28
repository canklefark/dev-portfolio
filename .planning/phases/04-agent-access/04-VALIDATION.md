---
phase: "04"
slug: "agent-access"
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-26"
updated: "2026-10-28"
---

# Phase 4 — Validation Strategy

> Per-phase validation contract. On 2026-10-27 the owner superseded the original design (scoped token, `.claude/hooks/emdash-guard.mjs`, README token section). Agent access is now OAuth via the committed `.mcp.json` with the owner's admin rights, and draft-first is a convention only. This file reflects that reality.

---

## Test Infrastructure

| Property               | Value                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Framework**          | Node built-in `node:test`                                                     |
| **Config file**        | none; `npm test` runs `node --test "scripts/*.test.mjs" "src/lib/*.test.mjs"` |
| **Quick run command**  | `node --test scripts/mcp-config.test.mjs`                                     |
| **Full suite command** | `npm test`                                                                    |
| **Estimated runtime**  | ~10 seconds                                                                   |

---

## Sampling Rate

- **After every task commit:** `node --test scripts/mcp-config.test.mjs`
- **After every plan wave:** `npm test` and `npm run check:public-js`
- **Before `/gsd-verify-work`:** Full suite green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan           | Wave | Requirement      | Threat Ref | Secure Behavior                                                                                                                                                                                                                              | Test Type | Automated Command                         | File Exists | Status                                                                                                          |
| -------- | -------------- | ---- | ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| 04-xx-xx | 04-01 to 04-03 | n/a  | AGENT-02 (guard) | n/a        | Hook blocking publish-class and live-write arguments                                                                                                                                                                                         | unit      | `scripts/emdash-guard.test.mjs` (removed) | n/a         | SUPERSEDED 2026-10-27: owner removed the guard and scoped token; draft-first is convention, enforced by nothing |
| 04-xx-xx | 04-01 to 04-03 | n/a  | AGENT-04         | n/a        | `.mcp.json` valid, single `emdash` https server ending `/_emdash/api/mcp`, no env/headers/command/token fields; no `ec_pat_` in tracked files; no `.claude/hooks` dir and no `emdash-guard` reference in package.json, CI, README, CLAUDE.md | static    | `node --test scripts/mcp-config.test.mjs` | yes         | green (6/6)                                                                                                     |

_Status: pending · green · red · flaky · SUPERSEDED_

---

## Wave 0 Requirements

- [x] `scripts/mcp-config.test.mjs` (replaces the planned `scripts/emdash-guard.test.mjs` and `.claude/hooks/emdash-guard.mjs`, both superseded 2026-10-27)

_No framework install needed._

---

## Manual-Only Verifications

Historical owner and live evidence, recorded in `04-AGENT-ACCESS-PASS.md` (E1 to E7). It was gathered against the original scoped-token design and is not re-runnable from the repo.

| Behavior                                               | Requirement | Why Manual                                             | Test Instructions                            |
| ------------------------------------------------------ | ----------- | ------------------------------------------------------ | -------------------------------------------- |
| Agent authenticates against MCP                        | AGENT-01    | Live calls, no committed script                        | Evidence E1 in `04-AGENT-ACCESS-PASS.md`     |
| Data edit lands as draft, page unchanged until publish | AGENT-02    | Live server, owner-run; draft-first is convention only | Evidence E3, E4 (curl page before and after) |
| Schema and settings calls refused                      | AGENT-03    | Live server; applied to the superseded scoped token    | Evidence E5                                  |
| Clean-session connection                               | AGENT-04    | Needs the owner's fresh session                        | Evidence E7                                  |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-28
