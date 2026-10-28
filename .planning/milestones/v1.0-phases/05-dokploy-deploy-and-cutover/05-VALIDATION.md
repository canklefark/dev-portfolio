---
phase: "05"
slug: dokploy-deploy-and-cutover
status: complete
# nyquist_compliant stays false: the Nyquist audit (gsd-validate-phase) was not run for this phase, so no coverage is claimed. All map rows are resolved from 05-EVIDENCE.md and 05-VERIFICATION.md.
nyquist_compliant: false
wave_0_complete: true
created: "2026-10-26"
revised: "2026-10-27"
closed: "2026-10-28"
---

# Phase 05 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Revised 2026-10-27 (fourth revision): deploys are manual, so the deploy gate, the deploy workflow, the Dokploy API script and the tag probe are gone from this map.

---

## Test Infrastructure

| Property               | Value                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **Framework**          | Node built-in test runner (`node --test`), existing                                     |
| **Config file**        | none; `package.json` script `test` globs `scripts/*.test.mjs` and `src/lib/*.test.mjs`  |
| **Quick run command**  | `npm test`                                                                              |
| **Full suite command** | `npm test && npm run check:public-js`                                                   |
| **Estimated runtime**  | ~30 seconds                                                                             |
| **Test count**         | 51 (60 before plan 05-04 removed `scripts/dokploy-deploy.test.mjs`, 9 tests); 51 pass on 2026-10-28 |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run check:public-js`
- **Before `/gsd-verify-work`:** Full suite must be green and `05-EVIDENCE.md` complete
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement          | Threat Ref | Secure Behavior                                                                                                                          | Test Type   | Automated Command                                                                                                                                                      | File Exists         | Status     |
| -------- | ---- | ---- | -------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------- |
| 05-01-01 | 01   | 1    | GUARD-03             | none       | Smoke check reports a reason on 500 or missing project link (the manual post-deploy check, D-04)                                         | unit        | `node --test scripts/smoke-test.test.mjs`                                                                                                                              | ✅                  | ✅ green   |
| 05-02-01 | 02   | 1    | GUARD-02             | none       | CI fails on a pending migration and on a drifted committed manifest                                                                      | CI step     | `npx emdash seed .emdash/seed.json --database <tmp>/m.db --uploads-dir <tmp>/u && npx emdash migrate --check --from-config --database <tmp>/m.db`                      | ✅                  | ✅ green   |
| 05-03-01 | 03   | 2    | DEPLOY-01, DEPLOY-03 | none       | Production serves the Dokploy app and matches the baseline with the record DNS only                                                      | script      | `node scripts/smoke-test.mjs https://dev.zeikcookson.com`, then script-inventory `fetch`, `parity`, `check` (plan 05-03 Task 2)                                        | ✅ existing tooling | ✅ green (C1, C6) |
| 05-03-02 | 03   | 2    | DEPLOY-04            | T-05-13    | A malformed Host header gets a 4xx or 500 at the origin and the site answers 200 afterwards; the origin response headers are recorded    | curl        | `curl --http1.1 -H 'Host: dev.zeikcookson.com:65536' https://dev.zeikcookson.com/`, then the smoke test (plan 05-03 Task 2)                                            | ✅ existing tooling | ✅ green (C7) |
| 05-04-01 | 04   | 3    | GUARD-03             | T-05-34    | The dead pipeline code is gone, ci is intact, npm test still passes with 51 tests and the one remaining deploy-time command still passes | unit + git  | `test ! -e .github/workflows/deploy.yml`, `npm test` printing `tests 51`, `node scripts/smoke-test.mjs https://dev.zeikcookson.com` (plan 05-04 Task 1)                | ✅ existing tooling | ✅ green (51 tests, no deploy.yml, smoke PASS) |
| 05-04-03a | 04   | 3    | DEPLOY-01, GUARD-03  | T-05-34    | main carries no deploy workflow, ci is green on the pushed main, and the Dokploy app answers behind the proxy (health route, cf-ray)     | gh + curl   | `gh run list` for the main sha, `curl -s https://dev.zeikcookson.com/_emdash/api/health`, `curl -sI` showing cf-ray, `node scripts/smoke-test.mjs` (plan 05-04 Task 3) | ✅ existing tooling | ✅ green (C8, C9) |
| 05-04-03b | 04   | 3    | DEPLOY-03            | T-05-29    | Behind the proxy parity and the public-JS allowlist still hold                                                                           | script      | script-inventory `fetch`, `parity`, `check` against the live site (plan 05-04 Task 3)                                                                                  | ✅ existing tooling | ✅ green under accepted deviation (16/17, C10) |
| 05-05-01 | 05   | 4    | DEPLOY-05            | T-05-19    | A restored volume boots in a scratch app and its pages hash the same as production's                                                     | manual + gh | the user's `emdash doctor` and three `md5sum` lines from both containers, compared by the executor (plan 05-05 Task 1)                                                 | ✅ existing tooling | ✅ green, owner-attested logs and hashes (B2) |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] `scripts/smoke-test.mjs` and `scripts/smoke-test.test.mjs` (GUARD-03, plan 05-01)
- [x] CI guards for GUARD-02 and the committed manifest (plan 05-02), green on GitHub for f2ba6f3
- [x] `05-EVIDENCE.md` skeleton (plan 05-03 Task 1)
- Dropped by user decision 2026-10-27 (manual deploys): `scripts/deploy-gate.mjs` and its test, `.github/workflows/deploy.yml` on `v*` tags, the `ci.yml` `paths-ignore` work, the source ref update in the Dokploy script, the Swagger shape check, and the throwaway tag probe. The committed pipeline code from plan 05-01 is removed in plan 05-04 Task 1.

