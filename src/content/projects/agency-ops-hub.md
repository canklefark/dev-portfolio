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
summary: "Internal ops hub for the agency I work at: huddle board, task intake from Slack/Gmail/Granola, meeting-transcript extraction, and client/project dashboards. Replatformed off a Next.js/Vercel/Supabase app the team was outgrowing."
sub: "A full re-architecture onto SvelteKit and self-hosted Postgres on Dokploy, with 1,891 tests built alongside the code instead of deferred."
stats:
  - { label: "Tests", value: "~3,100", variant: "green" }
  - { label: "Commits", value: "1,356", variant: "default" }
  - { label: "Milestones shipped", value: "v1 – v2.3", variant: "default" }
draft: false
---

## The Problem

The agency's internal ops (huddles, task intake, project and client dashboards) ran on a Next.js/Supabase/Vercel app someone else on the team had built. It worked, but it was hitting real limits: a Supabase connection pooler capped at one connection forcing every DB call to run sequentially, 1000+ line monolithic files like the registry editor, over a hundred unsafe type casts around Slack block construction, and near-zero test coverage on the services everything else depended on.

## Approach

I re-architected it from scratch onto SvelteKit, self-hosted Postgres, and Dokploy: same feature set, materially better admin UX, and a real test suite from day one instead of backfilled later. v1 got it to feature parity and let the old stack get decommissioned. v2.0 layered in a consistent shadcn-svelte component system with dark mode, a people/clients data model, multi-source task intake (Slack, Gmail, Granola transcripts, in-app quick capture), a daily Slack check-in pipeline, and a rework of the huddle, person, project, and client dashboards. That was 33 plans, 409 files changed, roughly 86k lines added, shipped in five days.

## Current State

v2.0 through v2.3 have all shipped. Every pre-replatform pain point I set out to fix (the pooler bottleneck, the monolithic registry editor, the unsafe Slack type casts, the untested services) is gone by construction, not patched over. v2.3 ran a 16-screen design critique and fixed the cross-cutting UI/UX problems it found: unbounded lists forcing scroll, flat visual hierarchy, a couple of functional bugs, a missing confirmation gap, and weak discoverability, plus gave Home an actual cockpit view instead of a bare status widget.

Live human UAT on v2.3 then surfaced something bigger: the replatform had no in-app path to a project or client detail page at all, and a full content comparison against the original app it replaced showed the gap went well beyond navigation.

## What's Next

v2.4 closes the structural and content gaps between this app and the original MVP it replaced: a real Home/Mission-Control landing page, proper `/projects` and `/clients` list entry points, a "flag for discussion" step on the huddle board, and an operator-facing registry audit and job ledger. Verification for this milestone checks each screen directly against its counterpart in the original app, not just against a written spec.

## Stack

`SvelteKit` · `Svelte 5` · `TypeScript` · `PostgreSQL` · `Drizzle` · `Better Auth` · `Dokploy` · `shadcn-svelte`
