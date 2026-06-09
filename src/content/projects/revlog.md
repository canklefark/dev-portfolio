---
# Source: vault:gh/cf/revlog-svelte | generated: 2026-06-09 | mode: NEW
# To approve: set draft: false and save in Obsidian, then run /portfolio-update --commit
date: "2026-06-09"
title: "Revlog"
category: "Personal Projects"
status: "IN PROGRESS"
statusVariant: "accent"
surface: "VPS / DOCKER"
timeLabel: "ACTIVE"
period: "Q2 2026"
tags:
  [
    "SvelteKit",
    "TypeScript",
    "PostgreSQL",
    "Drizzle",
    "Playwright",
    "Better Auth",
    "Docker",
    "Tailwind",
  ]
summary: "A motorsport logbook for tracking car builds, maintenance schedules, events, and performance data — built for time attack and track day drivers."
sub: "Full-stack SvelteKit app with Drizzle + PostgreSQL, Better Auth sessions, and telemetry import from VBO, RaceChrono, and generic CSV files. Ten phases shipped; human verification walkthrough surfaced 12 issues queued for Phase 11."
stats:
  - { label: "Commits", value: "343", variant: "default" }
  - { label: "Phases", value: "10 complete", variant: "green" }
  - { label: "E2E tests", value: "40+ passing", variant: "default" }
  - { label: "Issues found", value: "12 in walkthrough", variant: "default" }
draft: false
---

## The Problem

Track day drivers keep their maintenance logs in Notes, their event results in spreadsheets, their tire wear photos in Camera Roll, and their telemetry files in a folder no one can find. There's no app that connects a car's history to its race results to its pre-event checklist to its lap data. If you want to know whether your brake pads had enough life before the last event, you're digging through text messages.

## Approach

A SvelteKit app with a Drizzle + PostgreSQL backend, deployed via Docker to a VPS. Better Auth handles email/password sessions with a Google OAuth path. The data model links cars to maintenance entries, events, runs, checklists, and telemetry sessions. Telemetry files (VBO, RaceChrono CSV, generic CSV) are parsed in the browser with a column-mapping step before committing to the DB. Checklists are template-driven with a one-click AI generation option powered by the Claude API — the model generates a typed checklist from your car's spec.

The project uses GSD for planning: every phase has a research doc, validation strategy, and execution plan. Phases are verified against their requirements before closing.

## Current State

Ten phases complete across v1.0 and v1.1 milestones. Core features live: garage management, event and run tracking, maintenance log with soft-delete/trash, telemetry import with format parsers, pre-event readiness check, AI-generated checklists, admin tooling (bug reports, user allowlist, CSV data export), and a full E2E suite (40+ passing tests across garage, events, auth, telemetry, checklists, and admin). Phase 10 generated three verification documents — per-screen checklist, journey verification scripts, and a triage template — then a human walkthrough surfaced 12 issues: 3 P1 (Delete Forever 500 error, import blocked by missing carId assignment UI, penalty input labels missing), 4 P2, 4 P3, 1 Polish.

## What's Next

Phase 11 will triage and fix the 12 issues from the walkthrough, P1 bugs first: wiring the carId assignment into the event import page, fixing the Delete Forever 500, and labeling penalty inputs. After Phase 11: deployment to the beta subdomain, telemetry visualization (lap delta overlays, sector charts), and a sharing mode for publishing build specs.

## Stack

`SvelteKit` · `TypeScript` · `PostgreSQL` · `Drizzle` · `Better Auth` · `Vitest` · `Playwright` · `Docker` · `Tailwind`
