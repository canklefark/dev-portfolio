---
phase: 02-content-model-and-import
asvs_level: 1
block_on: high
threats_total: 20
threats_closed: 16
threats_accepted: 4
threats_open: 0
verdict: SECURED
---

# Phase 2 Security Verification: Content Model and Import

16 CLOSED, 4 ACCEPTED, 0 OPEN (20 register rows; T-02-SC appears in all four plans with different dispositions). The only high threat, T-02-SC in plan 02-01, is CLOSED. Judged against current code, after the amendments that made category and tags EmDash taxonomies and date a datetime.

Independent runs by the auditor: `scripts/verify-import.mjs` against the repo `data/emdash.db` (read-only) gave 232/232 checks and 0 differences; the committed `.emdash/seed.json` applied to a throwaway root gave 232/232 and 0 users.

## Threat Verification

| Threat ID       | Severity | Disposition | Status              | Evidence                                                                                                                                                                                                        |
| --------------- | -------- | ----------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-02-01         | medium   | mitigate    | CLOSED              | `scripts/import-content.mjs:198-216` uses `execFileSync` with an argument array and no shell. No `exec`, `execSync`, `spawn` or `eval` anywhere in scripts. Temp seed from `mkdtempSync`, removed in `finally`. |
| T-02-02         | medium   | mitigate    | CLOSED              | `scripts/verify-import.mjs:108` opens the database `readOnly`. `scripts/lib/schema.mjs:76-87` freezes `TABLES`; only `${TABLES.*}` is interpolated; every value is bound with `?`.                              |
| T-02-03         | medium   | mitigate    | CLOSED              | Importer writes only through the emdash seed CLI; `DatabaseSync` appears only in the read-only verifier.                                                                                                        |
| T-02-04         | low      | mitigate    | CLOSED              | Report defaults to `~/portfolio-baseline/current/phase2/`, outside the repo; no report or `.db` is tracked.                                                                                                     |
| T-02-05         | low      | mitigate    | CLOSED              | Strict body comparison (`verify-import.mjs:279`) and a byte-identical round-trip test for all 13 bodies and About. Body links are relative.                                                                     |
| T-02-SC (02-01) | high     | mitigate    | CLOSED              | `yaml ^2.8.4` pinned with integrity hash; the lockfile diff in `8ab6c91` adds 0 packages (already present transitively); legitimacy audit recorded in `02-RESEARCH.md`.                                         |
| T-02-06         | low      | accept      | ACCEPTED            | `sources.mjs` imports named exports only from repo-controlled `src/data/about.ts`.                                                                                                                              |
| T-02-07         | medium   | mitigate    | CLOSED              | Menu name and settings keys are bound values in a read-only handle.                                                                                                                                             |
| T-02-08         | low      | mitigate    | CLOSED              | Tests use `mkdtempSync` and `rmSync` in `finally`; no leftover temp dirs.                                                                                                                                       |
| T-02-SC (02-02) | low      | accept      | ACCEPTED            | No package change after `8ab6c91`.                                                                                                                                                                              |
| T-02-09         | medium   | mitigate    | CLOSED              | `data/` is gitignored; the dev bypass is gated on `import.meta.env.DEV` upstream; live and rebuilt databases hold 0 users, 0 credentials, 0 tokens.                                                             |
| T-02-10         | medium   | mitigate    | CLOSED              | `"dev": "astro dev"` with no `--host`; no `server.host`; no listener on 4321 now.                                                                                                                               |
| T-02-11         | medium   | mitigate    | CLOSED              | Structure seed written before any server start; seed, database and generated types hold only `about` and `projects`.                                                                                            |
| T-02-12         | low      | mitigate    | CLOSED (procedural) | Claude stopped no process; the user stopped the server.                                                                                                                                                         |
| T-02-SC (02-03) | low      | accept      | ACCEPTED            | No package change after `8ab6c91`.                                                                                                                                                                              |
| T-02-13         | medium   | mitigate    | CLOSED              | Seed has 13 published projects and 1 about; no test entry, no drafts.                                                                                                                                           |
| T-02-14         | medium   | mitigate    | CLOSED              | Fresh rebuild from the committed seed verifies 232/232.                                                                                                                                                         |
| T-02-15         | low      | mitigate    | CLOSED (procedural) | No listener on 4321 at the start of both 02-04 tasks.                                                                                                                                                           |
| T-02-16         | medium   | mitigate    | CLOSED              | Seed has no users, credentials, tokens, `url` setting or dev bypass email.                                                                                                                                      |
| T-02-SC (02-04) | low      | accept      | ACCEPTED            | No package change after `8ab6c91`.                                                                                                                                                                              |

## Observations (informational)

1. The plan 02-03 gate "no listener on 4321" was not met inside 02-03, by design: the user did not consent to Claude stopping the server. It held at the start of both 02-04 tasks and holds now.
2. T-02-12 to T-02-15 rely on one-time gates and operator procedure. The seed is a snapshot of commit `d91fbbd`; a re-export before Phase 3 must repeat the draft, test-entry, user and listener checks.
3. The dev-bypass `DEV` gate lives in the emdash package (`^1.3.1`), not in repo code.
4. `--root` and `--report` accept arbitrary local paths; this is a local CLI, not an untrusted input boundary.

## Unregistered Flags

None.
