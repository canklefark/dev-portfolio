---
phase: "03"
slug: read-path-rewire-and-parity
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-26"
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Framework**          | `node:test` (built in), no install                                           |
| **Config file**        | none; name files explicitly (`node --test scripts/check-public-js.test.mjs`) |
| **Quick run command**  | `node --test scripts/check-public-js.test.mjs src/lib/prose.test.mjs`        |
| **Full suite command** | `npx astro check && npm run build && npm run check:public-js`                |
| **Estimated runtime**  | ~120 seconds                                                                 |

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
| 03-XX-XX | —    | —    | REND-01     | —               | N/A                                                    | unit + integration | `node --test src/lib/projects.test.mjs`                                                                    | ❌ W0       | ⬜ pending |
| 03-XX-XX | —    | —    | REND-02     | T-03 draft leak | Unknown slug, id-form slug and draft return 404        | integration        | `npm run check:public-js`                                                                                  | ❌ W0       | ⬜ pending |
| 03-XX-XX | —    | —    | REND-03     | —               | N/A                                                    | integration        | parity compare of head section over 17 routes; meta helper unit test                                       | ❌ W0       | ⬜ pending |
| 03-XX-XX | —    | —    | REND-04     | T-03 XSS        | Body rendered only through PortableText, no `set:html` | integration + unit | parity compare vs baseline; `node --test src/lib/prose.test.mjs`                                           | ❌ W0       | ⬜ pending |
| 03-XX-XX | —    | —    | REND-05     | —               | N/A                                                    | smoke              | `test ! -e src/content && test ! -e src/data/about.ts && test ! -e src/content.config.ts && npm run build` | ✅          | ⬜ pending |
| 03-XX-XX | —    | —    | ADMIN-01    | T-03 JS drift   | No admin JS on public routes                           | integration        | `npm run check:public-js`                                                                                  | ❌ W0       | ⬜ pending |
| 03-XX-XX | —    | —    | GUARD-01    | T-03 JS drift   | Check fails on added script and modulepreload          | unit (self-test)   | `node --test scripts/check-public-js.test.mjs`                                                             | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `scripts/check-public-js.mjs` and `scripts/check-public-js.test.mjs` — GUARD-01, ADMIN-01, REND-02
- [ ] `src/lib/prose.test.mjs` and a mapping test — REND-01, REND-04
- [ ] Canonicalizing parity command (extend `script-inventory.mjs` or add a sibling) — REND-03, REND-04
- [ ] `.github/workflows/ci.yml` — GUARD-01
- [ ] `scripts/fixtures/draft-project.seed.json` (optional draft-404 fixture) — REND-02
- [ ] `package.json` scripts: `check:public-js`, `test`; remove `yaml`

---

## Manual-Only Verifications

| Behavior                                     | Requirement | Why Manual                                                        | Test Instructions                                                                                  |
| -------------------------------------------- | ----------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Light and dark appearance parity             | REND-04     | No browser installed; repo rule forbids starting a server unasked | `checkpoint:human-verify`: the user starts the server and compares against `~/portfolio-baseline/` |
| Admin loads at `/_emdash/admin` in a browser | ADMIN-01    | Needs a running server and a browser                              | `checkpoint:human-verify`                                                                          |
| CI workflow first run                        | GUARD-01    | Needs a push, which needs the user's go-ahead                     | Push to the branch after approval and watch the run                                                |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
