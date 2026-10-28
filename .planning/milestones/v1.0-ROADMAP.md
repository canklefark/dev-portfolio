# Roadmap: Portfolio

## Overview

This milestone moves the portfolio's content out of hand-edited markdown in git and into EmDash on self-hosted Node with SQLite (Dokploy), so content is edited in a browser admin or by Claude. It starts with a spike that settles the open platform questions and captures a baseline of the current site. Then it builds the content model and imports everything with a verified match, rewires the public pages to read from EmDash with no visible change and no new JavaScript, and proves agent access locally. After that it deploys the site to a Dokploy Node container with a claimed, passkey-protected admin, and it finishes by proving the live editing loop and updating the docs. In every phase the public pages stay fast, readable and identical to today.

## Milestones

- 🚧 **v1.0 EmDash Migration** - Phases 1-6 (in progress)

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Spike, Baseline and Decisions** - Pin dependencies, capture the current site as a baseline, and settle the platform questions with measurements (completed 2026-10-23)
- [x] **Phase 2: Content Model and Import** - Build the EmDash schema and import all 13 projects, About, nav and settings with a zero-diff parity report (completed 2026-10-26)
- [x] **Phase 3: Read Path Rewire and Parity** - Public pages read from EmDash, look identical, ship no new JavaScript, and the markdown sources are gone (completed 2026-10-26)
- [x] **Phase 4: Agent Access** - Claude manages content through MCP or CLI with a draft-first token that cannot touch the schema (completed 2026-10-26)
- [x] **Phase 5: Dokploy Deploy and Cutover** - dev.zeikcookson.com is served by a Dokploy Node container with SQLite on a persistent volume, a claimed passkey admin, and migration-safe deploys (completed 2026-10-28)
- [x] **Phase 6: Live Editing and Docs** - The live site is edited from the admin end to end, and the repo docs describe the new workflow (completed 2026-10-28)

## Phase Details

### Phase 1: Spike, Baseline and Decisions

**Goal**: The open platform questions are answered with measured evidence, and the current site is captured as a baseline before anything about it changes
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04
**Success Criteria** (what must be TRUE):

1. A baseline of the current built HTML (home, projects index, all 13 project pages, About, 404) and a per-route script inventory exist outside the repo, captured before any dependency changes
2. `astro build` passes on the pinned set (Astro 6.4.x, EmDash 1.3.x, `@astrojs/node` standalone adapter, React 19), a Docker image builds locally, and its pages match the baseline in content and scripts, so the live site is unchanged
3. `package.json` and the build environment both require Node 22.22.2 or later (raised from 22.16 in Phase 1 because EmDash dependency @emdash-cms/registry-verification needs ^22.22.2)
4. PROJECT.md records written decisions, backed by a local spike, on whether core EmDash runs on Node + SQLite without extras, passkey enrollment (two passkeys) and the recovery path, Node 24 compatibility, media storage on Node, and the confirmed EmDash API names
5. Each open research tension (media storage, tags storage, stats placement, EmDash version, public JS baseline) has a recorded decision or is named as a gate in the phase that settles it

**Plans**: 5/5 plans complete

Plans:
**Wave 1**

- [x] 01-01-PLAN.md: Baseline from main, branch emdash-migration, parity compare tooling and the derived public-script allowlist

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 01-02-PLAN.md: Package-legitimacy approval, pinned EmDash stack on the Node standalone adapter with baseline parity, audit and API-name evidence

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 01-03-PLAN.md: Multi-stage Node 24 Docker image with HTTP parity, and the Node 22.22.2 floor enforced by engine-strict

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 01-04-PLAN.md: Passkey, media and DB-level recovery spike on the branch build

**Wave 5** _(blocked on Wave 4 completion)_

- [x] 01-05-PLAN.md: Spike decisions, tensions and named gates recorded in PROJECT.md, plus the phase exit check

### Phase 2: Content Model and Import

