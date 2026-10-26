# Phase 3: Read Path Rewire and Parity - Pattern Map

**Mapped:** 2026-10-26
**Files analyzed:** 27 (new or modified, deletions grouped)
**Analogs found:** 19 / 27 (the rest take their pattern from 03-RESEARCH.md)

All analog paths below were taken from `git ls-files` output (tracked). No gitignored mirror paths are used.

## File Classification

| New/Modified File                                                                                                                                                           | Role              | Data Flow                   | Closest Analog                                 | Match Quality        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------- | ---------------------------------------------- | -------------------- |
| `src/lib/projects.ts` (rewrite)                                                                                                                                             | service (adapter) | CRUD read                   | itself (current, 9 lines) + RESEARCH Pattern 1 | exact (same exports) |
| `src/lib/prose.ts` (new)                                                                                                                                                    | utility           | transform                   | `src/lib/format.ts` (pure helper)              | role-match           |
| `src/lib/prose.test.mjs` (new)                                                                                                                                              | test              | transform                   | `scripts/import-content.test.mjs`              | role-match           |
| `src/lib/site.ts` (new)                                                                                                                                                     | utility           | request-response            | RESEARCH Pattern 3                             | no analog            |
| `src/components/prose/ProseBlock.astro` (new)                                                                                                                               | component         | transform                   | `src/components/Chip.astro` (props + slot)     | partial              |
| `src/components/prose/ProseLink.astro` (new)                                                                                                                                | component         | transform                   | `src/components/Chip.astro`                    | partial              |
| `src/components/Nav.astro` (modify)                                                                                                                                         | component         | request-response            | itself, lines 2-32                             | exact                |
| `src/components/StageCard.astro` (modify, type import only)                                                                                                                 | component         | request-response            | itself, lines 1-14                             | exact                |
| `src/layouts/Layout.astro` (modify)                                                                                                                                         | layout            | request-response            | itself, lines 1-27                             | exact                |
| `src/pages/index.astro` (modify)                                                                                                                                            | route             | request-response            | itself, lines 1-35                             | exact                |
| `src/pages/about.astro` (modify)                                                                                                                                            | route             | request-response            | itself, lines 1-25                             | exact                |
| `src/pages/projects/index.astro` (modify)                                                                                                                                   | route             | request-response            | itself, lines 1-20                             | exact                |
| `src/pages/projects/[...slug].astro` (modify)                                                                                                                               | route             | request-response            | itself, lines 1-54                             | exact                |
| `src/pages/404.astro` (unchanged, stays SSR)                                                                                                                                | route             | request-response            | itself                                         | n/a                  |
| `astro.config.mjs` (modify)                                                                                                                                                 | config            | n/a                         | itself, lines 9-25                             | exact                |
| `.emdash/seed.json` (modify via one-off patch)                                                                                                                              | config            | batch                       | itself (Phase 2 output)                        | exact                |
| `emdash-env.d.ts` (regenerate, commit)                                                                                                                                      | config            | generated                   | itself                                         | n/a                  |
| `scripts/check-public-js.mjs` (new)                                                                                                                                         | utility (CLI)     | request-response + file-I/O | `scripts/script-inventory.mjs`                 | role-match           |
| `scripts/check-public-js.test.mjs` (new)                                                                                                                                    | test              | file-I/O                    | `scripts/import-content.test.mjs`              | role-match           |
| parity canonicalizer (new command or sibling script)                                                                                                                        | utility (CLI)     | transform                   | `scripts/script-inventory.mjs` COMMANDS table  | exact                |
| `scripts/script-allowlist.json` (modify, add `/projects/*`)                                                                                                                 | config            | n/a                         | itself                                         | exact                |
| `scripts/fixtures/draft-project.seed.json` (new)                                                                                                                            | fixture           | n/a                         | `.emdash/seed.json`                            | role-match           |
| `.github/workflows/ci.yml` (new)                                                                                                                                            | config            | event-driven                | none                                           | no analog            |
| `package.json` (modify)                                                                                                                                                     | config            | n/a                         | itself                                         | exact                |
| `src/live.config.ts` (KEEP unchanged)                                                                                                                                       | config            | n/a                         | itself                                         | n/a                  |
| Deleted: `src/content.config.ts`, `src/content/projects/*.md` (13), `src/data/about.ts`, `src/data/about.md`                                                                | n/a               | n/a                         | n/a                                            | n/a                  |
| Deleted: `scripts/import-content.mjs`, `import-content.test.mjs`, `verify-import.mjs`, `lib/sources.mjs`, `lib/schema.mjs`, `lib/entry.mjs`, `scripts/fixtures/` (existing) | n/a               | n/a                         | n/a                                            | n/a                  |

