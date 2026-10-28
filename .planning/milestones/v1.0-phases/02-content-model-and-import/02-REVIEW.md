---
phase: 02-content-model-and-import
reviewed: 2026-10-26T14:30:00Z
depth: deep
files_reviewed: 14
files_reviewed_list:
  - scripts/import-content.mjs
  - scripts/verify-import.mjs
  - scripts/lib/schema.mjs
  - scripts/lib/sources.mjs
  - scripts/import-content.test.mjs
  - scripts/fixtures/bad-date.md
  - scripts/fixtures/draft-project.md
  - scripts/fixtures/empty-lists.md
  - package.json
  - package-lock.json
  - .emdash/seed.json
  - .emdash/schema.json
  - .emdash/types.ts
  - emdash-env.d.ts
findings:
  critical: 0
  high: 1
  medium: 6
  low: 5
  info: 5
  total: 17
status: issues_found
resolved:
  HI-01: eca6c7b
  ME-03: c7adb56
  ME-04: 5d25576
followups: 02-FOLLOWUPS.md
---

# Phase 02: Code Review Report

**Reviewed:** 2026-10-26
**Depth:** deep (cross-file, plus read of the emdash 1.3.1 seed CLI and apply code, and scratch runs against throwaway roots under the session scratchpad)
**Files Reviewed:** 14 (the 12 source files plus the generated artifacts, checked by shape only)
**Status:** issues_found

Commit range: 341a9ad..HEAD on emdash-migration (9 commits). `.gitignore` has no change in that range, so there is nothing to report on it.

## Summary

The code is in better shape than most import tooling. Every SQL statement is built from the frozen `TABLES` constant with all values bound through `?`, so no SQL finding is raised. `execFileSync` is called with an argument array and no shell, so `--root` cannot inject arguments, and `-d ./data/emdash.db` is resolved against `--cwd` inside the emdash CLI (`resolve(cwd, args.database)`, cli/index.mjs:3828), so the importer and verifier agree on the database location. The temp seed directory is removed in a `finally`, and I confirmed no `portfolio-*` directories were left in `$TMPDIR` after the full suite. `tsc --noEmit -p .` is clean for `scripts/`, and the 42 tests pass (about 15 s). No `any` appears in the scripts.

Date handling holds up. `dateToDatetime` rejects 2025-02-30 through its `toISOString` round trip. This matters because V8 does not reject that string: `new Date("2025-02-30T00:00:00Z")` is valid and rolls over to 2 March, so the regex alone would not catch it. Leap day 2024-02-29 is accepted, 2025-02-29 is rejected, and the stored value is the canonical `T00:00:00.000Z`.

The problems are mostly about trust in the gates. The verifier can pass without doing anything, the idempotency claim is not true at the revision and menu-item level, and the verifier shares so much with the importer that some regressions cannot be seen. No critical issues.

## High

### HI-01: Both scripts silently do nothing, exit 0, when invoked through a symlinked path

**File:** `scripts/verify-import.mjs:661`, `scripts/import-content.mjs:263`
**Failure scenario:** The entry guard compares `import.meta.url` (the realpath) with `pathToFileURL(process.argv[1]).href` (the path as typed). When the repo is reached through a symlink (for example a `~/workspace` link, a `current` link in a deploy layout, or a case-differing path on macOS), the guard is false and `main()` never runs. I reproduced this with a symlink to the repo: `node linkrepo/scripts/verify-import.mjs --root R --report X` printed nothing, wrote no report and exited 0. The importer behaves the same way, so it creates no database. A CI step or a human checking `$?` reads a verifier that never ran as a pass. `pathToFileURL(undefined)` also throws a raw `TypeError` at import time if `process.argv[1]` is absent (for example under `node -e`).
**Fix hint (non-binding):** Compare realpaths, for example `realpathSync(process.argv[1])` against `fileURLToPath(import.meta.url)`, with a guard for an undefined `argv[1]`. Or move `main` into a tiny `bin` wrapper that always runs, and keep the modules import-only.

## Medium

### ME-01: Re-running the importer is not idempotent below the row level