**Goal**: Every piece of editable content (13 projects, About, nav, site settings) lives in EmDash locally, in a schema that fits it, with a verified field-for-field match to the markdown sources
**Depends on**: Phase 1
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, MIGR-01, MIGR-02, MIGR-03, MIGR-04
**Success Criteria** (what must be TRUE):

1. In the local admin, a project's status, status variant, time label, date, tags and stats rows (label, value, variant) can each be edited, and a test entry holding the longest existing project body edits and saves cleanly before the import runs
2. The About entry holds everything the About and home pages read today from `src/data/about.*` (body copy, role, stat cells, stack, contacts, availability flag), and the primary nav menu and the General, Social and SEO settings are editable in the admin
3. Running the import script twice leaves exactly 13 projects (slugs equal to current file names, explicit dates, drafts still drafts) and one About entry, with no duplicates and no copy changes
4. A field-by-field equality report shows zero differences in copy, dates, order, tags, stats and status against the source markdown
5. Generated types are committed, and the committed seed file rebuilds the same schema and content in a fresh local database

**Plans**: 4/4 plans complete

Plans:
**Wave 1**

- [x] 02-01-PLAN.md: Four schema and seed decisions (tags editor, settings values, committed type files, long-body test), then the projects tracer from markdown through emdash seed to a read-only equality report

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 02-02-PLAN.md: About entry, primary menu and settings, plus throwaway-database tests for drafts, empty lists, idempotency and verifier failure

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 02-03-PLAN.md: Schema-check database with the longest body, the user's local admin edit test, and generated types

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 02-04-PLAN.md: Clean import twice with a zero-difference report, the committed seed with a fresh-rebuild proof, and public-site parity

### Phase 3: Read Path Rewire and Parity

**Goal**: Visitors get the same site they get today, now served from EmDash, with the markdown sources removed and no new JavaScript on any public page
**Depends on**: Phase 2
**Requirements**: REND-01, REND-02, REND-03, REND-04, REND-05, ADMIN-01, GUARD-01
**Success Criteria** (what must be TRUE):

1. Home, the projects index (newest first), every project page and About render from EmDash and match the baseline in copy and layout in light and dark, including long-form body styling
2. Nav and head metadata come from EmDash, and a request for a project slug that does not exist returns a real 404 status with the existing 404 page
3. `src/content/projects/`, `src/data/about.*` and the file collection are deleted in the same change that flips the read path, and the build still passes
4. The admin loads at `/_emdash/admin`, and none of its JavaScript reaches a public route
5. A CI check fails when any public route gains a script, `modulepreload` or module tag beyond the recorded baseline, shown by a deliberate failing case

**Plans**: 6/6 plans complete
**UI hint**: yes

Plans:
**Wave 1**

- [x] 03-01-PLAN.md: Tracer: project pages from EmDash on the server build with a real 404, proven by the public-JS guard core; project lists flipped and the project markdown, file collection and import tooling deleted in the same commit

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 03-02-PLAN.md: Long-form body parity (smart punctuation, heading ids, link spacing) and og:url from the configured site

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 03-03-PLAN.md: Canonicalizing parity command (17 of 17), guard coverage (crawl, draft and id-form 404s, admin route), committed failing case, npm scripts and the GitHub Actions workflow

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 03-04-PLAN.md: Home and projects index singletons, About heading fields, SEO support and the title separator added through EmDash on the user's dev server, re-exported seed, single generated types file

**Wave 5** _(blocked on Wave 4 completion)_

- [x] 03-05-PLAN.md: Head metadata and nav from EmDash (settings, primary menu, getSeoMeta with panel overrides)

**Wave 6** _(blocked on Wave 5 completion)_

- [x] 03-06-PLAN.md: Home hero and About from EmDash with src/data/about.* deleted in the same commit, then the light and dark visual sign-off

### Phase 4: Agent Access

