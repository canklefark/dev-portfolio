# Phase 5: Dokploy Deploy and Cutover - Context

**Gathered:** 2026-10-26
**Status:** Ready for planning

<domain>
## Phase Boundary

dev.zeikcookson.com is served by a Dokploy Node container with SQLite and uploads on one persistent volume. The admin is claimed on the real hostname with two passkeys. Migrations run as an explicit step before deploy, CI fails on pending migrations, and a post-deploy smoke test checks `/` and one project page.

Guiding principle from the user: keep it simple. This is a personal site run on their own server. Downtime during cutover is acceptable. Do not build zero-downtime, staged-claim or multi-environment machinery.

</domain>

<decisions>
## Implementation Decisions

### Build and deploy

- **D-01:** Dokploy builds from git using the repo Dockerfile on the host. No GitHub Actions image build, no registry. Build arch is the Dokploy host's, so the planner confirms the host arch and that the Dockerfile builds there (the Phase 1 spike image was arm64). — **Reversibility:** reversible, switching to a registry flow later is a config change.
- **D-02:** Migrations run as a pre-deploy command in Dokploy (`emdash migrate` against the volume before the new container takes traffic). A failure aborts the deploy so the old container keeps serving. Researcher must confirm what Dokploy supports for a pre-deploy step on a git-built app and fall back to the closest equivalent that is still explicit, not an implicit entrypoint migration.
- **D-03:** CI gets `emdash migrate --check` (GUARD-02) appended to the existing job in `.github/workflows/ci.yml`.
- **D-04:** The post-deploy smoke test (GUARD-03) runs in GitHub Actions after deploy, checks `/` and one project page return 200, and alerts only (goes red). No auto-rollback and no Dokploy healthcheck requirement. Researcher decides how the workflow knows the deploy finished (webhook trigger or poll loop).

### Branches and cutover

- **D-05:** A Dokploy preview app deploys from `emdash-migration`. `main` stays on Cloudflare Pages until cutover. At cutover, merge `emdash-migration` into `main`, point the production Dokploy app at `main`, and disable the Pages build so Pages never builds the EmDash code. The Pages project stays in place, unbuilt, for a DNS rollback with no fixed retirement window. Merging and pushing still need the user's explicit go-ahead.
- **D-06:** Preview is minimal: one preview app with its own volume and fresh seed import from the repo, on any hostname that is easy to set up. Run the existing Phase 1/3 parity compare against `~/portfolio-baseline/current` pointed at the preview URL, plus `check:public-js`. Record the result in a phase evidence file. No screenshots and no separate polished preview domain.
- **D-07:** Cutover order is simple: downtime is fine. Point `dev.zeikcookson.com` at Dokploy, and as soon as it serves, complete the setup wizard and enroll two passkeys on that hostname in the same sitting (rpId follows `EMDASH_SITE_URL`, so the real hostname is required). No hosts-file override, no DNS-01 pre-claim, no IP allowlist. Rollback is pointing DNS back at Pages. — **Reversibility:** reversible, DNS flip back; but passkeys enrolled on the hostname stay bound to it.
- **D-08:** `EMDASH_SITE_URL=https://dev.zeikcookson.com` is set at build and run time (Phase 1 gate h).

### Admin, recovery and exposure

- **D-09:** Admin gate is EmDash passkeys only (Phase 1 D-08). Two passkeys on real devices, with the SQLite recovery procedure from `PROJECT.md` Spike Findings rehearsed once. The GitHub-login alternative (gate b) is not adopted.
- **D-10:** Astro 6 residual advisories (gate a): stay on Astro 6 and accept the risk, no Astro 7 migration in this phase. Phase 5 only verifies the proxy rejects a malformed Host header (curl check, recorded). Record the acceptance in `PROJECT.md`.
- **D-11:** Security headers (gate g) and the session store location (gate f): Claude's discretion, kept minimal. Add basic headers at Traefik or Cloudflare only if cheap; do not move the session store unless a redeploy logging the user out proves annoying.
- **D-12:** The agent token (Phase 4 D-08) is recreated after the production database exists, and `EMDASH_MCP_URL` is pointed at the production endpoint. One live content-list call proves it.

### Backup and restore

- **D-13:** Use Dokploy's built-in scheduled volume or file backup for the whole `/app/data` volume (SQLite plus uploads are one backup unit). Destination and cadence: Claude's discretion, simplest Dokploy supports (S3-compatible target if available). No custom retention design.
- **D-14:** DEPLOY-05 rehearsal: restore one backup into a scratch container, confirm it boots and its project and About content matches production, then discard it.

### Claude's Discretion

- Exact hostname for the preview app.
- Backup destination, schedule and retention.
- Security headers and session store handling (D-11).
- Webhook versus poll for triggering the post-deploy smoke test.
- Pre-deploy mechanism details within D-02.

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

### Code and tooling

- `Dockerfile` multi-stage Node 24 image, volume `/app/data`
- `.github/workflows/ci.yml` placeholder comment for GUARD-02 and GUARD-03
- `astro.config.mjs` EmDash integration and sqlite/local paths
- `~/portfolio-baseline/current` baseline HTML and script inventory for parity

No external specs. Researcher should confirm Dokploy pre-deploy, backup and domain features against current Dokploy docs.

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

- Cloudflare stays DNS (and optionally proxy) for dev.zeikcookson.com; Pages project is the rollback target.
- Phase 6 consumes the live admin for editing and updates CLAUDE.md and README.

</code_context>

<specifics>
## Specific Ideas

"I just wanna run this on my server and use it. It doesn't need to be that deep. The site can come down for a while during the cutover."

</specifics>

<deferred>
## Deferred Ideas

- Offsite backup design, retention policy and monitoring beyond Dokploy defaults.
- Zero-downtime cutover, staged admin claim, visual screenshot parity.
- Astro 7 migration.
- Retiring the Pages project (do it whenever the user is comfortable).

</deferred>

---

*Phase: 5-Dokploy Deploy and Cutover*
*Context gathered: 2026-10-26*
