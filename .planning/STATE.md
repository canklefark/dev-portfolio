---
gsd_state_version: "1.0"
milestone: v1.0
milestone_name: EmDash Migration
current_phase: 05
current_phase_name: Dokploy Deploy and Cutover
current_plan: 4
status: executing
stopped_at: 05-04 Tasks 1 and 3 done, C8 to C10 open pending four user reports (Dokploy source, SSL/TLS mode, Always Use HTTPS, passkey) and missing cf-ray
last_updated: "2026-10-27T17:00:38.839Z"
last_activity: 2026-10-27
last_activity_desc: Phase 05 execution started
state_head: 513e244e46a5bc45e963d5467a2d173158ec397d
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 23
  completed_plans: 21
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-10-26)

**Core value:** A hiring manager lands on an honest, fast, distinctive site that makes the project work carry the argument.
**Current focus:** Phase 05 — Dokploy Deploy and Cutover

## Current Position

Phase: 05 (Dokploy Deploy and Cutover) — EXECUTING
Current Plan: 4
Total Plans in Phase: 5
Status: Ready to execute
Last activity: 2026-10-27 — Phase 05 execution started

Progress: [███████░░░] 67%

## Performance Metrics

**Velocity:**

- Total plans completed: 18
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
| ----- | ----- | ----- | -------- |
| 01    | 5     | -     | -        |
| 02    | 4     | -     | -        |
| 03    | 6     | -     | -        |
| 4     | 3     | -     | -        |

**Recent Trend:**

- Last 5 plans: none yet
- Trend: -

_Updated after each plan completion_
**Per-Plan Metrics:**

| Plan         | Duration        | Tasks   | Files    |
| ------------ | --------------- | ------- | -------- |
| Phase 01 P01 | 6 min           | 2 tasks | 3 files  |
| Phase 01 P02 | 8min            | 3 tasks | 5 files  |
| Phase 01 P03 | 45min           | 2 tasks | 7 files  |
| Phase 01 P04 | 9min            | 2 tasks | 0 files  |
| Phase 01 P05 | 6 min           | 2 tasks | 1 files  |
| Phase 02 P01 | 5 min           | 2 tasks | 7 files  |
| Phase 02 P02 | 7 min           | 2 tasks | 8 files  |
| Phase 02 P03 | 45 min          | 3 tasks | 14 files |
| Phase 02 P04 | 2 min           | 2 tasks | 1 files  |
| Phase 03 P01 | 4 min           | 2 tasks | 30 files |
| Phase 03 P02 | 4 min           | 2 tasks | 9 files  |
| Phase 03 P03 | 9 min           | 3 tasks | 9 files  |
| Phase 03 P04 | 9 min           | 3 tasks | 5 files  |
| Phase 03 P05 | 5 min           | 2 tasks | 8 files  |
| Phase 03 P06 | about 1 session | 2 tasks | 5 files  |
| Phase 04 P01 | 5 min           | 2 tasks | 4 files  |
| Phase 04 P02 | 6 min           | 2 tasks | 2 files  |
| Phase 04 P03 | 15 min          | 3 tasks | 1 files  |
| Phase 05 P01 | 3 min           | 2 tasks | 5 files  |
| Phase 05 P02 | 3 min           | 2 tasks | 7 files  |
| Phase 05 P03 | 8 min | 2 tasks | 1 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Schema and content import share Phase 2. The schema is locked (long entry tested in the admin) before the import runs.
- [Roadmap]: GUARD-01 lands with the read-path rewire (Phase 3). GUARD-02 and GUARD-03 land with the Dokploy deploy (Phase 5; the original Workers wording is obsolete).
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
- [Phase 03]: 03-05: pageMeta wraps getSeoMeta and returns the full title for title, og:title and twitter:title; Layout reads getMenu(primary) and settings, EmDashHead stays unused; loadSingleton pins getEmDashEntry<K, EmDashCollections[K]>
- [Phase 03]: AboutPage keeps the raw about entry as source so an editor's SEO panel value reaches pageMeta, matching ProjectDetail
- [Phase 04]: 04-01: nine emdash tools guarded by bare-name deny rules plus hook BLOCKED_TOOLS; content_update uses a draft-only key allowlist, content_create allows status draft only; schema and settings tools deferred to the server (AGENT-03)
- [Phase 04]: 04-02: README Agent access section documents the setup and states the residual risk (publish block is a Claude Code guard, token can itself publish); AGENT-01 and AGENT-02 amended, traceability rows stay Pending until 04-03
- [Phase 04]: 04-03: live pass shows E1, E3, E4, E5 and the E2 negative control; E6 (guard live) and E7 (fresh README session) NOT VERIFIED; token created with a 7 day expiry (deviation from D-07); AGENT-02 amendment (D-03) shown live
- [Phase 05]: 05-01: Dokploy trigger-and-wait lives in a tested Node script (scripts/dokploy-deploy.mjs), not inline curl and jq
- [Phase 05]: 05-01: deploy.yml job runs only for a successful push-triggered ci run on main of this repository or a dispatch on main (T-05-01). Superseded 2026-10-27: deploys are manual (D-15 superseded), so deploy.yml, scripts/dokploy-deploy.mjs and its test are removed in plan 05-04 before main is pushed
- [Phase 05]: 2026-10-27 second plan revision: tag deploys with a CI gate (D-15), Cloudflare proxy on after the first deploy with SSL/TLS Full (strict) (D-16), backups to Cloudflare R2 (D-17). Tag deploys and the agent token were superseded by the fourth revision below; the proxy and R2 backups stay
- [Phase 05]: 2026-10-27 fourth plan revision (simplification, user: "I just want this done"): manual deploys, the owner clicks Deploy in Dokploy with Auto Deploy off and runs scripts/smoke-test.mjs by hand; no pipeline, no Dokploy API key, no GitHub secrets, no tag probe, no paths-ignore; one passkey is enough (D-09 amended, lockout risk recorded); agent access is OAuth to .mcp.json with no Phase 5 work (D-12 superseded); the phase has 5 plans: 05-03 finishes the evidence, 05-04 removes the dead pipeline code then merges and pushes main (user), repoints the app and turns the proxy on, 05-05 sets up R2 backups and the restore drill
- [Phase 05]: 2026-10-27: the live origin already sends x-content-type-options, referrer-policy, x-frame-options and a permissions-policy (EmDash), so the Cloudflare Transform Rule of the second revision is dropped (D-11)
- [Phase 05]: 05-02: manifest gate (git diff --exit-code on committed .emdash/migrations.json) carries the real migration-change signal; seeded migrate --check cannot show a pending migration on a fresh database
- [Phase 05]: One replica and Dokploy's default stop-first update order are assumed, not read from the panel (05-03)

