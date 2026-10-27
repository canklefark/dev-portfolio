# Phase 5: Dokploy Deploy and Cutover - Context

**Gathered:** 2026-10-26
**Status:** Ready for planning

<domain>
## Phase Boundary

dev.zeikcookson.com is served by a Dokploy Node container with SQLite and uploads on one persistent volume. The admin is claimed on the real hostname with two passkeys. CI fails on pending migrations (EmDash applies pending migrations itself on the first request after a deploy), production deploys when a `v*` tag is pushed after CI succeeded for the tagged commit and Dokploy builds that tag, and a post-deploy smoke test checks `/` and one project page.

Guiding principle from the user: keep it simple. This is a personal site run on their own server. Downtime during cutover is acceptable. Do not build zero-downtime, staged-claim or multi-environment machinery.

Amended 2026-10-27 (user): Cloudflare Pages is dropped entirely. The site is deployed straight to one Dokploy production app, guided by the EmDash Node and Docker deployment docs. The old site on dev.zeikcookson.com is torn down and no rollback target is kept.

Amended again 2026-10-27 (user, second revision): production deploys move to tag pushes (D-15), the Cloudflare proxy is turned on for dev.zeikcookson.com once the Let's Encrypt certificate exists and the first deploy has passed (D-16, which replaces the earlier "Cloudflare stays DNS only"), and backups go to Cloudflare R2 (D-17).

Amended a third time 2026-10-27 (user, third revision): Dokploy builds the tag, not the tip of `main` (D-15). The deploy step sets the Dokploy application's source ref to the pushed tag before it requests the deploy, so the tag names exactly the code that goes live, and a bad deploy is recovered by redeploying an earlier tag.

</domain>

<decisions>
## Implementation Decisions

### Build and deploy

- **D-01:** Dokploy builds from git using the repo Dockerfile on the host. No GitHub Actions image build, no registry. Build arch is the Dokploy host's, so the planner confirms the host arch and that the Dockerfile builds there (the Phase 1 spike image was arm64). — **Reversibility:** reversible, switching to a registry flow later is a config change.
- **D-02 (amended 2026-10-26, user wants it simple):** No separate pre-deploy migration step. EmDash creates the SQLite file and applies its pending core migrations itself on the first request after the container starts (default `auto` mode, EmDash Node deployment guide), so a plain container deploy is enough. First-time setup is: start the container, choose Import in the setup wizard using the committed `.emdash/seed.json` (Phase 2 D-13), then enroll passkeys. The seed is for first setup only; after go-live content lives in the production database and the seed is never re-applied. Researcher confirms the wizard Import path loads schema, content, nav and settings from the seed, and reports anything it leaves out. Accepted tradeoff: a future EmDash upgrade with a schema change migrates on the first request after the deploy, so take a backup before upgrading.
  - **Amended again 2026-10-26 during planning (user):** the setup wizard option is "Sample content", which applies the committed .emdash/seed.json with its content; "Import an existing EmDash site" is the .emdash site-transfer upload and applies no content (05-RESEARCH Pitfall 1).
  - **Wording corrected 2026-10-27:** migrations run on the first request after a start, not at process boot; the EmDash docs say "the first request applies pending core migrations".
- **D-03:** CI keeps this cheap check: `emdash migrate --check` (GUARD-02), appended to the existing job in `.github/workflows/ci.yml`.
  - **Extended 2026-10-26 during planning (user):** .emdash/migrations.json is committed and CI runs git diff --exit-code on it after the build (gate e), next to the seeded-database migrate --check.
- **D-04 (amended 2026-10-27, see D-15):** The post-deploy smoke test (GUARD-03) runs in GitHub Actions after deploy, checks `/` and one project page return 200, and alerts only (goes red). No auto-rollback and no Dokploy healthcheck requirement. The workflow knows the deploy finished through a poll loop in `scripts/dokploy-deploy.mjs`. The deploy itself now starts from a tag push behind a CI gate and builds that tag (D-15), not from a completed `ci` run.

### Branches and cutover

