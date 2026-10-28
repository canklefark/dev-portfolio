# Phase 5: Dokploy Deploy and Cutover - Research

**Researched:** 2026-10-26 (update 2026-10-27: the user dropped Cloudflare Pages, so the Pages branch control, the Pages custom domain steps in Pattern 5, the rollback runbook, Pitfalls 2, 3 and 7 and the preview app in Patterns 1 and 4 are superseded by CONTEXT D-05 to D-07 as amended; everything about EmDash, Dokploy volumes, backups, recovery and the guards still applies; second update 2026-10-27: Pattern 8 and the A1 and A2 deploy trigger are superseded by the tag trigger and CI gate of CONTEXT D-15, Open Question 5 is decided by D-16 (proxy on after the certificate, SSL Full strict, HTTP-01 kept), the S3 destination is Cloudflare R2 per D-17, and where text says migrations run on boot read the first request after a start)
**Domain:** Self-hosted Node container (Dokploy, Traefik, SQLite volume), EmDash 1.3.1 first-run and admin claim, CI guards, DNS cutover from Cloudflare Pages
**Confidence:** MEDIUM (EmDash behavior is HIGH, read from installed source this session; Dokploy UI and API details are MEDIUM or LOW because the Dokploy host cannot be probed from here and several docs pages are thin)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Build and deploy**

- **D-01:** Dokploy builds from git using the repo Dockerfile on the host. No GitHub Actions image build, no registry. Build arch is the Dokploy host's, so the planner confirms the host arch and that the Dockerfile builds there (the Phase 1 spike image was arm64). Reversibility: reversible, switching to a registry flow later is a config change.
- **D-02 (amended 2026-10-26, user wants it simple):** No separate pre-deploy migration step. EmDash creates the SQLite file and runs its migrations itself on boot (Phase 1 spike), so a plain container deploy is enough. First-time setup is: start the container, choose Import in the setup wizard using the committed `.emdash/seed.json` (Phase 2 D-13), then enroll passkeys. The seed is for first setup only; after go-live content lives in the production database and the seed is never re-applied. Researcher confirms the wizard Import path loads schema, content, nav and settings from the seed, and reports anything it leaves out. Accepted tradeoff: a future EmDash upgrade with a schema change migrates on boot, so take a backup before upgrading.
- **D-03:** CI keeps this cheap check: `emdash migrate --check` (GUARD-02), appended to the existing job in `.github/workflows/ci.yml`.
- **D-04:** The post-deploy smoke test (GUARD-03) runs in GitHub Actions after deploy, checks `/` and one project page return 200, and alerts only (goes red). No auto-rollback and no Dokploy healthcheck requirement. Researcher decides how the workflow knows the deploy finished (webhook trigger or poll loop).

**Branches and cutover**

- **D-05:** A Dokploy preview app deploys from `emdash-migration`. `main` stays on Cloudflare Pages until cutover. At cutover, merge `emdash-migration` into `main`, point the production Dokploy app at `main`, and disable the Pages build so Pages never builds the EmDash code. The Pages project stays in place, unbuilt, for a DNS rollback with no fixed retirement window. Merging and pushing still need the user's explicit go-ahead.
- **D-06:** Preview is minimal: one preview app with its own volume and fresh seed import from the repo, on any hostname that is easy to set up. Run the existing Phase 1/3 parity compare against `~/portfolio-baseline/current` pointed at the preview URL, plus `check:public-js`. Record the result in a phase evidence file. No screenshots and no separate polished preview domain.
- **D-07:** Cutover order is simple: downtime is fine. Point `dev.zeikcookson.com` at Dokploy, and as soon as it serves, complete the setup wizard and enroll two passkeys on that hostname in the same sitting (rpId follows `EMDASH_SITE_URL`, so the real hostname is required). No hosts-file override, no DNS-01 pre-claim, no IP allowlist. Rollback is pointing DNS back at Pages. Reversibility: reversible, DNS flip back; but passkeys enrolled on the hostname stay bound to it.
- **D-08:** `EMDASH_SITE_URL=https://dev.zeikcookson.com` is set at build and run time (Phase 1 gate h).

**Admin, recovery and exposure**

- **D-09:** Admin gate is EmDash passkeys only (Phase 1 D-08). Two passkeys on real devices, with the SQLite recovery procedure from `PROJECT.md` Spike Findings rehearsed once. The GitHub-login alternative (gate b) is not adopted.
- **D-10:** Astro 6 residual advisories (gate a): stay on Astro 6 and accept the risk, no Astro 7 migration in this phase. Phase 5 only verifies the proxy rejects a malformed Host header (curl check, recorded). Record the acceptance in `PROJECT.md`.
- **D-11:** Security headers (gate g) and the session store location (gate f): Claude's discretion, kept minimal. Add basic headers at Traefik or Cloudflare only if cheap; do not move the session store unless a redeploy logging the user out proves annoying.
- **D-12:** The agent token (Phase 4 D-08) is recreated after the production database exists, and `EMDASH_MCP_URL` is pointed at the production endpoint. One live content-list call proves it.

**Backup and restore**

- **D-13:** Use Dokploy's built-in scheduled volume or file backup for the whole `/app/data` volume (SQLite plus uploads are one backup unit). Destination and cadence: Claude's discretion, simplest Dokploy supports (S3-compatible target if available). No custom retention design.
- **D-14:** DEPLOY-05 rehearsal: restore one backup into a scratch container, confirm it boots and its project and About content matches production, then discard it.

### Claude's Discretion

- Exact hostname for the preview app.
- Backup destination, schedule and retention.
- Security headers and session store handling (D-11).
- Webhook versus poll for triggering the post-deploy smoke test.

Pending items not discussed (left to research and planning): image architecture (gate d), `.emdash/migrations.json` commit versus build-in-CI (gate e) and `emdash doctor --database` flag (gate i).

### Deferred Ideas (OUT OF SCOPE)

- Offsite backup design, retention policy and monitoring beyond Dokploy defaults.
- Zero-downtime cutover, staged admin claim, visual screenshot parity.
- Astro 7 migration.
- Retiring the Pages project (do it whenever the user is comfortable).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID                    | Description                                                                               | Research Support                                                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DEPLOY-01             | Dokploy Node standalone container, SQLite on persistent volume, separate preview database | Two Dokploy Applications (preview, production), each with its own named Volume Mount at `/app/data`; Dockerfile already declares the path. See Architecture Patterns 1 and 2. |
| DEPLOY-02             | Migrations run as an explicit step before deploy, never implicitly on a live container    | **Conflicts with amended D-02.** EmDash migrates on boot by default (`auto`); `EMDASH_MIGRATIONS_MODE=check` exists as an opt-in. See Open Question 2 and Pattern 3.          |
| DEPLOY-03             | Preview deployment compared against baseline before domain moves                          | `script-inventory.mjs fetch` then `parity` against the preview URL, plus `check` with the allowlist on the fetched HTML. See Pattern 4.                                       |
| DEPLOY-04             | `dev.zeikcookson.com` serves the Dokploy app, Pages kept for rollback                     | Cutover runbook (Pattern 5). Rollback is not a pure DNS flip (Pitfall 3).                                                                                                     |
| DEPLOY-05             | SQLite backup and restore rehearsed once                                                  | Dokploy Volume Backups to an S3-compatible destination (R2), restore into a new named volume, scratch app, compare. See Pattern 6.                                            |
| ADMIN-02              | Setup wizard completed at first deploy, login page afterward                              | Wizard option is "Sample content", not "Import" (Pitfall 1). Setup gate is admin-route only.                                                                                  |
| ADMIN-03              | Two passkeys on `dev.zeikcookson.com`, recovery tested                                    | Enrollment on the real HTTPS hostname; recovery runbook adapted to the container (no `sqlite3` binary in the image; Pattern 7).                                               |
| GUARD-02              | CI fails on pending migrations (`emdash migrate --check`)                                 | Needs a database to check against; recipe plus an honest note on what it proves, and an optional manifest-drift gate. See Pattern 3.                                          |
| GUARD-03              | Post-deploy smoke test, `/` and one project page return 200                               | CI-gated deploy trigger plus poll, then `scripts/smoke-test.mjs`. See Pattern 8.                                                                                              |
| </phase_requirements> |

## Project Constraints (from CLAUDE.md)

