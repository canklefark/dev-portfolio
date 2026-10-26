# Phase 2: Content Model and Import - Pattern Map

**Mapped:** 2026-10-26
**Files analyzed:** 11 new or modified
**Analogs found:** 8 / 11 (all analogs verified git-tracked)

The codebase has no existing seed, importer, schema registry or test runner. The only script analog is `scripts/script-inventory.mjs`, which sets the conventions for every new `scripts/*.mjs` file. Content-shape analogs are the current source files that the new schema mirrors.

## File Classification

| New/Modified File                                            | Role                 | Data Flow                    | Closest Analog                                                                  | Match Quality                            |
| ------------------------------------------------------------ | -------------------- | ---------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| `scripts/import-content.mjs`                                 | utility (CLI script) | batch / transform            | `scripts/script-inventory.mjs`                                                  | role-match                               |
| `scripts/verify-import.mjs`                                  | utility (CLI script) | batch / file-I/O (read-only) | `scripts/script-inventory.mjs` (`compare` and `check` commands)                 | exact (report, exit code, typedef style) |
| `scripts/lib/schema.mjs`                                     | config               | transform                    | `src/content.config.ts` + `src/data/about.ts`                                   | role-match (shape source)                |
| `scripts/lib/sources.mjs`                                    | utility              | file-I/O / transform         | `scripts/script-inventory.mjs` (`loadRoutes`, `walk`) + `src/content.config.ts` | role-match                               |
| `scripts/import-content.test.mjs`                            | test                 | batch                        | none (no test runner)                                                           | no analog                                |
| `scripts/fixtures/*`                                         | test fixture         | n/a                          | none                                                                            | no analog                                |
| `.emdash/seed.json`                                          | config (generated)   | batch                        | none; `scripts/script-allowlist.json` for committed generated JSON style        | partial                                  |
| `.emdash/types.ts`, `.emdash/schema.json`, `emdash-env.d.ts` | generated types      | n/a                          | none (generated)                                                                | no analog                                |
| `package.json` (add `yaml` devDependency)                    | config               | n/a                          | existing `package.json`                                                         | exact                                    |
| `.gitignore` (confirm `.emdash/` types are not ignored)      | config               | n/a                          | existing `.gitignore`                                                           | exact                                    |
| `astro.config.mjs`, `src/live.config.ts`                     | config               | n/a                          | read-only context, not modified                                                 | n/a                                      |

## Pattern Assignments

### `scripts/import-content.mjs` and `scripts/verify-import.mjs` (utility, batch)

**Analog:** `scripts/script-inventory.mjs`

**Header and imports** (lines 1-16): `// @ts-check` first, one-line purpose comment, `node:` prefixed imports, named fs imports.

```js
// @ts-check
// Per-route script inventory and whitespace-normalized parity compare for built HTML.
// usage: node scripts/script-inventory.mjs <command> ...  (run without arguments to list commands)
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
```

**Typing without `any`** (lines 18-27): JSDoc `@typedef` block at top, `@param`/`@returns` on every function, inline `/** @type {...} */` casts.

```js
/**
 * @typedef {{ route: string, ok: boolean, reason: string }} RouteResult
 * @typedef {{ usage: string, min: number, max: number, run: (args: string[]) => number | Promise<number> }} Command
 */
```

**Temp dir with cleanup** (lines 480-510): `mkdtempSync(join(tmpdir(), "script-inventory-"))` with `try { ... } finally { rmSync(tmp, { recursive: true, force: true }); }`. Reuse for the temp seed file in the importer (use prefix `portfolio-seed-`).

**Per-item report plus summary plus exit code** (lines 273-281, 560-573): verifier should mirror this output shape.

```js
function runCompare(baseline, candidate) {
  const results = compareDirs(baseline, candidate);
  for (const r of results) {
    console.log(r.ok ? `OK ${r.route}` : `DIFF ${r.route}: ${r.reason}`);
  }
  const identical = results.filter((r) => r.ok).length;
  console.log(`compare: ${identical}/${results.length} identical`);
  return identical === results.length ? 0 : 1;
}
```

**First-difference reporting** (lines 211-220): locate the first differing offset and show a short JSON-quoted slice of each side. Reuse for the body markdown diff (D-02).

