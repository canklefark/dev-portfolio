---
phase: 06-live-editing-and-docs
verified: 2026-10-28T18:00:00Z
status: passed
score: 2/4 must-haves verified
covered_files:
  - .planning/phases/06-live-editing-and-docs/06-01-PLAN.md
  - .planning/phases/06-live-editing-and-docs/06-01-SUMMARY.md
  - .planning/phases/06-live-editing-and-docs/06-02-PLAN.md
  - .planning/phases/06-live-editing-and-docs/06-02-SUMMARY.md
  - .planning/phases/06-live-editing-and-docs/06-03-PLAN.md
  - .planning/phases/06-live-editing-and-docs/06-03-SUMMARY.md
  - .planning/phases/06-live-editing-and-docs/06-04-PLAN.md
  - .planning/phases/06-live-editing-and-docs/06-04-SUMMARY.md
  - CLAUDE.md
  - README.md
covered_digest: "v4:sha256:8e95602c1fe111b5714f8fc39ca993299ef639a4cf505883fc38eae9447161bf"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Owner confirms the production rows E2 to E8 in 06-EVIDENCE.md are an accurate record. Optional spot check: open catalog-cms in the admin and read the Revisions panel (it should list the original revision, the LIVE EDIT CHECK publish, the AGENT DRAFT CHECK publish and the restore-and-publish), and, if wanted, repeat Preview on a throwaway draft in a private window."
    expected: "The Revisions history matches the E-rows. A preview link opens the draft signed out while /projects/catalog-cms/ shows the published copy. Nothing is left in draft on catalog-cms."
    why_human: "These are production state transitions (draft not live, preview works signed out, agent write lands as a pending revision, restore writes a draft only). They were run by the owner and a prior session on the live site. The verifier can only observe the end state, so these rows are owner-attested here, not independently confirmed."
  - test: "Owner confirms Auto Deploy is off for the portfolio application in Dokploy."
    expected: "A push to main does not start a deployment."
    why_human: "README.md line 42 and CLAUDE.md state it. It is a Dokploy setting and cannot be read from the repo."
---

# Phase 6: Live Editing and Docs Verification Report

**Phase Goal:** The user edits the live site from the admin instead of git, and the repo docs describe the workflow that replaced hand-edited markdown
**Verified:** 2026-10-28
**Status:** human_needed
**Re-verification:** No, initial verification (branch gsd/phase-06-live-editing-and-docs, nothing pushed)

## Goal Achievement

### Observable Truths

