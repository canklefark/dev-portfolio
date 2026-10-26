# Phase 3: Read Path Rewire and Parity - Context

**Gathered:** 2026-10-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors get the same site they get today, now served from EmDash, with the markdown sources removed and no new JavaScript on any public page. Home, the projects index, every project page and About render from EmDash; nav and head metadata come from EmDash; a missing slug returns a real 404; `src/content/projects/`, `src/data/about.*` and the file collection are deleted in the same change that flips the read path; the admin loads at `/_emdash/admin` with none of its JS on public routes; a CI check fails on any public script drift.

This phase also absorbs a deliberate scope expansion decided in discussion: the home hero copy, About h1 and per-page SEO move into EmDash (see D-04 to D-07). That pulls part of v2 CONT-04 forward. Visual output must still match the baseline.

</domain>

<decisions>
## Implementation Decisions

### Tag order
- **D-01:** Use EmDash's default term order for tags on cards and detail pages. Source frontmatter order is not restored (12 of 13 cards differ). No extra carrier for per-entry order. — **Reversibility:** reversible — a carrier can be added later without touching the read path shape.
- **D-02:** The parity comparison treats each card's tags as a set: same tags in any order passes. Every other byte of copy and layout must match the baseline. The tag order change is recorded as an accepted deviation in the phase verification, not hidden.
- **D-03:** Read terms with the batched `getTermsForEntries` (or `getEntryTerms`) and map them back to a `string[]` of tag labels and the single category label, so component props stay identical (carried from Phase 2 deferred note).

### Head metadata and SEO
- **D-04:** Page `<title>`, meta description and OG tags come from EmDash's integrated SEO (the per-collection `hasSeo` flag and the per-entry SEO panel), not from `EmDashHead` unless the researcher proves it adds no tags or scripts beyond the baseline. Enable `hasSeo` on `projects` and `about`. Seeded SEO titles and descriptions equal today's strings so the head stays byte-identical: `"{project title} — Zeik Cookson"` with the project `summary` as description, About's current title and description. The em dash in existing titles is kept for parity (copy decision stays deferred). — **Reversibility:** costly — schema flag plus seeded values on every entry, and the layout head depends on it.
- **D-05:** Site-wide values (site name, default description, social links, favicon/OG defaults) keep coming from the General, Social and SEO settings seeded in Phase 2; the layout falls back to them when an entry has no SEO values.

### Template copy moves into EmDash
- **D-06:** Add a `home` singleton collection (hero name parts, stage indicator line, bio, SEO) and a `projects_index` singleton (page title and description via SEO, plus the empty-state text if the researcher finds it useful). Add an About h1 field to the existing `about` entry. All new collections support drafts and have `hasSeo`. The home hero bio and the About h1 are no longer hardcoded in `index.astro` and `about.astro`. — **Reversibility:** costly — new schema, seed content and templates all depend on it.
- **D-07:** Schema and content changes are made through the local admin and the EmDash MCP, then re-exported with EmDash's seed export into `.emdash/seed.json`. The committed seed must rebuild an identical schema and content in a fresh local database, and generated types in `.emdash/types.ts` are regenerated and committed. A one-off helper script is allowed but is not kept.

### Import tooling
- **D-08:** Delete `scripts/import-content.mjs`, `scripts/verify-import.mjs`, `scripts/lib/sources.mjs`, their tests and `scripts/fixtures/` in the same change that removes the markdown. `.emdash/seed.json` becomes the only rebuild path. Git history keeps the tooling. This closes the Phase 2 follow-ups ME-01, ME-02, ME-05, ME-06, LO-01 to LO-05, IN-02, IN-04 and IN-05 as obsolete; check whether `scripts/lib/schema.mjs` and `scripts/lib/entry.mjs` have any remaining consumer before deleting them. — **Reversibility:** reversible — recoverable from git history.
- **D-09:** Phase 2 follow-ups still live after this phase: IN-01 (a shared `formatProjectDate` pinned to `timeZone: "UTC"`) and IN-03 (commit only one of `.emdash/types.ts` and `emdash-env.d.ts`, or have one import the other) are Phase 3 work.

### Public-JS guard (GUARD-01)
- **D-10:** Add `npm run check:public-js` that builds, starts the Node server, runs the existing `scripts/script-inventory.mjs` against every public route and compares to `scripts/script-allowlist.json`, failing on any added script, `modulepreload` or module tag. Add a GitHub Actions workflow (`.github/workflows/`, none exists yet) that runs it on pushes and pull requests, laid out so Phase 5 can append `emdash migrate --check` and the smoke test to it.
- **D-11:** Coverage is all 17 routes (home, projects index, 13 projects, About, 404) plus a draft or unknown slug that must return 404. The deliberate failing case is a committed self-test: a fixture HTML with an injected `<script>` and a `modulepreload` link, asserting the checker exits non-zero. No temporary failing commit is required.

