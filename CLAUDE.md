# Portfolio — Engineering Standards

## Stack

Astro 6, TypeScript strict mode, no UI framework. Content via Astro content collections. Deployed to Cloudflare Pages from `main`.

## Content

### Adding a logbook entry

Create a file in `src/content/logbook/` named `YYYY-MM-DD-slug.md`:

```md
---
title: "Post title"
date: "2025-05-08"
tags: ["tag1", "tag2"]
preview: "One sentence shown on the index page."
draft: false
---

Body content here.
```

### Adding a project

Create a file in `src/content/projects/` named `project-slug.md`:

```md
---
date: "2025-05-08"
title: "Project Name"
category: "Category"
status: "IN PROGRESS"
statusVariant: accent # accent (amber) | green | default
surface: "WHERE IT RUNS"
timeLabel: "ACTIVE"
period: "Q2 2025"
tags: ["Tag1", "Tag2"]
summary: "One sentence for the project card."
sub: "Two sentences for the detail page header."
stats:
  - { label: "Label", value: "Value", variant: "default" }
draft: false
---

## The Problem

## Approach

## Current State

## What's Next

## Stack

`Tool` · `Tool` · `Tool`
```

Projects sort newest first by `date`. `statusVariant: accent` is amber (in progress), `green` is shipped/running, `default` is plain.

## Code Rules

- TypeScript strict — no `any`
- No client-side JS unless there's no server-side alternative
- No inline styles except for CSS custom property overrides (`style="--var: value"`)
- All SQL queries parameterized, view names imported from config — never interpolated

## Design System

Two typefaces: Satoshi (all non-code text) and IBM Plex Mono (labels, timestamps, nav, code). Both self-hosted in `public/fonts/`.

Single accent color — Pit Lane Amber (`oklch(74% 0.17 75)`). Use it for active states and CTAs only. Never decorative. See `DESIGN.md` for the full token set.

Zero border-radius throughout. No card shadows at rest.

## Deployment

Push to `main` triggers a Cloudflare Pages build. Build command: `npm run build`. Output: `dist/`. Node version: 22.