Deletion note: `grep` shows `scripts/lib/schema.mjs` and `scripts/lib/entry.mjs` are imported only by `import-content.mjs`, its test, and `verify-import.mjs`, all deleted in D-08, so they have no remaining consumer and go too. The new fixture `scripts/fixtures/draft-project.seed.json` must be created after the old `scripts/fixtures/` is removed. `scripts/log.sh` is stale but out of scope (Phase 6).

## Pattern Assignments

### `src/lib/projects.ts` (service adapter, CRUD read)

**Analog:** current file, `src/lib/projects.ts` lines 1-9. Contract to preserve: export `getSortedProjects()` returning newest-first, drafts excluded, entries with `id` and `data.*`.

```typescript
import { getCollection, type CollectionEntry } from "astro:content";

export async function getSortedProjects(): Promise<
  CollectionEntry<"projects">[]
> {
  return (await getCollection("projects", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}
```

**Replace with:** 03-RESEARCH.md Pattern 1 (lines 233-296): `toProject()` mapping, `getEmDashCollection("projects", { orderBy: { date: "desc" } })`, `if (error) throw error`, `getProject(slug)` with the `entry.id === slug` guard. Map `d.terms.category[0].label` to `category` and `d.terms.tag` labels to `tags: string[]` (D-03). Export a `ProjectEntry` type and add `getProject`. Keep `id` as the slug. Add the JSDoc UTC note on `new Date(d.date)` for IN-01 (RESEARCH Open Question 5).

### `src/components/StageCard.astro` (type import only)

**Analog:** itself, lines 1-14. Change only line 2 and the `entry` prop type.

```astro
import type { CollectionEntry } from "astro:content";
...
entry: CollectionEntry<"projects">;
```

becomes `import type { ProjectEntry } from "../lib/projects";` and `entry: ProjectEntry;`. Markup, classes, inline `style` custom-property usage stay as is.

### `src/lib/prose.ts` (utility, transform) and `src/lib/prose.test.mjs`

**Analog for shape:** `src/lib/format.ts` (small pure exported helpers, no framework imports). **Test analog:** `scripts/import-content.test.mjs` lines 1-21 (header comment with run command, `node:test`, `node:assert/strict`, named-file run note), but that file is deleted, so copy this header style before it goes:

```javascript
// @ts-check
// <what is tested>
// run: node --test <file>  (name the file; Node 24 treats a directory argument as a file)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
```

**Core:** copy RESEARCH.md Pattern 5 `prepareBody()` (lines 376-410) verbatim. Cases the test must cover (RESEARCH Validation map): apostrophes, a `"quoted"` pair, code span untouched, heading ids including a duplicate heading (`-1` suffix). Import `.ts` directly (assumption A3: run on Node 24, `.nvmrc`).

### `src/components/prose/ProseBlock.astro` and `ProseLink.astro`

**Analog:** `src/components/Chip.astro` / `StageCard.astro` for the frontmatter `interface Props` + `Astro.props` + slot convention (StageCard lines 5-12). No `<style>` blocks (UI-SPEC locks this).

