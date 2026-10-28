# Phase 3: Read Path Rewire and Parity - Research

**Researched:** 2026-10-26
**Domain:** Astro 6 server rendering from EmDash 1.3.1 (content queries, taxonomies, SEO, menus, Portable Text), parity against a static baseline, public-JS CI guard
**Confidence:** HIGH on the read path, SEO behavior, 404 mechanism and prose parity (read from installed source and proven with a scratch SSR build of this repo, 17 routes rendered in-process and diffed against the baseline). MEDIUM on the CI workflow (designed and its engine exercised locally, but never run on GitHub Actions).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Tag order

- **D-01:** Use EmDash's default term order for tags on cards and detail pages. Source frontmatter order is not restored (12 of 13 cards differ). No extra carrier for per-entry order. — **Reversibility:** reversible — a carrier can be added later without touching the read path shape.
- **D-02:** The parity comparison treats each card's tags as a set: same tags in any order passes. Every other byte of copy and layout must match the baseline. The tag order change is recorded as an accepted deviation in the phase verification, not hidden.
- **D-03:** Read terms with the batched `getTermsForEntries` (or `getEntryTerms`) and map them back to a `string[]` of tag labels and the single category label, so component props stay identical (carried from Phase 2 deferred note).

#### Head metadata and SEO

- **D-04:** Page `<title>`, meta description and OG tags come from EmDash's integrated SEO (the per-collection `hasSeo` flag and the per-entry SEO panel), not from `EmDashHead` unless the researcher proves it adds no tags or scripts beyond the baseline. Enable `hasSeo` on `projects` and `about`. Seeded SEO titles and descriptions equal today's strings so the head stays byte-identical: `"{project title} — Zeik Cookson"` with the project `summary` as description, About's current title and description. The em dash in existing titles is kept for parity (copy decision stays deferred). — **Reversibility:** costly — schema flag plus seeded values on every entry, and the layout head depends on it.
- **D-05:** Site-wide values (site name, default description, social links, favicon/OG defaults) keep coming from the General, Social and SEO settings seeded in Phase 2; the layout falls back to them when an entry has no SEO values.

#### Template copy moves into EmDash

- **D-06:** Add a `home` singleton collection (hero name parts, stage indicator line, bio, SEO) and a `projects_index` singleton (page title and description via SEO, plus the empty-state text if the researcher finds it useful). Add an About h1 field to the existing `about` entry. All new collections support drafts and have `hasSeo`. The home hero bio and the About h1 are no longer hardcoded in `index.astro` and `about.astro`. — **Reversibility:** costly — new schema, seed content and templates all depend on it.
- **D-07:** Schema and content changes are made through the local admin and the EmDash MCP, then re-exported with EmDash's seed export into `.emdash/seed.json`. The committed seed must rebuild an identical schema and content in a fresh local database, and generated types in `.emdash/types.ts` are regenerated and committed. A one-off helper script is allowed but is not kept.

#### Import tooling

- **D-08:** Delete `scripts/import-content.mjs`, `scripts/verify-import.mjs`, `scripts/lib/sources.mjs`, their tests and `scripts/fixtures/` in the same change that removes the markdown. `.emdash/seed.json` becomes the only rebuild path. Git history keeps the tooling. This closes the Phase 2 follow-ups ME-01, ME-02, ME-05, ME-06, LO-01 to LO-05, IN-02, IN-04 and IN-05 as obsolete; check whether `scripts/lib/schema.mjs` and `scripts/lib/entry.mjs` have any remaining consumer before deleting them. — **Reversibility:** reversible — recoverable from git history.
- **D-09:** Phase 2 follow-ups still live after this phase: IN-01 (a shared `formatProjectDate` pinned to `timeZone: "UTC"`) and IN-03 (commit only one of `.emdash/types.ts` and `emdash-env.d.ts`, or have one import the other) are Phase 3 work.

#### Public-JS guard (GUARD-01)

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

### Deferred Ideas (OUT OF SCOPE)

