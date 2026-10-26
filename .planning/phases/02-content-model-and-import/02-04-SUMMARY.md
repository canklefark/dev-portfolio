---
phase: 02-content-model-and-import
plan: 04
subsystem: database
tags: [emdash, import, seed, export-seed, equality-report, taxonomies, parity]

requires:
  - phase: 02-content-model-and-import
    provides: importer, verifier, locked schema, taxonomy model and committed generated types (plans 02-01 to 02-03)
provides:
  - "data/ rebuilt from the markdown sources and imported twice: 13 live projects, 1 About, 0 trashed rows, 0 users"
  - "field-by-field equality report with 0 differences (232 of 232 checks) for the repo database, saved outside the repo"
  - "committed .emdash/seed.json exported from the verified database, rebuilding the same schema and content in a fresh database with 0 differences"
  - "confirmation that the committed types are not stale (no schema.mjs change after b5a64c6) and that the public site is unchanged (17 of 17 identical, 17 of 17 within the allowlist)"
affects: [03-read-path, 05-deploy, 06-publishing]

actuals:
  tokens: 30600
  tasks: 2
  commits: 1
plan_head_before: 86954d1f8815e3c37f0885754ae9157cd101c444
plan_head_after: d91fbbd007ebdceb764ddf484758c604769acfbe

tech-stack:
  added: []
  patterns:
    - "The seed is exported only after a zero-difference verify of a database rebuilt from the sources, then proven by applying it to a fresh mkdtemp root and running the same verifier there"
    - "Run logs and equality reports live under ~/portfolio-baseline/current/phase2/, outside the repo"

key-files:
  created: []
  modified:
    - .emdash/seed.json

key-decisions:
  - "The seed was exported to the session scratchpad, validated and content-checked there, then copied to .emdash/seed.json, so a failed export could not clobber the committed structure seed; the bytes are identical to a direct redirect"
  - "The exported seed carries settings title, tagline and social only (no url, no seo key), matching decision Q2 = 2a"
  - "The tag order finding stays as accepted: the exported seed carries term order, 12 of 13 projects read tags in a different order than the frontmatter, and the verifier reports it as a note, not a difference"

requirements-completed: [MIGR-01, MIGR-02, MIGR-03, MIGR-04, SCHEMA-05]

coverage:
  - id: D1
    description: "The repo database is rebuilt from markdown (data/ deleted first) and two imports leave 13 live projects whose slugs equal the 13 file names, 1 About, 0 trashed rows and 0 users, with only the about and projects collections"
    requirement: "MIGR-01"
    verification:
      - kind: integration
        ref: "node scripts/import-content.mjs twice (exit 0, both print 'import: 13 projects and 1 about applied to'), then the plan 02-04 Task 1 read-only sqlite gate"
        status: pass
    human_judgment: false
  - id: D2
    description: "The field-by-field report shows zero differences in copy, dates, order, category and tag terms, stats, status, About, menu, settings and schema, and the order check passes for the 13 projects"
    requirement: "MIGR-02, MIGR-03"
    verification:
      - kind: integration
        ref: "node scripts/verify-import.mjs: verify: 232/232 checks match, 0 differences; report ~/portfolio-baseline/current/phase2/equality-report.json"
        status: pass
    human_judgment: false
  - id: D3
    description: ".emdash/seed.json is the export-seed output of the verified database, validates, holds exactly about and projects, 13 project entries, 1 about, 1 menu, category with 9 terms and tag with 45 terms, no draft, no test entry, no dev bypass user and no url setting"
    requirement: "MIGR-04"
    verification:
      - kind: integration
        ref: "node_modules/.bin/emdash seed .emdash/seed.json --validate plus the Task 2 node content check (cols about,projects; slugs equal file names; category:9,tag:45; one category per project; statuses published only)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Applying the committed seed to a fresh mkdtemp root reproduces the schema and content with zero differences"
    requirement: "MIGR-04"
    verification:
      - kind: integration
        ref: "emdash seed $PWD/.emdash/seed.json --cwd FRESH --skip-media, then verify-import.mjs --root FRESH: 232/232 checks, 0 differences; report equality-report-fresh.json"
        status: pass
    human_judgment: false
  - id: D5
    description: "The committed generated types are not stale and the public site is unchanged"
    requirement: "SCHEMA-05"
    verification:
      - kind: integration
        ref: "git log b5a64c6..HEAD -- scripts/lib/schema.mjs is empty; npm run build; compare 17/17 identical; check 17/17 passed; npx astro check 0 errors; git diff 341a9ad -- src astro.config.mjs is empty"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-10-26
status: complete
---

# Phase 2 Plan 04: Real Import, Zero-Difference Verify and Committed Seed Summary

**The repo database was rebuilt from the markdown and imported twice to 13 projects and 1 About with 0 differences across 232 checks, and the seed exported from it rebuilds the same schema and content in a fresh database with 0 differences.**

## Performance

- **Duration:** about 2 min of execution (108 s from the plan start to the seed commit)
- **Started:** 2026-10-26T14:08:09Z
- **Completed:** 2026-10-26T14:09:57Z (seed commit); this summary follows
- **Tasks:** 2
- **Files modified:** 1 (`.emdash/seed.json`)

## Accomplishments