---

## Manual-Only Verifications

| Behavior                                                                                                      | Requirement         | Why Manual                                      | Test Instructions                                                                                                     |
| ------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Production domain serves the Dokploy app, old site torn down                                                  | DEPLOY-04           | DNS and Dokploy panel                           | Smoke script plus evidence rows C1 and C2 in `05-EVIDENCE.md` (done)                                                  |
| Admin shows the login page, not the setup wizard; one passkey signs in, also behind the proxy                 | ADMIN-02, ADMIN-03  | Real device                                     | C3 (done), then the user's sign-in after the proxy is on, recorded in C9                                              |
| Merge `emdash-migration` into `main`, push, point the Dokploy app at `main`, click Deploy, run the smoke test | DEPLOY-01, GUARD-03 | The user pushes and clicks in the Dokploy panel | Plan 05-04 Task 2; the executor reads the ci run with `gh` and records C8                                             |
| Cloudflare proxy on: SSL/TLS Full (strict), Always Use HTTPS on (accepted, owner 2026-10-27), proxied record                              | DEPLOY-04           | Cloudflare dashboard                            | The user sets them in plan 05-04 Task 2; the executor checks the result from outside (cf-ray, health route, parity)   |
| OAuth MCP connection still works behind the proxy                                                             | (agent access)      | OAuth sign-in happens in the user's Claude Code | The user runs `/mcp` and one `content_list` call in a Claude Code session in this repo; recorded in C9                |
| R2 bucket, scoped key, Dokploy S3 destination, nightly volume backup, restore into a new volume, scratch app  | DEPLOY-05           | Cloudflare and Dokploy panels                   | The user follows plan 05-05 user_setup; the executor compares the reported doctor and hash lines and records B1 to B3 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** closed 2026-10-28 with the map resolved from the evidence files. The other four sign-off boxes stay unticked and `nyquist_compliant` stays false because the Nyquist audit was not run. Rows 05-04-01, 05-04-03a and 05-04-03b were re-observed by the verifier on 2026-10-28 (smoke PASS, npm test 51 pass, parity 16/17, ci green on main); rows 05-03-01 and 05-03-02 rest on executor-recorded evidence from 2026-10-27 (C1, C6, C7); row 05-05-01 and the manual-only rows rest on owner-attested logs and reports.
