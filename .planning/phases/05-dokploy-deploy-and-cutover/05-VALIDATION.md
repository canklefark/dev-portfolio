---
phase: "05"
slug: dokploy-deploy-and-cutover
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-10-26"
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Framework**          | Node built-in test runner (`node --test`), existing                                    |
| **Config file**        | none; `package.json` script `test` globs `scripts/*.test.mjs` and `src/lib/*.test.mjs` |
| **Quick run command**  | `npm test`                                                                             |
| **Full suite command** | `npm test && npm run check:public-js`                                                  |
| **Estimated runtime**  | ~30 seconds                                                                            |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run check:public-js`
- **Before `/gsd-verify-work`:** Full suite must be green and `05-EVIDENCE.md` complete
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement          | Threat Ref                | Secure Behavior                                                                                                                                                                                                                                                | Test Type        | Automated Command                                                                                                                                                                               | File Exists         | Status     |
| -------- | ---- | ---- | -------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------- |
| 05-01-01 | 01   | 1    | GUARD-03             | none                      | Smoke check reports a reason on 500 or missing project link                                                                                                                                                                                                    | unit             | `node --test scripts/smoke-test.test.mjs`                                                                                                                                                       | ❌ W0               | ⬜ pending |
| 05-02-01 | 02   | 1    | GUARD-02             | none                      | CI fails on a pending migration                                                                                                                                                                                                                                | CI step          | `npx emdash seed .emdash/seed.json --database <tmp>/m.db --uploads-dir <tmp>/u && npx emdash migrate --check --from-config --database <tmp>/m.db`                                               | ❌ W0               | ⬜ pending |
| 05-03-01 | 03   | 2    | DEPLOY-01, DEPLOY-03 | none                      | Deployed site serves and matches baseline (record DNS only)                                                                                                                                                                                                    | script           | `node scripts/smoke-test.mjs https://dev.zeikcookson.com`, then script-inventory `parity`                                                                                                       | ✅ existing tooling | ⬜ pending |
| 05-03-02 | 03   | 2    | DEPLOY-01            | T-05-32                   | The panel builds a tag: a missing ref fails the deployment, the tag by name builds, the source ref is set back                                                                                                                                                 | manual probe     | the user's throwaway tag probe (plan 05-03 Task 2 step 9), recorded in C7                                                                                                                       | ✅ existing tooling | ⬜ pending |
| 05-04-01 | 04   | 3    | GUARD-03             | T-05-24, T-05-25, T-05-31 | The gate refuses a ref that is not a `v*` tag, a commit that is off main or has no green ci run; the deploy script sets the Dokploy source ref to the tag before it deploys and deploys nothing when that update fails; deploy.yml starts only from a `v*` tag | unit + structure | `node --test scripts/deploy-gate.test.mjs scripts/dokploy-deploy.test.mjs`, then the js-yaml structure check of deploy.yml in plan 05-04 Task 1                                                 | ❌ W0               | ⬜ pending |
| 05-04-02 | 04   | 3    | GUARD-03             | none                      | Documentation-only pushes and tag pushes start no ci; pull requests stay unfiltered                                                                                                                                                                            | structure        | the js-yaml structure check of ci.yml in plan 05-04 Task 2                                                                                                                                      | ❌ W0               | ⬜ pending |
| 05-04-04 | 04   | 3    | GUARD-03             | none                      | A main push starts no deploy; the first tag push runs the gate, sets the Dokploy source ref to the tag, deploys and smokes                                                                                                                                     | CI run           | `gh run view <deploy run> --log` shows `deploy-gate: PASS`, the `expecting Dokploy to build tag` line, `dokploy-deploy: source ref set to <tag>`, `dokploy-deploy: PASS` and `smoke-test: PASS` | ✅ existing tooling | ⬜ pending |
| 05-05-01 | 05   | 4    | DEPLOY-04, GUARD-03  | T-05-27                   | Behind the proxy the Dokploy app still answers and the pipeline smoke passes                                                                                                                                                                                   | CI run + script  | `curl -sI` shows `cf-ray`; a manual deploy run on the tag `v1.0.0` is green; the user reports the EmDash health route output                                                                    | ✅ existing tooling | ⬜ pending |
| 05-05-02 | 05   | 4    | DEPLOY-03            | T-05-29                   | Behind the proxy parity and the public-JS allowlist still hold, headers present, ACME path reaches the origin                                                                                                                                                  | script           | script-inventory `fetch`, `parity`, `check` against the live site; header and ACME probe `curl` checks                                                                                          | ✅ existing tooling | ⬜ pending |
| 05-06-01 | 06   | 5    | DEPLOY-05            | none                      | Restored volume matches production                                                                                                                                                                                                                             | script           | script-inventory `fetch` both, then `parity` between them                                                                                                                                       | ✅ existing tooling | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `scripts/smoke-test.mjs` and `scripts/smoke-test.test.mjs` — GUARD-03
- [ ] `scripts/deploy-gate.mjs` and `scripts/deploy-gate.test.mjs`: GUARD-03 (D-15)
- [ ] `.github/workflows/deploy.yml` on `v*` tags and `.github/workflows/ci.yml` `paths-ignore`: GUARD-03 (D-15)
- [ ] `scripts/dokploy-deploy.mjs` and `scripts/dokploy-deploy.test.mjs` extended: set the Dokploy source ref to the tag (`--ref`, `--ref-field`) before the deploy request: GUARD-03 (D-15)
- [ ] Verify Dokploy API shapes in Swagger; record host arch, RAM, Git access
- [ ] Throwaway tag probe on the real panel (plan 05-03 Task 2 step 9, recorded in C7): the call and field that set the source ref to a tag, the tag form, a missing ref failing, the update-then-deploy ordering and whether deployments expose the built commit; the documented tip fallback (D-15) applies only if the panel cannot build a tag and the user confirms it
- [ ] `05-EVIDENCE.md` skeleton (production parity, Host-header check, pipeline run, restore, recovery)

