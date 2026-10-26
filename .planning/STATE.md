---
gsd_state_version: "1.0"
milestone: v1.0
milestone_name: EmDash Migration
current_phase: 03
current_phase_name: Read Path Rewire and Parity
status: executing
stopped_at: Completed 03-04-PLAN.md
last_updated: "2026-10-26T16:31:56.733Z"
last_activity: 2026-10-26
last_activity_desc: Phase 02 complete, transitioned to Phase 3
state_head: fd56e371e190cd0b6404976ac4fc08f73311f13c
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 15
  completed_plans: 13
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-23)

**Core value:** A hiring manager lands on an honest, fast, distinctive site that makes the project work carry the argument.
**Current focus:** Phase 02 — Content Model and Import

## Current Position

Phase: 03 (Read Path Rewire and Parity) — READY TO EXECUTE
Plan: Not started
Status: Ready to execute
Last activity: 2026-10-26 — Phase 02 complete, transitioned to Phase 3

Progress: [███░░░░░░░] 33%

## Performance Metrics

**Velocity:**

- Total plans completed: 9
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
| ----- | ----- | ----- | -------- |
| 01 | 5 | - | - |
| 02 | 4 | - | - |

**Recent Trend:**

- Last 5 plans: none yet
- Trend: -

_Updated after each plan completion_
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 6 min | 2 tasks | 3 files |
| Phase 01 P02 | 8min | 3 tasks | 5 files |
| Phase 01 P03 | 45min | 2 tasks | 7 files |
| Phase 01 P04 | 9min | 2 tasks | 0 files |
| Phase 01 P05 | 6 min | 2 tasks | 1 files |
| Phase 02 P01 | 5 min | 2 tasks | 7 files |
| Phase 02 P02 | 7 min | 2 tasks | 8 files |
| Phase 02 P03 | 45 min | 3 tasks | 14 files |
| Phase 02 P04 | 2 min | 2 tasks | 1 files |
| Phase 03 P01 | 4 min | 2 tasks | 30 files |
| Phase 03 P02 | 4 min | 2 tasks | 9 files |
| Phase 03 P03 | 9 min | 3 tasks | 9 files |
| Phase 03 P04 | 9 min | 3 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Schema and content import share Phase 2. The schema is locked (long entry tested in the admin) before the import runs.
- [Roadmap]: GUARD-01 lands with the read-path rewire (Phase 3). GUARD-02 and GUARD-03 land with the Workers deploy (Phase 5).
- [Roadmap]: Agent access is proven locally (Phase 4) before the MCP endpoint goes public (Phase 5).
- [Roadmap]: Draft, preview, publish, revision restore and preview links are exercised on the deployed site (Phase 6).
- [Phase 01]: Baseline captured at main f4e5470 (Node 24.17.0, astro 6.2.2) in ~/portfolio-baseline/2026-10-23; all later parity is judged against it via scripts/script-inventory.mjs
- [Phase 01]: Allowlist scripts/script-allowlist.json is derived from the baseline inventory and committed; .emdash/migrations.json is not committed (revisit with GUARD-02 in Phase 5)
- [Phase 01]: Stay on Astro 6.4.x with explicit majors; four residual npm advisories (astro, @astrojs/node, sharp, esbuild) recorded for plan 01-05 to become a named gate
- [Phase 01]: Stack.astro 'as' prop typed as HTMLTag because @types/react (from @astrojs/react) rejects class on a string-typed dynamic tag
- [Phase 01]: data/ must exist before EmDash opens SQLite; Phase 5 image must create and own it at the baked relative path
- [Phase 01]: Node floor raised to >=22.22.2 (user decision A): @emdash-cms/registry-verification@0.3.4 needs ^22.22.2 || ^24.15.0 || >=26; .npmrc engine-strict copied into Docker dependency stages
- [Phase 01]: Two passkeys sign in independently on EmDash 1.3.1 (internal and usb virtual authenticators, counters move only on the answering one); the credentials table has no rp id column, so rpId localhost is read from the authenticator
- [Phase 01]: No-email recovery is a tested SQL procedure: stop server, sqlite3 .backup, integrity_check ok, DELETE users and emdash:setup_complete/setup_state with foreign_keys ON; schema and media survive and the wizard re-prompts site title and tagline
- [Phase 01]: Media gate for Phase 5: cookie-authenticated writes need X-EmDash-Request (403 CSRF_REJECTED without it); uploads are served anonymously with a sandbox CSP and Range 206
- [Phase 01]: Astro 6 residual npm audit advisories are a named gate before the Phase 5 cutover; extra recovery path (GitHub login versus ingress block) is a Phase 5 gate
- [Phase 02]: Q1 = 1a: tags are a multiSelect over the 45 sorted source tags (admin-editable, string[] stored)
- [Phase 02]: Q2 = 2a: seed title, tagline and two socials; leave seo.titleSeparator and url unset (no em dash in new copy)
- [Phase 02]: Q3 = 3a: commit .emdash/types.ts, .emdash/schema.json and emdash-env.d.ts
- [Phase 02]: Q4 = 4a: long-body admin test on a seeded draft entry before the import, then rebuild data/
- [Phase 02]: 02-02: Settings follow Q2 2a (title, tagline, two socials; no url, no seo key); About cells without a variant store default; schema verifier requires collections exactly about and projects
- [Phase 02]: D-07 amended: project date is a native datetime at midnight UTC (user, admin date picker)
- [Phase 02]: D-05 and D-09 amended: category and tags are EmDash taxonomies (category hierarchical 9 terms, tag flat 45 terms) attached to projects; supersedes Q1 = 1a
- [Phase 02]: EmDash lists terms in term order, so tag order per project is not preserved; accepted as a Phase 3 decision
- [Phase 02]: 02-04: the seed was exported from a database rebuilt from the sources and verified at zero differences, then proven by a fresh rebuild (232/232 checks, 0 differences); the committed seed carries title, tagline and social settings only
- [Phase 03]: 03-01: getProject returns null unless entry.id equals the slug (database ids never serve a project); D-03 met through entry.data.terms hydrated by the batched term loader
- [Phase 03]: 03-01: guard check-public-js seeds a mkdtemp database and serves dist/server/entry.mjs on 127.0.0.1; repo data/ never touched; D-08 deletions landed with the list flip in 79f619c
- [Phase 03]: 03-02: heading ids slugged from raw span text with one GithubSlugger per body; smart punctuation per span via retext-smartypants on non-code spans; og:url from Astro.site with canonicalPath /404/ pinned
- [Phase 03]: 03-03: parity canonicalizer fixed to five rules (CSS counts reported, scripts strict); guard crawls /projects/ with a /projects/* allowlist wildcard and asserts five 404 cases, the admin hop and no /_emdash/ on public pages; CI job verify pinned to actions v7, first GitHub run pending push approval
- [Phase 03]: 03-04: EmDash delta applied via one-off EmDashClient helper (devBypass) outside the repo, then export-seed; seed never hand-edited; emdash-env.d.ts is the only committed generated types file

### Pending Todos

None yet.

### Blockers/Concerns

- [Roadmap]: `main` auto-deploys to Cloudflare Pages. From Phase 2 on the build targets server output, so this work stays on a branch (or unpushed) until the Phase 5 cutover. Never push without the user's go-ahead.
- [Roadmap]: No CI exists yet (no `.github/`). Phase 3 creates the first CI check (GUARD-01). Phase 5 picks the deploy mechanism and should run GUARD-02 and GUARD-03 in the same pipeline.
- [Roadmap]: The FOUND-02 baseline lives outside the repo, but the GUARD-01 check runs in CI. Commit a derived allowlist of public scripts, not the baseline HTML.
- [Roadmap]: The home page reads `showAvailability` from `src/data/about`. The Phase 2 `about` entry must hold the availability flag, role, stack and contacts as well as copy and cells, or REND-05 breaks the home page.
- [Roadmap]: Page titles in five templates use an em dash separator. Parity (REND-04) keeps them; the no-em-dash copy rule says otherwise. Changing them is a separate copy decision.
- [Roadmap]: Local admin and MCP checks in Phases 2 to 4 need a running local server. Ask the user before starting `astro dev` or `astro preview`.
- [Roadmap]: Markdown edits made before Phase 3 need a re-run of the idempotent import before the read path flips. After Phase 3, `/portfolio-update` writes files that no longer drive the site (DOCS-03 fixes or flags it).
- [Roadmap]: Deleting the Pages project is not a v1 requirement. Decide after the rollback window (DEPLOY-04).
- [Research]: Plan Phases 1, 2 (import), 4 and 5 with deeper research. Phases 3 and 6 follow standard patterns.

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
| -------- | ---- | ------ | ----------- | --------- |
| _(none)_ |      |        |             |           |

## Session Continuity

Last session: 2026-10-26T16:31:56.604Z
Stopped at: Completed 03-04-PLAN.md
Resume file: None
