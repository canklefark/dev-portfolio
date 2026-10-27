# Phase 5: Dokploy Deploy and Cutover - Pattern Map

**Mapped:** 2026-10-26
**Files analyzed:** 8 (3 new code files, 1 new evidence file, 4 modified)
**Analogs found:** 7 / 8 (all analog paths verified git-tracked)

This phase is mostly Dokploy, Cloudflare and EmDash configuration done by the user. The repo files below are the only code the planner assigns to plans. No new npm packages.

## File Classification

| New/Modified File                                                     | Role                  | Data Flow                                  | Closest Analog                                                                          | Match Quality                                         |
| --------------------------------------------------------------------- | --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `scripts/smoke-test.mjs` (new)                                        | utility (CLI script)  | request-response                           | `scripts/check-public-js.mjs`                                                           | role-match (same fetch, crawl, exit-code conventions) |
| `scripts/smoke-test.test.mjs` (new)                                   | test                  | request-response                           | `scripts/check-public-js.test.mjs` (header, node:test style); `scripts/parity.test.mjs` | role-match                                            |
| `.github/workflows/ci.yml` (modify)                                   | config (CI)           | batch                                      | itself (existing `verify` job)                                                          | exact                                                 |
| `.github/workflows/deploy.yml` (new)                                  | config (CI)           | event-driven (`workflow_run`) plus polling | `.github/workflows/ci.yml`                                                              | role-match                                            |
| `Dockerfile` (modify, build stage `ARG`)                              | config                | batch                                      | itself                                                                                  | exact                                                 |
| `.gitignore` (modify, only if gate e adopted)                         | config                | n/a                                        | itself (EmDash block at bottom)                                                         | exact                                                 |
| `.planning/phases/05-dokploy-deploy-and-cutover/05-EVIDENCE.md` (new) | doc (evidence record) | n/a                                        | `.planning/phases/04-agent-access/04-AGENT-ACCESS-PASS.md`                              | role-match                                            |
| `.planning/PROJECT.md` (modify, record D-10 acceptance)               | doc                   | n/a                                        | existing Spike Findings section                                                         | exact                                                 |

Not repo files (human-action or Dokploy/Cloudflare config, no analog needed): Dokploy preview and production Applications, volumes, domains, R2 backup schedule, Cloudflare Pages build settings and DNS, GitHub repo secrets (`DOKPLOY_URL`, `DOKPLOY_API_KEY`, `DOKPLOY_APP_ID`), passkey enrollment.

## Pattern Assignments

### `scripts/smoke-test.mjs` (utility, request-response)

**Analog:** `scripts/check-public-js.mjs` (445 lines)

**Header and conventions** (lines 1-9, 28-31): `// @ts-check` first line, a comment block stating purpose and `// usage:` line, Node built-ins imported with the `node:` prefix, JSDoc `@typedef` and `@param`/`@returns` types instead of TS, UPPER_SNAKE constants at top.

```js
// @ts-check
// Public-JS guard (GUARD-01): builds the site, ...
// usage: node scripts/check-public-js.mjs [--skip-build] [--out DIR]
import { spawn, spawnSync } from "node:child_process";
...
const HEALTH_PATH = "/_emdash/api/health";
const FETCH_TIMEOUT_MS = 15000;
```

**Project-link crawl, copy the regex exactly** (lines 104-114):

```js
function crawlSlugs(html) {
  const slugs = new Set(
    [...html.matchAll(/href="\/projects\/([a-z0-9-]+)\/?"/g)].map((m) => m[1]),
  );
  return [...slugs].sort();
}
```

