---
phase: 02-content-model-and-import
verified: 2026-10-26T15:30:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - .emdash/seed.json
  - .emdash/types.ts
  - .planning/phases/02-content-model-and-import/02-01-PLAN.md
  - .planning/phases/02-content-model-and-import/02-01-SUMMARY.md
  - .planning/phases/02-content-model-and-import/02-02-PLAN.md
  - .planning/phases/02-content-model-and-import/02-02-SUMMARY.md
  - .planning/phases/02-content-model-and-import/02-03-PLAN.md
  - .planning/phases/02-content-model-and-import/02-03-SUMMARY.md
  - .planning/phases/02-content-model-and-import/02-04-PLAN.md
  - .planning/phases/02-content-model-and-import/02-04-SUMMARY.md
  - .planning/phases/02-content-model-and-import/02-FOLLOWUPS.md
  - .planning/phases/02-content-model-and-import/02-MCP-API-PASS.md
  - .planning/phases/02-content-model-and-import/02-REVIEW.md
  - .planning/phases/02-content-model-and-import/02-SECURITY.md
  - emdash-env.d.ts
  - scripts/import-content.mjs
  - scripts/import-content.test.mjs
  - scripts/lib/entry.mjs
  - scripts/lib/schema.mjs
  - scripts/lib/sources.mjs
  - scripts/verify-import.mjs
covered_digest: "v3:sha256:5efe0627ca07c27005e82d492c0307545049ccb473eaf7b1ba05495b1d056bb7"
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "Status, status variant, time label, date, tags and stats rows are editable in the admin, and the longest-body test entry edits and saves cleanly before the import (02-03-SUMMARY human sessions plus an MCP API pass)"
    reason: "User accepted the existing evidence for the criterion: their own browser admin sessions recorded in 02-03-SUMMARY.md (final taxonomy schema approved with the reply 'pass') plus the MCP API log filed at 02-MCP-API-PASS.md. That log states it ran on the superseded field schema (category as select, tags as multiSelect), so its category and tags rows are historical; the taxonomy pickers were checked in the browser only."
    accepted_by: "user (explicit acceptance in the orchestrating conversation)"
    accepted_at: "2026-10-26"
re_verification:
  previous_status: human_needed
  previous_score: 4/5
  gaps_closed:
    - "Criterion 1 MCP leg: now has a filed log (02-MCP-API-PASS.md) and a user-accepted override"
  gaps_remaining: []
  regressions: []
---

# Phase 2: Content Model and Import Verification Report

**Phase Goal:** Every piece of editable content (13 projects, About, nav, site settings) lives in EmDash locally, in a schema that fits it, with a verified field-for-field match to the markdown sources.
**Verified:** 2026-10-26T15:30:00Z
**Status:** passed
**Re-verification:** Yes, after the MCP evidence was filed and the review fixes HI-01, ME-03 and ME-04 landed (eca6c7b, c7adb56, 5d25576, docs 03e328e)

Honored amendments as current truth: D-07 date is a native datetime at midnight UTC; D-05 and D-09 category and tags are EmDash taxonomies with exactly one category per project enforced by the verifier; tags are compared as a set because EmDash returns them in global term order.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| #   | Truth                                                                                                                                                                                                                  | Status            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Status, status variant, time label, date, tags and stats rows are editable in the admin, and the longest-body test entry edits and saves cleanly before the import (02-03-SUMMARY human sessions plus an MCP API pass) | PASSED (override) | Override: user accepted the browser sessions in 02-03-SUMMARY.md (final taxonomy schema approved, reply "pass") plus the MCP log at 02-MCP-API-PASS.md, accepted by the user on 2026-10-26. The log covers status, variant, time label, date (round trip and rejection of "nope" and null), stats edit, add and remove with variant validation, menu order and settings, then a revert. It ran on the superseded select and multiSelect schema, so its category and tags rows are historical; the taxonomy pickers, date picker, body editor marks and stats widget rest on the browser sessions only. The schema supports every edit (checked in criterion 5). |
| 2   | About entry holds everything `src/data/about.*` provides; primary nav menu and General, Social, SEO settings are editable                                                                                              | VERIFIED          | Re-run on a throwaway root: verifier about section matches (part of 258/258), `primary` menu has 3 items, 3 settings applied by the seed, 0 users in the rebuilt DB. Unchanged from the previous run; no change to schema.mjs or sources.mjs since. Admin editability is recorded as user-approved in session 2 of 02-03-SUMMARY (admin screens are EmDash built-ins).                                                                                                                                                                                                                                                                                          |
| 3   | Import twice leaves exactly 13 projects (slugs equal file names, explicit dates, drafts still drafts) and one About, no duplicates, no copy changes                                                                    | VERIFIED          | Throwaway root: run 1 "Content: 14 created, 0 skipped, 0 updated"; run 2 "0 created, 0 skipped, 14 updated"; a third run exit 0. Seeded DB has 13 projects and 1 about, none trashed. Verifier checks slug, date and status per project. Draft handling is covered by the `draft-project.md` fixture test (passing).                                                                                                                                                                                                                                                                                                                                            |
| 4   | Field-by-field equality report shows zero differences in copy, dates, order, tags, stats, status                                                                                                                       | VERIFIED          | `node scripts/verify-import.mjs --root <tmp> --report <scratch>`: `258/258 checks match, 0 differences`, exit 0. The count rose from 232 because ME-04 added `status_variant.option` and `stats.variant.option` per project (26 checks), as 02-FOLLOWUPS.md states. The tag-order note (12 of 13 reordered) is the accepted set-comparison finding. The previous run's independent cross-check script (0 problems) covered the unchanged comparison logic; the two new checks only add constraints.                                                                                                                                                             |
| 5   | Generated types committed; committed seed rebuilds same schema and content in a fresh DB                                                                                                                               | VERIFIED          | `.emdash/seed.json` has a `content` key with 13 projects and 1 about, no U+2014. Applied with `emdash seed` to a fresh root: 90 migrations, 2 collections, 18 fields, 54 terms, 1 menu with 3 items, 14 content entries; verifier on that root: 258/258, 0 differences; DB has 0 users, 0 api tokens, 0 credentials. `npx astro check`: 0 errors, 0 warnings, 0 hints. `git diff --stat 341a9ad -- src astro.config.mjs` is empty. `.emdash/types.ts`, `.emdash/schema.json`, `emdash-env.d.ts` unchanged since the previous run.                                                                                                                               |

