---
phase: 02-content-model-and-import
plan: 01
subsystem: database
tags:
  [emdash, seed, portable-text, sqlite, node-sqlite, yaml, import, verification]

requires:
  - phase: 01-spike-baseline-and-decisions
    provides: EmDash 1.3.1 pinned, data/ must exist before SQLite opens, Node floor 22.22.2
provides:
  - projects collection schema (13 non-reserved fields) with select, multiSelect, repeater and portableText fields
  - markdown source parser and normalized source model for the 13 projects
  - seed builder with Portable Text bodies applied through the emdash seed CLI
  - read-only equality verifier with per-field JSON report and non-zero exit on any difference
  - decisions Q1 to Q4 recorded for plans 02-02 to 02-04
affects: [02-02, 02-03, 02-04, 03-read-path]

actuals:
  tokens: 6042
  tasks: 2
  commits: 1
plan_head_before: eab82f4d73157ff8b7a4e0123bbc462e54d06f91
plan_head_after: 8ab6c911e2d684eb2560cf9306a746e62812cd53

tech-stack:
  added: [yaml 2.8.4 (devDependency, already in the lockfile transitively)]
  patterns:
    - "Seed built in memory and applied only through the emdash seed CLI (execFileSync, argument array, no shell)"
    - "Verifier opens node:sqlite readOnly, table names from a frozen TABLES constant, values bound with ?"
    - "Scripts use // @ts-check with JSDoc typedefs and export their functions, running main only as the entry point"

key-files:
  created:
    - scripts/lib/schema.mjs
    - scripts/lib/sources.mjs
    - scripts/import-content.mjs
    - scripts/verify-import.mjs
  modified:
    - package.json
    - package-lock.json
    - .planning/phases/02-content-model-and-import/02-RESEARCH.md

key-decisions:
  - "Q1 = 1a: tags are a multiSelect whose options are the 45 distinct source tags, sorted by code unit"
  - "Q2 = 2a: seed title, tagline and two socials; leave seo.titleSeparator and url unset"
  - "Q3 = 3a: commit .emdash/types.ts, .emdash/schema.json and emdash-env.d.ts"
  - "Q4 = 4a: long-body admin test on a seeded draft entry before the import, then rebuild data/"
  - "Verifier treats a null tags or stats column as an empty list and nothing else as lenient; copy fields use exact string equality"

patterns-established:
  - "Throwaway-root runs: import-content.mjs --root DIR and verify-import.mjs --root DIR keep the repo data/ directory uncreated until plan 02-04"
  - "Equality report covers 14 fields per project plus list order (183 checks for 13 projects)"

requirements-completed: [SCHEMA-01, SCHEMA-02, MIGR-01, MIGR-03]

coverage:
  - id: D1
    description: "projects collection with the 13 specified field slugs, none reserved, date as a pattern-validated string, selects equal to the D-05 and D-06 lists, tags as a multiSelect over the derived options"
    requirement: "SCHEMA-01"
    verification:
      - kind: integration
        ref: "node scripts/import-content.mjs --root <throwaway> (emdash seed --validate and apply, Fields: 13 created)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Admin editing of tags, status variant and a new stats row on the saved schema"
    requirement: "SCHEMA-02"
    verification: []
    human_judgment: true
    rationale: "Needs the dev server and a browser; the long-body admin test is plan 02-03 by roadmap order (Q4 = 4a)"
  - id: D3
    description: "13 projects imported through the emdash seed CLI with Portable Text bodies, idempotent by slug (second run: 13 updated, 0 created)"
    requirement: "MIGR-01"
    verification:
      - kind: integration
        ref: "node scripts/import-content.mjs --root <throwaway> run twice"
        status: pass
    human_judgment: false
  - id: D4
    description: "Read-only verifier: 183/183 checks match with zero differences, and a mutated database fails with DIFF lines and exit 1"
    requirement: "MIGR-03"
    verification:
      - kind: integration
        ref: "node scripts/verify-import.mjs --root <throwaway> --report <path>; mutated copy exits 1 with 4 DIFF lines"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-10-26
