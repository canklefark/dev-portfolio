# Milestones

## v1.0 EmDash Migration (Shipped: 2026-10-28)

**Phases completed:** 6 phases, 27 plans, 46 tasks

**Key accomplishments:**
- 17-page baseline of main captured outside the repo, work moved onto local branch emdash-migration, and a mutation-tested script inventory with a derived CI allowlist (5 inline CSP hashes, 17 routes)
- EmDash 1.3.1 on the Astro 6.4.8 Node standalone adapter with SQLite and local media, building the 17 existing pages identically to the baseline and booting to needsSetup true with no extras
- Multi-stage Node 24 image serving 17/17 baseline-identical pages on a volume-backed EmDash SQLite file, with engines >=22.22.2 enforced through engine-strict in npm and in the image, proven by a Node 22.22.2 image that passes and Node 20 that is refused
- Virtual-authenticator proof on the emdash-migration build that two passkeys sign in independently, local media uploads and serves with Range and a sandbox CSP, and the no-email SQLite recovery reopens and reclaims the admin, all with the repo untouched and every spike artifact removed
- PROJECT.md now carries the Phase 1 spike answers, API names, recovery procedure, research tensions and twelve named gates, each backed by an existing evidence file, and a clean reinstall reproduces the baseline at 17/17 identical with main untouched and no spike state left
- Projects path proven end to end: 13 markdown files become Portable Text seed entries applied by the emdash seed CLI, and a read-only verifier reports 183/183 field checks matching with the body round trip byte-exact.
- About, the primary nav menu and the Q2 settings now travel from the real sources through emdash seed into SQLite and verify at 229/229 checks with 0 differences, and a 17-test suite proves the edge cases and the verifier's failing direction.
- The schema is locked after the user's admin edit test on a seeded longest-body draft, with date reworked into a native datetime at midnight UTC and category and tags moved to EmDash taxonomies, and the types generated from the running server are committed.
- The repo database was rebuilt from the markdown and imported twice to 13 projects and 1 About with 0 differences across 232 checks, and the seed exported from it rebuilds the same schema and content in a fresh database with 0 differences.
- Project pages and lists now render from EmDash on a Node server build with a real 404 for a missing slug, proven by a seeded temp-server guard that passes all 17 allowlist routes, with the project markdown, file collection and import tooling deleted in the same commit.
- Project bodies now render with the baseline's heading ids, curly punctuation and anchor spacing through a small `prepareBody` step plus two style-free Portable Text components, and og:url is built from the configured site instead of the request host, with the guard still at 17 of 17.
- Added home and projects_index singletons, four About heading and excerpt fields, SEO support on every collection and the ' — ' title separator through EmDash's own API, re-exported them into the committed seed, and proved the seed rebuilds identically from a fresh database.
- The nav now comes from the EmDash primary menu through sanitizeHref, the fallback description and title suffix from EmDash settings, and every route's title and description from getSeoMeta through one pageMeta helper, with output byte-identical to the baseline (parity 17/17, guard 17/17).
- A CI-gated GitHub Actions deploy that triggers Dokploy application.deploy through a tested Node script, waits for a newer deployment to reach done, then smoke-checks /, /projects/ and the first project page, with no rollback and the API key never printed.
- CI now seeds a throwaway SQLite database and runs `emdash migrate --check`, then fails on any change to the committed `.emdash/migrations.json` after the build, while the Dockerfile takes `EMDASH_SITE_URL` as a build argument and the planning records say migrate-on-boot with the Sample content wizard option.
- Production on the Dokploy host, record DNS only, serves 17 of 17 public pages identical to the baseline and passing the public-JS allowlist with no cf-ray header, survives malformed Host headers, and the evidence file now holds rows C1 to C7 in line with the user's decisions of 2026-10-27.
- Unused deploy pipeline code removed, main pushed with green ci and a single workflow, production proxied by Cloudflare with the Dokploy app answering, and the manual deploy and rollback rule written; two owner-accepted deviations are on record.
- A whole-volume Dokploy backup of the production SQLite and uploads went to a private R2 bucket, restored into a new volume, booted a scratch app with identical `emdash doctor` output and three matching page hashes, and was discarded without disturbing production.

---
