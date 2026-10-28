---
phase: "05"
slug: dokploy-deploy-and-cutover
status: verified
threats_open: 0
asvs_level: 1
created: "2026-10-28"
---

# Phase 05 - Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary                          | Description                                                       | Data Crossing                                            |
| --------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- |
| Internet to Cloudflare edge       | Public traffic to dev.zeikcookson.com, proxied, Full (strict)     | Public pages, admin sign-in                              |
| Cloudflare edge to Dokploy origin | Traefik on the Dokploy host, Let's Encrypt certificate            | Same traffic; origin is directly reachable               |
| Dokploy host to R2                | Nightly volume backup upload                                      | SQLite database copy (private bucket, bucket-scoped key) |
| GitHub to production              | Manual: the owner clicks Deploy in Dokploy                        | Source built from main; CI is the only guard             |
| Claude Code to EmDash MCP         | OAuth session with full admin rights (outside Phase 5's register) | Content reads and writes                                 |

---

## Threat Register

Audited 2026-10-28 against the repo and the live site (read-only). Status key: CLOSED verified in repo or live; CLOSED-REMOVED mitigation lived in code deleted by 68e380b and the attack surface is gone; CLOSED-ACCEPTED accepted risk recorded; CLOSED-OWNER-ATTESTED supported only by the owner's report.

| Threat ID                | Category               | Component                                            | Severity | Disposition | Mitigation                                                                                                                                                                     | Status                      |
| ------------------------ | ---------------------- | ---------------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| T-05-01                  | Elevation of privilege | deploy.yml workflow_run job with secrets             | high     | mitigate    | deploy.yml deleted in 68e380b; only ci.yml remains, read-only permissions, no secret references                                                                                | CLOSED-REMOVED              |
| T-05-02                  | Information disclosure | Dokploy API key in logs                              | high     | mitigate    | Script that handled the key deleted; no key or deploy secrets exist (absence of GitHub secrets is owner-attested, gh returned 403)                                             | CLOSED-REMOVED              |
| T-05-03                  | Information disclosure | API key over plain http                              | high     | mitigate    | Nothing that sends a key remains                                                                                                                                               | CLOSED-REMOVED              |
| T-05-04                  | Tampering              | Smoke test passing on an unhealthy deploy            | medium   | mitigate    | smoke-test.mjs treats redirects as failures and crawls a project page; run by hand after each deploy                                                                           | CLOSED                      |
| T-05-05                  | Denial of service      | Deploy job hanging                                   | low      | mitigate    | No deploy job exists                                                                                                                                                           | CLOSED-REMOVED              |
| T-05-06                  | Tampering              | Migration gate passing vacuously                     | medium   | mitigate    | ci.yml seeded migrate --check plus tracked-manifest diff gate; no continue-on-error; empty-database case exits 2                                                               | CLOSED                      |
| T-05-07                  | Information disclosure | Secret in a Dockerfile build arg                     | low      | mitigate    | Only ARG is EMDASH_SITE_URL; runtime stage has no ARG                                                                                                                          | CLOSED                      |
| T-05-08                  | Tampering              | EmDash upgrade migrating production on first request | medium   | mitigate    | CI manifest gate; backup before an upgrade deploy (DEPLOY-02)                                                                                                                  | CLOSED                      |
| T-05-11                  | Information disclosure | Secrets or host IP in evidence or commits            | high     | mitigate    | No secret shapes or host IP in tracked tree or Phase 5 history; repo is public                                                                                                 | CLOSED                      |
| T-05-13                  | Denial of service      | Malformed Host against @astrojs/node 10.1.4          | medium   | accept      | Origin gave 500 and 404 and stayed up; the edge rejects the same requests (403, 400)                                                                                           | CLOSED-ACCEPTED             |
| T-05-34                  | Tampering              | Leftover deploy workflow                             | low      | mitigate    | Remote main workflows are exactly ci.yml; no remote tags                                                                                                                       | CLOSED                      |
| T-05-15                  | Denial of service      | Bad build or migration, no automated fallback        | medium   | mitigate    | Rollback rule in 05-EVIDENCE.md; nightly backup is the way back; a code rollback does not undo a migration                                                                     | CLOSED                      |
| T-05-16                  | Information disclosure | Origin address and Dokploy panel exposure            | low      | accept      | Proxy is not an access boundary; no IP in repo                                                                                                                                 | CLOSED-ACCEPTED             |
| T-05-28                  | Denial of service      | Let's Encrypt renewal behind the proxy               | medium   | accept      | First proxied renewal about 2026-12-26 is unexercised; grey-cloud fallback; ACME path returned 404 with no redirect                                                            | CLOSED-ACCEPTED             |
| T-05-29                  | Tampering              | Cloudflare rewriting HTML or injecting scripts       | medium   | mitigate    | Parity and allowlist checks run against live; one known Cloudflare email-decode script on /about is an owner-accepted deviation; allowlist unchanged so any other script fails | CLOSED (accepted deviation) |
| T-05-30                  | Denial of service      | Cloudflare bot protection on the MCP client          | low      | accept      | OAuth MCP content_list worked behind the proxy                                                                                                                                 | CLOSED-ACCEPTED             |
| T-05-35                  | Elevation of privilege | Admin lockout with one passkey                       | medium   | accept      | Recovery procedure in PROJECT.md; setup wizard not claimable (needsSetup false)                                                                                                | CLOSED-ACCEPTED             |
| T-05-19                  | Tampering              | Restore overwriting production                       | high     | mitigate    | Restore went into a new volume; production smoke test and live parity intact afterwards                                                                                        | CLOSED-OWNER-ATTESTED       |
| T-05-20                  | Information disclosure | Scratch app left reachable                           | medium   | mitigate    | Scratch app had no domain; owner reports it and its volume were deleted                                                                                                        | CLOSED-OWNER-ATTESTED       |
| T-05-21                  | Information disclosure | Backups readable in the bucket                       | medium   | mitigate    | Private bucket and bucket-scoped key per the owner; no key or endpoint in repo                                                                                                 | CLOSED-OWNER-ATTESTED       |
| T-05-22                  | Tampering              | Inconsistent SQLite copy                             | medium   | mitigate    | Backup stops the container and copies db, -wal and -shm (run log)                                                                                                              | CLOSED-OWNER-ATTESTED       |
| T-05-SC (plans 01 to 05) | Tampering              | npm installs                                         | high     | mitigate    | No package.json or lockfile change in Phase 5                                                                                                                                  | CLOSED                      |

_Status: open · closed · open - below block_on threshold (non-blocking)_

---

## Accepted Risks Log

| Risk ID  | Threat Ref | Rationale                                                                          | Accepted By | Date       |
| -------- | ---------- | ---------------------------------------------------------------------------------- | ----------- | ---------- |
| AR-05-01 | T-05-29    | Cloudflare Email Address Obfuscation stays on; one injected script on /about       | Owner       | 2026-10-27 |
| AR-05-02 | T-05-28    | Always Use HTTPS stays on; ACME path not redirected when probed                    | Owner       | 2026-10-27 |
| AR-05-03 | T-05-35    | One passkey only; recovery procedure in PROJECT.md                                 | Owner       | 2026-10-27 |
| AR-05-04 | T-05-15    | Manual deploys with CI as the only guard; CI cannot stop a manual Deploy click     | Owner       | 2026-10-28 |
| AR-05-05 | none       | Built commit is inferred, Dokploy prints no hash                                   | Owner       | 2026-10-28 |
| AR-05-06 | T-05-22    | No alert on a failed nightly backup                                                | Owner       | 2026-10-28 |
| AR-05-07 | T-05-28    | First proxied Let's Encrypt renewal (about 2026-12-26) unexercised                 | Owner       | 2026-10-28 |
| AR-05-08 | T-05-13    | Malformed Host accepted under D-10                                                 | Owner       | 2026-10-27 |
| AR-05-09 | T-05-16    | Origin directly reachable                                                          | Owner       | 2026-10-27 |
| AR-05-10 | none       | EmDash rate limiting inactive without trusted proxy headers; no CSP (gate g, D-11) | Owner       | 2026-10-27 |

_Accepted risks do not resurface in future audit runs._

---

## Unregistered Observations

None are open threats. Recorded for the owner.

1. **Agent access (medium, outside Phase 5).** `.mcp.json` registers the production MCP endpoint by URL only. The OAuth session carries full admin rights and no guard hook exists, so a prompt-injected session could change or publish production content. Backups limit the damage. Owner decision 2026-10-28.
2. **No HSTS (low).** Responses carry no strict-transport-security header.
3. **Operational identifiers in a public repo (low).** Bucket name, Dokploy app slug, a backup object key and the recovery procedure appear in 05-EVIDENCE.md and PROJECT.md. None are secrets.
4. **Unexplained 403 on the first S3 destination test (low).** Confirm the R2 token is still limited to Object Read and Write on the one bucket and was not widened.
5. **PROJECT.md says "Enroll two new passkeys"** while the owner decision is one passkey.
6. **ci.yml pins actions by tag, not SHA,** and checkout does not set persist-credentials: false. Token is contents: read and no secrets are used.
7. **.gitignore ignores .env and .env.production but not .env.\*** (.dockerignore does).

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By               |
| ---------- | ------------- | ------ | ---- | -------------------- |
| 2026-10-28 | 26            | 26     | 0    | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-28
