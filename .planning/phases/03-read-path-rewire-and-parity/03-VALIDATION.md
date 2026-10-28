---
phase: "03"
slug: read-path-rewire-and-parity
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-26"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Framework**          | `node:test` (built in), no install                                           |
| **Config file**        | none; `npm test` globs `scripts/*.test.mjs` and `src/lib/*.test.mjs` |
| **Quick run command**  | `node --test scripts/read-path.test.mjs scripts/check-public-js.test.mjs scripts/parity.test.mjs src/lib/projects.test.mjs src/lib/prose.test.mjs src/lib/site.test.mjs` |
| **Full suite command** | `npm test` (78 tests); build-level checks `npm run build && npm run check:public-js` are owner-run |
| **Estimated runtime**  | ~1 second for `npm test`                                                                 |

---

## Sampling Rate

- **After every task commit:** Run `node --test <the touched test file>` and `npx astro check`
- **After every plan wave:** Run `npm run build` plus the in-process or server parity compare
- **Before `/gsd-verify-work`:** Full suite must be green plus the recorded human checkpoints (type regeneration, light and dark visual, admin loads in a browser)
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref      | Secure Behavior                                        | Test Type          | Automated Command                                                                                          | File Exists | Status     |
| -------- | ---- | ---- | ----------- | --------------- | ------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 03-XX-XX | — | — | REND-01 | — | N/A | unit + integration | `node --test src/lib/projects.test.mjs` | ✅ | ✅ green |
| 03-XX-XX | — | — | REND-02 | T-03 draft leak | Unknown slug, id-form slug and draft return 404 | integration | `npm run check:public-js` (owner-run 17/17 PASS, 2026-10-28) | ✅ | ✅ green |
| 03-XX-XX | — | — | REND-03 | — | N/A | integration | `node --test src/lib/site.test.mjs scripts/parity.test.mjs`; parity compare owner-run | ✅ | ✅ green |
| 03-XX-XX | — | — | REND-04 | T-03 XSS | Body rendered only through PortableText, no `set:html` (asserted by `scripts/read-path.test.mjs`) | integration + unit | `node --test src/lib/prose.test.mjs scripts/read-path.test.mjs`; parity compare owner-run | ✅ | ✅ green |
| 03-XX-XX | — | — | REND-05 | — | N/A | smoke | `node --test scripts/read-path.test.mjs` | ✅ | ✅ green |
| 03-XX-XX | — | — | ADMIN-01 | T-03 JS drift | No admin JS on public routes | integration | `npm run check:public-js` (owner-run 17/17 PASS, 2026-10-28) | ✅ | ✅ green |
| 03-XX-XX | — | — | GUARD-01 | T-03 JS drift | Check fails on added script and modulepreload | unit (self-test) | `node --test scripts/check-public-js.test.mjs` | ✅ | ✅ green |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] `scripts/check-public-js.mjs` and `scripts/check-public-js.test.mjs` — GUARD-01, ADMIN-01, REND-02
- [x] `src/lib/prose.test.mjs` and a mapping test — REND-01, REND-04
- [x] Canonicalizing parity command (extend `script-inventory.mjs` or add a sibling) — REND-03, REND-04
- [x] `.github/workflows/ci.yml` — GUARD-01
- [x] `scripts/fixtures/draft-project.seed.json` (optional draft-404 fixture) — REND-02
- [x] `package.json` scripts: `check:public-js`, `test`; remove `yaml`

---

## Manual-Only Verifications

| Behavior                                     | Requirement | Why Manual                                                        | Test Instructions                                                                                  |
| -------------------------------------------- | ----------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Light and dark appearance parity             | REND-04     | No browser installed; repo rule forbids starting a server unasked | `checkpoint:human-verify`: the user starts the server and compares against `~/portfolio-baseline/` |
| Admin loads at `/_emdash/admin` in a browser | ADMIN-01    | Needs a running server and a browser                              | `checkpoint:human-verify`                                                                          |
| CI workflow first run                        | GUARD-01    | Needs a push, which needs the user's go-ahead                     | Push to the branch after approval and watch the run (not yet run; 03-03-SUMMARY lists it as manual)                                                |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-10-28
