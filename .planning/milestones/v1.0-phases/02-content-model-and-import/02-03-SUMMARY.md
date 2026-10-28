---
phase: 02-content-model-and-import
plan: 03
subsystem: database
tags:
  [
    emdash,
    schema-lock,
    admin-test,
    datetime,
    taxonomies,
    typegen,
    seed,
    node-test,
  ]

requires:
  - phase: 02-content-model-and-import
    provides: importer, verifier, schema definitions and decisions Q1 to Q4 (plans 02-01 and 02-02)
provides:
  - "--schema-check importer mode with buildSchemaCheckSeed, structureSeed and longestBodyProject"
  - structure-only .emdash/seed.json that carries the schema, the category and tag taxonomies with their terms, the menu and the settings, and no content
  - project date as a native datetime at midnight UTC (D-07 amended by the user)
  - category and tags as EmDash taxonomies attached to projects (D-05 and D-09 amended by the user)
  - verifier term-assignment checks (exactly one category, tag set equality, taxonomy definitions and term lists) and a tag-order report
  - user-confirmed admin editability of projects, About, the Primary menu and the settings (success criteria 1 and 2)
  - generated .emdash/types.ts, .emdash/schema.json and emdash-env.d.ts committed (Q3 3a, SCHEMA-05)
affects: [02-04, 03-read-path]

actuals:
  tokens: 21500
  tasks: 3
  commits: 7
plan_head_before: 96ade8ba4ab65c54f0e01b2291ff8ca6c84799ee
plan_head_after: b5a64c6884ac094ee4911837f9fa0351c2a4a73c

tech-stack:
  added: []
  patterns:
    - "The structure seed is written by the same script that applies the schema-check seed, and regenerated in a throwaway root when the repo database is held open by a dev server"
    - "A datetime field is verified by converting the stored value back to its UTC calendar day and comparing it with the source YYYY-MM-DD string"
    - "Taxonomy terms are seeded with a label equal to the source string and a derived slug; entries reference terms by slug and the seed CLI clears and re-attaches them on every update"
    - "Term assignments are read read-only through the frozen TABLES names (content_taxonomies joined to ec_projects and taxonomies by translation_group), values bound with ?"

key-files:
  created:
    - .emdash/seed.json
    - .emdash/types.ts
    - .emdash/schema.json
    - emdash-env.d.ts
  modified:
    - scripts/import-content.mjs
    - scripts/import-content.test.mjs
    - scripts/lib/schema.mjs
    - scripts/verify-import.mjs
    - .planning/phases/02-content-model-and-import/02-CONTEXT.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "D-07 amended by the user on 2026-10-26 (reason: the admin date picker): date is a required, indexed native datetime stored as midnight UTC from the exact source YYYY-MM-DD string; this reverses the string-field wording of D-07 and SCHEMA-01"
  - "D-05 and D-09 amended by the user on 2026-10-26 (reason: use EmDash taxonomies as intended; terms are content, so the Phase 4 agent token can add one without a schema edit): category and tags are the built-in category (hierarchical) and tag (flat) taxonomies attached to projects; this supersedes Q1 = 1a and the select and multiSelect fields"
  - "Tag order per project is not preserved by EmDash (terms list in term order); accepted by the user as a Phase 3 decision"
  - "The dev server was left running because the user did not consent to Claude stopping it; the user stops it with Ctrl-C before plan 02-04 deletes data/"

requirements-completed: [SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05]

