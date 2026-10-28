# Portfolio

## What This Is

Zeik Cookson's personal portfolio at dev.zeikcookson.com. It shows infrastructure and platform work, and a career move from design into DevOps, to engineering managers and leads reviewing DevOps candidates. It is an Astro 6 site with a strict Swiss/taut design system, self-hosted on Dokploy behind the Cloudflare proxy.

## Core Value

A hiring manager lands on an honest, fast, distinctive site that makes the project work carry the argument. If everything else fails, the public pages must stay fast, readable and true.

## Requirements

### Validated

- ✓ Design system: Satoshi + IBM Plex Mono, Pit Lane Amber accent, zero radius, light/dark toggle — pre-GSD
- ✓ Public pages ship no external scripts and no modulepreload, only the inline baseline scripts in scripts/script-allowlist.json (pre-GSD, measured in Phase 1). Behind the Cloudflare proxy `/about` also carries one proxy-injected email-decode script, an accepted exception (Phase 5, 2026-10-27)
- ✓ EmDash installed and running inside the Astro 6 app on Node standalone (Phase 1)
- ✓ CMS schema covers the former `projects` frontmatter (status variants, stats, category and tag taxonomies, draft) (Phase 2)
- ✓ All 13 projects and the About page migrated into EmDash with no content or visual regressions (zero-diff parity report) (Phase 2)
- ✓ Nav, site settings and stats editable in the CMS, not just long-form content (Phases 2 and 3)
- ✓ Public pages server-rendered from EmDash with no client JS beyond the baseline allowlist; admin JS under the admin route only; the markdown sources are gone (Phase 3)
- ✓ Agent access via EmDash MCP over OAuth (`.mcp.json`), draft-first (Phase 4), working behind the proxy (05-EVIDENCE.md C9)
- ✓ Served from a Dokploy Node container with SQLite and uploads on a persistent volume, behind the Cloudflare proxy (SSL/TLS Full strict); the owner deploys by clicking Deploy in Dokploy and runs the smoke test by hand (Phase 5)
- ✓ Admin route protected by an EmDash passkey (one passkey, owner decision 2026-10-27), claimed on the production hostname (Phase 5)
- ✓ Nightly volume backup to a private Cloudflare R2 bucket, with one restore rehearsed into a scratch app (Phase 5)
- ✓ CI runs the public-JS check, `emdash migrate --check` on a seeded database and a committed-manifest drift gate on every push (Phases 3 and 5)
- ✓ Live editing loop (draft, preview, publish, revision restore) exercised on the deployed site; ADMIN-04 and ADMIN-05 are owner-attested (Phase 6, 06-EVIDENCE.md)
- ✓ README, CLAUDE.md and the content-update workflow describe the EmDash model; the portfolio-update skill and markdown-workflow docs are removed (Phase 6) — v1.0

### Active

(None committed. Deferred candidates from v1.0 requirements: scheduled publishing, tag archive routes, media library with the Images integration once there are photos, Cloudflare Access in front of the admin. Define next milestone requirements with `/gsd-new-milestone`.)

### Out of Scope

- Redesign or visual changes — DESIGN.md and PRODUCT.md are fixed; this is a backend migration
- New pages or new project copy — content is migrated as is
- Third-party EmDash plugins — the ecosystem is thin at 1.x and Dynamic Workers need a paid plan; revisit if a need appears
- Multi-user editing, roles, comments — single author

## Context

- Current stack: Astro 6.4.x, TypeScript strict, all content read from EmDash (SQLite on a Dokploy volume). The markdown `projects` collection and `src/data/about` files were removed in Phase 3.
- EmDash is Cloudflare's open-source (MIT) TypeScript CMS built on Astro, 1.0 released 2026-09-28; current line is 1.3.1 (2026-10-18). Runs on Workers + D1 + R2, or Node + SQLite/libSQL/Postgres. Ships an admin UI, API, CLI and MCP server.
- Motivation: editing frontmatter by hand and pushing to git is friction. The user wants a browser admin UI and agent-driven updates.
- Copy rules: no em dashes, first-person natural prose, no fabricated dates.
- Workflow rules: never run dev servers or `git push` without being asked.