**File:** `scripts/import-content.mjs:201-216` (with emdash `apply-CLjfxvyH.mjs:701-718` and `:843-844`), test `scripts/import-content.test.mjs:392-413`
**Failure scenario:** `--on-conflict update` creates a new revision for every published entry on every run (`trxRevisionRepo.create` followed by `setDraftRevision` and `publish`) even when the data is byte-identical. I ran the importer 4 times into a scratch root: revisions went 14, 28, 42, 56, `live_revision_id` changed on every run and `updated_at` moved. The menu is rebuilt with `deleteFrom("_emdash_menu_items")` plus inserts, so the three menu item ids were all different after each run (any per-item edit in the admin is lost). The test named "converges after two applies" only asserts row counts and zero verifier differences, so none of this shows up. Revision history of a content-managed site fills with identical copies, and the "update" mode silently overwrites any admin edit to content or menu on every import.
**Fix hint:** Decide the contract. If imports are one-shot seeding, refuse to run against a database that already holds the projects collection (or require an explicit `--force`). If re-runs are supported, skip entries whose data already equals the stored row, and add a test that counts `revisions` rows and menu item ids across two applies.

### ME-02: A source flipped from published to draft stays live, and the importer reports success

**File:** `scripts/import-content.mjs:63`, `scripts/verify-import.mjs:286-299`
**Failure scenario:** Setting `draft: true` on a project that is already imported makes the update path write `status = draft` but leave `live_revision_id` and `published_at` in place (apply code only creates and publishes a revision when `status === "published"`). I reproduced it: after the flip the importer exited 0, the row was `status draft` with a non-null `live_revision_id`, and the verifier reported exactly one difference. The only remedy offered is "delete data/ and re-run the import", which also destroys admin users, media and every other edit. If the public site reads the live revision, the draft is still served.
**Fix hint:** Detect this in the importer (check the row after apply and fail loudly), or give the user an unpublish step that clears the live revision through the supported API instead of deleting the database. At minimum, make the importer, not only the verifier, print the warning.

### ME-03: `--schema-check` overwrites the committed full-content `.emdash/seed.json` before anything is validated

**File:** `scripts/import-content.mjs:242-249`
**Failure scenario:** After plan 02-04 the tracked `.emdash/seed.json` is an `export-seed` result (13 projects, 1 about, 5,032 lines, `meta.name "Exported Seed"`, `version` numeric `1`). The `--schema-check` flag still writes a structure-only seed (`meta.name "portfolio"`, no `content`) to `<root>/.emdash/seed.json`, and the default root is the repo. Running the documented flag from the repo root replaces the committed content seed with an empty-content one (the Dockerfile copies `.emdash` into the runtime image, so a build after that would seed an empty site). The write happens before `applySeedFile`, so even a failed validation leaves the file clobbered. Nothing tests that the committed seed, `schema.json`, `types.ts` or `emdash-env.d.ts` still match the importer, and there is no script to regenerate the seed (the 02-04 summary shows a manual `emdash export-seed` run).
**Fix hint:** Retire `--schema-check` now that its plan has shipped, or refuse to write when `<root>/.emdash/seed.json` already has a `content` key, or write to a temp path. Add a test that the committed seed validates and applies to a fresh database with zero verifier differences, so drift is caught in CI rather than by hand.

### ME-04: Select-valued source fields are never validated, and the verifier cannot see the result

**File:** `scripts/lib/sources.mjs:93-98` and `:110-113`, `scripts/import-content.mjs:68` and `:74-78`
**Failure scenario:** `statusVariant` and each stat `variant` only have to be non-empty strings. `STATUS_VARIANT_OPTIONS` and `STAT_VARIANT_OPTIONS` exist in `schema.mjs` and drive the field definitions, but nothing checks source values against them (category, tags, stack level and contact icon are checked). I built a project with `statusVariant: "bogus"` and a stat variant `"purple"`: `buildSeed` accepted it, the CLI applied it, and the verifier reported zero differences because it compares the stored value to the same bogus source value. The admin then shows a select holding a value outside its options, and a front end that maps variant to a CSS class gets an undefined class.
**Fix hint:** Validate `statusVariant` and stat `variant` against the option constants in `buildSeed` (next to the category check), or in `parseProjectFile`, naming file and field. Add fixtures for both.

### ME-05: The verifier shares its expectations with the importer, so several regressions pass

**File:** `scripts/verify-import.mjs:419-425` (menu), `:428-445` (settings), `:464-514` (collections and fields), `:517-575` (taxonomies), `:226`, `:279`; `scripts/lib/sources.mjs` (shared parser)
**Failure scenario:** Expected schema, menu, settings and taxonomies are taken from `projectsCollection()`, `aboutCollection()`, `taxonomyDefinitions()`, `NAV_MENU` and `SITE_SETTINGS`, the same functions that build the seed. A wrong definition (a missing field, a wrong option list, a wrong menu URL) produces a matching seed and a matching expectation, so the check is green. The same holds for the parser: if `parseProjectFile` dropped a stat or trimmed a value, both sides agree. Beyond that, the field comparison covers only `type`, `required` and `validation`. It does not compare `searchable`, `indexed`, `default_value`, `label`, `url_pattern` or `supports`, all of which are set in the definitions and stored in the database (I confirmed the columns exist and hold the expected values today). The date check reads only the UTC calendar day, so `2026-08-05T23:59:59Z` stored for `2026-08-05` passes. The body check round trips through emdash's own converter pair and never inspects the stored Portable Text or the revision data that the live site may read.
**Fix hint:** Keep a small hand-written golden fixture for schema, menu, settings and a few projects (or compare against the committed `.emdash/seed.json` field list), compare the omitted column set, assert the time part of `date` is midnight, and for projects compare the live revision data with the column data.