### Claude's Discretion
- Rendering mode: switching `output: "static"` to server rendering (the config comment says Phase 3 does this) and any caching headers.
- How `PortableText` from `emdash/ui` is wired into `.prose` so heading, bold, inline code and link styling match the baseline, including long-form bodies.
- Mechanism for real 404 status on a missing or draft slug while reusing the existing 404 page.
- Exact parity comparison method against `~/portfolio-baseline/` (normalized HTML diff plus light and dark visual check), within D-02.
- Whether the `emdashLoader` live collection in `src/live.config.ts` is still needed once pages call `getEmDashCollection` directly.
- Field names and exact shape of the `home` and `projects_index` collections, within the non-reserved-slug rule.
- Handling of the Cloudflare Pages build on `main` while the work stays on branch `emdash-migration` (the flip must not reach `main` before Phase 5 unless the build still passes).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/ROADMAP.md` — Phase 3 goal and success criteria
- `.planning/REQUIREMENTS.md` — REND-01 to REND-05, ADMIN-01, GUARD-01
- `.planning/PROJECT.md` — Spike Findings (confirmed API names, public JS rule, named gates)
- `.planning/STATE.md` — blockers and workflow rules (ask before running astro dev/preview; no git push)
- `.planning/phases/02-content-model-and-import/02-CONTEXT.md` — schema decisions D-01 to D-14 this phase reads from
- `.planning/phases/02-content-model-and-import/02-FOLLOWUPS.md` — follow-ups IN-01, IN-03 and the obsolete tooling items
- `.planning/phases/01-spike-baseline-and-decisions/01-CONTEXT.md` — hosting, branch, Node decisions

### Research
- `.planning/research/ARCHITECTURE.md` — data adapter seam (`src/lib/projects.ts`)
- `.planning/research/PITFALLS.md` — read-path and parity pitfalls
- `.planning/research/STACK.md` — versions and peers

### Code being rewired
- `src/lib/projects.ts` — current read adapter (newest first, drafts excluded)
- `src/content.config.ts` and `src/live.config.ts` — file collection to delete, live collection to review
- `src/pages/index.astro`, `src/pages/about.astro`, `src/pages/projects/index.astro`, `src/pages/projects/[...slug].astro`, `src/pages/404.astro` — page consumers
- `src/layouts/Layout.astro` — hardcoded head tags
- `src/components/Nav.astro` — nav links, to read from the EmDash primary menu
- `src/components/StageCard.astro`, `src/components/Chip.astro` — card props that must not change
- `src/data/about.ts`, `src/data/about.md` — About data to delete after the flip
- `.emdash/seed.json`, `.emdash/schema.json`, `.emdash/types.ts` — committed schema, content and generated types
- `astro.config.mjs` — `output: "static"` and the emdash integration

### Parity and guard tooling
- `scripts/script-inventory.mjs` and `scripts/script-allowlist.json` — Phase 1 public-script tooling reused by GUARD-01
- `~/portfolio-baseline/` — captured baseline HTML and script inventory (outside the repo)

### Project standards
- `CLAUDE.md`, `DESIGN.md`, `PRODUCT.md` — no visual changes, no client JS beyond the allowlist, no em dashes in new copy, no `any`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/script-inventory.mjs` and the committed allowlist: the engine for the CI guard.
- `.emdash/seed.json` and `.emdash/types.ts`: Phase 2 outputs the read path maps from.
- `getEmDashCollection`, `getEmDashEntry`, `getSiteSettings`, `getMenu`, `getTermsForEntries` from `emdash`; `PortableText` and `EmDashHead` from `emdash/ui`.

### Established Patterns
- Pages call `getSortedProjects()` and pass `entry` objects (`entry.id`, `entry.data.*`) to `StageCard`; component props must stay identical, so `src/lib/projects.ts` is the adapter that maps EmDash entries to today's shape.
- The project page uses `getStaticPaths`; with server rendering it becomes a per-request lookup that must 404 for unknown or draft slugs.
- EmDash returns errors rather than throwing, and defaults to `created_at` descending, so the list must pass `orderBy: { date: "desc" }`.
- Layout head is fully hardcoded today; the three inline scripts and the theme toggle are the allowlisted baseline.

### Integration Points
- Home reads `showAvailability` from About data; it moves to the About entry's `show_availability`.
- `Nav.astro` links move to the EmDash primary menu (Home, Projects, About).
- The new `hasSeo` panel feeds `Layout.astro` title, description and OG props.

</code_context>

<specifics>
## Specific Ideas

No specific references beyond the decisions above. The user wants EmDash features used as intended (SEO panel, taxonomies, settings, menus) rather than one-to-one ports of frontmatter.

</specifics>

<deferred>
## Deferred Ideas

- Page title separator copy (em dash in existing titles): parity keeps it; any copy change is a separate decision.
- Tag archive routes (v2 CONT-02): not this phase.
- Restoring per-entry tag order: rejected for now; revisit only if the order change is disliked on the live site.
- Remaining v2 CONT-04 scope beyond the home hero and About h1 (any other editable singletons): not this phase.

</deferred>

---

*Phase: 3-Read Path Rewire and Parity*
*Context gathered: 2026-10-26*
