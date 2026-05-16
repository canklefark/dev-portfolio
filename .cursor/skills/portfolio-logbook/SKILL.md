---
name: portfolio-logbook
description: >-
  Creates Astro logbook Markdown entries for this portfolio: frontmatter schema,
  filename slug rules, and parity with scripts/log.sh. Use when the user wants a
  new logbook post, log entry, dev log, or content under src/content/logbook/.
disable-model-invocation: true
---

# Portfolio logbook entries

## Output location

Write new entries to `src/content/logbook/` at the repository root (workspace-relative path above).

## Frontmatter schema

Must satisfy `logbook` in `src/content.config.ts`:

| Field     | Type                  | Notes                                                                                         |
| --------- | --------------------- | --------------------------------------------------------------------------------------------- |
| `title`   | string                | Human-readable headline                                                                       |
| `date`    | string (ISO datetime) | Prefer `YYYY-MM-DDTHH:MM:SS` in local time, same style as existing files                      |
| `tags`    | string array          | Non-empty allowed; match house style (many entries use `SCREAMING_CASE` per `scripts/log.sh`) |
| `preview` | string                | One sentence for the index; end with `.`, `!`, or `?`                                         |
| `draft`   | boolean               | Default `false` for published posts                                                           |

## Filename

Pattern: `YYYY-MM-DD-<slug>.md` (same date prefix as `date`’s calendar day).

**Slug from title** (mirror `scripts/log.sh` when aligning with that workflow):

1. Lowercase the title.
2. Remove characters that are not letters, digits, or spaces.
3. Collapse consecutive spaces to a single space; replace spaces with `-`.
4. Take at most the first **7** hyphen-separated segments (equivalent to `cut -d'-' -f1-7`).
5. Strip a trailing `-` if present.
6. If a file already exists for that base name, append `-2`, `-3`, … before `.md` (collision avoidance).

## Body

Write the full article after the closing `---`. The `preview` is a one-line summary; the body should expand with detail, code blocks, and structure as needed. Do not leave the body empty.

## Optional: shell helper

`scripts/log.sh` defines a bash function `log` that writes an entry using a quick note string, optional `--tags "TAG1,TAG2"`, and optional `--title "..."`. It hardcodes `repo_root` to the author’s machine path; only use it when that path matches this checkout. Otherwise create the Markdown file directly in the workspace as above.

Example (when sourced from a compatible environment):

```bash
source scripts/log.sh
log --tags "KUBERNETES,FLUX" "Short note that becomes title and first body line"
```

## After writing

Run `npm run build` (or the project’s typecheck) if available to ensure Zod validation passes.
