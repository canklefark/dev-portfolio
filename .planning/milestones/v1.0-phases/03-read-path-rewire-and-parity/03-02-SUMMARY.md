---
phase: 03-read-path-rewire-and-parity
plan: 02
subsystem: prose-rendering
tags:
  [
    portable-text,
    retext-smartypants,
    github-slugger,
    og-url,
    node-test,
    tdd,
    astro,
  ]

requires:
  - phase: 03-read-path-rewire-and-parity
    provides: getProject adapter, server build and the check-public-js guard (plan 03-01)
provides:
  - "prepareBody(): render-time smart punctuation and github-slugger heading ids on Portable Text blocks"
  - "ProseBlock.astro and ProseLink.astro: style-free emdash/ui PortableText overrides (heading ids, no space inside anchors, sanitized hrefs)"
  - "Project detail bodies matching the baseline heading ids, curly punctuation and link spacing"
  - "og:url built from Astro.site with a trailing slash on every route; optional canonicalPath Layout prop, pinned to /404/ on the 404 page"
  - "retext, retext-smartypants and github-slugger as direct runtime dependencies"
affects: [03-03, 03-04, 03-06]

status_note: "plan_head_before and plan_head_after below are measured from the commit ledger"
plan_head_before: 0ed3f8b16a01209ecacd5c878fd86f187a3eacd7
plan_head_after: 7b8e9132dd343c5afcb37394011d292441c3cce8

actuals:
  tokens: 2500
  tasks: 2
  commits: 3

tech-stack:
  added:
    - "retext 9.0.0 (runtime)"
    - "retext-smartypants 6.2.0 (runtime)"
    - "github-slugger 2.0.0 (runtime)"
  patterns:
    - "Pure body transform (prepareBody) kept in src/lib so node --test loads it without Astro"
    - "Prose components carry no style block, class or attribute so the global .prose rules in blocks.css apply unchanged"
    - "og:url from the configured site, never the request host"

key-files:
  created:
    - src/lib/prose.ts
    - src/lib/prose.test.mjs
    - src/components/prose/ProseBlock.astro
    - src/components/prose/ProseLink.astro
  modified:
    - package.json
    - package-lock.json
    - "src/pages/projects/[...slug].astro"
    - src/layouts/Layout.astro
    - src/pages/404.astro

key-decisions:
  - "Heading ids are computed from the raw span text before smart punctuation (github-slugger strips straight and curly apostrophes alike, so What's Next gives whats-next either way)"
  - "prepareBody slugs h1 to h6 (the plan text and research regex differ: spec said h1 to h6 in the action, h2 to h4 in the behavior); ProseBlock renders ids on h1 to h6 to match"
  - "RED commit carries a pass-through prose.ts stub so the target tests fail on assertions, not on a missing module"

patterns-established:
  - "Same one-slugger-per-body rule as rehype-slug: duplicates get -1"

requirements-completed:
  - REND-04

