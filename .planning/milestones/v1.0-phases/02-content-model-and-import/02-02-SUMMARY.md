---
phase: 02-content-model-and-import
plan: 02
subsystem: database
tags: [emdash, seed, about, menu, settings, node-test, sqlite, verification]

requires:
  - phase: 02-content-model-and-import
    provides: projects tracer (schema.mjs, sources.mjs, import-content.mjs, verify-import.mjs) and decisions Q1 to Q4
provides:
  - about collection (7 fields, three repeaters, three select unions) with one entry imported from the real src/data/about.* sources
  - primary nav menu (Home, Projects, About) and Q2 2a site settings in the seed
  - verifier sections about, menu, settings and schema (229 checks for the full import, 0 differences)
  - node:test suite (17 tests) with three synthetic fixtures covering drafts, empty lists, bad dates, empty input, idempotency, mutation and unexpected entries
affects: [02-03, 02-04, 03-read-path]

actuals:
  tokens: 9694
  tasks: 2
  commits: 2
plan_head_before: aff975ec1bc00581071f3c877ff246e4b7d5b539
plan_head_after: d292281f13dd0d0bc5562cc6c1f49755c1007779

tech-stack:
  added: []
  patterns:
    - "About values are read from the real src/data/about.ts exports through Node type stripping, never copied"
    - "Tests build a model by hand, apply it to an mkdtemp root with applySeedFile in quiet mode, read it back with a readOnly DatabaseSync and remove the root in finally"
    - "Verifier sections share one add(section, key, field, expected, actual, ok) recorder; list and JSON fields compare through canonical()"

key-files:
  created:
    - scripts/import-content.test.mjs
    - scripts/fixtures/draft-project.md
    - scripts/fixtures/empty-lists.md
    - scripts/fixtures/bad-date.md
  modified:
    - scripts/lib/schema.mjs
    - scripts/lib/sources.mjs
    - scripts/import-content.mjs
    - scripts/verify-import.mjs

key-decisions:
  - "About cells with no variant are stored as default; the verifier compares show_availability as Boolean(stored) because SQLite returns 0 or 1"
  - "Settings follow Q2 2a: title, tagline (the Layout default description, verbatim) and two socials; no url key and no seo key, so no em dash enters new copy"
  - "The schema verifier section requires the collections to be exactly about and projects, and compares each stored field's type, required flag and validation JSON (select options and repeater subFields) to the definitions"
  - "Stack level and contact icon validation lives in an exported validateAboutOptions helper so the throw-naming-the-item behavior can be unit tested without editing about.ts"

patterns-established:
  - "Mutation test: a database built from a mutated copy of the model must produce exactly the expected differences, and the verifier CLI must exit 1"
  - "Failed expectations name section, key and field, for example about about cells"

requirements-completed:
  - SCHEMA-03
  - SCHEMA-04
  - MIGR-02
  - SCHEMA-01
  - SCHEMA-02
  - MIGR-01
  - MIGR-03

