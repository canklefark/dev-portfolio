---
phase: 03-read-path-rewire-and-parity
plan: 06
subsystem: home-and-about
tags: [emdash, singletons, portabletext, sanitizeHref, parity, visual-check]

requires:
  - phase: 03-read-path-rewire-and-parity
    provides: pageMeta, getSiteContext and loadSingleton (03-05), prepareBody and prose components (03-02), parity and public-JS guard (03-03), home and about singletons seeded (03-04)
provides:
  - "src/lib/singletons.ts: getHome, getAbout (AboutPage view), HOME_SLUG, ABOUT_SLUG, AboutCell"
  - "index.astro hero, availability chip and head read from EmDash"
  - "about.astro heading, role, body, cells, contacts and stack read from EmDash"
  - "src/data/about.ts and src/data/about.md deleted; src/data/ no longer exists"
affects: [04, 05, 06]

actuals:
  tokens: 5000
  tasks: 2
  commits: 1
plan_head_before: 1dd1e092f3f6ee063649470f2692d3f99217cee8
plan_head_after: 250d69e134dbda1623ebd9a4938e8eb975e77fc2

tech-stack:
  added: []
  patterns:
    - "getAbout maps the raw entry to a view: cell variant default becomes absent, lists default to [], show_availability coerced with Boolean"
    - "Contact hrefs and the About body render only through sanitizeHref and PortableText with ProseBlock and ProseLink"

key-files:
  created: []
  modified:
    - src/lib/singletons.ts
    - src/pages/index.astro
    - src/pages/about.astro
  deleted:
    - src/data/about.ts
    - src/data/about.md

key-decisions:
  - "AboutPage keeps the raw entry as source so an editor's SEO panel value can reach pageMeta, matching ProjectDetail"
  - "Template whitespace around replaced literals kept exactly as before, so no comparator change was needed"

requirements-completed: [REND-03, REND-04, REND-05, ADMIN-01]

coverage:
  - id: D1
    description: "Home hero (stage line, name, bio), availability chip and home head read from the home and about entries"
    requirement: REND-03
    verification:
      - kind: other
        ref: "parity: 17/17 identical; built title 'Zeik Cookson — DevOps Engineer' present in dist index.html"
        status: pass
    human_judgment: false
  - id: D2
    description: "About page heading, role, PortableText body, cells, contacts (sanitizeHref) and stack read from the about entry; title 'About — Zeik Cookson'"
    requirement: REND-03
    verification:
      - kind: other
        ref: "parity: 17/17 identical; built About page contains 'engine bay.</em>' and the About title"
        status: pass
    human_judgment: false
  - id: D3
    description: "src/data/about.ts and about.md removed in the same commit as their last readers"
    requirement: REND-05
    verification:
      - kind: other
        ref: "git show --name-only of the deleting commit 250d69e lists about.ts, about.md, index.astro, about.astro; test ! -e src/data"
        status: pass
    human_judgment: false
  - id: D4
    description: "Light and dark visual match with the baseline at about 420, 640, 860 px and full width, 404 page with status 404, admin loads at /_emdash/admin"
    requirement: REND-04
    verification: []
    human_judgment: true
    rationale: "Manual visual comparison by the user (blocking-human checkpoint); user replied approved with no differences reported"

duration: about 1 session
completed: 2026-10-26
status: complete
---

# Phase 3 Plan 06: Home and About on EmDash Summary

_*The home hero and the About page now read the home and about singletons (PortableText body through prepareBody, contact hrefs through sanitizeHref), src/data/about.* is deleted in the same commit, and the site is still 17/17 identical to the baseline with the user's light and dark visual pass approved._*

## Accomplishments

- `src/lib/singletons.ts` gained `getHome`, `getAbout`, `AboutPage`, `AboutCell`, `HOME_SLUG` and `ABOUT_SLUG`. `getAbout` maps the "default" cell variant to absent, defaults the lists to `[]`, coerces `show_availability` with `Boolean` and builds the heading from the three heading fields. No `any`.
- `index.astro` loads projects, home, about and the site context together; the stage line, hero name and bio render the home fields with the original line layout, and the AVAIL chip follows `about.showAvailability` (false, so it does not render, as in the baseline). The head comes from `pageMeta(home, site, { withSiteTitle: false, defaultDescription: site.tagline })`.
- `about.astro` renders the h1 as `line1<br />line2 <em>accent</em>`, the role, the body through `PortableText` with `ProseBlock` and `ProseLink`, and every contact href through `sanitizeHref`. Cells, stack table and Switcher markup are unchanged. The head uses `pageMeta(about.source, site, { withSiteTitle: true })`.
- `src/data/about.ts` and `src/data/about.md` were deleted in the same commit; `src/data/` no longer exists.

