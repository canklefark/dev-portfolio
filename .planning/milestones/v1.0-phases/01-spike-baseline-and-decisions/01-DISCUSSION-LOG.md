# Phase 1: Spike, Baseline and Decisions - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md.

**Date:** 2026-10-23
**Phase:** 1-Spike, Baseline and Decisions
**Areas discussed:** Spike environment, Baseline capture, Decision gates, Dependency and Node pinning

---

## Spike environment

Started with a scratch Cloudflare Worker + D1 (selected). User then redirected: personal project, self-host on Dokploy with Node.
- Database: SQLite on a Dokploy volume (selected) vs Postgres, libSQL, let spike decide.
- Roadmap handling: finish discuss then amend roadmap (selected) vs amend now.
- Spike scope: local first, Dokploy trial in Phase 5 (selected) vs throwaway Dokploy app.
- Servers: allow `astro preview` only in Phase 1 (selected) vs ask each time vs user runs.

## Baseline capture

- Location/depth: `~/portfolio-baseline/` HTML + script inventory (selected).
- CI allowlist: JSON of counts plus inline-script hashes (selected).

## Decision gates

- Adapter: `@astrojs/node` standalone (selected).
- Admin gate: user asked "just the emdash auth?" and confirmed EmDash auth only.
- Rendering fallback: caching headers first, prerender last (selected).

## Dependency and Node pinning

- Branch: long-lived `emdash-migration` (selected).
- Pins: caret plus lockfile (selected).
- Node: user asked why 22; floor 22.16 is EmDash's minimum. Selected Node 24 runtime, floor 22.16 in engines.

## Claude's Discretion

Media storage on Node, Dockerfile layout, decision record format.

## Deferred Ideas

Cloudflare Access (moot), em dash page titles.