- TypeScript strict, no `any`. New `.mjs` scripts in this repo use `// @ts-check` plus JSDoc types (see `scripts/check-public-js.mjs`).
- No client-side JS unless there is no server-side alternative. Nothing in this phase adds client JS. `npm run check:public-js` must stay green.
- No inline styles. Not applicable here.
- All SQL parameterized. The recovery snippet below uses fixed statements and a bound parameter for the backup path.
- Never push, and never run `npm run dev` or `astro dev`, without explicit user approval (global memory). Every push in this phase (branch push for the preview, merge to `main`) is a `checkpoint:human-action`.
- No em dashes in docs or copy. The seed's `seo.titleSeparator` value is a data value and is not touched.
- CLAUDE.md "Deployment" section (Cloudflare Pages, Node 22) is stale; DOCS-01 in Phase 6 updates it. Do not edit it in Phase 5.
- The committed Claude Code guard denies `Bash(curl *_emdash*)` ([VERIFIED: `.claude/settings.json`, `"Bash(curl *_emdash*)"`]). Checks against `/_emdash/...` URLs (admin login page, unauthenticated MCP 401) must run in CI through a script, or be human-verify steps. Do not route around the deny rule from an agent session.

## Summary

The repo is ready for a plain container deploy: the Dockerfile builds on Node 24 alpine, creates and chowns `/app/data`, and serves with `node ./dist/server/entry.mjs`; EmDash creates its SQLite file and applies its 90 migrations on first request ([VERIFIED: `emdash migrate --check` against a seeded scratch DB reported 90 known applied, none pending]). Three findings change the plan. First, D-02 says to choose "Import" in the setup wizard, but in EmDash 1.3.1 "Import" means "upload a .emdash package exported from another EmDash site"; the committed seed is applied by the **"Sample content"** option (Pitfall 1). Second, `emdash migrate --check` fails on a CI runner with no database (exit 1 with no `data/` directory, exit 2 on an empty database), so GUARD-02 needs a throwaway database, and run that way it can only prove the manifest and migration set agree; an optional committed-manifest drift gate gives it real teeth (Pattern 3). Third, the Cloudflare Pages custom domain is not a plain DNS record, so "rollback is pointing DNS back" needs a re-association step and a short error window (Pitfall 3).

Dokploy specifics: Dockerfile build from a Git provider, Environment tab with separate "Build Time Arguments", Volume Mount for persistence, S3-destination Volume Backups (named volumes only; container-off mode recommended for SQLite), and Traefik per-domain config with Let's Encrypt. The Dokploy "preview deployments" feature is pull-request driven and is not what D-05 and D-06 need; the "preview app" is simply a second ordinary Application tracking `emdash-migration`. For D-04, the recommended mechanism is a GitHub Actions workflow that runs after CI succeeds, triggers the deploy through the documented `application.deploy` API call, polls for completion, then runs a small Node smoke script. That also makes the CI guards a real gate in front of every deploy.

The only package-level work is none: this phase installs no new npm packages. Everything else is Dokploy and Cloudflare configuration, two small workflow and script additions, and one Dockerfile `ARG`.

**Primary recommendation:** Add a CI-gated `deploy.yml` (trigger via Dokploy API, poll, smoke) and the `migrate --check` step; create two Dokploy Applications (preview and production) from the existing Dockerfile with named volumes at `/app/data`; run the wizard with **Sample content**; use one scratch app for both the restore rehearsal and the recovery drill.

## Architectural Responsibility Map

| Capability                        | Primary Tier                                 | Secondary Tier                     | Rationale                                                                                           |
| --------------------------------- | -------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| TLS termination, Host routing     | Traefik (Dokploy ingress)                    | Cloudflare edge if proxied         | Dokploy writes a Traefik file config per domain; Let's Encrypt via the domain's Certificate setting |
| Public page rendering             | Node container (Astro SSR)                   | -                                  | Unchanged since Phase 3                                                                             |
| Migrations and first-run seed     | Node container, on boot and via setup wizard | CI (`migrate --check`)             | D-02 amended: EmDash migrates itself                                                                |
| Admin auth (passkeys)             | Node container (EmDash)                      | -                                  | rpId follows `EMDASH_SITE_URL`                                                                      |
| Persistence (SQLite plus uploads) | Docker named volume on the Dokploy host      | S3-compatible bucket (backup copy) | One volume, one backup unit                                                                         |
| Backup scheduling                 | Dokploy Volume Backups                       | -                                  | D-13                                                                                                |
| Deploy trigger and smoke test     | GitHub Actions                               | Dokploy API                        | D-04; CI gates the deploy                                                                           |
| DNS and (optional) edge headers   | Cloudflare                                   | -                                  | Pages custom domain must be detached before the A record can point at Dokploy                       |

## Standard Stack

### Core

| Component                                                       | Version                                                                   | Purpose                             | Why Standard                                                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Existing `Dockerfile` (node:24-alpine, multi-stage)             | n/a                                                                       | Image built by Dokploy on the host  | Already proven 17/17 identical in Phase 1; no change except an optional `ARG`                                 |
| emdash (CLI and runtime)                                        | 1.3.1 [VERIFIED: `node_modules/emdash/package.json` `"version": "1.3.1"`] | `migrate --check`, `seed`, `doctor` | Already installed; no new packages                                                                            |
| @astrojs/node                                                   | 10.1.4 standalone [VERIFIED: `node_modules/@astrojs/node/package.json`]   | Server entry                        | `staticHeaders` defaults to false in this version, which limits the Host-header advisory to a 500 (Pitfall 8) |
| Dokploy Application (Dockerfile build type, Git provider)       | host-installed, version not probed                                        | Build and run                       | D-01                                                                                                          |
| Dokploy Volume Mount + Volume Backups                           | host-installed                                                            | Persistence and backup              | D-13                                                                                                          |
| GitHub Actions (`actions/checkout@v7`, `actions/setup-node@v7`) | as already pinned in `ci.yml`                                             | CI, deploy trigger, smoke           | Existing                                                                                                      |
| Node built-in `fetch` and `node:test`                           | Node 24                                                                   | Smoke script and its test           | Matches `scripts/*.mjs` and `npm test` pattern                                                                |

### Supporting

| Component                                    | Purpose                                                | When to Use                                                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare R2 (S3-compatible)                | Backup destination                                     | Recommended, since DNS is already on Cloudflare; any S3-compatible target works. Dokploy has a documented R2 page [CITED: docs.dokploy.com/docs/core/cloudflare-r2] |
| Cloudflare Transform Rule (response headers) | Restore `x-content-type-options` and `referrer-policy` | Only if the hostname stays proxied (Pitfall 6)                                                                                                                      |
| `emdash doctor --database ./data/emdash.db`  | Post-deploy health report inside the container         | Gate (i): the flag is required because the default is `./data.db`                                                                                                   |

### Alternatives Considered

| Instead of                                      | Could Use                                                | Tradeoff                                                                                                                                     |
| ----------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| API-triggered deploy from Actions (recommended) | Dokploy GitHub auto deploy plus a wait-and-retry smoke   | No secrets and no reachable panel needed, but deploy is not gated by CI and the smoke can pass against the old container                     |
| Dokploy PR "Preview Deployments"                | Second ordinary Application on branch `emdash-migration` | PR previews are PR-driven, wildcard-domain oriented and the docs say nothing about volumes; a second Application is simpler and matches D-06 |
| Dokploy `@dokploy/cli`                          | plain `curl` against the API                             | The CLI is an extra install; curl matches the documented `x-api-key` call                                                                    |

**Installation:** none. This phase adds no npm packages.

**Version verification:** `npm ls emdash @astrojs/node astro` shows what is installed; no package is added or upgraded in this phase.

## Package Legitimacy Audit

