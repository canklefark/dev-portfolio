---
phase: 03-read-path-rewire-and-parity
reviewed: 2026-10-26T00:00:00Z
depth: standard
files_reviewed: 29
files_reviewed_list:
  - .emdash/seed.json
  - .github/workflows/ci.yml
  - .gitignore
  - astro.config.mjs
  - emdash-env.d.ts
  - package.json
  - scripts/check-public-js.mjs
  - scripts/check-public-js.test.mjs
  - scripts/fixtures/draft-project.seed.json
  - scripts/script-allowlist.json
  - scripts/script-inventory.mjs
  - scripts/parity.test.mjs
  - src/components/Nav.astro
  - src/components/StageCard.astro
  - src/components/prose/ProseBlock.astro
  - src/components/prose/ProseLink.astro
  - src/layouts/Layout.astro
  - src/lib/format.ts
  - src/lib/projects.ts
  - src/lib/projects.test.mjs
  - src/lib/prose.ts
  - src/lib/prose.test.mjs
  - src/lib/site.ts
  - src/lib/site.test.mjs
  - src/lib/singletons.ts
  - src/pages/404.astro
  - src/pages/about.astro
  - src/pages/index.astro
  - src/pages/projects/[...slug].astro
  - src/pages/projects/index.astro
findings:
  critical: 0
  warning: 4
  info: 8
  total: 12
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-10-26
**Depth:** standard
**Files Reviewed:** 30 (the seed was skimmed for secrets, not line-reviewed)
**Status:** issues_found

## Summary

The read path is solid against the threat register. Verified directly:

- **Draft and id-form leaks (T-03-27, T-03-28):** `getProject` rejects any entry whose `id` is not the requested slug. `getEmDashEntry` only serves drafts in edit or preview mode, which require an authenticated editor cookie or a signed `_preview` token. The toolbar is off.
- **Stored XSS and `javascript:` hrefs:** Astro escapes all text. `sanitizeHref` is applied to nav, About contacts and body links, and there is no `set:html` anywhere under `src`.
- **og:url spoofing (T-03-09):** the URL is built from `Astro.site`, never the request host.
- **Command injection in the guard:** every `spawn` and `spawnSync` uses an argument array, and the SQLite query uses a bound parameter.
- **Secrets:** the committed seed contains no Dev Admin user, no email and no credentials. The only password and secret hits are project prose.
- **Types:** there is no `any` in the new TypeScript.

There are no blockers. The main gaps are places where the guard and the code give a weaker guarantee than the plans claim. The draft 404 proof can pass vacuously. Editor-authored rich text can add public JS or iframes that the CI guard cannot see. The editor's SEO-panel `noIndex`, `canonical` and image values are silently ignored. The home page has a hard dependency on the About entry.

## Warnings

### WR-01: Draft-404 guard can pass vacuously (T-03-27)

**File:** `scripts/check-public-js.mjs:302-311, 398-400`
**Issue:** The guard seeds the draft fixture and asserts that `/projects/draft-fixture-project/` returns 404. It never confirms the draft row exists in the temp database with `status = 'draft'`. `applySeed` only checks the CLI exit code. If a future EmDash version skips drafts on `seed`, rejects the fixture shape, or the fixture slug drifts, the 404 assertion still passes because the slug is simply missing. The plan summary says this was verified once by hand with `sqlite3`. That check is not in the guard, so it cannot catch a regression. The `/projects/` listing check has the same blind spot.
**Fix:** After seeding, read the row and fail if it is not a draft:

```js
function draftRow(work, slug) {
  const db = new DatabaseSync(join(work, "data", "emdash.db"), {
    readOnly: true,
  });
  try {
    return db
      .prepare(
        "SELECT status FROM ec_projects WHERE slug = ? AND deleted_at IS NULL",
      )
      .get(slug);
  } finally {
    db.close();
  }
}
// in run(), after the fixture seed:
if (draftRow(work, DRAFT_SLUG)?.status !== "draft") {
  return `draft fixture ${DRAFT_SLUG} is not a draft row in the temp database`;
}
```

### WR-02: Editor-authored rich text can add public JS and iframes that the guard cannot see (GUARD-01, T-03-24)

