---
phase: "02"
slug: content-model-and-import
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-26"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Framework**          | `node:test` (built in), no install                                                                      |
| **Config file**        | none, Wave 0 creates the test files                                                                     |
| **Quick run command**  | `node --test scripts/import-content.test.mjs` (a bare directory argument fails on Node 24)              |
| **Full suite command** | `node scripts/import-content.mjs && node scripts/verify-import.mjs && npx astro check && npm run build` |
| **Estimated runtime**  | ~60 seconds                                                                                             |

---

## Sampling Rate

- **After every task commit:** Run `node --test scripts/import-content.test.mjs`
- **After every plan wave:** Import twice, then `node scripts/verify-import.mjs`
- **Before `/gsd-verify-work`:** Full suite must be green, plus the human admin checkpoint recorded
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Req ID                  | Behavior                                                | Test Type          | Automated Command                                                                                      | File Exists |
| ----------------------- | ------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ | ----------- |
| SCHEMA-01               | Field slugs non-reserved, seed validates                | unit + smoke       | `node --test scripts/import-content.test.mjs`; `emdash seed <seed> --validate`                         | ❌ W0       |
| SCHEMA-02               | Tags subset of options, stats variants valid            | unit               | `node --test scripts/import-content.test.mjs`                                                          | ❌ W0       |
| SCHEMA-02 / criterion 1 | Admin edits and long body save                          | manual-only        | human checkpoint (no dev server rule)                                                                  | n/a         |
| SCHEMA-03               | About holds role, flag, cells, stack, contacts, body    | integration        | `node scripts/verify-import.mjs`                                                                       | ❌ W0       |
| SCHEMA-04               | Menu has 3 items, settings keys present                 | integration        | `node scripts/verify-import.mjs`                                                                       | ❌ W0       |
| SCHEMA-04 / criterion 2 | Nav and settings editable in admin                      | manual-only        | human checkpoint                                                                                       | n/a         |
| SCHEMA-05               | Types exist and typecheck                               | smoke              | `test -f .emdash/types.ts && test -f emdash-env.d.ts && npx astro check`                               | ❌ W0       |
| MIGR-01                 | Run twice: 13 projects, 1 about, no duplicates          | integration        | `node scripts/import-content.mjs && node scripts/import-content.mjs && node scripts/verify-import.mjs` | ❌ W0       |
| MIGR-01                 | Draft fixture stays draft                               | unit               | `node --test scripts/import-content.test.mjs`                                                          | ❌ W0       |
| MIGR-02                 | About copy identical                                    | integration        | `node scripts/verify-import.mjs`                                                                       | ❌ W0       |
| MIGR-03                 | Zero differences, and verifier fails on a mutated field | integration + unit | `node scripts/verify-import.mjs`; `node --test scripts/import-content.test.mjs`                        | ❌ W0       |
| MIGR-04                 | Exported seed rebuilds identical content in a fresh DB  | integration        | export, apply to fresh cwd, run verifier                                                               | ❌ W0       |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `scripts/import-content.test.mjs` — converter round trip over all 13 files and about.md, draft fixture, tags subset, reserved-slug check
- [ ] `scripts/fixtures/` — draft-status fixture
- [ ] `scripts/lib/schema.mjs` and `scripts/lib/sources.mjs`
- [ ] devDependency `yaml`

---

## Manual-Only Verifications

| Behavior                                                                                      | Requirement | Why Manual                                                                    | Test Instructions                                                                              |
| --------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Admin edits status, variant, time label, date, tags, stats rows; longest body edits and saves | SCHEMA-02   | Needs a running admin and a browser; dev servers are not started autonomously | Start the admin yourself, edit each field on the long-body test entry, save, confirm no errors |
| Nav menu and General, Social, SEO settings editable                                           | SCHEMA-04   | Same                                                                          | Open the admin menu and settings screens, change a value, save                                 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