### ME-06: The default report path is a hard-coded, silently overwritten location outside the repo

**File:** `scripts/verify-import.mjs:36-39`, `:641-643`
**Failure scenario:** With no `--report`, the verifier writes `~/portfolio-baseline/current/phase2/equality-report.json`. On this machine `current` is a symlink to the dated `2026-10-23` baseline directory, so any later run, including a failing one or one pointed at a different `--root`, overwrites the evidence file for the phase with no prompt and no backup. The report is 138 KB and holds the absolute database path (home directory and username) plus the full `expected` and `actual` text of every check, including whole bodies, so a run against any other EmDash database writes that site's mismatching content into a home-directory file. `--report` accepts any path and `writeFileSync` follows symlinks, so a typo can overwrite an unrelated file. If `verify` throws (for example an empty database file), nothing is written and the previous report, possibly a passing one, stays in place with no marker that it is stale.
**Fix hint:** Require `--report` (or default to a path under the repo that is ignored), refuse to overwrite an existing report without a flag, write to a temp file and rename, drop `dbPath` or make it root-relative, and delete or mark any existing report at the start of a run.

## Low

### LO-01: Frontmatter parsing rejects common valid files with a misleading message

**File:** `scripts/lib/sources.mjs:34`, `:59-60`
**Failure scenario:** `FRONTMATTER` requires LF line endings and a newline after the closing `---`. I confirmed a CRLF file, a file with a BOM, and a file with an empty body and no final newline all fail with "no frontmatter block". YAML syntax errors from `parse` are not wrapped, so the message names a line and column but not the file, which is a problem with 13 files.
**Fix hint:** Normalise `\r\n` and strip a BOM before matching, allow `\n?` or end of input after the closing fence, and wrap `parse` in a try/catch that prefixes the file name.

### LO-02: A calendar-invalid date passes the parser and fails later with no file or slug

**File:** `scripts/lib/sources.mjs:67-72`, `scripts/lib/schema.mjs:48-58`, `scripts/import-content.mjs:66`
**Failure scenario:** `parseProjectFile` checks only the `YYYY-MM-DD` shape, so `date: "2026-02-30"` loads fine (I confirmed). The importer then throws `date "2026-02-30" is not a YYYY-MM-DD calendar day` from `buildSeed`, without the file or slug, and the verifier (which never calls `dateToDatetime`) will happily load such a source. With 13 files the user has to grep for the string.
**Fix hint:** Call the calendar check inside `parseProjectFile` so the error carries the file name, and keep `dateToDatetime` as the single implementation.

### LO-03: Duplicate tags in one project import fine, then fail verification

**File:** `scripts/lib/sources.mjs:77-82`, `scripts/verify-import.mjs:247-253`
**Failure scenario:** `tags: ["Ansible", "Ansible"]` produces a seed with the slug twice, EmDash stores the term once, and the verifier reports a tags difference that is really a source error (I reproduced this). The import said success.
**Fix hint:** Reject duplicate tags in `parseProjectFile` with the file name.

### LO-04: Side effects before validation, redundant CLI pass, and temp cleanup depends on `finally`

**File:** `scripts/import-content.mjs:193-216`
**Failure scenario:** `data/` is created before the seed is validated, so a rejected seed still leaves an empty `data/` in the target root. The separate `--validate` invocation is redundant, because the apply invocation runs the same `validateSeed` first (cli/index.mjs:3816), and it costs a second CLI start-up on every apply. On SIGINT or SIGTERM during `execFileSync` the process ends without running the `finally`, so the `portfolio-seed-*` directory with the full seed stays in `$TMPDIR`. Not a leak under normal failure (I checked), only under signals.
**Fix hint:** Create `data/` after the seed passes, drop the first invocation unless the dry run is wanted for its own output, and register a `process.on("exit")` or signal cleanup for the temp directory.

### LO-05: Argument parsing and library side effects