**Score:** 5/5 truths verified, one of them by user-accepted override (0 present, behavior-unverified)

### Review Fix Spot-Checks (HI-01, ME-03, ME-04)

| Fix   | What the review asked                                                    | Check run here                                                                                                                                                                                                                                                                                                                                                                                  | Status |
| ----- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| HI-01 | CLI entry guard must run under a symlinked path, never silently exit 0   | Symlinked the repo and ran both scripts through it: `verify-import.mjs --root <missing>` printed "no database" and exited 1 (main ran); `import-content.mjs --root <tmp>` built a database and exited 0. Importing `scripts/lib/entry.mjs` under `node -e` (no argv[1]) does not throw. `entry.mjs` compares realpaths and exits 1 for a same-named script that does not resolve to the module. | PASS   |
| ME-03 | `--schema-check` must refuse to overwrite a content seed                 | Copied the committed seed into a throwaway root and ran `--schema-check`: error naming the seed, exit 1, seed sha unchanged, no `data/` created. `--force-structure-seed` without `--schema-check` exits 2 with usage. An unparseable seed also exits 1 with a refusal. Check precedes any write or apply (`assertStructureSeedWritable` runs before `mkdirSync`/`writeFileSync`).              | PASS   |
| ME-04 | Bogus status and stat variants must be rejected, and the verifier checks | `buildSeed` on the real model with `statusVariant: "bogus"` throws naming file and value; a stat variant `purple` throws naming file, row and value; unmutated model accepted. Verifier side: new `status_variant.option` and `stats.variant.option` records are in `verify-import.mjs`, and the suite's mutated-stored-value tests (verifier exits 1) pass.                                    | PASS   |

### Required Artifacts

| Artifact                                                                  | Expected                                         | Status   | Details                                                                                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------- |
| `scripts/import-content.mjs`                                              | idempotent import through the emdash seed CLI    | VERIFIED | Uses `emdash seed`, no direct SQLite writes; run three times cleanly; ME-03 and ME-04 guards present           |
| `scripts/verify-import.mjs`                                               | read-only equality report, exit 1 on difference  | VERIFIED | `readOnly: true`, bound SQL values; 258 checks                                                                 |
| `scripts/lib/entry.mjs`                                                   | shared realpath entry guard (new since last run) | VERIFIED | 46 lines, imported and called by both scripts (`runAsEntry(import.meta.url, main)`), exercised via symlink     |
| `scripts/lib/schema.mjs`, `scripts/lib/sources.mjs`                       | schema definitions and source model              | VERIFIED | Unchanged                                                                                                      |
| `scripts/import-content.test.mjs`                                         | unit and integration tests                       | VERIFIED | 57 tests, 57 pass, 0 fail                                                                                      |
| `.emdash/seed.json`                                                       | exported seed of the verified DB                 | VERIFIED | Content key with 13 projects, 1 about; fresh rebuild 258/258                                                   |
| `.emdash/types.ts`, `.emdash/schema.json`, `emdash-env.d.ts`              | generated types, committed                       | VERIFIED | Unchanged; astro check clean                                                                                   |
| `02-MCP-API-PASS.md`, `02-REVIEW.md`, `02-FOLLOWUPS.md`, `02-SECURITY.md` | evidence and review records                      | VERIFIED | Present; MCP log is an honest record that discloses its own schema staleness; SECURITY verdict SECURED, 0 open |

### Key Link Verification

