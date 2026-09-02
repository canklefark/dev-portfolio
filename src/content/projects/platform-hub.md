---
date: "2026-08-27"
title: "Hub"
category: "Agency Tooling"
status: "IN PROGRESS"
statusVariant: "accent"
surface: "DOKPLOY / SELF-HOSTED POSTGRES"
timeLabel: "ACTIVE"
period: "Q3 2026"
tags:
  [
    "SvelteKit",
    "PostgreSQL",
    "Turborepo",
    "Better Auth",
    "Docker",
    "Cron Workers",
  ]
summary: "A monorepo platform that gives every new internal tool a cheap, predetermined home instead of its own throwaway repo — one app, one Postgres, shared auth, and a written contract a module must satisfy to join."
sub: "Built to stop internal tools from sprawling into a pile of one-off repos, each hand-rolling the same auth, cron, and integration plumbing. First absorption in progress now, proving the contract end to end."
stats:
  - { label: "Commits", value: "323", variant: "default" }
  - { label: "Phases shipped", value: "4 of 5", variant: "default" }
  - { label: "Modules absorbed", value: "1", variant: "green" }
draft: false
---

## The Problem

The agency had accumulated close to twenty separate internal repos, each one somebody's MVP that got handed off to be made production-worthy. Nearly every one of them hand-rolled the same Google SSO and session spine, the same OAuth setup for ad platforms, the same API-key plumbing — duplicated, drifting, and individually maintained. Rebuilding each one from scratch into something solid was a full manual effort every time.

## Approach

Instead of rebuilding tools one at a time, I built a platform for absorbing them: one SvelteKit app, one canonical Postgres schema, shared packages for auth, UI, integrations, and storage, and a written module contract that any absorbed tool has to satisfy — schema-per-module, route-group registration, a nav/permission manifest entry, and clean deletability if the module is ever abandoned. Cron and background work run as independently deployable workers behind Ofelia, so a bad deploy in one worker can't take down the rest. The build order was deliberately cheapest-first: scaffold the target repo shape, harvest the abandoned-but-hardened `eos` codebase straight into the canonical database as an early, low-risk value capture, stand up the shared auth and UI shell every future module inherits, and harden the ops backbone before spending real effort on a first real absorption.

## Current State

Four of five phases are shipped: the monorepo scaffold, the database foundation seeded from `eos`, the shared auth and UI shell, and the ops backbone with cron workers, rehearsed Postgres backups, and R2 object storage. The fifth phase — absorbing an existing proposals tool by hand as the platform's first real module — is in progress now, and it's the one that actually proves the contract holds up outside of theory.

## What's Next

Finishing the proposals absorption and measuring how long it took end to end — the target is under a week, and if it isn't, the contract gets fixed before anything else gets absorbed. After that, several more internal tools are queued for future absorption waves, but each one waits until the pattern is proven, not assumed.

## Stack

`SvelteKit` · `PostgreSQL` · `Turborepo` · `Better Auth` · `Docker` · `Ofelia` · `Cloudflare R2`
