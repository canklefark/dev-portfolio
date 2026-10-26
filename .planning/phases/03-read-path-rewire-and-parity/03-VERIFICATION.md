---
phase: 03-read-path-rewire-and-parity
verified: 2026-10-26T13:00:00Z
status: human_needed
score: 5/5 must-haves verified
covered_files:
  - ".emdash/seed.json"
  - ".github/workflows/ci.yml"
  - ".planning/phases/03-read-path-rewire-and-parity/03-01-PLAN.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-01-SUMMARY.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-02-PLAN.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-02-SUMMARY.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-03-PLAN.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-03-SUMMARY.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-04-PLAN.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-04-SUMMARY.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-05-PLAN.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-05-SUMMARY.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-06-PLAN.md"
  - ".planning/phases/03-read-path-rewire-and-parity/03-06-SUMMARY.md"
  - "astro.config.mjs"
  - "emdash-env.d.ts"
  - "package.json"
  - "scripts/check-public-js.mjs"
  - "scripts/script-allowlist.json"
  - "scripts/script-inventory.mjs"
  - "src/components/Nav.astro"
  - "src/components/StageCard.astro"
  - "src/layouts/Layout.astro"
  - "src/lib/projects.ts"
  - "src/lib/prose.ts"
  - "src/lib/singletons.ts"
  - "src/lib/site.ts"
  - "src/pages/404.astro"
  - "src/pages/about.astro"
  - "src/pages/index.astro"
  - "src/pages/projects/[...slug].astro"
  - "src/pages/projects/index.astro"
covered_digest: "v3:sha256:1cc72854a7610e60f9f1bd2436c540a7f879cb2a87bc0d96f3313c31fd1d8035"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "First run of .github/workflows/ci.yml on GitHub"
    expected: "The verify job passes: npm ci, npm test (42 tests) and npm run check:public-js (17/17 passed, check-public-js: PASS) on ubuntu-latest, Node from .nvmrc (24)"
    why_human: "Needs a push or pull request the user has not approved. The same steps pass locally, but the workflow file itself (action versions checkout@v7 and setup-node@v7, .nvmrc 24 against engines >=22.22.2, the Linux runner) has never executed."
advisory_findings:
  - id: WR-01
    note: "Draft-404 assertion in the guard can pass vacuously (does not confirm the fixture row is a draft). Fixture file does declare status draft; still open in 03-REVIEW-DISPOSITION.md."
  - id: WR-02
    note: "PortableText default types (htmlBlock, iframe, embed, gallery) stay live on project and About bodies. An editor-inserted block could add public JS or a third-party frame that the committed-seed guard cannot see. No such block exists in the seed today (block types in seed content: block, span, link only)."
  - id: WR-03
    note: "Home returns 500 if the About entry is unpublished (home reads show_availability through getAbout)."
  - id: WR-04
    note: "SEO panel noIndex, canonical and image values are not emitted by Layout.astro."
---

# Phase 3: Read Path Rewire and Parity Verification Report

**Phase Goal:** Visitors get the same site they get today, now served from EmDash, with the markdown sources removed and no new JavaScript on any public page
**Verified:** 2026-10-26
**Status:** human_needed
**Re-verification:** No, initial verification

