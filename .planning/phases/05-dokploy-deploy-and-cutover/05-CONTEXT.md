# Phase 5: Dokploy Deploy and Cutover - Context

**Gathered:** 2026-10-26
**Status:** Ready for planning (fourth revision, 2026-10-27: simplified to manual deploys)

<domain>
## Phase Boundary

dev.zeikcookson.com is served by a Dokploy Node container with SQLite and uploads on one persistent volume. The admin is claimed on the real hostname with a passkey. CI fails on pending migrations (EmDash applies pending migrations itself on the first request after a deploy). The owner deploys by clicking Deploy in Dokploy, and a smoke test run by hand after each deploy checks `/`, `/projects/` and one project page.

Guiding principle from the user: keep it simple. This is a personal site run on their own server. Downtime during cutover is acceptable. Do not build zero-downtime, staged-claim, multi-environment or pipeline machinery.

Amended 2026-10-27 (user): Cloudflare Pages is dropped entirely. The site is deployed straight to one Dokploy production app, guided by the EmDash Node and Docker deployment docs. The old site on dev.zeikcookson.com is torn down and no rollback target is kept.

Amended again 2026-10-27 (user, second and third revisions): the Cloudflare proxy is turned on for dev.zeikcookson.com once the Let's Encrypt certificate exists and a deploy has passed (D-16), and backups go to Cloudflare R2 (D-17). Tag-triggered, CI-gated deploys were designed in those revisions and are superseded below.

Amended a fourth time 2026-10-27 (user, "I just want this done"): deploys are manual (D-15 superseded). There is no deploy workflow, no deploy gate, no Dokploy API key and no GitHub deploy secret. One passkey is enough for now (D-09). Agent access is OAuth to the committed `.mcp.json` and has no Phase 5 work (D-12 superseded).

</domain>

<decisions>
## Implementation Decisions

### Build and deploy

- **D-01:** Dokploy builds from git using the repo Dockerfile on the host. No GitHub Actions image build, no registry. The first build on the Dokploy host succeeded (05-EVIDENCE C1), so the host architecture and the Dockerfile are proven together. **Reversibility:** reversible, switching to a registry flow later is a config change.
- **D-02 (amended 2026-10-26, user wants it simple):** No separate pre-deploy migration step. EmDash creates the SQLite file and applies its pending core migrations itself on the first request after the container starts (default `auto` mode, EmDash Node deployment guide), so a plain container deploy is enough. First-time setup is: start the container, choose Sample content in the setup wizard (which applies the committed `.emdash/seed.json`, Phase 2 D-13), then enroll a passkey. The seed is for first setup only; after go-live content lives in the production database and the seed is never re-applied. Accepted tradeoff: a future EmDash upgrade with a schema change migrates on the first request after the deploy, so take a backup before upgrading.
  - **Amended again 2026-10-26 during planning (user):** the setup wizard option is "Sample content", which applies the committed .emdash/seed.json with its content; "Import an existing EmDash site" is the .emdash site-transfer upload and applies no content (05-RESEARCH Pitfall 1).
  - **Wording corrected 2026-10-27:** migrations run on the first request after a start, not at process boot; the EmDash docs say "the first request applies pending core migrations".
- **D-03:** CI keeps this cheap check: `emdash migrate --check` (GUARD-02), appended to the existing job in `.github/workflows/ci.yml`.
  - **Extended 2026-10-26 during planning (user):** .emdash/migrations.json is committed and CI runs git diff --exit-code on it after the build (gate e), next to the seeded-database migrate --check. Both ran green on GitHub for f2ba6f3 (05-EVIDENCE C1).
- **D-04 (amended 2026-10-27, user: manual deploys):** The post-deploy smoke test (GUARD-03) is run by hand after each deploy: `node scripts/smoke-test.mjs https://dev.zeikcookson.com`. It checks `/`, `/projects/` and the first project page return 200 and prints PASS or FAIL. No pipeline runs it, no auto-rollback, no Dokploy healthcheck requirement.

### Branches and cutover