coverage:
  - id: D1
    description: "--schema-check builds a database with the schema, taxonomies, About, the Primary menu, the settings and one draft project carrying the longest body (catalog-cms, 3868 bytes) with its category and tag terms, plus a structure-only seed with no content key"
    requirement: "SCHEMA-01"
    verification:
      - kind: unit
        ref: "scripts/import-content.test.mjs#schema-check seed (decision Q4 4a)"
        status: pass
    human_judgment: false
  - id: D2
    description: "date is a native datetime at midnight UTC: conversion, calendar-day rejection, ordering, canonical storage and a one day mutation that the verifier reports and exits 1 on"
    requirement: "SCHEMA-01"
    verification:
      - kind: unit
        ref: "scripts/import-content.test.mjs#date field is a native datetime at midnight UTC (D-07 amended)"
        status: pass
      - kind: integration
        ref: "throwaway root import twice then verify-import.mjs: 232/232 checks, 0 differences"
        status: pass
    human_judgment: false
  - id: D3
    description: "category and tag are taxonomies attached to projects with 9 and 45 terms; assignments apply idempotently (54 terms, 79 assignments, no duplicates) including for drafts; the verifier fails on a wrong category, a missing or extra tag, two or zero categories, an undefined term slug and an extra term"
    requirement: "SCHEMA-01, SCHEMA-02"
    verification:
      - kind: unit
        ref: "scripts/import-content.test.mjs#category and tag are EmDash taxonomies (D-05 and D-09 amended)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The local admin edits and saves project fields, stats rows, the date picker (same calendar day), the category and tag term pickers (including a term created inline), and the long body without losing headings, bold, inline code or links; About, the Primary menu and the General, Social and SEO settings edit and save"
    requirement: "SCHEMA-02, SCHEMA-03, SCHEMA-04"
    verification: []
    human_judgment: true
    rationale: "Browser admin behavior confirmed by the user on the rebuilt databases; an API-level pass through the EmDash MCP also passed and was reverted"
  - id: D5
    description: "Generated types declare the projects and about collections only, with project_status, show_availability and a datetime date, no category or tags field on Project, and are committed"
    requirement: "SCHEMA-05"
    verification:
      - kind: integration
        ref: "emdash types --url http://localhost:4321; grep gates in plan 02-03 Task 3; declare module emdash lists about and projects; no posts or pages; npx astro check 0 errors"
        status: pass
    human_judgment: false
  - id: D6
    description: "The schema after the admin session matches the seed definitions, including the taxonomy definitions and terms"
    requirement: "SCHEMA-01"
    verification:
      - kind: integration
        ref: "node scripts/verify-import.mjs --root <fresh --schema-check root>: schema section 26 checks, 0 failing, collections about,projects, taxonomies category,tag"
        status: pass
    human_judgment: false

duration: 45min of execution across five spawns, plus the human admin sessions
completed: 2026-10-26
status: complete
---

# Phase 2 Plan 03: Schema Lock, Admin Edit Test and Generated Types Summary

**The schema is locked after the user's admin edit test on a seeded longest-body draft, with date reworked into a native datetime at midnight UTC and category and tags moved to EmDash taxonomies, and the types generated from the running server are committed.**

## Performance

- **Duration:** about 45 min of agent execution over five spawns; the admin sessions were the user's
- **Completed:** 2026-10-26
- **Tasks:** 3 (Task 1 auto with TDD, Task 2 human-action, Task 3 auto) plus two user-directed reworks
- **Commits:** 7 (`f1e6950`, `16c8b51`, `71f8f19`, `ec55449`, `7b1a335`, `cfabcba`, `b5a64c6`), plus this summary

## Accomplishments

- `--schema-check` writes the structure seed to `ROOT/.emdash/seed.json`, then applies the full seed with one draft project in place of the 13: slug `schema-check-longest-body`, title "Schema check: longest body", every other field and its category and tag terms from catalog-cms (the longest body, 3868 bytes by UTF-8). Settings, collections, taxonomies, menus and About are unchanged. The default run never writes `.emdash/seed.json` (tested).
- Date rework (reverses D-07): `date` is a required, indexed `datetime` field with no pattern validation. The importer turns the exact source `YYYY-MM-DD` into `YYYY-MM-DDT00:00:00Z`, which EmDash stores as `YYYY-MM-DDT00:00:00.000Z`; a string that is not a real calendar day throws and the bad-date fixture still fails. The verifier converts the stored value back to its UTC calendar day and requires equality with the source string. `ORDER BY date DESC, slug ASC` is unchanged. `datetime` is in EmDash's `INDEXABLE_FIELD_TYPES`, so `indexed: true` stays.
- Taxonomy rework (amends D-05 and D-09): the `category` select and `tags` multiSelect fields are gone. The seed defines the built-in `category` (hierarchical, 9 terms) and `tag` (flat, 45 terms) taxonomies attached to `projects`. Term labels are the exact source strings (`k3s`, `node_exporter`, `shadcn-svelte` keep their case; slugs are derived, so `node_exporter` is `node-exporter`). Entries carry `taxonomies: { category: [slug], tag: [slugs] }`. The importer refuses a category or tag with no term, because the seed CLI skips an unknown term slug silently.
- Seed CLI taxonomy behavior, read from `node_modules/emdash/src/seed/apply.ts` and confirmed on throwaway databases: `--on-conflict update` updates existing terms in place, then clears and re-attaches each entry's terms, for create and update and for drafts. Two runs gave 54 term updates and 79 assignments with no duplicates. The supported seed path was enough (D-10); nothing was improvised.
- Verifier: category and tag checks became term-assignment checks over `content_taxonomies`, `ec_projects` and `taxonomies` (frozen table names, bound values, read only). It enforces exactly one category term per project (the admin does not), tag set equality, no other taxonomy on a project, and in the schema section the taxonomy names, each definition (hierarchical flag, collections) and the exact term lists. It also reports tag order (below).
- The user redid the admin checks after each rebuild. The date picker saves the same calendar day, the tag checkboxes rendered in the first session, the body editor keeps headings and inline code, and stats Add Item works. On the final taxonomy database the user checked the category and tag pickers and answered "pass". A separate API-level pass through the EmDash MCP also passed and was reverted.
- Types: `node_modules/.bin/emdash types --url http://localhost:4321` regenerated `.emdash/types.ts` and `.emdash/schema.json`, and the dev server regenerated `emdash-env.d.ts`, overwriting the stale versions committed in `ec55449`. `Project` has `date`, `project_status`, `status_variant`, `surface`, `time_label`, `period`, `summary`, `sub`, `stats`, `body` and a `terms` map; there is no `category` or `tags` field. `declare module "emdash"` lists only `about` and `projects`.
- Tests: 42 in `scripts/import-content.test.mjs` (25 new in this plan). Throwaway import twice plus verify: 232/232 checks, 0 differences. `npx astro check`: 0 errors, 0 warnings, 0 hints.