All checks below were run against the codebase in this session, not taken from SUMMARY.md. No dev or preview server was started by the verifier. `npm run check:public-js` starts its own throwaway loopback server from a temp directory seeded from `.emdash/seed.json`; the repo `data/emdash.db` checksum was identical before and after (784014bd...).

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| #   | Truth                                                                                                                                                                              | Status                                                | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Home, projects index (newest first), every project page and About render from EmDash and match the baseline in copy and layout in light and dark, including long-form body styling | VERIFIED                                              | `node scripts/script-inventory.mjs parity ~/portfolio-baseline/current/dist <fetched pages>` printed `parity: 17/17 identical` (scripts compared strictly; five canonicalizations only, tag chips compared as a set per D-02). Pages read through `src/lib/projects.ts` (`getEmDashCollection` with `orderBy: { date: "desc" }`), `src/lib/singletons.ts` (home, about, projects_index) and `PortableText` with `prepareBody`, `ProseBlock`, `ProseLink`. Light and dark visual check at 420/640/860/full width approved by the user (human, recorded by orchestrator).                                                                    |
| 2   | Nav and head metadata come from EmDash; an unknown project slug returns a real 404 with the existing 404 page                                                                      | VERIFIED                                              | `Layout.astro` calls `getMenu("primary")` and `getSiteContext()` (settings title, tagline, seo.titleSeparator); every route title and description passes through `pageMeta` over `getSeoMeta`; no hardcoded fallback. Guard output: `NEGATIVE /projects/__no_such_slug__/ 404`, draft slug 404, database-id 404, wrong-case 404, extra-segment 404, `/__parity_missing_route__/ 404`. `[...slug].astro` returns `new Response(null, { status: 404 })`; Astro `routing/handler.js:154-157` re-renders the custom 404 page for a 404 with null body. `getProject` returns null unless `entry.id === slug`. User approved the 404 page check. |
| 3   | `src/content/projects/`, `src/data/about.*` and the file collection are deleted in the same change that flips the read path, and the build still passes                            | VERIFIED                                              | `src/content/`, `src/data/`, `src/content.config.ts`, `scripts/lib/`, import scripts all absent; no `getCollection`, `src/data` or `astro:content` consumer except `src/live.config.ts` (live collection loader only). Deletions landed in commits 79f619c (projects) and 250d69e (about), each with the reader move. `npm run build` (run by the guard) completed; `npx astro check`: 0 errors, 0 warnings, 0 hints.                                                                                                                                                                                                                      |
| 4   | The admin loads at `/_emdash/admin`, and none of its JavaScript reaches a public route                                                                                             | VERIFIED                                              | Guard: `ADMIN /_emdash/admin 302` then `/_emdash/admin/setup 200` (fresh temp DB, so the setup redirect is expected). `astro.config.mjs` sets `toolbar: false`. Guard fails the run if any public page body contains `/_emdash/`; none did. Script inventory on all 17 routes passes the Phase 1 allowlist. User approved the admin check.                                                                                                                                                                                                                                                                                                 |
| 5   | A CI check fails when any public route gains a script, `modulepreload` or module tag beyond the baseline, shown by a deliberate failing case                                       | VERIFIED (local) / human pending for first GitHub run | `npm test`: 42 pass, 0 fail, including `scripts/check-public-js.test.mjs` "fails an injected script and a modulepreload link, naming both" (exit 1, asserts both messages) and the clean fixture (exit 0). `npm run check:public-js`: `check: 17/17 passed`, `check-public-js: PASS`. `.github/workflows/ci.yml` runs `npm ci`, `npm test`, `npm run check:public-js` on push and pull_request, `contents: read`. The workflow has not run on GitHub (see Human Verification).                                                                                                                                                             |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Accepted Deviations (recorded, not hidden)

| Deviation                                                                                                         | Evidence                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tag chip order on cards (D-01, D-02)                                                                              | Parity canonicalizer sorts `stage-tag` spans per container; every other byte matches.                                                                                                                                           |
| Extra stylesheet delivery (EmDash `prose.*.css` on project pages and About; home CSS split into two style blocks) | Parity prints `CSS <route>: baseline 2, candidate 3` on `/`, `/about` and all 13 project pages. Style content is not compared by parity; covered by the approved light and dark visual check. `/projects` and `/404` are equal. |
| EmDash auto-injected `/robots.txt` and `/sitemap.xml`, Server-Timing and security headers                         | Accepted by the user; not public script tags.                                                                                                                                                                                   |
| `data-astro-cid` attributes and entity forms differ                                                               | Canonicalization rules (b) and (c); documented in 03-03.                                                                                                                                                                        |

### Required Artifacts

