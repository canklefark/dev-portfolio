---
phase: "06"
slug: live-editing-and-docs
status: verified
threats_open: 0
asvs_level: 1
created: "2026-10-28"
---

# Phase 06 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Owner browser to production admin | Passkey-protected EmDash admin on dev.zeikcookson.com | Draft and published content, preview links |
| Claude Code to EmDash MCP | OAuth with the owner's admin rights; draft-first is a convention, not enforced | Draft content edits |
| Public internet to site | Anonymous GETs through the Cloudflare proxy | Published pages only |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Status | Evidence |
|-----------|----------|-----------|----------|-------------|--------|----------|
| T-06-01 | Info disclosure | Preview address or token in chat, evidence or commits | medium | mitigate | CLOSED | No `_preview`, token or bearer value in evidence or history; E3 redacted |
| T-06-02 | Info disclosure | Draft cached at the edge or browser | medium | mitigate | CLOSED | E3 records `private, no-store` and `DYNAMIC`; origin middleware sets the same |
| T-06-03 | Tampering | Agent publishes or writes live | medium | mitigate | CLOSED | Procedure allows only content_get and content_update with no status or overrideLock; E6 shows page unchanged |
| T-06-04 | Tampering | Marker text left live on a real card | medium | mitigate | CLOSED | Live page hash equals H0, markers absent, smoke test PASS |
| T-06-05 | Spoofing | Signed-in view taken for public view | low | mitigate | CLOSED | All page checks are cookie-less GETs; E3 used a private window |
| T-06-06 | Info disclosure | Secrets in README, CLAUDE.md or .mcp.json | low | mitigate | CLOSED | Zero secret-pattern matches; .mcp.json is type and url only |
| T-06-07 | Elevation of privilege | Docs claim a publish guard that does not exist | medium | mitigate | CLOSED | Both docs say draft-first is a convention and nothing enforces it |
| T-06-08 | Tampering | README steps write to the wrong DB or skip the post-deploy check | low | mitigate | CLOSED | Smoke test command with production URL in README; no seed command |
| T-06-09 | Denial of service | Deleted file still used by a script, CI or shell start | medium | mitigate | CLOSED | D-13 sweep clean; no rc file references log.sh; npm test 51 of 51 |
| T-06-10 | Tampering | Automated edit to the owner's ~/.zshrc | medium | mitigate | CLOSED (accepted deviation) | See Accepted Risks |
| T-06-11 | Tampering | Losing the only copy of the portfolio-update skill | low | mitigate | CLOSED | Moved with /usr/bin/trash (exit 0); Trash placement not directly listable on macOS |
| T-06-12 | Repudiation | Sweep reports clean while a reference remains | low | mitigate | CLOSED | Both sweep commands recorded in S11 and re-run clean |
| T-06-13 | Tampering | Edits to ai-skills or a hand edit of seed.json | low | mitigate | CLOSED | seed.json unchanged since e2ce3f7; skills flagged, not edited |
| T-06-SC | Tampering | Package installs | high | mitigate | CLOSED | No change to package.json, lockfile, Dockerfile or CI |

*Status: open · closed. Severity at or above `high` blocks.*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-06-01 | T-06-10 | The plan said Claude never writes `~/.zshrc`. The owner then asked the orchestrator to make that edit. It removed two lines (the log.sh helper comment and source line) from `~/.dotfiles/zsh/.zshrc`, the real file behind the symlink, and touched nothing else the phase could attribute. Outcome verified: no rc file references log.sh. | owner (instruction in session) | 2026-10-28 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-28 | 14 | 14 | 0 | gsd-security-auditor (T-06-10 closed as an accepted deviation) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-28
