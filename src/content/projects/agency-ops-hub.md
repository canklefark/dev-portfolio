---
date: "2026-08-20"
title: "Primary"
category: "Agency Tooling"
status: "LIVE"
statusVariant: "green"
surface: "DOKPLOY / SELF-HOSTED POSTGRES"
timeLabel: "ACTIVE"
period: "Q3 2026"
tags:
  [
    "SvelteKit",
    "Svelte 5",
    "PostgreSQL",
    "Drizzle",
    "Better Auth",
    "Dokploy",
    "shadcn-svelte",
  ]
summary: "Internal ops hub for the agency I work at — huddle board, task intake from Slack/Gmail/Granola, meeting-transcript extraction, and client/project dashboards — replatformed off a Next.js/Vercel/Supabase app the team was outgrowing."
sub: "A full re-architecture onto SvelteKit and self-hosted Postgres on Dokploy, with 1,891 tests built alongside the code instead of deferred."
stats:
  - { label: "Tests", value: "1,891", variant: "green" }
  - { label: "Commits", value: "860", variant: "default" }
  - { label: "Files changed (v2.0)", value: "409", variant: "default" }
draft: false
---

## The Problem

The agency's internal ops — huddles, task intake, project and client dashboards — ran on a Next.js/Supabase/Vercel app someone else on the team had built. It worked, but it was hitting real limits: a Supabase connection pooler capped at one connection forcing every DB call to run sequentially, 1000+ line monolithic files like the registry editor, over a hundred unsafe type casts around Slack block construction, and near-zero test coverage on the services everything else depended on.

## Approach

I re-architected it from scratch onto SvelteKit, self-hosted Postgres, and Dokploy — same feature set, materially better admin UX, and a real test suite from day one instead of backfilled later. v1 got it to feature parity and let the old stack get decommissioned. v2.0 layered in a consistent shadcn-svelte component system with dark mode, a people/clients data model, multi-source task intake (Slack, Gmail, Granola transcripts, in-app quick capture), a daily Slack check-in pipeline, and a rework of the huddle, person, project, and client dashboards — 33 plans, 409 files changed, roughly 86k lines added, shipped in five days.

## Current State

v2.0 is live: 1,891 tests (1,332 unit, 559 integration), all green, zero TypeScript errors. Every pre-replatform pain point I set out to fix — the pooler bottleneck, the monolithic registry editor, the unsafe Slack type casts, the untested services — is gone by construction, not patched over.

## What's Next

v2.1 closes out deferred backlog: deeper huddle support for meeting prep and per-client time-budget pacing, in-app roster management so deactivating someone doesn't require a direct DB write, and a preview/dry-run step before registry changes commit.

## Stack

`SvelteKit` · `Svelte 5` · `TypeScript` · `PostgreSQL` · `Drizzle` · `Better Auth` · `Dokploy` · `shadcn-svelte`