### Pending Todos

None yet.

### Blockers/Concerns

- [Roadmap]: Cloudflare Pages is dropped (2026-10-27), so `main` no longer auto-deploys anywhere. A push to `main` runs CI only; the owner deploys by clicking Deploy in Dokploy (D-15 superseded). Never push or merge without the user's go-ahead.
- [Roadmap]: CI exists (`.github/workflows/ci.yml`: GUARD-01 from Phase 3, GUARD-02 and the manifest gate from plan 05-02). The deploy workflow committed in plan 05-01 is removed in plan 05-04 before `main` is pushed, because a deploy workflow on the default branch would start after every CI run. The smoke test (GUARD-03) is run by hand after each deploy.
- [Phase 05]: One passkey is enrolled (user decision 2026-10-27), so a lost device is a lockout until the SQLite recovery procedure in PROJECT.md is run; that procedure was rehearsed locally in Phase 1 and is not rehearsed in the production container.
- [Phase 05]: The first Let's Encrypt renewal behind the Cloudflare proxy (around 2026-12-26) is not exercised in the phase; the fallback is to set the record DNS only, let Traefik renew and proxy it again.
- [Roadmap]: The FOUND-02 baseline lives outside the repo, but the GUARD-01 check runs in CI. Commit a derived allowlist of public scripts, not the baseline HTML.
- [Roadmap]: The home page reads `showAvailability` from `src/data/about`. The Phase 2 `about` entry must hold the availability flag, role, stack and contacts as well as copy and cells, or REND-05 breaks the home page.
- [Roadmap]: Page titles in five templates use an em dash separator. Parity (REND-04) keeps them; the no-em-dash copy rule says otherwise. Changing them is a separate copy decision.
- [Roadmap]: Local admin and MCP checks in Phases 2 to 4 need a running local server. Ask the user before starting `astro dev` or `astro preview`.
- [Roadmap]: Markdown edits made before Phase 3 need a re-run of the idempotent import before the read path flips. After Phase 3, `/portfolio-update` writes files that no longer drive the site (DOCS-03 fixes or flags it).
- [Roadmap]: The old Cloudflare Pages project is not kept as a rollback target (2026-10-27) and no longer exists, so no stale custom domain can remain on it.
- [Research]: Plan Phases 1, 2 (import), 4 and 5 with deeper research. Phases 3 and 6 follow standard patterns.

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
| -------- | ---- | ------ | ----------- | --------- |
| _(none)_ |      |        |             |           |

## Session Continuity

Last session: 2026-10-27T17:00:38.586Z
Stopped at: 05-04 Tasks 1 and 3 done, C8 to C10 open pending four user reports (Dokploy source, SSL/TLS mode, Always Use HTTPS, passkey) and missing cf-ray
Resume file: None
