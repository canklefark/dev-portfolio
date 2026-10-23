# Phase 1: Spike, Baseline and Decisions - Research

**Researched:** 2026-10-23
**Domain:** EmDash 1.3.x on Astro 6 + `@astrojs/node` standalone + SQLite, Docker packaging, baseline capture and parity tooling
**Confidence:** HIGH for everything reproduced in the scratch spike (build, boot, passkeys, recovery, media, Docker, Node 22.16/24); MEDIUM for Dokploy-specific behavior (not exercised this phase)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Host on Dokploy with Node, not Cloudflare Workers. This supersedes the "Hosting: Cloudflare (Workers + D1)" constraint in PROJECT.md and the Workers-specific parts of the roadmap. Requirements DEPLOY-01 to DEPLOY-05 and Phase 5, FOUND-03 (Workers plan, `LOADER` binding), the CF adapter and D1/R2 mentions need amending. Do that as a separate roadmap/requirements edit after this discussion. Reversibility: costly, adapter, storage and deploy pipeline all depend on it.
- **D-02:** Database is SQLite on a persistent Dokploy volume. Back-up and restore strategy to be defined in the deploy phase. Reversibility: costly, moving to Postgres later needs a data migration.
- **D-03:** Adapter is `@astrojs/node` in standalone mode, replacing `@astrojs/cloudflare`. React stays (the EmDash admin needs it). The spike confirms any EmDash-specific constraint.
- **D-04:** Cloudflare may remain as DNS/proxy for `dev.zeikcookson.com`, but no Workers, D1 or R2 are used. Media storage on Node (local volume vs S3) is for the spike to recommend.
- **D-05:** The spike is local: EmDash boots on Node + SQLite, `astro build` passes, and a Docker image builds. The trial deploy to Dokploy happens in Phase 5, not Phase 1.
- **D-06:** For Phase 1 only, `astro preview` and curl against it are allowed without asking each time. `astro dev` and `npm run dev` stay off limits unless the user asks.
- **D-07:** Spike questions to answer: does core EmDash run on Node + SQLite without extras; can two passkeys be enrolled and what is the recovery path; do the confirmed API names match research (`getEmDashCollection`, `getEmDashEntry`, `PortableText`, `getSiteSettings`); Node 24 compatibility; media storage option on Node.
- **D-08:** EmDash's built-in auth (passkeys) is the only admin gate. No Cloudflare Access, no proxy auth. Two passkeys on the production hostname with a tested recovery path (Phase 5). Email recovery is not available.
- **D-09:** Public pages are SSR from SQLite. If slow, try HTTP caching headers first. Prerender with rebuild-on-publish is the last resort.
- **D-10:** Baseline lives in `~/portfolio-baseline/` (outside the repo, dated): a fresh build of current `main` HTML for home, projects index, all 13 project pages, About and 404, plus a per-route script inventory. No screenshots in Phase 1.
- **D-11:** Commit a derived JSON allowlist for CI (GUARD-01): per-route script and modulepreload counts plus inline-script hashes. The baseline HTML itself is not committed.
- **D-12:** Capture the baseline before any dependency changes.
- **D-13:** All migration work lives on a long-lived local branch `emdash-migration`. `main` stays deployable (it auto-deploys to Cloudflare Pages today). Nothing is pushed without the user's go-ahead.
- **D-14:** Dependencies use caret ranges plus a committed lockfile.
- **D-15:** `engines.node` is `>=22.16.0` (EmDash's floor). `.nvmrc` and the Dockerfile base image use Node 24, matching local Node 24.17. If the spike finds Node 24 incompatible, fall back to 22 and record it.

### Claude's Discretion

- Media storage option on Node and the exact Dockerfile layout.
- Format of the decisions recorded in PROJECT.md.
- Whether the Cloudflare Pages project and CF adapter work from research are dropped or kept in notes.

### Deferred Ideas (OUT OF SCOPE)

- Cloudflare Access in front of the admin (v2 ACCESS-01) is now moot unless the proxy stays on Cloudflare.
- Page titles with em dash separators remain a separate copy decision.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                                                                            | Research Support                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FOUND-01 | Dependencies bumped and pinned (Astro 6.4.x, EmDash 1.3.x, `@astrojs/node` standalone, React 19); `astro build` passes with the current site unchanged | Exact working pin set and config in Standard Stack and Code Examples. Reproduced: build passes, HTML identical to baseline after whitespace normalization, script inventory identical, Docker image on Node 24 and Node 22.16.0 serves identical pages. Critical: use `output: "static"` in Phase 1 (see Pitfall 3), pin `@astrojs/node ^10.1.4` and `@astrojs/react ^5.0.7` (latest tags are the Astro 7 line). |
| FOUND-02 | Baseline of built HTML and per-route script inventory stored outside the repo                                                                          | Baseline procedure, inventory script, measured baseline numbers and the five inline-script hashes in Architecture Patterns and Code Examples.                                                                                                                                                                                                                                                                    |
| FOUND-03 | Spike records written decisions in PROJECT.md (EmDash on Node + SQLite without extras, passkeys and recovery, Node 24, media storage, API names)       | Every decision has measured evidence in "Spike Findings and Decisions to Record". Includes a tested DB-level recovery drill and verified export names.                                                                                                                                                                                                                                                           |
| FOUND-04 | Node floor raised to 22.16+ in `package.json` and the build environment                                                                                | `engines.node >=22.16.0` plus `.npmrc engine-strict=true` (verified: without it npm only warns), `.nvmrc` 24, Dockerfile `ARG NODE_VERSION=24`. Node 22.16.0 verified as a working floor.                                                                                                                                                                                                                        |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

Source: `/Users/zeikcookson/workspace/github.com/canklefark/portfolio/CLAUDE.md` plus global `~/.claude/CLAUDE.md` and memory.

- TypeScript strict, no `any`. [CITED: CLAUDE.md "Code Rules"]
- No client-side JS unless there is no server-side alternative; no inline styles except CSS custom property overrides. [CITED: CLAUDE.md]
- All SQL parameterized, view names imported from config, never interpolated. [CITED: CLAUDE.md] (Phase 1 writes no SQL into the app; the recovery drill SQL is an operator procedure, not app code.)
- Design system fixed (DESIGN.md, PRODUCT.md): no visual change in this phase.
- Deployment section of CLAUDE.md still says Cloudflare Pages and Node 22; amending is DOCS-01 in Phase 6, not Phase 1. Do not edit it in this phase.
- Memory rules that bind this phase: never run `npm run dev` / `astro dev` without being asked (D-06 allows `astro preview` and curl only); never `git push` without explicit approval; no em dashes in copy; never fabricate dates.
- Global rules (Karpathy principles): surgical changes, state assumptions, goal-driven verification. Each plan task should have a verify step.

## Summary

Core EmDash 1.3.1 runs on Node + SQLite with no extras. In a scratch copy of the repo I installed the pin set, configured `@astrojs/node` standalone + `@astrojs/react` + `emdash()` with `sqlite()` and `local()` storage, and the build passed. No Worker Loader, no sandbox runner, no wrangler, no S3 SDK and no plugin were needed. The server booted under Node 24.17.0 (host), Node 24.22.1 (container) and Node 22.16.0 (container; prints a harmless SQLite ExperimentalWarning). The setup wizard completed headless, two passkeys were enrolled and each signed in independently, a DB-level recovery drill worked, a local-volume media upload round-tripped with HTTP Range support, and the Docker image served all 17 routes identical to the baseline.

The most important planning discoveries are non-obvious traps. (1) `npm install astro|@astrojs/node|@astrojs/react` at latest pulls the Astro 7 line, which conflicts with the locked Astro 6.4.x. Pin `^6.4.8`, `^10.1.4`, `^5.0.7` explicitly. (2) The database path and upload directory are baked into the server bundle at build time (`virtualConfig`), so `process.env.DATABASE_PATH` set only at container runtime has no effect; the container failed with "unable to open database file" until the paths were made static (`file:./data/emdash.db`, volume at `/app/data`). (3) `output: "server"` turns every existing page into SSR and breaks `[...slug].astro` (`getStaticPaths()` ignored). `output: "static"` with the Node adapter and EmDash builds fine, keeps every existing page prerendered, and is the correct Phase 1 config; Phase 3 flips to server. (4) `npm audit` reports 4 residual findings on the Astro 6 / `@astrojs/node` 10 line that have no 6.x backport (one critical: AVIF decoding via sharp/libheif). This needs a recorded decision, not silence (Open Question 1).

**Primary recommendation:** Capture the baseline first on `main`, branch to `emdash-migration`, then apply the pin set with `output: "static"`, static relative DB/uploads paths, `engine-strict` Node floor and a multi-stage Node 24 Dockerfile; verify with a whitespace-normalized HTML diff plus the script inventory at each step; record decisions in PROJECT.md from the "Spike Findings" table below.

## Architectural Responsibility Map

| Capability                              | Primary Tier                                                            | Secondary Tier                              | Rationale                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Public page HTML (Phase 1: prerendered) | CDN / Static (served by Node adapter static handler from `dist/client`) | Frontend Server (SSR from Phase 3)          | Phase 1 changes no behavior; pages stay prerendered. D-09 moves them to SSR in Phase 3.       |
| Admin SPA and API (`/_emdash/*`)        | API / Backend (EmDash routes in the Node server)                        | Browser (React admin, admin route only)     | EmDash injects these routes with `prerender: false`; admin JS must never reach public routes. |
| Passkey auth, setup wizard, sessions    | API / Backend                                                           | Browser (WebAuthn)                          | Passkeys bind to the hostname; sessions use Astro's filesystem store on Node.                 |
| Content and settings storage            | Database / Storage (SQLite file on a persistent volume, WAL)            | n/a                                         | D-02.                                                                                         |
| Media files                             | Database / Storage (local volume `./data/uploads`)                      | API (served by `/_emdash/api/media/file/*`) | Recommended: local volume; DB backups do not contain media.                                   |
| Baseline capture and parity checks      | Build tooling (Node scripts, outside runtime)                           | CI later (GUARD-01)                         | Pure build-output analysis; no runtime tier.                                                  |
| TLS, DNS, host header sanitation        | Reverse proxy (Dokploy Traefik) / Cloudflare DNS                        | n/a                                         | Not exercised in Phase 1; relevant to Phase 5 and to the Host-header advisory.                |

## Standard Stack

### Core

| Library              | Version (pin)                                                                    | Purpose                                            | Why Standard                                                                                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `astro`              | `^6.4.8` (resolved 6.4.8; latest tag is 7.4.2, do NOT use bare `astro@latest`)   | Framework                                          | Locked by roadmap (Astro 6.4.x). `@astrojs/node@10.1.4` peer is `astro ^6.3.0`. [VERIFIED: npm view @astrojs/node@10.1.4 peerDependencies]                                                  |
| `@astrojs/node`      | `^10.1.4` (latest tag 11.1.9 requires `astro ^7.2.1`)                            | Node standalone adapter                            | Required by D-03. 10.x is the Astro 6 line. [VERIFIED: npm view @astrojs/node peerDependencies, 11.1.9 -> `{ astro: '^7.2.1' }`; 10.1.4 -> `{ astro: '^6.3.0' }`]                           |
| `emdash`             | `^1.3.1` (dist-tag latest = 1.3.1, published 2026-10-18; engines `node >=22.16`) | CMS core: admin, REST, MCP, CLI, Astro integration | Locked. [VERIFIED: npm view emdash dist-tags engines]                                                                                                                                       |
| `@astrojs/react`     | `^5.0.7` (latest tag 7.1.1 needs Node >=22.23.4 and the Astro 7 line)            | Required by the EmDash admin                       | EmDash peer `@astrojs/react >=5.0.0-beta.0`. 5.0.7 engines `node >=22.12.0`. [VERIFIED: npm view @astrojs/react@latest engines -> `>=22.23.4`; @astrojs/react@5.0.7 engines -> `>=22.12.0`] |
| `react`, `react-dom` | `^19` (resolved 19.3.1)                                                          | Admin UI runtime                                   | Requirement says React 19. [VERIFIED: npm ls in scratch spike]                                                                                                                              |

Everything else EmDash needs (kysely, zod, tiptap, `@emdash-cms/auth|admin|blocks`, `astro-portabletext`, MCP SDK) arrives as transitive dependencies of `emdash`. SQLite uses Node's built-in `node:sqlite` driver, so there is no native SQLite package to compile. [CITED: docs.emdashcms.com/deployment/database, "uses Node.js's built-in database driver"; VERIFIED: dist `dialect_*.mjs` "Creates a Kysely dialect for Node's built-in SQLite driver"]

### Supporting (existing, unchanged)

| Library          | Version             | Purpose       | When to Use                                                                                                                         |
| ---------------- | ------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `@astrojs/check` | `^0.9.9` (existing) | `astro check` | Ran clean on the spike: 0 errors, 0 warnings, 1 pre-existing hint (`Stack.astro` unused `Props`). [VERIFIED: scratch `astro check`] |
| `typescript`     | `^6.0.3` (existing) | Types         | Unchanged.                                                                                                                          |

### Alternatives Considered

| Instead of                     | Could Use                                                     | Tradeoff                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local-volume media (`local()`) | `s3()` to R2 or MinIO                                         | Needs `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` (build fails without them), credentials, and gives signed direct uploads. Overkill for a personal site with no images yet (CONT-03 deferred). Recommended only if media must outlive the container volume. [CITED: docs.emdashcms.com/deployment/storage]                                                                                                    |
| SQLite (D-02)                  | libSQL / Postgres                                             | Out of scope; D-02 is locked.                                                                                                                                                                                                                                                                                                                                                                                               |
| Astro 6.4.x (locked)           | Astro 7.4.2 + `@astrojs/node` 11.1.9 + `@astrojs/react` 7.1.1 | Clears all `npm audit` findings (0 vulnerabilities in a scratch install). Builds with EmDash 1.3.1, but needs Node >=22.23.4 (contradicts the 22.16 floor in FOUND-04) and changes bundle hashes (module script 345 -> 341 bytes, CSS filename changes) so the allowlist must be re-derived. Out of Scope in REQUIREMENTS ("Astro 7: separate migration"); see Open Question 1. [VERIFIED: scratch install + build + audit] |

**Installation (explicit majors, not bare names):**

```bash
npm install astro@^6.4.8 @astrojs/node@^10.1.4 @astrojs/react@^5.0.7 react@^19 react-dom@^19 emdash@^1.3.1
```

Do not use `npx astro add node` or `npx astro add react` without checking the version it writes; pin by hand to the majors above. [ASSUMED: `astro add` may resolve the Astro 7 line adapter; not tested, hence pin manually.]

**Version verification (run this session):** `npm view emdash version` -> 1.3.1; `npm view astro@6.4.8 engines` -> `node >=22.12.0`; `npm view @astrojs/node@10.1.4 peerDependencies` -> `{ astro: '^6.3.0' }`. No `postinstall` script on emdash, `@astrojs/node@10.1.4` or `@astrojs/react@5.0.7`. [VERIFIED: npm view ... scripts.postinstall returned empty]

## Package Legitimacy Audit

Seam run: `node ~/.claude/gsd-core/bin/gsd-tools.cjs query package-legitimacy check --ecosystem npm ...`. Every package returned `SUS` with the single reason `too-new`. The seam keys on the publish date of the latest version, so well-established packages whose latest release landed within days (astro 2026-10-21, react 2026-10-14) trip it. The registry facts below are what actually matter.

| Package              | Registry | Age                                                                                                                 | Downloads            | Source Repo                                                              | Verdict                                  | Disposition                                                                                                                                           |
| -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `astro`              | npm      | years (many majors)                                                                                                 | ~4.78M/wk            | github.com/withastro/astro                                               | SUS (too-new: latest publish 2026-10-21) | Approved by user (existing dependency). `[WARNING: flagged as suspicious by seam heuristic, last-publish date only.]`                                 |
| `@astrojs/node`      | npm      | years                                                                                                               | ~577k/wk             | github.com/withastro/astro                                               | SUS (too-new: 2026-10-19)                | Named in docs.astro.build and docs.emdashcms.com. `[WARNING: flagged as suspicious, last-publish date only.]`                                         |
| `@astrojs/react`     | npm      | years                                                                                                               | ~1.45M/wk            | github.com/withastro/astro                                               | SUS (too-new: 2026-10-21)                | Named in both docs sets. `[WARNING: as above.]`                                                                                                       |
| `react`, `react-dom` | npm      | years                                                                                                               | ~116M / ~109M per wk | github.com/react/react                                                   | SUS (too-new: 2026-10-14)                | Approved. `[WARNING: as above.]`                                                                                                                      |
| `emdash`             | npm      | Name has 2015 stub versions (`0.0.0-a`, `0.0.0-b`); real releases from 2026-04-01; 65 versions; 1.0.1 on 2026-09-28 | ~41.8k/wk            | github.com/emdash-cms/emdash; maintainers include irvinebroque, ascorbic | SUS (too-new)                            | Genuinely young package. Locked by the user. Named in docs.astro.build/en/guides/cms/emdash. `[WARNING: flagged as suspicious, verify before using.]` |

**Packages removed due to SLOP verdict:** none.
**Packages flagged SUS:** all of the above. Planner: insert ONE `checkpoint:human-verify` task before the first `npm install` that lists the six names and versions and asks the user to approve them (user already chose these; this is a lightweight confirmation, not a re-decision). `@aws-sdk/*` is NOT recommended and not audited.

Registry-level notes worth surfacing: `npm install` of the EmDash tree prints deprecation warnings for `@oslojs/webauthn`, `@oslojs/crypto`, `@oslojs/jwt`, `@oslojs/asn1`, `@oslojs/cbor`, `@oslojs/binary` and `arctic@3.7.0` ("Package no longer supported"). These sit in the passkey/OAuth path of `@emdash-cms/auth`. [VERIFIED: npm install output, scratch spike] Tag for Phase 5 hardening review (Open Question 2).

## Architecture Patterns

### System Architecture Diagram

```
 BUILD TIME (Phase 1 target: output "static" + node adapter + react + emdash)
 ---------------------------------------------------------------------------
  src/pages/*.astro + content collection (md)  --astro build-->  dist/client/**/*.html   (prerendered, 17 pages)
  public/ (fonts, favicons)                    ------------->  dist/client/ (static assets)
  emdash() integration                         ------------->  dist/client/_astro/*.js    (admin SPA chunks, ~18 MB, NOT linked from public pages)
                                                               dist/server/entry.mjs      (Node standalone server + EmDash routes, prerender:false)
                                                               dist/server/chunks/config_*.mjs  <-- DB path + uploads dir BAKED IN HERE
                                                               .emdash/migrations.json    (migration manifest, used by `emdash migrate`)

 RUN TIME (container: node ./dist/server/entry.mjs, HOST=0.0.0.0 PORT=4321)

  Browser --> [Cloudflare DNS/proxy, Traefik (Phase 5)] --> Node server
                |                                             |
                |  GET /, /projects/*, /about  ---------------+--> static handler serves dist/client/*.html
                |       (no DB access, Cache-Control: public, max-age=0, ETag)
                |
                |  /_emdash/admin, /_emdash/api/*  -----------+--> EmDash middleware (setup gate, auth, CSP headers)
                |                                             |        |-- first request: init DB, run pending migrations (auto mode),
                |                                             |        |   auto-seed default collections
                |                                             |        |-- SQLite (node:sqlite, WAL) at ./data/emdash.db   <-- volume /app/data
                |                                             |        '-- local media at ./data/uploads  <-- same volume
                |  /_emdash/api/media/file/<key>  ------------+--> anonymous GET, Range supported (206)
                |  /_image  ----------------------------------+--> Astro image endpoint (remote hrefs 403 by default)
                |
  WebAuthn passkey (rpId = hostname of EMDASH_SITE_URL)  <---->  /_emdash/api/auth/passkey/*  and  /_emdash/api/setup/*
```

### Recommended Project Structure (Phase 1 additions only)

```
/                               (branch emdash-migration)
├── astro.config.mjs            # + node adapter, react(), emdash(); output: "static" for now
├── src/live.config.ts          # new, required by EmDash (emdashLoader)
├── Dockerfile                  # new, multi-stage, ARG NODE_VERSION=24
├── .dockerignore               # new
├── .nvmrc                      # new: 24
├── .npmrc                      # new: engine-strict=true
├── package.json                # engines.node >=22.16.0, pinned deps
├── scripts/
│   ├── log.sh                  # existing, untouched
│   └── script-inventory.mjs    # new: baseline inventory + allowlist derive + compare (reused by GUARD-01 in Phase 3)
├── .planning/guards/script-allowlist.json   # derived allowlist (D-11); path is a planner choice
└── data/                       # runtime SQLite + uploads, gitignored

~/portfolio-baseline/2026-10-23/    (outside repo, D-10)
├── dist/                       # fresh build of main
├── inventory.json              # per-route script/link inventory with hashes
└── MANIFEST.txt                # git SHA, node/npm/astro versions, build command, date
```

### Pattern 1: Baseline-first sequencing (D-12)

**What:** capture on a clean build of `main` before any dependency or config change; create the branch afterward.
**Order:** (1) on `main`: `npm ci` under Node 24, `npm run build`, copy `dist/` to `~/portfolio-baseline/<date>/dist`, write `MANIFEST.txt` with `git rev-parse HEAD`, `node -v`, `npm -v`, `npx astro --version`. (2) `git switch -c emdash-migration`. (3) Add `scripts/script-inventory.mjs`, run it against the saved baseline dist to produce `inventory.json`, derive the allowlist. The existing repo `dist/` (built Sep 13) was byte-for-byte equal to a fresh build modulo whitespace in 17/17 files, so the baseline is stable. [VERIFIED: scratch compare]
**Measured baseline (fresh build of repo at HEAD 67e43a3, Astro 6.2.2):** 17 HTML files (home, projects index, 13 projects, about, 404). Per route: 4 inline scripts (3 classic + 1 module) except `/404` which has 5 (2 module); 0 external scripts; 0 `modulepreload`; 4 font `preload`; 1 stylesheet. [VERIFIED: scratch inventory run]

Five distinct inline script hashes (SHA-256 of exact inner text, CSP format):

| Hash                                                  | Type    | Bytes | Source                                                    |
| ----------------------------------------------------- | ------- | ----- | --------------------------------------------------------- |
| `sha256-1X+Qtehj3LJIBoJF+6CXrA2v2MSmxZykuiX0PeDQGfc=` | classic | 271   | theme bootstrap, `Layout.astro` lines 37-44               |
| `sha256-n9FjObMaBMueyJSDGWwmYbOw8llOB8uCSRQYMMjzzI4=` | classic | 426   | console banner, `Layout.astro` lines 45-53                |
| `sha256-nBjgE3v+D5WJbrQs62ShGC2d6WC/nv35blQO7AgyZVQ=` | classic | 776   | `g h/p/a` keyboard shortcut, `Layout.astro` lines 54-75   |
| `sha256-GDi/JH0wbC7CD6K+qsyPu1LB3gWLpzWIPKOksfhJSkw=` | module  | 345   | theme toggle from `Nav.astro` (bundled, inlined by Astro) |
| `sha256-F334q3DDzRUWRvu8VD/Dtf8/1/iaSQZEfbyncU3E1SI=` | module  | 160   | `/404` timestamp script (404 only)                        |

Correction to prior research: SUMMARY.md says the baseline is "inline theme bootstrap and console scripts, plus one module". There is also a third inline classic script (the `g` navigation shortcut), and `/404` carries a second module script. The allowlist must encode this. [VERIFIED: Layout.astro lines 37-75 read this session; inventory run]

### Pattern 2: Step-wise parity verification

Run the same two checks after every change: (a) whitespace-normalized HTML diff (`>\s+<` collapsed) between baseline `dist` and the new output; (b) inventory compare (script counts + hashes + modulepreload). Astro 6.2.2 -> 6.4.8 alone changes bytes only by removing one newline between `<link rel="stylesheet">` and `<style>`; scripts and hashes are identical. A raw byte or `sha256(html)` comparison therefore fails on all 17 files for a meaningless reason. [VERIFIED: scratch, first differing byte at offset 3166 was a newline]

Result matrix (all vs baseline, all passed except Astro 7, which was only measured):

| Step                                                 | HTML (normalized)                          | Script inventory                 |
| ---------------------------------------------------- | ------------------------------------------ | -------------------------------- |
| Astro 6.4.8 only, no integrations                    | identical (17/17)                          | identical                        |
| + node adapter + react + emdash, `output: "static"`  | identical (17/17), pages in `dist/client/` | identical                        |
| Docker image (Node 24 alpine) fetched over HTTP      | identical (17/17)                          | identical                        |
| Docker image (Node 22.16.0 alpine) fetched over HTTP | identical (17/17)                          | not re-run                       |
| Astro 7.4.2 variant (informational)                  | differs (CSS hash name, 341-byte module)   | counts same, module hash differs |

### Pattern 3: Phase 1 build configuration is `output: "static"`

With `output: "server"` the build warns `getStaticPaths() ignored in dynamic page /src/pages/projects/[...slug].astro` and emits no HTML (everything becomes SSR, and the dynamic page would lose its props). With `output: "static"` plus the Node adapter, EmDash's injected routes still run server-side (`prerender: false` at `emdash/dist/astro/index.mjs` line 2331) and all 17 existing pages stay prerendered into `dist/client/`. The build logs a per-page warning `Astro.request.headers was used when rendering the route ... not available on prerendered pages`; it is noise from EmDash middleware running at prerender time and did not change the output. No database is created by `astro build`. [VERIFIED: scratch build; `ls data` after build: no such directory]

### Pattern 4: Build-time-baked runtime config

`dist/server/chunks/config_*.mjs` contains the literal object `{"database":{"entrypoint":"emdash/db/sqlite","config":{"url":"file:./data/emdash.db"}, ...},"storage":{"entrypoint":"emdash/storage/local","config":{"directory":"./data/uploads","baseUrl":"/_emdash/api/media/file"}}, ...}`. [VERIFIED: grep of scratch `dist/server/chunks/config_BplWISrG.mjs`] Use fixed relative paths and make the container working directory `/app` with the volume at `/app/data`. Do not rely on `process.env.DATABASE_PATH` in `astro.config.mjs` unless the same value is set at build time. (The EmDash Node docs show `file:${process.env.DATABASE_PATH}`; that only works if `DATABASE_PATH` is exported during `astro build`. [CITED: docs.emdashcms.com/deployment/nodejs; VERIFIED failure mode in scratch container: "unable to open database file".])

### Anti-Patterns to Avoid

- **Setting DB or uploads path via runtime env only.** Baked at build (above).
- **`output: "server"` in Phase 1.** Breaks the existing static pages and defeats the baseline comparison; defer to Phase 3.
- **Comparing HTML by hash or raw bytes.** Use whitespace normalization.
- **Copying the SQLite `.db` file alone for backup.** WAL holds committed data in `-wal`. Use `sqlite3 <db> ".backup <file>"`. [CITED: docs.emdashcms.com/guides/backups; VERIFIED: `.backup` + `PRAGMA integrity_check` returned `ok` in scratch]
- **Putting the baseline or setup-wizard DB in the repo.** `data/` must be gitignored; local passkeys bind to `localhost` and are worthless elsewhere.
- **Excluding `*.md` blindly in `.dockerignore`.** A root-level `*.md` rule happened to keep `src/content/projects/*.md` (Docker's `*` is not recursive), but write explicit names instead so a future `**/*.md` edit cannot silently empty the project collection.

## Don't Hand-Roll

| Problem                                 | Don't Build                      | Use Instead                                                  | Why                                                                                                                                                                                                                                         |
| --------------------------------------- | -------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Passkey / WebAuthn enrollment and login | Custom WebAuthn endpoints        | EmDash built-in (`@emdash-cms/auth`)                         | Crypto and challenge storage are solved; up to 10 passkeys per user, cannot delete the last one. [CITED: docs.emdashcms.com/guides/authentication]                                                                                          |
| Migration status and gating             | Custom "pending migration" check | `emdash migrate --check` (exit 0 ok, 2 pending, 3 unknown)   | Works inside the container against the baked manifest. [VERIFIED: ran in container, exit 0; exit codes CITED: docs.emdashcms.com/reference/cli]                                                                                             |
| SQLite online backup                    | `cp` of the DB file              | `sqlite3 db ".backup out"` then `PRAGMA integrity_check`     | WAL correctness.                                                                                                                                                                                                                            |
| Container image                         | Hand-rolled Node install steps   | Official `node:<ver>-alpine`, Astro's multi-stage SSR recipe | Astro docs recipe uses `prod-deps` stage with `npm ci --omit=dev`. [CITED: docs.astro.build/en/recipes/docker]                                                                                                                              |
| HTML parsing for the inventory          | Ad hoc greps per route           | One small script emitting JSON (below)                       | Astro output is regular, so a regex over `<script>` and `<link>` is sufficient; keep it in one reviewed file reused by GUARD-01. If EmDash later emits JSON-LD, classify `type="application/ld+json"` as data, not executable (Pitfall 15). |
| Virtual passkeys for testing            | Mock the WebAuthn API            | Chrome DevTools Protocol `WebAuthn.addVirtualAuthenticator`  | Real browser WebAuthn path; used in this research.                                                                                                                                                                                          |

**Key insight:** every hard part of this phase (auth, migrations, media serving, admin) is already inside `emdash`; Phase 1's job is to pin, package, measure and write down, not to build.

## Runtime State Inventory

Phase 1 renames nothing and moves no stored data, but the milestone moves hosting, so the explicit answers are recorded for the planner.

| Category            | Items Found                                                                                                                                                                                | Action Required                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stored data         | None for Phase 1. The only database is a throwaway local `data/emdash.db` created by the spike.                                                                                            | None; delete `data/` after the spike (it holds a localhost-bound passkey and a test admin).                                                                        |
| Live service config | `main` auto-deploys to Cloudflare Pages on push; build command `npm run build`, Node 22 (CLAUDE.md "Deployment").                                                                          | None in Phase 1. Keep all work on `emdash-migration` and push nothing (D-13). Pages continues to build `main` unchanged.                                           |
| OS-registered state | None found. No launchd/cron/pm2 entries reference this repo. [ASSUMED: not enumerated on the host]                                                                                         | None.                                                                                                                                                              |
| Secrets / env vars  | None required by Phase 1. `EMDASH_SITE_URL` must be set at runtime for the setup wizard even on localhost preview. `EMDASH_ENCRYPTION_KEY` is only needed for plugin secrets (no plugins). | Document env list for Phase 5.                                                                                                                                     |
| Build artifacts     | Existing `dist/` (Sep 13) equals a fresh build; `node_modules/` holds Astro 6.2.2. New artifacts: `.emdash/migrations.json`, `data/`, `emdash-env.d.ts` (dev only).                        | Gitignore `data/` and `.emdash/migrations.json`; keep `.emdash/` otherwise open because SCHEMA-05 will commit generated types (default output `.emdash/types.ts`). |

## Common Pitfalls

### Pitfall 1: Bare package names resolve to the Astro 7 line

**What goes wrong:** `npm i astro @astrojs/node @astrojs/react` installs 7.4.2 / 11.1.9 / 7.1.1; `@astrojs/node@11` has peer `astro ^7.2.1`, `@astrojs/react@7` needs Node >=22.23.4.
**How to avoid:** use the explicit install command above; after install assert with `npm ls astro @astrojs/node @astrojs/react emdash react` and commit the lockfile.
**Warning signs:** `npm ls` shows `astro@7.x`; Node engine warnings mentioning 22.23.4.

### Pitfall 2: Database and uploads paths baked at build time

**What goes wrong:** container starts, first admin request logs `EmDash middleware error: unable to open database file` (ERR*SQLITE_ERROR, errcode 14), and `/_emdash/api/setup/status` returns `NOT_CONFIGURED`.
**Why:** `astro.config.mjs` is evaluated at build; the result is serialized into `config*\*.mjs`.
**How to avoid:** static `file:./data/emdash.db`and`./data/uploads`; `WORKDIR /app`; `VOLUME /app/data`; create `data`owned by`node`.
**Warning signs:** DB file appears under an unexpected cwd; `docker exec ... ls /app/data` is empty.

### Pitfall 3: `output: "server"` breaks the existing pages in Phase 1

**How to avoid:** `output: "static"` until Phase 3 (Pattern 3). Phase 3 removes the setting (or sets `server`) in the same change that rewrites `src/lib/projects.ts` and drops `getStaticPaths`.

### Pitfall 4: Whitespace-only HTML differences

**What goes wrong:** every route "differs" after the Astro bump.
**How to avoid:** collapse `>\s+<` before comparing; compare scripts by hash, not by position.

### Pitfall 5: Setup wizard refuses to start without `EMDASH_SITE_URL`

**What goes wrong:** step 2 shows "Set siteUrl or EMDASH_SITE_URL before running production setup" even on `localhost`, in a built (preview) server.
**How to avoid:** export `EMDASH_SITE_URL=http://localhost:<port>` when running `astro preview` or the container for the spike. For Phase 5 set it to `https://dev.zeikcookson.com` at build and run time (needed behind a TLS-terminating proxy; at build it enables local image optimization). [CITED: docs.emdashcms.com/deployment/nodejs]

### Pitfall 6: First-visitor admin claim is real

**What goes wrong:** on any fresh database `GET /_emdash/api/setup/status` answers anonymously `{"needsSetup":true,"step":"start","authMode":"passkey"}` and the setup endpoints accept the first caller. The setup-admin route only checks that `countUsers() == 0`. [VERIFIED: curl; `dist/astro/routes/api/setup/admin.mjs` lines 26-39 read this session]
**How to avoid:** complete the wizard immediately after first deploy, before the URL is shared (ADMIN-02, Phase 5). Never leave a fresh database reachable on a public hostname. In a production build the dev routes are inert: `dev-bypass` returns 403 "only available in development mode" (GET and POST), `dev-reset` POST returns 403 and GET returns the site 404 page. [VERIFIED: curl against the container]

### Pitfall 7: Virtual authenticator limits when testing passkeys

**What goes wrong:** `Chrome only supports one internal authenticator per environment`; virtual authenticators vanish when the CDP session closes.
**How to avoid:** keep one persistent CDP session for the whole flow, add the second authenticator with `transport: "usb"` (ctap2, resident key, user verification), and toggle `setAutomaticPresenceSimulation` to choose which one answers. Headless Chrome 155 on this Mac worked. The page must be served from `localhost` (not `127.0.0.1`; IP addresses are not valid rpIds).

### Pitfall 8: Recovery without email is destructive and re-opens the claim window

**Facts (tested):** deleting only `users` rows is not enough: the wizard step 1 answers "Setup has already been completed" until the option `emdash:setup_complete` is also deleted. Deleting `users` cascades to `credentials`, `auth_tokens`, `oauth_accounts`, `_emdash_api_tokens` (agent PATs), `_emdash_oauth_tokens`, `_emdash_authorization_codes`, `_emdash_entry_locks`; it sets `bylines.user_id` and comment author to NULL. Re-running the wizard re-prompts for site title and tagline and overwrites `site:title` and `site:tagline`; collections, fields and taxonomies (counts 2/6/2) were unchanged because the seed only applies to an empty schema. [VERIFIED: scratch drill]
**How to avoid / procedure:** see Code Examples "DB-level recovery". Do it with public ingress closed or in a short window, because between the SQL and the new passkey anyone can claim admin. After recovery, re-create any agent tokens.

### Pitfall 9: Node 22 SQLite warning

`(node:1) ExperimentalWarning: SQLite is an experimental feature` appears on Node 22.16.0 and not on Node 24. Harmless; one more reason for D-15's Node 24. [VERIFIED: container logs; CITED: docs.emdashcms.com/deployment/nodejs]

### Pitfall 10: `engines` is only a warning

`npm ci` on Node 20 with `engines.node >=22.16.0` prints `EBADENGINE` as a warning and continues; with `.npmrc` `engine-strict=true` it exits with `npm error code EBADENGINE`. Add `.npmrc` to make FOUND-04 enforceable in dev and Docker builds. [VERIFIED: scratch, Node 20.20.2]

### Pitfall 11: Residual dependency advisories on the Astro 6 line

After `npm audit fix` (non-breaking, applied in scratch) 4 findings remain: `astro` (critical, `<=7.3.1`, includes RCE via AVIF image optimization GHSA-26w7-cxv4-gfx2, patched only in 7.2.8 with no 6.x backport listed), `@astrojs/node` (high, `<=11.1.2`, malformed Host port; patched 11.1.3, no 10.x backport listed), `sharp` (high) and `esbuild` (low). The current site on Astro 6.2.2 already reports the same `astro` finding. [VERIFIED: npm audit --omit=dev, scratch; CITED: github.com/advisories/GHSA-26w7-cxv4-gfx2, GHSA-qh8j-hqjv-7m4x] Practical exposure on this site is low (no untrusted AVIF is processed; `/_image?href=https://...` returned 403 by default; Host-header error returns 500 and the process survives unless the opt-in `staticHeaders` is enabled), but it must be a recorded decision (Open Question 1). Run `npm audit fix` once after install and re-run the parity checks, because it changes transitive versions (fast-uri, http-cache-semantics, svgo, vite, devalue).

### Pitfall 12: Session files and container user

Astro's Node adapter stores sessions under `<cacheDir>/sessions` (`node_modules/.astro/sessions` resolved at build). The runtime user needs write access, and sessions are lost on redeploy unless that path is on a volume. [VERIFIED: `@astrojs/node/dist/index.js` lines 41-47 via grep; CITED: docs.emdashcms.com/deployment/secrets "On Node, Astro's filesystem session store is used".] The Dockerfile below creates `node_modules/.astro` owned by `node`. Optional: point the session driver at `./data/sessions` so logins survive redeploys.

### Pitfall 13: `emdash doctor` assumes `data.db`

`emdash doctor` reported `database: not found at /app/data.db` while `emdash migrate --status` correctly found `/app/data/emdash.db`. Pass `--database ./data/emdash.db` to `doctor`; use `migrate --check` for gating. [VERIFIED: container]

### Pitfall 14: Image size and architecture

The Node 24 alpine image is about 660 MB (admin dependencies are large). Built here as arm64 (Apple Silicon Docker Desktop). If the Dokploy host is amd64, Phase 5 must build or test `--platform linux/amd64`. [ASSUMED: Dokploy host architecture not checked.]

### Pitfall 15: Future script classification (Phase 3 note)

EmDash ships `JsonLdScript.astro` and an `EmDashHead` component; if they emit `<script type="application/ld+json">`, a naive "no `<script` tag" rule fails. Record `type` in the allowlist and treat `application/ld+json` as data. [ASSUMED: not tested because Phase 1 renders no EmDash head.] Also, the default `toolbar: "server"` may inject edit UI for authenticated editors; run GUARD-01 anonymously. [CITED: docs.emdashcms.com/reference/configuration]

## Code Examples

### package.json target (FOUND-01, FOUND-04)

```json
{
  "name": "portfolio",
  "type": "module",
  "version": "0.0.1",
  "engines": { "node": ">=22.16.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/node": "^10.1.4",
    "@astrojs/react": "^5.0.7",
    "astro": "^6.4.8",
    "emdash": "^1.3.1",
    "react": "^19.3.1",
    "react-dom": "^19.3.1"
  },
  "devDependencies": { "@astrojs/check": "^0.9.9", "typescript": "^6.0.3" }
}
```

Current repo for reference: `"engines": { "node": ">=22.12.0" }` and `"dependencies": { "astro": "^6.2.2" }` (package.json lines 5-7 and 14-16, read this session). Add `.npmrc` containing `engine-strict=true` and `.nvmrc` containing `24`.

### astro.config.mjs (verified to build and serve)

```js
// @ts-check
// Source: docs.emdashcms.com/deployment/nodejs, adapted; built and run in scratch spike
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
  site: "https://dev.zeikcookson.com",
  output: "static", // Phase 3 flips to server. Keeps every existing page prerendered.
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      // Baked into the server bundle at build time. Relative to process cwd (/app in the container).
      database: sqlite({ url: "file:./data/emdash.db" }),
      storage: local({
        directory: "./data/uploads",
        baseUrl: "/_emdash/api/media/file",
      }),
    }),
  ],
});
```

Current repo config for reference (astro.config.mjs lines 5-7): `export default defineConfig({ site: "https://dev.zeikcookson.com", });` The `site` value must be preserved. Optional: `emdash({ fonts: false })` avoids bundling Noto Sans from a Google font provider at build (`fontProviders.google()` in `emdash/dist/astro/index.mjs` line 530); untested effect, so leave default unless the Docker build needs to be network-hermetic. [ASSUMED: effect of `fonts: false` on build network use not tested]

### src/live.config.ts

```ts
// Source: docs.astro.build/en/guides/cms/emdash and docs.emdashcms.com/existing-project
import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

export const collections = {
  _emdash: defineLiveCollection({ loader: emdashLoader() }),
};
```

The existing `src/content.config.ts` (file collection `projects`) coexists with it. [CITED: docs.emdashcms.com/existing-project]

### Dockerfile (built and run on Node 24 and Node 22.16.0)

```dockerfile
# syntax=docker/dockerfile:1
ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/.emdash ./.emdash
COPY package.json ./
RUN mkdir -p data node_modules/.astro && chown -R node:node data node_modules/.astro
USER node
VOLUME /app/data
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
```

`.emdash/` carries `migrations.json`, which `emdash migrate --check|--status` reads at deploy time (Phase 5). `.dockerignore`: `node_modules`, `dist`, `data`, `.git`, `.astro`, `.planning`, `.claude`, `.agents`, `.cursor`, `.vscode`, `.impeccable`, `.env`, `.env.*`. Do not exclude `src/content`.

Run and verify (host port 4400 to avoid clashing with preview):

```bash
docker build -t portfolio:spike .
docker build --build-arg NODE_VERSION=22.16.0 -t portfolio:spike22 .   # floor check
docker run -d --name pf -p 4400:4321 -e EMDASH_SITE_URL=http://localhost:4400 -v pf-data:/app/data portfolio:spike
node scripts/script-inventory.mjs fetch http://127.0.0.1:4400 ~/portfolio-baseline/<date>/inventory.json /tmp/fetched
```

### Inventory script (tested; keep in repo for GUARD-01 reuse)

```js
// scripts/script-inventory.mjs  (usage: node script-inventory.mjs <distDir> <out.json>)
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";

const [dist, out] = process.argv.slice(2);
const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });
const attr = (s, k) => {
  const m = s.match(new RegExp(`\\s${k}(?:="([^"]*)"|='([^']*)'|(?=[\\s>/]))`));
  return m ? (m[1] ?? m[2] ?? "") : null;
};