coverage:
  - id: D1
    description: "about collection with title, role, show_availability, body, cells, stack and contacts, and exactly one about entry holding everything src/data/about.ts and about.md provide"
    requirement: "SCHEMA-03"
    verification:
      - kind: integration
        ref: "node scripts/import-content.mjs --root <throwaway> then verify-import.mjs (8 about checks, about stored 1, 0 differences)"
        status: pass
      - kind: unit
        ref: "scripts/import-content.test.mjs#about, menu and settings in the seed"
        status: pass
    human_judgment: false
  - id: D2
    description: "primary menu with Home, Projects and About in Nav.astro order, and the Q2 2a settings with no url key, stored in SQLite and verified"
    requirement: "SCHEMA-04"
    verification:
      - kind: integration
        ref: "verify-import.mjs menu section (11 checks) and settings section (4 checks), 0 differences"
        status: pass
    human_judgment: false
  - id: D3
    description: "Admin editing of the nav menu, General, Social and SEO settings"
    requirement: "SCHEMA-04"
    verification: []
    human_judgment: true
    rationale: "Needs the dev server and a browser; the admin checks belong to the human gate in plan 02-03 (Q4 = 4a)"
  - id: D4
    description: "About imported with no copy changes: role, cells, stack, contacts and body read from the real exports and about.md"
    requirement: "MIGR-02"
    verification:
      - kind: unit
        ref: "scripts/import-content.test.mjs#builds one published about entry from the real exports and about.md"
        status: pass
      - kind: unit
        ref: "scripts/import-content.test.mjs#round trips every project body and about.md byte-identical (D-02, Pitfall 9)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Drafts stay drafts, empty lists round trip, a bad date and an empty source directory fail loudly, and two applies converge to 13 projects and 1 about"
    requirement: "MIGR-01"
    verification:
      - kind: unit
        ref: "scripts/import-content.test.mjs#throwaway databases (draft status draft, published_at NULL, live_revision_id NULL; idempotency)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The verifier fails on a changed field: a mutated database reports exactly three differences and the CLI exits 1"
    requirement: "MIGR-03"
    verification:
      - kind: unit
        ref: "scripts/import-content.test.mjs#reports exactly the three mutations and exits 1 from the CLI"
        status: pass
    human_judgment: false
  - id: D7
    description: "No project or about field slug is in RESERVED_FIELD_SLUGS and no collection slug is in RESERVED_COLLECTION_SLUGS; empty tags and stats import and verify as empty lists"
    requirement: "SCHEMA-01, SCHEMA-02"
    verification:
      - kind: unit
        ref: "scripts/import-content.test.mjs#keeps every field and collection slug out of the emdash reserved lists"
        status: pass
      - kind: unit
        ref: "scripts/import-content.test.mjs#keeps a draft source a draft and round trips empty lists"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-10-26
status: complete
---

# Phase 2 Plan 02: About, Menu, Settings and Edge-Case Tests Summary

**About, the primary nav menu and the Q2 settings now travel from the real sources through emdash seed into SQLite and verify at 229/229 checks with 0 differences, and a 17-test suite proves the edge cases and the verifier's failing direction.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-10-26T13:19Z
- **Completed:** 2026-10-26T13:26Z
- **Tasks:** 2
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments

- `aboutCollection()` defines `title, role, show_availability, body, cells, stack, contacts` with select options taken from `CELL_VARIANT_OPTIONS`, `STACK_LEVEL_OPTIONS` and `CONTACT_ICON_OPTIONS`. `NAV_MENU` mirrors `Nav.astro` and `SITE_SETTINGS` carries the Q2 2a values.
- `loadAbout` statically imports `role`, `showAvailability`, `cells`, `stack` and `contacts` from `src/data/about.ts` (Node type stripping) and reads the body from `about.md`, so no About value is copied. A cell without a variant becomes `default`.
- `buildSeed` adds the settings, both collections, the `primary` menu and one `about` entry. The import prints `13 projects and 1 about applied`.
- The verifier gained four sections. In a throwaway root: 229 checks (8 about, 11 menu, 4 settings, 23 schema, plus the 183 project checks), 0 differences, 13 projects and 1 about stored. The schema section treats any collection other than `about` and `projects` as a difference.
- `scripts/import-content.test.mjs` (17 tests, about 3.5 s) covers the converter round trip over 13 bodies and `about.md`, reserved slugs, tag options, the draft, empty-list and bad-date fixtures, an empty source directory, draft and empty-list rows in a throwaway database, idempotency, the three-difference mutation with CLI exit 1, and an unexpected extra entry.

## Task Commits

1. **Task 1: About entry, primary menu and site settings, from sources through the seed to the verifier** - `b5b2fa3` (feat)
2. **Task 2: Throwaway-database tests for drafts, empty lists, bad input, idempotency and verifier failure** - `d292281` (test)

**Plan metadata:** committed separately as `docs(02-02): complete about, menu and settings plan`.

## Files Created/Modified

- `scripts/lib/schema.mjs` - About collection, option lists, `NAV_MENU`, `SITE_SETTINGS`, `ABOUT_SLUG`, `ABOUT_TITLE`, `ABOUT_FIELD_SLUGS`
- `scripts/lib/sources.mjs` - `loadAbout`, `validateAboutOptions`, `loadSourceModel` now returns `about`
- `scripts/import-content.mjs` - `buildSeed` extended; `applySeedFile` gained a `quiet` option
- `scripts/verify-import.mjs` - about, menu, settings and schema sections; report gained `about`, `menu`, `settings` and `schema`
- `scripts/import-content.test.mjs` - the node:test suite
- `scripts/fixtures/draft-project.md`, `empty-lists.md`, `bad-date.md` - synthetic sources, never imported into the repo database

