---
phase: "06"
slug: live-editing-and-docs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-28"
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in test runner (`node --test`) |
| **Config file** | none; `package.json` `test` script |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test && npm run check:public-js` (builds against a temp database, never touches `data/`) |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test` for any commit that deletes `scripts/log.sh`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** `npm test`, the D-13 sweep, the DOCS greps, and the evidence rows all filled
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-xx | TBD | TBD | ADMIN-04 | — | Publish updates the public page with no rebuild; restore plus publish returns the original | manual + curl | `node scripts/smoke-test.mjs https://dev.zeikcookson.com` plus before/after `shasum` of the page | ❌ W0 (06-EVIDENCE.md) | ⬜ pending |
| 06-xx | TBD | TBD | ADMIN-05 | — | Preview link shows the draft signed-out; public URL shows published | manual + curl | `curl -sI '<preview url>'` expects `cache-control: private, no-store` | ❌ W0 (06-EVIDENCE.md) | ⬜ pending |
| 06-xx | TBD | TBD | DOCS-01 | — | CLAUDE.md names admin-only JS, no-new-JS, no-plugins, draft-first | grep | `grep -n -i "plugin" CLAUDE.md && grep -n -i "draft" CLAUDE.md` | ✅ | ⬜ pending |
| 06-xx | TBD | TBD | DOCS-02 | — | README replaced, deploy and rollback steps present, no em dash | grep | `! grep -q "Astro Starter" README.md && ! grep -q "—" README.md && grep -q "scripts/smoke-test.mjs https://dev.zeikcookson.com" README.md` | ✅ | ⬜ pending |
| 06-xx | TBD | TBD | DOCS-03 | — | Removed files gone; sweep clean or exceptions recorded | shell | `test ! -e scripts/log.sh && test ! -e docs/friend-portfolio-intake.md` plus the sweep | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `06-EVIDENCE.md` — created by the plan, in the table style of `05-EVIDENCE.md`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Edit, preview, publish, restore a real project in the admin | ADMIN-04 | Admin is passkey-protected | Owner performs in the admin; executor records page hashes before and after |
| Preview link opens signed out | ADMIN-05 | Needs a private window | Open the Preview tab URL in a private window; confirm the public URL still shows the published text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
