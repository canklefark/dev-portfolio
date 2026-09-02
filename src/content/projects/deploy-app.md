---
date: "2026-06-25"
title: "Deploy App"
category: "Developer Tools"
status: "LIVE"
statusVariant: "green"
surface: "CLAUDE CODE PLUGIN"
timeLabel: "ACTIVE"
period: "Q3 2026"
tags: ["Claude Code Plugin", "Cloudflare Pages", "Dokploy", "Bash"]
summary: "A Claude Code plugin that detects a project's type and deploys it to the right host — Cloudflare Pages for static sites, Dokploy for everything dynamic — with no flags needed for the common case."
sub: "Runs as a single bash skill with no build step: it reads a repo's own config files to decide static vs. dynamic, then talks to the Cloudflare or Dokploy API directly."
stats:
  - { label: "Version", value: "v1.5", variant: "default" }
  - { label: "Live-test scenarios", value: "3", variant: "green" }
  - { label: "Commits", value: "47", variant: "default" }
draft: false
---

## The Problem

Every new project at the agency ends the same way: figure out where it's supposed to live, then hand-run a slightly different deploy procedure depending on whether it's a static site or something with a server behind it. That's a repeatable decision, not a judgment call, and it kept costing a few minutes of manual API poking every time.

## Approach

`/deploy-app` reads a project's own config to decide: an `astro.config.*` or `adapter-static` means static and goes to Cloudflare Pages, GitHub-backed with auto-deploy on push; a `next.config.*`, or a SvelteKit app without `adapter-static`, means dynamic and goes to Dokploy, CLI preferred with an API fallback. Secrets are redeemed at runtime from the agency's secrets manager, never stored in the plugin itself. It's idempotent — every create call checks for an existing resource first — and a `--dry-run` flag previews exactly what it would do before it does anything.

## Current State

At v1.5, live-tested against three real scenarios: a fresh deploy, a deploy against a broken repo to confirm the error path, and a deploy with `--domain` to confirm custom-domain attachment. Two response-shape bugs found during that live test — a nested `project.create` response, an `items` key on `application.search` — are fixed and registered.

## What's Next

Closing the last audit items flagged by a codebase map review, then it's done — this isn't a project that needs to keep growing.

## Stack

`Bash` · `Claude Code Plugin` · `Cloudflare Pages API` · `Dokploy API` · `curl`
