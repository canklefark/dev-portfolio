# Phase 6: Live Editing and Docs - Research

**Researched:** 2026-10-28
**Domain:** EmDash 1.3.1 draft/preview/publish/restore lifecycle exercised on a Dokploy + Cloudflare deploy, plus repo documentation cleanup
**Confidence:** HIGH on EmDash behavior (read from the installed 1.3.1 source), MEDIUM on production state (not observable from here)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Live edit exercise (ADMIN-04)**

- **D-01:** Test target is an existing published project card with a throwaway tweak (a small field such as a summary sentence). Publish it, confirm the public page changes with no rebuild or git push, then restore the previous revision so the site ends exactly as it started.
- **D-02:** Both drivers. The user runs draft, preview, publish and restore in the admin. Separately Claude makes one draft edit over the OAuth MCP connection on production to confirm it lands as a pending revision (live page unchanged, Phase 4 D-02), and the user publishes it. Claude does not publish (Phase 4 D-01 guard stays).
- **D-03:** Evidence goes in a phase evidence file in the style of `05-EVIDENCE.md` (exact filename is Claude's discretion).

**Preview link (ADMIN-05)**

- **D-04:** Use EmDash's built-in preview link as intended. Verify signed-out in a private window with default token expiry: the draft shows at the preview link while the public URL still shows the published copy.
- **D-05:** If the built-in link does not work on the Node/Dokploy deploy or behind the Cloudflare proxy, record it as a finding with the cause in the evidence file and stop. No custom preview route, no new client JS. Config-only fixes are not authorized either unless the user asks after seeing the finding. The user decides the follow-up. Reversibility: reversible, evidence only.

**README (DOCS-02)**

- **D-06:** Full replacement of the Astro starter README, kept short, no marketing copy. Sections: what this is, local dev, content editing in EmDash, deploy steps (merge to `main`, click Deploy in Dokploy, run `node scripts/smoke-test.mjs https://dev.zeikcookson.com`), rollback rule, agent access.
- **D-07:** Agent access is OAuth only: the committed `.mcp.json`, draft-first rule, and the client-side publish deny guard. Drop the Phase 4 PAT, env-var and 90-day rotation text (superseded in Phase 5 D-12). The README lacks the Agent access section Phase 4 D-09 planned, so this phase writes it fresh.
- **D-08:** Rollback rule as in DOCS-02: revert on `main` and redeploy for bad code; restore the nightly R2 volume backup for a bad migration. Link the rehearsed restore evidence (`05-EVIDENCE.md`) rather than copying the steps.
- **D-09:** README follows the project copy rules: no em dashes, first-person natural prose where it is prose.

**CLAUDE.md (DOCS-01)**

- **D-10:** Surgical edits to existing sections only. The Deployment paragraph is already done (Phase 5). Add only what is missing: Node >=22.22.2 and the Node 24 image (already partly present, confirm), admin-only client JS exemption, no-plugins rule, draft-first agent rule, content edited in EmDash. Keep the file short.

**Stale workflow cleanup (DOCS-03)**

- **D-11:** Delete `~/.claude/skills/portfolio-update/` (outside the repo; it writes `src/content` markdown and is obsolete). User decision: delete rather than rewrite or flag. Also remove its entry from any skill lock/index if one references it (`skills-lock.json` showed no reference on inspection).
- **D-12:** Delete `scripts/log.sh` (writes to `src/content/logbook`, which no longer exists; not referenced from package.json, CI or CLAUDE.md, not sourced from the shell rc files checked) and `docs/friend-portfolio-intake.md` (user decision; standalone questionnaire not referenced anywhere in the repo). Planner re-greps for references immediately before deleting and stops if something live points at either file.
- **D-13:** No CI guard. One-time grep sweep for `src/content`, `src/data/about` and `portfolio-update` outside `.planning/`, result recorded in the evidence file. `.emdash/seed.json` matched on "frontmatter" and is inspected, not assumed stale.

### Claude's Discretion

- Evidence file name and table layout.
- Which published card and which field is the throwaway tweak target.
- Exact wording of README and CLAUDE.md additions within the decisions above.

### Deferred Ideas (OUT OF SCOPE)

- Rewrite a `portfolio-update`-style workflow on top of the EmDash MCP (drafts for the user to publish). Deleted for now; revisit as its own piece of work if wanted.
- Custom preview route if the built-in link fails (D-05): only if the user asks after the finding.
- CI guard against references to removed content files: declined (D-13).
  </user_constraints>

<phase_requirements>

## Phase Requirements

| ID                    | Description                                                                                             | Research Support                                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ADMIN-04              | Draft, preview and publish are exercised end to end on one real project, including restoring a revision | Lifecycle semantics below: editing a published entry stages a draft, publish promotes it, restore only creates a draft so a second publish is needed to put the live page back. Procedure and curl/hash checks in Code Examples.                 |
| ADMIN-05              | A shareable preview link works for a draft entry                                                        | Preview is implicit via middleware (no template change); link comes from the admin Preview button; 1h default expiry; `private, no-store`. Slug-vs-ULID path risk and the production `url_pattern` pre-check are the one thing that can fail it. |
| DOCS-01               | CLAUDE.md updated                                                                                       | Gap list: what is already present versus what is missing (Architecture Patterns, CLAUDE.md gap table).                                                                                                                                           |
| DOCS-02               | README updated for local and deploy workflow, manual deploy steps, rollback rule                        | README outline, verified commands, the `emdash seed` default-database trap, the guard discrepancy (Open Question 1).                                                                                                                             |
| DOCS-03               | `portfolio-update` skill and any doc referencing the markdown workflow flagged or updated               | Stale-reference inventory: confirmed hits, a wrong premise in D-12 (`~/.zshrc` sources `log.sh`), additional stale artifacts the context does not name.                                                                                          |
| </phase_requirements> |

## Summary

This phase adds no code. It proves a workflow on production (draft, preview, publish, restore, one agent draft) and rewrites docs. The EmDash 1.3.1 source in `node_modules` answers every behavioral question in the CONTEXT, and the existing templates already work with preview: `getProject` calls `getEmDashEntry("projects", slug)` and EmDash's middleware verifies a `_preview` token and serves the draft revision implicitly through request context. No template, config or JS change is needed, so D-05's "stop and record" branch is only reached if production state differs from the repo.

Three facts change how the exercise must be run. First, restoring a revision never changes the live page: it replaces the draft with the old revision's data and the live site stays put until you publish (`"The version from {when} is now your draft. Publish when you're ready."`). So "restore the previous revision so the site ends exactly as it started" (D-01) needs a final Publish after the Restore. Second, the 1.3.1 admin has no copy-link control: the Preview button opens the signed URL in a new tab, and the shareable link is that tab's address bar. Third, the preview path is built from the collection's `urlPattern` (`/projects/{slug}`), so it only works if production's `projects` collection carries that pattern; if it does not, the link falls back to the database ULID, which `getProject` deliberately 404s.

For the docs, three premises in the CONTEXT are wrong or incomplete and need user confirmation before the plan writes text: the "client-side publish deny guard" no longer exists (removed in 882521a), `scripts/log.sh` is sourced from `~/.zshrc`, and the live `dev-portfolio` project card still describes the Cloudflare Pages markdown workflow. Details are under Open Questions.

**Primary recommendation:** Plan three work units: (1) a user-driven live-edit exercise recorded in a `06-EVIDENCE.md` with hashes before and after, (2) README and CLAUDE.md edits, (3) the stale-reference cleanup and sweep. Gate units 2 and 3 on the user's answers to Open Questions 1 to 4, and write nothing about a publish guard in the README.

## Architectural Responsibility Map

| Capability                                     | Primary Tier                                                  | Secondary Tier                          | Rationale                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| Draft save, revision history, publish, restore | API / Backend (EmDash runtime, SQLite)                        | Browser (admin SPA at `/_emdash/admin`) | State lives in `ec_projects` and `revisions`; the admin is only a client of `/_emdash/api/*` |
| Preview token issue and verify                 | API / Backend (preview-url route, request-context middleware) | —                                       | HMAC secret stays server-side in the options table; browser never sees it                    |
| Serving draft vs published HTML                | Frontend Server (Astro SSR via `getEmDashEntry`)              | —                                       | Same template; request context decides which revision                                        |
| Edge behavior for preview responses            | CDN / Static (Cloudflare proxy)                               | API (sets `Cache-Control`)              | Proxy must not cache; origin sends `private, no-store`                                       |
| Agent draft edit                               | API / Backend (MCP at `/_emdash/api/mcp`)                     | Claude Code (OAuth client)              | Draft staging is server behavior; draft-first is only a convention now                       |
| Docs and stale-file cleanup                    | Repo (git) and user home (`~/.claude`, `~/.zshrc`)            | —                                       | No runtime tier involved                                                                     |

## Standard Stack

No packages are added or changed in this phase. [VERIFIED: package.json] `emdash` is `^1.3.1` and `npm ls emdash` printed `emdash@1.3.1`; `npm view emdash version` printed `1.3.1`, so there is no newer release to account for. No upgrade, no install.

### Core (existing, used as-is)

| Tool                     | Version | Purpose                                                    | Why                                         |
| ------------------------ | ------- | ---------------------------------------------------------- | ------------------------------------------- |
| EmDash admin + API       | 1.3.1   | Draft, preview, publish, restore, MCP                      | The mechanism under test                    |
| `scripts/smoke-test.mjs` | in repo | Post-deploy check of `/`, `/projects/`, first project page | GUARD-03, referenced in README deploy steps |
| `curl` + `shasum`        | system  | Anonymous page checks and before/after hashes              | Same method as 05-EVIDENCE B2 page hashes   |
| `grep`                   | system  | D-13 sweep                                                 | One-time, no CI guard (D-13)                |

### Alternatives Considered

| Instead of           | Could Use                                                       | Tradeoff                                                                                                                   |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Admin Preview button | `POST /_emdash/api/content/projects/{id}/preview-url` with curl | Needs an authenticated session cookie plus `X-EmDash-Request`; no benefit, and the button is what D-04 means by "built-in" |
| Hashing the page     | Eyeballing the text                                             | Hash proves "ends exactly as it started"; text compare does not                                                            |

**Package Legitimacy Audit:** Not applicable. This phase installs no external packages. Packages removed due to SLOP: none. Packages flagged SUS: none.

## Architecture Patterns

### System Architecture Diagram

```
Owner browser (passkey session)             Claude Code (OAuth, .mcp.json)
   |  admin SPA /_emdash/admin                  |  MCP /_emdash/api/mcp
   v                                            v
        Cloudflare proxy (Full strict, cf-cache-status DYNAMIC)
                          |
                          v
        Dokploy / Traefik --> Node standalone (Astro SSR + EmDash runtime)
                          |
        +-----------------+------------------------------------------+
        | content_update / admin save on a PUBLISHED entry           |
        |   -> new row in `revisions`, draft_revision_id set         |
        |   -> live columns untouched  (public page unchanged)       |
        |                                                            |
        | POST .../preview-url (needs content:read_drafts)           |
        |   -> /projects/{slug}?_preview=<HMAC token, 1h>            |
        |                                                            |
        | anonymous GET /projects/{slug}?_preview=...                |
        |   middleware verifies token -> request ctx {preview}       |
        |   getEmDashEntry serves draft revision; Cache-Control:     |
        |   private, no-store; route cache opted out                 |
        |                                                            |
        | Publish: draft revision -> live columns, live_revision_id  |
        | Restore: old revision data -> NEW draft only               |
        | Publish again: restored draft -> live (page reverts)       |
        +------------------------------------------------------------+
                          |
                          v
        Anonymous GET /projects/{slug}/ : no cache configured, sees live columns
```

### Recommended work units

```
Unit A  ADMIN-04, ADMIN-05   06-EVIDENCE.md rows, user drives admin, executor curls
Unit B  DOCS-01, DOCS-02     README.md (replace), CLAUDE.md (surgical)
Unit C  DOCS-03              deletions, sweep, evidence rows
```

Unit A needs the live site and the user's passkey session, so it cannot be autonomous. B and C are repo edits and can run before or after A. Do the sweep (C) last so it also covers the README and evidence file written in B and A.

### Lifecycle facts the procedure depends on

- **Saving a published entry stages a draft.** [CITED: docs.emdashcms.com/reference/content-lifecycle/] "replaces the draft revision while the live revision remains public." [VERIFIED: node_modules/emdash/src/emdash-runtime.ts:4050-4056] `// Public HTML comes from live columns / SEO / taxonomies, not draft revisions.` Corollary: SEO, taxonomy, byline, status and publishedAt writes hit the live row immediately, so the throwaway tweak must be a plain data field (D-12 of Phase 4). Use `sub` (rendered in the project detail page, `detail-sub`) or `summary`.
- **Restore creates a draft, not a publish.** [CITED: docs.emdashcms.com/reference/content-lifecycle/] "Restoring a revision on a revision-enabled collection does not publish it." [VERIFIED: node_modules/@emdash-cms/admin/dist/index.js, restore dialog] the toast reads `The version from {when} is now your draft. Publish when you're ready.` and the confirm text `the live site won't change until you publish`. All four collections list `revisions` in `supports` [VERIFIED: .emdash/seed.json, `"supports": ["drafts", "revisions", "preview", "seo"]` on projects].
- **Baseline revision exists locally.** [VERIFIED: sqlite3 on the local data/emdash.db, read-only] each published project has exactly 1 row in `revisions` (the live one) with `live_revision_id` set and no draft. After tweak and publish the history is [original, tweak], so "restore previous" has a target. Production was loaded by the Sample content wizard from the same seed, so it likely matches, but that is [ASSUMED] (A2); check the Revisions panel before the tweak.
- **Preview is implicit.** [VERIFIED: node_modules/emdash/src/query.ts:1198] `const serveDrafts = isPreviewMode || isEditMode;` and the middleware sets `preview` in request context from a verified `_preview` token [VERIFIED: node_modules/emdash/src/astro/middleware/request-context.ts:277-285]. `src/lib/projects.ts` needs no change, and `scripts/check-public-js` stays green because the preview response has no extra script (toolbar is `false` in `astro.config.mjs`).
- **Token scope.** [CITED: docs.emdashcms.com/guides/preview/] "A token for another collection or entry never grants draft access to the requested page." Default lifetime `1h`. [VERIFIED: node_modules/emdash/src/astro/routes/api/content/[collection]/[id]/preview-url.ts:76] `const expiresIn = body.expiresIn || "1h";` and the endpoint requires `content:read_drafts` (line 50).
- **Preview response is uncacheable.** [VERIFIED: request-context.ts:313-318] `optOutOfRouteCache(routeCache);` ... `response.headers.set("Cache-Control", "private, no-store");` (applies when the token is valid). Route caching is opt-in [CITED: docs.emdashcms.com/deployment/route-caching/] and `astro.config.mjs` configures no cache and no `objectCache`, so a publish is visible on the next anonymous request. Cloudflare answered `cf-cache-status: DYNAMIC` on a project page today [VERIFIED: curl -sI https://dev.zeikcookson.com/projects/dev-portfolio/, 2026-10-28].
- **Link shape.** [VERIFIED: preview-url.ts:117] `if (collectionInfo?.urlPattern) {` the path is interpolated from the collection `urlPattern` with the entry slug; otherwise it falls back to `/{collection}/{id}` with the ULID. The seed sets `"urlPattern": "/projects/{slug}"` [VERIFIED: .emdash/seed.json:226] and the local database has `projects|/projects/{slug}` [VERIFIED: sqlite3 `select slug,url_pattern from _emdash_collections`]. The published docs say the endpoint "uses the entry's database ID, not its slug"; that is stale relative to the 1.3.1 source above. Production's value is [ASSUMED] to match (A1).
- **Admin UX.** [VERIFIED: node_modules/@emdash-cms/admin/dist/index.js, `handlePreview`] it calls `getPreviewUrl(collection, item.id)` then `window.open(result.url, "_blank", "noopener,noreferrer")`. There is no copy button in the part of the admin read; the shareable link is the new tab's address bar. The URL is relative to the admin origin, so it opens on `dev.zeikcookson.com`.
- **Agent draft over MCP.** [VERIFIED: node_modules/emdash/src/mcp/server.ts:1338-1344] `When status is not set, a change to a published item is staged as a draft, so the response shows the new values while the live version keeps the old ones until content_publish.` In 1.3.1 `_rev` is required on writes [VERIFIED: server.ts:87] `_rev is required: call content_get for this item and pass back the _rev it returns.` (Phase 4 saw an empty `_rev` accepted; that no longer holds.) An entry open in the admin editor holds an edit lock: [VERIFIED: server.ts:94-97] the write fails with `ENTRY_LOCKED` unless `overrideLock` is set, which the agent must not set. Close the editor tab before the agent writes.

### Anti-Patterns to Avoid

- **Judging the public page from the signed-in browser.** Phase 4 recorded that a browser signed in to the admin can be in edit mode and see drafts. Every "public page unchanged" check is an anonymous `curl` or a private window.
- **Tweaking a field that is not on the page.** Use `sub` or `summary`, not SEO or taxonomy fields, which bypass the draft.
- **Using apostrophes or quotes in the throwaway text.** HTML escaping makes a grep miss; use plain ASCII words and no em dash, for example append ` LIVE EDIT CHECK` to `sub`.
- **Leaving the entry open in the editor** while Claude writes (`ENTRY_LOCKED`) or reading "restore worked" from the editor instead of the public page.
- **Writing the preview URL or any OAuth token into the evidence file.** Record `REDACTED` per the 05-EVIDENCE convention; the token grants draft read access for an hour.

## Don't Hand-Roll

| Problem                                      | Don't Build                          | Use Instead                                                                 | Why                                                                                  |
| -------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Shareable draft link                         | A custom preview route or signed URL | The admin Preview button (D-04, D-05)                                       | Locked; middleware already does token verification and cache opt-out                 |
| Proving the site returned to its start state | Manual text comparison               | `curl -s URL \| shasum` before and after                                    | Pages are deterministic (05-EVIDENCE B2 compared identical hashes across containers) |
| Finding stale references                     | A CI guard                           | A one-time `grep -rIn` recorded in the evidence file                        | D-13 declined a guard                                                                |
| Agent draft write                            | A script that calls the REST API     | The `mcp__emdash__*` tools via OAuth (`content_get`, then `content_update`) | That is the path D-02 wants to prove                                                 |

**Key insight:** every mechanism in this phase already exists in EmDash and the repo. The work is exercising it and writing it down accurately.

## Runtime State Inventory

This is a post-migration cleanup, not a rename, but deleting files and a skill leaves state outside the repo. Answers per category:

| Category                             | Items Found                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Action Required                                                                                                                                                                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stored data                          | The production `dev-portfolio` card (and `.emdash/seed.json`, which seeds it) still say "Content is Markdown; adding a post is a git commit. Deployed to Cloudflare Pages" [VERIFIED: `curl` of /projects/dev-portfolio/ on 2026-10-28; seed.json:2371, 2488]. No other stored data references the removed files.                                                                                                                                                                            | Content edit by the user in the admin, not a code edit. See Open Question 5. Never hand-edit seed.json (03-04 decision).                                                                                                                          |
| Live service config                  | None found: no Dokploy, Cloudflare or CI setting references `src/content`, `log.sh` or `portfolio-update` (`.github/workflows/ci.yml` read in full; it runs `npm test`, `check:public-js`, seed, `migrate --check`, manifest diff).                                                                                                                                                                                                                                                          | None                                                                                                                                                                                                                                              |
| OS-registered state                  | `~/.zshrc` lines 25-26 [VERIFIED: sed -n 20,30p ~/.zshrc] `# Portfolio log helper` and `[ -f "$HOME/workspace/github.com/canklefark/portfolio/scripts/log.sh" ] && source "$HOME/workspace/github.com/canklefark/portfolio/scripts/log.sh"`. This contradicts D-12's "not sourced from the shell rc files checked".                                                                                                                                                                          | Deleting `log.sh` is safe (the `-f` guard makes the line a silent no-op), but the two lines become dead. Ask the user to remove them; do not edit `~/.zshrc` unasked. Open shells keep a `log` function that errors with "logbook dir not found". |
| Secrets and env vars                 | None: nothing reads a secret named for the deleted files. `EMDASH_ENCRYPTION_KEY` is unset because no plugins (05-EVIDENCE).                                                                                                                                                                                                                                                                                                                                                                 | None                                                                                                                                                                                                                                              |
| Build artifacts / installed packages | `~/.claude/skills/portfolio-update/` holds `SKILL.md` only [VERIFIED: ls]; `skills-lock.json` lists only `emil-design-eng` [VERIFIED: cat]. Two more skills symlinked from another repo still describe the markdown workflow: `~/.claude/skills/portfolio-logbook` and `portfolio-projects` point into `~/workspace/github.com/canklefark/ai-skills/development/` [VERIFIED: ls -la; their SKILL.md descriptions name `src/content/logbook/`, `src/content/projects/` and `scripts/log.sh`]. | Delete portfolio-update per D-11. Flag the other two (Open Question 4).                                                                                                                                                                           |

## Stale-reference inventory (DOCS-03, D-13)

Sweep command, run from the repo root (zero hits expected after cleanup, subject to Open Question 3):

```bash
grep -rIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.planning \
  --exclude-dir=dist --exclude-dir=.astro --exclude-dir=data --exclude=package-lock.json \
  -E "src/content|src/data/about|portfolio-update|scripts/log\.sh|friend-portfolio-intake|logbook/" .
```

Hits found today (research session), by disposition:

| Path                                                                                               | What it is                                                                                                                   | Disposition                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/log.sh`                                                                                   | Writes `src/content/logbook`                                                                                                 | Delete (D-12). No reference in package.json, CI, CLAUDE.md or tests [VERIFIED: grep]. Referenced by `~/.zshrc` and the docs below                                                                                                                                                          |
| `docs/friend-portfolio-intake.md`                                                                  | Questionnaire                                                                                                                | Delete (D-12). Referenced only by `docs/superpowers/plans/2026-05-16-friend-portfolio-intake.md` (17 hits), which is gitignored and untracked [VERIFIED: `git status --ignored`, `git ls-files docs/superpowers`], so D-12's "not referenced anywhere in the repo" holds for tracked files |
| `docs/superpowers/specs/2026-05-14-logbook-quick-capture-design.md` (tracked)                      | Design spec for `log.sh` and `src/content/logbook/`                                                                          | Points at the removed files, so success criterion 4 is not met if it stays. Open Question 3                                                                                                                                                                                                |
| `docs/superpowers/specs/2026-05-16-friend-portfolio-fork-design.md` (tracked)                      | Fork design: "Markdown content collections", "`portfolio.type: project` writes to `src/content/projects/`", Cloudflare Pages | Same. Open Question 3                                                                                                                                                                                                                                                                      |
| `docs/superpowers/plans/*` (untracked, gitignored)                                                 | Plans for the two specs                                                                                                      | Local files only; mention in the evidence file, delete or leave per the Open Question 3 answer                                                                                                                                                                                             |
| `.emdash/seed.json:2371, 2488`                                                                     | Project card copy                                                                                                            | Content, not a doc. Open Question 5                                                                                                                                                                                                                                                        |
| `PRODUCT.md`, `DESIGN.md`, `src/styles/blocks.css`, `src/pages/404.astro`, `src/pages/index.astro` | The word "logbook" as design tone and a CSS class (`logbook-footer`)                                                         | Not the markdown workflow. Leave; record as reviewed-and-kept so a reader does not re-flag them                                                                                                                                                                                            |
| `README.md`                                                                                        | Astro starter text (mentions `.md` pages in `src/pages`)                                                                     | Replaced by D-06                                                                                                                                                                                                                                                                           |

## CLAUDE.md gap table (DOCS-01, D-10)

Current file read in full this session. Present means the text already exists and needs no edit.

| Required item                                                                                  | State                                                                                                               | Edit                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dokploy deploy, owner clicks Deploy, push to `main` runs CI only, smoke test after each deploy | Present in `## Deployment`                                                                                          | None                                                                                                                                                                                                                                 |
| Node version                                                                                   | Present: "`engines` requires Node >=22.22.2" and "Node 24" image. `.nvmrc` is `24`                                  | None, optionally name `.nvmrc`                                                                                                                                                                                                       |
| Content edited in EmDash, no markdown content files                                            | Present in `## Content` and `## Stack`                                                                              | None                                                                                                                                                                                                                                 |
| Admin-only client JS                                                                           | Partial: `## Stack` says React is for the admin only; the Code Rules bullet says no client JS unless no alternative | Add to the existing JS bullet: the EmDash admin under `/_emdash/admin` is the only place client JS is allowed, and public routes ship none (the one Cloudflare email-decode script on `/about` is already recorded under Deployment) |
| "No new JS" rule                                                                               | Partial, same bullet                                                                                                | State it as a rule: do not add scripts, modulepreload or module tags to a public route; `npm run check:public-js` enforces                                                                                                           |
| No-plugins rule                                                                                | Missing                                                                                                             | Add one line: no third-party EmDash plugins (REQUIREMENTS "Out of Scope", and `EMDASH_ENCRYPTION_KEY` stays unset because no plugin declares a secret)                                                                               |
| Draft-first agent rule                                                                         | Missing                                                                                                             | Add one line: agent writes through the emdash MCP are drafts only and the owner publishes. Word it as a convention. Do not mention a deny guard (Open Question 1)                                                                    |

Keep the new text free of em dashes. The file's existing lines contain em dashes (title, bullets); surgical-change rules say leave them.

## README outline (DOCS-02, D-06 to D-09)

Replace the whole file. Sections in order: what this is; local dev; content editing in EmDash; deploy; rollback; agent access. Facts to use, each checked this session:

- **Local dev.** Scripts [VERIFIED: package.json] `"dev": "astro dev"`, `"build": "astro build"`, `"preview": "astro preview"`, `"test": "node --test \"scripts/*.test.mjs\" \"src/lib/*.test.mjs\""`, `"check:public-js": "node scripts/check-public-js.mjs"`. Node 24 via `.nvmrc`. Local database lives at `./data/emdash.db` and the folder must exist first: `mkdir -p data` [CITED: .planning/phases/01-spike-baseline-and-decisions/01-04-SUMMARY.md:147 "`mkdir -p data` after each reset, before starting the server"].
- **Seed trap.** `emdash seed` defaults to `./data.db`, not `./data/emdash.db` [VERIFIED: `npx --no-install emdash seed --help` printed `-d, --database=<database>    Database path (Default: ./data.db)`]. Either document the setup wizard's Sample content option (what production used, 05-EVIDENCE) or give `npx emdash seed .emdash/seed.json --database data/emdash.db --uploads-dir data/uploads`. The README must not say a bare `emdash seed` populates the dev database. Local content is a separate database from production; editing production does not update git or the seed.
- **Deploy.** Merge to `main`, push (CI only), click Deploy on the portfolio app in Dokploy, wait for done, run `node scripts/smoke-test.mjs https://dev.zeikcookson.com`. Auto Deploy is off [05-EVIDENCE C8, "Manual deploy and rollback"].
- **Rollback.** Revert the bad commit on `main`, push, click Deploy. After a bad migration restore the nightly volume backup and take one before deploying an EmDash upgrade [05-EVIDENCE "Manual deploy and rollback"]. State honestly that the code rollback has not been rehearsed (05-EVIDENCE says "Neither route has been rehearsed"). Link `05-EVIDENCE.md` for the restore rehearsal and the pitfall that the `.tar` object, not the app-name folder, must be picked.
- **Agent access.** Committed `.mcp.json` registers server `emdash` at `https://dev.zeikcookson.com/_emdash/api/mcp` by URL only [VERIFIED: .mcp.json]; the first connection runs OAuth with the owner's admin rights. Draft-first rule. See Open Question 1 for what may be claimed about enforcement.
- **Content editing.** Admin at `/_emdash/admin` with one passkey; lost device means the SQLite recovery procedure in `.planning/PROJECT.md` ("Admin recovery procedure"). Draft, preview and publish flow in two sentences, including that restore only makes a draft.

Style: no em dashes, first-person natural prose where prose, no marketing copy, no emoji. Verify with `grep -n "—" README.md` returning nothing.

## Common Pitfalls

### Pitfall 1: Restore looks like it failed

**What goes wrong:** After Restore, the public page still shows the tweak, so the exercise is recorded as FAIL.
**Why it happens:** Restore writes a draft only. [CITED: docs.emdashcms.com/reference/content-lifecycle/]
**How to avoid:** Procedure step order is Restore, anonymous curl (still the tweak, expected), Publish, anonymous curl (original). Record both observations.
**Warning signs:** The editor shows "Publish changes" after a restore. That is correct.

### Pitfall 2: Preview link 404s

**What goes wrong:** The new tab opens `/projects/<ULID>?_preview=...` and shows the 404 page.
**Why it happens:** If production's `projects` collection has no `url_pattern`, the path uses the database id and `getProject` returns null unless `entry.id` equals the slug (03-01 decision). Not a template bug.
**How to avoid:** Before the exercise, read the collection's pattern on production without changing anything, for example in the Dokploy terminal `sqlite3 data/emdash.db "select slug,url_pattern from _emdash_collections;"` (the recovery procedure already assumes `sqlite3` in the container; if absent, skip and read the address bar instead). Expected row: `projects|/projects/{slug}`.
**If it happens anyway:** D-05 applies. Record the URL shape with the token REDACTED, the cause, and stop. The fix (set the pattern in the admin or add a path override) is a config change the user must authorize.

### Pitfall 3: Browser session contaminates the check

**What goes wrong:** A signed-in or edit-mode browser shows the draft on the public URL.
**How to avoid:** Anonymous `curl` for the public URL, and a private window with no admin cookie for the preview link and the public URL side by side.

### Pitfall 4: Agent write refused with ENTRY_LOCKED, or with a missing `_rev`

**Why:** Editor tab still open; `_rev` omitted. [VERIFIED: server.ts:87, 94-97]
**How to avoid:** User closes the entry first. Claude calls `content_get`, passes the returned `_rev`, sets no `status` and never `overrideLock`.

### Pitfall 5: Agent connection not available in the session

**Why:** `.mcp.json` is OAuth with no token; the session needs `/mcp` authentication and an approved project server. This research session had no `mcp__emdash__` tools loaded.
**How to avoid:** Make the MCP check a user-attended step. If the tools are absent, record NOT RUN with the reason rather than substituting curl, and say so (Phase 4 did exactly this and flagged it).

### Pitfall 6: Deleting `log.sh` and breaking the shell

**Why:** `~/.zshrc` sources it. **How to avoid:** the `[ -f ... ] &&` guard makes this harmless; still tell the user about the dead lines.

### Pitfall 7: Evidence file leaks a capability

**Why:** A preview URL embeds a valid token for an hour. **How to avoid:** write `REDACTED`, and do not paste MCP/OAuth output that includes tokens.

### Pitfall 8: History grows

**What goes wrong:** After the loop the entry carries extra revisions (tweak, restored copy). "Exactly as it started" is true of the published content and page hash, not of revision count or `updated_at`. Say so in the evidence file instead of claiming a byte-identical database.

## Code Examples

### Anonymous checks (executor, repeatable)

```bash
# Source: pattern from 05-EVIDENCE B2 (page hashes) and 04-AGENT-ACCESS-PASS (anonymous curl)
BASE=https://dev.zeikcookson.com
SLUG=<chosen-slug>
curl -s "$BASE/projects/$SLUG/" | shasum        # H0 before anything
curl -s "$BASE/projects/$SLUG/" | grep -c "LIVE EDIT CHECK"   # 0 before publish, 1 after, 0 after final publish
curl -sI "$BASE/projects/$SLUG/" | grep -i -E "^(HTTP|cf-cache-status|cache-control)"
# Preview response headers (token read from the new tab's address bar; do not write it down)
curl -sI "$BASE/projects/$SLUG?_preview=<TOKEN>" | grep -i -E "^(HTTP|cache-control|cf-cache-status)"
# expected: 200, cache-control: private, no-store, cf-cache-status not HIT
node scripts/smoke-test.mjs "$BASE"             # smoke-test: PASS
```

### Procedure order for Unit A (what the plan's tasks should sequence)

1. Executor: record H0 hash and the original `sub` text; user opens the card in the admin and notes the Revisions list (expect at least 1).
2. Pre-check production `url_pattern` (Pitfall 2).
3. User: edit `sub` (append ` LIVE EDIT CHECK`), Save (draft), do not publish. Executor: anonymous curl shows 0 matches and hash equals H0.
4. User: Preview, open in a private window, confirm the draft text; user pastes the header results or runs the preview `curl -sI`. Also confirm the public URL in the same private window lacks the text (ADMIN-05).
5. User: Publish. Executor: anonymous curl shows 1 match, no rebuild, no push, no Deploy click (D-01). Hash differs from H0.
6. User: open Revisions, Restore the original revision. Executor: curl still 1 match (restore is a draft).
7. User: Publish. Executor: 0 matches and hash equals H0, then smoke test PASS.
8. Agent leg (D-02): user closes the editor; Claude `content_get`, `content_update` with data `{ sub: "<original + ' AGENT DRAFT CHECK'>" }` and `_rev`, `content_get` shows `data.sub` new and `liveData.sub` old, `draftRevisionId` set; anonymous curl shows no `AGENT DRAFT CHECK`. User publishes, curl shows it, user restores the original and publishes, hash equals H0. Claude never publishes.

## State of the Art

| Old Approach                                         | Current Approach                                       | When Changed                  | Impact                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------ | ----------------------------- | ----------------------------------------------------------------------------------------- |
| Preview link uses entry database id (published docs) | Link follows the collection `urlPattern` with the slug | In the 1.3.x source read here | Our `/projects/{slug}` pattern makes the built-in link work if production has the pattern |
| Agent `_rev` not enforced (Phase 4 observation)      | `_rev` required on writes                              | 1.3.1 MCP server              | Agent must `content_get` first                                                            |
| Phase 4 PAT plus client-side guard                   | OAuth with owner rights, no guard                      | 2026-10-27 (882521a)          | README must not claim a guard                                                             |

**Deprecated/outdated:** the `.claude/hooks/emdash-guard.mjs`, `.claude/settings.json` deny rules and `scripts/emdash-guard.test.mjs` were removed [VERIFIED: `git show --stat 882521a`: 4 files, 993 deletions]. `.claude/` now holds only `skills/` and `worktrees/`, and `~/.claude/settings.json` has no `emdash` entry [VERIFIED: grep].

## Assumptions Log

| #   | Claim                                                                                                                                                                  | Section                        | Risk if Wrong                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | Production's `projects` collection has `url_pattern` `/projects/{slug}` (seed applied by the Sample content wizard)                                                    | Lifecycle facts, Pitfall 2     | Preview link uses the ULID and 404s; ADMIN-05 ends as a D-05 finding, not a pass                                                           |
| A2  | The chosen production card has a baseline revision so "restore previous" has a target                                                                                  | Lifecycle facts                | Restore step impossible; pick another card or record a finding                                                                             |
| A3  | The Cloudflare proxy does not cache the preview response (origin sends `private, no-store`; non-preview pages show `cf-cache-status: DYNAMIC`; no Cache Rule is known) | Lifecycle facts, Code Examples | Draft could be served from edge; the preview `curl -sI` check in step 4 settles it                                                         |
| A4  | The Claude Code session used for the agent leg can authenticate the `emdash` OAuth server                                                                              | Pitfall 5                      | Agent leg is NOT RUN, recorded as such                                                                                                     |
| A5  | `~/.zshrc` is the only shell rc that sources `log.sh`                                                                                                                  | Runtime State Inventory        | Another rc keeps a dead line; harmless because of the `-f` guard. grep of `~/.zshrc ~/.zprofile ~/.bashrc ~/.zshenv` found only `~/.zshrc` |
| A6  | The 1.3.1 admin has no copy-link control for preview                                                                                                                   | Lifecycle facts                | If one exists the user can copy from it; no plan impact                                                                                    |

## Open Questions

1. **README and "client-side publish deny guard" (D-07, D-02).**
   - What we know: the guard (hook, deny rules, tests) was deleted in 882521a. REQUIREMENTS.md already notes it was removed. OAuth gives the agent the owner's admin rights, so `content_publish` is callable; draft-first is now a convention only.
   - What's unclear: D-07 and D-02 still say the guard exists and "stays".
   - Recommendation: the README and CLAUDE.md state the rule as a convention the owner relies on, with no claim of enforcement. Confirm with the user before writing; do not document a guard that is not there.

2. **`log.sh` is sourced from `~/.zshrc` (D-12 premise).**
   - What we know: lines 25-26, guarded by `[ -f ... ]`.
   - Recommendation: delete `log.sh` as decided, then ask the user to delete those two lines (outside the repo, user-owned file). Add it as a user checkpoint, not an automatic edit.

3. **Tracked design specs that point at removed files (success criterion 4).**
   - What we know: `docs/superpowers/specs/2026-05-14-logbook-quick-capture-design.md` and `2026-05-16-friend-portfolio-fork-design.md` are tracked despite `docs/superpowers` being in `.gitignore`; their implementations (`log.sh`, intake doc) are being deleted. Untracked plans under `docs/superpowers/plans/` reference them too.
   - Recommendation: ask once. Default proposal: `git rm` the two tracked specs (they describe deleted artifacts and the whole markdown model) and leave the untracked plans for the user. If the user prefers to keep them, they stay as a recorded exception in the sweep and criterion 4 is met by "flagged".

4. **Other skills that describe the markdown workflow.**
   - What we know: `~/.claude/skills/portfolio-logbook` and `portfolio-projects` (both `disable-model-invocation: true`) are symlinks into the `ai-skills` repo and describe `src/content/...` and `scripts/log.sh`. D-11 names only `portfolio-update`.
   - Recommendation: flag, do not touch (another repo, user-owned). Record them in the evidence file so DOCS-03's "flagged" is satisfied, and tell the user.

5. **The live `dev-portfolio` card is stale.**
   - What we know: production serves "Deployed to Cloudflare Pages from GitHub" and "Content is Markdown; adding a post is a git commit" (fetched 2026-10-28), as does `.emdash/seed.json`.
   - Recommendation: record as a finding. The user edits the card in the admin (a real draft and publish, separate from the D-01 throwaway). Do not hand-edit `seed.json`; refresh it only via export if the user wants the seed to match. Do not fabricate dates in the card (project memory).

6. **End state wording of D-01.**
   - Recommendation: treat "restore the previous revision" as Restore plus a second Publish, with the evidence file stating that page hash, not revision count, is the "exactly as it started" proof (Pitfalls 1 and 8).

## Environment Availability

| Dependency                            | Required By                     | Available                              | Version                                                             | Fallback                                                |
| ------------------------------------- | ------------------------------- | -------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| Production site                       | Unit A                          | yes                                    | HTTP/2 200 on `/projects/dev-portfolio/` via Cloudflare, 2026-10-28 | none, deploy is live                                    |
| curl, shasum, grep                    | Unit A, C                       | yes                                    | system                                                              | none needed                                             |
| node                                  | `smoke-test.mjs`, `npm test`    | yes                                    | v24.17.0                                                            | none needed                                             |
| sqlite3 (local)                       | Optional local read-only checks | yes                                    | `/usr/bin/sqlite3`                                                  | none needed                                             |
| Admin passkey session                 | Unit A                          | user-held                              | one passkey                                                         | SQLite recovery in PROJECT.md (rehearsed locally only)  |
| `mcp__emdash__*` tools in Claude Code | Agent leg (D-02)                | no, not loaded in the research session | none                                                                | Record NOT RUN with reason (Pitfall 5)                  |
| Dokploy terminal with sqlite3         | `url_pattern` pre-check         | unknown                                | none                                                                | read the preview URL shape from the address bar instead |

**Missing dependencies with no fallback:** none. **With fallback:** the MCP tools and the production sqlite3 read.

## Validation Architecture

`.planning/config.json` has no `workflow.nyquist_validation` key, so this section applies.

### Test Framework

| Property           | Value                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Node built-in test runner (`node --test`)                                                                                                                 |
| Config file        | none; `package.json` `"test"` script                                                                                                                      |
| Quick run command  | `npm test`                                                                                                                                                |
| Full suite command | `npm test && npm run check:public-js` (the second builds and serves a temp database; run only if the user is fine with a build, it never touches `data/`) |

### Phase Requirements to Test Map

| Req ID   | Behavior                                                                                   | Test Type                                            | Automated Command                                                                                                                                                             | File Exists?                            |
| -------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| ADMIN-04 | Publish changes the public page with no rebuild; restore plus publish returns the original | manual (admin passkey) plus automated checks         | anonymous curl grep and `shasum` equal to H0 (Code Examples); `node scripts/smoke-test.mjs https://dev.zeikcookson.com`                                                       | evidence rows in `06-EVIDENCE.md` (new) |
| ADMIN-05 | Preview link shows the draft signed-out while the public URL shows published               | manual (private window) plus `curl -sI` header check | `curl -sI '<preview url>'` expects `cache-control: private, no-store`                                                                                                         | evidence row                            |
| DOCS-01  | CLAUDE.md names admin-only JS, no-new-JS, no-plugins, draft-first, EmDash content          | automated grep                                       | `grep -c -i -E "plugin" CLAUDE.md` and `grep -n -i -E "draft" CLAUDE.md` return hits; `wc -l CLAUDE.md` stays short                                                           | CLAUDE.md exists                        |
| DOCS-02  | README has the six sections, deploy command, rollback rule, no starter text, no em dash    | automated grep                                       | `! grep -q "Astro Starter" README.md && ! grep -q "—" README.md && grep -q "scripts/smoke-test.mjs https://dev.zeikcookson.com" README.md && grep -q "05-EVIDENCE" README.md` | README exists, replaced                 |
| DOCS-03  | Deleted files gone, sweep clean or exceptions recorded                                     | automated                                            | `test ! -e scripts/log.sh && test ! -e docs/friend-portfolio-intake.md && test ! -e ~/.claude/skills/portfolio-update` plus the sweep command above                           | n/a                                     |

### Sampling Rate

- **Per task commit:** `npm test` for any commit that deletes `scripts/log.sh` (confirms no test referenced it).
- **Per wave merge:** `npm test`.
- **Phase gate:** `npm test`, the sweep, the DOCS greps, and the Unit A evidence rows all filled, before `/gsd-verify-work`.

### Wave 0 Gaps

None. Existing test infrastructure covers everything automatable here, and `06-EVIDENCE.md` is created by the plan itself (copy the table style of `05-EVIDENCE.md`: decisions applied, results table, not covered).

## Security Domain

`security_enforcement` is not set in config, so it is treated as enabled.

### Applicable ASVS Categories

| ASVS Category         | Applies | Standard Control                                                                                                                                              |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | yes     | Existing EmDash passkey (admin) and OAuth (MCP); nothing new                                                                                                  |
| V3 Session Management | yes     | Private-window checks avoid reusing an admin session; preview needs no session                                                                                |
| V4 Access Control     | yes     | Preview endpoint requires `content:read_drafts`; token is bound to one collection and entry; agent runs with owner rights (no publish guard, Open Question 1) |
| V5 Input Validation   | no      | No new input surface; the throwaway text is plain ASCII                                                                                                       |
| V6 Cryptography       | yes     | Preview tokens are HMAC-SHA256 with a per-site secret in the options table [VERIFIED: tokens.ts, secrets.ts]; do not set or print `EMDASH_PREVIEW_SECRET`     |

### Known Threat Patterns

| Pattern                                 | STRIDE                 | Standard Mitigation                                                                                          |
| --------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| Preview link leaked or forwarded        | Information Disclosure | 1h default expiry (D-04 keeps it), per-entry binding, never paste the URL into the evidence file or git      |
| Draft cached at Cloudflare or a browser | Information Disclosure | Origin sends `private, no-store` and opts out of route cache; verify with `curl -sI` on the preview response |
| Agent publishes without owner approval  | Tampering / Elevation  | Convention plus the owner publishing; no technical guard exists, so README and CLAUDE.md must say so plainly |
| Throwaway edit left live                | Tampering              | Hash equals H0 after the final publish; smoke test passes                                                    |
| Secrets in evidence or README           | Information Disclosure | Use `REDACTED`; README names `.mcp.json` URL only, no tokens                                                 |

## Sources

### Primary (HIGH confidence)

- Installed source, read this session: `node_modules/emdash/src/` (`astro/routes/api/content/[collection]/[id]/preview-url.ts`, `astro/middleware/request-context.ts`, `query.ts`, `api/handlers/revision.ts`, `emdash-runtime.ts`, `database/repositories/content.ts`, `mcp/server.ts`, `config/secrets.ts`, `preview/*`), `node_modules/@emdash-cms/admin/dist/index.js` (preview and restore UI strings), version 1.3.1.
- Repo files read: `CLAUDE.md`, `README.md`, `.mcp.json`, `package.json`, `astro.config.mjs`, `Dockerfile`, `.github/workflows/ci.yml`, `.emdash/seed.json`, `scripts/*`, `05-EVIDENCE.md`, `04-AGENT-ACCESS-PASS.md`, PROJECT/REQUIREMENTS/STATE.
- Local read-only database queries (`data/emdash.db`), `git show --stat 882521a`, `~/.zshrc`, `~/.claude/skills/*`.
- Live read-only requests to `https://dev.zeikcookson.com` (public routes only).

### Secondary (MEDIUM confidence)

- https://docs.emdashcms.com/guides/preview/ - preview generation, 1h expiry, secret handling, middleware behavior (its "database ID, not slug" caveat is stale against 1.3.1 source).
- https://docs.emdashcms.com/reference/content-lifecycle/ - draft, publish, restore, discard semantics.
- https://docs.emdashcms.com/deployment/route-caching/ - opt-in cache, preview bypass.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - no new packages; versions confirmed.
- Architecture: HIGH - lifecycle and preview behavior read from the running version's source and matching docs.
- Pitfalls: MEDIUM - production state (url_pattern, baseline revision, MCP availability, edge caching of preview) could not be observed from here and is listed under Assumptions.

**Research date:** 2026-10-28
**Valid until:** 2026-11-27, or until `emdash` is upgraded past 1.3.1