| From                                  | To                      | Via                                                       | Status | Details                                        |
| ------------------------------------- | ----------------------- | --------------------------------------------------------- | ------ | ---------------------------------------------- |
| import-content.mjs                    | emdash seed CLI         | `execFileSync(... "seed" ... --cwd targetRoot)`           | WIRED  | Ran against throwaway roots only               |
| import-content.mjs, verify-import.mjs | entry.mjs               | `runAsEntry(import.meta.url, main)`                       | WIRED  | Symlink run proves main executes               |
| verify-import.mjs                     | DB and markdown sources | `loadSourceModel(REPO_ROOT)` and read-only `DatabaseSync` | WIRED  | 258 checks on both imported and seed-built DBs |
| `.emdash/seed.json`                   | fresh DB                | `emdash seed`                                             | WIRED  | Re-proven in this run                          |

### Data-Flow Trace (Level 4)

Not applicable: no rendered artifacts in this phase (public read path deliberately untouched until Phase 3). `git diff --stat 341a9ad -- src astro.config.mjs` is empty.

### Behavioral Spot-Checks

| Behavior           | Command                                                                                            | Result                             | Status |
| ------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------- | ------ |
| Test suite         | `node --test scripts/import-content.test.mjs`                                                      | 57 pass, 0 fail                    | PASS   |
| Import twice       | `import-content.mjs --root <tmp>` x2 (plus a third)                                                | exit 0; 14 created then 14 updated | PASS   |
| Equality report    | `verify-import.mjs --root <tmp> --report <scratch>`                                                | 258/258, 0 differences, exit 0     | PASS   |
| Fresh seed rebuild | `emdash seed <repo>/.emdash/seed.json -d ./data/emdash.db --cwd <fresh> --skip-media`, then verify | 258/258, 0 differences, 0 users    | PASS   |
| Type check         | `npx astro check`                                                                                  | 0 errors, 0 warnings, 0 hints      | PASS   |
| src untouched      | `git diff --stat 341a9ad -- src astro.config.mjs`                                                  | empty                              | PASS   |

Cleanup: every temp root and scratch directory created in this run was deleted; no `portfolio-*` directories remain in `$TMPDIR`. The repo `data/` directory was not touched (mtimes and sizes identical before and after), no dev server was started (no listener on 4321), nothing was pushed, and the verifier's default report path was not used because `--report` pointed at scratch.

### Probe Execution

SKIPPED: the phase declares no `scripts/*/tests/probe-*.sh` probes.

### Requirements Coverage

| Requirement | Description                                                                        | Status    | Evidence                                                                        |
| ----------- | ---------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------- |
| SCHEMA-01   | projects collection, non-reserved slugs, taxonomies, native datetime, native draft | SATISFIED | schema.mjs and seed; fresh rebuild 258/258                                      |
| SCHEMA-02   | stats repeater, tags as taxonomy terms editable                                    | SATISFIED | repeater and taxonomies in DB; user sessions 2 and 3, MCP log for stats         |
| SCHEMA-03   | about entry with copy and cells                                                    | SATISFIED | about checks pass                                                               |
| SCHEMA-04   | primary menu and General, Social, SEO settings editable                            | SATISFIED | menu and settings present; admin edit per session 2; MCP menu and settings read |
| SCHEMA-05   | types generated and committed                                                      | SATISFIED | tracked, unchanged, astro check clean                                           |
| MIGR-01     | idempotent import, 13 slugs, dates, drafts                                         | SATISFIED | run three times                                                                 |
| MIGR-02     | About imported with no copy changes                                                | SATISFIED | body and fields equal                                                           |
| MIGR-03     | zero-difference equality report                                                    | SATISFIED | 258/258                                                                         |
| MIGR-04     | exported seed committed and reproducible                                           | SATISFIED | fresh rebuild                                                                   |

No orphaned requirements: REQUIREMENTS.md maps exactly SCHEMA-01..05 and MIGR-01..04 to Phase 2.

### Anti-Patterns Found

None. No TBD, FIXME, XXX, TODO, HACK or PLACEHOLDER in `entry.mjs`, the importer, the verifier or the tests; no U+2014 in those files or the seed; no stubs.

### Human Verification Required

None. The previous run's single item (the MCP pass) is resolved by the filed log plus the user-accepted override recorded above.

### Gaps Summary

No gaps. All five criteria hold; criterion 1 is carried by an explicit, dated user override rather than a silent pass.

Residual notes, not gaps:

- The override is narrower than it may read. The MCP log ran on the superseded category (select) and tags (multiSelect) schema, so it proves nothing about taxonomy editing; that part rests on the user's browser "pass".
- 02-FOLLOWUPS.md holds the unfixed review findings (ME-01, ME-02, ME-05, ME-06, LO-01..05, IN-01..05). ME-01 (re-import creates a new revision per published entry and rebuilds menu items, so "idempotent" holds at the entry-count level, not the revision level) and ME-02 (a published-to-draft flip does not unpublish) are real behavioral limits of the importer. Neither contradicts criterion 3 as written, and Phase 3 retires the markdown sources.
- The committed seed is a snapshot of the sources at `d91fbbd`; any markdown change before Phase 3 needs a re-import and re-export, and the draft, test-entry, user and listener checks in 02-SECURITY.md should be repeated then.
- `--schema-check` against the repo root now refuses by design; the executed 02-03 plan text that ran it there is historical.

---

_Verified: 2026-10-26T15:30:00Z_
_Verifier: Claude (gsd-verifier)_
