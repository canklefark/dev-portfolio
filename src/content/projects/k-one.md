---
date: "2025-03-01"
title: "K-One"
category: "Revenue Intelligence"
status: "IN PROGRESS"
statusVariant: "accent"
surface: "ON-PREM / IIS + NODE"
timeLabel: "ACTIVE"
period: "Q1–Q2 2025"
tags: ["SvelteKit", "SQL Server", "Entra ID", "IIS", "Azure Pipelines"]
summary: "Revenue intelligence app for a ~$200M wholesale distributor, surfacing rebate gaps, margin alerts, and renewal queues from read-only SQL views."
sub: "SvelteKit app on Windows Server, surfacing rebate gaps, margin alerts, and renewal queues from read-only SQL views."
stats:
  - { label: "Roles", value: "5 tiers", variant: "default" }
  - { label: "Auth", value: "Entra OIDC", variant: "default" }
  - { label: "Infra", value: "On-prem only", variant: "green" }
  - { label: "Goal", value: "~$5M/yr saved", variant: "accent" }
---

## The Problem

The client had an ERP and a pile of Excel reports. Margin erosion, missed rebate opportunities, and expiring contracts all lived in queries someone had to remember to run. Sales reps couldn't see how their pricing compared to peers without asking. Operations found out about cost changes after they'd already shipped at the old margin. The data existed; nothing surfaced it.

## Approach

I built K-One as a read-only SvelteKit app sitting on top of a separate SQL reporting database (a read-only copy maintained by their IT team, never touching the live ERP). SvelteKit because the app needed SSR for auth-gated pages plus static rendering for dashboards, and I wanted one Node process doing both. Tailwind because their design needs were specific and I didn't want to fight a component library. Chart.js because it renders fine in Svelte without dragging in a framework.

## Key Decisions

**Read-only by contract.** No writes anywhere. The SQL service account only has SELECT on the reporting views. Removes a whole class of risk and made IT comfortable signing off.

**Entra OIDC, not IIS Windows Auth.** IIS is a dumb reverse proxy. All auth runs in Node via openid-client v6 with PKCE. AES-256-GCM encrypted session cookies, 8h sliding TTL. Group GUIDs from the ID token map to roles in a config file.

**Row-level security in the query layer.** Sales reps get filtered automatically based on their identity, resolved at query time. No filtering in the UI: that's a footgun.

**Parameterized queries only.** All view names are imported from one config file so they can't be hardcoded or interpolated elsewhere. The code is structured to make breaking this harder than following it.

**CI/CD to a self-hosted agent.** Push to main triggers a build on a cloud agent, then deploys to the test box via NSSM service stop/start. The prod stage is wired but disabled until the prod box is provisioned.

## Current State

Test server is up with the first two dashboards live. Several additional data views are pending from the client's IT team, which will unlock the remaining hubs. Auth integration is in progress while the Entra App Registration is being provisioned. A systematic security review has been completed and findings are being worked through in priority order.

## What's Next

1. Complete Entra auth integration on the test environment.
2. Get the remaining views from IT to unlock the Operations hub and contract analytics.
3. Work through the security review findings, priority order.
4. Phase 2: Anthropic-powered margin explanations and contract PDF parsing, both degrading gracefully if the API is down.
5. Provision prod and enable the deploy stage.

## Stack

`SvelteKit` · `SQL Server` · `Entra ID` · `IIS` · `NSSM` · `Azure Pipelines` · `Chart.js` · `Tailwind`
