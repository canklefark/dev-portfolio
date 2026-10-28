---
phase: 05-dokploy-deploy-and-cutover
plan: 03
subsystem: infra
tags: [dokploy, traefik, parity, smoke-test, evidence, emdash]

requires:
  - phase: 05-dokploy-deploy-and-cutover
    provides: plan 05-01 scripts/smoke-test.mjs and plan 05-02 CI guards and committed migration manifest
provides:
  - 05-EVIDENCE.md rows C1 to C7 filled from observed facts and user reports
  - production parity at the origin (17/17 identical, allowlist 17/17 passed, no cf-ray) with the record DNS only
  - malformed Host behaviour and origin response headers on record
  - C2 and C4 aligned to the user's decisions of 2026-10-27 (Pages gone, one passkey)
affects:
  [
    05-04 turns the Cloudflare proxy on and fills C8 to C10,
    05-05 adds backups and fills B1 to B3,
  ]

plan_head_before: f2ba6f335cd6aa4341efe9fe5602d2a8265993af
plan_head_after: c790468f68dd675140add53af2e8a3837313970c

actuals:
  tokens: 7417
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Parity verdict is the parity line plus no UNEXPECTED line plus no cf-ray header, never the exit code of the strict compare that fetch prints"

key-files:
  created: []
  modified:
    - .planning/phases/05-dokploy-deploy-and-cutover/05-EVIDENCE.md

key-decisions:
  - "One replica and Dokploy's default stop-first update order are assumed, not read from the panel, and the panel is not changed for it"

patterns-established:
  - "Evidence rows record observed output and say which parts are the user's report"

requirements-completed:
  [DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, ADMIN-02, ADMIN-03]

coverage:
  - id: D1
    description: "Production at https://dev.zeikcookson.com gives no unexpected status, parity: 17/17 identical against the baseline and check: 17/17 passed against the allowlist, with no cf-ray header, recorded in C6"
    requirement: DEPLOY-03
    verification:
      - kind: other
        ref: "Task 2 verify command 1 (fetch, parity, check chain against the live hostname)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Malformed Host requests at the origin answered 500 and 404, the smoke test passes afterwards, and the four origin security headers are recorded in C7"
    requirement: DEPLOY-04
    verification:
      - kind: other
        ref: "Task 2 verify command 2 (two curl --http1.1 Host requests, then smoke-test.mjs --attempts 3)"
        status: pass
    human_judgment: false
  - id: D3
    description: "C2 says the Pages project no longer exists and C4 is the one-passkey row with the lockout risk stated once and sign-in deferred to C9; C1 to C7 PASS, C8 to B3 PENDING, no dash or IPv4 address"
    requirement: ADMIN-03
    verification:
      - kind: other
        ref: "Task 2 verify command 3 (node evidence row and wording gate)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Passkey enrollment on the production hostname and wizard state are the user's report; the executor requested no admin page"
    requirement: ADMIN-02
    verification: []
    human_judgment: true
    rationale: "Admin state cannot be observed without requesting _emdash pages; sign-in on the production hostname is proven in plan 05-04 (C9)"

duration: 8min
completed: 2026-10-27
status: complete
---

# Phase 5 Plan 3: Production parity, malformed Host check and evidence Summary

**Production on the Dokploy host, record DNS only, serves 17 of 17 public pages identical to the baseline and passing the public-JS allowlist with no cf-ray header, survives malformed Host headers, and the evidence file now holds rows C1 to C7 in line with the user's decisions of 2026-10-27.**

## Performance

- **Duration:** 8 min
- **Completed:** 2026-10-27T16:41Z
- **Tasks:** 2 (Task 1, the tracer, was committed earlier as 6c4c3f2 and only re-verified here)
- **Files modified:** 1 (05-EVIDENCE.md)

## Accomplishments

- Task 1 re-verified: `smoke-test: PASS` against https://dev.zeikcookson.com and the HEAD answer has no cf-ray header.
- C6: `fetch` requested 17 routes (16 answered 200, the unmatched path answered 404 as expected) with no UNEXPECTED line and no `fetch: <n> unexpected status` line. Its strict compare printed 16 DIFF lines and exited 1, which is not the verdict. `parity: 17/17 identical`, `check: 17/17 passed`, no cf-ray.
- C7: Host `dev.zeikcookson.com:65536` got **500** and `dev.zeikcookson.com:8080:8080` got **404** over HTTP/1.1. `smoke-test: PASS` afterwards (`--attempts 3 --delay-ms 5000`), so the site stayed up (T-05-13 residual risk observed, accepted per D-10).
- Origin headers observed on HEAD: `x-content-type-options: nosniff`, `referrer-policy: strict-origin-when-cross-origin`, `x-frame-options: SAMEORIGIN`, `permissions-policy: camera=(), microphone=(), geolocation=(), payment=()`. No header rule added (D-11).
- C2 now states the Cloudflare Pages project no longer exists (D-05). C4 is rewritten as `PASS (one passkey, user decision 2026-10-27, D-09 amended)`, with the lockout risk stated once and sign-in left to C9.
- `## Decisions applied` gained the one-replica and stop-first assumption bullet.

## C1 to C7 results

| Row | Result                                                                                 |
| --- | -------------------------------------------------------------------------------------- |
| C1  | PASS (earlier, 6c4c3f2): smoke, GitHub ci run 40529698574 green, built commit INFERRED |
| C2  | PASS: DNS only, valid Let's Encrypt certificate, no cf-ray, Pages project gone         |
| C3  | PASS (user report): wizard with Sample content, needsSetup false                       |
| C4  | PASS (one passkey, user report and decision), sign-in deferred to C9                   |
| C5  | PASS (user report): 90 migrations applied, none pending                                |
| C6  | PASS: parity 17/17 identical, check 17/17 passed, no cf-ray                            |
| C7  | PASS: Host statuses 500 and 404, smoke PASS afterwards, four origin headers            |

C8 to C10 and B1 to B3 stay PENDING for plans 05-04 and 05-05.

## Deviations from Plan

None - plan executed exactly as written.

The first attempt at the Task 2 fetch command was refused by the permission system (it contained a directory deletion); it was re-run with a fresh `mktemp -d` directory under the scratchpad and no deletion. No plan content changed.

## Verification

- Task 2 verify command 1 (cf-ray absent, no UNEXPECTED, parity 17/17, check 17/17): pass.
- Task 2 verify command 2 (both malformed Host requests got an HTTP answer, smoke passes after): pass.
- Task 2 verify command 3 (evidence row and wording gate): `EVIDENCE GATE OK`.
- `npm test`: 60 of 60 pass, 0 fail (no code changed).

## Known Stubs

None.

## Threat Flags

None. No file besides the evidence record changed; it holds no secret, IP address, passkey data or response body (the evidence gate fails on an IPv4 address or a dash).

## Notes on actuals

`actuals.commits` is 2, counted from commits whose message scope is (05-03): 6c4c3f2 and c790468. `plan_head_before` is the parent of 6c4c3f2; the raw range to HEAD also holds unrelated docs and chore commits made on the branch in between, so it is not used. `actuals.tokens` is chars/4 over the added lines of the evidence file diff across both commits and includes table padding, so it overstates the prose.

## Next

Ready for 05-04: remove the unused pipeline code, fast-forward `main` (user's push), repoint the Dokploy app, then turn the Cloudflare proxy on and fill C8 to C10.

## Self-Check: PASSED
