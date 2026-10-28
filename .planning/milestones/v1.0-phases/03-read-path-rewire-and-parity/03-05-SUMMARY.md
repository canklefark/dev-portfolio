---
phase: 03-read-path-rewire-and-parity
plan: 05
subsystem: head-and-nav
tags: [emdash, getSeoMeta, getMenu, settings, seo, nav, parity]

requires:
  - phase: 03-read-path-rewire-and-parity
    provides: getProject with raw source entry (03-01), og:url from Astro.site (03-02), parity and guard (03-03), projects_index singleton, tagline and titleSeparator settings, primary menu (03-04)
provides:
  - "src/lib/site.ts: getSiteContext, pageMeta, ogUrl, NAV_PATHS, isActiveLink, NavId"
  - "src/lib/singletons.ts: getProjectsIndex and PROJECTS_INDEX_SLUG over a private loadSingleton"
  - "Layout.astro reads the primary menu and the tagline setting; Nav.astro renders menu items through sanitizeHref"
  - "project detail, projects index and 404 heads computed by pageMeta over getSeoMeta, with SEO panel overrides honored"
affects: [03-06, 04, 05]

actuals:
  tokens: 2800
  tasks: 2
  commits: 3
plan_head_before: 67166e183afecf5b7b814e491ba7967d66e4f6ae
plan_head_after: dfa37f891dfe2ace26db5ac38ea37790e8f99acb

tech-stack:
  added: []
  patterns:
    - "Heads are computed through one thin wrapper over getSeoMeta; the Layout tag set and order stay hardcoded and EmDashHead is unused (D-04)"
    - "Structural singletons are read through loadSingleton, which throws a named Error instead of rendering an empty page"

key-files:
  created:
    - src/lib/site.ts
    - src/lib/site.test.mjs
    - src/lib/singletons.ts
  modified:
    - src/layouts/Layout.astro
    - src/components/Nav.astro
    - src/pages/projects/[...slug].astro
    - src/pages/404.astro
    - src/pages/projects/index.astro

key-decisions:
  - "pageMeta returns meta.title (the full title with suffix) for title, og:title and twitter:title; no separator or site title is hardcoded in code"
  - "loadSingleton pins the entry data type with getEmDashEntry<K, EmDashCollections[K]> because the inferred generic is a union of all collections"

patterns-established:
  - "Panel title gets the suffix appended once; a panel description replaces the computed one (proven by unit tests)"

requirements-completed: [REND-03]

coverage:
  - id: D1
    description: "pageMeta, ogUrl and isActiveLink behave as specified, including the SEO panel override with the suffix appended once"
    requirement: REND-03
    verification:
      - kind: unit
        ref: "node --test src/lib/site.test.mjs: 15 pass, 0 fail"
        status: pass
    human_judgment: false
  - id: D2
    description: 'Layout reads getMenu("primary") and site.tagline, throws a named Error when the menu is missing; Nav renders menu items through sanitizeHref with the theme-toggle script untouched'
    requirement: REND-03
    verification:
      - kind: other
        ref: "guard check: 17/17 passed (script allowlist hash) and parity: 17/17 identical; greps for getMenu, getSiteContext, no hardcoded description or link array"
        status: pass
    human_judgment: false
  - id: D3
    description: "Detail, 404 and projects index titles and descriptions come from EmDash through pageMeta and equal the baseline"
    requirement: REND-03
    verification:
      - kind: other
        ref: "fetched titles 'Catalog CMS — Zeik Cookson', 'Projects — Zeik Cookson', '404 — Zeik Cookson' present; parity: 17/17 identical"
        status: pass
    human_judgment: false
  - id: D4
    description: "A missing primary menu or singleton fails loudly rather than rendering an empty nav or page"
    requirement: REND-03
    verification: []
    human_judgment: true
    rationale: "The throw paths are straightforward but no automated test removes the menu or entry from a running server; judged by code review"

duration: 5min
completed: 2026-10-26
status: complete
---

# Phase 3 Plan 05: Head and Nav on EmDash Summary

**The nav now comes from the EmDash primary menu through sanitizeHref, the fallback description and title suffix from EmDash settings, and every route's title and description from getSeoMeta through one pageMeta helper, with output byte-identical to the baseline (parity 17/17, guard 17/17).**

## Performance

