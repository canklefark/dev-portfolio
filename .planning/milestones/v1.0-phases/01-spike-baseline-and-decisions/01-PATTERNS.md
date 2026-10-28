# Phase 1: Spike, Baseline and Decisions - Pattern Map

**Mapped:** 2026-10-23
**Files analyzed:** 14 new/modified
**Analogs found:** 5 / 14 (the rest have no analog; use RESEARCH.md code examples, which were built and run in a scratch spike)

Scope note: the repo is a small Astro site with no tests, no CI, no Docker, no server code. All analog paths below are git-tracked (verified with `git ls-files`). `.planning/PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md` exist on disk but are NOT tracked in git (only `STATE.md` and `phases/**` are), so do not assume they are committed.

## File Classification

| New/Modified File                                                                    | Role          | Data Flow                                 | Closest Analog                                       | Match Quality         |
| ------------------------------------------------------------------------------------ | ------------- | ----------------------------------------- | ---------------------------------------------------- | --------------------- |
| `astro.config.mjs` (modify)                                                          | config        | build-time                                | itself (`astro.config.mjs` lines 1-7)                | exact (additive edit) |
| `package.json` (modify)                                                              | config        | build-time                                | itself (lines 5-7, 14-16)                            | exact (additive edit) |
| `package-lock.json` (modify)                                                         | config        | build-time                                | itself                                               | exact                 |
| `.gitignore` (modify)                                                                | config        | n/a                                       | itself                                               | exact                 |
| `src/live.config.ts` (new)                                                           | config        | request-response (live collection loader) | `src/content.config.ts`                              | role-match            |
| `scripts/script-inventory.mjs` (new)                                                 | utility       | batch / transform (file-I/O)              | none (`scripts/log.sh` is only a loose style analog) | no analog             |
| `.planning/guards/script-allowlist.json` (new)                                       | config / data | transform output                          | none                                                 | no analog             |
| `Dockerfile` (new)                                                                   | config        | build                                     | none                                                 | no analog             |
| `.dockerignore` (new)                                                                | config        | build                                     | `.gitignore`                                         | partial               |
| `.nvmrc` (new)                                                                       | config        | n/a                                       | none                                                 | no analog             |
| `.npmrc` (new)                                                                       | config        | n/a                                       | none                                                 | no analog             |
| `.planning/PROJECT.md` (modify, Key Decisions table)                                 | doc           | n/a                                       | itself (lines 55-62)                                 | exact                 |
| `~/portfolio-baseline/<date>/{dist,inventory.json,MANIFEST.txt}` (new, outside repo) | artifact      | file-I/O                                  | none                                                 | no analog             |
| `data/`, `.emdash/migrations.json` (gitignore entries only)                          | config        | n/a                                       | `.gitignore`                                         | exact                 |

## Pattern Assignments

### `astro.config.mjs` (config, build-time) - modify in place

**Analog:** the current file. Keep the `// @ts-check` header, the `defineConfig` shape, and the `site` value unchanged.

**Current file** (`astro.config.mjs` lines 1-7):

```js
// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://dev.zeikcookson.com",
});
```

**Additive target** (from RESEARCH.md "astro.config.mjs", verified to build and serve): add imports `node from "@astrojs/node"`, `react from "@astrojs/react"`, `emdash, { local } from "emdash/astro"`, `{ sqlite } from "emdash/db"`; add `output: "static"`, `adapter: node({ mode: "standalone" })`, and `integrations: [react(), emdash({ database: sqlite({ url: "file:./data/emdash.db" }), storage: local({ directory: "./data/uploads", baseUrl: "/_emdash/api/media/file" }) })]`.

Constraints for the planner: `output` must be `"static"` in Phase 1; DB and uploads paths must be static relative strings (baked at build, not `process.env` at runtime). Style: double quotes, 2-space indent, trailing commas (matches existing files).

---

### `package.json` (config) - modify in place

**Analog:** the current file. Existing conventions: 2-space indent, caret ranges, alphabetical dependency keys, `@astrojs/check` and `typescript` in `devDependencies`.

**Lines to change** (`package.json` lines 5-7 and 14-16):

```json
  "engines": {
    "node": ">=22.12.0"
  },
  ...
  "dependencies": {
    "astro": "^6.2.2"
  },
```

