# Phase 02 Follow-ups

Backlog of the findings in `02-REVIEW.md` that were not fixed in the review-fix pass. HI-01, ME-03 and ME-04 are resolved (see the "Resolved" section at the end of `02-REVIEW.md`).

Note on scope: the importer and verifier read the markdown sources, and Phase 3 removes those sources. After that the importer is retired, so any item marked "tooling" below only matters if the scripts stay in use past Phase 3 (for example as the way to rebuild a database from `.emdash/seed.json`).

## Medium

| ID    | One line                                                                                                                                                                                                                                          | Suggested owner |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| ME-01 | Re-running the importer creates a new revision per published entry and rebuilds menu items; decide one-shot seeding (refuse a populated database) or true idempotency before the sources are removed.                                             | Phase 3         |
| ME-02 | A source flipped from published to draft keeps its live revision and the importer exits 0; fail loudly in the importer or add a supported unpublish step.                                                                                         | tooling         |
| ME-05 | The verifier derives its expectations from the same schema functions as the importer; add a hand-written golden fixture, compare `searchable`, `indexed`, `default_value`, `label`, `url_pattern`, `supports`, and check the time part of `date`. | tooling         |
| ME-06 | The verifier's default report path is a hard-coded file under `~/portfolio-baseline` that is silently overwritten; require `--report`, write atomically, drop the absolute `dbPath`.                                                              | tooling         |

## Low

| ID    | One line                                                                                                                                                 | Suggested owner |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| LO-01 | Frontmatter parsing rejects CRLF, BOM and no-trailing-newline files, and YAML errors do not name the file.                                               | tooling         |
| LO-02 | A calendar-invalid date such as 2026-02-30 passes the parser and fails later without the file name; run the calendar check inside `parseProjectFile`.    | tooling         |
| LO-03 | Duplicate tags in one project import fine and then fail verification; reject them in `parseProjectFile` with the file name.                              | tooling         |
| LO-04 | `data/` is created before the seed is validated, the `--validate` pass is redundant, and the temp seed directory survives SIGINT or SIGTERM.             | tooling         |
| LO-05 | Argument parsing accepts a flag as a value (`--root --schema-check`), does not name the rejected argument, and `verify()` prints to stderr as a library. | tooling         |

## Info

| ID    | One line                                                                                                                                                                               | Suggested owner |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| IN-01 | Dates are UTC midnight strings; add a shared `formatProjectDate` pinned to `timeZone: "UTC"` and a comment on the generated type.                                                      | Phase 3         |
| IN-02 | The tag-option guard in `buildSeed` can never fire on real data; remove it or make the tag list an independent source.                                                                 | tooling         |
| IN-03 | `.emdash/types.ts` and `emdash-env.d.ts` declare the same interfaces and can drift; commit one and ignore or import the other.                                                         | Phase 3         |
| IN-04 | No npm scripts for import, verify or test, and Node 22.x behavior of type stripping and `node:sqlite` was not tested.                                                                  | tooling         |
| IN-05 | Tests are tied to the live content snapshot (13 projects, 45 tags, 14 bodies) and to hand-copied constants such as `SITE_SETTINGS`; adding a project breaks them for the wrong reason. | tooling         |

## Notes from the review-fix pass

- **Rebuilding the schema-check database (ME-03).** `--schema-check` now refuses to write when the target root's `.emdash/seed.json` has a `content` key or cannot be parsed. Run it against a throwaway root (`--root DIR` where `DIR/.emdash/seed.json` does not exist), or delete the seed first, or pass `--force-structure-seed` to replace it on purpose. The committed repo seed is the exported content seed, so running `--schema-check` against the repo root now stops with an error. The executed plans `02-03-PLAN.md` and `02-03-SUMMARY.md` describe the old flow (`rm -rf data`, then `--schema-check` on the repo root); they are historical records and were left unedited.
- **Variant counts (ME-04).** The verifier now makes two extra checks per project (`status_variant.option` and `stats.variant.option`), so a full run reports 258 checks instead of 232.
- **Entry guard (HI-01).** Both scripts now start through `runAsEntry` in `scripts/lib/entry.mjs`. A run started under the same file name but not resolving to the module exits 1 with an error instead of exiting 0 silently.