| #   | Truth (ROADMAP success criterion)                                                                                                                                                                                                                                                                                                              | Status                                                          | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | On the deployed site a real project is edited as a draft, previewed, published with no rebuild or git push, then restored to its previous revision                                                                                                                                                                                             | ? UNCERTAIN (owner-attested, end state independently confirmed) | 06-EVIDENCE.md E1 to E9 all read PASS. I re-ran the anonymous check just now: `curl -s https://dev.zeikcookson.com/projects/catalog-cms/ \| shasum` gives `0f23a5617458a21237c3604793edf5cb8ba73705`, equal to H0 in E1 and E9, with LIVE EDIT CHECK count 0 and AGENT DRAFT CHECK count 0. `git ls-remote origin refs/heads/main` returns `d38f5c98b61d7e30bc2466c069a9a8d01db1bc92`, equal to the E1, E4 and E9 value, so no push happened. Source corroboration of E8: `node_modules/emdash/dist/emdash-runtime-DwezbIqQ.mjs:3555` restore calls `contentRepo.restoreDraftRevision`, which writes a draft revision and does not publish. I cannot re-run the intermediate steps (E2 to E8) without mutating production. "No Deploy clicked" rests on the owner's report.                                                                                                                                                                                                                                                                                                                |
| 2   | A shareable preview link opens a draft entry in a signed-out browser while the public page still shows the published version                                                                                                                                                                                                                   | ? UNCERTAIN (owner-attested)                                    | E3 records the owner's signed-out private-window observation plus `curl -sI` on the preview address: HTTP/2 200, `cache-control: private, no-store`, `cf-cache-status: DYNAMIC`, marker count 1 in the preview body, public page without the marker. The preview address is REDACTED in the file, so I cannot replay it, and a fresh preview needs an admin session and a draft. Not independently confirmed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 3   | CLAUDE.md covers the Dokploy deploy (owner clicks Deploy, push to main runs CI only, smoke test after each deploy), the Node version, admin-only client JS, the "no new JS" rule, the no-plugins rule and content edited in EmDash; README walks through the local and deploy workflow including the manual deploy steps and the rollback rule | ✓ VERIFIED                                                      | CLAUDE.md line 5 and 9 (content in EmDash, no markdown files, `emdash` MCP, draft-first convention), line 14 (no new client JS on public routes, allowlist, admin-only client JS under `/_emdash/admin`), line 15 (no third-party plugins), line 29 (Node 24 image, `engines` >=22.22.2, owner clicks Deploy, push to `main` runs CI only, smoke test command). README sections: What this is, Local development, Editing content, Deploying (merge, push, click Deploy, `node scripts/smoke-test.mjs https://dev.zeikcookson.com`), Rolling back (revert on main and redeploy for code, restore nightly R2 backup after a bad migration, links `05-EVIDENCE.md` rows B1 to B3), Agent access. Facts checked against the repo: `.nvmrc` = 24, `.npmrc` engine-strict=true, `package.json` engines `>=22.22.2`, scripts `dev`, `test`, `check:public-js` exist, `astro.config.mjs` registers no plugins, `.mcp.json` is URL-only (`emdash`, https://dev.zeikcookson.com/_emdash/api/mcp). The Astro starter text is gone. Caveat: "Auto Deploy is off" is a Dokploy setting (human item 2). |
| 4   | The `portfolio-update` skill and every doc that still describes the markdown workflow are updated or flagged, and nothing in the repo points at the removed content files                                                                                                                                                                      | ✓ VERIFIED                                                      | `scripts/log.sh`, `docs/friend-portfolio-intake.md` and both `docs/superpowers/specs/*` files are absent. `~/.claude/skills/portfolio-update` is absent. `~/.dotfiles/zsh/.zshrc` has 0 matches for `log.sh`. I re-ran the S11 sweep: `git grep -n -I -e src/content -e src/data/about -e portfolio-update -e 'scripts/log\.sh' -e friend-portfolio-intake -e 'logbook/' -- . ':!.planning' ':!package-lock.json'` exits 1 (no match), and the `--untracked` variant also exits 1. `.emdash/seed.json` is unchanged since e2ce3f7 (`git diff --quiet e2ce3f7 -- .emdash/seed.json` exits 0) and is flagged in 06-EVIDENCE S8. The two symlinked skills (`portfolio-logbook`, `portfolio-projects`) and the gitignored local plans are flagged in S5 and S6. `npm test`: 51 tests, 51 pass, 0 fail.                                                                                                                                                                                                                                                                                         |

**Score:** 2/4 truths verified (2 owner-attested, awaiting human confirmation, 0 failed).

### Plan-level must-haves (merged from PLAN frontmatter)