- **D-05 (amended 2026-10-27, user: Cloudflare Pages is dropped entirely; amended again the same day for tag deploys and a third time so that Dokploy builds the tag):** There is one Dokploy app, production, deployed straight to `dev.zeikcookson.com`. There is no preview app, no branch-control setting anywhere else and no rollback target. The first deploy builds the pushed `emdash-migration` branch, so `main` receives the tag-triggered `deploy.yml` only after the site is claimed and seeded; the merge push runs `ci` only, and the first `v*` tag push is the first run of the CI-gated pipeline (D-15), which sets the app's source ref from `emdash-migration` to the tag, so the app is never switched to `main`. A bad deploy is recovered by redeploying an earlier tag (D-15), then fixing forward by reverting the commit on `main` and tagging the revert, and by restoring a volume backup when a migration ran. Merging, pushing and tagging still need the user's explicit go-ahead.
- **D-06 (amended 2026-10-27, user):** No preview app. The existing Phase 1/3 parity compare against `~/portfolio-baseline/current` and the public-JS allowlist check run against the production hostname right after the first deploy (record DNS only), again after the first tag deploy (record DNS only), and a third time behind the Cloudflare proxy (D-16). Record the result in a phase evidence file. No screenshots. The only second instance is a temporary scratch app for the restore rehearsal (D-14).
- **D-07 (amended 2026-10-27, user: this does not need to be a clean cutover):** Downtime is fine. Tear down the old site on `dev.zeikcookson.com` (including its custom-domain entry on the old hosting project), point it at the Dokploy host with a DNS-only A record, and as soon as it serves, complete the setup wizard and enroll two passkeys on that hostname in the same sitting (rpId follows `EMDASH_SITE_URL`, so the real hostname is required). No hosts-file override, no DNS-01 pre-claim, no IP allowlist. No rollback target is kept. The record stays DNS only until D-16 turns the proxy on. **Reversibility:** one-way for the old site, which is torn down, and passkeys enrolled on the hostname stay bound to it; the Dokploy app itself is reversible.
- **D-08:** `EMDASH_SITE_URL=https://dev.zeikcookson.com` is set at build and run time (Phase 1 gate h).

### Admin, recovery and exposure

- **D-09:** Admin gate is EmDash passkeys only (Phase 1 D-08). Two passkeys on real devices, with the SQLite recovery procedure from `PROJECT.md` Spike Findings rehearsed once. The GitHub-login alternative (gate b) is not adopted.
- **D-10 (amended 2026-10-27):** Astro 6 residual advisories (gate a): stay on Astro 6 and accept the risk, no Astro 7 migration in this phase. Phase 5 only verifies that the ingress (Traefik, reached directly at the origin while the record is DNS only) answers a malformed Host header without taking the site down (curl check, recorded). The origin stays reachable at its own address after the proxy is on (D-16), so that check keeps its meaning. Record the acceptance in `PROJECT.md`.
- **D-11 (amended 2026-10-27):** Security headers (gate g) and the session store location (gate f): Claude's discretion, kept minimal. The origin sends no security headers; with the Cloudflare proxy on (D-16) the two headers the old site sent (`x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`) are restored by one Cloudflare Transform Rule (Modify Response Header), which is cheap and reversible. No CSP. Do not move the session store unless a redeploy logging the user out proves annoying.
- **D-12:** The agent token (Phase 4 D-08) is recreated after the production database exists, and `EMDASH_MCP_URL` is pointed at the production endpoint. One live content-list call proves it. It runs after the proxy is on, so it also shows the MCP endpoint working through Cloudflare.

### Backup and restore

- **D-13 (amended 2026-10-27):** Use Dokploy's built-in scheduled volume backup for the whole `/app/data` volume (SQLite plus uploads are one backup unit), to the S3 destination chosen in D-17. Cadence: Claude's discretion (nightly, container stopped during the copy). No custom retention design.
- **D-14:** DEPLOY-05 rehearsal: restore one backup into a scratch container, confirm it boots and its project and About content matches production, then discard it.

### Pipeline, proxy and backup destination (user, 2026-10-27, second revision)