## Constraints

- **Tech stack**: Astro 6 + TypeScript strict, no `any` — existing standard
- **Hosting**: Dokploy, Node standalone + SQLite on a persistent volume (changed 2026-10-23, Phase 1 D-01; supersedes Cloudflare Workers + D1). Cloudflare Pages was dropped by the user on 2026-10-27 and the old site on dev.zeikcookson.com is torn down; the dev record starts DNS only and Cloudflare proxies it with SSL/TLS Full (strict) once the certificate exists and the first deploy from main has passed (Phase 5, D-16, done 2026-10-27); the owner deploys by clicking Deploy in Dokploy, nothing deploys automatically, and the smoke test is run by hand after each deploy (D-15 superseded 2026-10-27)
- **Client JS**: public pages ship only the baseline inline scripts recorded in scripts/script-allowlist.json (theme bootstrap, console banner, keyboard shortcut, theme toggle, and the 404 timestamp) and nothing beyond them; the admin route is exempt. One accepted exception: behind the Cloudflare proxy `/about` carries the proxy-injected email-decode script (Email Address Obfuscation stays on, owner 2026-10-27, parity 16 of 17); `npm run check:public-js` runs on the origin build and cannot see it
- **Design**: DESIGN.md tokens unchanged — migration must not alter the look
- **Node**: 24 locally and in the Docker image (.nvmrc, Dockerfile ARG NODE_VERSION=24); package.json engines >=22.22.2, enforced by .npmrc engine-strict=true. Dokploy builds the Docker image, so the image's Node 24 is the production runtime

## Key Decisions