| Plan truth                                                                                                                    | Status                                       | Evidence                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 06-01: draft stays unpublished, H0 unchanged (E2)                                                                             | ? Owner-attested                             | See truth 1.                                                                                                                                                                                                                        |
| 06-01: preview signed out, private no-store, not a CF HIT (E3)                                                                | ? Owner-attested                             | See truth 2.                                                                                                                                                                                                                        |
| 06-01: publish visible next request, no rebuild or push (E4)                                                                  | ? Owner-attested, push half confirmed        | origin main is still `d38f5c9`.                                                                                                                                                                                                     |
| 06-01: agent change lands as pending revision, page unchanged until owner publishes (E5 to E7)                                | ? Owner-attested                             | Not replayable without a production write.                                                                                                                                                                                          |
| 06-01: restore draft-only, second publish returns hash to H0 (E8, E9)                                                         | ? End state confirmed                        | Live hash equals H0 now. Restore-is-draft-only corroborated in emdash source.                                                                                                                                                       |
| 06-01: EVIDENCE rows E1 to E9 PASS, no preview address or token, no dash                                                      | ✓ VERIFIED                                   | All nine rows start with PASS, the preview address is written REDACTED, and I found no token or preview URL in the file.                                                                                                            |
| 06-02: README six sections in D-06 order, no starter text                                                                     | ✓ VERIFIED                                   | `README.md` headings are What this is, Local development, Editing content, Deploying, Rolling back, Agent access.                                                                                                                   |
| 06-02: local setup runnable from README alone (Node 24, `npm ci`, `mkdir -p data`, `npm run dev`, wizard with Sample content) | ✓ VERIFIED                                   | README lines 13 to 23, consistent with `.nvmrc` and `.npmrc`.                                                                                                                                                                       |
| 06-02: deploy steps, rollback rule, rehearsal link, "not rehearsed" admission                                                 | ✓ VERIFIED                                   | README lines 40 to 56.                                                                                                                                                                                                              |
| 06-02: Agent access documents the OAuth `.mcp.json` and draft-first as a convention, no PAT text                              | ✓ VERIFIED                                   | README lines 58 to 62 and CLAUDE.md line 9 say "This is a convention, and nothing enforces it". No token, PAT or env-var text remains.                                                                                              |
| 06-02: CLAUDE.md surgical, Stack, Design System and Deployment unchanged                                                      | ✓ VERIFIED                                   | `git diff --stat 4a016b5..HEAD` shows CLAUDE.md at 5 lines changed, all in Content and Code Rules. Deployment paragraph is identical to the one in the brief.                                                                       |
| 06-02: no em dash, en dash or emoji in README or the added CLAUDE.md lines                                                    | ✓ VERIFIED                                   | README has none (grep exit 1). CLAUDE.md's only em dashes are the three pre-existing ones (lines 1, 13, 23), see IN-01.                                                                                                             |
| 06-03: portfolio-update skill and friend intake deleted, `log.sh` deleted, `npm test` passes                                  | ✓ VERIFIED                                   | See truth 4.                                                                                                                                                                                                                        |
| 06-03: owner removed the `~/.zshrc` lines, Claude never edited `~/.zshrc`                                                     | ⚠️ Outcome verified, wording inaccurate      | `~/.dotfiles/zsh/.zshrc` has no `log.sh` match. But 06-03-SUMMARY.md lines 76 to 78 say the orchestrator removed lines 25 and 26 at the owner's request, while 06-EVIDENCE S3 says "Claude never edited ~/.zshrc". See Advisory A1. |
| 06-03: dev-portfolio card rewritten in admin, seed not edited                                                                 | ✓ VERIFIED for seed, owner-attested for card | Seed diff exits 0. S7 records the anonymous page without the three stale phrases (not re-fetched by me).                                                                                                                            |
| 06-04: sweep clean, EVIDENCE records every artifact, seed unchanged, `npm test` passes, catalog-cms hashes to H0              | ✓ VERIFIED                                   | Sweep, seed and tests re-run by me. Live hash equals H0 (checked at 2026-10-28).                                                                                                                                                    |

### Required Artifacts

| Artifact                                                       | Expected                      | Status                                           | Details                                 |
| -------------------------------------------------------------- | ----------------------------- | ------------------------------------------------ | --------------------------------------- |
| `README.md`                                                    | EmDash workflow, six sections | ✓ VERIFIED                                       | 62 lines, substantive, no starter text. |
| `CLAUDE.md`                                                    | Surgical EmDash rule edits    | ✓ VERIFIED                                       | 29 lines, 5 lines changed in the phase. |
| `06-EVIDENCE.md`                                               | E1 to E9 and S1 to S11        | ✓ VERIFIED (content owner-attested for E2 to E8) | 90 lines.                               |
| `scripts/log.sh`, `docs/friend-portfolio-intake.md`, two specs | Removed                       | ✓ REMOVED                                        | Absent from the working tree.           |
| `~/.claude/skills/portfolio-update`                            | Removed                       | ✓ REMOVED                                        | Absent.                                 |

### Key Link Verification

| From                   | To                                                              | Via                               | Status  | Details                                      |
| ---------------------- | --------------------------------------------------------------- | --------------------------------- | ------- | -------------------------------------------- |
| README.md              | `.planning/phases/05-dokploy-deploy-and-cutover/05-EVIDENCE.md` | Markdown link, rows B1 to B3      | ✓ WIRED | Target exists. Review confirmed the B rows.  |
| README.md              | `.planning/phases/06-live-editing-and-docs/06-EVIDENCE.md`      | Markdown link                     | ✓ WIRED | Target exists.                               |
| README.md              | `.planning/PROJECT.md` "Admin recovery procedure"               | Markdown link                     | ✓ WIRED | Heading confirmed by 06-REVIEW.              |
| README.md Agent access | `.mcp.json`                                                     | Names server `emdash` and its URL | ✓ WIRED | `.mcp.json` matches the text.                |
| README.md Deploying    | `scripts/smoke-test.mjs`                                        | Command line                      | ✓ WIRED | Script exists and takes a BASE_URL argument. |