No external packages are installed or upgraded in this phase, so the audit is empty.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
| ------- | -------- | --- | --------- | ----------- | ------- | ----------- |
| (none)  | -        | -   | -         | -           | -       | -           |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 git push main (user approves)
        |
        v
 GitHub Actions: ci.yml (verify job)
   npm ci -> npm test -> check:public-js -> migrate --check (temp DB) [-> manifest drift]
        | success (workflow_run)
        v
 GitHub Actions: deploy.yml
   POST {DOKPLOY_URL}/api/application.deploy  (x-api-key)
   poll deployment.all?applicationId=...  until done | error
   node scripts/smoke-test.mjs https://dev.zeikcookson.com   --> red on failure (alert only)
        |
        v
 Dokploy host:  git clone -> docker build (Dockerfile, build arg EMDASH_SITE_URL)
        -> Swarm service (1 replica) --Traefik (Host rule, Let's Encrypt)--> :4321
        |
        v
 Container (user node):  node ./dist/server/entry.mjs
   first request: create /app/data/emdash.db, run 90 migrations, auto-seed schema
   /app/data  <-- named volume "portfolio-data"  --> Dokploy Volume Backup (nightly, container off) --> R2 bucket

 Visitor --> Cloudflare (DNS, optional proxy) --> Traefik --> container
 Admin first claim: https://dev.zeikcookson.com/_emdash/admin/setup
   Site step: title and tagline prefilled from seed; choose "Sample content" -> seed with content applied
   Admin step: email + name; Passkey step: first passkey. Then enroll second passkey in admin.
```

### Recommended Project Structure (additions only)

```
.github/workflows/
├── ci.yml              # + migrate --check step, (+ optional docker build step)
└── deploy.yml          # new: workflow_run after ci, trigger, poll, smoke
scripts/
├── smoke-test.mjs      # new: GUARD-03, usable locally and in CI
└── smoke-test.test.mjs # new: node --test, picks up via existing "npm test" glob
.planning/phases/05-dokploy-deploy-and-cutover/
└── 05-EVIDENCE.md      # preview parity result, cutover log, restore and recovery evidence (D-06)
```

### Pattern 1: Two Dokploy Applications, one image recipe

**What:** `portfolio-preview` (branch `emdash-migration`, hostname of your choice, volume `portfolio-preview-data`) and `portfolio` (production, volume `portfolio-data`, domain attached only at cutover). Both use Build Type Dockerfile, Dockerfile Path `Dockerfile`, Docker Context Path `.`, empty Build Stage (the last stage, `runtime`), container port 4321.
**When to use:** DEPLOY-01, D-05, D-06.
**Details:**

- Environment tab, runtime: `EMDASH_SITE_URL` set to that app's own public origin. Preview uses the preview hostname, production uses `https://dev.zeikcookson.com`. Setup refuses to run without it: the setup route returns `SITE_URL_REQUIRED` ("Set siteUrl or EMDASH_SITE_URL before running production setup") [VERIFIED: `node_modules/emdash/src/astro/routes/api/setup/index.ts`, `"SITE_URL_REQUIRED"`].
- Environment tab, "Build Time Arguments": `EMDASH_SITE_URL=<same value>` to satisfy D-08. In 1.3.1 the build-time value only feeds Astro `image.remotePatterns`: "Astro bakes `remotePatterns` into the build output, so the env vars only take effect if they are set when `astro build` runs." [VERIFIED: `node_modules/emdash/src/astro/integration/index.ts`, lines 126-131]. The runtime value is the load-bearing one (passkey origin, CSRF); the runtime resolver reads `process.env` on purpose ([VERIFIED: `src/api/public-url.ts` comment "Container deployments set env vars at runtime, so we must read process.env"]). Do not put the production URL into the preview's build argument.
- The Dockerfile needs `ARG EMDASH_SITE_URL` and `ENV EMDASH_SITE_URL=$EMDASH_SITE_URL` in the `build` stage for the build argument to reach `astro build` (Code Examples). Dokploy documents "Build Time Arguments" as values "passed to the Dockerfile as build arguments (`ARG`)" [CITED: docs.dokploy.com/docs/core/applications/build-type].
- Volumes: Advanced > Volumes, type **Volume Mount** (a named Docker volume), mount path `/app/data`. Not a Bind mount: Volume Backups only support named volumes [CITED: docs.dokploy.com/docs/core/volume-backups], and a host-directory bind would be root-owned and break SQLite (Pitfall 4).
- Domains: add the domain after DNS points at the host, container port 4321, HTTPS on, certificate `letsencrypt` [CITED: docs.dokploy.com/docs/core/domains].
- Auto Deploy: **off** on production (the Actions workflow triggers it). Preview can stay manual.
- Replicas 1, update order `stop-first` (default is assumed, verify under Advanced > Cluster Settings). Do not copy the "start-first" rollback recipe from the Dokploy going-production page: two containers on one SQLite volume would both run migrations and writers (Pitfall 9).

### Pattern 2: First-run setup is the seed with content

**What:** On a fresh volume the first request creates `emdash.db`, applies migrations, and auto-seeds the schema without content. The wizard Site step then applies the baked `.emdash/seed.json` **with content** only when "Sample content" is selected.
**Evidence (this session):**

- `type StartWith = "sample" | "empty" | "import";` and `onNext({ title, tagline, includeContent: startWith === "sample" }, startWith);` [VERIFIED: `@emdash-cms/admin/dist/index.js.map`, sourcesContent[251] = `../src/components/SetupWizard.tsx`, lines 88 and 130].
- Radio labels: `label={t\`Sample content\`}`with description "Start with the template's example posts and pages. Recommended for new sites.";`label={t\`Import an existing EmDash site\`}`with description "Once setup is done, upload a .emdash package exported from another EmDash site." (same file, lines 164-180). "Sample content" is shown only when`hasContent`is true, which the status route sets from`!!(seed.content && Object.keys(seed.content).length > 0)`of the baked user seed [VERIFIED:`src/astro/routes/api/setup/status.ts`]. The seed has `content`for`about`, `home`, `projects`(13) and`projects_index`[VERIFIED: parsed`.emdash/seed.json`].
- Title and tagline are prefilled from the seed (`useState(seedInfo?.title ?? "")`), so the user can click through; the server then overwrites `seed.settings.title` and `tagline` with the form values [VERIFIED: setup route, `seed.settings = { ...seed.settings, title: body.title, tagline: body.tagline }`].
- What the seed applies: settings (title, tagline, `social`, `seo.titleSeparator`), 4 collections with 30 fields, taxonomy definitions plus 54 terms (9 categories, 45 tags), the `primary` menu with 3 items, 16 content entries, all `published` [VERIFIED: `emdash seed` run against a scratch DB printed "Settings: 4 applied, Collections: 4 created, Fields: 30 created, Taxonomies: 54 terms, Menus: 1 created, 3 items, Content: 16 created"]. Taxonomy terms, bylines and content apply only when `includeContent` is true (`apply.ts` lines 686, 759, 841).
- What it leaves out: users and passkeys (the wizard creates the first), API tokens, media library rows and uploaded files (the seed has no `$media` references), revision history beyond the initial publish, redirects, widgets, sections, comments, and bylines (the seed has none). Entry `publishedAt` is set to the seed time (`publishedAt: status === "published" ? new Date().toISOString() : null`, `apply.ts` line 1072); the public pages sort on the `date` field, so ordering is unaffected.
- Content seeding runs in budgeted chunks (500 queries per request) and the wizard keeps posting until `seedComplete`; this is normal, not an error [VERIFIED: setup route `SEED_BUDGET_PER_REQUEST`].
- Public pages are not gated on setup: the setup redirect applies only to `/_emdash/admin` routes [VERIFIED: `src/astro/middleware/setup.ts`, `isAdminRoute`]. So a preview can prove parity after the Site step without completing a passkey.

### Pattern 3: GUARD-02, `migrate --check` needs a database

**Measured behavior (this session, `npx emdash migrate --check`):**

- Database path whose directory does not exist: `unable to open database file`, exit 1.
- Empty database file: lists all 90 migrations as Pending, exit 2.
- Database created by `emdash seed` (which runs migrations): Pending none, exit 0, with or without `--from-config`.
- Exit codes are `success: 0, error: 1, pending: 2, unknownApplied: 3, confirmation: 4, interrupted: 130` [VERIFIED: `src/cli/commands/migrate.ts`, lines 35-41].

**Recipe (satisfies D-03 literally, runs on a clean runner):**

```yaml
# GUARD-02: apply migrations to a throwaway database, then require nothing pending or unknown
- run: |
    npx emdash seed .emdash/seed.json --database "$RUNNER_TEMP/migrate-check.db" --uploads-dir "$RUNNER_TEMP/uploads"
    npx emdash migrate --check --from-config --database "$RUNNER_TEMP/migrate-check.db"
```

`--from-config` builds the manifest from `astro.config.mjs`, so it does not depend on a prior build having written `.emdash/migrations.json`.

**Honest scope:** a freshly seeded database always has nothing pending, so this step proves the CLI, the manifest builder and the config agree, and fails on `unknownApplied` or a broken executor. It cannot detect "this deploy will migrate production". Because D-02 lets production migrate on boot, the useful signal is "the migration set changed". Recommended addition (gate e, planner decision): stop ignoring `.emdash/migrations.json`, commit it, and after the build step add `git diff --exit-code -- .emdash/migrations.json`. The manifest holds only `schemaVersion`, `emdashVersion`, the 90 migration names plus fingerprint, `i18n: null`, and `{ "type": "sqlite", "executorEntrypoint": "emdash/internal/db/sqlite-migrations", "executorConfig": { "url": "file:./data/emdash.db" } }` with no absolute paths or timestamps [VERIFIED: parsed `.emdash/migrations.json`]. An EmDash bump then fails CI until the manifest is recommitted, which is the moment to take the pre-upgrade backup. Tradeoff: any EmDash patch bump changes `emdashVersion` and trips it; that is intended friction. Needs a one-line `.gitignore` edit.

**Runtime alternative (not recommended, mentioned for DEPLOY-02):** `EMDASH_MIGRATIONS_MODE` accepts `auto`, `check`, `manual` and is read from `process.env` at runtime [VERIFIED: `src/database/migrations/policy.ts` line 11 `export type RuntimeMigrationMode = "auto" | "check" | "manual";`, and `src/astro/middleware.ts` `process.env.EMDASH_MIGRATIONS_MODE`]. `check` makes a pending migration return 503 "Database migrations are required. Apply the deployment migration manifest and retry." instead of migrating, and a fresh empty volume would then 503 until migrated by hand. That is the explicit-step model DEPLOY-02 describes and the user chose not to build (D-02).

### Pattern 4: Preview parity (DEPLOY-03)

1. User approves pushing `emdash-migration` (local is ahead of `origin/emdash-migration` by 41 commits; Dokploy builds from the remote). Pushing also triggers Cloudflare Pages preview builds if "preview branches" are enabled; set Pages preview builds to **None** first (Pitfall 2).
2. Deploy `portfolio-preview`. Open `https://<preview-host>/_emdash/admin/setup`, accept prefilled title and tagline, choose **Sample content**, continue past the Site step. The passkey step is optional for parity; do not leave the unclaimed preview wizard exposed (anyone can claim it), so either finish it on the preview hostname with a passkey or stop the app after the compare.
3. From the repo root, using the existing tooling [VERIFIED: `scripts/script-inventory.mjs` usage lines, `fetch BASE_URL BASELINE_DIST_DIR OUT_DIR` and `parity BASELINE_DIST_DIR CANDIDATE_DIR`, `check ALLOWLIST_JSON DIST_DIR`]:

```bash
node scripts/script-inventory.mjs fetch https://<preview-host> ~/portfolio-baseline/current/dist /tmp/preview-pages
node scripts/script-inventory.mjs parity ~/portfolio-baseline/current/dist /tmp/preview-pages   # expect "parity: 17/17 identical"
node scripts/script-inventory.mjs check scripts/script-allowlist.json /tmp/preview-pages        # public-JS allowlist against the live preview
```

`fetch` ends with its own strict `compare`, which can report DIFF for the canonicalized differences; the verdict is `parity`, as in Phase 3 ([VERIFIED: 03-VERIFICATION.md row 1, "parity: 17/17 identical"]). `npm run check:public-js` builds and serves its own local server and takes no URL, so "check:public-js pointed at the preview" is the `check` command above on the fetched HTML. Use the scratch directory in the session scratchpad rather than `/tmp` when run by an agent. 4. Record both outputs in `05-EVIDENCE.md`.

### Pattern 5: Cutover runbook (DEPLOY-04, ADMIN-02, ADMIN-03)

Preconditions (all before touching DNS): CI green on `emdash-migration`; production app `portfolio` created and its Environment, build argument and `portfolio-data` volume set; Pages **Automatic production branch deployments off** and preview builds **None** (Cloudflare: Settings > Builds & deployments > Configure Production deployments, uncheck "Enable automatic production branch deployments", then save [CITED: developers.cloudflare.com/pages/configuration/branch-build-controls/]); user go-ahead for merge and push.

1. Merge `emdash-migration` into `main` (a fast-forward: `main` has no commits beyond the merge base `f4e5470` [VERIFIED: `git log emdash-migration..main` printed nothing]) and push (user go-ahead). Pages does not build.
2. Point the production Dokploy app at branch `main`; deploy. The container is up with no domain and no public route.
3. DNS: in Workers & Pages > project > Custom domains, **Remove domain**, and delete the Pages CNAME for `dev` in DNS [CITED: developers.cloudflare.com/pages/configuration/custom-domains/]. Create an A record `dev` to the Dokploy host IP.
4. Add the domain in Dokploy (host `dev.zeikcookson.com`, port 4321, HTTPS, letsencrypt) **after** DNS points at the host so the ACME challenge can succeed on the first attempt (Pitfall 5). Expect a short period of certificate errors; downtime is accepted (D-07).
5. Immediately open `https://dev.zeikcookson.com/_emdash/admin/setup`: title and tagline prefilled, **Sample content**, email and name, passkey 1 on a real device. Sign in. Enroll passkey 2 on a second device or authenticator in the admin. Sign out, then sign in with each passkey separately (ADMIN-03). A visit to the admin now shows the login page, not setup (ADMIN-02): confirm `needsSetup` is false at `/_emdash/api/setup/status` (CI script or human step; Constraint above).
6. Run the Pattern 8 smoke script manually once, then recreate the agent token in the production admin (README "Create the agent token", 90-day expiry), export `EMDASH_MCP_URL=https://dev.zeikcookson.com/_emdash/api/mcp` and `EMDASH_URL=https://dev.zeikcookson.com`, and make one `content_list` call (D-12, closes Phase 4 W7).
7. Record the Host-header check (Pitfall 8) and add the Dokploy backup schedule (Pattern 6).

**Rollback runbook:** delete the A record, then Workers & Pages > Custom domains > **Add a custom domain** for `dev.zeikcookson.com` so Pages re-associates and recreates the record, and re-enable the Pages production deployment setting if a fresh build is wanted. The Pages `*.pages.dev` URL keeps serving the last static build in the meantime. Re-adding only the CNAME without re-associating the domain gives a 522 [CITED: developers.cloudflare.com/pages/configuration/custom-domains/]. Passkeys enrolled on the Dokploy instance stay bound to the hostname and to that database. An EmDash code rollback after a boot-time migration is unsafe; restore the volume backup instead.

### Pattern 6: Backup and restore (D-13, D-14, DEPLOY-05)

- Destination: Cloudflare R2 bucket plus an Object Read and Write API token; Dokploy fields are Access Key Id, Secret Access Key, Region, Endpoint, Bucket, with a connection test [CITED: docs.dokploy.com/docs/core/cloudflare-r2]. The doc's example region is `WNAM`/`ENAM`; if the test fails, try `auto` (R2's own convention) [ASSUMED].
- Schedule: Volume Backups on the `portfolio-data` volume, cron `0 3 * * *`, **Turn off Container = on** (stop, back up, restart). Dokploy warns a live copy of an active SQLite database risks inconsistency [CITED: docs.dokploy.com/docs/core/volume-backups]. The DB is about 2 MB here, so the stop window is seconds. Retention is not documented for volume backups; accept the default (about 2 MB a day) and note it in the evidence file; no retention design (deferred).
- Restore rehearsal: Volume Backups > Restore Volume, pick the destination and backup, enter a **new** volume name such as `portfolio-restore-test`; the target volume must not exist and any container using it must be stopped [CITED: same page]. Reuse the preview app as the scratch instance: stop it, point its Volume Mount at `portfolio-restore-test`, keep its own `EMDASH_SITE_URL`, deploy. It boots to the login page (the restored passkeys are bound to `dev.zeikcookson.com` and cannot sign in on another host, which is expected).
- Compare production against the scratch instance with the existing tooling, no new code:

```bash
node scripts/script-inventory.mjs fetch https://dev.zeikcookson.com   ~/portfolio-baseline/current/dist <OUT_PROD>
node scripts/script-inventory.mjs fetch https://<scratch-host>        ~/portfolio-baseline/current/dist <OUT_SCRATCH>
node scripts/script-inventory.mjs compare <OUT_PROD> <OUT_SCRATCH>    # expect 17/17 identical
```

(each `fetch` also prints a compare against the original baseline; if content has been edited since go-live, those lines may DIFF and are not the verdict). Add a row-count check of `ec_projects` and the About entry if desired.

- Discard: stop and delete the scratch volume afterwards.

### Pattern 7: Recovery drill adapted to the container (ADMIN-03)

The PROJECT.md procedure uses the `sqlite3` CLI and "stop the server". The runtime image is `node:24-alpine` with no `sqlite3` binary, and a stopped Dokploy app has no container to exec into. Use a one-off helper container on the Dokploy host with the same Node image and Node's built-in `node:sqlite`, running as the same uid so file ownership is preserved (Pitfall 10). Rehearse it on the scratch instance from Pattern 6 (not on production): stop the app, run the helper, start the app, complete the wizard on the scratch hostname, enroll a passkey, sign in. The snippet below was run locally against a scratch copy of the dev database and produced `integrity ok`, `foreign_keys 1`, and users 1 to 0 with 13 projects intact [VERIFIED: local run this session].

```bash
# on the Dokploy host, app stopped, ingress closed
docker run --rm --user 1000:1000 -v portfolio-restore-test:/data node:24-alpine node -e '
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("/data/emdash.db");
const n = (t) => db.prepare(`SELECT count(*) c FROM ${t}`).get().c;
console.log("before", { users: n("users"), credentials: n("credentials") });
db.prepare("VACUUM INTO ?").run("/data/pre-recovery.db");
console.log("integrity", new DatabaseSync("/data/pre-recovery.db").prepare("PRAGMA integrity_check").get());
db.exec("DELETE FROM users");
db.prepare("DELETE FROM options WHERE name IN (?, ?)").run("emdash:setup_complete", "emdash:setup_state");
console.log("after", { users: n("users"), credentials: n("credentials") });
'
```

Notes: uid 1000 is `node` in the official image [ASSUMED, standard for node images]. The local test interpolated the backup path; the version above binds it (`VACUUM INTO ?`) and the `options` names, in line with the project SQL rule; re-test the bound `VACUUM INTO ?` form once during the rehearsal (the local run used string interpolation for that single statement). Tokens cascade away with the users, so recreate the agent token afterwards.

