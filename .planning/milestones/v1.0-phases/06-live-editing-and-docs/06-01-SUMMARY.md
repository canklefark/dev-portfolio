---
phase: 06-live-editing-and-docs
plan: 01
subsystem: admin
tags: [emdash, live-editing, preview, mcp, oauth, evidence]

requires:
  - phase: 05-dokploy-deploy-and-cutover
    provides: production at dev.zeikcookson.com behind the Cloudflare proxy, scripts/smoke-test.mjs, the evidence-file format
provides:
  - 06-EVIDENCE.md with rows E1 to E9 all PASS, the Procedure P0 to P14 and Not covered
  - production proof that a draft saved in the admin stays off the public page, that the built-in Preview link works signed out, and that Publish goes live with no rebuild, push or deploy
  - production proof that an agent change over the OAuth MCP connection lands as a pending revision and stays off the public page until the owner publishes
  - production proof that Restore plus a second Publish returns the page to its exact starting bytes
affects:
  [
    06-04 appends the DOCS-03 stale-reference section to 06-EVIDENCE.md,
    verify-work for phase 06,
  ]

status: complete
plan_head_before: 4a016b53c8f84f4eb9b4b5c88dd33a3adb449df2
plan_head_after: 75f1510b27e38ca5628e1ffde2e4716609b2bd07

actuals:
  tokens: 3400
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Live-edit proof by anonymous page hash: record H0 before any edit, then compare the hash after each admin or agent action and after the final publish"

key-files:
  created:
    - .planning/phases/06-live-editing-and-docs/06-EVIDENCE.md
  modified: []

key-decisions:
  - "Open Question 6 (Task 1): restore-then-publish, auto-selected from the plan's auto_select default because auto chain was active and the gate was blocking, not blocking-human. Restore writes a draft only, so a second Publish returns the live page; the proof is the page hash, not the revision count"

requirements-completed: [ADMIN-04, ADMIN-05]

coverage:
  - id: D1
    description: "Draft, preview, publish, agent draft, restore and second publish exercised on production catalog-cms, final page hash equal to the baseline"
    requirement: "ADMIN-04"
    verification:
      - kind: other
        ref: "06-EVIDENCE.md rows E1 to E9 and the Task 3 gate (live sha1 equals H0, no marker on the page)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Built-in Preview link opens the draft signed out with cache-control private, no-store while the public URL shows the published copy"
    requirement: "ADMIN-05"
    verification:
      - kind: manual_procedural
        ref: "06-EVIDENCE.md row E3 (owner observations in a signed-out private window, headers read by curl -sI)"
        status: pass
    human_judgment: true
    rationale: "The signed-out private-window observation is the owner's report; the headers and marker count were read by the session with curl"

duration: n/a (spans the owner's live run)
completed: 2026-10-28
---

# Phase 6 Plan 01: Live editing proof on production Summary

The live editing loop works on production: the owner drafted, previewed signed out, published and restored a real card from the admin, Claude staged one draft change over the OAuth MCP connection, and the page ended on the same hash it started with.

## Performance

- **Tasks:** 3 of 3 (Task 1 decision, Task 2 tracer, Task 3 owner run)
- **Commits:** 2 plan commits (`2b48304` baseline and procedure, `75f1510` filled evidence), plus the SUMMARY commit that follows this file

## Accomplishments

- **Task 1, Open Question 6:** choice `restore-then-publish`, recorded in the evidence file under Decisions applied.
- **Task 2, tracer:** H0 for `/projects/catalog-cms/` is `0f23a5617458a21237c3604793edf5cb8ba73705` (two anonymous GETs agreed; both markers 0; HTTP/2 200, `cf-cache-status: DYNAMIC`, no `cache-control`; origin main `d38f5c98b61d7e30bc2466c069a9a8d01db1bc92`; smoke test PASS). The evidence file was written with the full procedure and its gate re-hashed the live page to H0.
- **Task 3, owner run:** rows E1 to E9 are all PASS.
- **E3 (preview, ADMIN-05):** the preview link answered HTTP/2 200 with `cache-control: private, no-store` and `cf-cache-status: DYNAMIC` (not a HIT), and a curl of it showed the LIVE EDIT CHECK marker once. The path shape is `/projects/catalog-cms` (the slug, not an id), so the url_pattern fallback to an id never happened. In the signed-out private window the owner saw the marker on the preview link and none on the public page. The preview address is recorded as REDACTED and appears nowhere in this repo.
- **E4:** after the owner published, the next anonymous request showed the marker (hash `403c220d...`, different from H0) with origin main unchanged and no Deploy clicked.
- **E5 (agent draft, D-02):** tools called were `mcp__emdash__content_get`, `mcp__emdash__content_update` (data with only `sub`, the `_rev` from the read, no status, no overrideLock) and `content_get` again. No ENTRY_LOCKED. Afterwards `data.sub` ended with AGENT DRAFT CHECK, `liveData.sub` did not, and `draftRevisionId` was set. No publish, unpublish, schedule or delete tool was called.
- **E6:** the public page stayed on the same hash after the agent draft, with AGENT DRAFT CHECK count 0.
- **E7 and E8:** after the owner published the agent draft the page showed it; after Restore the page hash was unchanged (hash `c83d6548...`), confirming Restore writes a draft only.
- **E9 and final hash comparison:** after the second publish the anonymous page hash is `0f23a5617458a21237c3604793edf5cb8ba73705`, equal to H0, with both marker counts 0 and `smoke-test: PASS`.

## Final independent checks (executor, after the owner's "done")

- Both Task 3 verify commands exit 0. The live page sha1 is `0f23a5617458a21237c3604793edf5cb8ba73705`, equal to H0, with neither marker present. The smoke test printed `smoke-test: PASS`.
- `git ls-remote origin refs/heads/main` still returns `d38f5c98b61d7e30bc2466c069a9a8d01db1bc92`, equal to E1, so nothing was pushed to main during the exercise.
- The evidence file has no PENDING cell, no em or en dash, no preview query parameter and no bearer value.

## Deviations from Plan

None in the plan's logic. Process notes:

- The Task 2 commit (`2b48304`) was made by the coordinator, not by this executor. My own attempt was refused by the protected-branch assertion because HEAD was on `main` and `git.allow_default_branch_commits` is not set. I returned a checkpoint instead of overriding it, and the work moved to branch `gsd/phase-06-live-editing-and-docs`.
- The filled E5 cell notes that the owner-saved Sub had a trailing space after LIVE EDIT CHECK, so the agent text followed a double space, which HTML collapses. It does not affect any marker count.
- A formatter re-padded the Results table after the first write; both gates were run against the file as formatted.

## Known limits (also under Not covered in 06-EVIDENCE.md)

- catalog-cms keeps the extra revisions and a newer updated time. "Exactly as it started" is proven by the page hash and smoke test, not by revision count.
- "No rebuild" rests on the owner's report that no Deploy was clicked and on origin main being unchanged.
- Draft-first is a convention, because the OAuth session holds the owner's admin rights and nothing refuses a publish.
- The E3 private-window observations and the revision count in E2 are the owner's report.

## Known Stubs

None.

## Threat Flags

None. No source, route or config was changed, and no new surface was added.

## Self-Check: PASSED

- FOUND: `.planning/phases/06-live-editing-and-docs/06-EVIDENCE.md`
- FOUND commits `2b48304` and `75f1510` on the current branch (ancestor of HEAD)
