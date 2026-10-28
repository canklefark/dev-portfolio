---
phase: 01-spike-baseline-and-decisions
reviewed: 2026-10-23T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - .dockerignore
  - .gitignore
  - .npmrc
  - .nvmrc
  - Dockerfile
  - astro.config.mjs
  - package.json
  - scripts/script-allowlist.json
  - scripts/script-inventory.mjs
  - src/components/layout/Stack.astro
  - src/live.config.ts
findings:
  critical: 0
  warning: 7
  info: 6
  total: 13
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-23
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

The Dockerfile is sound on the main safety points. It is multi-stage and runs as the non-root `node` user. No secrets or `.git`/`.planning` content reach the runtime stage, because only `dist`, `.emdash` and prod `node_modules` are copied. The database and uploads paths line up with `WORKDIR /app` and `VOLUME /app/data`. `scripts/script-inventory.mjs` handles paths safely: the route-to-file mapping comes from the trusted baseline directory, so there is no traversal. The allowlist JSON matches the 17 baseline routes.

No critical issues were found. The weaknesses are in two places:

- **Container lifecycle:** Node runs as PID 1 with no SIGTERM handling.
- **Guard script:** the regex HTML parser and the allowlist reader are fail-open in ways that matter for a "no new JS" guard. Two of these were confirmed by running the code.

There are also merge-time hazards around the Node floor and `.nvmrc`, and a developer footgun with the git-ignored `data/` directory.

## Warnings

### WR-01: Node runs as PID 1 with no SIGTERM handler, so `docker stop` and redeploys hang, then SIGKILL

**File:** `Dockerfile:28`
**Issue:** `CMD ["node", "./dist/server/entry.mjs"]` makes Node PID 1. The kernel ignores signals that have no handler for PID 1. `grep` over `node_modules/@astrojs/node/dist` finds no SIGTERM or SIGINT handling, only an `unhandledRejection` hook in `serve-app.js:35`. On a Dokploy redeploy or stop, the container therefore ignores SIGTERM, waits out the grace period (10s by default), and is killed with SIGKILL. In-flight requests and SQLite WAL writes (the DB runs in WAL mode, per the `-shm` and `-wal` files in the 01-03 evidence) are cut off abruptly. SQLite is crash-safe, but this is avoidable and slows every deploy.
**Fix:**

```dockerfile
RUN apk add --no-cache tini
...
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "./dist/server/entry.mjs"]
```

Alternatively, enable `init: true` in the Dokploy or compose service. Tini forwards SIGTERM, but Node still has no handler, so the default action (terminate) applies once Node is not PID 1.

### WR-02: Node floor, `engine-strict` and `.nvmrc` 24 can break the Cloudflare Pages build if this branch reaches `main` before the hosting cutover

**File:** `.nvmrc:1`, `.npmrc:1`, `package.json:6`
**Issue:** `main` auto-deploys to Cloudflare Pages (D-13), and CLAUDE.md pins the Pages Node version to 22. This branch adds `engines.node >=22.22.2`, `engine-strict=true` and `.nvmrc` = `24`.

- Cloudflare Pages reads `.nvmrc`, and the Pages build image may not offer 24.
- If the image's Node 22 is older than 22.22.2 (the Pages default for "22" has historically been an older minor), `npm ci` fails with EBADENGINE. The 01-03 evidence shows exactly this failure on Node 22.16.0.
- This is also the only gate between a branch merge and a broken production deploy. There is no CI, per STATE.md.

The change is correct for the target (Dokploy), but a merge before the cutover would break the live site. The phase notes do not record this hazard.
**Fix:** Do not merge the branch to `main` until the Dokploy cutover. Record this as a Phase 5 precondition. If an earlier merge is unavoidable, set `NODE_VERSION=24` (or a supported 22.22.x) in the Pages project settings first, and verify the Pages build image supports it.

### WR-03: `readAllowlist` validates only the top-level keys, so a malformed route entry silently permits unlimited scripts

**File:** `scripts/script-inventory.mjs:323-331` (consumed at `348-353`)
**Issue:** `readAllowlist` only checks that `routes` and `inlineHashes` exist. `checkDir` then evaluates `found[route].counts[key] > allowed[key]`. If an entry is missing a key (a hand edit, a typo such as `"modulepreloads"`, or a stale shape), `allowed[key]` is `undefined`. `n > undefined` is `false`, so that count is never enforced and the route reports PASS. Values stored as strings (`"4"`) coerce, which hides the problem further. For a guard whose job is to block JS regressions, this fails open.
**Fix:**

