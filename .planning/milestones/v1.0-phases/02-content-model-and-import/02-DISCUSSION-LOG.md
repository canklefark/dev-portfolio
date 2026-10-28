# Phase 2: Content Model and Import - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-26
**Phase:** 2-Content Model and Import
**Areas discussed:** Body format conversion, About entry shape, Project field types, Import and equality report

---

## Body format conversion

| Option | Description | Selected |
|--------|-------------|----------|
| Portable Text | Native rich text, admin editor, converted by import | ✓ |
| Raw markdown string | Verbatim, plain textarea in admin | |

| Option | Description | Selected |
|--------|-------------|----------|
| Normalized plain text + marks | Round-trip to markdown and diff | ✓ |
| Plain text only | Visible text only | |

**User's choice:** Portable Text; strict round-trip comparison.

## About entry shape

| Option | Description | Selected |
|--------|-------------|----------|
| One `about` collection entry | Body, role, availability, repeaters | ✓ |
| About entry + contacts in settings | Contacts in Social keys | |

| Option | Description | Selected |
|--------|-------------|----------|
| Select fields with fixed options | Stack level, contact icon, cell variant | ✓ |
| Free text strings | Flexible, typo-prone | |

**User's choice:** Single entry; select fields for enums.

## Project field types

| Option | Description | Selected |
|--------|-------------|----------|
| category: select with 9 values | Fixed list | ✓ |
| category: free text | Matches today | |
| status/surface/timeLabel/period free text, statusVariant select | | ✓ |
| status also select | | |
| date: YYYY-MM-DD string | | ✓ |
| date: native datetime | | |
| summary/sub: plain text | | ✓ |
| summary/sub: rich text | | |

**User's choice:** All recommended options.

## Import and equality report

| Option | Description | Selected |
|--------|-------------|----------|
| EmDash CLI/seed API | Supported path | ✓ |
| Direct SQLite writes | Bypasses validation | |
| Upsert by slug, overwrite | | ✓ |
| Create-only, skip existing | | |
| scripts/ + stdout and JSON file outside repo | | ✓ |
| scripts/ + committed report | | |
| Commit seed.json + generated types | | ✓ |
| Seed schema only | | |

**User's choice:** All recommended options.

## Claude's Discretion

Exact import entry point, About repeater field naming, nav and settings seeding defaults (Home, Projects, About).

## Deferred Ideas

- Em dash page titles (separate copy decision)
- v2 CONT-02, CONT-04
