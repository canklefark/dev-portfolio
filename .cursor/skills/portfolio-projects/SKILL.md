---
name: portfolio-projects
description: >-
  Creates or updates Astro project cards for this portfolio: frontmatter schema,
  stats line format, and Markdown section conventions under
  src/content/projects/. Use when the user wants a new project post, portfolio
  project entry, or project case study.
disable-model-invocation: true
---

# Portfolio project entries

## Output location

Write new projects to `src/content/projects/<slug>.md`. Use a short **kebab-case** slug (e.g. `my-service-mesh.md`), not the calendar date prefix used by logbook files.

## Frontmatter schema

Must satisfy `projects` in `src/content.config.ts`:

| Field           | Type                                   | Notes                                                                         |
| --------------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| `date`          | string                                 | `YYYY-MM-DD`; used for sort order (newest first)                              |
| `title`         | string                                 | Display name                                                                  |
| `category`      | string                                 | Short grouping label                                                          |
| `status`        | string                                 | e.g. `LIVE`, `IN PROGRESS`, `PLANNED` — match tone of existing entries        |
| `statusVariant` | `"accent"` \| `"green"` \| `"default"` | `accent` = in progress (amber); `green` = shipped / live; `default` = neutral |
| `surface`       | string                                 | Where it runs (often `SCREAMING_CASE` short label)                            |
| `timeLabel`     | string                                 | e.g. `ACTIVE`, `MAY 2025`                                                     |
| `period`        | string                                 | e.g. `Q2 2025`                                                                |
| `tags`          | string array                           | Technologies / themes                                                         |
| `summary`       | string                                 | One sentence for the project **card**                                         |
| `sub`           | string                                 | **Two sentences** for the detail page header                                  |
| `stats`         | array of objects                       | Each: `label`, `value`, optional `variant` (`default` \| `green` \| `accent`) |
| `draft`         | boolean                                | Default `false`                                                               |

Use YAML flow style for `stats` rows to match existing files:

```yaml
stats:
  - { label: "Framework", value: "Astro 6", variant: "default" }
  - { label: "Deploy", value: "Cloudflare Pages", variant: "green" }
```

## Body sections

Follow the structure in `CLAUDE.md` unless the user specifies otherwise:

1. `## The Problem`
2. `## Approach` (some shipped projects use `## Design` instead — pick whichever fits)
3. `## Current State`
4. `## What's Next` (omit only if truly N/A)
5. `## Stack`

End **Stack** with backtick tokens separated by middle dots, e.g.

```markdown
## Stack

`Astro 6` · `TypeScript` · `Cloudflare Pages`
```

Keep prose in sentence case; use labels / surface in the style of neighboring project files.

## Ordering

Projects sort by `date` descending. New projects should use today’s or the user-supplied ship/milestone date so they appear in the intended position.

## After writing

Run `npm run build` to confirm Zod validation passes.
