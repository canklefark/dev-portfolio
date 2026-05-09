---
date: "2025-05-08"
title: "Dev Portfolio"
category: "Web Development"
status: "LIVE"
statusVariant: "green"
surface: "CLOUDFLARE PAGES"
timeLabel: "MAY 2025"
period: "Q2 2025"
tags: ["Astro", "TypeScript", "Cloudflare Pages", "GitHub"]
summary: "This site. Astro content collections, Swiss grid, Satoshi and IBM Plex Mono. Deployed to Cloudflare Pages from GitHub with a single push."
sub: "This site. Built with Astro 6, TypeScript strict mode, and a design system built from scratch. Content is Markdown; adding a post is a git commit. Deployed to Cloudflare Pages from GitHub."
stats:
  - { label: "Framework", value: "Astro 6", variant: "default" }
  - { label: "Deploy", value: "Cloudflare Pages", variant: "green" }
  - { label: "Content", value: "Git-native", variant: "default" }
  - { label: "TTD", value: "~45s", variant: "accent" }
---

## The Problem

Every portfolio template I found was either a generic dark-mode card grid or a marketing page with a hero section and a testimonials block. Neither of those reads as a DevOps engineer who cares about systems. I needed something that looked like it was built by the person using it.

## Design

The system is Swiss: a single 800px column ruled by 1px borders, two typefaces with non-overlapping jobs (Satoshi for everything readable, IBM Plex Mono for instrument data), and a single chromatic accent used exactly once per context. The motorsport reference lives in naming texture: stage numbers, logbook format, status labels. It never becomes a visual theme.

I built the design system from tokens up: OKLCH color values, semantic CSS variables, zero border-radius throughout. Light and dark mode are both first-class; neither is a fallback.

## Content Workflow

Content lives in Astro content collections: Markdown files with typed frontmatter, validated against a Zod schema at build time. Adding a logbook entry is creating a `.md` file, committing it, and pushing. No CMS login, no deploy dashboard. The push triggers a Cloudflare Pages build; the post is live in under a minute.

This site is also the first project I'm using as a live case study while I build it.

## Deployment

The repository is public at `canklefark/dev-portfolio` on GitHub. Cloudflare Pages connects directly to the repo and deploys on every push to `main`. Build command is `npm run build`; output is the `dist` directory. The custom domain is `dev.zeikcookson.com`. Cloudflare handles SSL and CDN automatically.

## Stack

`Astro 6` · `TypeScript` · `Cloudflare Pages` · `GitHub` · `Satoshi` · `IBM Plex Mono`
