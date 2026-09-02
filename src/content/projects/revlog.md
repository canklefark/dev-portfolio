---
date: "2026-04-27"
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
  - { label: "Commits", value: "352", variant: "default" }
  - { label: "Phases", value: "9 of 12", variant: "default" }
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

v1.0 shipped in full: garage management, event and run tracking, maintenance log with soft-delete/trash, telemetry import with format parsers, pre-event readiness check, AI-generated checklists, and admin tooling (bug reports, user allowlist, CSV data export). Of v1.1's six verification phases, three are done — E2E coverage for garage/runs and events/auth/telemetry (40+ passing tests), and the Phase 10 human walkthrough, which surfaced 12 issues: 3 P1 (a Delete Forever 500 error, event import blocked by a missing carId assignment UI, missing penalty input labels), 4 P2, 4 P3, 1 Polish. None of those are fixed yet — work has been paused at the verification checkpoint since.

## What's Next

Phase 9 still needs E2E coverage for checklists, settings, and admin actions. Then Phase 11 triages and fixes the 12 issues from the walkthrough, P1s first, and Phase 12 is the launch gate — CI green, zero P0/P1, domain flipped to production.

## Stack

`SvelteKit` · `TypeScript` · `PostgreSQL` · `Drizzle` · `Better Auth` · `Vitest` · `Playwright` · `Docker` · `Tailwind`
