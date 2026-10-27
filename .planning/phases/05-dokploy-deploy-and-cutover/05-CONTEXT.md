# Phase 5: Dokploy Deploy and Cutover - Context

**Gathered:** 2026-10-26
**Status:** Ready for planning

<domain>
## Phase Boundary

dev.zeikcookson.com is served by a Dokploy Node container with SQLite and uploads on one persistent volume. The admin is claimed on the real hostname with two passkeys. CI fails on pending migrations (migrations themselves run on boot), and a post-deploy smoke test checks `/` and one project page.

Guiding principle from the user: keep it simple. This is a personal site run on their own server. Downtime during cutover is acceptable. Do not build zero-downtime, staged-claim or multi-environment machinery.

Amended 2026-10-27 (user): Cloudflare Pages is dropped entirely. The site is deployed straight to one Dokploy production app, guided by the EmDash Node and Docker deployment docs. The old site on dev.zeikcookson.com is torn down, no rollback target is kept, and Cloudflare stays DNS only for zeikcookson.com.

</domain>

<decisions>
## Implementation Decisions

### Build and deploy

- **D-01:** Dokploy builds from git using the repo Dockerfile on the host. No GitHub Actions image build, no registry. Build arch is the Dokploy host's, so the planner confirms the host arch and that the Dockerfile builds there (the Phase 1 spike image was arm64). — **Reversibility:** reversible, switching to a registry flow later is a config change.
- **D-02 (amended 2026-10-26, user wants it simple):** No separate pre-deploy migration step. EmDash creates the SQLite file and runs its migrations itself on boot (Phase 1 spike), so a plain container deploy is enough. First-time setup is: start the container, choose Import in the setup wizard using the committed `.emdash/seed.json` (Phase 2 D-13), then enroll passkeys. The seed is for first setup only; after go-live content lives in the production database and the seed is never re-applied. Researcher confirms the wizard Import path loads schema, content, nav and settings from the seed, and reports anything it leaves out. Accepted tradeoff: a future EmDash upgrade with a schema change migrates on boot, so take a backup before upgrading.
  - **Amended again 2026-10-26 during planning (user):** the setup wizard option is "Sample content", which applies the committed .emdash/seed.json with its content; "Import an existing EmDash site" is the .emdash site-transfer upload and applies no content (05-RESEARCH Pitfall 1).
- **D-03:** CI keeps this cheap check: `emdash migrate --check` (GUARD-02), appended to the existing job in `.github/workflows/ci.yml`.
  - **Extended 2026-10-26 during planning (user):** .emdash/migrations.json is committed and CI runs git diff --exit-code on it after the build (gate e), next to the seeded-database migrate --check.
- **D-04:** The post-deploy smoke test (GUARD-03) runs in GitHub Actions after deploy, checks `/` and one project page return 200, and alerts only (goes red). No auto-rollback and no Dokploy healthcheck requirement. Researcher decides how the workflow knows the deploy finished (webhook trigger or poll loop).

### Branches and cutover

- **D-05 (amended 2026-10-27, user: Cloudflare Pages is dropped entirely):** There is one Dokploy app, production, deployed straight to `dev.zeikcookson.com`. There is no preview app, no branch-control setting anywhere else and no rollback target. The first deploy builds the pushed `emdash-migration` branch, so `main` receives `deploy.yml` only after the site is claimed and seeded; the app is then switched to `main`, and the merge push is the first run of the CI-gated pipeline (D-04). A bad deploy is recovered by reverting the commit through the pipeline, or by restoring a volume backup when a migration ran. Merging and pushing still need the user's explicit go-ahead.
- **D-06 (amended 2026-10-27, user):** No preview app. The existing Phase 1/3 parity compare against `~/portfolio-baseline/current` and the public-JS allowlist check run against the production hostname right after the first deploy and again after the pipeline's redeploy. Record the result in a phase evidence file. No screenshots. The only second instance is a temporary scratch app for the restore rehearsal (D-14).
- **D-07 (amended 2026-10-27, user: this does not need to be a clean cutover):** Downtime is fine. Tear down the old site on `dev.zeikcookson.com`, point it at the Dokploy host with a DNS-only A record, and as soon as it serves, complete the setup wizard and enroll two passkeys on that hostname in the same sitting (rpId follows `EMDASH_SITE_URL`, so the real hostname is required). No hosts-file override, no DNS-01 pre-claim, no IP allowlist. No rollback target is kept. **Reversibility:** one-way for the old site, which is torn down, and passkeys enrolled on the hostname stay bound to it; the Dokploy app itself is reversible.
- **D-08:** `EMDASH_SITE_URL=https://dev.zeikcookson.com` is set at build and run time (Phase 1 gate h).

### Admin, recovery and exposure