## Tag order finding

EmDash lists a project's terms by term order (`sort_order`, then label), not by each entry's assignment order. After the import, 12 of 13 projects read their tags in a different order than the frontmatter (homelab-k8s is `Kubernetes, k3s, Ansible, Flux` in the source and reads back `Ansible, Flux, Kubernetes, k3s`). The exported seed carries term order too. The verifier compares tags as a set and prints a note with the reordered count, not a difference. The user accepted this as a Phase 3 call (card parity, REND-04); the Phase 3 read-path note is in `02-CONTEXT.md`.

## Task Commits

1. **Task 1: Schema-check database and structure seed** - `f1e6950` (feat)
2. **Rework 1: native datetime date (D-07 amended)** - `16c8b51` (feat), docs `71f8f19` (docs)
3. **Task 3 first pass: types for the field schema** - `ec55449` (feat), superseded by the taxonomy rework
4. **Rework 2: category and tags as taxonomies (D-05 and D-09 amended)** - `7b1a335` (feat), docs `cfabcba` (docs)
5. **Task 2: Admin edit test** - no commit (human-action; results below)
6. **Task 3: Regenerated types for the taxonomy schema** - `b5a64c6` (feat)

**Plan metadata:** committed separately as `docs(02-03): complete schema lock and generated types plan`.

## Task 2 results (user, local admin at http://localhost:4321)

| Session                               | Result                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1, string date schema                 | not approved; the date decision arrived and the database was rebuilt                                                                                                                                                                                                                                                                                                                    |
| 2, datetime date and field-based tags | approved: status, status variant, time label; date picker (same calendar day, required field rejects a clear); tag checkboxes; stats edit, Add Item with a variant, remove; long body (headings, bold, inline code, links survive an edit); About; Primary menu; General, Social and SEO settings. The user locked the tag checkboxes at that point, then replaced them with taxonomies |
| 3, taxonomy schema (final)            | approved ("pass"): category and tag pickers on the test entry, date picker                                                                                                                                                                                                                                                                                                              |

The user also tried a new tag term created inline; the live database ended with 46 tag terms and the test entry published. Both are throwaway edits.

## Decisions Made

- The three amendments and the dev-server handling are listed in the frontmatter and recorded in `02-CONTEXT.md` (D-05, D-07, D-09), `REQUIREMENTS.md` (SCHEMA-01, SCHEMA-02), `02-RESEARCH.md` and the plans 02-03 and 02-04. The 02-01 and 02-02 SUMMARY files still describe the string date, the category select and the tags multiSelect as they were at the time.
- The Q1 = 1a answer (tags as a multiSelect over 45 options) is superseded by D-09 as amended; the 45 options became the 45 tag terms.
- The searchable tags widget deferred idea is marked obsolete in `02-CONTEXT.md`, since tags are terms with an inline create in the admin.

## Deviations from Plan

**1. [Rule 4 - user decision] Date becomes a native datetime**

- **Found during:** Task 2 (the user asked for a date field in the admin)
- **Issue:** D-07 and SCHEMA-01 specified a string date; the admin shows a text box for it.
- **Fix:** reworked schema, importer, verifier, tests, seed and docs. EmDash cannot change a string field to a datetime in place, so `data/` was rebuilt from the seed.
- **Files modified:** `scripts/lib/schema.mjs`, `scripts/import-content.mjs`, `scripts/verify-import.mjs`, `scripts/import-content.test.mjs`, `.emdash/seed.json`, `02-CONTEXT.md`, `REQUIREMENTS.md`, `02-RESEARCH.md`, `02-PATTERNS.md`, `02-01-PLAN.md`, `02-03-PLAN.md`
- **Commits:** `16c8b51`, `71f8f19`

**2. [Rule 4 - user decision] Category and tags become taxonomies**

