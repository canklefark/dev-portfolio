---
phase: "06"
slug: live-editing-and-docs
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-28"
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in test runner (`node --test`) |
| **Config file** | none; `package.json` `test` script globs `scripts/*.test.mjs` and `src/lib/*.test.mjs` |
| **Quick run command** | `npm test` (95 tests pass); phase docs only: `node --test scripts/docs.test.mjs` |
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
| 06-xx | TBD | TBD | ADMIN-04 | n/a | Publish updates the public page with no rebuild; restore plus publish returns the original | manual, owner-attested | `node scripts/smoke-test.mjs https://dev.zeikcookson.com` plus before/after `shasum` of the page, recorded in `06-EVIDENCE.md` rows E1 to E9 | yes (06-EVIDENCE.md) | manual-only (owner-attested, pending confirmation of E2 to E8) |
| 06-xx | TBD | TBD | ADMIN-05 | n/a | Preview link shows the draft signed-out; public URL shows published | manual, owner-attested | `curl -sI '<preview url>'` expects `cache-control: private, no-store`, recorded in `06-EVIDENCE.md` | yes (06-EVIDENCE.md) | manual-only (owner-attested, pending confirmation of E2 to E8) |
| 06-xx | TBD | TBD | DOCS-01 | n/a | CLAUDE.md names admin-only JS, no-new-JS, no-plugins, draft-first, Node floor, CI-only push | unit (file reads) | `node --test scripts/docs.test.mjs` | yes (`scripts/docs.test.mjs`) | green |
| 06-xx | TBD | TBD | DOCS-02 | n/a | README replaced, required headings and smoke-test command present, no em dash | unit (file reads) | `node --test scripts/docs.test.mjs` | yes (`scripts/docs.test.mjs`) | green |
| 06-xx | TBD | TBD | DOCS-03 | n/a | Removed files gone; `git grep` sweep over tracked files exits 1 (one recorded exception, `scripts/read-path.test.mjs`, which names the paths only to assert they are absent) | unit (fs plus git grep) | `node --test scripts/docs.test.mjs` | yes (`scripts/docs.test.mjs`) | green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `06-EVIDENCE.md` exists, in the table style of `05-EVIDENCE.md`
- [x] `scripts/docs.test.mjs` covers DOCS-01, DOCS-02, DOCS-03 and runs in `npm test`

---

## Manual-Only Verifications

**ADMIN-04 and ADMIN-05 are owner-attested, not automated and not verified by the auditor.** `06-VERIFICATION.md` stays `human_needed` until the owner confirms rows E2 to E8 of `06-EVIDENCE.md`. The smoke test also checks `/about/` and a missing route; it was not run against production during validation.

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Edit, preview, publish, restore a real project in the admin | ADMIN-04 | Admin is passkey-protected | Owner performs in the admin; executor records page hashes before and after |
| Preview link opens signed out | ADMIN-05 | Needs a private window | Open the Preview tab URL in a private window; confirm the public URL still shows the published text |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** automated rows validated; ADMIN-04 and ADMIN-05 remain owner-attested (manual-only)