const routes = {};
for (const file of walk(dist).sort()) {
  const rel = relative(dist, file).split(sep).join("/");
  const route =
    rel === "index.html"
      ? "/"
      : "/" + rel.replace(/\/index\.html$/, "").replace(/\.html$/, "");
  const html = readFileSync(file, "utf8");
  const scripts = [
    ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g),
  ].map((m) => {
    const src = attr(m[1], "src");
    return {
      kind: src ? "external" : "inline",
      type: attr(m[1], "type") ?? "classic",
      src,
      bytes: m[2].length,
      sha256: src
        ? null
        : "sha256-" + createHash("sha256").update(m[2]).digest("base64"),
    };
  });
  const links = [...html.matchAll(/<link\b([^>]*)>/g)].map((m) => ({
    rel: attr(m[1], "rel"),
    href: attr(m[1], "href"),
  }));
  const count = (rel) => links.filter((l) => l.rel === rel).length;
  routes[route] = {
    scripts,
    counts: {
      script: scripts.length,
      inline: scripts.filter((s) => s.kind === "inline").length,
      external: scripts.filter((s) => s.kind === "external").length,
      module: scripts.filter((s) => s.type === "module").length,
      modulepreload: count("modulepreload"),
      preload: count("preload"),
      stylesheet: count("stylesheet"),
    },
  };
}
writeFileSync(out, JSON.stringify({ routes }, null, 2) + "\n");
```

The tested scratch version also stored `htmlBytes` and a raw HTML hash; drop the raw hash (Pitfall 4). Derive the committed allowlist (D-11) from this JSON as: per route `{ script, module, external, modulepreload }` counts, plus a global set of allowed inline `sha256` values keyed by `type`. A route passes if counts are `<=` the allowlist and every inline hash is in the set. Add a `normalize` helper (`html.replace(/>\s+</g, "><")`) for the HTML parity diff.

Allowlist shape (values from the baseline above):

```json
{
  "generatedFrom": "main@<sha> astro 6.2.2",
  "inlineHashes": {
    "classic": [
      "sha256-1X+Qtehj3LJIBoJF+6CXrA2v2MSmxZykuiX0PeDQGfc=",
      "sha256-n9FjObMaBMueyJSDGWwmYbOw8llOB8uCSRQYMMjzzI4=",
      "sha256-nBjgE3v+D5WJbrQs62ShGC2d6WC/nv35blQO7AgyZVQ="
    ],
    "module": [
      "sha256-GDi/JH0wbC7CD6K+qsyPu1LB3gWLpzWIPKOksfhJSkw=",
      "sha256-F334q3DDzRUWRvu8VD/Dtf8/1/iaSQZEfbyncU3E1SI="
    ]
  },
  "routes": {
    "/": { "script": 4, "module": 1, "external": 0, "modulepreload": 0 },
    "/404": { "script": 5, "module": 2, "external": 0, "modulepreload": 0 }
  }
}
```

### Passkey enrollment, sign-in and recovery (as run in scratch)

Persistent CDP session (Node 24 global `WebSocket`; Chrome started with `--headless=new --remote-debugging-port=9333 --user-data-dir=<scratch>`):

```js
await send("WebAuthn.enable", { enableUI: false });
const a1 = await send("WebAuthn.addVirtualAuthenticator", {
  options: {
    protocol: "ctap2",
    transport: "internal",
    hasResidentKey: true,
    hasUserVerification: true,
    isUserVerified: true,
    automaticPresenceSimulation: true,
  },
});
// ... complete wizard at http://localhost:4399/_emdash/admin/setup, click "Create passkey" ...
// Second passkey: Settings > Security (/_emdash/admin/settings/security) > Add Passkey, name it, then:
await send("WebAuthn.setAutomaticPresenceSimulation", {
  authenticatorId: a1.authenticatorId,
  enabled: false,
});
const a2 = await send("WebAuthn.addVirtualAuthenticator", {
  options: {
    protocol: "ctap2",
    transport: "usb",
    hasResidentKey: true,
    hasUserVerification: true,
    isUserVerified: true,
    automaticPresenceSimulation: true,
  },
});
```

Observed: setup wizard (Site, Account, Sign In steps) completed; credentials table held two rows ("Setup passkey", "Second device", `rpId=localhost`, device type `singleDevice`); after clearing cookies, "Sign in with Passkey" worked with only authenticator 2 enabled and then with only authenticator 1 enabled (signCounts advanced independently). [VERIFIED: scratch]

DB-level recovery (tested; backup first, ideally with the server stopped or ingress closed):

```bash
sqlite3 data/emdash.db ".backup data/pre-recovery.db" && sqlite3 data/pre-recovery.db "PRAGMA integrity_check"   # must print: ok
sqlite3 data/emdash.db "PRAGMA foreign_keys=ON; DELETE FROM users; DELETE FROM options WHERE name IN ('emdash:setup_complete','emdash:setup_state');"
# Then open https://<site>/_emdash/admin, complete the wizard at the production hostname, enroll two new passkeys, recreate agent tokens.
```

`PRAGMA foreign_keys=ON` matters: the CLI default is OFF, so without it the cascade to `credentials` would not run. Schema and content survive. [VERIFIED: scratch drill; FK list from `pragma_foreign_key_list`]

### Confirmed API names and signatures (D-07)

```ts
// All verified by importing the installed package (typeof === "function") and reading its .d.mts
import { getEmDashCollection, getEmDashEntry, getSiteSettings, getSiteSetting, getMenu, getMenus } from "emdash";
import { PortableText, EmDashHead, Image } from "emdash/ui";          // NOT exported from "emdash"
import { emdashLoader } from "emdash/runtime";
import emdash, { local, s3, memoryCache } from "emdash/astro";
import { sqlite, libsql, postgres } from "emdash/db";

