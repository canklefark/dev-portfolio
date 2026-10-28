# Phase 5: Dokploy Deploy and Cutover - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md.

**Date:** 2026-10-26
**Phase:** 5-Dokploy Deploy and Cutover
**Areas discussed:** Build/migrate/smoke, Preview and cutover (partial), Admin and backup (settled by simplification)

---

## Build, migrate, smoke

- Build path: Dokploy builds from git (over GHCR via Actions).
- Migrations: pre-deploy command in Dokploy (over entrypoint script, manual).
- Smoke test: GitHub Actions after deploy, alert only (over Dokploy healthcheck, both).
- Branches: preview from emdash-migration, merge to main at cutover, disable Pages build then.

## Preview and cutover

- Preview: preview subdomain with fresh seed import.
- Parity: reuse existing compare tooling.
- Cutover order: claim admin first, then flip, with hosts-file override and DNS-01 cert. User interrupted as too elaborate; replaced by: downtime is fine, flip DNS then claim immediately.
- Rollback window question rejected; no fixed window.
- Final: keep minimal preview parity check.

## Admin, exposure, backup

Not asked individually. User asked to keep it simple; defaults proposed (passkeys only with SQLite recovery rehearsal, stay on Astro 6 and check Host header, Dokploy built-in backup plus one restore drill) and the user proceeded.

## Claude's Discretion

Preview hostname, backup destination and schedule, security headers, session store, smoke trigger mechanism.

## Deferred Ideas

Offsite backup design, zero-downtime cutover, visual parity, Astro 7, retiring Pages.
