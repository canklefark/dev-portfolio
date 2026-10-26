---
phase: "05"
slug: dokploy-deploy-and-cutover
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-26"
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Framework**          | Node built-in test runner (`node --test`), existing                                    |
| **Config file**        | none; `package.json` script `test` globs `scripts/*.test.mjs` and `src/lib/*.test.mjs` |
| **Quick run command**  | `npm test`                                                                             |
| **Full suite command** | `npm test && npm run check:public-js`                                                  |
| **Estimated runtime**  | ~30 seconds                                                                            |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run check:public-js`
- **Before `/gsd-verify-work`:** Full suite must be green and `05-EVIDENCE.md` complete
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement          | Threat Ref | Secure Behavior                                             | Test Type | Automated Command                                                                                                                                 | File Exists         | Status     |
| -------- | ---- | ---- | -------------------- | ---------- | ----------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------- |
| 05-01-01 | 01   | 1    | GUARD-02             | —          | CI fails on a pending migration                             | CI step   | `npx emdash seed .emdash/seed.json --database <tmp>/m.db --uploads-dir <tmp>/u && npx emdash migrate --check --from-config --database <tmp>/m.db` | ❌ W0               | ⬜ pending |
| 05-01-02 | 01   | 1    | GUARD-03             | —          | Smoke check reports a reason on 500 or missing project link | unit      | `node --test scripts/smoke-test.test.mjs`                                                                                                         | ❌ W0               | ⬜ pending |
| 05-02-01 | 02   | 2    | DEPLOY-01, DEPLOY-03 | —          | Preview serves and matches baseline                         | script    | `node scripts/smoke-test.mjs https://<preview-host>`, then script-inventory `parity`                                                              | ✅ existing tooling | ⬜ pending |
| 05-03-01 | 03   | 3    | DEPLOY-05            | —          | Restored volume matches production                          | script    | script-inventory `fetch` both, then `compare`                                                                                                     | ✅ existing tooling | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `scripts/smoke-test.mjs` and `scripts/smoke-test.test.mjs` — GUARD-03
- [ ] `.github/workflows/deploy.yml` — DEPLOY-02, GUARD-03
- [ ] Verify Dokploy API shapes in Swagger; record host arch, RAM, Git access
- [ ] `05-EVIDENCE.md` skeleton (preview parity, Host-header check, cutover log, restore, recovery)

---

## Manual-Only Verifications

| Behavior                                                                  | Requirement        | Why Manual            | Test Instructions                                      |
| ------------------------------------------------------------------------- | ------------------ | --------------------- | ------------------------------------------------------ |
| Production domain serves Dokploy app, Pages kept for rollback             | DEPLOY-04          | DNS and Dokploy panel | Smoke script plus runbook evidence in `05-EVIDENCE.md` |
| Admin shows login not setup wizard; two passkeys sign in; recovery tested | ADMIN-02, ADMIN-03 | Real devices          | Human-verify checkpoints, record in `05-EVIDENCE.md`   |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
