---
phase: 03-read-path-rewire-and-parity
plan: 04
subsystem: emdash-content-model
tags: [emdash, seed, export-seed, schema, seo, typegen, round-trip]

requires:
  - phase: 03-read-path-rewire-and-parity
    provides: server build, getProject adapter, parity compare and public-JS guard (plans 03-01 to 03-03)
  - phase: 02-content-model-and-import
    provides: committed .emdash/seed.json with the about and projects collections (phase start seed 77a570d)
provides:
  - "home and projects_index singleton collections, each with one published entry holding the baseline strings"
  - "about heading_line_1, heading_line_2, heading_accent and excerpt fields with the baseline strings"
  - "drafts, revisions, preview and seo in supports on all four collections"
  - "settings.seo.titleSeparator set to ' — ' (space, U+2014, space)"
  - ".emdash/seed.json re-exported from the dev server; the committed seed alone rebuilds the schema and content"
  - "emdash-env.d.ts as the only committed generated types file, with home and projects_index in EmDashCollections"
affects: [03-05, 03-06, 05]

actuals:
  tokens: 32000
  tasks: 2
  commits: 1
plan_head_before: 3af414c78d405d9ec7b5021e39b1f2e91e142385
plan_head_after: fd56e371e190cd0b6404976ac4fc08f73311f13c

tech-stack:
  added: []
  patterns:
    - "Schema and content changes go through EmDash's own API on a local dev server, then export-seed; the seed is never hand-edited or script-patched"
    - "Seed gate: validate, then compare against the phase start seed at 77a570d, then a normalized fresh-database round trip"

key-files:
  created: []
  modified:
    - .emdash/seed.json
    - emdash-env.d.ts
    - .gitignore
  deleted:
    - .emdash/types.ts
    - .emdash/schema.json

key-decisions:
  - "Used the one-off helper (EmDashClient with devBypass) because the EmDash MCP tools were not available to the executor; the helper lives outside the repo and was not committed"
  - "Let the dev server regenerate emdash-env.d.ts on schema change; the typegen POST fallback was not needed"

patterns-established:
  - "export-seed output is copied into .emdash/seed.json only after validate and the content gate pass"

requirements-completed: [REND-03]

coverage:
  - id: D1
    description: "home and projects_index collections exist with one published entry each holding the baseline strings, and about gains four heading and excerpt fields"
    requirement: REND-03
    verification:
      - kind: other
        ref: "seed gate (scratchpad seed-gate.cjs, the plan's verify block) against .emdash/seed.json: seed-delta: OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "supports drafts, revisions, preview and seo on every collection, and settings.seo.titleSeparator is ' — '"
    requirement: REND-03
    verification:
      - kind: other
        ref: "seed gate checks supports and settings: seed-delta: OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "The committed seed rebuilds identically from a fresh database"
    requirement: REND-03
    verification:
      - kind: other
        ref: "emdash seed into mkdtemp, export-seed again, normalized equality, projects_index present: equal"
        status: pass
    human_judgment: false
  - id: D4
    description: "emdash-env.d.ts is the only committed generated types file; .emdash/types.ts and .emdash/schema.json are deleted and ignored"
    requirement: REND-03
    verification:
      - kind: automated_ui
        ref: "npx astro check: 0 errors, 0 warnings, 0 hints (32 files); git check-ignore on both paths"
        status: pass
    human_judgment: false
  - id: D5
    description: "The public site is unchanged by the delta"
    requirement: REND-03
    verification:
      - kind: other
        ref: "node scripts/check-public-js.mjs: check: 17/17 passed; script-inventory parity: 17/17 identical"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-10-26
status: complete
---

# Phase 3 Plan 04: EmDash Content Delta Summary

**Added home and projects_index singletons, four About heading and excerpt fields, SEO support on every collection and the ' — ' title separator through EmDash's own API, re-exported them into the committed seed, and proved the seed rebuilds identically from a fresh database.**

## Performance