**Copy bodies from** RESEARCH.md lines 350-373 (ProseBlock with `headingId`, ProseLink with `sanitizeHref`, `blank` handling, slot on one line with no whitespace). Wire in pages via `components={{ block: ProseBlock, mark: { link: ProseLink } }}`.

### `src/layouts/Layout.astro` (layout, request-response)

**Analog:** itself. Keep every tag and order; change only value sources.

Current props and `og:url` (lines 5-12, 24):

```astro
interface Props { title: string; description?: string; activeNav?: "home" | "projects" | "about"; }
const { title, description, activeNav } = Astro.props;
const desc = description ?? "DevOps and platform engineering portfolio. ...";
...
<meta property="og:url" content={Astro.url.href} />
...
<Nav activeNav={activeNav} />
```

Changes (RESEARCH "Layout head after the change", lines 549-566): `getSiteSettings()` for the fallback description (`settings.tagline`), `getMenu("primary")` with a throw when null, `canonicalPath` prop, `og:url` from `new URL(path, Astro.site).href` with trailing slash, pass `links={menu.items}` to `Nav`. Do not touch the three `is:inline` scripts (lines 37-75); they are hashed by the allowlist. Favicon and font links stay hardcoded.

### `src/components/Nav.astro`

**Analog:** itself, lines 2-32. Replace the hardcoded `links` array (lines 8-12) with a `links` prop of menu items (`{ label, url }`). The existing `activeNav` ids (`home`, `projects`, `about`) need a map to `/`, `/projects`, `/about`:

```astro
const links = [
  { id: "home", label: "Home", href: "/" },
  ...
] as const;
...
data-state={activeNav === link.id ? "active" : undefined}
aria-current={activeNav === link.id ? "page" : undefined}
```

Keep `data-state`/`aria-current` output identical. Markup below line 15 is untouched.

### `src/pages/projects/[...slug].astro` (route, request-response)

**Analog:** itself. Remove `render` import, `getStaticPaths` (lines 10-16), and `Content`. Template body (lines 23-53) is untouched except the prose block.

```astro
const { entry } = Astro.props;
const { Content } = await render(entry);
const project = entry.data;
...
<div class="prose"><Content /></div>
```

becomes the RESEARCH "Detail page core" (lines 572-586): `getProject(Astro.params.slug)`, `if (!project) return new Response(null, { status: 404 });`, `<PortableText value={prepareBody(project.body)} components={...} />` inside the same `<div class="prose">`. Title/description via `getSeoMeta` (Pattern 3) instead of the literal `` `${project.title} — Zeik Cookson` ``. Per RESEARCH line 588, `getSeoMeta` needs the raw entry's `seo`; have `getProject` also return it. The page needs `export const prerender = false` only if the integration default is not already server; with `output: "server"` it is not needed.

### `src/pages/projects/index.astro`

**Analog:** itself, lines 1-20. Keep the empty-state branch (lines 13-16) and the `StageCard` loop with `headingLevel={2}` and `style={`--i: ${i}`}`. Replace the literal title and description (line 9) with values from the `projects_index` singleton (`getEmDashEntry("projects_index","projects_index")`, title `Projects`, `excerpt` description) through `getSeoMeta` with `siteTitle`.

### `src/pages/index.astro`

**Analog:** itself, lines 1-35. Replace `import { showAvailability } from "../data/about"` with the About entry's `show_availability`. Hero markup comes from the `home` singleton using the render contracts in UI-SPEC lines 168: `<span class="hero-first">{first}</span><br /><em>{last}</em>`, `{stage_label} <em>{stage_location}</em>`, bio in `<p class="hero-bio">`. Hero chips and CTAs stay hardcoded. `.slice(0, 3)` stays.

### `src/pages/about.astro`

**Analog:** itself, lines 1-25. Remove `AboutContent` (`.md` import) and `../data/about` imports; read the `about` entry via `getEmDashEntry("about","about")`, render the body with `PortableText` inside `.about-body`. h1 contract: `{line1}<br />{line2} <em>{accent}</em>` (UI-SPEC line 168). `cells`, `stack`, `contacts`, `role` now come from entry fields (see Phase 2 `.emdash/types.ts` `About` interface). Keep `Switcher` markup untouched.