**File:** `scripts/import-content.mjs:229-237`, `scripts/verify-import.mjs:625-633` and `:295-298`
**Failure scenario:** `--root --schema-check` consumes `--schema-check` as the root path, and `--report` can be given a flag as its value, because only `i + 1 < length` is checked. An unknown argument prints the usage line without saying which argument was rejected. `verify()` is exported and used by the tests as a library, but it writes to `console.error` on its own, so the draft-with-live-revision condition is reported twice when run through the CLI (once as the stderr line, once as a DIFF) and noisily when imported.
**Fix hint:** Reject a value that starts with `--`, name the offending argument in the error, and return the warning in the report rather than printing it from `verify()`.

## Info

### IN-01: Dates are UTC midnight strings, so consumers must format in UTC

**File:** `.emdash/types.ts:35`, `emdash-env.d.ts` (`Project.date: string`), `scripts/lib/schema.mjs:36-73`
**Note:** The stored value is `YYYY-MM-DDT00:00:00.000Z`. A front end that formats it in local time (`new Date(date).toLocaleDateString()` in an American time zone) shows the previous day for every project. This belongs to Phase 3, but the type file gives no hint. Worth a comment or a shared `formatProjectDate` helper that pins `timeZone: "UTC"`.

### IN-02: Dead guard on tag options in `buildSeed`

**File:** `scripts/import-content.mjs:43` and `:53-59`
**Note:** `model.tagOptions` is derived from the same projects, so `allowedTags` can never reject a real tag. The check only fires in the test that fabricates a mismatched model. The category check against `CATEGORY_OPTIONS` is the useful one. Either remove the tag check or make the tag list an independent source.

### IN-03: Two generated type files declare the same interfaces

**File:** `.emdash/types.ts`, `emdash-env.d.ts`
**Note:** Both define `About` and `Project` (the second adds the `declare module "emdash"` block and says it is regenerated on every dev server start), so they can drift and produce churn in diffs. Consider committing one and ignoring the other, or importing from one.

### IN-04: No npm scripts for import, verify or test

**File:** `package.json`
**Note:** The `yaml` devDependency is correct (`devOptional` in the lock, not present in the runtime image because the Dockerfile runs `npm ci --omit=dev`). The commands live only in file header comments, and the test header notes a Node 24 directory-argument quirk. Adding `import`, `verify` and `test` scripts would also give CI a hook. `engines` says `>=22.22.2`, while the scripts rely on Node type stripping for `src/data/about.ts` and on `node:sqlite`; both work on 24.17 (checked) but the 22.x behaviour (experimental warnings) was not tested.

### IN-05: Tests are tied to the live content snapshot and to hand-copied constants

**File:** `scripts/import-content.test.mjs:115`, `:122-136`, `:282`, `:400`, `:790`, `:841`
**Note:** `bodies.length === 14`, `live.length === 13`, `tag.terms.length === 45`, `cells[0].variant === "accent"` and the "54 terms, 79 assignments" title mean that adding a project (the documented CLAUDE.md workflow) or editing About fails the suite for the wrong reason. The test named "three Nav.astro links" never reads `Nav.astro` (the menu constants happen to match today), and `SITE_SETTINGS` is hand-copied from `Layout.astro`, with only the tagline cross-checked. Entry-point behaviour (usage exit 2, missing database, an invalid source) and the symlink case in HI-01 have no tests.

## Resolved

Fixed on branch emdash-migration, each with a failing test first (`node --test scripts/import-content.test.mjs`: 57 of 57 pass).

- **HI-01** fixed in `eca6c7b`. Both scripts start through `runAsEntry` (`scripts/lib/entry.mjs`), which compares realpaths and tolerates a missing `process.argv[1]`. A run under the same file name that does not resolve to the module exits 1 with an error. Tests run both scripts through a symlinked repo directory, including a failing verify that exits 1.
- **ME-03** fixed in `c7adb56`. `--schema-check` refuses (error, exit 1, nothing written or applied) when `<root>/.emdash/seed.json` has a `content` key or cannot be parsed, unless `--force-structure-seed` is passed. The flag is rejected without `--schema-check`. A test asserts the committed seed has 13 projects and 1 about. To rebuild the schema-check database, use a throwaway root or delete the seed first; the executed 02-03 plan text that ran it on the repo root was left as a historical record.
- **ME-04** fixed in `5d25576`. The importer rejects a `statusVariant` or stat `variant` outside its option list, naming the file and value. The verifier adds `status_variant.option` and `stats.variant.option` checks per project (232 checks became 258, 0 differences on a throwaway import).

The remaining findings are listed in `02-FOLLOWUPS.md`.
