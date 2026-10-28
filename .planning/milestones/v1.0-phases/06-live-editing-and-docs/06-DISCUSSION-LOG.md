# Phase 6: Live Editing and Docs - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-10-28
**Phase:** 6-Live Editing and Docs
**Areas discussed:** Live edit exercise, Preview link, README rewrite, CLAUDE.md/skill/stale docs

---

## Live edit exercise

| Option | Description | Selected |
|--------|-------------|----------|
| Throwaway tweak, revert | Small field on an existing published card, publish, restore | ✓ |
| Real content update | Ship and keep a copy improvement | |
| Throwaway new card | Create, run loop, delete | |

**User's choice:** Throwaway tweak, revert. Driver: both (admin by hand, plus one Claude MCP draft the user publishes).

---

## Preview link

| Option | Description | Selected |
|--------|-------------|----------|
| Record as finding, no custom code | Failure is evidence, user decides follow-up | ✓ |
| Fix config only | Config/env/proxy fixes | |
| Build a minimal preview route | Custom route | |

**User's choice:** Record as finding. Verification: private window, default expiry.

---

## README rewrite

**User's choice:** Full short replacement; agent access OAuth only; rollback as written in DOCS-02, linking evidence.

---

## CLAUDE.md, skill, stale docs

| Option | Selected |
|--------|----------|
| Skill: flag obsolete (recommended) | |
| Skill: rewrite | |
| Skill: disable | |
| Skill: delete (user free text) | ✓ |

**User's choice:** Delete the portfolio-update skill; delete `scripts/log.sh` and `docs/friend-portfolio-intake.md`; no CI guard (one-time sweep); CLAUDE.md surgical edits.
**Notes:** Pre-write check found no references to log.sh or the intake doc in package.json, CI, CLAUDE.md or shell rc files.

---

## Claude's Discretion

Evidence file name and layout, test card and field, wording of doc additions.

## Deferred Ideas

EmDash-based portfolio-update replacement; custom preview route; CI stale-reference guard.