**Goal**: Claude can manage portfolio content through EmDash's MCP server or CLI, using a token that writes drafts for the user to publish and cannot change the schema
**Depends on**: Phase 3
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04
**Success Criteria** (what must be TRUE):

1. A personal access token scoped to content read and write, media and menus, with no schema or admin scope, authenticates against the MCP endpoint
2. Claude updates a project card through MCP or CLI, the change lands as a draft, and it appears on the rendered page only after an explicit publish
3. A schema-changing call made with the agent token is refused
4. Following the documented Claude Code MCP setup from a clean session produces a working connection, with the endpoint URL set per environment

**Plans**: 3/3 plans complete

Plans:
**Wave 1**

- [x] 04-01-PLAN.md: Tracer: committed .mcp.json to the registered PreToolUse guard hook; deny rules for the publish-class and taxonomy-definition tools, the content_update draft-only allowlist and the content_create rules, all tested offline in npm test

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 04-02-PLAN.md: README Agent access section (token, connection, guard boundaries, CLI fallback with --draft, rotation, residual risk) and the AGENT-01 and AGENT-02 wording amendment

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 04-03-PLAN.md: Live evidence pass on the user's dev server: negative control, clean-session connection from the README, draft then publish on a throwaway card, schema and publish refusals, independent token and cleanup checks

### Phase 5: Dokploy Deploy and Cutover

**Goal**: dev.zeikcookson.com is served by a Dokploy Node container with SQLite on a persistent volume, the admin is claimed and protected by a passkey, and CI catches a pending migration before the owner deploys by hand
**Depends on**: Phase 4
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, ADMIN-02, ADMIN-03, GUARD-02, GUARD-03
**Success Criteria** (what must be TRUE):

1. The site built by Dokploy from the repo Dockerfile and served on `dev.zeikcookson.com` matches the baseline in content and scripts, checked on the live hostname with the record DNS only and again behind the Cloudflare proxy (17 of 17 pages identical with the record DNS only; behind the proxy 16 of 17 identical, the one difference being the Cloudflare-injected email-decode script on /about, with the public-JS allowlist otherwise passing; Email Address Obfuscation stays on, accepted by the owner 2026-10-27, amended 2026-10-28 to match REQUIREMENTS.md DEPLOY-03)
2. `dev.zeikcookson.com` serves the Dokploy app with SQLite and uploads on a persistent volume (the media storage chosen in Phase 1), the old site is torn down, content and the passkey survive the redeploy from `main`, and Cloudflare proxies the hostname with SSL/TLS Full (strict) while the Dokploy app is still shown to be the one answering
3. Visiting the admin on production shows the login page, not the setup wizard, and the one enrolled passkey signs in (the two-passkey requirement was dropped by the user on 2026-10-27; the lockout risk is recorded and the recovery procedure was rehearsed locally in Phase 1)
4. EmDash applies pending migrations on the first request after a deploy, CI fails while a migration is pending or when the committed migration manifest differs from the build, the owner deploys by clicking Deploy in Dokploy (the app builds `main`, Auto Deploy is off, there is no deploy pipeline: user decision 2026-10-27), and a smoke test run by hand after each deploy confirms `/` and one project page return 200
5. A SQLite backup in the Cloudflare R2 bucket has been restored once into a non-production instance, and the restored content matches production

**Plans**: 5/5 plans complete

Plans:
**Wave 1**