### `src/pages/404.astro`

Unchanged. Stays server-rendered (no `prerender = true`). Add the `canonicalPath="/404/"` prop to its `<Layout>` call (line 4) only if the planner follows Pattern 3 to pin `og:url`.

### `astro.config.mjs`

**Analog:** itself, lines 9-25. Change `output: "static"` to `"server"` and drop the stale comment on lines 11-12; add `toolbar: false` inside the `emdash({...})` options (amendment; never `"client"`). Keep `adapter: node({ mode: "standalone" })`, `react()`, `sqlite`/`local` blocks.

### `.emdash/seed.json` (batch, one-off patch)

**Analog:** itself. Add `"seo"` to `supports` on `projects` and `about`; add `home` and `projects_index` collections plus one entry each; add About fields `heading_line_1`, `heading_line_2`, `heading_accent`, `excerpt`; add `settings.seo.titleSeparator` = `" — "`; see RESEARCH Pattern 8 table (lines 448-453) and UI-SPEC "Copy that moves into EmDash" for seeded values. Rebuild from a clean `data/` and `export-seed` for the final committed file. Command (RESEARCH line 594): `node_modules/.bin/emdash seed "$PWD/.emdash/seed.json" -d ./data/emdash.db --cwd "$PWD" --skip-media`. Do not keep the patch script.

### `emdash-env.d.ts` (IN-03)

Commit this file only. Delete `.emdash/types.ts` and `.emdash/schema.json` (amendment). Import types from `../../emdash-env` in `src/lib/projects.ts`. Regeneration needs a user-started dev server (human checkpoint) and must precede the template flip.

### `scripts/check-public-js.mjs` (CLI utility, spawn + fetch + file-I/O)

**Analog:** `scripts/script-inventory.mjs` for conventions: `// @ts-check` header, JSDoc typedefs, `node:` imports, a COMMANDS table, `process.exitCode`, errors printed as `error: ...`.

Reuse by spawning (the file runs top-level code and cannot be imported, RESEARCH line 419):

```
spawnSync(process.execPath, ["scripts/script-inventory.mjs", "check", "scripts/script-allowlist.json", dir])
```

The `check` command prints `PASS/FAIL` per route and returns 0/1 (script-inventory.mjs lines 560-573); propagate its exit code. Follow RESEARCH Pattern 7 steps 1-6: build, mkdtemp cwd with `data/`, `emdash seed`, spawn `dist/server/entry.mjs` with `HOST=127.0.0.1` and an ephemeral `PORT`, poll `/_emdash/api/health`, assert statuses (200 for real routes, 404 for `/__parity_missing_route__/` stored as `404.html` and for `/projects/__no_such_slug__/`) before the allowlist check, assert no public HTML mentions `/_emdash/`, kill the server and rm temps in `finally`. Use argument arrays, never shell strings. The existing `MISSING_ROUTE = "/__parity_missing_route__/"` constant (script-inventory.mjs line 27) is the route to reuse. Crawl project links from `/projects/` and add the `"/projects/*"` wildcard to `scripts/script-allowlist.json` (the allowlist `routes` entries have shape `{ script, module, external, modulepreload }`; `checkDir` needs a wildcard fallback added).

### `scripts/check-public-js.test.mjs`

**Analog:** `scripts/import-content.test.mjs` header and temp-dir style (`mkdtempSync`, `spawnSync`, `rmSync`, `describe/it`). Build fixtures at test time: clean `index.html` with one inline script, run `capture` then `derive`, assert `check` exits 0; then a copy with `<script>window.__x=1</script>` and `<link rel="modulepreload" href="/x.js">`, assert exit 1 and stdout names both (RESEARCH lines 440).

### Parity canonicalizer

