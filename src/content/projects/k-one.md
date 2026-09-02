---
date: "2025-03-01"
title: "K-One"
category: "Revenue Intelligence"
status: "LIVE"
statusVariant: "green"
surface: "ON-PREM / IIS + NODE"
timeLabel: "ACTIVE"
period: "Q1 2025 – present"
tags: ["SvelteKit", "SQL Server", "Entra ID", "IIS", "Azure Pipelines"]
summary: "Revenue intelligence and workflow platform for a ~$200M wholesale distributor — rebate detection, margin alerts, a sales performance playbook, and write workflows for invoice management, all from read-only SQL views."
sub: "Grew from a read-only reporting app into a full internal platform across Sales, Contracts, Operations, and Leadership, with admin-managed goal tracking and role-based write workflows."
stats:
  - { label: "Tests", value: "136", variant: "green" }
  - { label: "Commits", value: "1,800+", variant: "default" }
  - { label: "Auth", value: "Entra OIDC", variant: "default" }
  - { label: "Infra", value: "On-prem only", variant: "default" }
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

In production and still growing. What started as a read-only reporting dashboard is now a platform spanning Business Services, a Service Department module (extracted from Business Services as a shared, parameterized abstraction rather than duplicated), and a Sales Playbook with admin-managed quarterly goal bands, grade-ladder performance metrics, and a live-editable rep roster across four districts — all built on top of the original read-only, row-level-secured data layer. 136 tests, Entra auth fully live, write workflows for Low Lines invoice management shipped and in daily use.

## What's Next

Between shipped milestones there's no fixed backlog — the next piece of scope gets defined against whatever the business needs next, the same way the Sales Playbook and Service Department both started as single-milestone additions. Recent work has trended toward admin self-service: letting designated staff manage goal targets, capability grants, and roster changes themselves instead of routing every change through a code deploy.

## Stack

`SvelteKit` · `SQL Server` · `Entra ID` · `IIS` · `NSSM` · `Azure Pipelines` · `Chart.js` · `Tailwind`
