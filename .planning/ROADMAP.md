# Roadmap: Portfolio

## Overview

This milestone moves the portfolio's content out of hand-edited markdown in git and into EmDash on self-hosted Node with SQLite (Dokploy), so content is edited in a browser admin or by Claude. It starts with a spike that settles the open platform questions and captures a baseline of the current site. Then it builds the content model and imports everything with a verified match, rewires the public pages to read from EmDash with no visible change and no new JavaScript, and proves agent access locally. After that it moves hosting from Pages to a Dokploy Node container with a claimed, passkey-protected admin, and it finishes by proving the live editing loop and updating the docs. In every phase the public pages stay fast, readable and identical to today.

## Milestones

- 🚧 **v1.0 EmDash Migration** - Phases 1-6 (in progress)

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Spike, Baseline and Decisions** - Pin dependencies, capture the current site as a baseline, and settle the platform questions with measurements (completed 2026-10-23)
- [x] **Phase 2: Content Model and Import** - Build the EmDash schema and import all 13 projects, About, nav and settings with a zero-diff parity report (completed 2026-10-26)
- [ ] **Phase 3: Read Path Rewire and Parity** - Public pages read from EmDash, look identical, ship no new JavaScript, and the markdown sources are gone
- [ ] **Phase 4: Agent Access** - Claude manages content through MCP or CLI with a draft-first token that cannot touch the schema
- [ ] **Phase 5: Dokploy Deploy and Cutover** - dev.zeikcookson.com moves to a Dokploy Node container with SQLite on a persistent volume, a claimed passkey admin, and migration-safe deploys
- [ ] **Phase 6: Live Editing and Docs** - The live site is edited from the admin end to end, and the repo docs describe the new workflow

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

**Plans**: 3/6 plans executed
**UI hint**: yes

Plans:
**Wave 1**

- [x] 03-01-PLAN.md: Tracer: project pages from EmDash on the server build with a real 404, proven by the public-JS guard core; project lists flipped and the project markdown, file collection and import tooling deleted in the same commit

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 03-02-PLAN.md: Long-form body parity (smart punctuation, heading ids, link spacing) and og:url from the configured site

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 03-03-PLAN.md: Canonicalizing parity command (17 of 17), guard coverage (crawl, draft and id-form 404s, admin route), committed failing case, npm scripts and the GitHub Actions workflow

**Wave 4** _(blocked on Wave 3 completion)_

- [ ] 03-04-PLAN.md: Home and projects index singletons, About heading fields, SEO support and the title separator added through EmDash on the user's dev server, re-exported seed, single generated types file

**Wave 5** _(blocked on Wave 4 completion)_

- [ ] 03-05-PLAN.md: Head metadata and nav from EmDash (settings, primary menu, getSeoMeta with panel overrides)

**Wave 6** _(blocked on Wave 5 completion)_

- [ ] 03-06-PLAN.md: Home hero and About from EmDash with src/data/about.* deleted in the same commit, then the light and dark visual sign-off

### Phase 4: Agent Access

**Goal**: Claude can manage portfolio content through EmDash's MCP server or CLI, using a token that writes drafts and publishes on request but cannot change the schema
**Depends on**: Phase 3
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04
**Success Criteria** (what must be TRUE):

1. A personal access token scoped to content read and write, media and menus, with no schema or admin scope, authenticates against the MCP endpoint
2. Claude updates a project card through MCP or CLI, the change lands as a draft, and it appears on the rendered page only after an explicit publish
3. A schema-changing call made with the agent token is refused
4. Following the documented Claude Code MCP setup from a clean session produces a working connection, with the endpoint URL set per environment

**Plans**: TBD

### Phase 5: Dokploy Deploy and Cutover

**Goal**: dev.zeikcookson.com is served by a Dokploy Node container with SQLite on a persistent volume, the admin is claimed and protected by passkeys, and no deploy can take the site down with a pending migration
**Depends on**: Phase 4
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, ADMIN-02, ADMIN-03, GUARD-02, GUARD-03
**Success Criteria** (what must be TRUE):

1. A preview deployment on Dokploy, using its own SQLite database and volume, matches the baseline before the domain moves
2. `dev.zeikcookson.com` serves the Dokploy app with SQLite on a persistent volume and the media storage chosen in Phase 1, and the Pages project is still available for rollback
3. Visiting the admin on production shows the login page, not the setup wizard, and each of two passkeys enrolled on `dev.zeikcookson.com` can sign in, with the recovery path tested
4. Migrations run as an explicit step before the container deploys, CI fails while a migration is pending, and a post-deploy smoke test confirms `/` and one project page return 200
5. A SQLite backup has been restored once into a non-production instance, and the restored content matches production

**Plans**: TBD

### Phase 6: Live Editing and Docs

**Goal**: The user edits the live site from the admin instead of git, and the repo docs describe the workflow that replaced hand-edited markdown
**Depends on**: Phase 5
**Requirements**: ADMIN-04, ADMIN-05, DOCS-01, DOCS-02, DOCS-03
**Success Criteria** (what must be TRUE):

1. On the deployed site, a real project is edited as a draft, previewed, and published so its public page updates with no rebuild or git push, then restored to its previous revision
2. A shareable preview link opens a draft entry in a signed-out browser while the public page still shows the published version
3. CLAUDE.md covers the Dokploy deploy, the Node version, admin-only client JS, the "no new JS" rule, the no-plugins rule and content edited in EmDash, and the README walks through the new local and deploy workflow
4. The `portfolio-update` skill and every doc that still describes the markdown workflow are updated or flagged, and nothing in the repo points at the removed content files

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1, 2, 3, 4, 5, 6

| Phase                            | Plans Complete | Status      | Completed  |
| -------------------------------- | -------------- | ----------- | ---------- |
| 1. Spike, Baseline and Decisions | 5/5            | Complete    | 2026-10-23 |
| 2. Content Model and Import      | 4/4            | Complete    | 2026-10-26 |
| 3. Read Path Rewire and Parity   | 3/6 | In Progress | -          |
| 4. Agent Access                  | 0/TBD          | Not started | -          |
| 5. Dokploy Deploy and Cutover    | 0/TBD          | Not started | -          |
| 6. Live Editing and Docs         | 0/TBD          | Not started | -          |