getEmDashCollection<T extends string, D = InferCollectionData<T>>(type: T, filter?: CollectionFilter): Promise<CollectionResult<D>>
//  CollectionResult: { entries: ContentEntry<T>[]; error?: Error; cacheHint: CacheHint; nextCursor?; hasMore? }   (errors are returned, not thrown)
//  CollectionFilter: { status?: "draft"|"published"|"archived"; limit?; where?; orderBy?: e.g. { date: "desc" }; locale?; cursor? | offset? }
//  default order is { created_at: "desc" }, so the project list must pass orderBy explicitly
getEmDashEntry<T extends string, D, S>(type: T, id: string, options?: { locale?: string; references?: S }): Promise<EntryResult<D, ...>>
//  EntryResult: { entry: ContentEntry | null; error?: Error; isPreview: boolean; fallbackLocale?; cacheHint }
getSiteSettings(): Promise<Partial<SiteSettings>>
getSiteSetting<K extends SiteSettingKey>(key: K): Promise<SiteSettings[K] | undefined>
```

`PortableText` and `EmDashHead` live in `emdash/ui` (`node_modules/emdash/src/ui.ts`, "Main component (wrapper with EmDash defaults) PortableText," and "EmDashHead,"). `import("emdash")` returned `PortableText: undefined`, `EmDashHead: undefined`, which is why the earlier research naming "from emdash" would fail at the executor. [VERIFIED: scratch node import + ui.ts read]

### Local media round trip (D-04 media decision)

```js
// in an authenticated browser page (cookie session). Header X-EmDash-Request: 1 is required for cookie-authenticated writes.
const fd = new FormData();
fd.append("file", blob, "pixel.png");
await fetch("/_emdash/api/media", {
  method: "POST",
  body: fd,
  headers: { "X-EmDash-Request": "1" },
});
// -> 201, item.url = "/_emdash/api/media/file/<ulid>.png", file on disk at ./data/uploads/<ulid>.png
// anonymous GET -> 200 image/png; with "Range: bytes=0-9" -> 206, content-range: bytes 0-9/70
```

## Spike Findings and Decisions to Record in PROJECT.md (FOUND-03, success criterion 4 and 5)

| #   | Question                                              | Finding (evidence)                                                                                                                                                                                                                                                                                                                                                | Recommended recorded decision                                                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Does core EmDash run on Node + SQLite without extras? | Yes. Build passes and server boots with only `emdash`, `@astrojs/node`, `@astrojs/react`, `react`, `react-dom`; no sandbox runner, Worker Loader, wrangler, S3 SDK, plugin or env secret needed (setup needs `EMDASH_SITE_URL`). Auto-migrations and auto-seed run on first request. [VERIFIED: scratch + container]                                              | "EmDash 1.3.1 runs on Node 24 + `node:sqlite` with no extras. Config: node standalone, react(), emdash({ sqlite, local })."                                                                                                                                                                             |
| 2   | Two passkeys and recovery                             | Two passkeys enrolled; each signs in independently; max 10 per user, last cannot be deleted [CITED]. Recovery without email = DB-level reset (tested drill above); magic link needs an email provider that is not configured [CITED].                                                                                                                             | "Two passkeys enrolled on the production hostname (Phase 5). Recovery: documented SQLite procedure (backup, delete users and setup flags, re-run wizard with ingress closed, re-enroll, recreate agent tokens). Built-in GitHub login is an optional extra recovery path, undecided (Open Question 2)." |
| 3   | Node 24 compatibility                                 | Build and run OK on Node 24.17.0 (host) and 24.22.1 (container); no SQLite warning. Floor Node 22.16.0 also builds and serves identical pages (ExperimentalWarning only). [VERIFIED]                                                                                                                                                                              | "Node 24 (`.nvmrc`, Dockerfile). `engines.node >=22.16.0` with `engine-strict`. No fallback to 22 needed."                                                                                                                                                                                              |
| 4   | Media storage on Node                                 | Local volume works: upload, anonymous serve, Range 206, restricted CSP on media (`sandbox; default-src 'none'; img-src 'self'`). S3 needs two AWS SDK packages and credentials; adds signed uploads. Media is not in DB backups. [VERIFIED local; CITED S3]                                                                                                       | "Local storage on the same `/app/data` volume as SQLite (one volume, one backup unit). Revisit S3 only when real media volume or durability demands (CONT-03)."                                                                                                                                         |
| 5   | API names                                             | `getEmDashCollection`, `getEmDashEntry`, `getSiteSettings`, `getSiteSetting`, `getMenu`, `getMenus` from `"emdash"`; `PortableText`, `EmDashHead`, `Image` from `"emdash/ui"`; `emdashLoader` from `"emdash/runtime"`; `sqlite`/`libsql`/`postgres` from `"emdash/db"`; `local`/`s3` from `"emdash/astro"`. `d1`/`r2` are Cloudflare-only and dropped. [VERIFIED] | Record the import table and the signatures above.                                                                                                                                                                                                                                                       |
| T1  | Tags storage tension                                  | `multiSelect` with no options accepts arbitrary strings via the API (created `["Anything","Free Form Tag"]`, HTTP 201); stored as JSON. [VERIFIED API; CITED docs]                                                                                                                                                                                                | Decide: `multiSelect` without options. Gate for Phase 2: confirm the admin chip input accepts new values and the CLI/MCP path does too.                                                                                                                                                                 |
| T2  | Stats placement tension                               | `repeater` with sub-fields `label` (string), `value` (string), `variant` (select default/green/accent) works; an invalid variant returned 400 `VALIDATION_ERROR`. Settings custom keys: docs silent. [VERIFIED API; CITED docs]                                                                                                                                   | Decide: per-project `stats` = repeater on `projects`; About cells on the `about` entry; Settings hold only fixed General/Social/SEO keys. Gate in Phase 2 for the `about` shape.                                                                                                                        |
| T3  | EmDash version tension                                | `latest` dist-tag is 1.3.1 (2026-10-18). Behavior changes from the 1.3.1 and 1.2.0 changelog: publishing removes the automatic slug-change redirect; `EMDASH_SITE_URL` needed at build behind HTTPS proxy for local image optimization. [CITED: GitHub CHANGELOG]                                                                                                 | Decide: pin `emdash ^1.3.1`; update PROJECT.md text that says 1.0.                                                                                                                                                                                                                                      |
| T4  | Public JS baseline tension                            | Measured baseline above (4 inline scripts per route, 5 on 404, 0 external, 0 modulepreload).                                                                                                                                                                                                                                                                      | Decide: rule is "no script, modulepreload or module tag beyond the allowlist; inline scripts must match allowed hashes." Commit the allowlist (D-11).                                                                                                                                                   |
| T5  | Workers plan, LOADER, Access vs passkeys              | Moot under D-01 and D-08.                                                                                                                                                                                                                                                                                                                                         | Record as superseded, no action.                                                                                                                                                                                                                                                                        |
| T6  | Rendering mode                                        | D-09 SSR; not exercised until Phase 3. Phase 1 stays prerendered via `output: "static"`.                                                                                                                                                                                                                                                                          | Record gate: Phase 3 flips to SSR and measures.                                                                                                                                                                                                                                                         |

## State of the Art

| Old Approach (earlier research)                           | Current Approach                                                                            | When Changed                         | Impact                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| `@emdash-cms/cloudflare` `d1()`/`r2()`, Workers, `LOADER` | `emdash/db` `sqlite()` + `emdash/astro` `local()`, `@astrojs/node` standalone               | D-01 (2026-10-23)                    | CF-specific research (Workers plan, wrangler, Access exclusive mode) is superseded. |
| "Core EmDash may need the Worker Loader binding" (open)   | Not needed on Node                                                                          | verified this phase                  | Closes the biggest unknown.                                                         |
| `emdash/db` README import of `d1`                         | `d1` is only in `@emdash-cms/cloudflare`                                                    | n/a                                  | Irrelevant now.                                                                     |
| EmDash docs: Node `v22.23.4` required                     | `v22.16.0` is enough on Astro 7.3 or earlier; the 22.23.4 requirement is tied to Astro 7.4+ | docs.emdashcms.com/deployment/nodejs | FOUND-04 floor of 22.16 stands on Astro 6.                                          |

**Deprecated/outdated:**

- Earlier research statement "Do not add `@astrojs/node`": reversed by D-03.
- Earlier research "`dist/index.html` has inline theme bootstrap and console scripts plus one module": incomplete; see the 5-hash table.

## Assumptions Log

| #   | Claim                                                                                                                                              | Section                                        | Risk if Wrong                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------- |
| A1  | `npx astro add node                                                                                                                                | react` might resolve the Astro 7 line adapters | Standard Stack                                                                                 | Low; the plan pins by hand anyway. |
| A2  | The Dokploy host is amd64 and needs `--platform linux/amd64` testing                                                                               | Pitfall 14                                     | Phase 5 image could fail to start; test in Phase 5.                                            |
| A3  | `emdash({ fonts: false })` removes the build-time Google font fetch                                                                                | Code Examples                                  | Docker build keeps a network dependency; minor.                                                |
| A4  | EmDash `EmDashHead`/`JsonLdScript` may emit `application/ld+json` scripts                                                                          | Pitfall 15                                     | GUARD-01 (Phase 3) could false-fail; classify by `type`.                                       |
| A5  | Authenticated-editor toolbar injection (`toolbar: "server"`) adds scripts on SSR pages for signed-in users only                                    | Pitfall 15                                     | CI check must run anonymously; verify in Phase 3.                                              |
| A6  | No launchd/cron/pm2 entries reference this repo                                                                                                    | Runtime State Inventory                        | Negligible for Phase 1.                                                                        |
| A7  | Dokploy/Traefik rejects malformed `Host` headers before they reach Node, mitigating the `@astrojs/node` advisory                                   | Pitfall 11                                     | Low-severity availability issue remains; verify in Phase 5.                                    |
| A8  | Practical exposure to the AVIF/sharp advisory is low because no untrusted AVIF is processed and remote image hosts are denied by default           | Pitfall 11                                     | If a future feature accepts uploaded AVIF or allowlists remote hosts, exposure rises; revisit. |
| A9  | A built GitHub OAuth provider (`authProviders: [github()]`) would link to the existing admin by verified email and serve as an extra recovery path | Spike table row 2                              | Not tested; it also adds an OAuth app and client secret to manage.                             |

## Open Questions

1. **Astro 6 (locked) versus Astro 7 given advisories.**
   - What we know: after `npm audit fix`, Astro 6.4.8 / `@astrojs/node` 10.1.4 retain 4 findings (1 critical AVIF RCE in the sharp/libheif path, 1 high Host-port crash, 1 high sharp, 1 low esbuild) with no listed 6.x backports; the current repo's Astro 6.2.2 already shows the `astro` finding. Astro 7.4.2 + node 11.1.9 + react 7.1.1 builds with EmDash 1.3.1 and audits clean, but needs Node >=22.23.4, changes hashes, and is declared out of scope.
   - What's unclear: whether the user accepts the residual risk or wants the Astro 7 migration pulled in.
   - Recommendation: keep Astro 6.4.x for Phase 1 (locked), record the residual advisories and mitigations (no AVIF uploads, remote image hosts empty, proxy rejects malformed Host) as a named gate in PROJECT.md, and ask the user before Phase 5 whether to bump.

2. **Extra recovery path (GitHub login) and the recovery claim window.**
   - What we know: D-08 says passkeys only, no email; recovery is the DB procedure. During recovery the wizard is open to anyone who can reach the site. EmDash ships GitHub/Google/Microsoft providers in core (no plugin).
   - What's unclear: whether the user wants an optional GitHub login as a second factor of recovery, or an operational control (temporary ingress block) instead.
   - Recommendation: record the DB procedure as the decision; list GitHub login as an optional hardening to decide in Phase 5; do not add it in Phase 1.

3. **Where the inventory script and allowlist live.** Recommended `scripts/script-inventory.mjs` and a small committed JSON (path is the planner's call); the script is reused by Phase 3 GUARD-01.

4. **Uncommitted `.gitignore` change on `main`.** `git status` shows ` M .gitignore` adding `.vscode/` (a trailing-space line at line 32). It will ride along when switching branches. Ask the user whether to commit it on `main` or carry it onto the branch, and do not discard it. Also add `data/` and `.emdash/migrations.json` to `.gitignore` on the branch.

5. **Should `.emdash/migrations.json` be committed?** It is regenerated on every build and is needed by `emdash migrate --check` in CI (GUARD-02, Phase 5). Recommendation: do not commit it; CI builds first. Revisit in Phase 5.

## Environment Availability

| Dependency                           | Required By                            | Available             | Version                                                                                  | Fallback                                                               |
| ------------------------------------ | -------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Node (nvm)                           | build, preview, floor test             | Yes                   | 24.17.0 (default), 22.23.0, 20.20.2                                                      | n/a                                                                    |
| npm                                  | install, audit                         | Yes                   | 11.13.0 (Node 24); 10.8.2 (Node 20)                                                      | n/a                                                                    |
| Docker daemon                        | D-05 image build                       | Yes                   | 29.8.1, Docker Desktop, aarch64; pulls of `node:24-alpine`, `node:22.16.0-alpine` worked | n/a                                                                    |
| sqlite3 CLI                          | backup and recovery drill              | Yes                   | 3.54.0 (`/usr/bin/sqlite3`)                                                              | `node:sqlite` script                                                   |
| Google Chrome                        | headless virtual passkey authenticator | Yes                   | 155.0.8059.86                                                                            | Manual passkey enrollment in a real browser (user-verified checkpoint) |
| curl, git, rsync                     | verification, branch                   | Yes                   | n/a                                                                                      | n/a                                                                    |
| Dokploy                              | Phase 5 only                           | Not needed this phase | n/a                                                                                      | n/a                                                                    |
| Network access to npm and Docker Hub | installs, base images                  | Yes                   | n/a                                                                                      | n/a                                                                    |

**Missing dependencies with no fallback:** none.
**Not used and not needed:** `wrangler`, Cloudflare account access.

## Validation Architecture

`.planning/config.json` does not exist, so `workflow.nyquist_validation` is absent and treated as enabled.

### Test Framework

| Property           | Value                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | None in the repo (no test runner, no `.github/`). Use build/CLI assertions and Node's built-in `node --test` only if a script gets unit tests. |
| Config file        | none, see Wave 0                                                                                                                               |
| Quick run command  | `npm run build && node scripts/script-inventory.mjs dist/client /tmp/inv.json` (compare step below)                                            |
| Full suite command | `npm ci && npx astro check && npm run build` then the Docker verification block                                                                |

### Phase Requirements to Test Map

| Req ID   | Behavior                                                                                                                 | Test Type          | Automated Command                                                                                                                                                         | File Exists?                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| FOUND-02 | Baseline dir has 17 HTML files, `inventory.json` has 17 routes, `MANIFEST.txt` SHA equals the `main` HEAD SHA at capture | smoke              | `find ~/portfolio-baseline/<date>/dist -name '*.html' \| wc -l` (expect 17); `node -e` count of `Object.keys(routes)` (17)                                                | Wave 0 (script)                      |
| FOUND-01 | Pins resolve to Astro 6.4.x / node 10.x / react-adapter 5.x / EmDash 1.3.x / React 19                                    | smoke              | `npm ls astro @astrojs/node @astrojs/react emdash react --depth=0`                                                                                                        | n/a                                  |
| FOUND-01 | `astro build` passes; pages and scripts match baseline                                                                   | integration        | `npm run build && node scripts/script-inventory.mjs compare ~/portfolio-baseline/<date>/inventory.json dist/client` (exit 0) plus normalized HTML diff                    | Wave 0                               |
| FOUND-01 | Docker image builds and serves identical pages                                                                           | integration        | `docker build -t portfolio:spike .` then run + fetch all 17 routes and compare                                                                                            | Wave 0                               |
| FOUND-01 | EmDash boots on SQLite in the image                                                                                      | smoke              | `curl -s localhost:4400/_emdash/api/setup/status` returns `"success":true`; `docker exec pf node_modules/.bin/emdash migrate --check` exits 0                             | n/a                                  |
| FOUND-04 | Floor enforced                                                                                                           | smoke              | `node -e "console.log(require('./package.json').engines.node)"` is `>=22.16.0`; `cat .nvmrc` is `24`; `nvm exec 20 npm ci --dry-run` fails with EBADENGINE                | n/a                                  |
| FOUND-04 | Node 22.16.0 floor works                                                                                                 | integration        | `docker build --build-arg NODE_VERSION=22.16.0 .` then fetch routes                                                                                                       | n/a                                  |
| FOUND-03 | Decisions recorded                                                                                                       | manual             | grep PROJECT.md for each of the 11 rows in "Spike Findings" (media, passkeys/recovery, Node 24, API names, no-extras, tags, stats, version, JS baseline, advisories gate) | n/a                                  |
| FOUND-03 | Two passkeys and recovery reproduced on the branch                                                                       | integration/manual | Re-run the CDP recipe (or user-verified manual enrollment) against `astro preview` with `EMDASH_SITE_URL=http://localhost:<port>`, then the recovery SQL drill            | Wave 0 (recipe script, scratch only) |