### Pattern 8: Deploy trigger, wait, smoke (D-04, GUARD-03)

**Recommendation:** CI-gated deploy from Actions, not Dokploy auto deploy.

- `deploy.yml` triggers on `workflow_run` of `ci` (completed, branch `main`, conclusion success), so the migration check, tests and `check:public-js` gate every deploy. Concurrency group `deploy`, `cancel-in-progress: false`.
- Trigger: `POST $DOKPLOY_URL/api/application.deploy` with headers `accept: application/json`, `x-api-key: $DOKPLOY_API_KEY`, `Content-Type: application/json`, body `{"applicationId": "$DOKPLOY_APP_ID"}` [CITED: docs.dokploy.com/docs/core/applications/going-production and /auto-deploy].
- Wait: poll `GET $DOKPLOY_URL/api/deployment.all?applicationId=...` and read the newest item's `status` (`running`/`queued` keep waiting, `done` passes, `error`/`cancelled` fails), every 10 s for up to 10 min. The endpoint and status values are taken from the user's own `keller-tools` deploy-app skill, not from Dokploy docs, so they are [ASSUMED]; Wave 0 verifies them in the instance's Swagger UI (`<host>:3000/swagger`, administrators only [CITED: docs.dokploy.com/docs/api]). Record the newest deployment id before triggering so the loop waits for a newer one.
- Smoke: `node scripts/smoke-test.mjs https://dev.zeikcookson.com` with 10 attempts and a 15 s delay (container cold start, certificate). Failure goes red; no rollback (D-04).
- Secrets: `DOKPLOY_URL`, `DOKPLOY_API_KEY`, `DOKPLOY_APP_ID` as repository secrets. The repo is `canklefark/dev-portfolio` and `gh` is logged in as `cankledankle` [VERIFIED: `git remote -v`, `gh auth status`], so set them in the GitHub UI as the repo owner or confirm `gh` has admin on the repo.
- If the Dokploy panel is not reachable from GitHub runners (for example Tailscale-only), fall back to Dokploy auto deploy plus a `smoke-test.mjs` retry loop with a generous initial wait. State the weakness: it can pass against the old container. Cloudflare bot detection can 403 API calls to a proxied panel [CITED: marketplace action README via search result, benbristow/dokploy-deploy-action].
- The smoke script picks the project page from the live `/projects/` HTML instead of hardcoding `catalog-cms`, because content is now edited in the admin and a hardcoded slug can disappear. The link pattern is the one the guard already uses: `/href="\/projects\/([a-z0-9-]+)\/?"/g` [VERIFIED: `scripts/check-public-js.mjs`].

### Anti-Patterns to Avoid

- **Choosing "Import" in the wizard** and expecting the seed: it opens the site-transfer upload flow and applies no content.
- **Bind-mounting a host directory** at `/app/data`: root-owned, SQLite error 14, and not backed up by Volume Backups.
- **start-first updates or more than one replica** on the SQLite volume.
- **Adding the Dokploy domain before DNS points at the host**: Let's Encrypt validation fails and retries back off.
- **Leaving `main` connected to Pages auto-build when pushing the EmDash code**: Pages would try to build server output.
- **Using the committed seed after go-live**: it would conflict with production content; it is first-setup only (D-02).

## Don't Hand-Roll

| Problem                        | Don't Build                                        | Use Instead                                                             | Why                                             |
| ------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| Nightly backup of the volume   | cron plus `sqlite3 .backup` plus aws-cli container | Dokploy Volume Backups to R2, container-off mode                        | D-13; consistent copy by stopping the container |
| Restore and content comparison | custom diff tool                                   | Dokploy Restore Volume, then `script-inventory.mjs fetch` and `compare` | Tooling exists and was used for Phase 3 parity  |
| Certificate and HTTP routing   | own nginx or caddy                                 | Dokploy domain with Traefik and `letsencrypt`                           | Per-domain Traefik file config, hot reload      |
| Migration status               | parsing SQLite `migrations` tables                 | `emdash migrate --check` or `--status --json`                           | Stable exit codes and JSON report               |
| Admin recovery                 | a custom admin-reset endpoint                      | The tested delete-users-and-two-options procedure                       | Documented, rehearsed, schema and media survive |
| Wizard seed loading            | importing content with a script after setup        | Wizard "Sample content"                                                 | Uses the baked seed through the supported path  |

**Key insight:** every moving part here already exists in Dokploy, EmDash or the repo's `scripts/`; the phase is configuration, two small files, and rehearsals recorded as evidence.

## Runtime State Inventory

This is a hosting migration (Pages static to Dokploy Node), so the five categories are answered explicitly.

| Category                               | Items Found                                                                                                                                                                                                                                                                                                                                                                     | Action Required                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Stored data                            | Production database does not exist yet; it is created on the Dokploy volume at first boot and populated by the wizard seed. Local `data/emdash.db` is a dev database and is never shipped (`.dockerignore` lists `data`).                                                                                                                                                       | None to migrate; verify nothing in the image carries a database                                                                   |
| Live service config                    | Cloudflare Pages project (custom domain `dev.zeikcookson.com`, automatic production and preview builds, possibly Pages branch previews for `emdash-migration`); Cloudflare DNS record for `dev`; Dokploy apps, domains, backup destination, API key, GitHub Actions secrets                                                                                                     | Disable Pages builds before pushing `main`; detach custom domain, create A record; create Dokploy objects; add three repo secrets |
| OS-registered state                    | None in this repo. The Dokploy host runs Docker Swarm and Traefik (managed by Dokploy).                                                                                                                                                                                                                                                                                         | None                                                                                                                              |
| Secrets and env vars                   | `EMDASH_SITE_URL` (runtime and build arg) per app; `EMDASH_TRUSTED_PROXY_HEADERS` optional; no `EMDASH_ENCRYPTION_KEY` needed (plugin secrets only, no plugins; preview and IP-salt secrets are stored in the database, so a restored volume keeps them) [VERIFIED: `src/config/secrets.ts` header comment]. `EMDASH_TOKEN` is per environment and cascades away with its user. | Set env vars in Dokploy; recreate the agent token on production (D-12)                                                            |
| Build artifacts and installed packages | `.emdash/migrations.json` is gitignored and regenerated by every build; `dist/` and `data/` are local only                                                                                                                                                                                                                                                                      | Decide gate (e) (commit the manifest or keep it ignored)                                                                          |

**After every repo file is updated, runtime systems that still hold old state:** Cloudflare Pages (custom domain and build settings), Cloudflare DNS, and the existing passkey-less preview databases. All are listed above.

## Common Pitfalls

### Pitfall 1: D-02 names the wrong wizard option

**What goes wrong:** The user or executor selects "Import an existing EmDash site", the wizard applies the schema but no content, then sends the browser to `/_emdash/admin/settings/transfer?start=import` to upload a `.emdash` package.
**Why:** In 1.3.1 "Import" is the site-transfer path; only "Sample content" sets `includeContent: true`.
**How to avoid:** Plans and runbooks say "Sample content". Tell the user D-02's wording is superseded in effect, not in intent. If the option list lacks "Sample content", the baked seed is missing from the bundle (`hasContent` false); stop and check `.emdash/seed.json` was in the build context.
**Warning signs:** admin dashboard shows empty collections; public `/projects/` empty.

### Pitfall 2: Pushing triggers Pages

**What goes wrong:** Pushing `emdash-migration` creates Pages preview builds, and merging to `main` starts a production Pages build of server-output code.
**How to avoid:** Set Pages preview builds to **None** and uncheck automatic production deployments (saved) before the first push of either branch; verify in the Pages deployments list afterwards. CI on GitHub also runs on every push (`on: push:`), which is fine.

### Pitfall 3: "Rollback is a DNS flip" is not quite true

**What goes wrong:** After the Pages custom domain is detached, putting the CNAME back gives a 522 until the domain is re-associated in Pages.
**How to avoid:** Follow the rollback runbook (re-add the custom domain) and tell the user to expect a few minutes of errors. Keep the Pages project and its `pages.dev` deployment unbuilt and intact (D-05).

### Pitfall 4: Volume ownership

**What goes wrong:** A bind mount or pre-existing root-owned volume makes `/app/data` unwritable by `node`; EmDash fails with SQLite error 14 (the Phase 1 first boot failed this way when `data/` did not exist).
**How to avoid:** Use Dokploy **Volume Mount** (named volume). A new named volume is populated from the image's `/app/data`, which the Dockerfile chowns to `node` [ASSUMED: standard Docker named-volume initialization]. Verify with the first boot logs and `emdash doctor --database ./data/emdash.db`.

### Pitfall 5: Certificate issuance order