- Task 1: confirmed nothing listened on port 4321 and that 02-03-SUMMARY records the admin test as approved, then deleted `data/` (dropping the plan 02-03 test entry, the extra tag term, the Dev Admin user and the accumulated revisions) and ran `node scripts/import-content.mjs` twice, each exit 0 and each printing `import: 13 projects and 1 about applied to .../data/emdash.db`. `node scripts/verify-import.mjs` printed `verify: 232/232 checks match, 0 differences (13 projects expected, 13 stored; 1 about; 3 menu items)` and exited 0. No repo file changed in Task 1.
- Report counts (`equality-report.json`, dbPath is the repo `data/emdash.db`): 183 project checks, 8 about, 11 menu, 4 settings, 26 schema, 232 total, 0 differences. The order check (`projects / list / order`) is ok: the 13 slugs read date descending, slug ascending on ties, and equal the expected list. The read-only spot check found 13 live slugs equal to the 13 file names, 0 trashed rows, 0 users and collections `about,projects` only.
- Task 2: `node_modules/.bin/emdash export-seed -d ./data/emdash.db --with-content all` exited 0 with progress on stderr. The export validated (`Seed file is valid`) and passed the content check: collections `about,projects`, 13 project entries with slugs equal to the file names, 1 about entry, 1 menu (`primary`, 3 items), taxonomies `category:9,tag:45`, exactly one category term on every project, every entry `published`, no `schema-check-longest-body`, no `dev@emdash.local`, no `url` setting (settings are `social`, `tagline`, `title`), no blockTypes or widgetAreas, and no U+2014 anywhere. It replaced the structure seed in `.emdash/seed.json` (5030 insertions, 521 deletions, 122459 bytes).
- Fresh rebuild: applying the committed seed to a new mkdtemp root with `--skip-media` reported 90 migrations, 3 settings, 2 collections, 18 fields, 54 terms, 1 menu with 3 items and 14 content entries created, and `verify-import.mjs --root` against it printed `232/232 checks match, 0 differences`. The report is `equality-report-fresh.json`; the temp root was removed.
- Staleness guard (SCHEMA-05): the last commit touching `.emdash/types.ts` is `b5a64c6` and no later commit touches `scripts/lib/schema.mjs`.
- Public site: `npm run build` exit 0; `compare: 17/17 identical`; `check: 17/17 passed`; `npx astro check` 0 errors, 0 warnings, 0 hints; `git diff --name-only 341a9ad -- src astro.config.mjs` is empty. The build left the tree clean except the seed.

## Evidence outside the repo

`~/portfolio-baseline/current/phase2/`: `import-run-1.txt`, `import-run-2.txt`, `verify.txt`, `equality-report.json` (repo database), `equality-report-fresh.json` (fresh rebuild from the seed).

## Task Commits

1. **Task 1: Rebuild the repo database from markdown, import twice, verify zero differences** - no commit (no tracked file changed; `data/` is gitignored and the evidence is outside the repo)
2. **Task 2: Export the committed seed, prove a fresh rebuild matches, confirm types and the public site** - `d91fbbd` (feat)

**Plan metadata:** committed separately as `docs(02-04): complete real import and committed seed plan`.

## Files Created/Modified

- `.emdash/seed.json` - export-seed output of the verified database (13 projects, 1 about, primary menu, category and tag taxonomies with their terms, title, tagline and social settings), replacing the structure-only seed from plan 02-03

## Decisions Made

- Export to a scratchpad file, validate and check there, then copy into `.emdash/seed.json`; the result is byte-identical to the plan's direct redirect and protects the previous seed if the export fails.
- Otherwise followed the plan as specified.

## Deviations from Plan

None - plan executed exactly as written. (The only procedural difference is the scratchpad staging of the export described above; the committed bytes are the same.)

The 02-03 hand-off item "the user stops the dev server before 02-04" was met: port 4321 had no listener at the start of both tasks.

## Issues Encountered

None. Nothing needed a human: no draft entry appeared in the export, the types were not stale and the parity gates passed.

## Authentication Gates

None.

## Known Stubs

None.

## Threat Flags

None. The seed contains no users, credentials or tokens (0 users in the source database, no dev bypass email, no url setting) and no draft content (T-02-13, T-02-14, T-02-16 mitigations held); both tasks ran with no listener on port 4321 (T-02-15). No package was installed (T-02-SC).

## Notes for Phase 3 and Phase 5

- The committed seed is embedded by the dev server and the build through `virtual:emdash/seed`, so a fresh database's first request or setup run applies it with skip semantics. The seed now carries content, not only structure.
- Phase 3 must re-run the import (`node scripts/import-content.mjs`) and re-export the seed before it deletes the markdown if any markdown change lands first; the committed seed is a snapshot of the sources at `d91fbbd`.
- Tag order per project is term order in the database and in the seed (accepted earlier as a Phase 3 call, card parity REND-04). The verifier reports it as a note: 12 of 13 projects.
- The export order of content follows `created_at`, not slug; the verifier checks list order separately and it passes.
- `data/` now holds the verified import, imported twice (revision history is two revisions per published entry, Pitfall 7). Rebuild it before Phase 6 revision-restore tests if a clean history is wanted.

## Next Phase Readiness

- Phase 2 is complete once this plan's summary is committed: 4 of 4 plans, success criteria 3, 4 and 5 met alongside 1 and 2 from plan 02-03.
- Ready for Phase 3 (read path rewire, GUARD-01): the database, seed, types and equality tooling are all in place and the build still matches the baseline.

## Self-Check: PASSED

- FOUND: `.emdash/seed.json`, `~/portfolio-baseline/current/phase2/equality-report.json`, `equality-report-fresh.json`, `import-run-1.txt`, `import-run-2.txt`, `verify.txt`
- FOUND: commit `d91fbbd` is an ancestor of HEAD
- Re-ran: seed validate, the Task 1 and Task 2 content gates, fresh verify (0 differences), staleness guard, `compare` 17/17, `check` 17/17, `astro check` 0 errors, empty diff of `src` and `astro.config.mjs` against `341a9ad`

---

_Phase: 02-content-model-and-import_
_Completed: 2026-10-26_