- [x] 05-01-PLAN.md: Tracer: deploy.yml to the Dokploy trigger-and-wait script to the smoke test (GUARD-03, D-04), proven against local stand-ins, then every failure mode tested. Superseded 2026-10-27: the deploy workflow and the Dokploy script are removed in 05-04; the smoke test (scripts/smoke-test.mjs) stays as the manual post-deploy check
- [x] 05-02-PLAN.md: Tracer: GUARD-02 seeded-database migrate check and the committed-manifest drift gate in CI, the Dockerfile EMDASH_SITE_URL build argument, and DEPLOY-02, criterion 4 and D-02 brought in line with the user's decisions

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 05-03-PLAN.md: Finish the evidence for the production deploy that already runs (Dokploy app on its own volume, DNS only record, wizard claimed with Sample content, one passkey): baseline parity 17/17 and the public-JS allowlist at the origin, the malformed Host check and the origin response headers; the panel facts, secrets, deploy script run and tag probe of the earlier revision are dropped

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 05-04-PLAN.md: Remove the unused pipeline code (deploy.yml, the Dokploy script and its test), then the user merges and pushes `main`, points the app at `main`, clicks Deploy, runs the smoke test, sets Cloudflare to Full (strict) with Always Use HTTPS off and proxies the record, and checks passkey sign-in and the OAuth MCP connection; the executor records ci on main, the health route, parity 17/17 behind the proxy and the manual deploy and rollback rule

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 05-05-PLAN.md: Nightly Cloudflare R2 volume backup, one restore into a new volume with a scratch app (no domain) compared with production by doctor and page hashes, scratch discarded, named gates closed and what is not covered written down

### Phase 6: Live Editing and Docs

**Goal**: The user edits the live site from the admin instead of git, and the repo docs describe the workflow that replaced hand-edited markdown
**Depends on**: Phase 5
**Requirements**: ADMIN-04, ADMIN-05, DOCS-01, DOCS-02, DOCS-03
**Success Criteria** (what must be TRUE):

1. On the deployed site, a real project is edited as a draft, previewed, and published so its public page updates with no rebuild or git push, then restored to its previous revision
2. A shareable preview link opens a draft entry in a signed-out browser while the public page still shows the published version
3. CLAUDE.md covers the Dokploy deploy (the owner clicks Deploy in Dokploy, a push to `main` runs CI only, and the smoke test runs after each deploy), the Node version, admin-only client JS, the "no new JS" rule, the no-plugins rule and content edited in EmDash, and the README walks through the new local and deploy workflow including the manual deploy steps and the rollback rule
4. The `portfolio-update` skill and every doc that still describes the markdown workflow are updated or flagged, and nothing in the repo points at the removed content files

**Plans**: 4/4 plans complete

Plans:
**Wave 1**

- [x] 06-01-PLAN.md: Open Question 6 decision, then the tracer (production baseline H0 for catalog-cms and the procedure in 06-EVIDENCE.md), then the owner and a Claude Code session run draft, preview, publish, one agent draft over OAuth MCP, restore and a second publish back to H0 (ADMIN-04, ADMIN-05)

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 06-02-PLAN.md: README replaced (local dev, editing content, manual deploy, rollback), Open Question 1 decision, then the Agent access section and the surgical CLAUDE.md additions (DOCS-01, DOCS-02)
- [x] 06-03-PLAN.md: Friend intake doc and the portfolio-update skill removed, the owner removes the ~/.zshrc lines and rewrites the stale dev-portfolio card, then scripts/log.sh deleted (DOCS-03)

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 06-04-PLAN.md: D-13 sweep and the DOCS-03 rows in 06-EVIDENCE.md, Open Questions 3 and 4 decision, then the specs and skills dispositions applied and the phase regression checks (DOCS-03)

## Progress

**Execution Order:**
Phases execute in numeric order: 1, 2, 3, 4, 5, 6

| Phase                            | Plans Complete | Status      | Completed  |
| -------------------------------- | -------------- | ----------- | ---------- |
| 1. Spike, Baseline and Decisions | 5/5            | Complete    | 2026-10-23 |
| 2. Content Model and Import      | 4/4            | Complete    | 2026-10-26 |
| 3. Read Path Rewire and Parity   | 6/6            | Complete    | 2026-10-26 |
| 4. Agent Access                  | 3/3            | Complete    | 2026-10-26 |
| 5. Dokploy Deploy and Cutover    | 5/5            | Complete    | 2026-10-28 |
| 6. Live Editing and Docs         | 4/4 | Complete    | 2026-10-28 |