| Decision                                                                                                                              | Rationale                                                                                                                                                       | Outcome                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adopt EmDash as the CMS                                                                                                               | Admin UI + MCP/CLI agent access on the same Astro/Cloudflare stack                                                                                              | Done. EmDash 1.3.1 serves dev.zeikcookson.com in production (Phase 5)                                                                              |
| Amend CLAUDE.md: Dokploy deploy, admin-only client JS                                                                                 | EmDash needs admin-side JS; public pages stay zero-JS                                                                                                           | Done in Phase 5: Deployment section names Dokploy, manual deploys and the Cloudflare proxy with its one accepted `/about` script (2026-10-28)      |
| Self-host on Dokploy (Node + SQLite) instead of Cloudflare Workers                                                                    | Personal project, simpler self-hosting; EmDash also supports Node + SQLite                                                                                      | Confirmed by Phase 1 spike (see Spike Findings)                                                                                                    |
| Migrate everything editable (projects, About, nav, settings, stats)                                                                   | User wants the CMS to replace hand-editing in git                                                                                                               | Done in Phases 2 and 3; the live editing loop is proven in Phase 6                                                                                 |
| Pin astro ^6.4.8, @astrojs/node ^10.1.4, @astrojs/react ^5.0.7, react and react-dom ^19, emdash ^1.3.1 with a committed lockfile      | Locked Astro 6 line; bare package names resolve the Astro 7 line (D-14)                                                                                         | Done in Phase 1. Installed: astro 6.4.8, @astrojs/node 10.1.4, @astrojs/react 5.0.7, emdash 1.3.1, react and react-dom 19.3.1 (`spike/npm-ls.txt`) |
| Build with output static plus the Node standalone adapter until Phase 3                                                               | Keeps every page prerendered and identical to the baseline while EmDash routes still run on the server                                                          | Done in Phase 1. Phase 3 switches to server rendering (D-09)                                                                                       |
| SQLite at file:./data/emdash.db and uploads at ./data/uploads on one volume at /app/data                                              | Both paths are baked into the server bundle at build time, and one volume is one backup unit (D-02)                                                             | Done in Phase 1                                                                                                                                    |
| Media storage on a local volume, not S3                                                                                               | No AWS SDK, no credentials, no images yet (D-04, Claude's discretion)                                                                                           | Revisit with CONT-03                                                                                                                               |
| Node 24 by default (.nvmrc, Dockerfile), engines >=22.22.2 enforced by engine-strict, .npmrc copied into the Docker dependency stages | D-15 and FOUND-04. The floor is 22.22.2 because @emdash-cms/registry-verification@0.3.4 requires ^22.22.2 or ^24.15.0 or >=26 (user decision during plan 01-03) | Done in Phase 1. Node 22.22.2 proven as the floor (`spike/docker-node22.txt`)                                                                      |
| Admin gate is EmDash passkeys only: one passkey plus a SQLite recovery procedure (two passkeys dropped 2026-10-27)                                                     | D-08, no email on the self-hosted app                                                                                                                           | One passkey enrolled on dev.zeikcookson.com (user decision 2026-10-27); recovery procedure tested locally in Phase 1, not in the production container (05-EVIDENCE.md C4) |
| Manual deploys behind the Cloudflare proxy; CI as the only guard | Owner wants it simple ("I just want this done"): no pipeline, no Dokploy API key. Migrations apply on boot (D-02), so CI only informs: the committed-manifest diff is the one migration tripwire and cannot stop a manual Deploy click | Accepted by the owner 2026-10-28 ("this is just a portfolio website, it's not that important") |
| Public JS rule: no script, modulepreload or module tag beyond scripts/script-allowlist.json                                           | Measured baseline is not zero JS (D-11)                                                                                                                         | Allowlist committed. CI check in Phase 3                                                                                                           |
| Stay on Astro 6 despite residual npm audit advisories                                                                                 | Astro 7 is out of scope and would need Node >=22.23.4 plus re-derived hashes                                                                                    | Accepted by the user in Phase 5 (D-10)                                                                                                             |

## Spike Findings (Phase 1)

The spike ran on the local branch `emdash-migration`, against a baseline of main captured at `~/portfolio-baseline/current` on 2026-10-23 (git_sha f4e54700d978da2249b4e0ae0c7a3c3377ba1125, Node 24.17.0, astro 6.2.2). Every evidence path below is relative to `~/portfolio-baseline/current/` and lives outside the repo. Where the evidence differs from the research notes, the evidence wins and the difference is stated.

### Answers

| Question                                              | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Evidence                                                                                                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does core EmDash run on Node + SQLite without extras? | Yes. EmDash 1.3.1 builds and boots on Node with only emdash, @astrojs/node, @astrojs/react, react and react-dom. It needs no sandbox runner, Worker Loader, wrangler, AWS SDK, plugin or secret; setup needs only EMDASH_SITE_URL. Config is node standalone, react() and emdash({ sqlite, local }). On the first request it creates its SQLite file, runs its migrations and seeds default collections, then answers needsSetup true. Difference from research: the `data/` directory must already exist, because neither the build nor the runtime creates it (the first boot failed with SQLite error 14), so the image must create and own it.                                                                                                                                              | `spike/boot-setup-status.json`, `spike/no-extras.txt`, `spike/docker-node24.txt`                                                                                 |
| Two passkeys and the recovery path                    | Two passkeys on one admin work on EmDash 1.3.1. Each signs in alone while the other authenticator cannot answer, and only the answering credential's counter moves. Recovery without email is the tested SQLite procedure below; it is a procedure, not a product feature. The credentials table has no rp id column, so the rpId binding is read from the authenticator and the production rpId follows EMDASH_SITE_URL: enroll on the final hostname. Caveat: the drills used virtual authenticators, and one early A2-only sign-in showed a single "Authentication failed" that passed on a fresh repeat with identical steps. The cause was not isolated, so treat it as possible scripting timing, not an EmDash defect, and let the real-device enrollment in Phase 5 be the final check. | `spike/passkeys-full.json`, `spike/recovery.txt`, `spike/passkeys-reclaim.json`                                                                                  |
| Node 24 compatibility                                 | Node 24 by default. The Node 24.22.1 container serves all 17 pages identical to the baseline, `emdash migrate --check` exits 0 with nothing pending, and the log shows no SQLite warning. A Node 22.22.2 image also serves 17 of 17 identical pages (it prints the node:sqlite ExperimentalWarning). Node 20 is refused with EBADENGINE locally and inside the Docker build. Difference from research: the floor is 22.22.2, not 22.16.0, because @emdash-cms/registry-verification@0.3.4 needs node ^22.22.2 or ^24.15.0 or >=26 and a 22.16.0 image failed `npm ci` under engine-strict (user decision during plan 01-03).                                                                                                                                                                    | `spike/docker-node24-final.txt`, `spike/docker-node22.txt`, `spike/engine-strict-node20.txt`, `spike/docker-node20-reject.log`, `spike/docker-node22-reject.log` |
| Media storage on Node                                 | Local storage on the same /app/data volume as SQLite. An authenticated upload returned 201, an anonymous GET returned 200 image/png, a Range request returned 206 with content-range bytes 0-9/70, and media is served with a sandbox CSP. A cookie-authenticated write without the X-EmDash-Request header returned 403 CSRF_REJECTED. SQLite backups do not include uploads, so the backup unit is the whole volume. Revisit S3 only when real media volume or durability demands it (CONT-03).                                                                                                                                                                                                                                                                                               | `spike/media.txt`                                                                                                                                                |
| Confirmed API names                                   | Imports resolve as listed in the next subsection. Every probed name is a function except PortableText, EmDashHead and Image, which are exported from `emdash/ui` and are undefined at the `emdash` root. The probe shows no `declared` entries.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `spike/api-names.txt`                                                                                                                                            |

### Confirmed API names

| Import                                                                                  | Module           | Notes                                                                                                                          |
| --------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| getEmDashCollection, getEmDashEntry, getSiteSettings, getSiteSetting, getMenu, getMenus | `emdash`         | Errors are returned, not thrown. The default order is created_at descending, so the project list must pass orderBy explicitly. |
| PortableText, EmDashHead, Image                                                         | `emdash/ui`      | Not exported from `emdash`. Image is an alias of EmDashImage.                                                                  |
| emdashLoader                                                                            | `emdash/runtime` | Registered in src/live.config.ts.                                                                                              |
| sqlite, libsql, postgres                                                                | `emdash/db`      | The project uses sqlite.                                                                                                       |
| default integration, local, s3                                                          | `emdash/astro`   | The project uses the default integration and local.                                                                            |

The d1 and r2 helpers are Cloudflare-only and are dropped.

Signatures, from research and the installed type declarations:

```ts
getEmDashCollection<T extends string, D = InferCollectionData<T>>(type: T, filter?: CollectionFilter): Promise<CollectionResult<D>>
//  CollectionResult: { entries: ContentEntry<T>[]; error?: Error; cacheHint: CacheHint; nextCursor?; hasMore? }
//  CollectionFilter: { status?: "draft"|"published"|"archived"; limit?; where?; orderBy?: e.g. { date: "desc" }; locale?; cursor? | offset? }
getEmDashEntry<T extends string, D, S>(type: T, id: string, options?: { locale?: string; references?: S }): Promise<EntryResult<D, ...>>
//  EntryResult: { entry: ContentEntry | null; error?: Error; isPreview: boolean; fallbackLocale?; cacheHint }
```

### Admin recovery procedure

1. Close public ingress or stop the server. Once the users are gone, the setup wizard accepts the first caller, so nobody else may reach the site until a new passkey exists. Stop the server for the SQL step, then restart it with ingress still closed.
2. Take an online backup with sqlite3 and require the integrity check to print ok: `sqlite3 data/emdash.db ".backup data/pre-recovery.db"`, then `sqlite3 data/pre-recovery.db "PRAGMA integrity_check"`.
3. Run the delete with foreign keys on, because the CLI default is off and the cascade to credentials would not run otherwise: `sqlite3 data/emdash.db "PRAGMA foreign_keys=ON; DELETE FROM users; DELETE FROM options WHERE name IN ('emdash:setup_complete','emdash:setup_state');"`. This removes the users, then the two setup options.
4. Complete the setup wizard on the production hostname.
5. Enroll a passkey. The owner runs one on purpose, so add a second when convenient.
6. Sign in to the EmDash MCP server again from Claude Code with /mcp. Access tokens and OAuth sessions are tied to the users that were deleted (from research, not re-measured in the drill).
7. Reopen public ingress.

What the drill showed: before the delete there was 1 user and 2 credentials, and after it 0 and 0. The schema and content counts were unchanged (2 collections, 6 fields, 2 taxonomy definitions, 1 media row), and the uploaded file survived. The wizard then re-prompted the site title and tagline blank, offered the Empty site or Import choice, and asked for email, name and a passkey; the values entered overwrite the stored ones. A new authenticator claimed the admin and signed in after a cookie reset. Evidence: `spike/recovery.txt`, `spike/passkeys-reclaim.json`.

### Research tensions

| Tension                                                         | Outcome                                                                                                                                                                                                           | Settled in                    |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Media storage                                                   | Decision: local volume under /app/data (`spike/media.txt`)                                                                                                                                                        | Phase 1                       |
| Tags storage                                                    | Decision: multiSelect with no options. Gate: the admin chip input and the CLI or MCP path accept new values                                                                                                       | Phase 2                       |
| Stats placement                                                 | Decision: per-project stats repeater with label, value and a default/green/accent variant; About cells on the about entry; settings hold only the fixed General, Social and SEO keys. Gate: the about entry shape | Phase 2                       |
| EmDash version                                                  | Decision: emdash ^1.3.1, carrying two behavior changes: publishing no longer adds the automatic slug-change redirect, and EMDASH_SITE_URL is needed at build time behind an HTTPS proxy                           | Phase 1                       |
| Public JS baseline                                              | Decision: the allowlist rule, no script, modulepreload or module tag beyond scripts/script-allowlist.json (5 inline hashes across 17 routes, no external scripts, no modulepreload)                               | Phase 1 allowlist, Phase 3 CI |
| Workers plan, LOADER binding, Cloudflare Access versus passkeys | Superseded by D-01 and D-08, no action                                                                                                                                                                            | Phase 1                       |
| Rendering mode                                                  | Gate: Phase 3 switches to server rendering from SQLite and measures; caching headers come before any prerender fallback (D-09)                                                                                    | Phase 3                       |

### Named gates

- (a) Astro 6 residual advisories. After `npm audit fix` (non-breaking) four findings remain, and fixes exist only through `npm audit fix --force`, which installs astro 7.4.2 or @astrojs/node 11.1.9 (`spike/npm-audit.json`, `spike/npm-audit.txt`):
  - astro, critical, <=7.3.1: GHSA-26w7-cxv4-gfx2 (remote code execution through AVIF image optimization), GHSA-f48w-9m4c-m7f5, GHSA-7pw4-f3q4-r2p2, GHSA-4g3v-8h47-v7g6 and GHSA-98hj-9722-w3j8 (XSS), GHSA-376h-93r7-7g6f (base-path authorization bypass). The research recorded fewer astro advisories; the audit lists six.
  - @astrojs/node, high, <=11.1.2: GHSA-qh8j-hqjv-7m4x (malformed Host port can crash the adapter), GHSA-r557-wffq-wvrc (trailing-slash redirect).
  - sharp, high, <=0.35.5-rc.1: GHSA-f88m-g3jw-g9cj (libvips), GHSA-rgj7-g3m4-5g8c (libheif), GHSA-wq5f-xc86-pv6w (librsvg).
  - esbuild, low, 0.27.3 to 0.28.0: GHSA-g7r4-m6w7-qqqr (Windows dev server file read).
  - Decision: stay on Astro 6 for now. Mitigations in force: no AVIF processing, no remote image hosts configured, server reachable only on localhost in Phase 1. Gate: before the Phase 5 cutover exposes the server publicly, the user decides between accepting the residual risk and pulling in the Astro 7 migration, and Phase 5 verifies the proxy rejects malformed Host headers.
  - Phase 5 (D-10, 2026-10-26): the user accepts the residual risk and stays on Astro 6; no Astro 7 migration in this milestone. @astrojs/node 10.1.4 runs with staticHeaders off, so a malformed Host port gives a 500 rather than a crash; the check at the origin is recorded in 05-EVIDENCE.md row C7.
- (b) Extra recovery path: built-in GitHub login versus an operational ingress block during recovery. Phase 5 (Open Question 2). Phase 5 (D-09): not adopted; passkeys only. One passkey is enrolled (user decision 2026-10-27); the SQLite recovery procedure was rehearsed locally in Phase 1 and its production-container form is not rehearsed.
- (c) Deprecated auth dependencies (@oslojs packages and arctic 3.7.0 inside @emdash-cms/auth). Phase 5 hardening review. Phase 5 disposition: accepted until an EmDash release replaces them. On 2026-10-28 npm ls shows arctic 3.7.0, @oslojs/crypto 1.0.1 and @oslojs/encoding 1.1.0 only inside the emdash 1.3.1 dependency tree, and the committed manifest gate marks that upgrade (05-EVIDENCE.md, Named gates).
- (d) Image architecture: the spike image is arm64 (`image_arch` in `spike/docker-node24.txt`). Phase 5 builds or tests linux/amd64 if the Dokploy host needs it. Phase 5 disposition: the repo Dockerfile built and runs on the Dokploy host (05-EVIDENCE.md C1); the host architecture was not read separately.
- (e) .emdash/migrations.json stays gitignored. Phase 5 decides commit versus build-in-CI together with GUARD-02. Phase 5 decision (user, 2026-10-26): committed; CI runs git diff --exit-code on it after the build, next to the seeded-database migrate --check (GUARD-02).
- (f) The session store under node_modules/.astro inside the container is lost on redeploy. Phase 5 decides whether to move it onto /app/data. Phase 5 (D-11, 2026-10-27): it stays where it is and is moved only if a redeploy signing the admin out proves annoying.
- (g) Public pages carry no security headers beyond Cache-Control and ETag. Phase 5 adds them at Traefik or Cloudflare. Phase 5 (D-11, 2026-10-27): observed on the live origin, EmDash itself sends x-content-type-options, referrer-policy, x-frame-options and a permissions-policy, so no Traefik or Cloudflare rule is added; no CSP.
- (h) EMDASH_SITE_URL=https://dev.zeikcookson.com must be set at build and run time. Phase 5. Phase 5: the Dockerfile build stage takes ARG EMDASH_SITE_URL (Dokploy Build Time Arguments); the runtime value from the Dokploy Environment tab is the one passkeys and CSRF use.
- (i) `emdash doctor` needs `--database ./data/emdash.db`, while `emdash migrate --check` finds the database on its own (`spike/docker-node24.txt` shows migrate --check exit 0). Phase 5. Phase 5 disposition: confirmed in the production container, doctor runs with --database ./data/emdash.db (05-EVIDENCE.md C5).
- (j) JSON-LD scripts from EmDashHead count as data, and the GUARD-01 check runs anonymously because signed-in editors may get a toolbar. Phase 3.
- (k) Cookie-authenticated writes: `upload_without_header_status` is 403 (CSRF_REJECTED) in `spike/media.txt`, so the X-EmDash-Request header requirement is enforced. Recorded for Phase 4 (agent tokens) and Phase 5 (public admin); no gate is raised.
- (l) Generated files: the plan 01-02 summary listed no generated file as a Phase 2 decision. .emdash/types.ts is not ignored, so Phase 2 can commit generated types.

## Current State

Shipped v1.0 EmDash Migration on 2026-10-28: 6 phases, 27 plans, 38 requirements satisfied, 95 automated tests. Content lives in EmDash (SQLite on a Dokploy volume), edited in the admin or by Claude over OAuth MCP (drafts only by convention). The owner deploys by clicking Deploy in Dokploy. Known debt is listed in `.planning/milestones/v1.0-MILESTONE-AUDIT.md` (owner-attested production checks, one passkey, unrehearsed code rollback, manifest diff as the only migration tripwire).

## Next Milestone Goals

Not yet defined. Run `/gsd-new-milestone`.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-10-28 after v1.0 milestone_