### Sampling Rate

- **Per task commit:** build + inventory compare (about 30 s).
- **Per wave merge:** add `astro check` and the Docker build/run/fetch block (about 3 min first time, cached after).
- **Phase gate:** all rows above green, PROJECT.md decisions present, `git status` shows no stray `data/` or `.emdash/migrations.json`, before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `scripts/script-inventory.mjs` with modes `capture`, `compare` and `fetch` (and a `normalize` function). Not present in the repo.
- [ ] Baseline directory `~/portfolio-baseline/<date>/` (does not exist yet; verified `ls` error).
- [ ] `.npmrc`, `.nvmrc`, `Dockerfile`, `.dockerignore`, `src/live.config.ts` (new files).
- [ ] No framework install needed; do not add a test runner for this phase.

## Security Domain

`security_enforcement` is not set to false in config (no config file), so this section applies.

### Applicable ASVS Categories

| ASVS Category           | Applies         | Standard Control                                                                                                                                                                    |
| ----------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication       | Yes             | EmDash passkeys (WebAuthn) via `@emdash-cms/auth`; never hand-roll; two passkeys; hostname-bound rpId from `EMDASH_SITE_URL`.                                                       |
| V3 Session Management   | Yes             | Astro filesystem session store on Node; make dir writable by non-root; consider placing on the volume.                                                                              |
| V4 Access Control       | Yes             | First-admin claim gate is "no users exist"; roles (Admin 50). Complete setup immediately; scope agent tokens in Phase 4.                                                            |
| V5 Input Validation     | Yes (admin API) | EmDash zod validation (verified: invalid repeater variant rejected with 400).                                                                                                       |
| V6 Cryptography         | Yes             | No custom crypto. `EMDASH_ENCRYPTION_KEY` only if plugin secrets are used (none planned).                                                                                           |
| V8 Data Protection      | Yes             | SQLite file and uploads on a volume, not in the image; secrets via host environment, never baked. `.env` already gitignored.                                                        |
| V12 Files and Resources | Yes             | Media served with `content-security-policy: sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'`; keep AVIF out of uploads while Astro 6 has the sharp advisory. |
| V14 Configuration       | Yes             | Dependency advisories (Pitfall 11); dev bypass inert in production build; run container as `node`, not root.                                                                        |

