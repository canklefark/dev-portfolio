# Requirements: Portfolio

**Defined:** 2026-10-23
**Core Value:** A hiring manager lands on an honest, fast, distinctive site that makes the project work carry the argument.

## v1 Requirements

Milestone v1.0: EmDash Migration. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Dependencies are bumped and pinned (Astro 6.4.x, EmDash 1.3.x, `@astrojs/node` standalone adapter, React 19) and `astro build` passes with the current site unchanged
- [x] **FOUND-02**: A baseline of the current built HTML (home, projects index, all project pages, About, 404) and per-route script inventory is stored outside the repo for later parity checks
- [x] **FOUND-03**: A spike records written decisions in PROJECT.md: whether core EmDash runs on Node + SQLite without extras, passkey enrollment and recovery path, Node 24 compatibility, media storage on Node, confirmed API names
- [x] **FOUND-04**: Node floor is raised to 22.22.2+ in `package.json` and the build environment

### Schema

- [x] **SCHEMA-01**: A `projects` collection mirrors current frontmatter, using non-reserved field slugs (`project_status`, `status_variant`, `time_label`), `category` and `tags` as EmDash taxonomies (D-05 and D-09 amended by the user on 2026-10-26), `date` stored as a native datetime at midnight UTC converted from the source YYYY-MM-DD string (D-07 amended by the user on 2026-10-26, admin date picker), and native draft status in place of `draft`
- [x] **SCHEMA-02**: Per-project `stats` are an editable repeater (label, value, variant) and `tags` are editable as EmDash taxonomy terms (D-09 amended by the user on 2026-10-26: a new tag is a term, not a schema edit)
- [x] **SCHEMA-03**: An `about` entry holds the About page copy and its stat cells as editable fields
- [x] **SCHEMA-04**: A primary navigation menu and fixed site settings (General, Social, SEO) are editable in the admin
- [x] **SCHEMA-05**: Types are generated from the schema and committed

### Migration

- [x] **MIGR-01**: An idempotent import script loads all 13 projects with slugs equal to current file names, explicit dates, and drafts created as drafts
- [x] **MIGR-02**: The About page content is imported with no copy changes
- [x] **MIGR-03**: A field-by-field equality report shows zero differences in copy, dates, order, tags, stats and status against the source markdown
- [x] **MIGR-04**: A seed file exported from the final schema and content is committed so the setup can be reproduced

### Rendering

- [x] **REND-01**: Projects index and detail pages read from EmDash through `src/lib/projects.ts` and keep their current props and order (newest first)
- [x] **REND-02**: A missing project returns a real 404 status
- [x] **REND-03**: The About page, nav and head metadata read from EmDash
- [x] **REND-04**: Rendered pages match the baseline in copy and layout in light and dark, including long-form body styling
- [x] **REND-05**: Markdown sources, `src/data/about.*` and the file collection are removed in the same change that flips the read path

### Admin

- [x] **ADMIN-01**: Admin runs under `/_emdash/admin` and loads no admin JS on public routes
- [ ] **ADMIN-02**: The setup wizard is completed at first deploy, before the URL is shared, and the login page (not setup) is what a visitor sees afterward
- [ ] **ADMIN-03**: Two passkeys are enrolled on `dev.zeikcookson.com`, with a tested recovery path
- [ ] **ADMIN-04**: Draft, preview and publish are exercised end to end on one real project, including restoring a revision
- [ ] **ADMIN-05**: A shareable preview link works for a draft entry

### Agent access