**File:** `src/pages/projects/[...slug].astro:49-52`, `src/pages/about.astro:27-30`
**Issue:** The `PortableText` call overrides only `block` and `mark.link`. EmDash merges these over its defaults (`emdash/src/components/PortableText.astro`), so the default `types` stay live for every body. These include `htmlBlock`, `embed`, `iframe`, `gallery`, `image` and `code`. `HtmlBlockFrame.astro` ships a client `<script>` and `Iframe.astro` uses `sandbox="allow-scripts"`. If an editor inserts one of these blocks in the admin, a public page gains JS or a third-party frame. The CI guard only crawls routes built from the committed seed, so it passes while production drifts. That breaks the "no new JS on any public page" rule in a way the phase's own guard cannot detect. The summaries state that bodies render "only through ProseBlock and ProseLink", but that holds only for `block` and `link` nodes. The multi-paragraph blockquote path also uses EmDash's own `Block` and `emdashMarkComponents` (`BlockquoteGroup.astro`), so links inside a multi-paragraph quote bypass `ProseLink`.
**Fix:** Pass `types` overrides that render nothing, or a plain element, for block types the site does not use. Share one constant between both pages:

```astro
---
const noop = () => null;
const bodyComponents = {
  block: ProseBlock,
  mark: { link: ProseLink },
  types: { htmlBlock: noop, iframe: noop, embed: noop, gallery: noop },
};
---
<PortableText value={prepareBody(detail.body)} components={bodyComponents} />
```

Alternatively, restrict the allowed block types on the `body` field schema in the seed. Add a guard test that seeds an `htmlBlock` into the fixture and asserts the page output is unchanged.

### WR-03: Home page returns 500 whenever the About entry is unpublished or missing

**File:** `src/pages/index.astro:11`, `src/lib/singletons.ts:9-24`
**Issue:** The home page calls `getAbout()` only to read `show_availability`. `loadSingleton` throws when the entry is missing or unpublished. Switching About to draft in the admin therefore turns `/` into a 500, not only `/about`. The About body, cells, stack and contacts are also fetched and mapped for one boolean. The availability toggle is coupled to a different page's publish state.
**Fix:** Read the flag without making About structural for the home page. Add a `getShowAvailability()` that uses `getEmDashEntry` directly and returns `false` when the entry is absent. Or move `show_availability` to the `home` singleton, where it belongs.

### WR-04: SEO panel `noIndex`, `canonical` and `image` are accepted but silently dropped

**File:** `src/lib/site.ts:40-51`, `src/layouts/Layout.astro:22-34`
**Issue:** `pageMeta` returns only `title` and `description` from `getSeoMeta`. Every entry has `hasSeo` and an SEO panel, but `Layout.astro` has no `robots`, `<link rel="canonical">` or `og:image` output. An editor who ticks "noindex" on a project, or sets a canonical URL or share image, gets no effect, and the page stays indexable. The `noIndex` case is the dangerous one because it fails open on an explicit privacy intent. The phase amendment decided not to use `EmDashHead`, so the panel is only half honoured by design, but nothing documents or surfaces that.
**Fix:** Return `noIndex`, `canonical` and `image` from `pageMeta` and emit them in `Layout.astro`:

```astro
{meta.noIndex && <meta name="robots" content="noindex, nofollow" />}
{meta.canonical && <link rel="canonical" href={meta.canonical} />}
{meta.image && <meta property="og:image" content={meta.image} />}
```

If the omission is intentional, remove the unused panel fields from the plan docs and record it as an accepted deviation.

## Info

### IN-01: `ogUrl` accepts a protocol-relative path and would change host

**File:** `src/lib/site.ts:54-60`
**Issue:** `ogUrl("//evil.com/", site)` returns `https://evil.com/`, because `new URL("//host", base)` replaces the origin. The pathname is request-derived (`Astro.url.pathname`). Today every route that reaches `Layout` has a fixed or validated path. Unmatched paths render the 404 page, which pins `/404/`. The helper's contract ("never the request host") relies on that routing behaviour and not on its own code.
**Fix:** Reject or normalize it inside the helper:

```ts
const path = "/" + pathname.replace(/^\/+/, "").replace(/\/?$/, "/");
const url = new URL(path, site);
if (url.origin !== site.origin) throw new Error("og:url left the site origin");
return url.href;
```

Add a test for `//evil.com`.

### IN-02: `formatProjectDate` has no consumer

**File:** `src/lib/format.ts:16-19`, `src/lib/projects.ts:24-25`
**Issue:** IN-01 from Phase 2 is marked closed by adding the UTC-pinned formatter. No page or component calls it, and `ProjectEntry.data.date` is never rendered. Only the unit test uses it. The test also passes regardless of `process.env.TZ`, because the formatter has an explicit `timeZone: "UTC"` and the `Intl` object is created at module load, so it does not actually exercise the process-zone failure it claims to guard.
**Fix:** Either wire it to the place a date is shown, or drop it and the `date` field on `ProjectEntry` until a date is displayed. If kept, build the failing case from a formatter without `timeZone`.

