---
phase: "02"
slug: content-model-and-import
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-26"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| **Framework**          | `node:test` (built in), no install                                                                       |
| **Config file**        | none                                                                                                     |
| **Quick run command**  | `node --test scripts/seed-shape.test.mjs`                                                                |
| **Full suite command** | `npm test && npx emdash seed .emdash/seed.json --validate && npx astro check && npm run check:public-js` |
| **Estimated runtime**  | ~60 seconds                                                                                              |

Note: `scripts/import-content.mjs`, `scripts/verify-import.mjs`, `scripts/lib/*` and the markdown sources were deleted in Phase 3 (REND-05, plan 03-01). The seed is now the source of truth, so checks read `.emdash/seed.json` directly.

---

## Sampling Rate

- **After every task commit:** Run `node --test scripts/seed-shape.test.mjs`
- **After every plan wave:** `npm test` and `npx emdash seed .emdash/seed.json --validate`
- **Before `/gsd-verify-work`:** Full suite green, plus the human admin checkpoint recorded (done in 02-03, see its SUMMARY)
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Req ID                  | Behavior                                                                    | Test Type    | Automated Command                                                                                                                      | File Exists | Status                                                        |
| ----------------------- | --------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------- |
| SCHEMA-01               | Four collections, field slugs non-reserved, seed valid                      | unit + smoke | `node --test scripts/seed-shape.test.mjs`; `npx emdash seed .emdash/seed.json --validate`                                              | yes         | green                                                         |
| SCHEMA-02               | status, variant, time label fields; stats repeater; variants within options | unit         | `node --test scripts/seed-shape.test.mjs`                                                                                              | yes         | green                                                         |
| SCHEMA-02 / criterion 1 | Admin edits and long body save                                              | manual-only  | human checkpoint (no dev server rule), recorded in 02-03 SUMMARY; not re-verified by this audit                                        | n/a         | manual                                                        |
| SCHEMA-03               | About holds role, flag, cells, stack, contacts, body                        | unit         | `node --test scripts/seed-shape.test.mjs`; `npm run check:public-js` (renders /about)                                                  | yes         | green                                                         |
| SCHEMA-04               | Menu has Home, Projects, About; settings keys present                       | unit         | `node --test scripts/seed-shape.test.mjs`                                                                                              | yes         | green                                                         |
| SCHEMA-04 / criterion 2 | Nav and settings editable in admin                                          | manual-only  | human checkpoint, recorded in 02-03 SUMMARY; not re-verified by this audit                                                             | n/a         | manual                                                        |
| SCHEMA-05               | Committed types exist and typecheck                                         | smoke        | `node --test scripts/seed-shape.test.mjs` (emdash-env.d.ts exists); `npx astro check`                                                  | yes         | green (only emdash-env.d.ts is committed, per 03-04 decision) |
| MIGR-01                 | 13 projects, unique slugs, 1 about, valid statuses                          | unit         | `node --test scripts/seed-shape.test.mjs`                                                                                              | yes         | green                                                         |
| MIGR-01                 | Draft fixture stays draft                                                   | unit         | `scripts/import-content.test.mjs` deleted; seed has no drafts, test asserts status is published or draft                               | n/a         | superseded by Phase 3 REND-05                                 |
| MIGR-02                 | About copy identical to source                                              | integration  | `scripts/verify-import.mjs` and markdown sources deleted                                                                               | n/a         | superseded by Phase 3 REND-05 (one-time migration check)      |
| MIGR-03                 | Zero differences, verifier fails on mutated field                           | integration  | `scripts/verify-import.mjs` deleted                                                                                                    | n/a         | superseded by Phase 3 REND-05 (one-time migration check)      |
| MIGR-04                 | Seed rebuilds content in a fresh DB                                         | integration  | CI step `npx emdash seed .emdash/seed.json --database ...`; `npm run check:public-js` (throwaway DB, 17/17 PASS, owner run 2026-10-28) | yes         | green                                                         |

_Status: green · manual · superseded_

---

## Wave 0 Requirements

- [x] `scripts/seed-shape.test.mjs` created in the Phase 2 audit; replaces the deleted `scripts/import-content.test.mjs`
- [x] `scripts/fixtures/`, `scripts/lib/schema.mjs`, `scripts/lib/sources.mjs`, devDependency `yaml`: obsolete, removed with the importer in Phase 3 (REND-05)

---

## Manual-Only Verifications

| Behavior                                                                                      | Requirement | Why Manual                                                                    | Test Instructions                                                                              |
| --------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Admin edits status, variant, time label, date, tags, stats rows; longest body edits and saves | SCHEMA-02   | Needs a running admin and a browser; dev servers are not started autonomously | Start the admin yourself, edit each field on the long-body test entry, save, confirm no errors |
| Nav menu and General, Social, SEO settings editable                                           | SCHEMA-04   | Same                                                                          | Open the admin menu and settings screens, change a value, save                                 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-10-28