```js
let i = 0;
while (i < x.length && i < y.length && x[i] === y[i]) i++;
const from = Math.max(0, i - 20);
const side = (/** @type {string} */ s) =>
  JSON.stringify(s.slice(from, from + 60));
```

**JSON artifact write** (lines 525, 553): `writeFileSync(out, JSON.stringify(x, null, 2) + "\n")`. Use for `~/portfolio-baseline/current/phase2/equality-report.json` (`mkdirSync(dirname(out), { recursive: true })` first, as at line 258).

**Entry point, usage and error handling** (lines 517-606, end of file):

```js
function usageExit(lines) {
  for (const line of lines)
    console.error(`usage: node scripts/script-inventory.mjs ${line}`);
  process.exit(2);
}
// ...
try {
  process.exitCode = await command.run(args);
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
```

Use `process.exitCode`, never `process.exit(1)` mid-run, so the JSON report is flushed. Exit 2 for usage, 1 for differences or errors.

**Do not copy:** this file is a single multi-command CLI. The two new scripts are single-purpose (D-12), so skip the `COMMANDS` table. `import-content.mjs` and `verify-import.mjs` each need only a top-level `main()` returning an exit code.

**Importer-specific patterns with no codebase analog** (take from RESEARCH.md):

- Pattern 1 (execFileSync argument array, `mkdirSync("data")`, `--on-conflict update --skip-media`, `-d ./data/emdash.db --cwd <repo>`), RESEARCH lines 198-231.
- Pattern 2 (`markdownToPortableText` / `portableTextToMarkdown` from `emdash/client`), RESEARCH lines 238-244.
- Pattern 3 (verifier SQL: frozen constant table names, bound `?` values, `new DatabaseSync(path, { readOnly: true })`), RESEARCH lines 252-264. This satisfies the CLAUDE.md SQL rule.

---

### `scripts/lib/sources.mjs` (utility, file-I/O)

**Analog:** `scripts/script-inventory.mjs` `walk` and `loadRoutes` (lines 33-43, 138-149)

Copy the directory-walk and sorted-load shape, with a throw on empty input:

```js
function loadRoutes(dist) {
  const files = walk(dist).sort();
  if (files.length === 0) throw new Error(`no .html files under ${dist}`);
  ...
}
```

Apply to `src/content/projects/*.md` (expect exactly 13; slug is the file name without `.md`).

**Source shape to normalize** (`src/content.config.ts` lines 7-27): this is the authoritative field list and defaults.

```ts
date: z.coerce.date(), title: z.string(), category: z.string(), status: z.string(),
statusVariant: z.enum(["accent", "green", "default"]).default("default"),
surface: z.string(), timeLabel: z.string(), period: z.string(), tags: z.array(z.string()),
summary: z.string(), sub: z.string(),
stats: z.array(z.object({ label: z.string(), value: z.string(), variant: z.enum(["default","green","accent"]).default("default") })),
draft: z.boolean().default(false),
```

Note `date` is `z.coerce.date()` today, but D-07 stores the exact source string. Parse with `yaml` and throw if `typeof fm.date !== "string"` (RESEARCH Pitfall 13). Tags span multi-line flow arrays (see `src/content/projects/revlog.md` lines 8-19), which is why `yaml` is needed instead of a split.

**About source** (`src/data/about.ts` lines 1-71): import the real exports (`role`, `showAvailability`, `cells`, `stack`, `contacts`) from plain Node by relative path rather than copying values. `Cell.variant` is optional (`"accent" | "green"`), so absent maps to `"default"` in storage. Body comes from `src/data/about.md` (no frontmatter, paragraphs only).

---

### `scripts/lib/schema.mjs` (config, transform)

**Analogs:** `src/content.config.ts` (project fields and enums), `src/data/about.ts` (union types become select options), `src/components/Nav.astro` (menu).

**Enum constants to lift verbatim** (single definition, reused by schema, importer and verifier):

```ts
// about.ts lines 1-7
StackLevel = "DAILY" | "PROFICIENT" | "FAMILIAR" | "LEARNING" | "NEXT"
ContactIcon = "email" | "github" | "linkedin"
// content.config.ts lines 12, 23
statusVariant: ["accent", "green", "default"]; stat variant: ["default", "green", "accent"]
```

**Menu source** (`src/components/Nav.astro` lines 8-12):