---

## Manual-Only Verifications

| Behavior                                                                                                                    | Requirement        | Why Manual                                                       | Test Instructions                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production domain serves the Dokploy app, old site torn down                                                                | DEPLOY-04          | DNS and Dokploy panel                                            | Smoke script plus runbook evidence in `05-EVIDENCE.md`                                                                                             |
| Admin shows login page not setup wizard; two passkeys sign in; recovery tested                                              | ADMIN-02, ADMIN-03 | Real devices                                                     | Human-verify checkpoints, record in `05-EVIDENCE.md`                                                                                               |
| `v*` tag push (the user tags a commit of main, normally the tip)                                                            | GUARD-03           | A push deploys production                                        | The user pushes; Dokploy then builds that tag; the executor reads the run with `gh`                                                                |
| Dokploy builds a tag: a throwaway tag probe (a missing ref fails, the tag by name builds, the ref is set back)              | DEPLOY-01          | The Dokploy panel and its API key are the user's                 | The user runs plan 05-03 Task 2 step 9; the executor records it in C7 and takes the tip fallback only after the user replies `accept tip fallback` |
| Cloudflare proxy on: SSL/TLS Full strict, Always Use HTTPS off, HTML rewriting features off, Transform Rule, proxied record | DEPLOY-04          | Cloudflare dashboard                                             | The user sets them in plan 05-05; the executor checks the result from outside                                                                      |
| EmDash health route `/_emdash/api/health` answers behind the proxy                                                          | DEPLOY-04          | The committed guard denies the executor `curl` to `_emdash` URLs | The user requests it and reports the JSON                                                                                                          |
| Agent token recreated on production and one `content_list` call through the proxy                                           | (D-12)             | Token is created in the production admin                         | Human checkpoint in plan 05-05, recorded in `05-EVIDENCE.md`                                                                                       |
| R2 bucket, scoped key, Dokploy S3 destination and the backup schedule                                                       | DEPLOY-05          | Cloudflare and Dokploy panels                                    | Human steps in plan 05-06, recorded in `05-EVIDENCE.md`                                                                                            |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