- **D-05 (amended 2026-10-27, user: Cloudflare Pages is dropped entirely; amended again for manual deploys):** There is one Dokploy app, production, deployed straight to `dev.zeikcookson.com`. There is no preview app and no rollback target. The first deploy built the pushed `emdash-migration` branch. Plan 05-04 removes the unused pipeline code on that branch, then the user fast-forwards `main` to it and pushes (a push to `main` runs `ci` only), points the Dokploy app at `main`, clicks Deploy once and runs the smoke test. Auto Deploy stays off, because the owner clicks Deploy. Merging and pushing need the user's explicit action; the executor never pushes. **Manual rollback rule:** to roll back a bad deploy, revert the bad commit on `main`, push and click Deploy, or point the Dokploy app at an earlier branch or tag and click Deploy (not rehearsed). A code rollback does not undo a migration that already ran (EmDash updating guide), so after a bad migration restore a volume backup (D-13).
- **D-06 (amended 2026-10-27, user):** No preview app. The Phase 1/3 parity compare against `~/portfolio-baseline/current` and the public-JS allowlist check run against the production hostname twice: with the record DNS only (plan 05-03) and behind the Cloudflare proxy (plan 05-04). Record the result in the phase evidence file. No screenshots. The only second instance is a temporary scratch app for the restore rehearsal (D-14).
- **D-07 (amended 2026-10-27, user: this does not need to be a clean cutover):** Downtime is fine. The old site on `dev.zeikcookson.com` is torn down, the name points at the Dokploy host with a DNS-only A record, and as soon as it serves, the setup wizard is completed and a passkey is enrolled on that hostname in the same sitting (rpId follows `EMDASH_SITE_URL`, so the real hostname is required). No hosts-file override, no DNS-01 pre-claim, no IP allowlist. No rollback target is kept. This is done (05-EVIDENCE C2, C3). **Reversibility:** one-way for the old site, which is torn down, and the passkey enrolled on the hostname stays bound to it; the Dokploy app itself is reversible.
- **D-08:** `EMDASH_SITE_URL=https://dev.zeikcookson.com` is set at build and run time (Phase 1 gate h).

### Admin, recovery and exposure

- **D-09 (amended 2026-10-27, user):** Admin gate is EmDash passkeys only (Phase 1 D-08). ONE passkey is enrolled; the user decided that is fine for now and dropped the two-passkey requirement. Lockout risk, stated once: if the one device is lost, the way back in is the SQLite recovery procedure from `PROJECT.md` Spike Findings (stop the server, back up the database, delete the users and the two setup options, re-run the wizard). That procedure was rehearsed locally in Phase 1; its production-container form is not rehearsed. The GitHub-login alternative (gate b) is not adopted.
- **D-10 (amended 2026-10-27):** Astro 6 residual advisories (gate a): stay on Astro 6 and accept the risk, no Astro 7 migration in this phase. Phase 5 only verifies that the ingress (Traefik, reached directly at the origin while the record is DNS only) answers a malformed Host header without taking the site down (curl check with `--http1.1` and a `Host` header, recorded in plan 05-03). Record the acceptance in `PROJECT.md`.
- **D-11 (amended 2026-10-27):** Security headers (gate g) and the session store location (gate f): Claude's discretion, kept minimal. Observed on the live origin on 2026-10-27: EmDash itself sends `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `x-frame-options: SAMEORIGIN` and a `permissions-policy`, so no Traefik or Cloudflare header rule is added (the Transform Rule of the second revision is dropped). No CSP. Do not move the session store unless a redeploy logging the user out proves annoying.
- **D-12 (superseded 2026-10-27, user):** The agent token plan is gone. Agent access is OAuth to the committed `.mcp.json` (server `emdash`, URL only), which works against production. Phase 5 has no agent-token work; the proxy plan keeps one line, that the OAuth MCP connection still works once the proxy is on.

### Backup and restore

- **D-13 (amended 2026-10-27):** Use Dokploy's built-in scheduled volume backup for the whole `/app/data` volume (SQLite plus uploads are one backup unit), to the S3 destination chosen in D-17. Cadence: Claude's discretion (nightly, container stopped during the copy). No custom retention design.
- **D-14 (amended 2026-10-27, simplified):** DEPLOY-05 rehearsal per the EmDash backups guide: restore one backup into a new Dokploy volume, start a scratch app on that volume with no domain, confirm it boots (`emdash doctor` in its terminal) and that three pages (`/`, `/projects/`, `/about/`) hash the same in the scratch container as in the production container, then discard the scratch app and volume. No scratch hostname, no DNS record, no certificate and no admin recovery drill.