```ts
const links = [
  { id: "home", label: "Home", href: "/" },
  { id: "projects", label: "Projects", href: "/projects" },
  { id: "about", label: "About", href: "/about" },
] as const;
```

Map to `menus: [{ name: "primary", label: "Primary", items: [{ type: "custom", label, url: href }] }]`.

Field definitions, repeater `validation.subFields` placement, tags options derivation and reserved slug rule come from RESEARCH.md "Proposed schema" (lines 267-301) and Code Examples (lines 409-429). Use JSDoc typedefs, no `any`.

---

### `package.json` (modify)

Add `yaml` as a devDependency only (`npm install --save-dev yaml@^2.8.4`). Optionally add npm scripts only if the existing file already exposes script entries; check `package.json` `scripts` and match its naming before adding.

### `.emdash/*` and `emdash-env.d.ts` (generated, committed)

`.gitignore` ignores only `data/` and `.emdash/migrations.json` in the EmDash block, so `.emdash/seed.json`, `.emdash/types.ts` and `.emdash/schema.json` are committable as-is. `emdash-env.d.ts` is not ignored either. `.astro/` is ignored (separate generated types), do not confuse the two. `data/` is gitignored, so the SQLite file and any scratch databases never get committed.

For committed generated JSON conventions, `scripts/script-allowlist.json` is 2-space indented with trailing newline and a `generatedFrom` provenance field; `emdash export-seed` output will not match that, so leave it as exported.

## Shared Patterns

### `// @ts-check` plus JSDoc, no `any`

**Source:** `scripts/script-inventory.mjs` lines 1, 18-27, 116 (inline `/** @type {string} */` cast)
**Apply to:** every new `.mjs` file, including `scripts/lib/*.mjs` and the test file.

### Exit-code and error handling

**Source:** `scripts/script-inventory.mjs` lines 601-606
**Apply to:** `import-content.mjs`, `verify-import.mjs`. Single try/catch at the entry point, `error: <message>` to stderr, `process.exitCode`.

### Parameterized SQL, config constants for names

**Source:** CLAUDE.md "Code Rules" plus RESEARCH Pattern 3
**Apply to:** `verify-import.mjs` and any SQL in tests. Frozen constant table-name object, bound `?` values, read-only handle, `execFileSync` with an array (never a shell string).

### Temp resources cleaned in `finally`

**Source:** `scripts/script-inventory.mjs` lines 480-510
**Apply to:** importer temp seed, test throwaway databases.

### Copy and design rules

**Source:** CLAUDE.md, user memory
**Apply to:** all content. Import copy verbatim, no em dash edits. The one parity exception is `seo.titleSeparator` (RESEARCH Open Question 2). Never push, never start `astro dev` or `astro preview` without asking (the two human gates).

## No Analog Found

| File                                                         | Role      | Data Flow | Reason                                                                                                                                            |
| ------------------------------------------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/import-content.test.mjs`                            | test      | batch     | Repo has no test runner or tests. Use `node:test` per RESEARCH Validation Architecture; keep the `@ts-check` header style from the script analog. |
| `scripts/fixtures/` (draft fixture, converter hazards)       | fixture   | n/a       | No fixtures exist.                                                                                                                                |
| `.emdash/types.ts`, `.emdash/schema.json`, `emdash-env.d.ts` | generated | n/a       | Produced by `emdash types` and the dev server (human gate); never hand-written.                                                                   |

## Notes for the Planner

- Phase 3 will replace `src/lib/projects.ts` (`getCollection` with `!data.draft` filter and date-desc sort, lines 6-8). The schema field names chosen in Phase 2 (`project_status`, `status_variant`, `time_label`) are what that adapter maps from. Phase 2 must not edit it.
- `astro.config.mjs` and `src/live.config.ts` already wire EmDash (`sqlite({ url: "file:./data/emdash.db" })`, `emdashLoader()`). The importer must target the same `./data/emdash.db` path relative to repo root.
- Existing parity tooling reads from `~/portfolio-baseline/`; write the equality report beside it under `current/phase2/`, outside the repo.

## Metadata

**Analog search scope:** all `git ls-files` entries outside `public/` and `.planning/` (scripts, src, config)
**Files scanned:** about 75 tracked files listed, 8 read in full or in part
**Pattern extraction date:** 2026-10-26
