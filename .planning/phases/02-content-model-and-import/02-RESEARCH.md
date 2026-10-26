# Phase 2: Content Model and Import - Research

**Researched:** 2026-10-26
**Domain:** EmDash 1.3.1 schema (collections, fields, seed), markdown to Portable Text import, field-level verification, generated types
**Confidence:** HIGH on the import path, schema shape and converter (read from the installed source and proven in a scratch database). MEDIUM on admin behavior (read from the shipped admin bundle, not driven in a browser because of the no-dev-server rule).

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Body format**

- **D-01:** Project bodies are stored as Portable Text (EmDash native rich text), not raw markdown. The import converts markdown to blocks. Source bodies use only H2 headings, paragraphs, bold, inline code and a few links (no lists, tables, code fences, H3 or blockquotes), so the conversion surface is small. — **Reversibility:** costly — the field type and every stored body depend on it; switching means a data migration.
- **D-02:** The equality report checks body copy strictly: convert stored Portable Text back to markdown and diff against the source file, so headings, bold, inline code and link hrefs must all match exactly. Plain-text-only comparison is rejected because it would pass a dropped mark or broken href.

**About entry**

- **D-03:** One `about` collection entry holds everything the About and home pages read from `src/data/about.*`: body copy (rich text), `role`, `show_availability`, and repeaters for cells (label, value, variant), stack (name, level) and contacts (icon, label, href). Settings stay limited to the fixed General, Social and SEO keys; contacts do not move into Social settings. — **Reversibility:** costly — Phase 3 rendering and the import both depend on this shape.
- **D-04:** Constrained values on the About entry are select fields: stack level (DAILY, PROFICIENT, FAMILIAR, LEARNING, NEXT), contact icon (email, github, linkedin), cell variant (default, accent, green). Mirrors the TS unions in `src/data/about.ts`.

**Project fields**

- **D-05:** `category` is a select seeded with today's 9 values (Agency Tooling, Client Work, Developer Tools, Homelab Infrastructure, Observability, Personal Projects, Revenue Intelligence, Self-Hosted Services, Web Development). Adding a category is a schema edit, which the Phase 4 agent token cannot do; accepted.
- **D-06:** `project_status`, `surface`, `time_label` and `period` are free text strings (values are one-offs like "ON-PREM / IIS + NODE", "Q1 2025 – present"). `status_variant` is a select: accent, green, default.
- **D-07:** `date` is a string field in YYYY-MM-DD, using the exact source strings. The project list sorts with explicit `orderBy` on `date` desc (EmDash defaults to created_at). Native datetime is rejected to avoid timezone drift.
- **D-08:** `summary` and `sub` are plain text fields, not rich text.
- **D-09:** Carried from Phase 1 and the roadmap, not re-asked: field slugs avoid reserved names (`project_status`, `status_variant`, `time_label`); tags are `multiSelect` with no options; stats are a per-project repeater (label, value, variant default/green/accent); `draft` becomes native draft status.

**Import and verification**

- **D-10:** The import goes through EmDash's supported path (CLI/seed or content API), not direct SQLite writes, so validation, revisions and status handling match production. The researcher confirms the exact entry point. — **Reversibility:** reversible — the script is replaceable.
- **D-11:** Re-runs upsert by slug and overwrite fields. Markdown remains the source of truth until Phase 3, so edits made in markdown resync on re-run; admin edits to imported entries are overwritten before cutover (accepted). Result after any run: exactly 13 projects, one About entry, no duplicates, drafts still drafts.
- **D-12:** Scripts live in `scripts/` next to the existing parity tooling (for example `import-content.mjs` and `verify-import.mjs`). The equality report prints to stdout, writes a per-field JSON report under `~/portfolio-baseline/` (outside the repo, not committed), and exits non-zero on any difference. It covers copy, dates, order, tags, stats and status.
- **D-13:** Commit a seed file exported from the final schema and content plus the generated types (`.emdash/types.ts`, not ignored per Phase 1 gate l). Verify a fresh local database rebuilds the same schema and content from the seed. The seed is a snapshot regenerated at Phase 2 close, because Phase 3 deletes the markdown that the import reads.