## Results

- `npm test`: 42 tests, 42 pass.
- `npx astro check`: 0 errors, 0 warnings, 0 hints (34 files).
- Guard: `check: 17/17 passed`, `check-public-js: PASS`.
- Parity against the baseline: `parity: 17/17 identical` (CSS count notes, baseline 2 and candidate 3 on project pages, are reported by the comparer, not failures).
- Built titles: `<title>Zeik Cookson — DevOps Engineer</title>` and `<title>About — Zeik Cookson</title>`; the About page contains `engine bay.</em>`.
- REND-05 same-commit check: the commit that deleted `src/data/about.ts` (250d69e) also lists `src/data/about.md`, `src/pages/about.astro`, `src/pages/index.astro` and `src/lib/singletons.ts`.

## User Visual Result (Task 2, blocking-human checkpoint)

The user ran the production build and the baseline side by side and replied "approved". Light and dark, widths of about 420, 640 and 860 px and full width, `/`, `/projects/`, `/projects/catalog-cms/` and `/about/`, the unknown-slug 404 and the admin load were all confirmed, with no differences reported.

## Task Commits

1. **Task 1:** `250d69e` feat(03-06): home hero and About page from EmDash, drop src/data/about.*
2. **Task 2:** checkpoint, no code change; approved by the user.

## Accepted Deviations (phase record, D-01, D-02)

Differences from the baseline that the phase accepts:

- Tag order on project cards and pages follows EmDash term order (D-01 and D-02); tags are compared as a set in parity.
- EmDash's component stylesheet and the StageCard CSS are delivered as files, so project pages carry 3 stylesheets against the baseline's 2.
- Astro `data-astro-cid` attributes and HTML entity forms differ from the baseline serialization.
- EmDash auto-injects `/robots.txt` and `/sitemap.xml` routes.
- Server-Timing and EmDash security headers appear on responses. Phase 5 strips Server-Timing at the proxy and sets `EMDASH_SITE_URL` for sitemap origins (T-03-25, accepted).

## Docs Flagged for Phase 6 (DOCS-01, DOCS-03)

These still describe the markdown and `src/data` workflow and are now stale:

- The "Adding a project" section of `CLAUDE.md`
- `.cursor/skills/portfolio-projects/SKILL.md`
- `.cursor/skills/portfolio-logbook/SKILL.md`
- `scripts/log.sh`
- the portfolio-update skill

## Deviations from Plan

None - plan executed exactly as written.

## Authentication Gates

None.

## Issues Encountered

None.

## Known Stubs

None. The hero chips, CTAs, section labels and the contact lead line remain template constants by design (D-06).

## Threat Flags

None. T-03-23 (contact hrefs through `sanitizeHref`) and T-03-24 (About body only through PortableText with ProseBlock and ProseLink) are implemented as planned. No package was installed (T-03-SC).

## Safety Notes

- No dev server or preview was started by the executor; the guard's own child server on 127.0.0.1 was the only server, and the user ran the servers for the visual check. Nothing was pushed. Work stays on `emdash-migration`.
- The pre-existing untracked files `.planning/PROJECT.md`, `.planning/config.json`, `.planning/research/` and `.planning/state.json` were left unstaged.

## Next Phase Readiness

Phase 3 plans are all complete: every public page renders from EmDash, the markdown sources and `src/data/about.*` are gone, and parity and the public-JS guard hold. Ready for phase verification and Phase 4.

## Self-Check: PASSED

- src/lib/singletons.ts, src/pages/index.astro and src/pages/about.astro present: verified.
- src/data/about.ts and src/data/about.md absent: verified.
- Commit 250d69e is an ancestor of HEAD: verified.