- Page title separator copy (em dash in existing titles): parity keeps it; any copy change is a separate decision.
- Tag archive routes (v2 CONT-02): not this phase.
- Restoring per-entry tag order: rejected for now; revisit only if the order change is disliked on the live site.
- Remaining v2 CONT-04 scope beyond the home hero and About h1 (any other editable singletons): not this phase.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID                    | Description                                                                                                                          | Research Support                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REND-01               | Projects index and detail pages read from EmDash through `src/lib/projects.ts` and keep their current props and order (newest first) | Adapter pattern (Pattern 1); `orderBy: { date: "desc" }` reproduces baseline card order on all 13 cards (prototype); `entry.data.terms` is already hydrated so no extra term query is needed                     |
| REND-02               | A missing project returns a real 404 status                                                                                          | `return new Response(null, { status: 404 })` renders `404.astro` with status 404 (Astro handler read, prototype proved); lookup must also check `entry.id === slug` because ids resolve too                      |
| REND-03               | The About page, nav and head metadata read from EmDash                                                                               | `getEmDashEntry("about","about")`, `getMenu("primary")`, `getSiteSettings()`, `getSeoMeta()` (Patterns 2 to 4). Per-entry SEO rows cannot be seeded (Finding F1), so parity rests on code-computed fallbacks     |
| REND-04               | Rendered pages match the baseline in copy and layout in light and dark, including long-form body styling                             | Three prose deltas found and fixed in the prototype (heading ids, smart punctuation, link whitespace); 14 of 14 bodies identical after the fixes; canonicalization rules for the comparator (Pattern 6)          |
| REND-05               | Markdown sources, `src/data/about.*` and the file collection are removed in the same change that flips the read path                 | Deletion inventory and consumer check (Don't Hand-Roll, Runtime State Inventory); `src/live.config.ts` must stay                                                                                                 |
| ADMIN-01              | Admin runs under `/_emdash/admin` and loads no admin JS on public routes                                                             | Admin routes are injected with `prerender: false`; SSR build serves `/_emdash/admin` (302 to setup, then 200) and the allowlist check passes 17 of 17 on SSR output; `toolbar` option decision (Open Question 3) |
| GUARD-01              | CI fails if any public route gains a script, `modulepreload` or module tag beyond the recorded baseline                              | `check:public-js` design (Pattern 7): build, seed a temp cwd from the committed seed, spawn the server, fetch, reuse `script-inventory.mjs check`; fixture self-test; GitHub Actions workflow skeleton           |
| </phase_requirements> |

## Summary

The read path can be flipped with a small, well-bounded set of changes, and the result is provably close to the baseline. I built a scratch copy of this repo with `output: "server"`, rewired the project and About pages to `getEmDashEntry` / `getEmDashCollection`, rendered all 17 baseline routes in-process through the built Node handler, and ran the existing `script-inventory.mjs check` against the output: **17 of 17 pass the committed allowlist**, a missing slug returns a real 404 with the existing 404 page, the card order is identical to the baseline, and after three small prose fixes **14 of 14 rendered bodies (13 projects plus About) are identical to the baseline HTML** apart from invisible differences (scoped-style attributes, entity forms). Warm render cost is 0.5 to 3 ms per page in-process, so no caching headers are needed in Phase 3.

Three findings change the plan and need a decision before tasks are written. **F1 (blocks D-04 as written): `emdash seed` and `export-seed` cannot carry per-entry SEO panel values.** The seed entry type has no `seo` field and the shipped seed-apply code contains no SEO handling. Panel values live only in the database (`_emdash_seo`), so they cannot be "seeded" and would not survive the D-07 fresh-database rebuild. The parity-safe design is: enable `hasSeo` through `supports: [..., "seo"]` (which does round-trip), compute every title and description in code with EmDash's own `getSeoMeta()` from seedable fields, and treat the panel as an optional editor override. **F2: EmDash's `PortableText` renders three things differently from the old markdown pipeline** (no heading `id`s, no smart punctuation, extra whitespace inside links), which would change anchors, 58 apostrophes and quotes, and put visible spaces inside link parentheses on three pages. **F3: the planner's D-10 check must not touch the developer's `data/emdash.db`**; I proved the built app runs from a temp working directory that holds only a freshly seeded `data/`, which also turns the guard into a rebuild-from-seed smoke test.

**Primary recommendation:** Flip to `output: "server"` with no caching headers; read everything through `getEmDashEntry` (detail and singletons) and `getEmDashCollection` (lists) behind `src/lib/projects.ts`; compute head metadata with `getSeoMeta()` plus code fallbacks (not `EmDashHead`); render bodies through `emdash/ui` `PortableText` with a style-free block override, a no-whitespace link override and a `prepareBody()` step (smartypants plus heading ids); add the schema and content delta by patching the seed offline; and build `check:public-js` as a spawn-server script over a temp seeded cwd that reuses `script-inventory.mjs check`.

## Architectural Responsibility Map

| Capability                                       | Primary Tier                                                         | Secondary Tier                                                                               | Rationale                                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Project list, detail, About, home and index copy | Database / Storage (EmDash SQLite, read through the live collection) | Frontend Server (Astro SSR pages)                                                            | Content now lives in SQLite; pages are request-time renderers                                                             |
| Tag and category labels                          | Database / Storage (taxonomy terms)                                  | API / Backend (`entry.data.terms` hydration inside `getEmDashEntry` / `getEmDashCollection`) | Terms are hydrated by the query layer; the adapter only maps them to `string[]`                                           |
| Head metadata (title, description, OG)           | Frontend Server (`Layout.astro` head, hardcoded tags)                | Database / Storage (entry fields, optional SEO panel row, site settings)                     | Templates own the `<title>` element; EmDash only supplies values (`getSeoMeta`)                                           |
| Navigation links                                 | Database / Storage (`primary` menu)                                  | Frontend Server (`Nav.astro` renders)                                                        | Menu is editable content                                                                                                  |
| Rich body rendering and typography               | Frontend Server (`PortableText` plus overrides, `prepareBody`)       | —                                                                                            | Smart punctuation and heading ids are render-time concerns, so agent-written straight quotes still render typographically |
| 404 for missing or draft slug                    | Frontend Server (page returns a null-body 404)                       | API / Backend (query layer hides drafts from anonymous)                                      | Astro's handler swaps in `404.astro`                                                                                      |
| Admin UI                                         | Browser / Client (served under `/_emdash/admin` only)                | API / Backend (injected `/_emdash/api/*`)                                                    | Admin JS is exempt only on this route                                                                                     |
| Public-JS guard                                  | CI (GitHub Actions) running a Node script                            | Build output (`dist/`), temp SQLite                                                          | Enforcement point for the "no new JS" rule                                                                                |
| Schema and content rebuild                       | Build/CLI (`emdash seed`, `export-seed`)                             | Database / Storage                                                                           | `.emdash/seed.json` is the only rebuild path after D-08                                                                   |

## Standard Stack

### Core

| Library            | Version            | Purpose                                                                                                                                      | Why Standard                                                                                                                                       |
| ------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| emdash             | 1.3.1 (installed)  | CMS runtime: `getEmDashCollection`, `getEmDashEntry`, `getMenu`, `getSiteSettings`, `getSeoMeta`, `sanitizeHref`; `emdash/ui` `PortableText` | Already pinned. [VERIFIED: node_modules/emdash/package.json "version": "1.3.1"]                                                                    |
| astro              | 6.4.8 (installed)  | SSR, routing, 404 handling                                                                                                                   | Pinned in Phase 1. [VERIFIED: node_modules/astro/package.json]                                                                                     |
| @astrojs/node      | 10.1.4 (installed) | Standalone server; `ASTRO_NODE_AUTOSTART=disabled` lets a script import the handler without listening                                        | [VERIFIED: node_modules/@astrojs/node/dist/server.js:12 `process.env.ASTRO_NODE_AUTOSTART !== "disabled"`]                                         |
| retext             | 9.0.0              | Runs `retext-smartypants` on plain strings                                                                                                   | Same engine Astro's markdown pipeline uses, so output matches the baseline. [VERIFIED: npm ls; node_modules/remark-smartypants/package.json:45-46] |
| retext-smartypants | 6.2.0              | Smart quotes, ellipses, dashes                                                                                                               | Same defaults Astro applied to the markdown bodies (per-span run reproduced 14 of 14 baseline bodies, experiment)                                  |
| github-slugger     | 2.0.0              | Heading `id`s identical to the baseline                                                                                                      | Astro's own slugger. [VERIFIED: node_modules/astro/package.json:135 `"github-slugger": "^2.0.0"`]                                                  |

### Supporting

| Library                           | Version            | Purpose                                                     | When to Use                                                                                                                                                            |
| --------------------------------- | ------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| node:test, node:assert (built in) | Node 24.17.0 local | Unit tests for `prose.ts`, mapping, and the guard self-test | Existing convention. Name test files explicitly: `node --test scripts/x.test.mjs` (a directory argument is treated as a file on Node 24, per the existing test header) |
| sqlite3 CLI                       | 3.54.0 present     | Ad hoc DB inspection only                                   | Not required by any task                                                                                                                                               |

### Alternatives Considered

| Instead of                                  | Could Use                              | Tradeoff                                                                                                                                                                                                                                                         |
| ------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `retext` + `retext-smartypants` direct deps | Store curly punctuation in the content | Agent-authored text (Phase 4) uses straight quotes, so content would drift from the site's typography; render-time conversion keeps it consistent                                                                                                                |
| `retext` + `retext-smartypants`             | A 5-line regex                         | Gets today's corpus right but not `'90s`, nested quotes or ellipses; this is the deceptively complex problem the library solves                                                                                                                                  |
| `emdash/ui` `PortableText`                  | `astro-portabletext` directly          | Avoids a ~10 KB extra stylesheet (EmDash component CSS), but makes a transitive package a direct dependency and drops EmDash block types (images, code, tables) future content may use. Recommend keeping `emdash/ui`                                            |
| `getSeoMeta()` in the existing head         | `EmDashHead`                           | `EmDashHead` cannot emit `<title>`, only emits `og:url` when a canonical is supplied (which also adds `<link rel="canonical">`, absent from the baseline), orders tags its own way, and adds JSON-LD when `siteName` is set. Not byte-identical (see Finding F4) |

**Installation:**

```bash
npm install retext@^9.0.0 retext-smartypants@^6.2.0 github-slugger@^2.0.0
npm uninstall yaml   # only scripts/lib/sources.mjs imports it, and that file is deleted (D-08)
```

All three are already in the lockfile as transitive dependencies at exactly these versions, so the direct install should not churn the tree.

**Version verification:** `npm view` returned retext 9.0.0, retext-smartypants 6.2.0, github-slugger 2.0.0 (all equal to the installed versions) this session. [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package            | Registry | Age                                     | Downloads | Source Repo                            | Verdict | Disposition |
| ------------------ | -------- | --------------------------------------- | --------- | -------------------------------------- | ------- | ----------- |
| retext             | npm      | multi-year (9.0.0 published 2023-09-06) | ~3.2M/wk  | github.com/retextjs/retext             | OK      | Approved    |
| retext-smartypants | npm      | multi-year (6.2.0 published 2024-10-10) | ~5.4M/wk  | github.com/retextjs/retext-smartypants | OK      | Approved    |
| github-slugger     | npm      | multi-year (2.0.0 published 2022-10-27) | ~12.3M/wk | github.com/Flet/github-slugger         | OK      | Approved    |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
Source for the verdicts: `gsd-tools query package-legitimacy check --ecosystem npm retext retext-smartypants github-slugger` returned OK for all three (no postinstall, not deprecated). Names are also confirmed by the installed `astro` and `remark-smartypants` package manifests (authoritative), so they are not `[ASSUMED]`.

## Architecture Patterns

### System Architecture Diagram

```
                      .emdash/seed.json  (schema + content + menus + settings; the only rebuild path)
                              │  emdash seed --skip-media   (CI, fresh clone, rebuild)
                              ▼
 browser ──GET──► Node standalone server (dist/server/entry.mjs, output: "server")
                     │
                     ├─ EmDash middleware (security headers, setup/auth for /_emdash/*, preview tokens)
                     │
                     ├─ public pages (src/pages/*.astro)
                     │     ├─ Layout.astro ──► getSiteSettings()  (title, tagline, seo.titleSeparator)
                     │     │                └► getMenu("primary") ─► Nav.astro (links, active state)
                     │     ├─ page ──► src/lib/projects.ts adapter
                     │     │            ├─ getEmDashCollection("projects", { orderBy: { date: "desc" } })
                     │     │            ├─ getEmDashEntry("projects"|"about"|"home"|"projects_index", slug)
                     │     │            └─ entry.data.terms.{tag,category} ─► string[] / string
                     │     ├─ head values ──► getSeoMeta(entry, { siteTitle, titleSeparator, defaultDescription })
                     │     │                   (panel row overrides when an editor set one; else computed defaults)
                     │     └─ body ──► prepareBody(blocks) ─► <PortableText components={{ block, mark.link }}/>
                     │                  (smart punctuation, heading ids)
                     │
                     ├─ unknown / draft / id-form slug ──► new Response(null, { status: 404 })
                     │        └► Astro handler renders src/pages/404.astro with status 404
                     │
                     └─ /_emdash/admin/*, /_emdash/api/*  (injected, prerender: false; the only place admin JS loads)

 CI:  npm run check:public-js
        build ─► mkdtemp cwd + data/ ─► emdash seed (committed seed) ─► spawn server (cwd = temp)
        ─► fetch 17 routes + unknown slug (+ draft fixture) + admin route ─► write dist-shaped temp dir
        ─► script-inventory.mjs check allowlist <dir>   (non-zero on any added script / modulepreload / module tag)
```

### Recommended Project Structure

```
src/
├── lib/
│   ├── projects.ts        # adapter: EmDash entries -> today's card/detail shape (REND-01)
│   ├── prose.ts           # prepareBody(): smart punctuation + heading ids (pure, unit-tested)
│   ├── site.ts            # page meta helper over getSeoMeta + site settings (title, description, og:url)
│   └── format.ts          # unchanged (formatLogTimestamp is unused; leave, mention only)
├── components/
│   ├── prose/ProseBlock.astro   # style-free block override with heading ids
│   ├── prose/ProseLink.astro    # link mark without inner whitespace
│   └── Nav.astro                # takes links from the menu
├── layouts/Layout.astro         # settings + menu + head values
├── live.config.ts               # KEEP (required by getEmDashCollection / getEmDashEntry)
└── pages/ (index, about, 404, projects/index, projects/[...slug])
scripts/
├── script-inventory.mjs, script-allowlist.json   # kept; engine for the guard
├── check-public-js.mjs                            # new orchestrator
├── check-public-js.test.mjs                       # new self-test (fixtures generated at test time)
└── fixtures/draft-project.seed.json               # new, optional draft-404 fixture
.github/workflows/ci.yml
.emdash/seed.json                                  # updated (home, projects_index, about additions, hasSeo, titleSeparator)
emdash-env.d.ts                                    # regenerated; see IN-03 recommendation
```

### Pattern 1: Adapter keeps component props identical (REND-01)

**What:** `src/lib/projects.ts` returns objects shaped like today's `CollectionEntry<"projects">` (`id` = slug, `data.title`, `data.category`, `data.status`, `data.statusVariant`, `data.surface`, `data.timeLabel`, `data.period`, `data.tags: string[]`, `data.summary`, `data.sub`, `data.stats`, `data.date: Date`) so `StageCard` and the detail template change only their type import.
**Why it works:** `getEmDashCollection` and `getEmDashEntry` both hydrate `data.terms` already (`hydrateEntryTerms` runs inside `successResult` and the collection path), grouped by taxonomy name and sorted by label. [VERIFIED: node_modules/emdash/src/query.ts:1247 `hydrateEntryTerms(type, [wrapped], termLocale)`, and 1689-1733 for the folded-terms grouping with `toSorted(... String(a.label).localeCompare(String(b.label)))`; probe output showed `terms.category` and `terms.tag` arrays with `label` and `slug`]. So D-03 is satisfied without calling `getTermsForEntries`: it is the same data source, already batched. Keep `getEntryTerms` only as a fallback if `terms` is absent.
**Verbatim schema (from the committed generated types):**

```ts
// .emdash/types.ts:25-39 (Project) [VERIFIED: .emdash/types.ts:25-39]
export interface Project {
  id: string;
  slug: string | null;
  status: string;
  title: string;
  date: string;
  project_status: string;
  status_variant: "accent" | "green" | "default";
  surface: string;
  time_label: string;
  period: string;
  summary: string;
  sub: string;
  stats?: { "label": string; "value": string; "variant": "default" | "green" | "accent" }[];
  body?: PortableTextBlock[];
```

```ts
// src/lib/projects.ts (sketch). Date is an ISO string at midnight UTC ("2026-08-27T00:00:00.000Z" in the probe), used only for sorting; no public page renders it.
import { getEmDashCollection, getEmDashEntry } from "emdash";
import type { ContentEntry, PortableTextBlock } from "emdash";
import type { Project as EmDashProject } from "../../emdash-env"; // or ../../.emdash/types, see IN-03

export interface ProjectEntry {
  id: string; // the slug, as before
  data: {
    title: string;
    category: string;
    status: string;
    statusVariant: "accent" | "green" | "default";
    surface: string;
    timeLabel: string;
    period: string;
    tags: string[];
    summary: string;
    sub: string;
    stats: {
      label: string;
      value: string;
      variant: "default" | "green" | "accent";
    }[];
    date: Date;
  };
  body: PortableTextBlock[];
}

function toProject(entry: ContentEntry<EmDashProject>): ProjectEntry {
  const d = entry.data;
  return {
    id: entry.id,
    data: {
      title: d.title,
      category: d.terms?.category?.[0]?.label ?? "",
      status: d.project_status,
      statusVariant: d.status_variant,
      surface: d.surface,
      timeLabel: d.time_label,
      period: d.period,
      tags: (d.terms?.tag ?? []).map((t) => t.label),
      summary: d.summary,
      sub: d.sub,
      stats: d.stats ?? [],
      date: new Date(d.date),
    },
    body: d.body ?? [],
  };
}

export async function getSortedProjects(): Promise<ProjectEntry[]> {
  const { entries, error } = await getEmDashCollection("projects", {
    orderBy: { date: "desc" },
  });
  if (error) throw error; // EmDash returns errors instead of throwing
  return entries.map(toProject);
}

export async function getProject(slug: string): Promise<ProjectEntry | null> {
  const { entry, error } = await getEmDashEntry("projects", slug);
  if (error) throw error;
  // getEmDashEntry also resolves by database id; the public URL is the slug only.
  return entry && entry.id === slug ? toProject(entry) : null;
}
```

Default list status is published only: `const status = filter?.status || "published";` [VERIFIED: node_modules/emdash/src/loader.ts:1737]. Draft detail is hidden in normal mode: `function isVisible(entry) { return dataStr(entryData(entry), "status") === "published"; }` [VERIFIED: query.ts:1219-1221].

### Pattern 2: Real 404 reusing the existing page (REND-02)

**What:** In the detail page, `if (!project) return new Response(null, { status: 404 });`. Astro's handler re-renders `404.astro` with that status when a 404 response has a null body.
**Evidence:** `if (REROUTABLE_STATUS_CODES.includes(response.status) && response.body === null && response.headers.get(REROUTE_DIRECTIVE_HEADER) !== "no") { return this.#app.renderError(...) }` [VERIFIED: node_modules/astro/dist/core/routing/handler.js:154-157]. Prototype result: `/projects/nope` 404 with the 404 page, `/does-not-exist` 404, `/projects/Platform-Hub` 404, `/projects/platform-hub/extra` 404, all in the standalone build.
**Gotcha:** `/projects/<database ULID>` returned **200** in the prototype because `getEmDashEntry` resolves slug or id. Compare `entry.id === slug` (Pattern 1) so each project has one public URL.
**`404.astro` stays SSR** (do not add `prerender = true`): a prerendered page that reads EmDash would need a database at build time, which CI and Docker builds do not have.

### Pattern 3: Head values with `getSeoMeta`, not `EmDashHead` (REND-03, D-04, D-05)

**What:** Keep the hardcoded head in `Layout.astro` (so every tag, order and favicon link stays identical) and feed it `title` and `description` from `getSeoMeta()`.

```ts
// src/lib/site.ts (sketch)
import { getSeoMeta, getSiteSettings } from "emdash";
// For projects:
const settings = await getSiteSettings();
const meta = getSeoMeta(entry, {
  siteTitle: settings.title, // "Zeik Cookson"
  titleSeparator: settings.seo?.titleSeparator, // " — " once seeded (see below)
  defaultDescription: project.summary,
});
// Layout: <title>{meta.title}</title>, description meta.description, og:title/twitter:title = meta.title
```

`getSeoMeta` precedence: panel title, then `defaultTitle`, then `data.title`; panel description, then `defaultDescription`, then `data.excerpt`; `fullTitle = siteTitle && pageTitle ? pageTitle + separator + siteTitle : pageTitle`. [VERIFIED: node_modules/emdash/src/seo/index.ts getSeoMeta body]. Proven: with a panel row `("projects", id, "Panel Title", "Panel description")` inserted in the scratch DB the page rendered `<title>Panel Title — Zeik Cookson</title>` and the panel description; without it the computed defaults rendered.
**Three semantics to respect:**

1. The panel title is the page-title part and **gets the suffix appended**. Do not seed `"X — Zeik Cookson"` into a panel title; it would render doubled.
2. `meta.ogTitle` omits the suffix (`ogTitle: pageTitle || fullTitle`), but the baseline `og:title` and `twitter:title` equal the full title. Use `meta.title` for all three, as `Layout.astro` already does with its single `title` prop.
3. `seo.titleSeparator` is unset today (Phase 2 Q2 = 2a), so the default `" | "` would apply. Seed `settings.seo.titleSeparator` as `" — "` (a JSON escape, `"—"` with spaces) so parity holds and the deferred copy decision later becomes one setting edit. Settings seeding and export are supported (the experiment re-exported `settings` intact).
   **Singletons:** home passes no `siteTitle` and uses its entry `title` ("Zeik Cookson — DevOps Engineer") as the whole title; `projects_index` and `about` use `siteTitle`. For description use a plain field named `excerpt` on each singleton: `getSeoMeta` falls back to `data.excerpt` automatically, it is seedable and exportable, and the panel (when filled) still wins. Home needs no `excerpt` because the baseline description equals the `tagline` setting.
   **`og:url`:** the baseline value is `https://dev.zeikcookson.com/projects/catalog-cms/` (trailing slash, configured site). In SSR `Astro.url.href` follows the request Host (`http://localhost:4321/...` in the prototype), so compute it from `Astro.site`: `new URL(Astro.url.pathname.replace(/\/?$/, "/"), Astro.site).href`. The 404 page is rendered at whatever path was requested, so pin it with an optional `canonicalPath` Layout prop set to `"/404/"` to match the baseline byte for byte (otherwise record `og:url` on `/404` as an accepted deviation).

### Pattern 4: Menu and active state (REND-03)

`getMenu("primary")` returns `{ items: [{ id, label, url, children }] }` with `url` `/`, `/projects`, `/about` for the seeded menu. [VERIFIED: probe output, and menus/types.ts MenuItem]. Fetch it in `Layout.astro`, pass `links` to `Nav.astro`, and keep the existing `activeNav` prop by mapping `home` to `/`, `projects` to `/projects`, `about` to `/about`. Throw if the menu is null rather than rendering an empty nav.

### Pattern 5: Prose parity (REND-04), the three fixes

**What differs between EmDash `PortableText` and the old markdown output (measured on the real 13 bodies plus About):**

| Delta             | Baseline                                                           | EmDash default                                                                                                                                                                          | Fix                                                                                                                                                         |
| ----------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Heading ids       | `<h2 id="the-problem">` (7 per long page)                          | `<h2>`                                                                                                                                                                                  | `ProseBlock.astro` renders `id={node.headingId}`; `prepareBody()` sets `headingId` with one `GithubSlugger` per body (handles duplicates like rehype-slug)  |
| Smart punctuation | `doesn’t` (57 apostrophes) and `“flag for discussion”` (1 pair)    | straight `'` and `"`                                                                                                                                                                    | `prepareBody()` runs `retext` + `retext-smartypants` on every span that does not carry the `code` mark. Experiment: 14 of 14 bodies equal the baseline text |
| Link whitespace   | `(<a href="/projects/homelab-k8s">Homelab Kubernetes Cluster</a>)` | `<a href> Homelab Kubernetes Cluster </a>` (spaces inside the anchor, so visible spaces next to parentheses and commas on `observability-stack`, `homelab-k8s`, `self-hosted-services`) | `ProseLink.astro`: `<a href={href}><slot /></a>` on one line, keeping `sanitizeHref`                                                                        |

Invisible deltas to canonicalize in the comparator, not fix: `data-astro-cid-*` attributes (EmDash's `Block.astro` has a scoped `<style>`; `ProseBlock` removes them from blocks anyway), `&#39;` and `&gt;` entity forms (component expressions escape what raw markdown output left literal), and whitespace between tags.

```astro
---
// src/components/prose/ProseBlock.astro  (no <style>, no whitespace around the slot)
interface Props { node: { style?: string; headingId?: string } }
const { style, headingId } = Astro.props.node;
---
{style === "h2" ? <h2 id={headingId}><slot /></h2>
: style === "h3" ? <h3 id={headingId}><slot /></h3>
: style === "h4" ? <h4 id={headingId}><slot /></h4>
: style === "blockquote" ? <blockquote><slot /></blockquote>
: <p><slot /></p>}
```

```astro
---
// src/components/prose/ProseLink.astro
import { sanitizeHref } from "emdash";
interface Props { node: { markDef: { href: string; blank?: boolean } } }
const { markDef } = Astro.props.node;
const href = sanitizeHref(markDef.href);
const blank = Boolean(markDef.blank) && !href.startsWith("#");
---
<a href={href} target={blank ? "_blank" : undefined} rel={blank ? "noopener noreferrer" : undefined}><slot /></a>
```

```ts
// src/lib/prose.ts
import { retext } from "retext";
import retextSmartypants from "retext-smartypants";
import GithubSlugger from "github-slugger";
import type { PortableTextBlock } from "emdash";

const processor = retext().use(retextSmartypants);
const smart = (text: string): string => String(processor.processSync(text));
type Span = { _type: "span"; text: string; marks?: string[] };
type Block = PortableTextBlock & {
  style?: string;
  children?: Span[];
  headingId?: string;
};
const isBlock = (b: PortableTextBlock): b is Block => b._type === "block";

export function prepareBody(
  blocks: PortableTextBlock[] | undefined,
): PortableTextBlock[] {
  const slugger = new GithubSlugger();
  return (blocks ?? []).map((b) => {
    if (!isBlock(b) || !b.children) return b;
    const children = b.children.map((c) =>
      c._type === "span" && !(c.marks ?? []).includes("code")
        ? { ...c, text: smart(c.text) }
        : c,
    );
    const isHeading = typeof b.style === "string" && /^h[2-4]$/.test(b.style);
    const headingId = isHeading
      ? slugger.slug(b.children.map((c) => c.text).join(""))
      : undefined;
    return { ...b, children, ...(headingId ? { headingId } : {}) };
  });
}
// usage: <PortableText value={prepareBody(project.body)} components={{ block: ProseBlock, mark: { link: ProseLink } }} />
```

`.prose` styling needs no change: its rules are global selectors in `src/styles/blocks.css` (`.prose h2`, `.prose p`, `.prose code`, `.prose a`, lists, blockquote), and PortableText emits the same flat children inside `<div class="prose">`. The About body uses `.about-body :global(p)`, which also still matches. [VERIFIED: src/styles/blocks.css:173-270 and src/pages/about.astro:154]
**Measured result:** with these three pieces the canonical comparison (ignoring only `data-astro-cid-*`, entity forms and inter-tag whitespace) reported 14 of 14 bodies identical to the baseline, and the allowlist check still passed 17 of 17.
**Known side effect (accept):** using `emdash/ui` `PortableText` pulls EmDash component CSS into pages that render it (one extra render-blocking `<link rel="stylesheet">`, about 10 KB uncompressed, on project and About pages), and in SSR the `StageCard` scoped CSS ships as its own stylesheet instead of the baseline's inline `<style>`. This changes stylesheet delivery, not JS or appearance, and is outside what GUARD-01 counts. Record it in the verification; do not chase it.

### Pattern 6: Parity comparator (REND-04, D-02)

Extend the compare step (a `parity` command in `scripts/script-inventory.mjs`, or a sibling script that spawns it; the file has top-level execution so it cannot be imported) with a canonicalizer applied to both sides before diffing:

1. Remove ` data-astro-cid-<hash>` attributes and decode `&#39;`, `&gt;`, `&lt;`, `&quot;`, `&amp;`.
2. Collapse whitespace between tags and within text to single spaces, trim.
3. Sort the `<span class="stage-tag">` runs inside each `.stage-tags` container (D-02, set comparison; only `StageCard` shows tags).
4. Ignore stylesheet `<link>` and `<style>` differences (delivery, not content) but keep a separate assertion that the `Layout.*.css` file hash is unchanged.
5. Treat `og:url` per the Pattern 3 decision.
   Run it against `~/portfolio-baseline/current/dist` for all 17 routes. The existing `compare` already reports 0 of 17 identical on the prototype only because of `og:url` and ids, so the canonicalizer is mandatory, not optional. Light and dark visual check needs a browser (none installed: no Playwright or Chromium), so it is a `checkpoint:human-verify` with the user starting the server.

### Pattern 7: `check:public-js` (GUARD-01, D-10, D-11)

**Design (all of it exercised piecewise in the scratch project):**

1. `npm run build` (or accept a prebuilt `dist/` flag for CI reuse).
2. `mkdtemp` a working dir with `data/`; run `node_modules/.bin/emdash seed <repo>/.emdash/seed.json -d ./data/emdash.db --cwd <tmp> --skip-media` (path rules from Phase 2 Pitfall 3). Verified: the built app runs with `cwd` = a temp dir holding only a freshly seeded `data/`, and renders all 17 routes. This never touches the developer's `data/emdash.db`, and it proves the committed seed alone rebuilds the site.
3. Spawn `node <repo>/dist/server/entry.mjs` with `cwd: <tmp>`, `HOST=127.0.0.1`, an ephemeral `PORT`; poll `/_emdash/api/health` (200 anonymously, verified) until ready.
4. Fetch the route list with the status rules of `script-inventory.mjs fetch`: `/`, `/projects/`, each `/projects/<slug>/`, `/about/` expect **200**; `/__parity_missing_route__/` expects **404** and is stored as `404.html`; also `/projects/__no_such_slug__/` expects 404. **Assert statuses before the script check**: a 500 error page has few scripts and would pass the allowlist.
5. Assert the admin route answers (`/_emdash/admin` is a 302 to `/_emdash/admin/setup` on an un-set-up DB, and setup is 200; verified) and that no public page references anything under `/_emdash/`.
6. Write bodies into a temp dir shaped like `dist` (`/` to `index.html`, `/404` to `404.html`, others to `<route>/index.html`), then spawn `node scripts/script-inventory.mjs check scripts/script-allowlist.json <dir>` and propagate its exit code. Always kill the server and remove temps in `finally`.
   **Route discovery (recommended):** the allowlist lists 13 specific project routes, but projects are now content. Crawl `href="/projects/<slug>"` links from `/projects/` so a new project cannot silently escape the check, and give `checkDir` a wildcard fallback entry `"/projects/*"` (all 13 current entries are identical: `script 4, module 1, external 0, modulepreload 0`). [VERIFIED: scripts/script-allowlist.json]
   **Draft case:** unknown slug is mandatory; for a draft, apply `scripts/fixtures/draft-project.seed.json` (a content-only seed with one `status: "draft"` project) after the main seed and assert `/projects/<draft-slug>/` is 404 and absent from `/projects/`.
   **Deliberate failing case (D-11):** `scripts/check-public-js.test.mjs` builds fixtures at test time in a temp dir: a clean `index.html` with one inline script, run `script-inventory.mjs capture` then `derive` to make an allowlist, assert `check` exits 0; then a `bad` copy with an injected `<script>window.__x=1</script>` and `<link rel="modulepreload" href="/x.js">`, assert exit 1 and that stdout names both. No hand-computed hashes needed. The existing `selftest` command needs the external baseline, so it cannot be the committed test.
   **Local runs need the user's go-ahead** (the repo rule is no dev or preview servers without asking, and this starts the server); in CI it just runs.

### Pattern 8: Schema and content delta, seed-first (D-06, D-07)

Because the EmDash MCP is not connected and the admin needs a dev server the user must start, apply the delta offline: patch `.emdash/seed.json` with a one-off script (allowed by D-07, not kept), rebuild `data/` from it, then `export-seed` to normalize and commit that export. Proven offline in the scratch DB: adding `"seo"` to `supports` on `projects` and `about` produced `has_seo = 1`, adding a `home` collection plus one entry created them, and `emdash export-seed --with-content all` returned `supports: ["drafts","revisions","preview","seo"]` for all three plus the home entry and unchanged settings.
Proposed shapes (names are Claude's discretion, all non-reserved):

| Collection                                                         | Fields                                                                                                          | Notes                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `home` (slug `home`, `urlPattern` `/`)                             | `title` (string, the full page title), `hero_first`, `hero_last`, `stage_label`, `stage_location`, `bio` (text) | Hero markup is `<span class="hero-first">Zeik</span><br /><em>Cookson</em>` and the stage line `Devops Engineer <em>Knoxville, TN</em>` [VERIFIED: baseline `index.html`]. The three hero chips, CTA labels and section labels stay template copy (v2 CONT-04 remainder is deferred) |
| `projects_index` (slug `projects_index`, `urlPattern` `/projects`) | `title` ("Projects"), `excerpt` (meta description)                                                              | The empty-state text "No stages documented yet." is unreachable with 13 published projects and not in the baseline; keep it a template constant (D-06 says "if useful": it is not)                                                                                                   |
| `about` additions                                                  | `heading_line_1`, `heading_line_2`, `heading_accent`, `excerpt`                                                 | Baseline: `Designer who ended up<br>in the <em>engine bay.</em>`; render `{line1}<br />{line2} <em>{accent}</em>`                                                                                                                                                                    |

Settings delta: `seo: { titleSeparator: " — " }` (JSON-escaped). All collections get `supports: ["drafts","revisions","preview","seo"]`. Rebuild from a clean `data/` before the final export so revision counts stay tidy (Phase 2 Pitfall 7).
**Type regeneration still needs a dev server** (Phase 2 Pitfall 10): one human checkpoint where the user starts `astro dev`, then `npx emdash types` and confirm `emdash-env.d.ts` rewrote. Pages that call `getEmDashEntry("home", ...)` do not type-check until that is done, so it precedes the template flip in the plan order.

### Anti-Patterns to Avoid

- **Using `EmDashHead` for the head** (Finding F4): changes tag set and order, cannot produce `<title>`.
- **Seeding SEO titles and descriptions into per-entry panels**: not seedable and doubles the suffix (Finding F1).
- **Rendering bodies by round-tripping to markdown and using Astro's markdown processor**: it would match the baseline byte for byte, but passes author text through a pipeline that allows raw HTML, so stored `<script>` text becomes a live script (breaks GUARD-01 and is an XSS path). Rejected.
- **Letting the guard run against `data/emdash.db` in the repo cwd**: destructive or stale against the developer's content.
- **Prerendering `404.astro`**: needs a database at build time.
- **Setting `toolbar: "client"`** in the emdash integration: it injects a bootstrap `<script>` into every public page for every visitor. [VERIFIED: node_modules/emdash/src/astro/integration/runtime.ts:683-690 and astro/middleware/request-context.ts `injectBootstrap`]
- **Switching `build.format` or `trailingSlash` to chase `og:url`**: `trailingSlash: "always"` could break injected API routes; derive `og:url` from `Astro.site` instead.

## Don't Hand-Roll

| Problem                              | Don't Build               | Use Instead                                          | Why                                                                                                                                  |
| ------------------------------------ | ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Smart quotes, ellipses, dashes       | Regex replacement         | `retext` + `retext-smartypants`                      | Same engine and defaults as the baseline pipeline; contexts like `'90s` and nested quotes                                            |
| Heading ids                          | Custom slug function      | `github-slugger`                                     | Same algorithm and duplicate handling (`-1` suffix) as Astro's heading ids                                                           |
| Link href safety                     | Allow-list regex          | `sanitizeHref` from `emdash`                         | Handles control characters and unsafe schemes; EmDash's own link mark uses it [VERIFIED: node_modules/emdash/src/utils/url.ts:57-69] |
| Title and description fallback chain | Custom precedence code    | `getSeoMeta()`                                       | Implements panel then default then field fallback, canonical and robots                                                              |
| Menu resolution                      | Hardcoded links           | `getMenu("primary")`                                 | Editable in the admin; resolves URLs                                                                                                 |
| Allowlist engine and script parsing  | A second inventory script | `scripts/script-inventory.mjs check`                 | Already parses scripts, `modulepreload`, `type="module"`, JSON-LD as data, with hashing                                              |
| Server start and DB seed for CI      | Docker or `astro preview` | Spawn `dist/server/entry.mjs` with a seeded temp cwd | Closest to production; no extra tooling                                                                                              |
| Slug existence and draft hiding      | A manual status filter    | `getEmDashEntry` (published only in normal mode)     | Preview tokens and editors still work through EmDash's context                                                                       |

**Key insight:** every hard part already exists in EmDash or in Astro's own dependency set. The work is the adapter, three small prose shims, the seed delta and the CI wrapper.

## Runtime State Inventory

> This phase flips the read path and deletes the markdown sources, so the question is what still holds the old shape after the repo files change.

| Category                             | Items Found                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Action Required                                                                                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stored data                          | Local `data/emdash.db` already holds 13 projects and 1 About (verified `select count(*)`), gitignored, matches the committed seed. New collections and fields will not exist in it until the seed delta is applied                                                                                                                                                                                                                                                          | Data migration of the local DB: rebuild from the new seed (`rm -rf data`, `mkdir data`, `emdash seed`). No production data exists yet (Phase 5)                                      |
| Live service config                  | None. No external service reads these paths. Cloudflare Pages still builds `main` with `npm run build` and static `dist/`; a server build changes `dist/` to `dist/client` plus `dist/server`                                                                                                                                                                                                                                                                               | Keep the work on `emdash-migration`; do not merge to `main` before Phase 5. Do not push without the user's go-ahead                                                                  |
| OS-registered state                  | None found: no launchd, cron or pm2 entries reference this project (not exhaustively probed; nothing in the repo registers any)                                                                                                                                                                                                                                                                                                                                             | None                                                                                                                                                                                 |
| Secrets and env vars                 | None used by the read path. `EMDASH_SITE_URL` is only needed for the setup wizard behind HTTPS and for sitemap origins (Phase 5 gate h)                                                                                                                                                                                                                                                                                                                                     | None in Phase 3                                                                                                                                                                      |
| Build artifacts / installed packages | `dist/` (stale static build), `.astro/` (content-layer data store for the deleted file collection), `emdash-env.d.ts` and `.emdash/types.ts` (must be regenerated), `.emdash/migrations.json` (gitignored, per-build), `yaml` devDependency (becomes unused), and four stale docs: `CLAUDE.md`, `.cursor/skills/portfolio-projects/SKILL.md`, `.cursor/skills/portfolio-logbook/SKILL.md`, `scripts/log.sh` (references a logbook path that no longer exists, pre-existing) | Rebuild `dist/`; delete `.astro/` once locally if the content store complains; regenerate types; remove `yaml`; flag the stale docs for Phase 6 (DOCS-01, DOCS-03), do not edit here |

**Not a rename:** nothing outside the repo stores the old collection name `projects` as a key that changes; the collection keeps its slug.

## Common Pitfalls

### Pitfall 1 (F1): Per-entry SEO values cannot be seeded or exported

**What goes wrong:** D-04 plans seeded SEO titles and descriptions on every entry. After a fresh rebuild from `.emdash/seed.json` the panel rows would be gone and the head would silently change.
**Why it happens:** The seed entry type is `{ id, slug, status, data, taxonomies, bylines, locale, translationOf }` with no `seo`; the compiled seed-apply chunk contains zero occurrences of "seo"; `export-seed` writes only `supports`. [VERIFIED: node_modules/emdash/src/seed/types.ts:327-354; grep of `dist/apply-CLjfxvyH.mjs` returned 0 matches; export-seed.ts:438 `supports: collection.supports.length > 0 ? collection.supports : undefined`]
**How to avoid:** Put `"seo"` in `supports` in the seed (this sets `has_seo`, verified round trip). Compute head values in code from seedable fields (Pattern 3). Treat the panel as an override layer. Do not claim "seeded SEO values" in the verification. **This conflicts with D-04's literal wording and D-07's rebuild fidelity; see Open Question 1.**
**Warning signs:** `_emdash_seo` rows present in the working DB but `SELECT count(*) FROM _emdash_seo` is 0 after a fresh seed.

### Pitfall 2 (F2): Prose renders differently from markdown

See Pattern 5. **Warning signs:** `Layout`-level compare passes but body text shows `'` instead of `’`, anchors 404, or a space after `(` before a link.

### Pitfall 3: `og:url` follows the request, not the site

The prototype emitted `http://localhost:4321/...` for every route. Behind Traefik or Cloudflare it would follow whatever Host and protocol the proxy forwards. Use `Astro.site` (set to `https://dev.zeikcookson.com` in `astro.config.mjs`) and normalize the trailing slash.

### Pitfall 4: `hasSeo` toggled through the admin or API may not survive the seed export

`export-seed` writes the `supports` array, not `has_seo`; `updateCollection` sets `has_seo` from `input.hasSeo` when given and from `supports` otherwise. [VERIFIED: schema/registry.ts:1109-1113]. If SEO is enabled through the admin toggle, check the exported `collections[].supports` still contains `"seo"`; add it by hand if not. Setting it from the seed avoids the question.

### Pitfall 5: A status-less error page can pass the allowlist

The allowlist only caps counts, and an error page has fewer scripts. Assert HTTP status for every fetched route before the script check (Pattern 7).

### Pitfall 6: Running the guard against the developer database

Pattern 7 step 2 avoids it. Also never start the server before `emdash seed` on a fresh DB: the runtime would auto-seed the default `posts` and `pages` (Phase 2 Pitfall 4).

### Pitfall 7: Generated types go stale

`getEmDashEntry("home", ...)` falls back to an untyped record until `emdash-env.d.ts` includes `home`, and `astro check` then errors on property access. Regenerate before flipping templates. Baseline: `npx astro check` currently reports 0 errors, 0 warnings, 0 hints (31 files). [VERIFIED: ran this session]

### Pitfall 8: Booleans and dates

`show_availability` read back as a real boolean (`"showAvailabilityType": "boolean"`, value `false`) through `getEmDashEntry` in the probe, so Phase 2 Pitfall 8 (numbers) does not apply to this read path; `Boolean(...)` stays harmless. `date` is an ISO string (`"2026-08-27T00:00:00.000Z"`); no public template renders it, so IN-01's `formatProjectDate` has no consumer. Recommend satisfying IN-01 with a JSDoc comment on the adapter's `new Date(d.date)` (UTC) and not adding an unused helper (Open Question 5).

### Pitfall 9: New public routes appear

EmDash injects `/robots.txt`, `/sitemap.xml` and `/sitemap-[collection].xml` unless the site defines its own. [VERIFIED: astro/integration/routes.ts:1046-1063; prototype rendered all three] They are text and XML, not JS, so GUARD-01 is unaffected, but they are new public surface: the sitemap origin follows the request host until `EMDASH_SITE_URL` is set (Phase 5 gate h), and `robots.txt` defaults to allow-all with `Disallow: /_emdash/`. Accept and record; opt out only if the user objects.

### Pitfall 10: Public responses expose `Server-Timing`

Every EmDash-handled response carries a `Server-Timing` header listing runtime phases and database query counts, plus `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `X-Frame-Options`. [VERIFIED: node_modules/emdash/src/astro/middleware.ts:530-575, and prototype writeHead output]. The security headers help (they partly close Phase 1 gate g for SSR pages). `Server-Timing` is low-severity disclosure; strip it at the proxy in Phase 5, note it, do not engineer around it now.

### Pitfall 11: Misleading Astro warning on first request

`cache.set() was called but caching is not enabled` is logged once per process (live collections report a cache hint). Harmless; enabling Astro's experimental route cache is out of scope.

## Code Examples

### Layout head after the change (sketch, tags and order unchanged)

```astro
---
import Nav from "../components/Nav.astro";
import { getMenu, getSiteSettings } from "emdash";
import "../styles/global.css";

interface Props { title: string; description?: string; activeNav?: "home" | "projects" | "about"; canonicalPath?: string }
const { title, description, activeNav, canonicalPath } = Astro.props;
const settings = await getSiteSettings();
const menu = await getMenu("primary");
if (!menu) throw new Error('EmDash menu "primary" is missing');
const desc = description ?? settings.tagline ?? "";
const path = canonicalPath ?? Astro.url.pathname.replace(/\/?$/, "/");
const ogUrl = new URL(path, Astro.site).href;
---
<!-- head tags as today; og:url content={ogUrl}; favicons stay hardcoded static files -->
<Nav links={menu.items} activeNav={activeNav} />
```

Note on D-05: `settings.favicon` is not seeded (only title, tagline and two socials are), and the baseline links static files in `public/`. Keep the favicon links hardcoded; there is nothing to read.

### Detail page core

```astro
---
import { PortableText } from "emdash/ui";
import { getSeoMeta, getSiteSettings } from "emdash";
import { getProject } from "../../lib/projects";
import { prepareBody } from "../../lib/prose";
import ProseBlock from "../../components/prose/ProseBlock.astro";
import ProseLink from "../../components/prose/ProseLink.astro";
const slug = Astro.params.slug;
const project = slug ? await getProject(slug) : null;
if (!project) return new Response(null, { status: 404 });
// raw EmDash entry is needed by getSeoMeta for the optional panel row; getProject can also return it
---
<div class="prose"><PortableText value={prepareBody(project.body)} components={{ block: ProseBlock, mark: { link: ProseLink } }} /></div>
```

(`getSeoMeta` reads `entry.data.seo`, which exists only on the single-entry path; return the raw entry's `seo` or the meta from the adapter so the detail page can use it. [VERIFIED: loader.ts:2193-2200 attaches `entryData.seo` only in `loadEntry`; the list path has no SEO column.])

### Fresh DB for CI and local rebuilds (offline, no server)

```bash
mkdir -p data
node_modules/.bin/emdash seed "$PWD/.emdash/seed.json" -d ./data/emdash.db --cwd "$PWD" --skip-media
```

Seed apply output from the scratch run: `Collections: 1 created, 0 skipped, 2 updated`, `Content: 1 created, 0 skipped, 14 updated`. [VERIFIED: experiment]

### GitHub Actions skeleton (Phase 5 appends steps to the same job)

```yaml
name: ci
on:
  push:
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4 # [ASSUMED] current major
      - uses: actions/setup-node@v4 # [ASSUMED] current major
        with:
          node-version-file: .nvmrc # 24; engines >=22.22.2 is enforced by .npmrc engine-strict
          cache: npm
      - run: npm ci
      - run: npm run check:public-js # GUARD-01 (builds, seeds, serves, fetches, checks)
      # Phase 5 appends: emdash migrate --check (GUARD-02) and the post-deploy smoke test (GUARD-03)
```

The Astro build downloads the admin font from Google Fonts at build time (EmDash's `notoSans` provider), so the runner needs outbound network, which GitHub-hosted runners have.

## State of the Art

| Old Approach                                            | Current Approach                                                 | When Changed                           | Impact                                                           |
| ------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| Prerendered static pages from a glob content collection | SSR from SQLite through EmDash live collections                  | This migration (Phase 1 D-09, Phase 3) | Pages are request-time; edits appear immediately                 |
| Hardcoded nav, hero, About h1                           | Menu, settings and singleton collections                         | This phase                             | Template copy is editable                                        |
| `getCollection("projects")`                             | `getEmDashCollection("projects", { orderBy })`, `getEmDashEntry` | This phase                             | Default order is `created_at` desc, so pass `orderBy` explicitly |

**Deprecated or outdated in this repo after the phase:** `src/content.config.ts` (deleted); markdown frontmatter workflow in `CLAUDE.md`, the two `.cursor` skills and `portfolio-update` (Phase 6); Phase 2 Pitfall 8 (boolean as number) for this read path.

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                       | Section                 | Risk if Wrong                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| A1  | D-07 may be satisfied by a one-off seed-patch script plus `emdash seed` plus `export-seed`, with the admin used only for a final spot-check, because the MCP is not connected and the admin needs a user-started dev server | Pattern 8               | The user wanted the changes made by hand in the admin or through MCP; the plan needs an admin checkpoint instead                    |
| A2  | `toolbar: false` is acceptable (no floating editor pill on public pages for signed-in editors; preview links and the admin editor are unaffected)                                                                           | Open Question 3         | The user wants the inline-edit pill; keep the default `"server"` and treat editor toolbar JS as exempt, as gate (j) already records |
| A3  | Node 22.22.2 (the engines floor) imports `.ts` files without a flag under `node --test`, so `src/lib/prose.ts` can be unit tested directly                                                                                  | Validation Architecture | Tests fail on 22.22.2; run them on 24 (`.nvmrc`) or convert the helper to `.mjs`                                                    |
| A4  | `actions/checkout@v4` and `actions/setup-node@v4` are the current majors                                                                                                                                                    | Code Examples           | Workflow pins an outdated action; verify at implementation time                                                                     |
| A5  | A merged `server` build would break the Cloudflare Pages deployment of `main` (Pages expects a static output directory)                                                                                                     | Runtime State Inventory | Low; the plan already keeps the work on the branch until Phase 5                                                                    |
| A6  | `retext` run per span (not per block) is sufficient for current and expected content; a quote that opens in one span and closes in another (for example around a link) could differ from the old whole-paragraph run        | Pattern 5               | A future body renders one straight quote; the parity comparator on real content would not catch content that does not exist yet     |
| A7  | The server-side head for `/404` at an arbitrary path should still equal the baseline `/404/` (pinned `canonicalPath`) rather than reflect the requested URL                                                                 | Pattern 3               | If the user prefers the real URL, drop the prop and record the `/404` `og:url` deviation                                            |

## Open Questions

1. **D-04 versus D-07: per-entry SEO values cannot be seeded (needs a user decision, blocks task writing for the head).**
   - What we know: the seed format and apply code carry no per-entry SEO; export drops it; panel rows exist only in the DB. `supports: ["seo"]` does round-trip and `getSeoMeta` honors a panel override (both proven).
   - What's unclear: whether the user accepts "panel is an optional override; defaults are computed from seedable fields" instead of "seeded panel values".
   - Recommendation: accept. Enable `hasSeo` via `supports`, add `excerpt` (meta description) to the three singletons, seed `settings.seo.titleSeparator`, compute the rest in code. Record the change to D-04 in the plan and verification. If the user insists on literal panel seeding, the only path is writing panel rows through the content API after every rebuild (not reproducible from the seed), which violates D-07.
2. **IN-03: which generated file to commit.**
   - What we know: `.emdash/types.ts` and `emdash-env.d.ts` declare identical interfaces; the dev server rewrites `emdash-env.d.ts` on every start and it alone carries the `declare module "emdash"` augmentation that types `getEmDashCollection("projects")`. D-07 names `.emdash/types.ts`; D-09 asks for one source.
   - Recommendation: commit `emdash-env.d.ts` (needed for typed queries and regenerated automatically), import types from it, and delete `.emdash/types.ts` and `.emdash/schema.json`. This deviates from D-07's wording; confirm. If the user wants to keep `.emdash/types.ts`, keep both and add a one-line drift check (regenerate and `git diff --exit-code`) at the human type-regeneration step.
3. **`toolbar` option (ADMIN-01 strictness).** Default `"server"` injects the editor toolbar (JS) only for authenticated editors with an edit cookie; anonymous pages are clean (guard proven on anonymous output, gate j). `toolbar: false` removes it unconditionally. Recommendation: `toolbar: false`, because ADMIN-01 reads "no admin JS on public routes" and the user wants inline editing nowhere but the admin. Confirm A2. Never `"client"`.
4. **Route allowlist for dynamic projects.** Recommend crawl plus a `"/projects/*"` wildcard entry (Pattern 7). Alternative is to regenerate the allowlist whenever a project is added, which makes CI fail for a non-JS reason. Planner decision.
5. **IN-01.** No public template renders `date` (only sorting uses it) and `formatLogTimestamp` in `src/lib/format.ts` is unused. Recommend a JSDoc note instead of a new helper. Confirm or add the helper anyway.
6. **Light and dark visual check.** No browser is installed here; plan a `checkpoint:human-verify` on `/`, `/projects`, the longest body (`catalog-cms`) and `/about` in both themes, with the user starting the server.
7. **Sitemap and robots.txt.** Accept the two new auto-injected public routes? (Pitfall 9.)

## Environment Availability

| Dependency                                       | Required By                                                             | Available               | Version                                  | Fallback                                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Node                                             | build, scripts, tests                                                   | yes                     | 24.17.0 (`.nvmrc` 24; engines >=22.22.2) | none needed                                                                                 |
| npm                                              | installs                                                                | yes                     | 11.13.0                                  | none                                                                                        |
| emdash CLI                                       | seed, export-seed, types                                                | yes                     | 1.3.1 (`node_modules/.bin/emdash`)       | none                                                                                        |
| sqlite3 CLI                                      | inspection only                                                         | yes                     | 3.54.0                                   | none needed                                                                                 |
| git, gh                                          | commits, optional workflow inspection                                   | yes                     | 2.54.0, 2.102.0                          | none                                                                                        |
| Docker                                           | not needed in Phase 3                                                   | yes                     | 29.8.1                                   | n/a                                                                                         |
| actionlint                                       | workflow linting                                                        | no                      | n/a                                      | review the YAML by eye; first real run on GitHub validates it                               |
| Playwright or Chromium                           | automated light/dark screenshots                                        | no                      | n/a                                      | human checkpoint for the visual check                                                       |
| Running local server (`astro dev`, built server) | `emdash types`, admin spot-check, visual check, local `check:public-js` | not started (user rule) | n/a                                      | **Human gate: ask the user before starting any server.** CI runs the guard without the gate |
| `~/portfolio-baseline/current`                   | local parity compare                                                    | yes                     | symlink to 2026-10-23                    | CI does not use it (allowlist is committed)                                                 |

**Missing dependencies with no fallback:** none block the planning.
**Missing dependencies with fallback:** browser (human check), actionlint (read the YAML, CI proves it).

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Framework          | `node:test` (built in), no install                                                                                   |
| Config file        | none; name files explicitly (`node --test scripts/check-public-js.test.mjs`)                                         |
| Quick run command  | `node --test scripts/check-public-js.test.mjs src/lib/prose.test.mjs`                                                |
| Full suite command | `npx astro check && npm run build && npm run check:public-js` (plus the local parity compare and human checks below) |

### Phase Requirements to Test Map

| Req ID   | Behavior                                                                 | Test Type          | Automated Command                                                                                                              | File Exists? |
| -------- | ------------------------------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| REND-01  | Newest first, props shape, tags and category mapped                      | unit + integration | `node --test src/lib/projects.test.mjs` (mapping over fixture entries); parity compare card order over `/projects/`            | Wave 0       |
| REND-02  | Unknown slug and id-form slug return 404 with the 404 page; draft hidden | integration        | `npm run check:public-js` status assertions (unknown slug, draft fixture)                                                      | Wave 0       |
| REND-03  | Nav from menu, head from `getSeoMeta` + settings                         | integration        | parity compare head section over 17 routes; unit test of the meta helper (title, description, separator, og:url)               | Wave 0       |
| REND-04  | Copy and layout match baseline (D-02 tag set rule)                       | integration        | local parity compare with canonicalizer against `~/portfolio-baseline/current/dist` (17 of 17)                                 | Wave 0       |
| REND-04  | Light and dark appearance                                                | manual-only        | `checkpoint:human-verify`: no browser installed; the user starts the server                                                    | n/a          |
| REND-04  | Prose fixes hold                                                         | unit               | `node --test src/lib/prose.test.mjs` (apostrophes, `"quoted"` pair, code span untouched, heading ids incl. duplicate headings) | Wave 0       |
| REND-05  | Sources deleted, build passes                                            | smoke              | `test ! -e src/content && test ! -e src/data/about.ts && test ! -e src/content.config.ts && npm run build`                     | Wave 0       |
| ADMIN-01 | Admin route answers; no admin JS on public routes                        | integration        | `npm run check:public-js` (admin 302 or 200 and no `/_emdash/` reference in public HTML)                                       | Wave 0       |
| GUARD-01 | Check fails on added script and `modulepreload`; passes clean            | unit (self-test)   | `node --test scripts/check-public-js.test.mjs`                                                                                 | Wave 0       |
| GUARD-01 | CI wiring                                                                | smoke              | first run of `.github/workflows/ci.yml` on GitHub (needs the user's push go-ahead)                                             | Wave 0       |

### Sampling Rate

- **Per task commit:** `node --test <the touched test file>` and `npx astro check`
- **Per wave merge:** `npm run build` plus the in-process or server parity compare
- **Phase gate:** full suite green plus the recorded human checkpoints (type regeneration, light and dark visual, admin loads in a browser) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `scripts/check-public-js.mjs` and `scripts/check-public-js.test.mjs` (self-test with generated fixtures)
- [ ] `src/lib/prose.test.mjs` and a mapping test (pure helpers; imports `.ts` directly, see A3)
- [ ] Canonicalizing parity command (extend `script-inventory.mjs` or add a sibling)
- [ ] `.github/workflows/ci.yml`
- [ ] `scripts/fixtures/draft-project.seed.json` (optional draft-404 fixture)
- [ ] `package.json` scripts: `check:public-js`, `test`; remove `yaml`

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies                                     | Standard Control                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no (public read path; passkeys are Phase 5) | n/a                                                                                                                                                                                                                                                                                |
| V3 Session Management | no                                          | n/a                                                                                                                                                                                                                                                                                |
| V4 Access Control     | yes                                         | Drafts hidden from anonymous requests by `getEmDashEntry` / `getEmDashCollection` (published only); preview responses are `Cache-Control: private, no-store` and token-verified [VERIFIED: query.ts:1219-1221, loader.ts:1737, astro/middleware/request-context.ts preview branch] |
| V5 Input Validation   | yes                                         | The `slug` route param is passed to EmDash's parameterized query; mismatch returns 404; rich text rendered through `PortableText` with `sanitizeHref` for links; no raw HTML pipeline                                                                                              |
| V6 Cryptography       | no                                          | n/a                                                                                                                                                                                                                                                                                |
| V14 Configuration     | yes                                         | EmDash adds `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`; admin routes get a strict CSP; strip `Server-Timing` at the proxy in Phase 5                                                                                                     |

### Known Threat Patterns for Astro SSR + EmDash

| Pattern                                                              | STRIDE                 | Standard Mitigation                                                                                                                 |
| -------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Stored XSS in rich text (agent or admin authored)                    | Tampering              | Render only through `PortableText` and custom marks that keep `sanitizeHref`; never `set:html` body content; no markdown round trip |
| `javascript:` or control-character hrefs in link marks               | Tampering              | `sanitizeHref` returns `"#"` for unsafe values (kept in `ProseLink`)                                                                |
| Draft or unpublished content leak by slug, id or preview             | Information disclosure | Published-only reads; `entry.id === slug` check; preview tokens are item-scoped and `no-store`                                      |
| Public JS drift (admin or integration scripts reaching public pages) | Tampering              | GUARD-01 on anonymous output; never `toolbar: "client"`; consider `toolbar: false`                                                  |
| Host header spoofing changes `og:url` and sitemap origin             | Spoofing               | Build `og:url` from `Astro.site`; set `EMDASH_SITE_URL` in Phase 5                                                                  |
| SQL injection                                                        | Tampering              | No SQL in this phase's code; EmDash queries are parameterized; project rule (CLAUDE.md) still applies to any new script             |
| Information disclosure via `Server-Timing` and `/_emdash/api/health` | Information disclosure | Low severity; strip or restrict at the proxy (Phase 5)                                                                              |
| Command injection in the CI wrapper                                  | Elevation of privilege | `spawn` and `execFileSync` with argument arrays, never a shell string                                                               |
| Residual npm advisories (astro, @astrojs/node, sharp, esbuild)       | Various                | Unchanged named gate (a) before Phase 5; no AVIF processing or remote image hosts are added here                                    |

## Project Constraints (from CLAUDE.md)

- Astro 6, TypeScript strict, **no `any`**. New helpers use explicit types (the sketches above avoid `any`); scripts use `// @ts-check` with JSDoc as `script-inventory.mjs` does.
- **No client-side JS** unless there is no server alternative. No new `<script>` on any public page; `check:public-js` enforces it. Admin JS only under `/_emdash/admin`.
- **No inline styles** except custom property overrides (`style="--var: value"`). New components add none; existing `style={`--i: ${i}`}` usage is unchanged.
- **All SQL parameterized**, view or table names from config constants. No SQL is written in this phase; any inspection script follows the rule.
- **Design system:** two typefaces, single amber accent, zero radius, no card shadows at rest. No visual change is the whole point; parity is the test.
- **Copy rules (memory and PROJECT.md):** no em dashes in new copy, natural first-person prose, no fabricated dates. The em dash in existing titles and the `projects_index` description is kept for parity (deferred decision). New field labels and any seeded copy that is not existing text must avoid em dashes. Copy is moved verbatim, never rewritten.
- **Workflow rules:** do not start `astro dev` or `astro preview` (or any server) without asking; do not `git push`; work stays on `emdash-migration`.
- **Deployment:** `main` still builds on Cloudflare Pages with `npm run build` and `dist/`; this change must not reach `main` before Phase 5.
- **Content workflow text in CLAUDE.md is stale after this phase** (markdown "Adding a project"); Phase 6 DOCS-01 owns the update, so do not edit it here.
- **Project skills:** `.claude/skills/emil-design-eng` exists (UI polish philosophy); nothing in it applies because there is no visual change.

## Sources

### Primary (HIGH confidence)

- Installed package source read this session: `node_modules/emdash/src/{query.ts, loader.ts, seo/index.ts, page/seo-contributions.ts, page/seo-panel.ts, components/{PortableText,Block,EmDashHead}.astro, components/marks/Link.astro, components/index.ts, menus/index.ts, settings/types.ts, taxonomies/index.ts, seed/{types,apply}.ts, schema/registry.ts, cli/commands/export-seed.ts, astro/integration/{index,routes,runtime}.ts, astro/middleware.ts, astro/middleware/{setup,request-context}.ts, utils/url.ts}`; `node_modules/astro/dist/core/routing/handler.js`; `node_modules/@astrojs/node/dist/{server,standalone,serve-static}.js`; `node_modules/remark-smartypants`, `retext-smartypants`.
- Repo files read: `src/{content.config.ts, live.config.ts, lib/*, layouts/Layout.astro, components/*, pages/*, data/about.*, styles/blocks.css}`, `.emdash/{seed.json, types.ts, schema.json}`, `emdash-env.d.ts`, `scripts/{script-inventory.mjs, script-allowlist.json}`, `astro.config.mjs`, `package.json`, `Dockerfile`, `.gitignore`, Phase 1 and 2 CONTEXT, RESEARCH, FOLLOWUPS and 02-04 SUMMARY.
- Experiments this session in an isolated clone under the session scratchpad (no server started, in-process requests only, `ASTRO_NODE_AUTOSTART=disabled`): SSR build; 17-route render; `script-inventory.mjs check` 17 of 17; card order and tag-set comparison; per-body canonical diff 14 of 14; panel override probe; offline seed apply and `export-seed` with `seo` support and a new collection; temp-cwd run; admin, robots and sitemap probes; header capture; warm render timing; shape probe of entry, menu, settings.
- `gsd-tools query package-legitimacy check` (OK for all three packages); `npm view` versions.

### Secondary (MEDIUM confidence)

- None relied on.

### Tertiary (LOW confidence)

- GitHub Actions action majors (A4) from training knowledge only.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH. Versions installed, verified on the registry, legitimacy gate clean.
- Architecture and read path: HIGH. Source read and reproduced in a prototype against the real baseline.
- Prose parity: HIGH for the 14 current bodies; MEDIUM for future content (A6).
- SEO behavior: HIGH (source plus panel probe); the D-04 conflict is a verified fact, the resolution is a recommendation.
- CI guard design: MEDIUM. Every building block was run locally, but the orchestrator and the GitHub workflow have not been run end to end.
- Pitfalls: HIGH.

**Research date:** 2026-10-26
**Valid until:** 2026-11-25 (EmDash 1.3.x is moving; re-check `getSeoMeta`, seed SEO support and the `PortableText` components if the pin moves past 1.3.1)