**Defaults (not discussed, Claude's discretion)**

- **D-14:** Primary nav menu is Home, Projects, About, mirroring `src/components/Nav.astro`; General, Social and SEO settings are seeded from current layout values. The researcher confirms the exact EmDash setting keys.

### Claude's Discretion

- Exact EmDash import entry point (CLI vs seed vs API), script structure, and the Portable Text block mapping details.
- Field naming for About repeaters and the About collection slug, within the non-reserved-slug rule.
- Admin UX details for the long-body test entry (success criterion 1).

### Deferred Ideas (OUT OF SCOPE)

- Page titles with em dash separators (parity keeps them; copy decision is separate) — carried from earlier phases.
- Tag taxonomies with archive routes (v2 CONT-02) and homepage hero as editable singleton (v2 CONT-04) — already in v2 requirements.
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID                    | Description                                                                                           | Research Support                                                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SCHEMA-01             | `projects` collection mirrors frontmatter with non-reserved slugs, string `date`, native draft status | Field table in Architecture Patterns. Reserved slug list read from source; `status` is reserved, `project_status` is not. Seed entry `status: "published"                                            | "draft"` is native draft status. |
| SCHEMA-02             | Per-project `stats` repeater and editable `tags`                                                      | `repeater` field type exists with `validation.subFields`. **Tags finding: `multiSelect` with no options renders no editor in the admin (see Pitfall 1 and Open Question 1). Needs a user decision.** |
| SCHEMA-03             | `about` entry holds About copy and cells                                                              | `about` collection with `portableText` body, `role`, boolean, and three repeaters. Prototyped and applied in a scratch DB.                                                                           |
| SCHEMA-04             | Primary nav menu and General, Social, SEO settings editable                                           | Seed `menus` and `settings` keys confirmed against `SiteSettings` type and admin settings pages. Menu items are replaced on every seed run (Pitfall 5).                                              |
| SCHEMA-05             | Types generated and committed                                                                         | Two artifacts from two generators, both need a running local server (Pitfall 10). Human gate required by the no-dev-server rule.                                                                     |
| MIGR-01               | Idempotent import, 13 projects, slugs = file names, explicit dates, drafts as drafts                  | `emdash seed --on-conflict update --skip-media`. Run twice in scratch: 13 published projects, 1 about. Draft fixture created as draft.                                                               |
| MIGR-02               | About imported with no copy changes                                                                   | `src/data/about.ts` is importable from plain Node (type stripping), so the importer reads the real exports. about.md converts and round-trips exactly.                                               |
| MIGR-03               | Field-by-field equality report, zero differences                                                      | Verifier reads SQLite read-only, converts Portable Text back with `portableTextToMarkdown`, compares to raw source. All 13 bodies and about.md already round-trip exactly.                           |
| MIGR-04               | Seed file exported from final schema and content, committed                                           | `emdash export-seed --with-content all` then `emdash seed` into a fresh DB reproduced identical rows (scratch proof). `settings.url` is not exported.                                                |
| </phase_requirements> |

## Summary

The import path is settled and proven offline. `emdash seed` is a CLI that opens the SQLite file directly through EmDash's own repositories (`ContentRepository`, `SchemaRegistry`), so validation, revisions, slugs and draft status follow the supported code path without a running server and without hand-written SQL. With `--on-conflict update` it upserts by slug. In a scratch database I generated the schema and all 13 projects plus one about entry from the real sources, applied the seed twice, and got exactly 13 published projects and 1 about entry. I then ran `export-seed --with-content all`, applied that into a fresh database, and every project and about row matched. The markdown converter that EmDash's own CLI and MCP use (`markdownToPortableText` and `portableTextToMarkdown`, exported from `emdash/client`) round-trips all 13 bodies and about.md to byte-identical text, which makes D-02's strict equality check achievable today.

One locked decision does not survive contact with the installed admin: **D-09 says tags are `multiSelect` with no options, but the 1.3.1 admin renders `multiSelect` as a checkbox group built only from the configured options, so an option-less tags field shows no controls at all.** Tags would not be editable in the admin, which fails success criterion 1. The server and agent paths do accept free strings, but the admin does not. This needs a user decision before planning finalizes the schema. My recommendation is to keep `multiSelect` and seed its options from the 45 distinct existing tags (type stays `string[]`, adapter unchanged, same accepted trade-off as D-05 categories).

Two steps cannot be done autonomously because of the no-dev-server rule and need a human checkpoint: the admin long-body edit test (success criterion 1, plus the nav and settings editability check in criterion 2) and type generation (`emdash types` and the dev-server-written `emdash-env.d.ts` both need a running local server). Everything else (schema apply, import, idempotency, verification, seed export, fresh-database rebuild) runs offline from scripts.

**Primary recommendation:** Build the schema and a seed-builder in `scripts/`, apply it with `emdash seed --on-conflict update --skip-media` (never touching SQLite directly for writes), verify with a read-only `node:sqlite` script that converts stored Portable Text back to markdown, and gate the two server-dependent steps behind one explicit "ask the user to start `astro dev`" checkpoint.

## Architectural Responsibility Map

| Capability                                  | Primary Tier                                          | Secondary Tier                    | Rationale                                                                                   |
| ------------------------------------------- | ----------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------- |
| Content schema (collections, fields, enums) | Database / Storage (EmDash schema registry in SQLite) | Build-time seed JSON              | The registry is the source of truth; the seed is the reproducible definition applied to it. |
| Markdown to Portable Text conversion        | Build/CLI script (Node)                               | none                              | Runs once at import time using EmDash's own converter. No runtime or browser involvement.   |
| Import (upsert by slug)                     | Build/CLI script (Node) via `emdash seed`             | Database / Storage                | EmDash's seed engine owns writes, revisions and status.                                     |
| Equality verification                       | Build/CLI script (Node)                               | Database / Storage (read-only)    | Reads persisted state, compares to source files. Reads only, so D-10 is intact.             |
| Admin editing of fields, nav, settings      | Browser / Client (EmDash admin, `/_emdash/admin`)     | API / Backend                     | Admin JS is allowed under the admin route only. Checked by a human in Phase 2.              |
| Type generation                             | API / Backend (typegen routes on a running server)    | Build/CLI script (`emdash types`) | Generators live behind HTTP routes, so a running local server is required.                  |
| Public rendering                            | Frontend Server (Astro)                               | none                              | NOT touched in Phase 2. Markdown stays the render source until Phase 3.                     |

## Standard Stack

### Core

| Library                | Version                            | Purpose                                                                   | Why Standard                                                                                                                                                                                                    |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| emdash                 | 1.3.1 (installed)                  | CMS, `emdash seed`, `export-seed`, `types` CLI, `emdash/client` converter | Already pinned in Phase 1. Provides the only supported import path and converter. [VERIFIED: node_modules/emdash/package.json version "1.3.1"]                                                                  |
| @emdash-cms/admin      | 1.3.1 (installed, transitive)      | Admin UI, defines how fields are edited                                   | Determines which field types are actually editable (Pitfalls 1, 2). [VERIFIED: node_modules/@emdash-cms/admin/package.json]                                                                                     |
| node:sqlite (built-in) | Node 24.17.0 local, 22.23.0 tested | Read-only verification reads                                              | EmDash itself runs on `node:sqlite` here (stack trace shows `node-sqlite-compat`), so no new native dependency. Prints an ExperimentalWarning on Node 22 only. [VERIFIED: ran on both Node 24.17.0 and 22.23.0] |
| node:test (built-in)   | Node 22.22.2+                      | Unit tests for converter hazards and the draft fixture                    | Zero dependencies; the repo has no test runner today. [ASSUMED: available on the 22.22.2 floor, run on 24.17.0]                                                                                                 |

### Supporting

| Library | Version                                                       | Purpose                                                | When to Use                                                                                                                                                                      |
| ------- | ------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| yaml    | ^2.8.4 (2.8.4 already in lockfile transitively; latest 2.9.1) | Parse project frontmatter in the importer and verifier | Needed because no frontmatter parser is a direct dependency. Add as a devDependency instead of relying on a transitive copy. [VERIFIED: npm ls, gsd-tools package-legitimacy OK] |

### Alternatives Considered

| Instead of                       | Could Use                                                        | Tradeoff                                                                                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `emdash seed` CLI                | Content REST API or `emdash content create` via a running server | Needs a dev server (user rule) plus auth; converts markdown for you, but the seed CLI is offline, supports upsert by slug, and applies schema, menus and settings in one pass. Seed wins. |
| `emdash seed` CLI                | Programmatic `applySeed` from `emdash/seed`                      | Needs a Kysely DB handle and ownership claim; reimplements the CLI. No benefit.                                                                                                           |
| Read-only `node:sqlite` verifier | Verify through the REST API with `emdash/client`                 | API needs a running server and returns data after server-side transforms. Direct read-only SQL checks persisted state and needs no server.                                                |
| `yaml`                           | `js-yaml` (also transitive)                                      | Equivalent. Pick one, add it explicitly.                                                                                                                                                  |

**Installation:**

```bash
npm install --save-dev yaml@^2.8.4
```

**Version verification:** `npm view yaml version` returned 2.9.1 (modified 2026-09-11); the lockfile already resolves 2.8.4 under astro tooling. `^2.8.4` avoids lockfile churn while staying on the maintained line. [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age                                     | Downloads | Source Repo            | Verdict                             | Disposition |
| ------- | -------- | --------------------------------------- | --------- | ---------------------- | ----------------------------------- | ----------- |
| yaml    | npm      | multi-year (2.9.1 published 2026-09-11) | ~143M/wk  | github.com/eemeli/yaml | OK (no postinstall, not deprecated) | Approved    |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
No other package is added. `emdash`, `@astrojs/*`, `react` were installed and audited in Phase 1.

## Architecture Patterns

### System Architecture Diagram

```
 src/content/projects/*.md ──┐                    (markdown stays source of truth until Phase 3)
 src/data/about.ts + about.md ┤
 scripts/lib/schema.mjs  ─────┤   (collections, menus, settings, enum lists)
 Nav links constant ──────────┘
            │
            ▼
 scripts/import-content.mjs
   1. parse sources (yaml frontmatter, import about.ts)
   2. markdownToPortableText(body)            <-- emdash/client converter
   3. build in-memory SeedFile {settings, collections, menus, content}
   4. write temp seed.json (os tmpdir), mkdir ./data
   5. execFileSync(node, [emdash cli, "seed", tmp, "-d", "./data/emdash.db",
                           "--cwd", repo, "--on-conflict", "update", "--skip-media"])
            │                                   (offline, no server)
            ▼
 data/emdash.db (SQLite)  <── EmDash repositories: schema registry, content, revisions, menus, options
            │
            ├────────────► scripts/verify-import.mjs  (read-only node:sqlite)
            │                 portableTextToMarkdown(body) vs raw source body
            │                 diff copy/dates/order/tags/stats/status/slugs/counts
            │                 stdout + ~/portfolio-baseline/current/phase2/equality-report.json
            │                 exit 1 on any difference
            │
            ├────────────► [HUMAN GATE: user starts astro dev]
            │                 admin edit test, menu + settings check,
            │                 `emdash types` -> .emdash/types.ts (+ schema.json)
            │                 dev server writes emdash-env.d.ts
            │
            └────────────► emdash export-seed --with-content all > .emdash/seed.json
                              └─► fresh dir + emdash seed ─► verify-import again (rebuild proof)
```

### Recommended Project Structure

```
scripts/
├── import-content.mjs        # builds seed from sources, shells out to `emdash seed`
├── verify-import.mjs         # read-only equality report, exit non-zero on diff
├── lib/
│   ├── schema.mjs            # collections, menus, settings, enum constants (JSDoc-typed, no `any`)
│   └── sources.mjs           # parse 13 markdown files + about.ts/about.md into one normalized model
├── fixtures/                 # draft-status fixture and converter hazard samples
└── import-content.test.mjs   # node:test: converter round trip, draft fixture, tags subset of options
.emdash/
├── seed.json                 # committed at Phase 2 close (export-seed output)
├── types.ts                  # committed (emdash types)
└── schema.json               # written by `emdash types` alongside types.ts
emdash-env.d.ts               # written by the dev server (typed getEmDashCollection)
```

### Pattern 1: Build a seed in memory, apply it with the CLI

**What:** The importer never writes to SQLite. It builds a `SeedFile`, writes it to a temp path, validates it, and applies it with `--on-conflict update`.
**When to use:** Every import run, including re-runs (idempotent by slug).
**Example:**

```js
// Source: node_modules/emdash/src/cli/commands/seed.ts (args), proven in a scratch DB this session
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cli = new URL(import.meta.resolve("emdash/cli")).pathname; // dist/cli/index.mjs
const repo = process.cwd();
mkdirSync(join(repo, "data"), { recursive: true }); // data/ must exist (SQLite error 14 otherwise)
const dir = mkdtempSync(join(tmpdir(), "portfolio-seed-"));
const seedPath = join(dir, "seed.json");
writeFileSync(seedPath, JSON.stringify(seed));
// -d and the positional path are both resolved against --cwd, not the shell cwd
execFileSync(process.execPath, [cli, "seed", seedPath, "--validate"], {
  stdio: "inherit",
});
execFileSync(
  process.execPath,
  [
    cli,
    "seed",
    seedPath,
    "-d",
    "./data/emdash.db",
    "--cwd",
    repo,
    "--on-conflict",
    "update",
    "--skip-media",
  ],
  { stdio: "inherit" },
);
```

### Pattern 2: Markdown to Portable Text with EmDash's own converter

**What:** Use the converter EmDash's CLI and MCP use, not a hand-rolled parser.
**Example:**

```js
// Source: node_modules/emdash/src/client/portable-text.ts, exported from emdash/client
import { markdownToPortableText, portableTextToMarkdown } from "emdash/client";
const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
const blocks = markdownToPortableText(body); // line-based: one non-blank line = one block
const back = portableTextToMarkdown(blocks).trim(); // must equal `body` exactly
```

### Pattern 3: Read-only verification with constant table names and bound values

**What:** Table names are constants (identifiers cannot be bound); every value is bound with `?`. This satisfies the CLAUDE.md SQL rule.
**Example:**

```js
import { DatabaseSync } from "node:sqlite";
const TABLES = Object.freeze({ projects: "ec_projects", about: "ec_about" }); // config constants, never user input
const db = new DatabaseSync("./data/emdash.db", { readOnly: true });
const rows = db
  .prepare(
    `SELECT * FROM ${TABLES.projects} WHERE deleted_at IS NULL ORDER BY date DESC`,
  )
  .all();
const one = db
  .prepare(
    `SELECT * FROM ${TABLES.projects} WHERE slug = ? AND deleted_at IS NULL`,
  )
  .get(slug);
```

### Proposed schema

**`projects` collection** (`supports: ["drafts","revisions","preview"]`, `urlPattern: "/projects/{slug}"`). Entry `slug` is the file name; entry `status` is native draft status (`"published"` or `"draft"`).

| Field slug     | Type                                                                                                                               | Notes                                                                                                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title          | string, required                                                                                                                   |                                                                                                                                                                        |
| date           | string, required, `validation.pattern: "^\\d{4}-\\d{2}-\\d{2}$"`                                                                   | Exact source string. Pattern makes the admin reject malformed dates (verified: unpatterned string accepts "nope"). Optional `indexed: true`; sorting works without it. |
| category       | select, required, `validation.options` = the 9 values                                                                              |                                                                                                                                                                        |
| project_status | string, required                                                                                                                   | source `status`                                                                                                                                                        |
| status_variant | select, required, default "default", options accent, green, default                                                                |                                                                                                                                                                        |
| surface        | string, required                                                                                                                   |                                                                                                                                                                        |
| time_label     | string, required                                                                                                                   | source `timeLabel`                                                                                                                                                     |
| period         | string, required                                                                                                                   |                                                                                                                                                                        |
| tags           | multiSelect, **`validation.options` = distinct source tags (see Open Question 1)**                                                 | Source order preserved per entry.                                                                                                                                      |
| summary        | text, required                                                                                                                     | plain text (D-08)                                                                                                                                                      |
| sub            | text, required                                                                                                                     | plain text (D-08)                                                                                                                                                      |
| stats          | repeater, subFields label (string, required), value (string, required), variant (select, required, options default, green, accent) | Rows preserve order.                                                                                                                                                   |
| body           | portableText                                                                                                                       |                                                                                                                                                                        |

**`about` collection** (`urlPattern: "/about"`), exactly one entry with slug `about`:

| Field slug        | Type                                                                       | Notes                                                                                   |
| ----------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| title             | string, required                                                           | Admin list label only (the page H1 is a template literal in about.astro)                |
| role              | string, required                                                           |                                                                                         |
| show_availability | boolean                                                                    | Stored as integer 0/1 (Pitfall 8)                                                       |
| body              | portableText                                                               | from about.md                                                                           |
| cells             | repeater: label, value, variant (select default, accent, green, required)  | Source `variant` is optional; absent maps to "default" (Pitfall 16)                     |
| stack             | repeater: name, level (select DAILY, PROFICIENT, FAMILIAR, LEARNING, NEXT) |                                                                                         |
| contacts          | repeater: icon (select email, github, linkedin), label, href (type `url`)  | `url` sub-field type is allowed in repeaters; mailto and https both pass the URL check. |

**Menu:** `menus: [{ name: "primary", label: "Primary", items: [{type:"custom",label:"Home",url:"/"}, {type:"custom",label:"Projects",url:"/projects"}, {type:"custom",label:"About",url:"/about"}] }]` mirrors `links` in `src/components/Nav.astro`. The docs list `custom` as the only documented item type. [CITED: github.com/emdash-cms/emdash skills/building-emdash-site/references/schema-and-seed.md]

**Settings keys** (the whole `SiteSettings` surface): `title`, `tagline`, `logo`, `favicon`, `url`, `postsPerPage`, `dateFormat`, `timezone`, `social` {twitter, github, facebook, instagram, linkedin, youtube}, `seo` {titleSeparator, defaultOgImage, robotsTxt, disallowAiTraining, googleVerification, bingVerification}. The admin has General Settings, SEO Settings and Social Links pages. [VERIFIED: node_modules/emdash/src/settings/types.ts; admin dist index.js strings "General Settings", "SEO Settings", "Social Links"] Recommended seed values are in Open Question 2.

### Anti-Patterns to Avoid

- **Writing rows with SQL or a SQLite client.** Bypasses revisions, status handling and validation (violates D-10). Reads only.
- **Hand-rolling a markdown parser.** The shipped converter round-trips every source body exactly.
- **Starting the dev server before the first CLI seed on a fresh database.** The runtime auto-seeds the built-in default (`posts`, `pages`, category and tag taxonomies) if no seed is complete (Pitfall 4).
- **Interpolating anything except constant table names into SQL.** CLAUDE.md rule.
- **Using `any` in scripts.** Use `// @ts-check` with JSDoc typedefs, as `scripts/script-inventory.mjs` already does.

## Don't Hand-Roll

| Problem                                 | Don't Build                 | Use Instead                                                | Why                                                                                                                              |
| --------------------------------------- | --------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Markdown to Portable Text               | A regex or remark pipeline  | `markdownToPortableText` from `emdash/client`              | Same converter as EmDash CLI and MCP; keys, marks and `markDefs` shapes match what the admin editor expects.                     |
| Portable Text back to markdown for D-02 | A custom serializer         | `portableTextToMarkdown` from `emdash/client`              | Symmetric with the importer; the diff against the raw source is still independent evidence because the source text is untouched. |
| Upsert by slug, revisions, draft status | A SQL upsert                | `emdash seed --on-conflict update`                         | Uses `ContentRepository`, creates a live revision for published entries, leaves drafts without one.                              |
| Schema export and fresh rebuild         | A schema dumper             | `emdash export-seed --with-content all` plus `emdash seed` | Proven to reproduce identical rows and fields.                                                                                   |
| Type generation                         | Hand-written interfaces     | `emdash types` and the dev server's `emdash-env.d.ts`      | Generated from the live registry, includes repeater and select unions.                                                           |
| Frontmatter parsing                     | A split-on-`---` YAML guess | `yaml`                                                     | Tags are multi-line flow arrays in some files (agency-ops-hub, revlog).                                                          |

**Key insight:** every piece of this phase already exists in EmDash's CLI or client. The work is the schema definition, the source model, and the verifier. Custom conversion or write code adds risk without adding coverage.

## Common Pitfalls

### Pitfall 1: An option-less `multiSelect` is uneditable in the admin

**What goes wrong:** Tags show no controls in the entry editor, so success criterion 1 ("tags can be edited") fails.
**Why it happens:** The admin renders `multiSelect` as a checkbox group from `field.options` only. With none, it maps over an empty array: `const multiSelectOptions = Array.isArray(field.options) ? field.options : [];` followed by `multiSelectOptions.map((opt) => { ... Checkbox ...` [VERIFIED: node_modules/@emdash-cms/admin/dist/index.js:41205-41223]. Manifest options come only from `validation.options` or widget `options` [VERIFIED: node_modules/emdash/src/api/handlers/manifest.ts, `dbFieldDescriptor`]. There is no free-text chip input anywhere in the 1.3.1 admin bundle. The server accepts any string when no options exist (`z.array(z.string())`), so the CLI and API paths work; only the admin editor is broken.
**How to avoid:** Resolve Open Question 1 before the schema is locked. Recommended: populate `validation.options` with the sorted union of source tags (45 today), assert in the importer that every entry's tags are a subset.
**Warning signs:** An empty "Tags" fieldset in the admin; the Phase 1 gate "admin chip input accepts new values" is answered NO.

### Pitfall 2: A new stats row cannot be saved until a variant is chosen

**What goes wrong:** Clicking "Add Item" in the stats repeater and saving fails validation.
**Why it happens:** The repeater seeds every non-boolean, non-number sub-field with `""`: `newItem[sf.slug] = sf.type === "boolean" ? false : ... : ""` [VERIFIED: admin dist index.js, `RepeaterField` `handleAdd`]. The server's select schema is an enum, and I ran the shipped `generateZodSchema` against the prototype: `stats.0.variant: Invalid option: expected one of "default"|"green"|"accent"` for `""`, for a missing key, and for an unknown value.
**How to avoid:** Keep the sub-field `required: true` so the admin marks it required, and make the criterion 1 test explicitly add a row, pick a variant, and save. Do not make the sub-field optional (the type becomes `| null` and `""` still fails).
**Warning signs:** Save button errors on a freshly added row.

### Pitfall 3: `emdash seed` path semantics

**What goes wrong:** "unable to open database file", or a stray `uploads/` directory in the repo root.
**Why it happens:** `-d` and the positional seed path are both resolved against `--cwd` (`resolve(cwd, args.database)`); the default database is `./data.db`, not `./data/emdash.db`; the CLI does not create `data/`; and without `--skip-media` it runs `mkdir(uploadsDir, { recursive: true })` for `./uploads` [VERIFIED: node_modules/emdash/src/cli/commands/seed.ts:210-214; reproduced the SQLite error 14 with a missing directory this session].
**How to avoid:** `mkdirSync("data", {recursive:true})` first, always pass `-d ./data/emdash.db --cwd <repo>` and `--skip-media`, and give the seed an absolute path.

### Pitfall 4: Dev server before first seed creates the wrong schema

**What goes wrong:** `posts`, `pages`, `category` and `tag` appear in the database and in the exported seed.
**Why it happens:** On first request with no `emdash:seed_complete` and setup not done, the runtime applies the user seed or the built-in default (`posts`, `pages`) [VERIFIED: node_modules/emdash/src/emdash-runtime.ts ~1861-1880, node_modules/emdash/src/seed/default.ts]. A CLI seed with collections sets `emdash:seed_complete=true` first (confirmed in the scratch DB: `emdash:seed_complete=true`, no `ec_posts`, no `ec_pages`).
**How to avoid:** Run the CLI seed before any server start on a fresh database. Note the taxonomy definitions `category` and `tag` (collections: `["posts"]`) come from migrations regardless and appear in `export-seed`; they are harmless and re-apply cleanly.

### Pitfall 5: Menus and settings are overwritten on every seed run

**What goes wrong:** Admin edits to the nav menu or settings vanish after a re-import.
**Why it happens:** Menu items are deleted and reinserted for every menu in the seed regardless of `--on-conflict`: `target.deleteFrom("_emdash_menu_items").where("menu_id", "=", id)` then insert [VERIFIED: node_modules/emdash/src/seed/apply.ts:1210-1216]. Settings are overwritten under `update`.
**How to avoid:** Do the admin nav and settings checks, then re-run the import to restore the seeded state, then run the verifier and export the seed. Never export the seed from a database that holds test edits.

### Pitfall 6: Published to draft through a re-run leaves a live revision

**What goes wrong:** If a markdown file flips to `draft: true` after being imported as published, the row becomes `status = 'draft'` but keeps `live_revision_id` and `published_at` (observed in the scratch DB). There are zero draft files today, so this is an edge case.
**How to avoid:** Document it. For a clean state, rebuild the database (`rm -rf data`, re-run). Prove "drafts still drafts" with a synthetic fixture in a throwaway database: a new draft entry was created with `status = 'draft'`, `published_at` null, no live or draft revision.

### Pitfall 7: Every re-run adds a revision per published entry

**What goes wrong:** Revision history grows (28 revisions after two runs for 14 entries) and noise appears in Phase 6's "restore a revision" test.
**How to avoid:** Acceptable for Phase 2. Note it, and consider rebuilding the database before the final export. The importer could skip entries whose data already matches, but that adds code for a cosmetic gain.

### Pitfall 8: Booleans read back as 0 and 1

**What goes wrong:** `show_availability` is stored as INTEGER (`0`), and the generated type says `boolean`.
**Why it happens:** The zod generator comment states: "`deserializeValue` never converts them back, so reads return numbers." [VERIFIED: node_modules/emdash/src/schema/zod-generator.ts boolean case]. Scratch DB: `show_availability` stored as `0`, `typeof` integer.
**How to avoid:** The verifier compares `Boolean(stored) === showAvailability`. Phase 3's adapter must coerce with `Boolean()`.

### Pitfall 9: The converter is line-based and treats `_x_` as italics

**What goes wrong:** A wrapped paragraph becomes two blocks; plain-text underscores such as `snake_case` become emphasis; italics round-trip as `_x_`, not `*x*`.
**Why it happens:** `markdownToPortableText` makes one block per non-blank line, and its inline regex is `/(\*\*(.+?)\*\*)|(_(.+?)_)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))|(~~(.+?)~~)/g` [VERIFIED: node_modules/emdash/src/client/portable-text.ts:172-173].
**How to avoid:** Current sources are safe: I checked that no body has underscores outside backticks, no wrapped lines, no lists, no H3, no code fences, no italics. Inline code containing `*` or `_` (for example `astro.config.*`, `node_exporter`) matches the backtick alternative first. The strict D-02 diff is what catches any future hazard; keep it strict and add a converter test over all 13 files.

### Pitfall 10: Types need a running server, and there are two artifacts

**What goes wrong:** The plan assumes an offline `emdash types`.
**Why it happens:** `emdash types` calls `client.schemaTypes()` over HTTP (`GET /schema?format=typescript`) and writes `.emdash/types.ts` plus `.emdash/schema.json`; it authenticates by dev bypass only for localhost [VERIFIED: node_modules/emdash/src/cli/commands/types.ts, client-factory.ts, client/transport.ts:87-96]. Separately the dev server writes `emdash-env.d.ts` (project root) containing the `declare module "emdash" { interface EmDashCollections ... }` augmentation that makes `getEmDashCollection("projects")` typed [VERIFIED: node_modules/emdash/src/schema/zod-generator.ts `generateTypesFile`; astro/integration/dev-typegen.ts]. The two files differ: the CLI output has interfaces only and no module augmentation.
**How to avoid:** One human gate: the user starts `astro dev`; then run `npx emdash types` and confirm `emdash-env.d.ts` appears. Commit both (CONTEXT D-13 names only `.emdash/types.ts`; `emdash-env.d.ts` is what Phase 3 needs for typed queries). Run `npx astro check` afterward because `tsconfig.json` includes `**/*`.

### Pitfall 11: `export-seed` output handling and dropped `url`

**What goes wrong:** Redirecting stdout captures progress noise, or the exported seed lacks the site URL.
**Why it happens:** The seed JSON is stdout, diagnostics go to stderr [VERIFIED: node_modules/emdash/src/cli/commands/export-seed.ts]; the exported settings in the scratch run contained only `seo`, `social`, `tagline`, `title` (the `url` I seeded was dropped, so a fresh apply reported 4 settings, not 5).
**How to avoid:** Use `> .emdash/seed.json` with stderr left on the terminal. Set the site URL through `EMDASH_SITE_URL` (Phase 5 gate h) rather than expecting the seed to carry it. Content order in the export follows `created_at` desc, not slug; regenerate once at close.

### Pitfall 12: CLAUDE.md SQL rule applies to the verifier

**What goes wrong:** String-built SQL in a script.
**How to avoid:** Constant table names, bound `?` values, read-only handle (Pattern 3). `execFileSync` with an argument array, never a shell string.

### Pitfall 13: Source normalization that the report must state

**What goes wrong:** False diffs, or hidden ones.
**How to avoid:** Document and apply these explicitly: `statusVariant` absent maps to "default"; stats `variant` absent maps to "default"; About `Cell.variant` absent maps to "default" in storage, and Phase 3 maps "default" back to unset so `data-variant` stays unset; `draft: true` maps to status "draft"; dates compared as exact strings (`String(fm.date)` is safe because every date is quoted in the frontmatter; the verifier should still throw if `yaml` returns a non-string). Body: `portableTextToMarkdown(blocks).trim()` equals the raw body trimmed.

### Pitfall 14: Template literals on the About page are out of scope

**What goes wrong:** Someone tries to move the H1 ("Designer who ended up in the engine bay.") or "If the work here is interesting, reach out." into the entry.
**How to avoid:** Both are hard-coded in `src/pages/about.astro`, not in `about.ts` or `about.md`. D-03 scope is what `src/data/about.*` holds. Leave them.

## Code Examples

### Tag options derived from sources (recommended)

```js
// Derive stable options so every entry's tags are valid enum members
const tagOptions = [...new Set(sources.projects.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b));
// schema field:
{ slug: "tags", label: "Tags", type: "multiSelect", validation: { options: tagOptions } }
```

Server-side validation then rejects unknown tags (checked with the shipped zod generator: `tags.0: Invalid option: expected one of "A"|"B"`). The admin checkbox label shows only the first character uppercased (`value.charAt(0).toUpperCase() + value.slice(1)`), which is cosmetic; stored values are unchanged. [VERIFIED: node_modules/emdash/src/api/handlers/manifest.ts]

### Repeater field definition

```js
// Source: seed validate.ts requires sub-fields under validation.subFields; sub-field select options are a string[]
{ slug: "stats", label: "Stats", type: "repeater", validation: { subFields: [
  { slug: "label",   type: "string", label: "Label",   required: true },
  { slug: "value",   type: "string", label: "Value",   required: true },
  { slug: "variant", type: "select", label: "Variant", required: true, options: ["default", "green", "accent"] },
] } }
```

### Project entry mapping

```js
{
  id: slug, slug,                                     // seed-local id; EmDash mints the real id
  status: fm.draft ? "draft" : "published",
  data: {
    title: fm.title, date: String(fm.date), category: fm.category,
    project_status: fm.status, status_variant: fm.statusVariant ?? "default",
    surface: fm.surface, time_label: fm.timeLabel, period: fm.period, tags: fm.tags,
    summary: fm.summary, sub: fm.sub,
    stats: fm.stats.map((s) => ({ label: s.label, value: s.value, variant: s.variant ?? "default" })),
    body: markdownToPortableText(body),
  },
}
```

### Seed export and fresh rebuild

```bash
node_modules/.bin/emdash export-seed -d ./data/emdash.db --with-content all > .emdash/seed.json
mkdir -p /tmp-or-scratch/fresh/data
node_modules/.bin/emdash seed "$PWD/.emdash/seed.json" -d ./data/emdash.db --cwd /scratch/fresh --skip-media
# then compare rows (ignoring id and timestamp columns) with the verifier pointed at the fresh DB
```

### Draft fixture test (node:test)

```js
// Build a seed with one entry status "draft" in a throwaway cwd, apply it, then assert:
//   status = 'draft', published_at IS NULL, live_revision_id IS NULL
```

## State of the Art

| Old Approach                            | Current Approach                                               | When Changed       | Impact                                                |
| --------------------------------------- | -------------------------------------------------------------- | ------------------ | ----------------------------------------------------- |
| Astro glob collection + zod frontmatter | EmDash collections with seed-defined fields, content in SQLite | This migration     | Schema lives in a seed; types come from the registry. |
| Frontmatter `draft: boolean`            | Native entry status draft or published                         | EmDash 1.x         | Import maps `draft` to `status`.                      |
| Free-text tags array                    | `multiSelect` with configured options (admin)                  | EmDash 1.3.1 admin | See Pitfall 1.                                        |

**Deprecated/outdated:**

- Repeater sub-fields declared as `fields` on the seed field: ignored with a warning; they must be under `validation.subFields`. [VERIFIED: node_modules/emdash/src/seed/validate.ts repeater warning]
- CLAUDE.md "Adding a project" markdown workflow: stale after Phase 3 (DOCS-03).

## Assumptions Log

| #   | Claim                                                                                                                                                                                                          | Section                     | Risk if Wrong                                                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| A1  | `astro dev` plus dev-bypass (`/_emdash/api/setup/dev-bypass`) works with the current `astro.config.mjs` for the local admin session. Code read and Phase 1 ran preview; dev mode was not run here (user rule). | Pitfall 10, Validation      | Local admin needs the preview plus setup wizard plus a virtual or real passkey instead.                      |
| A2  | The admin's Portable Text editor opens, edits and saves the 3,870-byte catalog-cms body without corrupting marks or links (the criterion 1 test).                                                              | Summary, Validation         | If it fails, D-01 is at risk and needs escalation before import. This is exactly what the human test is for. |
| A3  | Seed `seo.titleSeparator` as an em dash with spaces (U+2014) preserves current titles (page title, a spaced U+2014, then "Zeik Cookson"); the copy rule says otherwise but the deferred item says parity keeps them.                         | Open Question 2             | Either a parity regression in Phase 3 or an unintended copy decision made in Phase 2.                        |
| A4  | `tagline` should equal the Layout default meta description text so Phase 3 can fall back to it.                                                                                                                | Open Question 2             | Meta description parity breaks if Phase 3 chooses a different source.                                        |
| A5  | Seeding `social.github` and `social.linkedin` from the About contact hrefs is acceptable duplication (nothing renders Social in v1).                                                                           | Open Question 2             | Drift between contacts and Social; or an empty Social page if skipped.                                       |
| A6  | `emdash types` works unattended against `astro dev` on localhost through the dev-bypass interceptor. Code read only.                                                                                           | Pitfall 10                  | A PAT from the admin is needed (`--token`).                                                                  |
| A7  | `node:test` and unflagged `.ts` import work on the exact 22.22.2 floor. Verified on 24.17.0 and 22.23.0 only.                                                                                                  | Standard Stack              | Scripts need `--experimental-strip-types` on the floor; low impact because `.nvmrc` is 24.                   |
| A8  | Committing `emdash-env.d.ts` and `.emdash/schema.json` alongside `.emdash/types.ts` is wanted. CONTEXT names only `types.ts`.                                                                                  | Pitfall 10, Open Question 3 | Phase 3 lacks typed queries, or the repo gains a generated file the user did not expect.                     |

## Open Questions

1. **Tags editor (BLOCKS the schema lock).**
   - What we know: D-09 says `multiSelect` with no options. The 1.3.1 admin only renders checkboxes from configured options, so tags would have no editor. API and agent writes accept any string when no options exist.
   - What's unclear: whether the user accepts "new tag means a schema edit".
   - Recommendation: `multiSelect` with options seeded from the 45 distinct existing tags (type stays `string[]`). Alternatives: a `repeater` of `{ tag }` rows (free-form in admin and for agents, but a card per tag and a different stored shape), or a comma-separated `string` (simplest to edit, adapter must split). Ask the user at plan time; planner should add a `checkpoint:decision`.

2. **Seeded General, Social, SEO values (D-14).**
   - What we know: Page templates build titles as the page title, a spaced U+2014 separator, then "Zeik Cookson" and a default description "DevOps and platform engineering portfolio. Infrastructure work from the homelab and beyond."; the favicon and fonts are static files.
   - Recommendation: `title: "Zeik Cookson"`, `tagline` = the Layout default description, `social.github` and `social.linkedin` from the contacts, `seo.titleSeparator` = `" — "` written as a JSON escape (parity, deferred copy decision). Do not seed `url` (not exported, and Phase 5 sets it from `EMDASH_SITE_URL`). Confirm A3 to A5 with the user.

3. **Which generated files to commit (SCHEMA-05).**
   - Recommendation: `.emdash/types.ts`, `.emdash/schema.json` and `emdash-env.d.ts`, since Phase 3 needs the augmentation.

4. **How to run the criterion 1 long-body test.**
   - Claude's discretion. Recommended: seed one draft entry `schema-check-longest-body` carrying the catalog-cms body, five stats rows and several tags into a scratch-purpose database, have the user edit and save it in the admin (including add-a-stats-row), then delete `data/` entirely and rebuild from the seed so no test residue or trash rows remain. The database is disposable and fully reproducible from scripts.

## Environment Availability

| Dependency                                  | Required By                                   | Available                        | Version                              | Fallback                                              |
| ------------------------------------------- | --------------------------------------------- | -------------------------------- | ------------------------------------ | ----------------------------------------------------- |
| Node                                        | scripts, EmDash CLI                           | yes                              | 24.17.0 (default), 22.23.0 via nvm   | none needed                                           |
| emdash CLI                                  | seed, export-seed, types                      | yes                              | 1.3.1 (`node_modules/.bin/emdash`)   | none                                                  |
| node:sqlite                                 | verifier                                      | yes                              | built in (ExperimentalWarning on 22) | `sqlite3` CLI 3.54.0 present, not needed              |
| sqlite3 CLI                                 | ad hoc inspection                             | yes                              | 3.54.0                               | not required                                          |
| Running local EmDash server (`astro dev`)   | admin test, `emdash types`, `emdash-env.d.ts` | not started (user rule)          | n/a                                  | **Human gate: ask the user before starting**          |
| `data/` directory                           | EmDash SQLite                                 | no, `data/` does not exist today | n/a                                  | `mkdirSync("data", {recursive:true})` in the importer |
| Baseline dir `~/portfolio-baseline/current` | report output                                 | yes (symlink to 2026-10-23)      | n/a                                  | create `phase2/` under it                             |

**Missing dependencies with no fallback:** none for the offline work.
**Missing dependencies with fallback:** the dev server is the only gated item; everything else runs unattended.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Framework          | `node:test` (built in), no install. The repo has no test runner today.                                  |
| Config file        | none, see Wave 0                                                                                        |
| Quick run command  | `node --test scripts/`                                                                                  |
| Full suite command | `node scripts/import-content.mjs && node scripts/verify-import.mjs && npx astro check && npm run build` |

### Phase Requirements to Test Map

| Req ID                  | Behavior                                                                         | Test Type                                    | Automated Command                                                                                      | File Exists? |
| ----------------------- | -------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------ |
| SCHEMA-01               | Field slugs non-reserved, `date` string with pattern, status mapping             | unit                                         | `node --test scripts/import-content.test.mjs` (asserts slugs against `RESERVED_FIELD_SLUGS`)           | Wave 0       |
| SCHEMA-01               | Seed validates                                                                   | smoke                                        | `emdash seed <seed> --validate`                                                                        | Wave 0       |
| SCHEMA-02               | Tags subset of options; stats variants valid                                     | unit                                         | `node --test scripts/import-content.test.mjs`                                                          | Wave 0       |
| SCHEMA-02 / criterion 1 | Admin edits status, variant, time label, date, tags, stats rows; long body saves | manual-only (needs dev server and a browser) | human checkpoint, justification: no-dev-server rule and admin is JS UI                                 | n/a          |
| SCHEMA-03               | About holds role, flag, cells, stack, contacts, body                             | integration                                  | `node scripts/verify-import.mjs` (about section)                                                       | Wave 0       |
| SCHEMA-04               | Menu has 3 items; settings keys present                                          | integration                                  | `node scripts/verify-import.mjs` (menu and settings section)                                           | Wave 0       |
| SCHEMA-04 / criterion 2 | Nav and settings editable in admin                                               | manual-only (same checkpoint)                | human checkpoint                                                                                       | n/a          |
| SCHEMA-05               | Types exist, typecheck                                                           | smoke                                        | `test -f .emdash/types.ts && test -f emdash-env.d.ts && npx astro check`                               | Wave 0       |
| MIGR-01                 | Run twice, 13 projects, 1 about, no duplicates, slugs equal file names           | integration                                  | `node scripts/import-content.mjs && node scripts/import-content.mjs && node scripts/verify-import.mjs` | Wave 0       |
| MIGR-01                 | Draft fixture is created as draft                                                | unit                                         | `node --test scripts/import-content.test.mjs` (throwaway DB)                                           | Wave 0       |
| MIGR-02                 | About copy identical                                                             | integration                                  | `node scripts/verify-import.mjs`                                                                       | Wave 0       |
| MIGR-03                 | Zero differences across copy, dates, order, tags, stats, status                  | integration                                  | `node scripts/verify-import.mjs` (exit 0, JSON report written)                                         | Wave 0       |
| MIGR-03                 | Verifier fails when a field differs                                              | unit                                         | `node --test` mutates one field in a throwaway DB and expects exit 1                                   | Wave 0       |
| MIGR-04                 | Exported seed rebuilds identical schema and content in a fresh DB                | integration                                  | export, apply to fresh cwd, run verifier against it                                                    | Wave 0       |

### Sampling Rate

- **Per task commit:** `node --test scripts/`
- **Per wave merge:** import twice then `node scripts/verify-import.mjs`
- **Phase gate:** full suite green, plus the human admin checkpoint recorded, before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `scripts/import-content.test.mjs`: converter round trip over all 13 files and about.md, draft fixture, tags subset, reserved-slug check
- [ ] `scripts/fixtures/`: draft-status fixture
- [ ] `scripts/lib/schema.mjs` and `scripts/lib/sources.mjs`
- [ ] devDependency `yaml`

## Security Domain

### Applicable ASVS Categories

| ASVS Category           | Applies                                                           | Standard Control                                                                                 |
| ----------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| V2 Authentication       | no (admin passkeys are Phase 5; dev-bypass is DEV-only and local) | n/a                                                                                              |
| V3 Session Management   | no                                                                | n/a                                                                                              |
| V4 Access Control       | no                                                                | n/a                                                                                              |
| V5 Input Validation     | yes                                                               | `validateSeed` (runs inside `emdash seed`), EmDash zod field schemas, select enums, date pattern |
| V6 Cryptography         | no                                                                | n/a                                                                                              |
| V12 Files and Resources | partial                                                           | seed path is absolute, temp dir from `mkdtempSync`; `--skip-media` avoids stray writes           |
| V14 Configuration       | yes                                                               | no secrets in the seed; report written outside the repo; no `url` setting committed              |

### Known Threat Patterns for this stack

| Pattern                                                         | STRIDE                   | Standard Mitigation                                                                                                                                                         |
| --------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SQL injection in the verifier                                   | Tampering                | Constant table names, bound `?` values, read-only handle (CLAUDE.md rule)                                                                                                   |
| Command injection through the CLI wrapper                       | Elevation of privilege   | `execFileSync` with an argument array, no shell                                                                                                                             |
| Malicious link hrefs inside Portable Text                       | Tampering/XSS in Phase 3 | Source hrefs are three internal paths today; the verifier compares hrefs exactly, and Phase 3 renders through `PortableText`                                                |
| Dev-bypass admin user left in a database promoted to production | Elevation of privilege   | Dev-bypass only works when `import.meta.env.DEV` is true [VERIFIED: dev-bypass.ts]; the local `data/` is gitignored and Phase 5 starts from a fresh database and the wizard |
| Supply chain (new dependency)                                   | Tampering                | One dependency (`yaml`), legitimacy check OK, already in the lockfile                                                                                                       |
| Seed with content embedded in the server bundle                 | Information disclosure   | All embedded copy is already public; do not put drafts that should stay private in `.emdash/seed.json` (zero drafts today)                                                  |

## Project Constraints (from CLAUDE.md)

- TypeScript strict, no `any`. New scripts use `// @ts-check` with JSDoc and typed shapes (existing `scripts/script-inventory.mjs` is the pattern).
- No client-side JS unless there is no server-side alternative. Phase 2 touches no public pages.
- No inline styles. Not applicable.
- All SQL parameterized, view or table names from config constants, never interpolated.
- Design system and copy: no visual or copy changes in this phase. No em dashes in any copy (the seeded `titleSeparator` is the one parity exception, flagged for user confirmation in Open Question 2). Natural first-person prose is preserved by importing text verbatim.
- Node version 22 on Cloudflare Pages until Phase 5; project `engines` is `>=22.22.2`, local default 24. Scripts must run on both.
- Memory and user rules: do not start `astro dev` or `astro preview` without asking; do not `git push`; never fabricate dates (import uses the exact source strings and sets nothing from the import clock into `date`).
- Deployment: `main` still deploys to Cloudflare Pages; this work stays on branch `emdash-migration`.

## Sources

### Primary (HIGH confidence)

- Installed package source: `node_modules/emdash/src/seed/{types,validate,apply,default,load,ownership}.ts`, `schema/{types,zod-generator,env-types}.ts`, `cli/commands/{seed,export-seed,types,content}.ts`, `cli/client-factory.ts`, `client/{portable-text,transport,index}.ts`, `api/handlers/manifest.ts`, `settings/types.ts`, `emdash-runtime.ts`, `astro/integration/{dev-typegen,virtual-modules}.ts`, `astro/routes/api/{setup/dev-bypass,schema/index}.ts`
- Installed admin bundle: `node_modules/@emdash-cms/admin/dist/index.js` (multiSelect editor 41205, RepeaterField 23916, settings page strings)
- Scratch-database experiments this session (seed apply twice, draft fixture, export-seed round trip, converter round trip over all 13 bodies and about.md, zod validation probes, typegen output), in `/private/tmp/claude-502/-Users-zeikcookson-workspace-github-com-canklefark-portfolio/5cf800e9-be1d-4a99-9df6-14326b1aad3a/scratchpad/probe/`
- Repo sources read with Read: `src/data/about.ts`, `src/content.config.ts`, `src/components/Nav.astro`; plus `src/pages/about.astro`, `src/pages/projects/[...slug].astro`, `src/lib/projects.ts`, `src/layouts/Layout.astro`
- [EmDash building-emdash-site skill: schema-and-seed reference](https://raw.githubusercontent.com/emdash-cms/emdash/main/skills/building-emdash-site/references/schema-and-seed.md) (field types, repeater sub-fields, entry shape, menus, settings keys, seed locations)

### Secondary (MEDIUM confidence)

- [EmDash API reference](https://cdn.jsdelivr.net/gh/emdash-cms/emdash@HEAD/skills/wordpress-theme-to-emdash/references/emdash-api.md) and building-emdash-site skill listings (seed workflow, `--validate`, apply timing), consistent with the source read

### Tertiary (LOW confidence)

- None relied on.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH. Everything is already installed; one dependency checked.
- Architecture: HIGH. Import path, idempotency, export and rebuild were executed, not inferred.
- Pitfalls: HIGH for Pitfalls 1 to 9 and 11 (read from source or reproduced); MEDIUM for admin behavior in 1 and 2 because they were read from the bundle and zod-probed rather than driven in a browser.

**Research date:** 2026-10-26
**Valid until:** 2026-11-25 (EmDash 1.3.x is moving; re-check admin multiSelect behavior if the pin moves past 1.3.1)