### Data-Flow Trace (Level 4)

Not applicable. The phase ships documentation and deletions, no rendering code.

### Behavioral Spot-Checks

| Behavior                         | Command                                                               | Result                                                                                                                            | Status                  |
| -------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Live catalog-cms equals baseline | `curl -s https://dev.zeikcookson.com/projects/catalog-cms/ \| shasum` | `0f23a5617458a21237c3604793edf5cb8ba73705` = H0, marker counts 0 and 0                                                            | ✓ PASS                  |
| No push occurred                 | `git ls-remote origin refs/heads/main`                                | `d38f5c98b61d7e30bc2466c069a9a8d01db1bc92` = E1                                                                                   | ✓ PASS                  |
| Repo tests                       | `npm test`                                                            | 51 pass, 0 fail                                                                                                                   | ✓ PASS                  |
| Stale-reference sweep            | `git grep` (tracked and `--untracked`)                                | no match, exit 1                                                                                                                  | ✓ PASS                  |
| Smoke test                       | `node scripts/smoke-test.mjs https://dev.zeikcookson.com`             | Not re-run by me (E9 records PASS). The homepage-level check I made (HTTP fetch of a project page) returned the expected content. | ? SKIP                  |
| Preview link behavior            | none                                                                  | Needs admin session and a draft                                                                                                   | ? SKIP, routed to human |

### Probe Execution

No `probe-*.sh` is declared or present for this phase. Step 7c: SKIPPED.

### Requirements Coverage

| Requirement | Source Plan  | Description                                                                                         | Status        | Evidence                                                                                                                                        |
| ----------- | ------------ | --------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ADMIN-04    | 06-01        | Draft, preview and publish exercised end to end on one real project, including restoring a revision | ? NEEDS HUMAN | E1 to E9 recorded by owner. End state (hash H0, origin main unchanged) confirmed by me. Intermediate transitions not independently confirmable. |
| ADMIN-05    | 06-01        | A shareable preview link works for a draft entry                                                    | ? NEEDS HUMAN | E3 owner-attested with header evidence. Address redacted, not replayable.                                                                       |
| DOCS-01     | 06-02        | CLAUDE.md updated                                                                                   | ✓ SATISFIED   | See truth 3.                                                                                                                                    |
| DOCS-02     | 06-02        | README updated, manual deploy steps and rollback rule                                               | ✓ SATISFIED   | See truth 3.                                                                                                                                    |
| DOCS-03     | 06-03, 06-04 | `portfolio-update` skill and docs referencing the markdown workflow flagged or updated              | ✓ SATISFIED   | See truth 4.                                                                                                                                    |

All five phase IDs appear in PLAN frontmatter (06-01: ADMIN-04, ADMIN-05; 06-02: DOCS-01, DOCS-02; 06-03 and 06-04: DOCS-03) and in REQUIREMENTS.md. No orphaned requirement: REQUIREMENTS.md maps exactly these five to Phase 6. Bookkeeping note: REQUIREMENTS.md still shows all five as unchecked and "Pending", and `.planning/ROADMAP.md` and `STATE.md` have uncommitted edits. These are for the orchestrator to update after this verification.

### Anti-Patterns Found