**What goes wrong:** Adding the domain in Dokploy before DNS points at the host makes the HTTP-01 challenge fail; Traefik then backs off and Let's Encrypt rate-limits repeated failures [ASSUMED: Traefik and Let's Encrypt behavior].
**How to avoid:** DNS first, domain second (runbook step order). If the hostname is Cloudflare-proxied, set SSL/TLS mode to **Full (strict)**; Flexible causes a redirect loop against Traefik's HTTPS redirect. If issuance stalls behind the proxy, switch the record to DNS-only (grey cloud) until the certificate exists [ASSUMED].

### Pitfall 6: Response headers disappear with Pages

**What goes wrong:** The live site currently returns `x-content-type-options: nosniff` and `referrer-policy: strict-origin-when-cross-origin` [VERIFIED: `curl -sI https://dev.zeikcookson.com`, 2026-10-26]. The repo has no `_headers` file, so these come from Pages or Cloudflare defaults [ASSUMED] and will not exist on the Node app.
**How to avoid (D-11, minimal):** if the record stays proxied, add one Cloudflare Transform Rule (Modify Response Header) setting those two headers; if DNS-only, add a Traefik `headers` middleware through Dokploy's Traefik file editor. Use `X-Frame-Options: SAMEORIGIN` if a frame option is added at all, because the admin preview may frame same-origin pages [ASSUMED]. Skip CSP: public pages carry five hashed inline scripts and a CSP is out of scope. The session store (gate f) stays under `node_modules/.astro`; a redeploy logs the admin out, which costs one passkey tap; do not move it unless annoying (D-11).

### Pitfall 7: Cloudflare bot protection versus the smoke test

**What goes wrong:** If the hostname is proxied with Bot Fight Mode or a managed challenge, GitHub runner IPs may get 403 or a challenge page and the smoke test goes red on a healthy site [ASSUMED].
**How to avoid:** First run `workflow_dispatch` of the smoke script and read the status; add a WAF skip rule for the runner if needed, or accept a retrying script that reports the status code it saw.

### Pitfall 8: Malformed Host header advisory (gate a)

**What goes wrong:** GHSA-qh8j-hqjv-7m4x: a Host such as `example.com:65536` or `example.com:8080:8080` makes the Node adapter throw `Invalid URL`. In the default standalone mode the request gets a 500 and the server keeps running; only the opt-in `staticHeaders: true` makes it a process-killing `uncaughtException`. Affected through 11.1.2, fixed in 11.1.3 [CITED: github.com/advisories/GHSA-qh8j-hqjv-7m4x]. This project runs `@astrojs/node` 10.1.4 with `staticHeaders` defaulting to false [VERIFIED: `node_modules/@astrojs/node/dist/index.js`, `staticHeaders: userOptions.staticHeaders ?? false`].
**How to verify (D-10):**

```bash
# against the origin; <host-ip> is the Dokploy server
curl -sk -o /dev/null -w '%{http_code}\n' --connect-to dev.zeikcookson.com:443:<host-ip>:443 -H 'Host: dev.zeikcookson.com:65536' https://dev.zeikcookson.com/
curl -s -o /dev/null -w '%{http_code}\n' https://dev.zeikcookson.com/    # still 200, container not restarted
```

Expect a 4xx from Traefik or a 500 from the app, and a healthy site afterwards. Whether Traefik forwards that Host unchanged is unverified [ASSUMED]; the check records the real result. Record the acceptance of the residual risk in PROJECT.md.

### Pitfall 9: Two containers on one SQLite volume

**What goes wrong:** Dokploy's "zero downtime" recipe (start-first, health checks) briefly runs two containers on the same volume; both run migrations, the scheduler and writers.
**How to avoid:** one replica, stop-first, no healthcheck requirement (D-04). The `/_emdash/api/health` path exists if a healthcheck is ever wanted [VERIFIED: used as `HEALTH_PATH` in `scripts/check-public-js.mjs` line 29].

### Pitfall 10: Recovery helper running as root

