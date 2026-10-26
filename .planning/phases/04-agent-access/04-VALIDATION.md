---
phase: "04"
slug: "agent-access"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-26"
---

# Phase 4 — Validation Strategy

> Per-phase validation contract. Source of truth: the Validation Architecture section of `04-RESEARCH.md`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in `node:test` |
| **Config file** | none; `npm test` runs `node --test "scripts/*.test.mjs" "src/lib/*.test.mjs"` |
| **Quick run command** | `node --test scripts/emdash-guard.test.mjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** `node --test scripts/emdash-guard.test.mjs` plus the static `.mcp.json` checks
- **After every plan wave:** `npm test` and `npm run check:public-js`
- **Before `/gsd-verify-work`:** Full suite green, evidence file complete (E1 to E7)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-xx-xx | TBD | TBD | AGENT-02 (guard) | — | Hook blocks publish-class and live-write arguments | unit | `node --test scripts/emdash-guard.test.mjs` | ❌ W0 | ⬜ pending |
| 04-xx-xx | TBD | TBD | AGENT-04 | — | `.mcp.json` valid, secret-free, env expansion | static | `node -e "JSON.parse(require('fs').readFileSync('.mcp.json','utf8'))"` and `git grep -n "ec_pat_" -- . ':!node_modules'` returns nothing | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/emdash-guard.test.mjs` and `.claude/hooks/emdash-guard.mjs`

*No framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PAT authenticates against MCP | AGENT-01 | D-11: live calls, no committed script | Evidence E1 in the evidence file |
| Data edit lands as draft, page unchanged until publish | AGENT-02 | Live dev server | Evidence E3, E4 (curl page before and after) |
| Schema and settings calls refused | AGENT-03 | Live dev server | Evidence E5 |
| Clean-session connection | AGENT-04 | Needs user's fresh session | Evidence E7 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