| File                 | Line      | Pattern                                                                                       | Severity                 | Impact                                                                              |
| -------------------- | --------- | --------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| README.md, CLAUDE.md | n/a       | TBD, FIXME, XXX markers                                                                       | none found               | Debt-marker gate clear.                                                             |
| CLAUDE.md            | 1, 13, 23 | Pre-existing em dashes                                                                        | ℹ️ Info (IN-01, open)    | Not added by this phase.                                                            |
| CLAUDE.md            | 15        | `EMDASH_ENCRYPTION_KEY stays unset` cannot be verified from the repo                          | ℹ️ Info (IN-02, open)    | Claim about Dokploy environment.                                                    |
| README.md            | 36        | Admin recovery presented without "rehearsed locally only" caveat                              | ⚠️ Warning (WR-01, open) | Misleading in the lockout case.                                                     |
| CLAUDE.md            | 9         | "Saves drafts only" without `overrideLock`, publish-tool and `ENTRY_LOCKED` specifics         | ⚠️ Warning (WR-02, open) | The convention is the only control, and the agent-binding file omits its specifics. |
| README.md            | 23        | Sample content seed still holds stale dev-portfolio copy                                      | ⚠️ Warning (WR-03, open) | Local seeded database shows the old Markdown and Cloudflare Pages claims.           |
| CLAUDE.md            | 29 vs 14  | Deployment says "no-client-JS rule", line 14 now says "no new client JS beyond the allowlist" | ℹ️ Info                  | Wording drift. The Deployment paragraph was intentionally left unchanged.           |
| README.md            | 7         | Does not mention the Cloudflare-injected `/about` script                                      | ℹ️ Info                  | Documented in CLAUDE.md only.                                                       |

CR-01 (false "no client JS" claim) is resolved: CLAUDE.md line 14 and README line 7 now say no new JS beyond the allowlist, and I confirmed the code ships the scripts they refer to (`src/layouts/Layout.astro:44,52,61`, `src/components/Nav.astro:197`, `src/pages/404.astro:37`, `scripts/script-allowlist.json`). Remaining wording nit: CLAUDE.md names the allowlist as "theme, nav, 404", which omits the console banner and keyboard shortcuts script in Layout.astro. It points at the allowlist file as the authority, so this is not a blocker.

D-07 override (client-side publish deny guard): the guard was removed in 882521a, and `.claude/hooks/emdash-guard.mjs` and `.claude/settings.json` no longer exist. README and CLAUDE.md describe draft-first as a convention with no enforcement claim, which is accurate. Recorded as an accepted deviation, no gap.

### Advisory

- **A1:** 06-EVIDENCE.md row S3 says "Claude never edited ~/.zshrc". 06-03-SUMMARY.md says the orchestrator removed the two lines at the owner's request. The outcome (no `log.sh` reference) is true, but the evidence sentence is inaccurate and should be corrected to say the owner asked the session to make the edit.
- **A2:** Evidence rows E2 to E8 and "no Deploy clicked" are owner-attested; E3 notes Cloudflare behavior from headers only; "Not covered" in 06-EVIDENCE.md already says as much.

### Human Verification Required

#### 1. Confirm the production live-edit record (ADMIN-04, ADMIN-05)

**Test:** Read 06-EVIDENCE.md rows E2 to E8 and confirm they are an accurate record of what you did and saw. Optional: open catalog-cms in the admin and compare the Revisions panel with the rows. If you want fresh proof of the preview link, make a throwaway draft edit, click Preview, open the link in a private window, then discard the draft.
**Expected:** Revisions history matches the rows, preview shows the draft signed out while the public page shows the published copy, and catalog-cms has no pending draft.
**Why human:** Production state transitions I can only observe at the end. The end state matches the baseline (hash H0, origin main unchanged), which fits the recorded sequence but does not prove the middle of it.

#### 2. Confirm Auto Deploy is off in Dokploy

**Test:** Open the portfolio application in Dokploy and check the Auto Deploy toggle.
**Expected:** Off, so a push to `main` runs CI only.
**Why human:** A Dokploy setting not readable from the repo, and README and CLAUDE.md both assert it.

### Gaps Summary

No failed truths and no blocking gaps. Documentation (DOCS-01, DOCS-02, DOCS-03) is verified against the repo: files removed, sweep clean, tests green, README and CLAUDE.md facts match the codebase. The two production requirements (ADMIN-04, ADMIN-05) have complete recorded evidence and a confirmed end state, but the intermediate behaviors were run live by the owner and cannot be replayed without mutating production, so they are reported as owner-attested rather than verified. Open review advisories WR-01 to WR-03, IN-01 and IN-02 remain and are not blockers. Advisory A1 (inaccurate S3 wording) is worth a one-line fix.

---

_Verified: 2026-10-28_
_Verifier: Claude (gsd-verifier)_
