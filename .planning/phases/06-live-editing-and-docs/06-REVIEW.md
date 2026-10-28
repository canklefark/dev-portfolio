---
phase: 06-live-editing-and-docs
reviewed: 2026-10-28T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - README.md
  - CLAUDE.md
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-10-28
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Scope was README.md (replaced) and CLAUDE.md (surgical additions, diff 4a016b5..HEAD). Every checkable claim was compared with the repo: `.nvmrc` (24), `.npmrc` (`engine-strict=true`), `engines` (>=22.22.2), npm scripts (`dev`, `test`, `check:public-js`), `data/` gitignored, `.emdash/seed.json` and `.mcp.json` tracked, `.mcp.json` URL-only, `scripts/smoke-test.mjs` usage and the three paths it checks, the CI workflow (push runs CI only, includes `check:public-js`), link targets (`DESIGN.md`, `PRODUCT.md`, `.planning/PROJECT.md` with its "Admin recovery procedure" heading, 05-EVIDENCE.md and 06-EVIDENCE.md), the B1 to B3 rows, the "Sample content" wizard label, `ENTRY_LOCKED` in emdash source, and the 1h default preview expiry. These hold. Preview, publish and restore claims match 06-EVIDENCE.md rows E2 to E9. No token, preview address or OAuth value appears in either file. No reference to a removed file (`scripts/log.sh`, `docs/friend-portfolio-intake.md`, the two specs) remains. The new text adds no em or en dash, and no claim of publish-guard enforcement exists (draft-first is stated as a convention in both files).

The main defect is a false absolute claim about client JS on public pages, in both files.

## Critical Issues

### CR-01: "No client JS on public pages" is false, and CLAUDE.md now states it as a hard rule

**File:** `README.md:7`, `CLAUDE.md:14`
**Issue:** README says "Public pages ship no client JS. The EmDash admin ... is the only part that runs any." CLAUDE.md replaced the accurate old bullet ("unless there's no server-side alternative") with "Client JS runs only in the EmDash admin under `/_emdash/admin`". The repo contradicts both:

- `src/layouts/Layout.astro:44,52,61` ship three `is:inline` scripts on every public page (theme init, console banner, `g`-prefixed keyboard navigation).
- `src/components/Nav.astro:197` ships a bundled module script (theme toggle).
- `src/pages/404.astro:37` ships a script.
- `scripts/script-allowlist.json` records 4 scripts and 1 module on `/`.
  So `check:public-js` does not enforce "no JS". It fails only when a route exceeds the allowlisted counts or an inline hash is unlisted. CLAUDE.md line 14 ("fails CI if one appears") and the README overstate this. CLAUDE.md is what Claude reads as an instruction, so it now misdescribes the codebase. It could also lead a future agent to "fix" the existing scripts, or to treat the Cloudflare email-decode script (documented only in CLAUDE.md's Deployment section) as the sole exception. The README omits that exception entirely.
  **Fix:** State what is true in both files. For example, CLAUDE.md:

```
- Client JS on public routes is limited to the scripts in `scripts/script-allowlist.json` (theme, nav toggle, shortcuts). Do not add a script, modulepreload or module tag to a public route; `npm run check:public-js` fails CI when a route exceeds the allowlist. EmDash admin JS runs only under `/_emdash/admin`.
```

README line 7: "Public pages ship only a few small first-party scripts (theme, nav, keyboard shortcuts) and no EmDash client JS. The admin at `/_emdash/admin` is the only place EmDash's own JS runs." Mention the Cloudflare-injected script on `/about` or point to CLAUDE.md Deployment.

## Warnings

### WR-01: README presents admin lockout recovery as a working path without saying it is unrehearsed in production

**File:** `README.md:36`
**Issue:** "If that device is lost, the way back is the 'Admin recovery procedure' section of .planning/PROJECT.md." The README says the code rollback "has not been rehearsed", but gives no such caveat here. 05-EVIDENCE.md C4 and PROJECT.md say the procedure was rehearsed only locally in Phase 1 and never in the production container, and the lockout risk was accepted with one passkey. A reader will assume it is a tested production recovery. The inconsistent candour is a trap in the one scenario where it matters.
**Fix:** Append: "That procedure was rehearsed locally, not in the production container, and I have one passkey enrolled."

### WR-02: CLAUDE.md states "saves drafts only" without the concrete rules that make it true

**File:** `CLAUDE.md:9`
**Issue:** The only proven mechanism (06-EVIDENCE E5, procedure P7) is `content_get` then `content_update` with `data` limited to the changed field, the `_rev` from the read, no `status` and no `overrideLock`, and never calling publish, unpublish, schedule or delete tools. CLAUDE.md, the file an agent is bound by, carries none of that. README names `content_update` with no status, but not `overrideLock` or the publish-type tools. Because enforcement is a convention only, the omitted specifics are the whole control. "Drafts only" is also proven only for `content_update` on an already-published entry. Creating a new entry (`content_create`) was not exercised.
**Fix:** Add to CLAUDE.md `## Content`: "Use `content_get` then `content_update` with no `status` and no `overrideLock`. Never call publish, unpublish, schedule or delete tools. If a write returns `ENTRY_LOCKED`, ask the owner to close the editor." Either state what to do for new entries or say they are unproven.

### WR-03: README sends readers to a seed that still holds stale copy about the removed workflow

**File:** `README.md:23`
**Issue:** README tells readers to choose Sample content, "which loads the committed `.emdash/seed.json`". 06-EVIDENCE S8 flags that the seed still contains the old dev-portfolio card. `.emdash/seed.json:2370-2371` and nearby lines read "Content is Markdown; adding a post is a git commit. Deployed to Cloudflare Pages", "Astro content collections" and "deploys on every push". A local environment seeded per the README therefore shows the exact stale claims the phase's D-13 sweep set out to remove (the sweep's grep excluded nothing here only because the strings differ). Production is correct and the local copy contradicts it.
**Fix:** Add one sentence to README line 23: "The seed predates the EmDash workflow, so the dev-portfolio card describes the old Markdown setup. Production has the corrected copy." Or refresh the seed by export.

## Info

### IN-01: CLAUDE.md still contains em dashes

**File:** `CLAUDE.md:1`, `CLAUDE.md:13`, `CLAUDE.md:23`
**Issue:** Three pre-existing em dashes (title, "TypeScript strict — no `any`", "Single accent color — Pit Lane Amber"). None were added by this phase, and 06-02-SUMMARY says the title dash was kept on purpose. They conflict with the owner's no-em-dash rule if that rule is meant to cover this file. README has none.
**Fix:** Replace with a colon or comma if the rule applies to engineering docs. Otherwise leave.

### IN-02: `EMDASH_ENCRYPTION_KEY stays unset` cannot be verified from the repo

**File:** `CLAUDE.md:15`
**Issue:** `astro.config.mjs` registers no plugins, so "no plugins" holds. But `EMDASH_ENCRYPTION_KEY` appears nowhere in the repo, Dockerfile or CI. Its state lives in Dokploy's environment. The parenthetical is an unverifiable claim about production config, and the rule's wording ("third-party") is narrower than its stated reason ("no plugin declares a secret").
**Fix:** Say "do not set it in Dokploy unless a plugin is added", or drop the claim about the current value. Consider "No EmDash plugins" to match the reason.

---

_Reviewed: 2026-10-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
