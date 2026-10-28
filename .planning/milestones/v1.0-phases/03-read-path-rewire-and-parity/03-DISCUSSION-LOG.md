# Phase 3: Read Path Rewire and Parity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md. This log preserves the alternatives considered.

**Date:** 2026-10-26
**Phase:** 3-Read Path Rewire and Parity
**Areas discussed:** Tag order parity, Head and copy boundary, Import tooling fate, Public-JS CI guard

---

## Tag order parity

| Option | Description | Selected |
|--------|-------------|----------|
| Restore source order | Per-entry order carrier so cards match today exactly | |
| Accept term order | EmDash default; 12 of 13 cards differ | ✓ |
| Reorder terms globally | Set term sort_order to match most cards | |

**User's choice:** "emdash default is fine"
**Notes:** Follow-up on parity comparison: compare tags as a set (selected) over re-baselining or Claude's choice.

---

## Head and copy boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Settings + per-page templates | Titles assembled in templates from settings | |
| All titles and descriptions from EmDash | Editable SEO everywhere | |
| Use EmDashHead | Let emdash/ui emit SEO tags | |

**User's choice:** Free text: "emdash has integrated seo and we should use that" (interpreted as the per-collection hasSeo panel; EmDashHead use left to the researcher to verify against parity).
**Notes:** Template copy question: user chose "Move both" (home hero bio and About h1 into EmDash), pulling part of v2 CONT-04 forward. Placement question: new `home` and `projects_index` singletons plus an About h1 field (selected) over one `pages` collection or settings keys. Flagged to the user as a scope expansion.

---

## Import tooling fate

| Option | Description | Selected |
|--------|-------------|----------|
| Delete them | Importer, verifier, sources, fixtures and tests removed; seed is the rebuild path | ✓ |
| Keep, rebase onto seed | Retain a verifier against seed or live DB | |
| Tag and archive | Git tag then delete | |

**User's choice:** Delete them.
**Notes:** Seed update path: "Change in admin, re-export" (over edit seed.json and reseed, or Claude's choice). Fresh-DB rebuild from the committed seed must still be proven.

---

## Public-JS CI guard

| Option | Description | Selected |
|--------|-------------|----------|
| npm script + GitHub Actions | check:public-js plus a workflow | ✓ |
| npm script only | Local check | |
| Fold into the build | postbuild step | |

**User's choice:** npm script + GitHub Actions.
**Notes:** Proof and coverage: self-test fixture plus all 17 routes (selected) over a temporary failing commit or both.

---

## Claude's Discretion

- Rendering mode and caching, PortableText styling wiring, 404 mechanism, parity method, fate of the emdashLoader live collection, home and projects_index field shapes, Cloudflare Pages interaction while on the branch.

## Deferred Ideas

- Em dash title separators, tag archive routes, per-entry tag order carrier, further CONT-04 singletons.