| Artifact                                     | Expected                                      | Status            | Details                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------- | --------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/projects.ts`                        | EmDash read adapter, props unchanged          | VERIFIED          | Substantive; used by index, projects index, detail page and StageCard (`ProjectEntry`). Data flows from `getEmDashCollection` / `getEmDashEntry`, terms mapped to `string[]`.                                                                                                                                                                                                                   |
| `src/lib/singletons.ts`                      | getHome, getAbout, getProjectsIndex           | VERIFIED          | Wired in `index.astro`, `about.astro`, `projects/index.astro`; seed holds the three published entries.                                                                                                                                                                                                                                                                                          |
| `src/lib/site.ts`                            | getSiteContext, pageMeta, ogUrl, isActiveLink | VERIFIED          | Wired in Layout and all pages; unit tests pass.                                                                                                                                                                                                                                                                                                                                                 |
| `src/lib/prose.ts`, `src/components/prose/*` | Body parity                                   | VERIFIED          | Wired into detail and About pages; parity of project bodies passes.                                                                                                                                                                                                                                                                                                                             |
| `scripts/check-public-js.mjs`                | GUARD-01 engine                               | VERIFIED          | Run end to end; asserts statuses before the script check.                                                                                                                                                                                                                                                                                                                                       |
| `scripts/script-inventory.mjs` + allowlist   | parity command, `/projects/*` wildcard        | VERIFIED          | Allowlist diff from phase start is only the `/projects/*` entry, inline hashes unchanged.                                                                                                                                                                                                                                                                                                       |
| `scripts/fixtures/draft-project.seed.json`   | Draft fixture                                 | VERIFIED          | Declares `status: draft`.                                                                                                                                                                                                                                                                                                                                                                       |
| `.github/workflows/ci.yml`                   | CI job                                        | VERIFIED (static) | Exists, correct commands; never executed on GitHub.                                                                                                                                                                                                                                                                                                                                             |
| `.emdash/seed.json`, `emdash-env.d.ts`       | Committed rebuild path and types              | VERIFIED          | Seed has 4 collections (all with drafts, revisions, preview, seo), 13 published projects, 1 each of about, home, projects_index; primary menu; settings with `seo.titleSeparator`; no draft entry. Fresh-DB seeding in the guard rebuilds a site that reaches parity 17/17. `emdash-env.d.ts` lists home and projects_index; `.emdash/types.ts` and `schema.json` are gitignored and untracked. |

### Key Link Verification

| From                                                 | To                                               | Via                                                                                | Status |
| ---------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- | ------ |
| `projects/[...slug].astro`                           | `lib/projects.ts`                                | `getProject(slug)`, null returns 404                                               | WIRED  |
| `lib/projects.ts`                                    | `emdash`                                         | `getEmDashCollection("projects", { orderBy: { date: "desc" } })`, `getEmDashEntry` | WIRED  |
| `Layout.astro`                                       | EmDash menu and settings                         | `getMenu("primary")`, `getSiteContext()`                                           | WIRED  |
| `index.astro`, `about.astro`, `projects/index.astro` | `singletons.ts`                                  | `getHome`, `getAbout`, `getProjectsIndex`                                          | WIRED  |
| `about.astro`, detail page                           | `prose.ts` and prose components                  | `PortableText value={prepareBody(...)}`                                            | WIRED  |
| `check-public-js.mjs`                                | `script-inventory.mjs`, allowlist, draft fixture | spawnSync check, second `emdash seed`                                              | WIRED  |
| `ci.yml`                                             | `package.json` scripts                           | `npm test`, `npm run check:public-js`                                              | WIRED  |

### Data-Flow Trace (Level 4)

| Artifact                   | Data                | Source                                                     | Real data                                               | Status  |
| -------------------------- | ------------------- | ---------------------------------------------------------- | ------------------------------------------------------- | ------- |
| Project cards, detail page | `ProjectEntry`      | EmDash SQLite via `getEmDashCollection` / `getEmDashEntry` | Yes (13 entries rendered, parity identical to baseline) | FLOWING |
| Home hero                  | `home` entry fields | `getEmDashEntry("home", "home")`                           | Yes (hero text matches baseline)                        | FLOWING |
| About                      | `about` entry       | `getEmDashEntry("about", "about")`                         | Yes                                                     | FLOWING |
| Nav, head                  | menu, settings      | `getMenu`, `getSiteSettings`                               | Yes                                                     | FLOWING |

### Behavioral Spot-Checks

| Behavior                                | Command                                                                            | Result                                         | Status |
| --------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| Unit and self-tests                     | `npm test`                                                                         | 42 pass, 0 fail                                | PASS   |
| Public-JS guard, 404 cases, admin route | `npm run check:public-js`                                                          | `check: 17/17 passed`, `check-public-js: PASS` | PASS   |
| Parity against baseline                 | `node scripts/script-inventory.mjs parity ~/portfolio-baseline/current/dist <out>` | `parity: 17/17 identical`                      | PASS   |
| Type check                              | `npx astro check`                                                                  | 0 errors, 0 warnings                           | PASS   |
| Repo DB untouched                       | `shasum data/emdash.db` before and after                                           | identical                                      | PASS   |

### Probe Execution

SKIPPED: the phase declares no `scripts/*/tests/probe-*.sh` probes; verification used the guard and parity commands above.

### Requirements Coverage

All seven phase IDs appear in PLAN frontmatter and in REQUIREMENTS.md (marked complete, traceability rows map each to Phase 3). No orphaned Phase 3 requirements.

| Requirement | Source Plan(s)      | Description                                                                       | Status                            | Evidence                                                                                           |
| ----------- | ------------------- | --------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- |
| REND-01     | 03-01               | Index and detail read from EmDash via `src/lib/projects.ts`, props and order kept | SATISFIED                         | `projects.ts`, orderBy date desc, parity 17/17, StageCard props via `ProjectEntry`                 |
| REND-02     | 03-01, 03-03        | Missing project returns real 404                                                  | SATISFIED                         | Guard NEGATIVE cases all 404; null-body 404 re-rendered as custom 404 page                         |
| REND-03     | 03-04, 03-05, 03-06 | About, nav, head metadata from EmDash                                             | SATISFIED                         | `getMenu`, `getSiteContext`, `pageMeta`, `getAbout`, `getHome`; seed carries the fields            |
| REND-04     | 03-02, 03-03, 03-06 | Rendered pages match baseline in copy and layout, light and dark, long-form body  | SATISFIED                         | Parity 17/17 (tag order accepted); user-approved light/dark visual check                           |
| REND-05     | 03-01, 03-06        | Markdown sources, `src/data/about.*`, file collection removed with the flip       | SATISFIED                         | Paths absent; commits 79f619c and 250d69e                                                          |
| ADMIN-01    | 03-01, 03-03, 03-06 | Admin under `/_emdash/admin`, no admin JS on public routes                        | SATISFIED                         | Guard admin route and `/_emdash/` reference check; `toolbar: false`; user-approved admin check     |
| GUARD-01    | 03-01, 03-03        | CI fails on public script, modulepreload or module drift                          | SATISFIED locally, CI run pending | Self-test with deliberate failing case; guard passes; workflow committed but not yet run on GitHub |

### Anti-Patterns Found

| File   | Line | Pattern                                                                                                            | Severity | Impact                                   |
| ------ | ---- | ------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------- |
| (none) |      | TBD, FIXME, XXX, TODO, HACK, PLACEHOLDER scan over `src`, `scripts`, `astro.config.mjs`, `.github`, `package.json` | None     | No debt markers; no `any`; no `set:html` |

Review warnings (03-REVIEW.md, all still `open` in 03-REVIEW-DISPOSITION.md, none blocks the must-haves):

- WR-01 (draft-404 guard can pass vacuously): the fixture declares `status: draft`, so today the check is meaningful, but a seed regression would not be caught.
- WR-02 (PortableText default `htmlBlock`, `iframe`, `embed`, `gallery` types stay live): the seed contains only `block`, `span` and `link` node types, so no public page has new JS today. An editor-inserted block in the admin could add JS or a frame that the seed-based guard cannot detect. This is the one warning that touches the phase goal's "no new JavaScript" clause for future content; worth triage before Phase 5 cutover.
- WR-03 (home 500 when About is unpublished), WR-04 (SEO panel noIndex, canonical, image dropped): robustness and editor-intent gaps, outside the phase success criteria.

### Human Verification Required

#### 1. First run of the CI workflow on GitHub

**Test:** With the user's approval, push the branch (or open a pull request) and watch `.github/workflows/ci.yml`.
**Expected:** The `verify` job passes `npm ci`, `npm test` and `npm run check:public-js` on ubuntu-latest using Node from `.nvmrc`.
**Why human:** Requires a git push the user has not approved (project rule: never push without permission). The commands pass locally on this machine, but the workflow's action versions, Node 24 from `.nvmrc` against `engines >=22.22.2`, and Linux runner behavior have not been exercised.

The user-approved human checks (light and dark visual comparison, 404 page, admin load) are recorded by the orchestrator and are not repeated here.

### Gaps Summary

No gaps. Every ROADMAP success criterion is backed by commands run in this session: guard 17/17, parity 17/17, 42 passing tests, type check clean, markdown sources and the file collection absent, allowlist change limited to the `/projects/*` wildcard. The only open item is the first GitHub run of the CI workflow, so the status is `human_needed` rather than `passed`.

---

_Verified: 2026-10-26_
_Verifier: Claude (gsd-verifier)_