Target: `engines.node` `>=22.16.0`; dependencies `@astrojs/node ^10.1.4`, `@astrojs/react ^5.0.7`, `astro ^6.4.8`, `emdash ^1.3.1`, `react ^19.3.1`, `react-dom ^19.3.1`. Scripts block stays untouched. Install with the explicit-major command from RESEARCH.md (bare names resolve to the Astro 7 line). Gate the first `npm install` with a human-verify checkpoint per the Package Legitimacy Audit.

---

### `.gitignore` (config) - modify in place

**Analog:** current file, section-comment style (`# build output`, `# generated types`, ...).

**Existing style** (`.gitignore` lines 1-4):

```
# build output
dist/
# generated types
.astro/
```

Add a commented block in the same style for runtime data: `data/` and `.emdash/migrations.json`. Do NOT ignore `.emdash/` wholesale (SCHEMA-05 will commit generated types there). Note `.gitignore` line 32 (`.vscode/  `) has trailing spaces; do not "fix" it.

---

### `src/live.config.ts` (config, live collection loader)

**Analog:** `src/content.config.ts` (same role: Astro collections config module, same `collections` export convention, coexists with it).

**Imports and export pattern** (`src/content.config.ts` lines 1-3, 30):

```ts
import { defineCollection } from "astro:content";
import { z } from "zod";
import { glob } from "astro/loaders";
...
export const collections = { projects };
```

**Target** (RESEARCH.md "src/live.config.ts"):

```ts
import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

export const collections = {
  _emdash: defineLiveCollection({ loader: emdashLoader() }),
};
```

Do not touch `src/content.config.ts`; the file-based `projects` collection stays until Phase 3. TypeScript strict, no `any`.

---

### `.dockerignore` (config)

**Analog (partial):** `.gitignore` for the line-per-entry, optional comment style. Contents come from RESEARCH.md: `node_modules`, `dist`, `data`, `.git`, `.astro`, `.planning`, `.claude`, `.agents`, `.cursor`, `.vscode`, `.impeccable`, `.env`, `.env.*`. Do not exclude `src/content`. Do not use a blanket `*.md` or `**/*.md` rule.

---

### `scripts/script-inventory.mjs` (utility, batch/transform)

**Analog:** none. `scripts/log.sh` is the only file in `scripts/` and is a zsh/bash helper for the logbook; it shares nothing with a Node ESM tool. Only soft conventions to borrow from it:

- `usage:` message to stderr and non-zero exit when args are missing (`scripts/log.sh` lines 18-21):

```bash
if [[ -z "$note" ]]; then
  echo 'usage: log [--tags "TAG1,TAG2"] [--title "Custom title"] "Your note"' >&2
  return 1
fi
```

- Error messages prefixed `error:` on stderr (lines 24-25, 48-49).

Use the tested script in RESEARCH.md "Inventory script (tested; keep in repo for GUARD-01 reuse)" as the base. Required adjustments from the research text: drop the raw HTML hash; add the `normalize` helper (`html.replace(/>\s+</g, "><")`); add allowlist derive and compare subcommands; handle the `fetch <baseUrl>` mode used in the Docker verify step; classify `application/ld+json` as data. `package.json` has `"type": "module"`, so `.mjs` with `node:` imports is correct. Project rule: TypeScript strict does not apply to `.mjs`, but keep `// @ts-check` consistent with `astro.config.mjs` if JSDoc types are added.

---

### `.planning/guards/script-allowlist.json` (derived data)

**Analog:** none. Use the allowlist shape in RESEARCH.md ("Allowlist shape"): `generatedFrom`, `inlineHashes.{classic,module}`, `routes[route] = { script, module, external, modulepreload }`. Five known hashes (3 classic, 2 module) and 17 routes; `/404` has 5 scripts and 2 modules, all others 4 and 1. Derived from the baseline, never hand-edited. Path is a planner choice.

---

### `Dockerfile` (config, build)

**Analog:** none in the repo. Copy the multi-stage Dockerfile from RESEARCH.md "Dockerfile (built and run on Node 24 and Node 22.16.0)" verbatim: `ARG NODE_VERSION=24`, `base` / `build` / `prod-deps` / `runtime` stages, `COPY --from=build /app/.emdash ./.emdash`, `RUN mkdir -p data node_modules/.astro && chown -R node:node ...`, `USER node`, `VOLUME /app/data`, `CMD ["node", "./dist/server/entry.mjs"]`. Requires `.npmrc` to be present in the build context so `engine-strict` applies inside Docker (it is not excluded by the `.dockerignore` list above, but `COPY package.json package-lock.json ./` in the research version does not copy `.npmrc`; planner should decide whether to add it to those `COPY` lines).