- **Duration:** about 9 min of active work (Task 2 was a user checkpoint)
- **Started:** 2026-10-26T16:22Z
- **Completed:** 2026-10-26T16:33Z
- **Tasks:** 3 of 3 (Task 2 was the user's checkpoint)
- **Files modified:** 5 (seed.json, emdash-env.d.ts, .gitignore, and the two deletions)

## Accomplishments

- **Task 1 (no repo changes):** the existing `data/emdash.db` was backed up with `sqlite3 .backup` to `~/portfolio-baseline/current/phase3/pre-delta-emdash.db` (`PRAGMA integrity_check` printed `ok`), then `data/` was rebuilt from the committed seed. The rebuild held 13 projects, 1 About entry, 0 users and the about and projects collections only. Nothing in the repo changed, and no commit was made.
- **Task 2 (user checkpoint):** the user started the dev server, health returned 200. Claude started no server.
- **Task 3:** every change was applied through the API by the helper `~/portfolio-baseline/current/phase3/apply-delta.mjs` (outside the repo, not committed). All calls were accepted, so nothing had to be made in the admin.
- The exported seed passed `emdash seed --validate` and the content gate, then was copied to `.emdash/seed.json`. The fresh-database round trip was equal and the re-export contains `projects_index`.
- `emdash-env.d.ts` was regenerated by the dev server and lists about, home, projects and projects_index.

## Mechanism per change

| Change                                                                                                 | Mechanism                                                                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| supports (drafts, revisions, preview, seo) on projects and about                                       | helper: `PUT /schema/collections/{slug}`                                             |
| `home` collection, urlPattern `/`, six fields, entry `home` published                                  | helper: `createCollection`, `PUT` for urlPattern, `createField`, `create`, `publish` |
| `projects_index` collection, urlPattern `/projects`, two fields, entry `projects-index` published      | helper: same calls                                                                   |
| about fields `heading_line_1`, `heading_line_2`, `heading_accent`, `excerpt`, values set and published | helper: `createField`, `update`, `publish`                                           |
| `settings.seo.titleSeparator`                                                                          | helper: `POST /settings`                                                             |
| `emdash-env.d.ts`                                                                                      | dev server regenerated it automatically on the schema change                         |
| MCP                                                                                                    | not used (the executor had no EmDash MCP tools)                                      |
| admin                                                                                                  | not used                                                                             |

## Gate and proof results

- `emdash seed .emdash/seed.json --validate`: valid.
- Seed gate: `seed-delta: OK`. It covers collections, supports, field sets, counts, baseline strings, about fields keeping their values, projects, taxonomies, menus and identity settings equal to `77a570d`, all entries published, no `url` setting, and neither `dev@emdash.local` nor `Dev Admin` present anywhere in the seed.
- Fresh rebuild: seeded `.emdash/seed.json` into a new temp directory (4 collections, 30 fields, 54 terms, 16 content entries, 4 settings), exported again, and the normalized comparison was equal. Log: `~/portfolio-baseline/current/phase3/round-trip.log`.
- `npx astro check`: 0 errors, 0 warnings, 0 hints (32 files).
- Guard: `check: 17/17 passed`. Parity: `parity: 17/17 identical`. The delta changed no public page.
- `git check-ignore` confirms `.emdash/types.ts` and `.emdash/schema.json` are ignored.

## Task Commits

1. **Task 1:** no commit (no repo files change by design).
2. **Task 2:** checkpoint, no commit.
3. **Task 3:** `fd56e37` feat(03-04): add home and projects_index, About heading fields, seo support and title separator

## Deviations from Plan

None - plan executed exactly as written.

Two observations, neither a deviation:

- The re-exported `.emdash/seed.json` shows a large diff against the previous file (about 3800 lines changed). The gate compares projects, taxonomies, menus and identity settings against `77a570d` semantically and they match, so the diff is re-serialization by the exporter rather than content change. I did not diff it line by line.
- The two deletions in the commit (`.emdash/types.ts`, `.emdash/schema.json`) are intentional (IN-03).

## Authentication Gates

The dev-bypass endpoint was run by the user, which completed setup. It created a "Dev Admin" user (`dev@emdash.local`) in the gitignored `data/emdash.db`. This is expected: `export-seed` writes schema and content only, and the gate confirmed that neither the name nor the email appears in the committed seed.

## Issues Encountered

None. A single Bash command that combined an em dash grep with a temp-directory cleanup was denied by the permission system and was re-run without those parts. The temp directory from the guard run was left in the OS temp area.

## Known Stubs

None.

## Threat Flags

None. No new network endpoint, auth path or trust-boundary file access was added by this plan.

## Safety Notes

- No dev server was started or stopped by Claude. The user was told the dev server can be stopped now that the export is done.
- The one-off helper, tokens and everything under `data/` stay out of git. Nothing was pushed.
- The working database `data/emdash.db` now holds the delta plus the Dev Admin user. The committed seed alone rebuilds the schema and content.

## Next Phase Readiness

Ready for plan 03-05: the home and projects_index entries, the About heading and excerpt fields, and the seeded title separator exist and are typed in `emdash-env.d.ts`, so the templates can read them.

## Self-Check: PASSED

- `.emdash/seed.json`, `emdash-env.d.ts`, `.gitignore` present; `.emdash/types.ts` and `.emdash/schema.json` absent: verified.
- Commit `fd56e37` is an ancestor of HEAD: verified.
- `~/portfolio-baseline/current/phase3/pre-delta-emdash.db` exists and passed the integrity check.