- **Duration:** about 5 min
- **Completed:** 2026-10-26
- **Tasks:** 2 of 2
- **Files:** 8 changed (3 created, 5 modified)

## Accomplishments

- `src/lib/site.ts` holds `getSiteContext` (throws a named Error when title or tagline is missing), `pageMeta`, `ogUrl`, `NAV_PATHS`, `isActiveLink` and `NavId`. It imports only from `emdash`, so `node --test` loads it.
- `Layout.astro` fetches `getMenu("primary")` and the site context, throws a named Error when the menu is missing, and uses `site.tagline` as the description fallback. The head tag set, the favicon and font links and the three inline scripts are unchanged.
- `Nav.astro` takes `links` and `activeNav`, renders `sanitizeHref(link.url)` and derives the active state from `isActiveLink`. The theme-toggle script block has no diff.
- Project detail, projects index and 404 pass `pageMeta` output to Layout. The projects index reads its entry through `getProjectsIndex()`; the empty-state constant and the StageCard loop are untouched.

## Results

- `node --test src/lib/site.test.mjs`: 15 tests, 15 pass (7 pageMeta, 4 ogUrl, 4 isActiveLink). All `src/lib` tests: 31 pass.
- `npx astro check`: 0 errors, 0 warnings, 0 hints (35 files).
- Guard: `check: 17/17 passed`. Parity: `parity: 17/17 identical` (CSS count notes printed by the compare are reported, not failures).
- Fetched titles equal the baseline: Catalog CMS, Projects and 404, each with ` — Zeik Cookson`.
- `EmDashHead` appears nowhere under `src`.

## Task Commits

1. **RED:** `863077f` test(03-05): add failing tests for pageMeta, ogUrl and isActiveLink
2. **Task 1 GREEN:** `82af65d` feat(03-05): site helpers, layout on settings and the primary menu, nav on menu items
3. **Task 2:** `dfa37f8` feat(03-05): detail, 404 and projects index heads through pageMeta

## Deviations from Plan

**1. [Rule 1 - Bug] Test fixture missing ContentSeo fields**

- **Found during:** Task 1 (astro check)
- **Issue:** The panel override fixture gave `seo` only title and description; `ContentSeo` requires image, canonical and noIndex, so `astro check` reported 1 error on the `.mjs` test.
- **Fix:** Added `image: null`, `canonical: null`, `noIndex: false`.
- **Files modified:** src/lib/site.test.mjs
- **Commit:** 82af65d

**2. [Rule 1 - Bug] loadSingleton return type not assignable**

- **Found during:** Task 2 (astro check)
- **Issue:** `getEmDashEntry(collection, slug)` infers entry data as the union of all collections, which is not assignable to `EmDashCollections[K]`.
- **Fix:** Pinned the type argument: `getEmDashEntry<K, EmDashCollections[K]>(collection, slug)`.
- **Files modified:** src/lib/singletons.ts
- **Commit:** dfa37f8

**Total deviations:** 2 auto-fixed (both type errors caught by `astro check`). **Impact:** none on behavior or scope.

TDD note: the RED commit is `test(...)` and Task 1 is the GREEN commit, so the plan has three commits for two tasks.

## Authentication Gates

None.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. The nav href, SEO panel value and og:url mitigations (T-03-20, T-03-21, T-03-31) are implemented as planned: `sanitizeHref` on every menu URL, Astro-escaped attribute expressions, and `ogUrl` built from `Astro.site` and the pathname only. T-03-22 is met by the named Errors in `getSiteContext`, `Layout.astro` and `loadSingleton`.

## Safety Notes

- No dev server or preview was started; the guard's own child server on 127.0.0.1 was the only server. Nothing was pushed. Work stays on `emdash-migration`.
- The Nav label length at 420px is unchanged for the seeded labels (Home, Projects, About); longer admin labels remain a flagged assumption from the plan.

## Next Phase Readiness

Ready for plan 03-06: `src/lib/singletons.ts` is in place with `loadSingleton`, so the home and About readers can be added to it, and `getSiteContext` and `pageMeta` are available for those two routes.

## Self-Check: PASSED

- src/lib/site.ts, src/lib/site.test.mjs, src/lib/singletons.ts present: verified.
- Commits 863077f, 82af65d and dfa37f8 are ancestors of HEAD: verified.