- **D-15 (amended 2026-10-27, third revision, user: Dokploy must build the tag, not the tip of `main`):** Production deploys on a version tag, not on every push. A push to `main` runs `ci` only. `deploy.yml` runs when a tag matching `v*` is pushed, and on a manual run whose ref is a `v*` tag (`gh workflow run deploy.yml --ref <tag>`, which is also how an earlier tag is redeployed; a manual run on a branch never deploys, because a deploy without a tag would not name what goes live). Before it triggers Dokploy, a gate script verifies that (a) the ref is a `v*` tag, (b) the tagged commit is on `main` (equal to its tip or an ancestor of it; `main` being ahead of the tag is normal and is only printed as information) and (c) the latest `ci` run for that exact commit, from this repository and started by a push or a manual dispatch, concluded success, and its output states that Dokploy is expected to build that tag at that commit. Only then does the deploy script set the Dokploy application's source ref to the tag through the Dokploy API (`application.update` with `customGitBranch` for the Git provider or `branch` for the GitHub provider, whichever plan 05-03 records from the real panel, with the bare tag name or the `refs/tags/` form as observed there), request `application.deploy` (which takes only the application id) and wait for done; if the ref update fails nothing is deployed, and nothing resets the ref after a failed deploy (no rollback, D-04). The smoke test (D-04) follows. The commit Dokploy builds is therefore the tag's commit, so the tag names exactly the code that goes live; when the `deployment.all` items expose the built commit the script compares it with the tagged commit after the deploy, and plan 05-03 records whether they do. A bad deploy is recovered by redeploying an earlier tag. `ci.yml` gets `paths-ignore` on pushes (`.planning/`, `docs/`, Markdown files, and the editor and agent configuration directories), so documentation pushes run neither `ci` nor `deploy`; `ci` also gets `workflow_dispatch` and no tag push starts it; pull requests keep an unfiltered `ci`. A tag on a commit whose `ci` was skipped, is still running or failed is refused by the gate with a message that names the way forward: `gh workflow run ci.yml --ref <tag>`, wait for green, then `gh run rerun` the refused deploy run. No branch protection or required check exists today; if one is added later, `paths-ignore` leaves a required check pending on skipped pushes, which is why pull requests are unfiltered. **Fallback (documented text, applies only if plan 05-03's probe with a throwaway tag shows that the panel cannot build a tag, and only after the user confirms it; the executor flags it and waits for the reply `accept tip fallback`):** the earlier form of this decision. Production deploys when a `v*` tag is pushed (and on a manual dispatch on `main`); the gate verifies that (a) the tagged commit is on `main` (equal to its tip or an ancestor of it) and (b) the latest `ci` run for that exact commit, from this repository and started by a push or a manual dispatch, concluded success, then the existing trigger-and-wait script runs with no ref update and the smoke test follows (D-04). Dokploy's `application.deploy` takes only the application id and builds the tip of the configured branch, so the tag should be the tip of `main`; the gate prints a note when `main` is ahead of the tag. The application's source branch is `main`, and a bad deploy is recovered by reverting the commit on `main` and tagging the revert. **Reversibility:** reversible, a workflow and script change.
- **D-16:** The Cloudflare proxy is turned on for `dev.zeikcookson.com` after the Let's Encrypt certificate is issued and the first deploy has passed. Everything up to and including the first tag deploy is measured with the record DNS only, so each check reads the Dokploy host directly. Then the user sets SSL/TLS to Full (strict) first, turns the proxy on, and the phase re-proves the site behind it. Consequences, all recorded in the evidence file: (1) the old-site discriminator (no `cf-ray` header) is valid only while DNS only; behind the proxy the proof that the Dokploy app answers is the public EmDash health route `/_emdash/api/health`, which the old static site cannot serve (the user requests it, because the committed guard denies the executor `curl` to `_emdash` URLs), together with `cf-ray` now present and the deploy workflow's smoke test passing through the proxy; the hostname must also be removed from the old hosting project's custom domains, or Cloudflare would keep serving the old site. (2) Let's Encrypt stays on HTTP-01 through the proxy, with no DNS-01 and no Origin CA certificate: in Full (strict) Cloudflare forwards an HTTP request to the origin over HTTP (Cloudflare SSL modes documentation: Full "matches the visitor request protocol"), so Traefik's port 80 challenge handler answers; Always Use HTTPS stays off for the zone so the edge never moves the challenge to port 443, and no WAF rule or bot challenge may sit on `/.well-known/acme-challenge/`. Traefik renews 30 days before expiry, so the first proxied renewal falls about 60 days after issuance and is verified after the phase; the fallback is to set the record DNS only, let Traefik renew, and turn the proxy back on. (3) Cloudflare's HTML-rewriting features (Rocket Loader, Email Address Obfuscation, Web Analytics injection) stay off, and the parity and public-JS checks are re-run behind the proxy to prove it. (4) Passkeys are unaffected: the rpId follows the hostname of `EMDASH_SITE_URL`, which the proxy does not change. (5) The origin stays directly reachable, so the proxy is not an access boundary: passkeys remain the admin gate (D-09), and `EMDASH_TRUSTED_PROXY_HEADERS` stays unset. (6) Cloudflare bot protection may challenge the GitHub runner's smoke request; the post-flip pipeline run shows it and Bot Fight Mode is the first thing to switch off if so. **Reversibility:** reversible, one DNS toggle back to DNS only.
- **D-17:** Backups go to Cloudflare R2: a private bucket `portfolio-backups` used as Dokploy's S3 destination (endpoint `https://<account id>.r2.cloudflarestorage.com`, region `auto`) with an access key scoped to that bucket. Schedule and retention stay Claude's discretion within D-13 (nightly, Dokploy default retention). **Reversibility:** reversible, the destination is a Dokploy setting.

### Claude's Discretion

- Hostname for the temporary scratch instance used in the restore rehearsal (D-14). It stays DNS only, since it is temporary.
- Backup schedule and retention within D-13 and D-17 (the destination itself is locked to R2).
- Security headers and session store handling within D-11.
- Which Cloudflare dashboard settings are needed to keep the proxy transparent (the list in D-16 is the researched set; the parity and public-JS checks decide whether more is needed).

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

### Proxy, certificates and workflow triggers (2026-10-27 revision)

- https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/ and its Full (strict) page (the origin connection protocol per mode, a Let's Encrypt certificate qualifies for Full strict)
- https://doc.traefik.io/traefik/reference/install-configuration/tls/certificate-resolvers/acme/ (HTTP-01 is reached through port 80, renewal starts 30 days before expiry)
- GitHub Actions workflow syntax for `on.push.tags`, `branches` and `paths-ignore` (a branches filter excludes tag pushes; a skipped workflow leaves a required check pending), and the REST calls the gate uses: compare two commits and list workflow runs filtered by `head_sha`
- https://docs.dokploy.com/docs/api/reference-application and the panel's own `/swagger` (`application.update`, `application.saveGitProvider` and `application.saveGithubProvider`: the branch fields `customGitBranch` and `branch`, `triggerType` which concerns webhook deploys only, and `application.deploy`, which takes the application id and no ref)

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

- The dev record starts DNS only (grey cloud) and is switched to proxied after the first tag deploy (D-16); there is no rollback target.
- Phase 6 consumes the live admin for editing and updates CLAUDE.md and README, which must describe tag deploys (D-15): a pushed `v*` tag is what Dokploy builds, and an earlier tag is how a bad deploy is undone.

</code_context>

<specifics>
## Specific Ideas

"I just wanna run this on my server and use it. It doesn't need to be that deep. The site can come down for a while during the cutover."

"we aren't doing cloudflare pages anymore, we're just deploying it to dokploy using the emdash docs to guide it" (2026-10-27). dev.zeikcookson.com can be torn down, downtime is fine, "this doesn't need to be a clean cutover".

Second revision, 2026-10-27 (user, paraphrased): backups go to Cloudflare R2; turn the Cloudflare proxy on after the certificate is issued, as an explicit step after the first successful deploy, with SSL/TLS Full (strict); documentation pushes must not trigger CI, a push to main runs CI only and production deploys on a pushed `v*` tag after the deploy workflow verifies CI succeeded for the tagged commit and that the commit is on main.

Third revision, 2026-10-27 (user, paraphrased): Dokploy must build the tag, not the tip of main. The deploy step sets the Dokploy application's source ref to the pushed tag (through the Dokploy API) and then deploys, so the tag names exactly the code that goes live, and recovery from a bad deploy becomes redeploying an earlier tag.

</specifics>

<deferred>
## Deferred Ideas

- Offsite backup design, retention policy and monitoring beyond Dokploy defaults.
- Zero-downtime cutover, staged admin claim, visual screenshot parity.
- Astro 7 migration.
- Offsite backup monitoring beyond what Dokploy shows (the design itself is already deferred above).
- Cloudflare Access in front of the admin, locking the origin to Cloudflare addresses, and trusted-proxy client IP headers for EmDash rate limiting. The proxy is on (D-16), so these become possible, but passkeys stay the only admin gate (D-09). Noted by the planner, not requested by the user.

</deferred>

---

_Phase: 5-Dokploy Deploy and Cutover_
_Context gathered: 2026-10-26_