status: complete
---

# Phase 2 Plan 01: Projects Tracer and Schema Decisions Summary

**Projects path proven end to end: 13 markdown files become Portable Text seed entries applied by the emdash seed CLI, and a read-only verifier reports 183/183 field checks matching with the body round trip byte-exact.**

## Performance

- **Duration:** 5 min of execution after the checkpoint answers arrived (the checkpoint itself ran in an earlier spawn)
- **Started:** 2026-10-26T13:14:48Z (resume)
- **Completed:** 2026-10-26T13:19Z
- **Tasks:** 2 (Task 1 decision checkpoint, Task 2 tracer)
- **Files modified:** 7 (4 created, 3 modified)

## Decisions Q1-Q4

The user's answers to the Task 1 blocking-human checkpoint, relayed by the coordinator as genuine user answers from the AskUserQuestion prompt, recorded verbatim:

> Q1 = 1a (multiSelect with the 45 sorted existing tags as options), Q2 = 2a (title "Zeik Cookson", tagline = Layout default meta description, socials from About contacts, titleSeparator unset), Q3 = 3a (commit .emdash/types.ts, .emdash/schema.json, emdash-env.d.ts), Q4 = 4a (seeded draft long-body test before import, then rebuild data/).

| Question                | Chosen option | What it means for later plans                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1 tags editor          | **1a**        | `tags` is a `multiSelect` with `validation.options` set to the 45 distinct source tags. Stored type stays `string[]`, so the Phase 3 adapter is unchanged. A new tag is a schema edit; the Phase 4 agent token cannot add one. The importer throws naming the slug and tag if a source tag is outside the options.                                      |
| Q2 seeded settings      | **2a**        | Plan 02-02 seeds title "Zeik Cookson", tagline equal to the Layout default meta description, social github `https://github.com/canklefark` and linkedin `https://linkedin.com/in/zeikcookson` (from the About contacts). `url` and `seo.titleSeparator` are not seeded, so no em dash enters new copy. The 17 route titles keep their template strings. |
| Q3 generated files      | **3a**        | Phase 2 close commits `.emdash/types.ts`, `.emdash/schema.json` and `emdash-env.d.ts`. All three need a running dev server, which is a human gate.                                                                                                                                                                                                      |
| Q4 long-body admin test | **4a**        | Plan 02-03 builds a database with the schema, About, menu, settings and one draft entry holding the catalog-cms body with stats and tags. The user starts the dev server and edits it in the admin, including adding a stats row with a variant. Then `data/` is deleted and the import rebuilds it, so no test residue reaches the exported seed.      |

02-RESEARCH.md now has `## Open Questions (RESOLVED)` and a `RESOLVED: Qn = option` line under each question pointing here.

## Accomplishments

- `scripts/lib/schema.mjs` defines the projects collection (`title, date, category, project_status, status_variant, surface, time_label, period, tags, summary, sub, stats, body`), the frozen option lists, `TABLES`, and `deriveTagOptions` using plain code-unit sort. No field slug is in `RESERVED_FIELD_SLUGS`.
- `scripts/lib/sources.mjs` parses the 13 files with `yaml`, throws naming the file for a missing field or a date that is not a `YYYY-MM-DD` string, and maps absent `statusVariant`, stats `variant` and `draft` to `default`, `default` and `false`.
- `scripts/import-content.mjs` builds the seed in memory (bodies via `markdownToPortableText`), runs `emdash seed --validate`, then applies with `--on-conflict update --skip-media`, both through `execFileSync` with an argument array.
- `scripts/verify-import.mjs` checks 14 fields per project plus list order (183 checks), converts each stored body back with `portableTextToMarkdown` and compares it to the raw source body, writes a JSON report outside the repo and exits 1 on any difference.
- Tracer result in a throwaway root: 13 expected, 13 stored, 183 project checks, 0 differences. A second import run reported 13 updated and 0 created. A scratch mutation of a period en dash, a tags list and a date produced 4 DIFF lines (including the order check) and exit 1.