### Proxy, manual deploys and backup destination (user, 2026-10-27)

- **D-15 (SUPERSEDED 2026-10-27, user: manual deploys, no pipeline):** The second and third revisions designed tag-triggered production deploys behind a CI gate, with a Dokploy API call that set the source ref to the tag. The user dropped all of it: no `deploy.yml`, no `scripts/deploy-gate.mjs`, no Dokploy API key, no GitHub secrets, no tag probe, no `paths-ignore` work. The owner clicks Deploy in Dokploy; Auto Deploy stays off; a push to `main` runs `ci` only (documentation pushes run it too, which is cheap); the smoke test is run by hand (D-04). The pipeline artifacts that plan 05-01 had already committed (`.github/workflows/deploy.yml`, `scripts/dokploy-deploy.mjs` and `scripts/dokploy-deploy.test.mjs`) are removed by plan 05-04, before `main` is pushed, because a `deploy.yml` on the default branch would start running after every `ci` run. `scripts/smoke-test.mjs` and its test stay. **Reversibility:** reversible, a pipeline can be added later.
- **D-16 (amended 2026-10-27, simplified):** The Cloudflare proxy is turned on for `dev.zeikcookson.com` after the first deploy from `main` has passed its smoke test with the record DNS only. The user sets SSL/TLS to Full (strict) first, sets Always Use HTTPS off, then proxies the record. Behind the proxy the phase checks: `cf-ray` is present, the public EmDash health route `/_emdash/api/health` answers with product emdash (this shows the Dokploy app is the one answering), the smoke test passes, parity and the public-JS allowlist still hold, a passkey signs in and the OAuth MCP connection works. Cloudflare's HTML-rewriting features stay at their defaults; the parity and allowlist run is the test, and if it fails the user switches off the feature named by the failing page (Email Address Obfuscation, Rocket Loader or Web Analytics injection). Let's Encrypt stays on HTTP-01 through the proxy (in Full (strict) Cloudflare forwards an HTTP request to the origin over HTTP, and Always Use HTTPS stays off so the edge never moves a challenge to port 443). Traefik renews 30 days before expiry, so the first renewal behind the proxy falls around 2026-12-26 and is NOT exercised in this phase; the fallback is to set the record DNS only, let Traefik renew, and turn the proxy back on. Passkeys are unaffected (the rpId follows `EMDASH_SITE_URL`). The origin stays directly reachable, so the proxy is not an access boundary: passkeys remain the admin gate (D-09), and `EMDASH_TRUSTED_PROXY_HEADERS` stays unset. **Reversibility:** reversible, one DNS toggle back to DNS only.
- **D-17:** Backups go to Cloudflare R2: a private bucket `portfolio-backups` used as Dokploy's S3 destination (endpoint `https://<account id>.r2.cloudflarestorage.com`, region `auto`) with an access key scoped to that bucket. Schedule and retention stay Claude's discretion within D-13 (nightly, Dokploy default retention). **Reversibility:** reversible, the destination is a Dokploy setting.

### Claude's Discretion

- Name of the temporary scratch app and volume for the restore rehearsal (D-14); no hostname is needed.
- Backup schedule and retention within D-13 and D-17 (the destination itself is locked to R2).
- Security headers and session store handling within D-11.

### Pending items not discussed

- Image architecture (gate d), `.emdash/migrations.json` commit versus build-in-CI (gate e) and `emdash doctor --database` flag (gate i) are closed in plan 05-05 with the evidence already recorded (C1, C5).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning

- `.planning/ROADMAP.md` Phase 5 goal and success criteria
- `.planning/REQUIREMENTS.md` DEPLOY-01 to DEPLOY-05, ADMIN-02, ADMIN-03, GUARD-02, GUARD-03
- `.planning/PROJECT.md` Spike Findings: recovery drill, passkey rpId note, Named gates (a) to (l), Constraints (Hosting, Node)
- `.planning/phases/01-spike-baseline-and-decisions/01-CONTEXT.md` D-01 to D-15 (Dokploy, SQLite volume, passkeys only, branch model)
- `.planning/phases/03-read-path-rewire-and-parity/03-CONTEXT.md` D-10 (`check:public-js`)

