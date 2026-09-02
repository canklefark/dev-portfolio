---
date: "2026-08-05"
title: "Throughline Pricing"
category: "Agency Tooling"
status: "LIVE"
statusVariant: "green"
surface: "POSTGRES / MCP"
timeLabel: "ACTIVE"
period: "Q3 2026"
tags: ["SvelteKit", "PostgreSQL", "MCP", "Puppeteer", "Google Workspace SSO"]
summary: "A pricing and invoicing app with an MCP interface so Claude can read and write pricing data directly during pricing conversations — every total is server-computed, never hand-typed."
sub: "A 24-tool MCP surface covering rate cards, tickets, bundling, and flags, backed by an append-only price-history log and ending in a frozen, client-ready invoice PDF."
stats:
  - { label: "MCP tools", value: "24", variant: "green" }
  - { label: "Commits", value: "601", variant: "default" }
  - { label: "Audit findings closed", value: "17/17", variant: "green" }
draft: false
---

## The Problem

Pricing conversations at the agency happened in my head and across scattered docs — tier decisions, bundling, flat-quote reasoning, all judgment calls that ended in a number someone typed into an invoice by hand. Nothing forced the invoice to match the reasoning that produced it, and there was no single place holding the authoritative total.

## Approach

I built a Postgres-backed app that owns every number a pricing conversation produces, with a 24-tool MCP interface so Claude can read and write pricing data directly while we're actually having the conversation. Claude does the judgment work — tier, bundling, value-based scoping — and the app owns every number that results, through to a frozen invoice PDF. No MCP tool accepts a raw total; everything is server-computed from tickets and line items. Rate cards are versioned and never edited in place. Tickets carry a lifecycle — standalone, bundled, or superseded — mutually exclusive by a guard the schema enforces. Flags block a batch from going out while anything's unresolved. Operators sign in with Google Workspace SSO restricted to the agency's own domain.

## Current State

v1.0 through v1.2 have all shipped. v1.1 rebuilt navigation and cross-linking between clients, batches, tickets, and invoices so nothing requires a remembered URL. v1.2 added OS-aware dark mode, fully responsive data tables, and closed a 17-finding UI/UX audit with zero P0/P1 remaining.

## What's Next

No active milestone right now — v1.2's audit closeout was the last phase queued. Next scope gets defined when I need it.

## Stack

`SvelteKit` · `PostgreSQL` · `MCP` · `Puppeteer` · `Google Workspace SSO`