- [x] **AGENT-01**: A scoped personal access token (`content:read`, `content:write`, `media:read`, `media:write`, `menus:manage`, `taxonomies:manage`; no schema, settings, transfer or admin scope) works against the MCP endpoint (D-06 amended by the user on 2026-10-26: these are the EmDash token scopes; draft reading comes from the owner's role, and `content:write` implies the menu and taxonomy scopes)
- [x] **AGENT-02**: Claude creates and updates a project card through MCP or CLI with every write landing as a draft, and the user publishes it as a separate explicit step in the admin; a committed Claude Code guard (deny rules and a PreToolUse hook) refuses the agent's publish-class calls and live-write arguments (D-01, D-03 and D-12 amended by the user on 2026-10-26: EmDash 1.3.1 has no publish scope, so the guard is client-side)
- [x] **AGENT-03**: Schema-changing calls are refused for the agent token
- [x] **AGENT-04**: The working Claude Code MCP setup is documented

### Deployment

- [ ] **DEPLOY-01**: The site deploys to Dokploy as a Node standalone container (Docker image) with SQLite and uploads on a persistent volume, straight to the production app with no separate preview database (user decision 2026-10-27)
- [x] **DEPLOY-02**: EmDash applies its pending migrations itself on the first request after a container starts (default auto mode), with no separate pre-deploy migration step (D-02 amended by the user on 2026-10-26), and CI fails when the committed migration manifest .emdash/migrations.json differs from the one the build generates, so a changed migration set is committed on purpose and a volume backup is taken before the deploy that applies it
- [ ] **DEPLOY-03**: The deployed site is compared against the baseline (17 of 17 pages identical, public-JS allowlist passing) on its real hostname, with the record DNS only and again behind the Cloudflare proxy
- [ ] **DEPLOY-04**: `dev.zeikcookson.com` serves the Dokploy app, the old site is torn down with no rollback target and removed from the old project's custom domains, and once the Let's Encrypt certificate exists Cloudflare proxies the hostname with SSL/TLS Full (strict) while the Dokploy app is still shown to be the one answering (user decisions 2026-10-27)
- [ ] **DEPLOY-05**: A SQLite backup in the Cloudflare R2 bucket (user decision 2026-10-27) and its restore is rehearsed once

### Guards

- [x] **GUARD-01**: CI fails if any public route gains a script, `modulepreload` or module tag beyond the recorded baseline
- [x] **GUARD-02**: CI fails on pending migrations (`emdash migrate --check`)
- [ ] **GUARD-03**: Production deploys when a `v*` tag is pushed, and only after a gate confirms that the tagged commit is on `main` and that CI succeeded for it; the deploy sets the Dokploy application's source ref to that tag, so Dokploy builds the tag and the tag names exactly the code that goes live (a push to `main` runs CI only and documentation-only pushes run no CI; user decisions 2026-10-27); a post-deploy smoke test then checks `/` and one project page return 200

### Docs

- [ ] **DOCS-01**: CLAUDE.md is updated (Dokploy deploy by `v*` tag push, with Dokploy building the tag, Node version, admin-only client JS, "no new JS" rule, no-plugins rule, content now edited in EmDash)
- [ ] **DOCS-02**: README is updated for the new local and deploy workflow, including the tag release procedure, what to do when a tagged commit has no CI run, and how to redeploy an earlier tag to undo a bad deploy
- [ ] **DOCS-03**: The `portfolio-update` skill and any doc referencing the markdown workflow are flagged or updated

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content

- **CONT-01**: Scheduled publishing (needs a cron trigger; previews do not run cron)
- **CONT-02**: Tag taxonomies with archive routes
- **CONT-03**: Media library with the Images integration, once the site has photos
- **CONT-04**: Homepage hero copy as an editable singleton

### Access

- **ACCESS-01**: Cloudflare Access in front of the admin (possible now that the proxy is on from Phase 5, D-16; EmDash passkeys are the only admin gate for now, see Phase 1 D-08)

## Out of Scope

| Feature                                                   | Reason                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Visual redesign                                           | DESIGN.md and PRODUCT.md are fixed; this is a backend migration                                                           |
| Third-party EmDash plugins and sandboxing                 | Thin ecosystem at 1.x; sandbox may need a paid plan                                                                       |
| Page-builder blocks                                       | Conflicts with the Swiss/taut design; fields are fixed                                                                    |
| i18n                                                      | Single-language site                                                                                                      |
| Multi-user roles, comments                                | Single author                                                                                                             |
| Custom site-wide settings keys                            | No documented support; per-entry fields cover the need                                                                    |
| Astro 7                                                   | Separate migration; stay on Astro 6                                                                                       |
| Cloudflare Workers, D1 and R2 as hosting or media storage | Hosting moved to Node + SQLite on Dokploy (Phase 1 D-01); R2 is used only as the backup bucket (user decision 2026-10-27) |
| Brand fonts in the media library                          | Fonts stay self-hosted in `public/fonts/`                                                                                 |
| Email-based admin recovery                                | Email is not configured on the self-hosted Node app                                                                       |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status   |
| ----------- | ------- | -------- |
| FOUND-01    | Phase 1 | Complete |
| FOUND-02    | Phase 1 | Complete |
| FOUND-03    | Phase 1 | Complete |
| FOUND-04    | Phase 1 | Complete |
| SCHEMA-01   | Phase 2 | Complete |
| SCHEMA-02   | Phase 2 | Complete |
| SCHEMA-03   | Phase 2 | Complete |
| SCHEMA-04   | Phase 2 | Complete |
| SCHEMA-05   | Phase 2 | Complete |
| MIGR-01     | Phase 2 | Complete |
| MIGR-02     | Phase 2 | Complete |
| MIGR-03     | Phase 2 | Complete |
| MIGR-04     | Phase 2 | Complete |
| REND-01     | Phase 3 | Complete |
| REND-02     | Phase 3 | Complete |
| REND-03     | Phase 3 | Complete |
| REND-04     | Phase 3 | Complete |
| REND-05     | Phase 3 | Complete |
| ADMIN-01    | Phase 3 | Complete |
| GUARD-01    | Phase 3 | Complete |
| AGENT-01    | Phase 4 | Complete |
| AGENT-02    | Phase 4 | Complete |
| AGENT-03    | Phase 4 | Complete |
| AGENT-04    | Phase 4 | Complete |
| DEPLOY-01   | Phase 5 | Pending  |
| DEPLOY-02   | Phase 5 | Complete |
| DEPLOY-03   | Phase 5 | Pending  |
| DEPLOY-04   | Phase 5 | Pending  |
| DEPLOY-05   | Phase 5 | Pending  |
| ADMIN-02    | Phase 5 | Pending  |
| ADMIN-03    | Phase 5 | Pending  |
| GUARD-02    | Phase 5 | Complete |
| GUARD-03    | Phase 5 | Pending  |
| ADMIN-04    | Phase 6 | Pending  |
| ADMIN-05    | Phase 6 | Pending  |
| DOCS-01     | Phase 6 | Pending  |
| DOCS-02     | Phase 6 | Pending  |
| DOCS-03     | Phase 6 | Pending  |

**Coverage:**

- v1 requirements: 38 total (the earlier count of 33 was a miscount; the list above defines 38 IDs)
- Mapped to phases: 38
- Unmapped: 0 ✓

---

_Requirements defined: 2026-10-23_
_Last updated: 2026-10-27 after Cloudflare Pages was dropped (DEPLOY-01, DEPLOY-03 and DEPLOY-04 reworded), then again for tag deploys, the Cloudflare proxy and R2 backups (DEPLOY-02 to DEPLOY-05, GUARD-03, DOCS-01 and DOCS-02 reworded), then a third time so that Dokploy builds the tag and not the tip of main (GUARD-03, DOCS-01 and DOCS-02 reworded)_