### EmDash deployment docs (the user's chosen guide for the deploy)

- https://docs.emdashcms.com/deployment/nodejs/ (Node standalone, Docker, volume, `EMDASH_SITE_URL` at build and run time, migrations on first request, verification list)
- https://docs.emdashcms.com/guides/backups/ (raw database copy with its -wal and -shm files, media directory, JSON backups cannot be restored)
- https://docs.emdashcms.com/deployment/updating/ and https://docs.emdashcms.com/deployment/core-migrations/ (recovery point before a migration, a code rollback does not undo a migration)
- https://docs.emdashcms.com/guides/authentication/ and https://docs.emdashcms.com/guides/change-domain/ (passkeys are bound to the hostname where they are created)

### Proxy, certificates and backups

- https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/ and its Full (strict) page (the origin connection protocol per mode, a Let's Encrypt certificate qualifies for Full strict)
- https://doc.traefik.io/traefik/reference/install-configuration/tls/certificate-resolvers/acme/ (HTTP-01 is reached through port 80, renewal starts 30 days before expiry)
- https://docs.dokploy.com/docs/core/volume-backups and https://docs.dokploy.com/docs/core/cloudflare-r2 (volume backups, Restore Volume into a new volume, the R2 destination fields)

### Code and tooling

- `Dockerfile` multi-stage Node 24 image, volume `/app/data`
- `.github/workflows/ci.yml` (GUARD-01, GUARD-02 and the manifest gate)
- `scripts/smoke-test.mjs` (the manual post-deploy check)
- `~/portfolio-baseline/current` baseline HTML and script inventory for parity

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `Dockerfile`: builds and serves 17 of 17 pages identical to baseline, with `data/` created and owned by `node`; it has built and runs on the Dokploy host.
- Parity compare tooling (`scripts/script-inventory.mjs`) and `npm run check:public-js` from Phases 1 and 3.
- `.github/workflows/ci.yml` verify job.
- `emdash migrate --check` works with no database flag; `emdash doctor` needs `--database ./data/emdash.db`.

### Established Patterns

- Never push or run dev servers without the user asking.
- No em dashes in docs or copy.

### Integration Points

- The dev record starts DNS only (grey cloud) and is switched to proxied after the first deploy from `main` (D-16); there is no rollback target.
- Phase 6 consumes the live admin for editing and updates the README, which must describe the manual deploy (merge to `main`, click Deploy, run the smoke test) and the rollback rule (D-05). `CLAUDE.md` already carries the manual deploy paragraph.

</code_context>

<specifics>
## Specific Ideas

"I just wanna run this on my server and use it. It doesn't need to be that deep. The site can come down for a while during the cutover."

"we aren't doing cloudflare pages anymore, we're just deploying it to dokploy using the emdash docs to guide it" (2026-10-27). dev.zeikcookson.com can be torn down, downtime is fine, "this doesn't need to be a clean cutover".

Fourth revision, 2026-10-27 (user, paraphrased): "I just want this done." Manual deploys: click Deploy in Dokploy. Drop the whole automated pipeline. One passkey is fine for now. Merge `emdash-migration` into `main` (the user pushes), point the Dokploy app at `main`, deploy once and smoke test. Cloudflare proxy on with SSL Full (strict) first and Always Use HTTPS off. R2 backup and a restore drill. Delete the dead pipeline code.

</specifics>

<deferred>
## Deferred Ideas

- Any automated deploy pipeline (tag-triggered or CI-gated, a Dokploy API call, secrets), dropped by the user on 2026-10-27; it can be designed again later if wanted.
- Offsite backup design, retention policy and monitoring beyond Dokploy defaults.
- Zero-downtime cutover, staged admin claim, visual screenshot parity.
- Astro 7 migration.
- A second passkey, and a rehearsal of the SQLite recovery procedure in the production container.
- Cloudflare Access in front of the admin, locking the origin to Cloudflare addresses, a Cloudflare header rule, and trusted-proxy client IP headers for EmDash rate limiting. Passkeys stay the only admin gate (D-09).

</deferred>

---

_Phase: 5-Dokploy Deploy and Cutover_
_Context gathered: 2026-10-26, last revised 2026-10-27_