---

### `.nvmrc` and `.npmrc` (config)

**Analog:** none. Contents are single-line: `.nvmrc` = `24`; `.npmrc` = `engine-strict=true` (without it `engines` only warns, verified in RESEARCH.md Pitfall 10).

---

### `.planning/PROJECT.md` (doc) - append decisions

**Analog:** its own Key Decisions table (lines 55-62). Match the 3-column table format and the `Outcome` column; the Dokploy row already exists as `— Pending`, so update outcomes rather than duplicating it.

**Existing format** (`.planning/PROJECT.md` lines 57-61):

```
| Decision                                                            | Rationale                                                                  | Outcome   |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------- |
| Self-host on Dokploy (Node + SQLite) instead of Cloudflare Workers  | Personal project, simpler self-hosting; EmDash also supports Node + SQLite | — Pending |
```

New rows come from RESEARCH.md "Spike Findings and Decisions to Record" table (items 1-5, plus the audit-advisory decision from Open Question 1). Copy values from that table, not from memory. Copy style: no em dashes in new copy (user memory rule); the existing `— Pending` literal is legacy, replace it with plain text such as "Confirmed" or "Good". PROJECT.md is untracked, so edits will not appear in `git status`.

---

## Shared Patterns

### Verification after every change (parity)

**Source:** RESEARCH.md Pattern 2, implemented by `scripts/script-inventory.mjs`
**Apply to:** every plan that changes `package.json`, `astro.config.mjs`, or the Docker build.
Compare whitespace-normalized HTML (`>\s+<` collapsed) and the inventory JSON (counts plus inline sha256 hashes) against `~/portfolio-baseline/<date>/`. Never compare raw bytes or raw HTML hashes.

### Sequencing and branch safety

**Source:** CONTEXT.md D-10, D-12, D-13
**Apply to:** all plans.
Capture baseline on `main` before any dependency change (`npm ci`, `npm run build`, copy `dist/`, write `MANIFEST.txt` with git SHA, node, npm, astro versions). Then `git switch -c emdash-migration`. No `git push`. No `npm run dev` / `astro dev`; `astro preview` and curl are allowed only in Phase 1 (D-06).

### Code rules from CLAUDE.md

**Source:** `/Users/zeikcookson/workspace/github.com/canklefark/portfolio/CLAUDE.md` "Code Rules"
**Apply to:** `src/live.config.ts` and any `.ts`: TypeScript strict, no `any`. No client JS added to public pages. Do not edit CLAUDE.md in this phase (DOCS-01 is Phase 6).

### Code style conventions observed in repo

**Source:** `astro.config.mjs`, `src/content.config.ts`
**Apply to:** all new JS/TS: double quotes, semicolons, 2-space indent, trailing commas in multiline literals, ESM imports.

## No Analog Found

| File                                     | Role     | Data Flow        | Reason                                                                                                                                                   |
| ---------------------------------------- | -------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/script-inventory.mjs`           | utility  | batch/transform  | Only other script is `scripts/log.sh` (bash); no Node tooling exists. Use RESEARCH.md tested script.                                                     |
| `.planning/guards/script-allowlist.json` | data     | transform output | No generated guard data exists.                                                                                                                          |
| `Dockerfile`                             | config   | build            | No container tooling in repo. Use RESEARCH.md Dockerfile.                                                                                                |
| `.nvmrc`, `.npmrc`                       | config   | n/a              | None exist (CONTEXT.md confirms no `.nvmrc`).                                                                                                            |
| `~/portfolio-baseline/**`                | artifact | file-I/O         | Outside the repo by design (D-10).                                                                                                                       |
| Tests / CI                               | test     | n/a              | No test files or `.github/` exist; GUARD-01 CI is a later phase. Verification in Phase 1 is by command (build, inventory compare, curl), not test files. |

## Metadata

**Analog search scope:** whole repo via `git ls-files` (excluding `public/fonts`), plus `astro.config.mjs`, `package.json`, `.gitignore`, `scripts/log.sh`, `src/content.config.ts`, `tsconfig.json`, `.planning/PROJECT.md`
**Files scanned:** ~75 tracked files listed, 8 read in full
**Tracked-source check:** all named analogs confirmed in `git ls-files` except `.planning/PROJECT.md` (untracked, noted above)
**Pattern extraction date:** 2026-10-23
