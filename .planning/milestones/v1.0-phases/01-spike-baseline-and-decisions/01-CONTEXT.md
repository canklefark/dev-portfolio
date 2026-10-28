# Phase 1: Spike, Baseline and Decisions - Context

**Gathered:** 2026-10-23
**Status:** Ready for planning (roadmap amendment needed first, see D-01)

<domain>
## Phase Boundary

Pin dependencies, capture the current site as a baseline before anything changes, and answer the open platform questions with evidence. This phase changes no content and no visible behavior. The hosting target changed during discussion from Cloudflare Workers + D1 to self-hosted Node + SQLite on Dokploy, which reshapes the spike (see D-01 to D-04).

</domain>

<decisions>
## Implementation Decisions

### Hosting direction (changed in discussion)
- **D-01:** Host on Dokploy with Node, not Cloudflare Workers. This supersedes the "Hosting: Cloudflare (Workers + D1)" constraint in PROJECT.md and the Workers-specific parts of the roadmap. Requirements DEPLOY-01 to DEPLOY-05 and Phase 5, FOUND-03 (Workers plan, `LOADER` binding), the CF adapter and D1/R2 mentions need amending. Do that as a separate roadmap/requirements edit after this discussion. — **Reversibility:** costly — adapter, storage and deploy pipeline all depend on it.
- **D-02:** Database is SQLite on a persistent Dokploy volume. Back-up and restore strategy to be defined in the deploy phase. — **Reversibility:** costly — moving to Postgres later needs a data migration.
- **D-03:** Adapter is `@astrojs/node` in standalone mode, replacing `@astrojs/cloudflare`. React stays (the EmDash admin needs it). The spike confirms any EmDash-specific constraint.
- **D-04:** Cloudflare may remain as DNS/proxy for `dev.zeikcookson.com`, but no Workers, D1 or R2 are used. Media storage on Node (local volume vs S3) is for the spike to recommend.

### Spike scope
- **D-05:** The spike is local: EmDash boots on Node + SQLite, `astro build` passes, and a Docker image builds. The trial deploy to Dokploy happens in Phase 5, not Phase 1.
- **D-06:** For Phase 1 only, `astro preview` and curl against it are allowed without asking each time. `astro dev` and `npm run dev` stay off limits unless the user asks.
- **D-07:** Spike questions to answer: does core EmDash run on Node + SQLite without extras; can two passkeys be enrolled and what is the recovery path; do the confirmed API names match research (`getEmDashCollection`, `getEmDashEntry`, `PortableText`, `getSiteSettings`); Node 24 compatibility; media storage option on Node.

### Admin gate
- **D-08:** EmDash's built-in auth (passkeys) is the only admin gate. No Cloudflare Access, no proxy auth. Two passkeys on the production hostname with a tested recovery path (Phase 5). Email recovery is not available.

### Rendering fallback
- **D-09:** Public pages are SSR from SQLite. If slow, try HTTP caching headers first. Prerender with rebuild-on-publish is the last resort.

### Baseline capture
- **D-10:** Baseline lives in `~/portfolio-baseline/` (outside the repo, dated): a fresh build of current `main` HTML for home, projects index, all 13 project pages, About and 404, plus a per-route script inventory. No screenshots in Phase 1.
- **D-11:** Commit a derived JSON allowlist for CI (GUARD-01): per-route script and modulepreload counts plus inline-script hashes. The baseline HTML itself is not committed.
- **D-12:** Capture the baseline before any dependency changes.

### Branch, pins, Node
- **D-13:** All migration work lives on a long-lived local branch `emdash-migration`. `main` stays deployable (it auto-deploys to Cloudflare Pages today). Nothing is pushed without the user's go-ahead.
- **D-14:** Dependencies use caret ranges plus a committed lockfile.
- **D-15:** `engines.node` is `>=22.22.2` (raised from 22.16.0 during planning-execution: EmDash 1.3.1 dependency registry-verification needs ^22.22.2). `.nvmrc` and the Dockerfile base image use Node 24, matching local Node 24.17. If the spike finds Node 24 incompatible, fall back to 22 and record it.

### Claude's Discretion
- Media storage option on Node and the exact Dockerfile layout.
- Format of the decisions recorded in PROJECT.md.
- Whether the Cloudflare Pages project and CF adapter work from research are dropped or kept in notes.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — constraints and key decisions (Hosting constraint is superseded by D-01)
- `.planning/REQUIREMENTS.md` — FOUND-01 to FOUND-04 in scope; DEPLOY-* need amending
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria
- `.planning/STATE.md` — blockers (main auto-deploys, no CI, baseline vs CI allowlist)

### Research (written for Cloudflare; Workers-specific parts are superseded)
- `.planning/research/SUMMARY.md` — cross-file tensions and phase order
- `.planning/research/STACK.md` — versions, peers
- `.planning/research/PITFALLS.md` — admin claim, public JS regression, migration drift
- `.planning/research/ARCHITECTURE.md` — data adapter seam (`src/lib/projects.ts`)

### Project standards
- `CLAUDE.md` — engineering standards (to be amended: Workers deploy now Dokploy)
- `DESIGN.md`, `PRODUCT.md` — fixed, no visual changes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dist/`: existing build output usable as a reference, but capture a fresh build for the baseline.
- `astro.config.mjs`: minimal (`site` only), so adapter and integrations are additive.

### Established Patterns
- `package.json` has `astro ^6.2.2`, `@astrojs/check`, `typescript ^6`; `engines.node >=22.12.0`; no `.nvmrc`; no CI (`.github/` absent); no Dockerfile or wrangler config.
- Content comes from a glob collection over `src/content/projects/*.md` plus `src/data/about.*`.

### Integration Points
- `dist/index.html` has inline theme/console scripts and one module script from `Nav.astro`, so the baseline for "no new JS" is not zero.

</code_context>

<specifics>
## Specific Ideas

- Personal project, so favor simple self-hosting over enterprise layers.

</specifics>

<deferred>
## Deferred Ideas

- Cloudflare Access in front of the admin (v2 ACCESS-01) is now moot unless the proxy stays on Cloudflare.
- Page titles with em dash separators remain a separate copy decision.

</deferred>

---

*Phase: 1-Spike, Baseline and Decisions*
*Context gathered: 2026-10-23*