```js
for (const [route, allowed] of Object.entries(allowlist.routes)) {
  for (const key of COUNT_KEYS) {
    if (!Number.isInteger(allowed?.[key]) || allowed[key] < 0) {
      throw new Error(
        `${path}: routes["${route}"].${key} must be a non-negative integer`,
      );
    }
  }
}
for (const [type, list] of Object.entries(allowlist.inlineHashes)) {
  if (
    !Array.isArray(list) ||
    !list.every((h) => /^sha256-[A-Za-z0-9+/]+=*$/.test(h))
  ) {
    throw new Error(`${path}: inlineHashes["${type}"] is malformed`);
  }
}
```

### WR-04: Regex HTML parsing can hide an executable script from the check (confirmed by test)

**File:** `scripts/script-inventory.mjs:61-69` (`attr`) and `93-112` (`parseHtml`)
**Issue:** Two flaws combine.

1. `attr()` matches `\s<name>=` anywhere in the tag text, including inside another attribute's quoted value. I ran the function against `<script data-x=" type=application/ld+json ">alert(1)</script>`. It returns `"application/ld+json"` for `type`, so the script is classified `kind: "data"`. Data scripts are excluded from `counts.script` and from the inline-hash check (`kind !== "inline"` skips them in `checkDir`). An executable inline script is then invisible to `check`. `compare` would still see the HTML change, but `check` is the CI guard (GUARD-01).
2. `<script\b([^>]*)>` ends the attribute text at the first `>`. For `<script data-x="a>b" src="evil.js"></script>` the parsed attribute text is `data-x="a`, `src` is `null`, and the body becomes `b" src="evil.js">`, so an external script is misclassified as inline.

Phase 3 renders CMS-driven HTML, which makes this class of markup less hypothetical than it looks today. Comment and `<template>` contents are also scanned as live scripts (false positives).
**Fix:** Tokenize attributes properly instead of searching the raw attribute string. At minimum, parse quoted values with a sticky regex, for example `/\s([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/y`applied from the start of the tag. Match the tag with a quote-aware pattern such as`<script\b((?:[^>"']|"[^"]_"|'[^']_')*)>`. Strip `<!-- -->` first. Better, use a real parser (`parse5`, or `htmlparser2`as a devDependency). Add a mutation to`MUTATIONS` for the quoted-attribute case so the selftest covers it.

### WR-05: `normalize` collapses whitespace that is meaningful between inline elements, so the parity compare can pass a visible regression

**File:** `scripts/script-inventory.mjs:79-86`
**Issue:** The docstring says whitespace between `>` and `<` "carries no meaning". That is false for inline content: `<span>a</span> <span>b</span>` renders a space and `<span>a</span><span>b</span>` does not. I confirmed that `normalize` treats the two as equal. The same collapse applies inside `<pre>`, `<textarea>` and inline `<script>` text such as `a>  <b`. Parity against the baseline can therefore report 17/17 identical while the rendered output changed. That undermines the "no visible behavior change" goal of this phase.
**Fix:** Collapse only whitespace around block-level boundaries, or do not normalize at all and diff on serialized output. If Astro's output is deterministic (it is for the same version), a byte compare after trimming plus a CRLF-to-LF fold is enough. If a tolerance is kept, drop the claim from the docstring and limit it to whitespace containing a newline: `html.replace(/>\s*\n\s*</g, "><")`.

### WR-06: `data/` is fully git-ignored but EmDash cannot open SQLite until it exists, so a fresh clone fails on first run

**File:** `.gitignore:35`, `astro.config.mjs:18`
**Issue:** The database URL is `file:./data/emdash.db`. Plan 01-02 and 01-04 record that EmDash cannot create the SQLite file unless `data/` already exists. `.gitignore` ignores the whole directory with no placeholder. The Dockerfile handles this (`mkdir -p data` at line 24), but a fresh checkout running `npm run build`, `npm run preview` or `npm run dev` hits an opaque open failure. The 01-04 summary shows the spike hit this and worked around it by hand.
**Fix:** Keep the directory while ignoring its contents:

```gitignore
data/*
!data/.gitkeep
```

and commit `data/.gitkeep`. Alternatively add `"predev": "mkdir -p data"`, `"prebuild": "mkdir -p data"` and `"prepreview": "mkdir -p data"` to the `package.json` scripts.

### WR-07: `.gitignore` covers only `.env` and `.env.production`, not other env variants