## Decisions Made

- The settings section reports `keys` as the list of seeded keys and the schema section reports `collections` as the stored slugs, so a reader sees what was compared. The menu section reports the stored item count.
- The mutation test picks the first project (other than catalog-cms) whose body has a bold mark. Today only `k-one` has one, so the test fails loudly if that ever stops being true.
- Verifier schema comparison covers type, required and validation JSON for every field. Validation holds the select options and the repeater subFields, so a changed option list is a difference.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] applySeedFile quiet option**

- **Found during:** Task 2
- **Issue:** `applySeedFile` inherited stdio, so every test database apply would print 15 lines of CLI output into the test run.
- **Fix:** added an optional third argument `{ quiet }` that switches stdio to `pipe`; a failure still throws with the CLI output attached. The CLI entry point is unchanged.
- **Files modified:** `scripts/import-content.mjs`
- **Commit:** `d292281`

**2. [Rule 3 - Blocking] validateAboutOptions helper**

- **Found during:** Task 1
- **Issue:** the plan requires `loadAbout` to throw naming the item for a bad stack level or contact icon, but `about.ts` is read-only and its exports cannot be mutated from a test.
- **Fix:** moved the checks into an exported `validateAboutOptions(stack, contacts)` that `loadAbout` calls, and unit tested it with out-of-range values.
- **Files modified:** `scripts/lib/sources.mjs`
- **Commit:** `b5b2fa3`

**Total deviations:** 2 auto-fixed (2 Rule 3). **Impact:** both are small test seams; no behavior change for the real import.

## Operational Notes

- Each import re-run adds one revision per published entry (Pitfall 7). Menu items are replaced and settings overwritten on every run (Pitfall 5), so admin edits to nav or settings before Phase 3 are lost on a re-import. Accepted under D-11.
- A published-to-draft flip in markdown after an import leaves `live_revision_id` and `published_at` on the row (Pitfall 6). The fix is to delete `data/` and re-import; the verifier reports it through the `live_revision_id` check for draft sources.
- The `src/data/about.ts` import was exercised on Node 24.17.0 only, not on the 22.22.2 floor (research A7).
- A formatter hook reformatted the test file after the first write; the checked-in content is the formatted version and the suite passes on it.

## Issues Encountered

- The first mutation run failed on a test bug, not a script bug: the actual differences were sorted and the expected list was not. The expected list is now sorted the same way. No script was changed for it.

## Authentication Gates

None.

## Known Stubs

None.

## Threat Flags

None. The only new surface is the static import of repo-controlled `src/data/about.ts` (T-02-06, accepted), plus verifier queries that bind the `site:KEY` and menu names with `?` values over a readOnly handle (T-02-07) and tests that remove every mkdtemp root in `finally` (T-02-08, no `portfolio-` directory remained in the temp directory after the suite).

## Next Phase Readiness

- Ready for plan 02-03: the long-body admin test (Q4 = 4a). The throwaway-root pattern builds the schema, About, menu and settings database it needs.
- The repo `data/` directory still does not exist and `git diff 341a9ad -- src` is empty, as required until plan 02-04.

## Self-Check: PASSED

- FOUND: scripts/lib/schema.mjs, scripts/lib/sources.mjs, scripts/import-content.mjs, scripts/verify-import.mjs, scripts/import-content.test.mjs, scripts/fixtures/draft-project.md, scripts/fixtures/empty-lists.md, scripts/fixtures/bad-date.md
- FOUND: commits b5b2fa3 and d292281 are ancestors of HEAD
- Re-ran after the last commit: `node --test --test-reporter=tap scripts/import-content.test.mjs` (pass 17, fail 0), throwaway import twice plus verify (229/229, 0 differences), `npx astro check` (0 errors, 0 warnings, 0 hints), no U+2014 in any written file, no repo `data/` directory, `git diff 341a9ad -- src` empty