### Known Threat Patterns for Node + SQLite + EmDash

| Pattern                                                                              | STRIDE                   | Standard Mitigation                                                                                                                     |
| ------------------------------------------------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| First visitor claims admin on a fresh or recovered DB                                | Elevation of privilege   | Complete wizard immediately; close ingress during recovery; verify login page (not setup) after deploy (ADMIN-02).                      |
| Malformed `Host` header (`@astrojs/node` <=11.1.2)                                   | Denial of service        | Proxy rejects malformed hosts; leave `staticHeaders` off (default).                                                                     |
| Untrusted AVIF decoded by sharp/libheif                                              | Tampering / RCE          | Do not process untrusted AVIF; keep remote image hosts empty; plan the Astro 7 decision.                                                |
| Lost passkeys with no email recovery                                                 | Denial of service (self) | Two passkeys; tested SQL recovery; offline backups.                                                                                     |
| WAL file omitted from backup                                                         | Information loss         | `sqlite3 .backup` plus `PRAGMA integrity_check`.                                                                                        |
| Secrets baked into the image                                                         | Information disclosure   | `.dockerignore` excludes `.env*`; pass secrets at runtime; image holds no DB.                                                           |
| Deprecated auth dependencies (`@oslojs/*`, `arctic`)                                 | Supply chain             | Pin via lockfile; track upstream EmDash releases; review in Phase 5.                                                                    |
| Public pages lacking security headers (static handler sends only Cache-Control/ETag) | Various                  | Phase 5: add headers at Traefik or Cloudflare; not a Phase 1 change (headers are outside the HTML baseline). [VERIFIED: curl -i on `/`] |