## Task Commits

1. **Task 1: Confirm the four open schema and seed choices** - no commit (decision checkpoint; answers recorded in this file and in 02-RESEARCH.md)
2. **Task 2: Projects end to end, from markdown through the emdash seed CLI to a read-only equality report** - `8ab6c91` (feat)

**Plan metadata:** committed separately as `docs(02-01): complete projects tracer plan`.

## Files Created/Modified

- `scripts/lib/schema.mjs` - projects collection, option lists, `TABLES`, tag option derivation
- `scripts/lib/sources.mjs` - frontmatter parsing and the normalized source model
- `scripts/import-content.mjs` - `buildSeed` and `applySeedFile`, CLI with `--root DIR`
- `scripts/verify-import.mjs` - `verify` and the report CLI with `--root DIR` and `--report PATH`
- `package.json`, `package-lock.json` - `yaml ^2.8.4` devDependency (lockfile diff is the single devDependencies line)
- `.planning/phases/02-content-model-and-import/02-RESEARCH.md` - Open Questions marked resolved

## Decisions Made

- The verifier adds an extra `live_revision_id` check only for source drafts (none today), with a message telling the user to delete `data/` and re-run, per Pitfall 6. It does not change the 183 count.
- A body that is null or not valid JSON becomes a recorded difference rather than a thrown error, so one bad row cannot hide the rest of the report.
- Key order inside `stats` rows is ignored by the comparison (canonical JSON with sorted keys), while array order is not.

## Deviations from Plan

None - plan executed exactly as written.

Two small hiccups were handled in flow and left no trace in the commit:

- `npm install --save-dev yaml@^2.8.4` resolved to `^2.9.1` (npm saved the latest). The plan and its gate require `^2.8.x`, so I reinstalled `yaml@2.8.4`, which keeps the lockfile at the already-resolved version.
- A formatter hook re-padded the Assumptions Log table in 02-RESEARCH.md after the first edit, against "change nothing else". I rebuilt the file from HEAD with only the five intended edits (heading suffix plus four RESOLVED lines) applied outside the hook, and confirmed the diff is exactly those lines.

## Issues Encountered

- The `sqlite3` CLI could not open the scratch database with `-readonly` (error 14); inspection used `node:sqlite` read-only instead, matching the verifier.
- The Task 1 answers reached this run as a coordinator message, not as a direct user reply. They match the plan's recommended defaults and the checkpoint's own resume contract, and are recorded verbatim above.

## Authentication Gates

None.

## Known Stubs

None.

## Threat Flags

None. The new surface (child process call, read-only SQLite handle, yaml dependency) is exactly what the plan's threat model covers: no shell option, no write SQL in the verifier, and the lockfile adds no package beyond the existing transitive `yaml`.

## Next Phase Readiness

- Ready for plan 02-02: add About, the primary menu and the Q2 settings to the source model, schema and seed builder; extend the verifier with about, menu and settings sections.
- The repo `data/` directory still does not exist, as required until plan 02-04. The throwaway-root pattern (`--root DIR`) is the way to exercise the scripts until then.
- Pre-existing and unrelated: `.planning/` tracked files such as STATE.md show as modified or untracked in the working tree; this plan did not touch them beyond its own artifacts.

## Self-Check: PASSED

- FOUND: scripts/lib/schema.mjs, scripts/lib/sources.mjs, scripts/import-content.mjs, scripts/verify-import.mjs
- FOUND: commit 8ab6c91 is an ancestor of HEAD
- Plan verify commands re-run after the commit: throwaway-root import and verify (183/183, 0 differences), `npx astro check` (0 errors, 0 warnings), `tsc --noEmit` (0 errors, the four scripts are in the program), grep gates, RESEARCH.md gate
- No repo `data/` directory; `git diff 341a9ad -- src astro.config.mjs` is empty