- **Found during:** Task 2 (the user tried the date picker and asked for the intended EmDash model: slim fields plus taxonomies)
- **Issue:** D-05 specified a category select and D-09 a tags multiSelect; EmDash's intended model is taxonomies, and terms are content the agent token can add.
- **Fix:** reworked the schema, seed, importer, verifier, tests, structure seed and docs; the types committed in `ec55449` were regenerated. Plan 02-04's seed checks now assert the two taxonomies with 9 and 45 terms and one category per entry.
- **Files modified:** `scripts/lib/schema.mjs`, `scripts/import-content.mjs`, `scripts/verify-import.mjs`, `scripts/import-content.test.mjs`, `.emdash/seed.json`, `02-CONTEXT.md`, `REQUIREMENTS.md`, `02-RESEARCH.md`, `02-03-PLAN.md`, `02-04-PLAN.md`
- **Commits:** `7b1a335`, `cfabcba`, `b5a64c6`

**3. [Rule 3 - consent] The dev server was not stopped**

- **Found during:** Task 3
- **Issue:** Task 3 step 4 and the "no listener on port 4321" gate assume Claude stops the server; the user did not consent to that.
- **Fix:** the server was left running and the gate was not met. The user stops it with Ctrl-C before plan 02-04, which deletes and rebuilds `data/`.

**4. [Rule 3 - blocking] Schema section read against a fresh root**

- **Found during:** Task 3
- **Issue:** the live database had one extra tag term and a published test entry from the user's trial edits, so the live schema section reported `tag.terms` as a difference.
- **Fix:** ran the schema section against a fresh `--schema-check` throwaway root (26 checks, 0 failing, collections `about,projects`, taxonomies `category,tag`). The live database showed exactly one failing schema check, `tag.terms`, which is the extra throwaway term; plan 02-04 rebuilds `data/`.

**5. [Rule 3 - blocking] Structure seed regenerated in a throwaway root**

- **Found during:** both reworks
- **Issue:** `--schema-check` writes `data/emdash.db` as well, and the user's server held it open.
- **Fix:** ran the same script against a throwaway root and copied only its `.emdash/seed.json`.

**Total deviations:** 2 user-decided reworks, 3 auto-handled. **Impact:** the schema now has a datetime date and taxonomy-based category and tags; everything else matches the plan.

## Operational Notes

- Types were generated against the schema-check database. Plan 02-04 must check that no commit after `b5a64c6` touches `scripts/lib/schema.mjs`.
- `data/` still holds the schema-check database with the user's throwaway edits (a published test entry and one extra tag term). Plan 02-04 deletes and rebuilds it, so the dev server must be stopped first.
- The seed CLI skips an unknown term slug silently; the importer and verifier both guard against it.
- A formatter hook rewrites files touched by Edit and Write; the documentation amendments were made with scripts to keep diffs to the intended lines, and scripts were formatted with the repo's prettier.

## Issues Encountered

- The first admin approval was withdrawn when the date decision arrived, and the second was superseded by the taxonomy decision; the checklist was run again after each rebuild.

## Authentication Gates

None. The local dev bypass and the localhost `emdash types` authentication worked as researched (assumptions A1 and A6).

## Known Stubs

None.

## Threat Flags

None. T-02-10 mitigation (server stays on localhost, no `--host`) held; T-02-12 was not exercised because Claude did not stop any process. The verifier's new taxonomy queries use frozen table names and bound values (CLAUDE.md SQL rule).

## Next Phase Readiness

- Ready for plan 02-04: the user stops the dev server first, then the real import into a rebuilt `data/`, the equality report, and the exported seed (checked to carry the two taxonomies and a taxonomies map on every entry).
- `.emdash/seed.json` is still the structure seed and is replaced by the exported seed in 02-04.
- Phase 3 must map terms back to a `string[]` of tag labels and one category string, and decide the tag order question.

## Self-Check: PASSED

- FOUND: `.emdash/types.ts`, `.emdash/schema.json`, `emdash-env.d.ts`, `.emdash/seed.json`, `scripts/import-content.mjs`, `scripts/lib/schema.mjs`, `scripts/verify-import.mjs`
- FOUND: commits `f1e6950`, `16c8b51`, `71f8f19`, `ec55449`, `7b1a335`, `cfabcba` and `b5a64c6` are ancestors of HEAD
- Re-ran: 42 of 42 tests, `npx astro check` 0 errors, verifier schema section 26 checks with 0 failing against a fresh schema-check root, types grep gates (project_status, show_availability, no category or tags, projects and about only, no posts or pages), stored term labels `k3s`, `node_exporter` and `shadcn-svelte` unchanged, no U+2014 in any written file
- Known gap: the "no listener on port 4321" gate is not met by design (user consent, see Deviations)
