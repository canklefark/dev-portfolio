---
date: "2025-02-01"
title: "Catalog CMS"
category: "Client Work"
status: "IN PRODUCTION"
statusVariant: "green"
surface: "DOCKER / DOKPLOY VPS"
timeLabel: "ACTIVE"
period: "Q1 2025 →"
tags: ["SvelteKit", "SQLite", "Drizzle", "Cloudflare R2", "Docker", "WordPress"]
summary: "Internal CMS for a B2B cleaning products company — manages their full product catalog and syncs it to their WordPress site."
sub: "SvelteKit 2 app backed by SQLite, deployed in Docker on a Dokploy VPS, with async product/FAQ sync to a WordPress REST + ACF backend."
stats:
  - { label: "Products", value: "~200", variant: "default" }
  - { label: "DB tables", value: "15", variant: "default" }
  - { label: "Storage", value: "SQLite + R2", variant: "green" }
  - { label: "Commits", value: "111", variant: "default" }
draft: false
---

## The Problem

I was building a WordPress site for a B2B cleaning products company when I realized how they wanted to organize their catalog was going to be a constant maintenance problem. Product data — SDS PDFs, photos, ingredient disclosures, dilution ratios, certifications — all lived in spreadsheets, and any change meant an email to me. I built them a CMS so they could own their catalog and I could stop being the bottleneck.

There was also a modeling quirk baked into their business: products in their dispensing system share a product number across package sizes and categories. Standard product management tools model SKUs as unique identifiers. This one doesn't.

## Approach

I built a server-rendered SvelteKit 2 app with Svelte 5 runes — it's a form-heavy internal tool, and runes are genuinely nicer than stores for that pattern. SQLite + Drizzle because there's one deployment target, one writer at a time, and I didn't want to manage a Postgres server for light internal traffic.

File storage is abstracted behind a `getStorage()` factory: `LocalStorageProvider` in dev, `R2StorageProvider` in prod gated on `R2_ACCOUNT_ID` — swapping environments without branching on `NODE_ENV`.

Auth is better-auth with email/password and password reset via Resend, rate limiting on the login endpoint, and an audit log on every write operation.

## The Hard Part

The dispensing system quirk meant a single SKU maps to multiple database rows — one per (category, package size) combination. That's fine for display, but it broke document management: SDS PDFs, literature sheets, and ingredient disclosures get bookmarked directly by end users. If replacing a document generates a new URL, every existing bookmark 404s.

The fix was to assign each item its own internal opaque ID — not the SKU, not surfaced anywhere in the UI — and key all R2 file paths on that ID. When a document is replaced, it writes to the same path. Bookmarks stay valid. The ID is meaningless to users and load-bearing to the storage layer.

## WordPress Sync

Products and FAQs sync to a WordPress site with custom post types, ACF field groups, and several custom taxonomies (categories, industries, placements, certifications). I built an async queue (`wp_sync_queue` table) processed server-side on a periodic trigger — each item gets retries with exponential backoff, and a hash of the serialized payload prevents redundant syncs. FAQs support internal product links that resolve to WP permalinks at sync time. Dead-lettered items expose a reset-failed action so nothing blocks silently.

## Current State

Running in production on Dokploy (Docker + Traefik), SQLite volume-mounted at `/app/data`. Core catalog CRUD is stable. The WP sync is functional — it went through several debugging rounds and now has dead-letter recovery in place.

Built with Claude Code as the primary implementation tool. I owned the architecture decisions, Dokploy/Docker deployment, and the WordPress site it integrates with.

## Stack

`SvelteKit 2` · `Svelte 5` · `SQLite` · `Drizzle` · `Cloudflare R2` · `better-auth` · `Resend` · `Docker` · `Dokploy` · `Traefik` · `WordPress REST` · `ACF`
