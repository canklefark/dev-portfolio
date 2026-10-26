# Phase 2: Content Model and Import - Context

**Gathered:** 2026-10-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Every piece of editable content (13 projects, About, nav, site settings) lives in EmDash locally, in a schema that fits it, with a verified field-for-field match to the markdown sources. The public read path is NOT touched here (Phase 3); markdown stays the source of truth until the Phase 3 flip. No visual or copy changes.

</domain>

<decisions>
## Implementation Decisions

### Body format
- **D-01:** Project bodies are stored as Portable Text (EmDash native rich text), not raw markdown. The import converts markdown to blocks. Source bodies use only H2 headings, paragraphs, bold, inline code and a few links (no lists, tables, code fences, H3 or blockquotes), so the conversion surface is small. — **Reversibility:** costly — the field type and every stored body depend on it; switching means a data migration.
- **D-02:** The equality report checks body copy strictly: convert stored Portable Text back to markdown and diff against the source file, so headings, bold, inline code and link hrefs must all match exactly. Plain-text-only comparison is rejected because it would pass a dropped mark or broken href.

### About entry
- **D-03:** One `about` collection entry holds everything the About and home pages read from `src/data/about.*`: body copy (rich text), `role`, `show_availability`, and repeaters for cells (label, value, variant), stack (name, level) and contacts (icon, label, href). Settings stay limited to the fixed General, Social and SEO keys; contacts do not move into Social settings. — **Reversibility:** costly — Phase 3 rendering and the import both depend on this shape.
- **D-04:** Constrained values on the About entry are select fields: stack level (DAILY, PROFICIENT, FAMILIAR, LEARNING, NEXT), contact icon (email, github, linkedin), cell variant (default, accent, green). Mirrors the TS unions in `src/data/about.ts`.

### Project fields
- **D-05:** `category` is a select seeded with today's 9 values (Agency Tooling, Client Work, Developer Tools, Homelab Infrastructure, Observability, Personal Projects, Revenue Intelligence, Self-Hosted Services, Web Development). Adding a category is a schema edit, which the Phase 4 agent token cannot do; accepted.
- **D-06:** `project_status`, `surface`, `time_label` and `period` are free text strings (values are one-offs like "ON-PREM / IIS + NODE", "Q1 2025 – present"). `status_variant` is a select: accent, green, default.
- **D-07 (amended by the user on 2026-10-26, reason: the admin date picker):** `date` is a native EmDash `datetime` field, stored as midnight UTC (`YYYY-MM-DDT00:00:00Z`, which EmDash keeps as `YYYY-MM-DDT00:00:00.000Z`) converted from the exact source `YYYY-MM-DD` string. Sources that are not a real `YYYY-MM-DD` day are still rejected. The verifier converts the stored value back to its UTC calendar day and requires exact equality with the source string. The project list still sorts with explicit `orderBy` on `date` desc (EmDash defaults to created_at). This reverses the original wording (string field, native datetime rejected to avoid timezone drift); the drift risk is handled by pinning midnight UTC and relying on the default UTC site timezone.
- **D-08:** `summary` and `sub` are plain text fields, not rich text.
- **D-09:** Carried from Phase 1 and the roadmap, not re-asked: field slugs avoid reserved names (`project_status`, `status_variant`, `time_label`); tags are `multiSelect` with no options; stats are a per-project repeater (label, value, variant default/green/accent); `draft` becomes native draft status.

### Import and verification
- **D-10:** The import goes through EmDash's supported path (CLI/seed or content API), not direct SQLite writes, so validation, revisions and status handling match production. The researcher confirms the exact entry point. — **Reversibility:** reversible — the script is replaceable.
- **D-11:** Re-runs upsert by slug and overwrite fields. Markdown remains the source of truth until Phase 3, so edits made in markdown resync on re-run; admin edits to imported entries are overwritten before cutover (accepted). Result after any run: exactly 13 projects, one About entry, no duplicates, drafts still drafts.
- **D-12:** Scripts live in `scripts/` next to the existing parity tooling (for example `import-content.mjs` and `verify-import.mjs`). The equality report prints to stdout, writes a per-field JSON report under `~/portfolio-baseline/` (outside the repo, not committed), and exits non-zero on any difference. It covers copy, dates, order, tags, stats and status.
- **D-13:** Commit a seed file exported from the final schema and content plus the generated types (`.emdash/types.ts`, not ignored per Phase 1 gate l). Verify a fresh local database rebuilds the same schema and content from the seed. The seed is a snapshot regenerated at Phase 2 close, because Phase 3 deletes the markdown that the import reads.