**What goes wrong:** A root helper container creates `-wal` and `-shm` files or the backup owned by root; the `node` user then gets "attempt to write a readonly database".
**How to avoid:** `--user 1000:1000` (the app's uid), and rehearse on the scratch volume first.

### Pitfall 11: First-claim exposure window

**What goes wrong:** Between the Dokploy domain becoming reachable and the wizard finishing, anyone can claim the admin. Downtime is accepted (D-07), but the same applies to the preview wizard if left unfinished.
**How to avoid:** do steps 4 and 5 of the runbook back to back, confirm `needsSetup: false` afterwards, and stop or finish the preview app.

### Pitfall 12: Agent-session guard blocks curl to `_emdash` paths

Noted in Project Constraints; plan `_emdash` checks as CI-script or human-verify steps.

### Pitfall 13: Host arch and build resources

**What goes wrong:** The Dockerfile has never been built on the Dokploy host. A small host can run out of memory during `npm ci` plus `astro build` (Dokploy warns builders use a lot of RAM and CPU [CITED: docs.dokploy.com/docs/core/applications/going-production]).
**How to avoid:** Wave 0 records `docker info --format '{{.Architecture}}'` and RAM on the host. The build is native, so arm64 versus amd64 only matters through prebuilt binaries (`sharp`), which npm resolves per platform [ASSUMED]. A cheap insurance step in `ci.yml` is `docker build -t portfolio:ci .` on the amd64 GitHub runner (Build Pattern below); it proves the Dockerfile builds on amd64 before the host ever sees it.

## Code Examples

### ci.yml additions (GUARD-02, optional amd64 image build)

```yaml
- run: npm run check:public-js
# GUARD-02 (Pattern 3)
- run: |
    npx emdash seed .emdash/seed.json --database "$RUNNER_TEMP/migrate-check.db" --uploads-dir "$RUNNER_TEMP/uploads"
    npx emdash migrate --check --from-config --database "$RUNNER_TEMP/migrate-check.db"

# Optional, if .emdash/migrations.json is committed (gate e): fails when the migration set changed
# - run: git diff --exit-code -- .emdash/migrations.json
# Optional, gate d: proves the Dockerfile builds on amd64
# - run: docker build --build-arg EMDASH_SITE_URL=https://dev.zeikcookson.com -t portfolio:ci .
```

### Dockerfile build-stage change (D-08)

```dockerfile
FROM base AS build
ARG EMDASH_SITE_URL
ENV EMDASH_SITE_URL=$EMDASH_SITE_URL
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build
```

`ENV` is scoped to the build stage and is not copied into the `runtime` stage; the runtime value comes from the Dokploy Environment tab.

### deploy.yml skeleton (Pattern 8; Dokploy response shapes are [ASSUMED], verify in Swagger)

```yaml
name: deploy
on:
  workflow_run:
    workflows: [ci]
    types: [completed]
    branches: [main]
  workflow_dispatch:
concurrency:
  group: deploy
  cancel-in-progress: false
permissions:
  contents: read
jobs:
  deploy:
    if: github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with:
          ref: ${{ github.event.workflow_run.head_sha || github.sha }}
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
      - name: Trigger Dokploy deploy and wait
        env:
          DOKPLOY_URL: ${{ secrets.DOKPLOY_URL }}
          DOKPLOY_API_KEY: ${{ secrets.DOKPLOY_API_KEY }}
          DOKPLOY_APP_ID: ${{ secrets.DOKPLOY_APP_ID }}
        run: |
          set -euo pipefail
          latest() { curl -fsS -G "$DOKPLOY_URL/api/deployment.all" -H "x-api-key: $DOKPLOY_API_KEY" \
            --data-urlencode "applicationId=$DOKPLOY_APP_ID" | jq -r '(.[0] // .data[0] // {}) | "\(.deploymentId // .id // "none") \(.status // "none")"'; }
          before=$(latest | cut -d' ' -f1)
          curl -fsS -X POST "$DOKPLOY_URL/api/application.deploy" -H "accept: application/json" \
            -H "x-api-key: $DOKPLOY_API_KEY" -H "Content-Type: application/json" \
            -d "{\"applicationId\":\"$DOKPLOY_APP_ID\"}" > /dev/null
          for i in $(seq 1 60); do
            read -r id status <<< "$(latest)"
            echo "deployment $id status $status"
            if [ "$id" != "$before" ]; then
              case "$status" in done) exit 0 ;; error|cancelled) exit 1 ;; esac
            fi
            sleep 10
          done
          echo "timed out waiting for the deploy"; exit 1
      - name: Smoke test
        run: node scripts/smoke-test.mjs https://dev.zeikcookson.com
```

### scripts/smoke-test.mjs skeleton (GUARD-03)

```js
// @ts-check
// Post-deploy smoke test (GUARD-03): "/" and one project page must answer 200.
// usage: node scripts/smoke-test.mjs BASE_URL [--attempts N] [--delay-ms MS]
const FETCH_TIMEOUT_MS = 15000;

/** @param {string} base @param {string} path @returns {Promise<{ status: number, body: string }>} */
async function get(base, path) {
  const response = await fetch(new URL(path, base), {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  return { status: response.status, body: await response.text() };
}

/** @param {string} base @returns {Promise<string | null>} null when healthy, else the failure reason */
export async function check(base) {
  const home = await get(base, "/");
  if (home.status !== 200) return `/ returned ${home.status}`;
  const index = await get(base, "/projects/");
  if (index.status !== 200) return `/projects/ returned ${index.status}`;
  const link = /href="(\/projects\/[a-z0-9-]+\/?)"/.exec(index.body);
  if (!link) return "no project link found on /projects/";
  const page = await get(base, link[1]);
  return page.status === 200 ? null : `${link[1]} returned ${page.status}`;
}
```

A loop around `check` (default 10 attempts, 15 s apart, catching network errors) and `process.exit(1)` on the last failure completes it; keep `check` exported so `smoke-test.test.mjs` can drive it against a local `node:http` server, matching the repo's test style.

### Checks after cutover (run by the user or a script, not by curl from the agent session)

```bash
# inside the container, gate (i): the flag is required
node node_modules/.bin/emdash doctor --database ./data/emdash.db
node node_modules/.bin/emdash migrate --check          # reads .emdash/migrations.json copied into the image
```

`doctor` run against a seeded scratch database printed `migrations: 90 applied, none pending` and the warning `users: no users - complete setup wizard at /_emdash/admin` before any user exists [VERIFIED: local run this session]. The production image has the CLI because `emdash` is a runtime dependency [VERIFIED: `package.json` `"emdash": "^1.3.1"` under `dependencies`] and copies `.emdash` from the build stage [VERIFIED: Dockerfile `COPY --from=build /app/.emdash ./.emdash`].

## State of the Art

| Old Approach                      | Current Approach                                                                                    | When Changed | Impact                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| Static Astro on Cloudflare Pages  | Node standalone container on Dokploy                                                                | Phase 1 D-01 | Pages `_headers` defaults no longer apply; DNS and domain re-association |
| Hand-run migrations before deploy | EmDash `auto` runtime migrations, `check` and `manual` modes available, CLI `migrate` with manifest | EmDash 1.3.x | D-02 chooses auto; CI check plus backup-before-upgrade is the guard      |
| Pre-deploy command in Dokploy     | None (dropped by amended D-02)                                                                      | 2026-10-26   | No pre-deploy step                                                       |

**Deprecated or outdated:** the Phase 1 gate-h wording "needed at build time behind an HTTPS proxy" is narrower than it reads; the build-time value affects only `image.remotePatterns`, and runtime resolution uses `process.env`.

## Assumptions Log

| #   | Claim                                                                                                                                         | Section               | Risk if Wrong                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| A1  | `GET /api/deployment.all?applicationId=` returns newest-first items with `status` in running, queued, done, error, cancelled, and an id field | Pattern 8, deploy.yml | Poll loop never ends or misreads; Wave 0 must verify in Swagger, fallback is a fixed wait plus smoke retries |
| A2  | `application.deploy` queues a build and returns immediately                                                                                   | Pattern 8             | If it blocks, the loop still works                                                                           |
| A3  | Dokploy default service update order is stop-first                                                                                            | Pattern 1, Pitfall 9  | Two containers briefly share the SQLite volume                                                               |
| A4  | A new named volume inherits the image's `/app/data` ownership (node)                                                                          | Pitfall 4             | First boot SQLite error 14; fix by chown on a helper container                                               |
| A5  | R2 region value `auto` works if `WNAM`/`ENAM` fails; Dokploy volume backups have no retention setting                                         | Pattern 6             | Connection test fails; storage grows slowly (about 2 MB a day)                                               |
| A6  | Traefik and Let's Encrypt back off after a failed challenge; ACME works through the Cloudflare proxy in Full (strict)                         | Pitfall 5             | Delay of up to an hour at cutover                                                                            |
| A7  | The two response headers on the live site come from Pages or Cloudflare defaults                                                              | Pitfall 6             | Headers present or absent differently than assumed; low impact                                               |
| A8  | Cloudflare bot protection may challenge GitHub runner IPs                                                                                     | Pitfall 7             | Smoke goes red spuriously                                                                                    |
| A9  | Traefik forwards a malformed Host to the container unchanged                                                                                  | Pitfall 8             | Check result may be a Traefik 4xx instead of an app 500; either is acceptable                                |
| A10 | Official Node image uid for `node` is 1000                                                                                                    | Pattern 7             | Recovery helper ownership mismatch                                                                           |
| A11 | Sharp and other prebuilt binaries resolve per platform in `npm ci` on the host                                                                | Pitfall 13            | Build fails on the host arch                                                                                 |
| A12 | The admin preview may use same-origin framing, so `X-Frame-Options` must be SAMEORIGIN                                                        | Pitfall 6             | A DENY header would break admin preview (Phase 6)                                                            |
| A13 | The Dokploy host has enough RAM for `npm ci` and `astro build` and Dokploy can reach `canklefark/dev-portfolio` (GitHub app or deploy key)    | Env Availability      | Build fails or cannot clone                                                                                  |
| A14 | R2 is acceptable to the user as the backup destination (Claude's discretion)                                                                  | Pattern 6             | Pick another S3-compatible target                                                                            |
| A15 | Committing `.emdash/migrations.json` and diffing it after the build is stable across CI and local builds                                      | Pattern 3             | Noisy CI; verify on the first run                                                                            |

## Open Questions

1. **D-02 says "choose Import"; the working option is "Sample content".**
   - What we know: Source shows "Import" is the .emdash site-transfer upload and only "Sample content" applies the baked seed with content (Pattern 2).
   - Recommendation: planner uses "Sample content" and notes the correction in the plan and evidence file; tell the user.
2. **DEPLOY-02 and roadmap success criterion 4 still say "migrations run as an explicit step before the container deploys".**
   - What we know: amended D-02 drops that; EmDash migrates on boot; `EMDASH_MIGRATIONS_MODE=check` would restore an explicit model at the cost of a manual migrate on a fresh volume and on every upgrade.
   - Recommendation: amend the DEPLOY-02 requirement text and the roadmap criterion to match D-02 (the user has amended other requirement texts the same way, for example AGENT-01), keeping "CI fails on a changed migration set" as the guard. Needs user confirmation.
3. **How strong should GUARD-02 be?** Literal step only (D-03), or also the committed-manifest drift gate (Pattern 3)?
   - Recommendation: add the drift gate; it is two lines plus a `.gitignore` change and is the only version that can actually fail.
4. **Is the Dokploy panel reachable from GitHub runners?** Decides API-trigger (recommended) versus auto-deploy plus wait. Not probeable from here.
5. **Cloudflare proxy on or off for `dev`?** The record is proxied today (resolves to Cloudflare IPs [VERIFIED: `dig +short dev.zeikcookson.com` returned 172.67.208.51 and 104.21.91.20]). Recommendation: keep proxied, SSL Full (strict), add the two-header Transform Rule; fall back to DNS-only if issuance or the smoke test misbehaves. Needs the user's preference.
6. **Preview hostname.** Recommendation: a real subdomain such as `preview.zeikcookson.com` (A record to the host, Let's Encrypt), since passkeys need HTTPS and `traefik.me` is HTTP-only unless a certificate is added [CITED: docs.dokploy.com/docs/core/domains]. Any easy hostname is acceptable (Claude's discretion).
7. **Host arch, RAM and Git access** for Dokploy are unprobed (Environment Availability).

## Environment Availability

| Dependency                                          | Required By                | Available                                                                 | Version            | Fallback                                                             |
| --------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------- |
| Node                                                | scripts, CI parity         | yes (local)                                                               | 24.x (`.nvmrc` 24) | none needed                                                          |
| Docker                                              | optional local image build | yes (local, arm64 Mac)                                                    | 29.8.1             | CI amd64 build                                                       |
| `gh` CLI                                            | secrets, runs              | yes, but logged in as `cankledankle` while the repo owner is `canklefark` | 2.102.0            | set secrets in GitHub UI                                             |
| curl, jq, dig, sqlite3                              | checks                     | yes (local)                                                               | system             | none needed                                                          |
| Dokploy host (arch, RAM, Docker, Swarm)             | build and run              | not probed from this environment                                          | unknown            | Wave 0: record `docker info --format '{{.Architecture}}'`, `free -m` |
| Dokploy panel reachable from GitHub runners         | Pattern 8                  | unknown                                                                   | -                  | auto deploy plus wait-and-retry smoke                                |
| Dokploy GitHub access to `canklefark/dev-portfolio` | build from git             | unknown                                                                   | -                  | deploy key or public HTTPS Git provider                              |
| Cloudflare account (Pages, DNS, optional R2)        | cutover, backup            | assumed (site is on Cloudflare today)                                     | -                  | another S3-compatible destination                                    |

**Missing dependencies with no fallback:** none identified; all unknowns above have a fallback.
**Needs the user (checkpoint:human-action):** pushing `emdash-migration`, merging and pushing `main`, creating Dokploy objects and the API key, Cloudflare Pages and DNS changes, real-device passkey enrollment, setting GitHub secrets.

## Validation Architecture

`workflow.nyquist_validation` is absent in `.planning/config.json`, so this section is included.

### Test Framework

| Property           | Value                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------- |
| Framework          | Node built-in test runner (`node --test`), existing                                    |
| Config file        | none; `package.json` script `test` globs `scripts/*.test.mjs` and `src/lib/*.test.mjs` |
| Quick run command  | `npm test`                                                                             |
| Full suite command | `npm test && npm run check:public-js`                                                  |

### Phase Requirements to Test Map

| Req ID             | Behavior                                                                  | Test Type                  | Automated Command                                                                                                                                          | File Exists?          |
| ------------------ | ------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| GUARD-02           | migrate check passes on a seeded temp DB, fails on an empty one           | CI step plus local run     | `npx emdash seed .emdash/seed.json --database <tmp>/m.db --uploads-dir <tmp>/u && npx emdash migrate --check --from-config --database <tmp>/m.db` (exit 0) | no, new CI step       |
| GUARD-03           | smoke check returns null on healthy server, reason on 500 or missing link | unit                       | `node --test scripts/smoke-test.test.mjs`                                                                                                                  | no, Wave 0            |
| DEPLOY-01          | container boots with volume and serves `/`                                | manual-only plus smoke     | `node scripts/smoke-test.mjs https://<preview-host>`                                                                                                       | after Wave 0          |
| DEPLOY-03          | preview matches baseline                                                  | script                     | `node scripts/script-inventory.mjs fetch ...` then `parity` and `check` (Pattern 4)                                                                        | yes, existing tooling |
| DEPLOY-04          | production serves, rollback documented                                    | manual-only (DNS, Dokploy) | smoke script plus runbook evidence                                                                                                                         | evidence file         |
| DEPLOY-05          | restored volume matches production                                        | script plus manual         | `fetch` both, `compare` (Pattern 6)                                                                                                                        | yes, existing tooling |
| ADMIN-02, ADMIN-03 | login page, two passkeys, recovery                                        | manual-only (real devices) | human-verify checkpoints, status route check via CI script                                                                                                 | evidence file         |
| DEPLOY-02          | explicit-migration wording                                                | decision, not a test       | Open Question 2                                                                                                                                            | -                     |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run check:public-js`
- **Phase gate:** full suite green plus evidence file complete before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `scripts/smoke-test.mjs` and `scripts/smoke-test.test.mjs` covering GUARD-03
- [ ] `.github/workflows/deploy.yml`
- [ ] Verify Dokploy API shapes in Swagger (A1, A2); record host arch, RAM and Git access
- [ ] `05-EVIDENCE.md` skeleton (preview parity, Host-header check, cutover log, restore, recovery)

## Security Domain

`security_enforcement` is not set to false, so this applies.

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                                                                                        |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | yes     | EmDash passkeys on the real HTTPS hostname; two credentials; recovery runbook (D-09)                                                                                                                    |
| V3 Session Management | yes     | EmDash cookie sessions; session store under `node_modules/.astro` is lost on redeploy (accepted, D-11)                                                                                                  |
| V4 Access Control     | yes     | Setup route returns 409 `ALREADY_CONFIGURED` after setup; scoped agent token; dev-bypass returns 403 outside dev [VERIFIED: `dev-bypass.ts`, `"Dev bypass is only available in development mode", 403`] |
| V5 Input Validation   | limited | No new user input in this phase; setup body is zod-validated by EmDash (`setupBody`)                                                                                                                    |
| V6 Cryptography       | yes     | TLS via Let's Encrypt and Traefik; secrets generated by EmDash and stored in the DB; never hand-roll                                                                                                    |
| V14 Configuration     | yes     | Minimal headers (Pitfall 6), Host-header check (Pitfall 8), API key stored only as a GitHub secret                                                                                                      |

### Known Threat Patterns for this stack

| Pattern                                              | STRIDE                           | Standard Mitigation                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First-claim race on the setup wizard                 | Elevation of Privilege           | Complete the wizard immediately after the domain serves; verify `needsSetup: false`; stop or finish the preview wizard                                                                                                                                                                                                                                           |
| Malformed Host header crashes or confuses the server | Denial of Service                | `staticHeaders` off (default), proxy in front, record the curl check (D-10)                                                                                                                                                                                                                                                                                      |
| Public MCP and admin endpoints                       | Spoofing, Elevation of Privilege | Token required (expect 401 unauthenticated), scoped token with 90-day expiry, committed Claude guard (Phase 4)                                                                                                                                                                                                                                                   |
| Rate limiting inactive behind a proxy                | Denial of Service                | With no trusted proxy headers EmDash cannot resolve a client IP and skips rate limiting [VERIFIED: `src/auth/rate-limit.ts`, "no trusted IP available ... skip rate limiting"]. Optional: set `EMDASH_TRUSTED_PROXY_HEADERS` to `cf-connecting-ip` (proxied) or `x-forwarded-for` (DNS-only, Traefik direct); only when the proxy is the sole path to the origin |
| Backup bucket exposure                               | Information Disclosure           | R2 token limited to the one bucket with Object Read and Write; the backup holds hashed token and passkey public data, not secrets                                                                                                                                                                                                                                |
| Leaked Dokploy API key                               | Tampering                        | GitHub secret only; scope to a non-admin user if possible; rotate with the first deploy                                                                                                                                                                                                                                                                          |
| Build arg misuse for secrets                         | Information Disclosure           | Only the public site URL goes in a build arg; no secrets (Dokploy warns args persist in the image)                                                                                                                                                                                                                                                               |

## Sources

### Primary (HIGH confidence)

- Installed EmDash 1.3.1 source and CLI behavior (read and executed this session): `node_modules/emdash/src/cli/commands/migrate.ts`, `seed.ts`, `database/migrations/policy.ts`, `astro/routes/api/setup/index.ts` and `status.ts`, `astro/middleware/setup.ts`, `astro/integration/index.ts`, `api/public-url.ts`, `config/secrets.ts`, `auth/rate-limit.ts`, `seed/apply.ts`
- `node_modules/@emdash-cms/admin/dist/index.js.map` (SetupWizard.tsx source)
- Repo files: `Dockerfile`, `.dockerignore`, `.github/workflows/ci.yml`, `astro.config.mjs`, `package.json`, `.emdash/seed.json`, `.emdash/migrations.json`, `scripts/check-public-js.mjs`, `scripts/script-inventory.mjs`, `.planning/PROJECT.md` spike findings
- Local runs: `emdash migrate --check` (three database states), `emdash seed`, `emdash doctor`, recovery snippet on a scratch copy; `curl -sI` and `dig` against the live site

### Secondary (MEDIUM confidence)

- [Dokploy volume backups](https://docs.dokploy.com/docs/core/volume-backups) (named volumes only, container-off option, restore needs a new volume)
- [Dokploy build type](https://docs.dokploy.com/docs/core/applications/build-type) (Build Time Arguments)
- [Dokploy domains](https://docs.dokploy.com/docs/core/domains) (Traefik file config, certificates, container port)
- [Dokploy going production](https://docs.dokploy.com/docs/core/applications/going-production) (`application.deploy` call)
- [Dokploy auto deploy](https://docs.dokploy.com/docs/core/auto-deploy) (toggle, branch match)
- [Dokploy preview deployments](https://docs.dokploy.com/docs/core/applications/preview-deployments) (PR-driven)
- [Dokploy Cloudflare R2](https://docs.dokploy.com/docs/core/cloudflare-r2)
- [Dokploy API](https://docs.dokploy.com/docs/api) (x-api-key, Swagger for admins)
- [Cloudflare Pages branch build controls](https://developers.cloudflare.com/pages/configuration/branch-build-controls/)
- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [GHSA-qh8j-hqjv-7m4x](https://github.com/advisories/GHSA-qh8j-hqjv-7m4x)

### Tertiary (LOW confidence)

- User's `keller-tools` deploy-app skill for `deployment.all` polling shape (not Dokploy docs)
- Web search snippets on the Dokploy GitHub deploy actions and 403 behavior behind Cloudflare

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH for EmDash and repo, MEDIUM for Dokploy (docs pages were thin or 404 for volumes and S3 destinations)
- Architecture: MEDIUM-HIGH; wizard, migration, CI behavior verified by source and runs; Dokploy API polling shape assumed
- Pitfalls: MEDIUM; items 1, 3, 8, 10 are evidenced, items 5, 7, 13 are standard-behavior assumptions

**Research date:** 2026-10-26
**Valid until:** 2026-11-25 (Dokploy and EmDash both move quickly; recheck Dokploy API shapes against the installed panel version)