### IN-03: Newest-first sort has no tie-breaker, and an invalid date fails the whole list

**File:** `src/lib/projects.ts:51, 68-70`
**Issue:** `orderBy: { date: "desc" }` alone gives unspecified order for equal dates, which would reshuffle the home "Recent Projects" top 3. The seed has unique dates today, so this is latent. `new Date(d.date)` on an unparseable string produces an Invalid Date. Anything that later formats it throws a `RangeError`, which would take down every page that lists projects.
**Fix:** Sort by `date desc` then `slug asc`, either in the query or after. Validate the date in `toProject` and throw a named error that includes the slug.

### IN-04: Optional hero and heading fields render an empty `<h1>` with no signal

**File:** `src/pages/index.astro:23-24`, `src/lib/singletons.ts:71-75`, `emdash-env.d.ts:12-14, 35-38`
**Issue:** `hero_first`, `hero_last`, `heading_line_1`, `heading_line_2` and `heading_accent` are optional in the schema and default to `""` or `undefined`. If an editor clears them, the page keeps rendering and ships an empty `<h1>` or `<em>`. This is an accessibility and SEO regression with no build or runtime failure, which is inconsistent with the "structural content fails loudly" approach used for the singletons themselves.
**Fix:** Mark these fields required in the seed schema, or have `getHome` and `getAbout` throw a named error when a required hero string is empty.

### IN-05: Guard logic is not covered by its own self-test

**File:** `scripts/check-public-js.test.mjs:1-155`
**Issue:** D-11 asks for a committed failing case. The test file covers `script-inventory.mjs check` and the wildcard, but nothing exercises `check-public-js.mjs` itself: status assertions, draft listing, `ADMIN-REF`, negative paths and `checkAdmin`. `crawlSlugs` only matches `[a-z0-9-]+`, so a project with an underscore or uppercase slug is skipped silently and escapes the crawl. `applySeed` reaches into `node_modules/emdash/dist/cli/index.mjs`, an internal path that a package update can move.
**Fix:** Export `crawlSlugs`, `negativePaths` and `pageChecks` and unit-test them. Fail if `/projects/` contains an `href="/projects/..."` that the slug pattern did not capture. Resolve the CLI through the package `bin` entry or `npx emdash`.

### IN-06: Parity comparator can mask escaping and spacing differences

**File:** `scripts/script-inventory.mjs:249-262`
**Issue:** `canonical()` decodes `&lt;`, `&gt;`, `&quot;` and `&amp;` before comparing. A candidate that emitted raw `<` where the baseline emitted `&lt;` would canonicalize identically. Whitespace between tags is removed, so a missing space between two inline elements is also invisible. Scripts are compared strictly beforehand, which limits the XSS relevance. The plan summaries already flag the spacing blind spot.
**Fix:** Decode only `&#39;` and `&#x27;`, the one pair the two serializers disagree on. Add one assertion that `&lt;script&gt;` and `<script>` stay distinct.

### IN-07: Prose parity covers only paragraphs, h2 and links

**File:** `src/lib/prose.ts:28-45`, `src/components/prose/ProseBlock.astro:9-16`
**Issue:** The seeded bodies contain only `normal` and `h2` blocks, so parity says nothing about lists, code blocks, tables, nested blockquotes or images. These render through EmDash defaults, with markup and classes unlike the markdown baseline's `.prose` rules. `prepareBody` also does not recurse into groups or list children, so smart punctuation and heading ids are skipped inside those structures. The code is correct for current content. The next list or code fence an editor adds will silently look different.
**Fix:** Add a fixture body with a list, a code block and a two-paragraph quote to `prose.test.mjs`, and extend `ProseBlock` or add `list` and `code` components for them. Or document that only paragraph, h2 to h6 and link are supported.

### IN-08: Workflow and toolchain consistency

**File:** `.github/workflows/ci.yml:3-18`, `.nvmrc`, `package.json:5-7`, `CLAUDE.md`
**Issue:**

- `on: push` plus `on: pull_request` runs the job twice for branch pushes with an open PR.
- There is no `timeout-minutes`. A hung guard server would run for the 6-hour default.
- Actions are pinned by mutable major tags (`@v7`), not SHAs.
- `.nvmrc` and the Dockerfile say Node 24, `engines` says `>=22.22.2`, and `CLAUDE.md` says Node 22. The tests and the guard rely on Node type stripping and `node:sqlite`, so the versions are not interchangeable.
  **Fix:** Add `timeout-minutes: 15` and `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`. Pin the actions to SHAs. Align `engines`, `.nvmrc` and `CLAUDE.md` on one Node version.

---

_Reviewed: 2026-10-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