**Analog:** the `COMMANDS` table in `scripts/script-inventory.mjs` (entries are `{ usage, min, max, run }`, line ~560-580). Add a `parity` command there, or a sibling script that spawns it, applying the five rules in RESEARCH Pattern 6 (strip `data-astro-cid-*`, decode entities, collapse whitespace, sort `.stage-tags` children, ignore stylesheet delivery). Baseline dir: `~/portfolio-baseline/current/dist`.

### `.github/workflows/ci.yml` (no analog; `.github/` does not exist)

Use the RESEARCH skeleton (lines 601-618) with `node-version-file: .nvmrc`, `npm ci`, `npm run check:public-js`, and a comment marking where Phase 5 appends `emdash migrate --check` and the smoke test. Verify action majors at implementation time (A4).

### `package.json`

**Analog:** itself. Add scripts `check:public-js` (`node scripts/check-public-js.mjs`) and `test`; add dependencies `retext@^9.0.0`, `retext-smartypants@^6.2.0`, `github-slugger@^2.0.0`; remove devDependency `yaml` (only `scripts/lib/sources.mjs` imports it).

## Shared Patterns

### EmDash returns errors, it does not throw

**Source:** RESEARCH Pattern 1. **Apply to:** every `getEmDashCollection` / `getEmDashEntry` call (projects.ts, pages, Layout).

```typescript
const { entries, error } = await getEmDashCollection("projects", {
  orderBy: { date: "desc" },
});
if (error) throw error;
```

### Head values computed in code

**Source:** RESEARCH Pattern 3 / UI-SPEC Head contract. **Apply to:** all five page routes via `Layout.astro`. Use `getSeoMeta` with `siteTitle`, `titleSeparator` from settings, `defaultDescription`. Home passes no `siteTitle`. Use `meta.title` for `<title>`, `og:title` and `twitter:title`. Never use `EmDashHead`, never seed pre-suffixed titles.

### Real 404

**Source:** RESEARCH Pattern 2. **Apply to:** the detail route.

```astro
if (!project) return new Response(null, { status: 404 });
```

Handler re-renders `404.astro` with the 404 status (null body required).

### No client JS, no inline styles

**Source:** `CLAUDE.md` Code Rules, UI-SPEC JS contract. **Apply to:** all new components and templates. Only `style="--var: value"` custom property overrides (existing example `StageCard.astro`: `style="--space: var(--s1)"`). Every `<script>` in the public pages is the allowlisted baseline and must stay byte-identical.

### Script file conventions

**Source:** `scripts/script-inventory.mjs` lines 1-27. **Apply to:** every new `.mjs`: `// @ts-check`, a one-line purpose comment with a usage line, JSDoc typedefs, `node:` imports.

### Copy rules

**Source:** `CLAUDE.md`, memory index. **Apply to:** seeded values and admin labels: move copy verbatim; no em dash in any new copy (existing parity-locked strings keep theirs); no `any`.

## No Analog Found

| File                                       | Role    | Data Flow        | Reason                                                                                                                          |
| ------------------------------------------ | ------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/site.ts`                          | utility | request-response | No existing head/SEO helper; use RESEARCH Pattern 3                                                                             |
| `.github/workflows/ci.yml`                 | config  | event-driven     | No `.github/` directory exists; use RESEARCH skeleton                                                                           |
| Heading id / smart punctuation logic       | utility | transform        | No prior prose pipeline in `src/lib`; RESEARCH Pattern 5                                                                        |
| `scripts/fixtures/draft-project.seed.json` | fixture | n/a              | Only the old import fixtures exist (deleted); base it on a single project entry from `.emdash/seed.json` with `status: "draft"` |
| Spawn-server orchestration                 | utility | process mgmt     | No existing script spawns a server; RESEARCH Pattern 7                                                                          |

## Metadata

**Analog search scope:** `src/`, `scripts/`, `astro.config.mjs`, `package.json`, `.emdash/`, `.github/` (absent)
**Files scanned:** about 20 read, 70 tracked paths listed
**Pattern extraction date:** 2026-10-26