## Sources

### Primary (HIGH confidence)

- Scratch spike on this machine, 2026-10-23 (copy of the repo at HEAD 67e43a3 in the session scratchpad; the real repo was not modified): builds, preview and container runs, passkey and recovery drills, media upload, inventory and parity diffs, `npm audit`, API import checks.
- npm registry via `npm view` (emdash, `@astrojs/node`, `@astrojs/react`, astro) for versions, peers, engines, dist-tags, postinstall.
- Installed package source: `node_modules/emdash` (`src/ui.ts`, `dist/index.d.mts`/`config-*.d.mts`, `dist/astro/index.mjs`, `dist/astro/middleware/setup.mjs`, `dist/astro/routes/api/setup/*.mjs`), `@astrojs/node/dist/index.js`.
- Repo files read this session: `package.json`, `astro.config.mjs`, `src/layouts/Layout.astro`, `src/pages/404.astro`, `.gitignore`, `.planning/*` and `01-CONTEXT.md`.

### Secondary (MEDIUM confidence)

- docs.emdashcms.com: deployment/nodejs, deployment/storage, deployment/database, deployment/core-migrations, deployment/secrets, guides/authentication, guides/backups, guides/site-settings, reference/configuration, reference/api, reference/cli, reference/field-types, reference/rest-api, existing-project.
- docs.astro.build: guides/cms/emdash, recipes/docker, guides/integrations-guide/node.
- GitHub: emdash-cms/emdash `packages/core/CHANGELOG.md` (1.3.1 to 1.2.0 read; 1.0 to 1.1 not read), advisories GHSA-26w7-cxv4-gfx2 and GHSA-qh8j-hqjv-7m4x.

### Tertiary (LOW confidence)

- None used for decisions. Earlier `.planning/research/*.md` claims were re-checked where they affect this phase; Cloudflare-specific parts are superseded by D-01.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH, resolved, built and run; peer ranges read from the registry.
- Architecture (build/run model, baked config, static output): HIGH, observed in the built bundle.
- Pitfalls: HIGH for items reproduced (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13); MEDIUM for 12, 14, 15 (partly assumed).
- Dokploy-specific behavior: MEDIUM-LOW, not exercised (Phase 5).

**Research date:** 2026-10-23
**Valid until:** 2026-10-30 (EmDash shipped 1.0.1 to 1.3.1 in three weeks and Astro/adapter advisories are moving; re-run `npm view emdash version` and `npm audit` before executing)