- **D-09:** Admin gate is EmDash passkeys only (Phase 1 D-08). Two passkeys on real devices, with the SQLite recovery procedure from `PROJECT.md` Spike Findings rehearsed once. The GitHub-login alternative (gate b) is not adopted.
- **D-10:** Astro 6 residual advisories (gate a): stay on Astro 6 and accept the risk, no Astro 7 migration in this phase. Phase 5 only verifies the proxy rejects a malformed Host header (curl check, recorded). Record the acceptance in `PROJECT.md`.
- **D-11:** Security headers (gate g) and the session store location (gate f): Claude's discretion, kept minimal. Add basic headers at Traefik only if cheap (Cloudflare is DNS only); do not move the session store unless a redeploy logging the user out proves annoying.
- **D-12:** The agent token (Phase 4 D-08) is recreated after the production database exists, and `EMDASH_MCP_URL` is pointed at the production endpoint. One live content-list call proves it.

### Backup and restore

- **D-13:** Use Dokploy's built-in scheduled volume or file backup for the whole `/app/data` volume (SQLite plus uploads are one backup unit). Destination and cadence: Claude's discretion, simplest Dokploy supports (S3-compatible target if available). No custom retention design.
- **D-14:** DEPLOY-05 rehearsal: restore one backup into a scratch container, confirm it boots and its project and About content matches production, then discard it.

### Claude's Discretion

- Hostname for the temporary scratch instance used in the restore rehearsal (D-14).
- Backup destination, schedule and retention. The destination is an S3-compatible bucket; Cloudflare is DNS only after the 2026-10-27 decision, so R2 is no longer the default and the user may pick any provider.
- Security headers and session store handling (D-11).
- Webhook versus poll for triggering the post-deploy smoke test.

### Pending items not discussed

- Image architecture (gate d), `.emdash/migrations.json` commit versus build-in-CI (gate e) and `emdash doctor --database` flag (gate i) are left to research and planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning

- `.planning/ROADMAP.md` Phase 5 goal and success criteria
- `.planning/REQUIREMENTS.md` DEPLOY-01 to DEPLOY-05, ADMIN-02, ADMIN-03, GUARD-02, GUARD-03
- `.planning/PROJECT.md` Spike Findings: recovery drill, passkey rpId note, Named gates (a) to (l), Constraints (Hosting, Node)
- `.planning/phases/01-spike-baseline-and-decisions/01-CONTEXT.md` D-01 to D-15 (Dokploy, SQLite volume, passkeys only, branch model)
- `.planning/phases/04-agent-access/04-CONTEXT.md` D-08 (recreate agent token after DB move) and D-09 (per-environment `EMDASH_MCP_URL`)
- `.planning/phases/04-agent-access/04-VERIFICATION.md` W7 (deployed endpoint untested until Phase 5)
- `.planning/phases/03-read-path-rewire-and-parity/03-CONTEXT.md` D-10 (`check:public-js`)

### EmDash deployment docs (the user's chosen guide for the deploy)

- https://docs.emdashcms.com/deployment/nodejs/ (Node standalone, Docker, volume, `EMDASH_SITE_URL` at build and run time, migrations on first request, verification list)
- https://docs.emdashcms.com/guides/backups/ (raw database copy with its -wal and -shm files, media directory, JSON backups cannot be restored)
- https://docs.emdashcms.com/deployment/updating/ and https://docs.emdashcms.com/deployment/core-migrations/ (recovery point before a migration, a code rollback does not undo a migration)
- https://docs.emdashcms.com/guides/authentication/ and https://docs.emdashcms.com/guides/change-domain/ (passkeys are bound to the hostname where they are created)

### Code and tooling

- `Dockerfile` multi-stage Node 24 image, volume `/app/data`
- `.github/workflows/ci.yml` placeholder comment for GUARD-02 and GUARD-03
- `astro.config.mjs` EmDash integration and sqlite/local paths
- `~/portfolio-baseline/current` baseline HTML and script inventory for parity

Beyond the EmDash docs above there are no external specs. Researcher should confirm Dokploy pre-deploy, backup and domain features against current Dokploy docs.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `Dockerfile`: already builds and serves 17 of 17 pages identical to baseline (Phase 1), with `data/` created and owned by `node`.
- Parity compare tooling and `npm run check:public-js` from Phases 1 and 3.
- `.github/workflows/ci.yml` verify job to extend.
- `emdash migrate --check` works with no database flag; `emdash doctor` needs `--database ./data/emdash.db`.

### Established Patterns

- Never push or run dev servers without the user asking.
- No em dashes in docs or copy.

### Integration Points

- Cloudflare stays DNS only (grey cloud) for zeikcookson.com; there is no rollback target.
- Phase 6 consumes the live admin for editing and updates CLAUDE.md and README.

</code_context>

<specifics>
## Specific Ideas

"I just wanna run this on my server and use it. It doesn't need to be that deep. The site can come down for a while during the cutover."

"we aren't doing cloudflare pages anymore, we're just deploying it to dokploy using the emdash docs to guide it" (2026-10-27). dev.zeikcookson.com can be torn down, downtime is fine, "this doesn't need to be a clean cutover".

</specifics>

<deferred>
## Deferred Ideas

- Offsite backup design, retention policy and monitoring beyond Dokploy defaults.
- Zero-downtime cutover, staged admin claim, visual screenshot parity.
- Astro 7 migration.
- Offsite backup monitoring beyond what Dokploy shows (the design itself is already deferred above).

</deferred>

---

*Phase: 5-Dokploy Deploy and Cutover*
*Context gathered: 2026-10-26*
