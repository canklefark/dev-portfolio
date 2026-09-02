---
date: "2026-06-12"
title: "Plugin Marketplace"
category: "Developer Tools"
status: "LIVE"
statusVariant: "green"
surface: "CLAUDE CODE MARKETPLACE"
timeLabel: "ACTIVE"
period: "Q3 2026"
tags: ["Claude Code Plugin", "Agent Skills", "Marketplace"]
summary: "A Claude Code plugin marketplace for the agency I work at — one repo so the team installs internal tools from a shared source instead of copying files by hand."
sub: "Five vendored plugins covering project scaffolding, client site builds, branded reporting, local-business prospecting, and deployment, installable org-wide via managed settings."
stats:
  - { label: "Plugins", value: "5", variant: "default" }
  - { label: "Commits", value: "31", variant: "default" }
draft: false
---

## The Problem

I kept building useful Claude Code skills for agency work — scaffolding, deploys, reporting — and the only way teammates got them was copying files by hand or asking me directly. That doesn't scale past one person, and it means the tools drift out of sync the moment someone's copy falls behind.

## Approach

A single marketplace repo vendors five plugins: a project scaffolder that clones the agency's boilerplate repo for a new SvelteKit or Astro project, an 8-stage pipeline that builds and deploys client brochure sites to Cloudflare Pages, a reporting tool that pulls branded performance reports from Windsor.ai (GA4, Meta Ads, Google Ads) and publishes them to a reporting subdomain, a local-business prospecting pipeline that generates print-ready collateral, and the deploy tool itself. Teammates add the marketplace once and install what they need; admins can push it org-wide through Claude Code's managed settings so it's enabled for everyone automatically.

## Current State

All five plugins are vendored and marked stable. The skills follow the open Agent Skills standard, so nothing here is locked to Claude specifically if that ever matters.

## What's Next

Adding plugins as they prove out elsewhere first — this repo is meant to stay a thin distribution layer, not where new tools get built from scratch.

## Stack

`Claude Code Plugins` · `Agent Skills` · `Bash`