**File:** `.gitignore:17-18`
**Issue:** `.env.local`, `.env.development` and `.env.staging` are not ignored. This phase introduces runtime secrets and config such as `EMDASH_SITE_URL` and the admin auth setup, and Phase 5 will add more. `.dockerignore` already uses `.env` and `.env.*`, so the two files disagree. A developer-created `.env.local` would be committed by `git add .`.
**Fix:**

```gitignore
.env
.env.*
!.env.example
```

## Info

### IN-01: Dockerfile and `.dockerignore` hardening gaps

**File:** `Dockerfile:2-3,26`, `.dockerignore:1-16`
**Issue:**

- `.gsd/` exists at the repo root and is not in `.dockerignore`. It goes into the build context and the build stage (not the runtime stage).
- A stale local `.emdash/migrations.json` also goes into the context.
- The base image tag `node:24-alpine` floats, so rebuilds are not reproducible.
- There is no `HEALTHCHECK`.
- `chown` on `data` only helps named volumes, which inherit image ownership. A bind mount in Dokploy would be root-owned and the `node` user gets EACCES on the DB. This is not documented in the Dockerfile comment.

**Fix:**

- Add `.gsd` and `.emdash` to `.dockerignore`.
- Pin the base image, for example `node:24.x-alpine@sha256:...`.
- Add `HEALTHCHECK CMD wget -qO- http://127.0.0.1:4321/ >/dev/null || exit 1`.
- Note the volume-ownership requirement in a Dockerfile comment (UID 1000).

### IN-02: `check` does not flag allowlist routes missing from the build, and inline hashes are global rather than per route

**File:** `scripts/script-inventory.mjs:340-364`, `293-317`
**Issue:**

- `checkDir` iterates only over routes found in `dist`. A route in the allowlist that is absent from the build passes silently (for example, a deleted or renamed page, or a candidate pointed at the wrong directory such as `dist` instead of `dist/client`, which fails loudly only because every route is "not in allowlist").
- `inlineHashes` is a flat set per type. A script hash that is valid on `/404` is accepted on every route. Counts bound the damage, but a swapped script on a route with the same count passes.

**Fix:**

- Report allowlist routes absent from `found` as failures.
- Optionally derive per-route hash sets.

### IN-03: Module detection is case-sensitive while kind detection is case-insensitive

**File:** `scripts/script-inventory.mjs:100,125`
**Issue:** The data check lowercases the type (`type.toLowerCase() === JSON_LD`), but the module count uses `s.type === "module"`. `type="Module"` is a module to browsers, yet it counts as a plain script and goes into a `Module` hash bucket (`deriveAllowlist` line 302), so `counts.module` is under-reported.
**Fix:** Normalize once in `parseHtml` with `const type = (attr(...) || "classic").toLowerCase()`, and use that value everywhere.

### IN-04: Route mapping and traversal edge cases

**File:** `scripts/script-inventory.mjs:37-43,50-53`
**Issue:**

- `about.html` and `about/index.html` both map to `/about`, and `loadRoutes` silently overwrites one with the other.
- `walk` uses `statSync`, which follows symlinks, so a symlink cycle recurses forever.
- Passing `dist` instead of `dist/client` yields `/client/...` routes. Nothing hints at that mistake.

**Fix:**

- Throw on duplicate routes in `loadRoutes`.
- Use `lstatSync` or `readdirSync(..., { withFileTypes: true })` and skip symlinks.
- Print a hint when no `index.html` exists at the root of the given directory.

### IN-05: `Stack.astro` interpolates an unvalidated prop into an inline style, and the `as` retype has no callers

**File:** `src/components/layout/Stack.astro:5,14`
**Issue:**

- The `as` type change to `HTMLTag` is correct and strict-safe. No `<Stack as=...>` usage exists in `src`, so the change has no effect today.
- `style={`--space: var(--${space})`}` is a permitted CSS custom-property override under CLAUDE.md. `space` is an unconstrained `string`, though. A value like `s1); color: red; x:(` would inject arbitrary declarations. This is not a security issue for first-party callers, but it is weaker than a union type.

**Fix:** Type `space` as a union of the real tokens (`"s1" | "s2" | ...` from DESIGN.md), or validate it with `/^s\d+$/`.

### IN-06: Whitespace and formatting noise in `.gitignore`

**File:** `.gitignore:14-15,32`
**Issue:** Line 32 is `.vscode/  ` with trailing spaces. Git trims them, but it is sloppy and it is a duplicate of unrelated content added in this phase. Two consecutive blank lines at 14-15 are left over from earlier edits.
**Fix:** Change line 32 to `.vscode/` and remove the extra blank line.

---

_Reviewed: 2026-10-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