coverage:
  - id: D1
    description: "Every h2, h3 and h4 in a project body carries the baseline id; the 13 fetched project pages have heading id lists identical to ~/portfolio-baseline/current/dist"
    requirement: REND-04
    verification:
      - kind: unit
        ref: "src/lib/prose.test.mjs#prepareBody heading ids (5 tests)"
        status: pass
      - kind: integration
        ref: 'node scripts/check-public-js.mjs --out DIR then grep ''<h2 id="the-problem"'' and ''<h2 id="whats-next"'' on catalog-cms; heading-id list diff vs baseline for 13 pages: 0 diffs'
        status: pass
    human_judgment: false
  - id: D2
    description: "Non-code spans render curly apostrophes and quotes; code spans stay literal"
    requirement: REND-04
    verification:
      - kind: unit
        ref: "src/lib/prose.test.mjs#prepareBody smart punctuation (4 tests)"
        status: pass
      - kind: integration
        ref: "guard output: 'It’s a form' on catalog-cms, '“flag for discussion”' on agency-ops-hub; curly-character counts per page equal the baseline on 13 pages"
        status: pass
    human_judgment: false
  - id: D3
    description: "A link in a body has no whitespace inside the anchor"
    requirement: REND-04
    verification:
      - kind: integration
        ref: 'grep -F ''(see <a href="/projects/homelab-k8s">Homelab Kubernetes Cluster</a>)'' on the fetched observability-stack page'
        status: pass
    human_judgment: false
  - id: D4
    description: "ProseBlock and ProseLink add no style block, class or attribute; ProseLink sanitizes every href and sets target and rel only for blank, non-anchor links"
    requirement: REND-04
    verification:
      - kind: other
        ref: "grep gate: no '<style' in either component, sanitizeHref present in ProseLink, no set:html under src"
        status: pass
    human_judgment: false
  - id: D5
    description: "og:url comes from the configured site with a trailing slash on every route and /404 is pinned to /404/"
    requirement: REND-04
    verification:
      - kind: integration
        ref: "fetched pages: catalog-cms og:url https://dev.zeikcookson.com/projects/catalog-cms/, home https://dev.zeikcookson.com/, 404 https://dev.zeikcookson.com/404/ (guard server ran on 127.0.0.1)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Retext, retext-smartypants and github-slugger are runtime dependencies at 9.0.0, 6.2.0 and 2.0.0 with no new package in the lockfile"
    requirement: REND-04
    verification:
      - kind: other
        ref: "npm ls retext@9.0.0 retext-smartypants@6.2.0 github-slugger@2.0.0 --depth=0; package-lock.json diff is 5 lines (3 direct entries), no new node_modules entries"
        status: pass
    human_judgment: false
  - id: D7
    description: "The script guard still passes 17 of 17 and the allowlist and inventory are unedited"
    requirement: REND-04
    verification:
      - kind: integration
        ref: "node scripts/check-public-js.mjs --out DIR (check: 17/17 passed, check-public-js: PASS)"
        status: pass
    human_judgment: false
  - id: D8
    description: "The visual result of the .prose rules is unchanged in light and dark (computed values, extra EmDash component stylesheet)"
    requirement: REND-04
    verification: []
    human_judgment: true
    rationale: "No browser comparison was run in this plan (no dev or preview server was started, per the project rules); the markup is byte-equivalent where measured but computed styles are not asserted. Plan 03-03 parity compare and the visual pass cover it"

duration: 4min
completed: 2026-10-26
status: complete
---

# Phase 3 Plan 02: Prose parity and og:url Summary

**Project bodies now render with the baseline's heading ids, curly punctuation and anchor spacing through a small `prepareBody` step plus two style-free Portable Text components, and og:url is built from the configured site instead of the request host, with the guard still at 17 of 17.**

## Performance

- **Duration:** about 4 min
- **Completed:** 2026-10-26T15:58:47Z
- **Tasks:** 2 (one TDD, one auto)
- **Files:** 4 created, 5 modified

## Accomplishments

- `prepareBody` runs `retext` + `retext-smartypants` (defaults, the engine behind the baseline) on every span without the `code` mark and assigns `headingId` through one `GithubSlugger` per call. It returns new objects, never mutates its input, passes non-block items through, and returns `[]` for `undefined`.
- `ProseBlock.astro` renders h1 to h6 with `id={headingId}`, blockquote and p, with no whitespace around the slot and no style, class or other attribute. `ProseLink.astro` runs the href through `sanitizeHref`, sets `target="_blank"` and `rel="noopener noreferrer"` only for blank links that are not same-page anchors, and keeps the slot inside the anchor with no whitespace.
- The detail page renders `prepareBody(detail.body)` through `PortableText` with `{ block: ProseBlock, mark: { link: ProseLink } }` inside the existing `div.prose`.
- `Layout.astro` computes og:url as `new URL(canonicalPath ?? pathname-with-one-trailing-slash, Astro.site).href` and throws if `site` is unset. `404.astro` passes `canonicalPath="/404/"`.
- Fetched-page evidence from the guard output tree (the guard child server ran on 127.0.0.1, so a request-host og:url would have shown 127.0.0.1; none did, 0 occurrences):
  - catalog-cms: `<h2 id="the-problem"`, `<h2 id="whats-next"`, `It’s a form` (ids in order: the-problem, approach, the-hard-part, wordpress-sync, current-state, whats-next, stack)
  - agency-ops-hub: `“flag for discussion”`
  - observability-stack: `(see <a href="/projects/homelab-k8s">Homelab Kubernetes Cluster</a>)`
  - og:url: `https://dev.zeikcookson.com/projects/catalog-cms/`, `https://dev.zeikcookson.com/` (home), `https://dev.zeikcookson.com/404/`
  - Heading id lists (`<h2|h3|h4 id=...>`) of all 13 fetched project pages equal the baseline in `~/portfolio-baseline/current/dist` (0 diffs); curly-quote and apostrophe counts per page also equal the baseline (0 diffs).
- Guard: `check: 17/17 passed`, `check-public-js: PASS`. `npx astro check`: 0 errors, 0 warnings, 0 hints. No stray `dist/server/entry` process afterwards.

`npm ls retext retext-smartypants github-slugger --depth=0`:

```
portfolio@0.0.1
├── github-slugger@2.0.0
├── retext-smartypants@6.2.0
└── retext@9.0.0
```

The lockfile diff is 5 lines (three new direct entries in the root package block); no new package was added, since all three were already locked as transitive dependencies of astro (T-03-SC).

## Task Commits

1. **Task 1: prepareBody (TDD)**
   - RED: `a61f7c7` (test) - 12 tests, 7 failing on assertions
   - GREEN: `b9a4d37` (feat) - implementation plus the three dependencies, 16 of 16 tests pass (12 here, 4 from projects.test.mjs)
   - REFACTOR: none needed
2. **Task 2: Prose components and og:url** - `7b8e913` (feat)

**Plan metadata:** the docs commit that carries this SUMMARY, STATE.md, ROADMAP.md and REQUIREMENTS.md.

## TDD Gate Compliance

- **RED:** run with the TAP reporter, 12 tests, 5 pass, 7 fail. `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK` (reason `target_test_failed`, target "suffixes a duplicate heading with -1", expected `stack-1`, actual `undefined`).
- **Semantic assessment:** the module loaded (a pass-through stub shipped with the RED commit) and the failing tests are exactly the behaviors that need the implementation (apostrophe, quote pair, code-adjacent span, heading ids, duplicate suffix, fresh slugger). The pass-through, no-mutation, no-headingId-on-paragraph, code-literal and undefined cases pass at RED by design, because the stub already satisfies them. No load, syntax or fixture fault.
- **GREEN:** `prose.ts` implemented, all tests pass.
- **REFACTOR:** none.

## Files Created/Modified

- `src/lib/prose.ts` - `prepareBody`
- `src/lib/prose.test.mjs` - 12 node:test cases
- `src/components/prose/ProseBlock.astro`, `src/components/prose/ProseLink.astro` - style-free PortableText overrides
- `src/pages/projects/[...slug].astro` - wires `prepareBody` and the two components
- `src/layouts/Layout.astro` - `canonicalPath` prop, og:url from `Astro.site`
- `src/pages/404.astro` - `canonicalPath="/404/"`
- `package.json`, `package-lock.json` - three runtime dependencies

## Decisions Made

- Heading ids are slugged from raw span text (before smart punctuation); both orders give the baseline ids.
- `prepareBody` slugs h1 to h6 (the task action says h1 to h6; the behavior list only names h2 to h4); `ProseBlock` renders the id on all six levels so the two stay consistent. Seeded bodies only use h2 to h4.
- The RED commit includes a pass-through `prose.ts` stub so RED fails on assertions rather than on a missing module.

## Deviations from Plan

None - plan executed as written, with these bookkeeping notes.

- The test file uses `@ts-check`, and `npx astro check` type-checks it; a first draft had a cast that `astro check` rejected (TS2352). It was replaced with an `unknown`-parameter helper before the GREEN commit, so no commit failed the check.
- The 16-test count in the verify command is `prose.test.mjs` (12) plus `projects.test.mjs` (4).

**Total deviations:** 0 auto-fixed.

## Issues Encountered

None. No auth gates. The package installs matched the plan's pinned versions on the first attempt.

## Known Stubs

None. (The `prose.ts` stub existed only in the RED commit `a61f7c7` and was replaced in `b9a4d37`.)

## Threat Flags

None. No new network endpoint, auth path or trust boundary beyond the plan's threat model. T-03-08 (ProseLink sanitizeHref), T-03-09 (og:url from `Astro.site`), T-03-30 (no raw HTML injection: `grep set:html src` returns nothing) and T-03-SC (pinned versions, no lockfile additions) are mitigated as planned.

## Flagged assumptions carried forward

- Smart punctuation runs per span (research A6); a quote opening in one span and closing in another (for example around a link) could differ from the old whole-paragraph run. No current body has that shape, so the parity compare cannot catch it.
- EmDash `PortableText` pulls its component CSS into project pages (one extra stylesheet, research Pattern 5 side effect). It changes stylesheet delivery, not JS or markup, and was not measured in a browser here (see coverage D8).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03-03 can run the canonicalizing parity compare against the baseline: heading ids, punctuation, link spacing and og:url already match on the 13 project pages.
- About and the home hero still read `src/data/about.*` until plan 03-06; the About body is not touched here.
- Work stays on `emdash-migration`, unpushed; the Cloudflare Pages build on `main` would break on a server build.

## Self-Check: PASSED

All created and modified files exist on disk and commits a61f7c7, b9a4d37 and 7b8e913 are ancestors of HEAD.

---

_Phase: 03-read-path-rewire-and-parity_
_Completed: 2026-10-26_
