---
date: "2024-07-01"
title: "Self-Hosted Services"
category: "Self-Hosted Services"
status: "RUNNING"
statusVariant: "green"
surface: "BARE METAL"
timeLabel: "ONGOING"
period: "Q3 2024"
tags: ["Docker Compose", "Immich", "Mealie", "Ollama", "Paperless-ngx"]
summary: "A Beelink mini PC running Docker Compose: Immich, Mealie, Ollama, Paperless-ngx, Glance, Dockhand."
sub: "A Beelink mini PC running Docker Compose. Photos, recipes, local LLMs, and document management. All running on hardware I own."
stats:
  - { label: "Host", value: "Beelink", variant: "default" }
  - { label: "Runtime", value: "Docker Compose", variant: "default" }
  - { label: "Services", value: "6 running", variant: "green" }
  - { label: "Storage", value: "Local", variant: "default" }
paceNote: "NOTE: IMMICH NEEDS REAL STORAGE PLAN / PAPERLESS OCR IS CPU-HEAVY / GLANCE DASHBOARD IS WORTH IT"
---

## What's Running

`Immich` for photo management and backup. It's the main reason this machine exists. `Mealie` for recipe organization. `Ollama` for running local LLMs without API costs. `Paperless-ngx` for document management with OCR. `Glance` as a homelab dashboard. `Dockhand` for automated container updates.

## Why Self-Host

Mostly because I can. Google Photos has storage limits and recipe apps tend to disappear when the company folds. Running services myself is how I learn the stack.

## What's Next

These will migrate to the K8s cluster as Flux stabilizes. The Beelink becomes a fallback Docker host once the cluster can take the workloads.

## Stack

`Docker Compose` · `Immich` · `Mealie` · `Ollama` · `Paperless-ngx` · `Glance` · `Dockhand`