### Defaults (not discussed, Claude's discretion)
- **D-14:** Primary nav menu is Home, Projects, About, mirroring `src/components/Nav.astro`; General, Social and SEO settings are seeded from current layout values. The researcher confirms the exact EmDash setting keys.

### Claude's Discretion
- Exact EmDash import entry point (CLI vs seed vs API), script structure, and the Portable Text block mapping details.
- Field naming for About repeaters and the About collection slug, within the non-reserved-slug rule.
- Admin UX details for the long-body test entry (success criterion 1).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/PROJECT.md` — Spike Findings (confirmed API names, tensions for tags and stats placement, named gates, recovery notes)
- `.planning/REQUIREMENTS.md` — SCHEMA-01 to SCHEMA-05, MIGR-01 to MIGR-04
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria
- `.planning/STATE.md` — blockers (home page reads `showAvailability`; markdown edits before Phase 3 need an import re-run; ask before starting astro dev/preview)
- `.planning/phases/01-spike-baseline-and-decisions/01-CONTEXT.md` — hosting, branch and Node decisions

### Research
- `.planning/research/SUMMARY.md` — cross-file tensions and phase order
- `.planning/research/STACK.md` — versions, peers
- `.planning/research/PITFALLS.md` — migration drift, reserved field slugs
- `.planning/research/ARCHITECTURE.md` — data adapter seam (`src/lib/projects.ts`)

### Source content and schema being mirrored
- `src/content.config.ts` — current projects zod schema (field names, enums, defaults)
- `src/content/projects/*.md` — the 13 source files (frontmatter plus body)
- `src/data/about.ts` and `src/data/about.md` — About role, availability flag, cells, stack, contacts and copy
- `src/lib/projects.ts` — current read adapter (sort newest first, drafts excluded)
- `src/components/Nav.astro` — nav link source for the primary menu

### Project standards
- `CLAUDE.md`, `DESIGN.md`, `PRODUCT.md` — copy rules (no em dashes, natural prose); no visual changes
- `scripts/script-allowlist.json` and `~/portfolio-baseline/` — Phase 1 parity tooling and baseline

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/` parity tooling (script inventory, allowlist) from Phase 1: place the import and verify scripts alongside.
- `astro.config.mjs` already wires `emdash({ sqlite, local })` on the Node standalone adapter; `src/live.config.ts` registers `emdashLoader`.
- Branch `emdash-migration` holds all work; `.emdash/types.ts` is committable.

### Established Patterns
- Content today: Astro glob collection (`src/content.config.ts`) for projects, plain TS module for About. Page props and sort order must stay identical when Phase 3 rewires.
- `data/` directory must exist before EmDash opens SQLite (Phase 1 finding).

### Integration Points
- Phase 3 will replace `src/lib/projects.ts` and `src/data/about.*` consumers; the Phase 2 schema field names are what that adapter maps from.
- Home page reads `showAvailability` from the About data; the About entry must carry it.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decisions above. Open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

- Page titles with em dash separators (parity keeps them; copy decision is separate) — carried from earlier phases.
- Tag taxonomies with archive routes (v2 CONT-02) and homepage hero as editable singleton (v2 CONT-04) — already in v2 requirements.
- Searchable tags widget via an EmDash plugin field widget (field.widget = pluginId:widgetName); storage stays string[], so non-breaking. The user locked the multiSelect checkboxes (1a) on 2026-10-26.

</deferred>

---

*Phase: 2-Content Model and Import*
*Context gathered: 2026-10-26*