(Research's skeleton uses a one-match `exec` variant of the same pattern; either is fine, but keep the character class `[a-z0-9-]+`.)

**Fetch with timeout and retry-on-not-ready** (lines 190-204, `waitForHealth`): `fetch(url, { signal: AbortSignal.timeout(N) })`, wrap in `try { ... } catch { /* not listening yet */ }`, loop to a deadline with a `sleep` helper. Reuse this shape for the attempts loop (default 10 attempts, 15 s apart) and catch network errors so a cold container does not crash the script.

**Exit and result convention** (lines 421-445): bad args print `USAGE` to stderr and `process.exit(2)`; the run returns `string | null` (null means pass, string is the failure reason); final line prints `check-public-js: PASS` or `check-public-js: FAIL (reason)`; `process.exitCode = failure === null ? 0 : 1`. Copy this: export `check(base)` returning `string | null`, print `smoke-test: PASS` / `smoke-test: FAIL (reason)`, set `process.exitCode`. Guard the CLI entry so importing `check` from the test does not run the loop (for example `if (import.meta.url === pathToFileURL(process.argv[1]).href)`); the analog has no such guard because it is never imported.

**Error handling** (lines 431-439): `try { failure = await run(...) } catch (error) { console.error(\`error: ${error instanceof Error ? error.message : error}\`); failure = "unexpected error"; }`.

---

### `scripts/smoke-test.test.mjs` (test, request-response)

**Analog:** `scripts/check-public-js.test.mjs` (155 lines) for style; the picked-up glob is `scripts/*.test.mjs` (`package.json` `"test"`), so no config change is needed.

**Imports and header** (lines 1-16):

```js
// @ts-check
// ... one-line purpose
// run: node --test scripts/check-public-js.test.mjs
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { describe, it } from "node:test";
```

Use `describe`/`it` from `node:test` and `assert` from `node:assert/strict`. Helper functions carry JSDoc types (`@param {string} body`, `@returns {string}`), see `html()` at lines 20-26.

**Difference from the analog:** the analog shells out with `spawnSync(process.execPath, [...])`. For smoke-test, import `check` directly and drive it against a local `node:http` `createServer` bound to `127.0.0.1` port 0 (no existing test uses `node:http`, so this part follows research, Code Examples skeleton). Cases: healthy server (returns null), `/` 500 (reason names `/`), `/projects/` with no project link (reason "no project link"), project page 500 (reason names the path). Close the server in `after`/`finally`.

---

### `.github/workflows/ci.yml` (config, batch), append GUARD-02

**Analog:** itself. Current job, steps to extend (lines 14-24):

```yaml
steps:
  - uses: actions/checkout@v7
  - uses: actions/setup-node@v7
    with:
      node-version-file: .nvmrc
      cache: npm
  - run: npm ci
  - run: npm test
  # GUARD-01: builds, seeds a throwaway database, serves the Node build, fetches every public route
  - run: npm run check:public-js
  # Phase 5 appends `emdash migrate --check` (GUARD-02) and the post-deploy smoke test (GUARD-03) to this job.
```

Pattern to copy: one `# GUARD-NN: ...` comment line naming the guard and what it does, then a `- run:` step. Replace the trailing Phase 5 placeholder comment with the GUARD-02 step (research Pattern 3 / Code Examples; uses `$RUNNER_TEMP`, `--from-config`, temp DB seeded first, because `migrate --check` exits 1 with no database and 2 on an empty one). GUARD-03 does not go in this file (it lives in `deploy.yml`), so remove or reword the placeholder to avoid a stale pointer. Keep top-level `permissions: contents: read` and `on: push:`/`pull_request:` untouched. Optional steps from research (`git diff --exit-code -- .emdash/migrations.json`, amd64 `docker build`) go after the new step, only if the planner adopts gates d and e.

---

### `.github/workflows/deploy.yml` (config, event-driven)

**Analog:** `.github/workflows/ci.yml` for header and action pins.

**Copy from ci.yml:** `permissions: contents: read`, `actions/checkout@v7`, `actions/setup-node@v7` with `node-version-file: .nvmrc`, `runs-on: ubuntu-latest`, lowercase workflow `name:` (`ci`, so `deploy`), and the one-comment-per-step style.

**Not in any analog (use research, Code Examples "deploy.yml skeleton"):** `workflow_run` on `[ci]` filtered to `branches: [main]` plus `workflow_dispatch`, `concurrency: group: deploy, cancel-in-progress: false`, the `if:` on `conclusion == 'success'`, the Dokploy `application.deploy` POST with `x-api-key`, the `deployment.all` poll, then `node scripts/smoke-test.mjs https://dev.zeikcookson.com`. Dokploy response shapes are ASSUMED (A1, A2): verify in the instance Swagger before relying on the `jq` expression. Secrets only via `${{ secrets.* }}` env, never echoed. Alert-only: no rollback step (D-04). No `npm ci` is needed for the smoke step because the script uses only Node built-ins.

---

### `Dockerfile` (config), add build-arg (D-08)

**Analog:** itself, build stage (lines 7-11):

```dockerfile
FROM base AS build
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build
```

Insert `ARG EMDASH_SITE_URL` and `ENV EMDASH_SITE_URL=$EMDASH_SITE_URL` directly after `FROM base AS build`. Do not touch the `runtime` stage: it already creates and chowns the volume path and must stay as is (lines 22-24):

```dockerfile
RUN mkdir -p data node_modules/.astro && chown -R node:node data node_modules/.astro
USER node
VOLUME /app/data
```

The runtime `EMDASH_SITE_URL` comes from the Dokploy Environment tab, not the Dockerfile. Local `docker build` without the arg must still succeed (empty value).

---

### `.gitignore` (config), only if the manifest-drift gate is adopted

**Analog:** itself, lines at the bottom:

```
# EmDash runtime data (local SQLite and uploads) and per-build migration manifest
data/
.emdash/migrations.json
```

Remove only the `.emdash/migrations.json` line and fix the comment ("per-build migration manifest" no longer true). Leave `data/`, `.emdash/types.ts`, `.emdash/schema.json` alone. Note `.dockerignore` already excludes `data`.

---

### `.planning/phases/05-dokploy-deploy-and-cutover/05-EVIDENCE.md` (evidence record)

**Analog:** `.planning/phases/04-agent-access/04-AGENT-ACCESS-PASS.md`

Structure to copy: title `# Phase N: <topic> (evidence record)`; an opening paragraph stating the run date, what was run against which target, who performed each step (user versus executor), and that secrets are written only as `REDACTED`; a `## Results` table with one row per check (`| Check | Result |`, cells start `PASS`/`FAIL` then what was observed, error codes quoted); optional `## Procedure` with numbered R-steps that say "record X in the Y Result cell"; a "Not covered" note for anything skipped. Rows for this phase: preview parity (`parity: 17/17 identical`, `check` allowlist output), Host-header curl check (D-10), cutover log, passkeys 1 and 2 plus `needsSetup: false`, agent-token live `content_list` (D-12, closes Phase 4 W7), backup schedule, restore rehearsal compare (DEPLOY-05), recovery drill (ADMIN-03), host arch and RAM, Swagger-verified API shapes. Also record the wizard correction ("Sample content", not "Import") per research Pitfall 1. No em dashes.

---

### `.planning/PROJECT.md` (doc)

Add the D-10 residual-advisory acceptance next to the existing Spike Findings named gates (gate a). No code analog; match the surrounding gate wording. Do not edit `CLAUDE.md` Deployment section (Phase 6 DOCS-01).

## Shared Patterns

### Node script conventions (apply to `smoke-test.mjs` and its test)

**Source:** `scripts/check-public-js.mjs` lines 1-9, 421-445; `scripts/check-public-js.test.mjs` lines 1-16.
`// @ts-check`, JSDoc types, `node:`-prefixed built-ins only, usage comment, exit 2 for bad args, `string | null` failure result, final `PASS`/`FAIL (reason)` line. TypeScript-strict rule from CLAUDE.md maps to `@ts-check` with no `any` in JSDoc.

### Existing parity tooling (apply to preview and restore rehearsal tasks, no new code)

**Source:** `scripts/script-inventory.mjs` commands `fetch BASE_URL BASELINE_DIST_DIR OUT_DIR`, `parity BASELINE_DIST_DIR CANDIDATE_DIR`, `compare A B`, `check scripts/script-allowlist.json DIST_DIR`. Baseline is `~/portfolio-baseline/current/dist`. Verdict is `parity: 17/17 identical` (Phase 3 VERIFICATION row 1). `npm run check:public-js` takes no URL; "against the preview" means the `check` command on fetched HTML.

### Human-action gates

**Source:** user memory and research Project Constraints. Every `git push`, the merge to `main`, Dokploy object creation, Cloudflare Pages and DNS edits, repo secrets and real-device passkeys are `checkpoint:human-action`. Do not start `npm run dev`. Agent sessions must not run `curl` on `*_emdash*` URLs (committed `.claude/settings.json` deny); do those checks through a CI script or as human-verify steps.

### Copy rules

No em dashes in any file written. No inline styles (not applicable). Secrets never written to files; use `REDACTED`.

## No Analog Found

| File                                                                 | Role   | Data Flow        | Reason                                                                                                                              |
| -------------------------------------------------------------------- | ------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/deploy.yml` (trigger, poll, `workflow_run` parts) | config | event-driven     | Only one workflow exists (`ci.yml`, push-triggered); use research Code Examples skeleton, verify Dokploy API shape in Swagger first |
| `node:http` local server in `smoke-test.test.mjs`                    | test   | request-response | Existing tests spawn CLIs or use fixtures; none stand up an HTTP server; use research skeleton                                      |

## Metadata

**Analog search scope:** `scripts/`, `.github/workflows/`, `Dockerfile`, `.gitignore`, `.dockerignore`, `package.json`, `.planning/phases/04-agent-access/`
**Files scanned:** about 12; tracked status confirmed with `git ls-files` for `scripts/*`, `.github/workflows/ci.yml`, `.nvmrc`, `.dockerignore`, and the phase 04 evidence file
**Pattern extraction date:** 2026-10-26
