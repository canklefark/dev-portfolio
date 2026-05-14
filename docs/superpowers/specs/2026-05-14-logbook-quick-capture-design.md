# Logbook Quick Capture

Shell function for adding logbook entries from the terminal in one command.

## Problem

Logbook entries are meant to be tweet-sized working notes, but creating one requires opening an editor, writing YAML frontmatter, naming the file correctly, and placing it in the right directory. The ceremony kills the impulse to capture.

## Solution

A `log` shell function that takes a note as a string and produces a complete logbook markdown file in `src/content/logbook/`.

## Interface

```bash
# Minimal — just the note
log "Added Flux to k3s, had to annotate existing workloads first"

# With optional tags
log --tags "K3S,FLUX" "Added Flux to k3s"

# With optional title override
log --title "Flux on a live cluster" "Added Flux to k3s"

# Both
log --tags "K3S,FLUX" --title "Flux on a live cluster" "The note body"

# No arguments prints usage
log
```

- The note is always the last positional argument.
- `--tags` accepts a comma-separated list. Values are auto-uppercased to match existing convention.
- `--title` overrides the auto-generated title.
- No `--date` flag — always uses current timestamp.

## Auto-Generated Fields

When only the note is provided:

| Field     | Source                                                               |
| --------- | -------------------------------------------------------------------- |
| `title`   | Full note text (truncated at ~60 chars on a word boundary if needed) |
| `date`    | Current ISO 8601 timestamp (`YYYY-MM-DDTHH:MM:SS`)                   |
| `tags`    | Empty array `[]`                                                     |
| `preview` | Full note text, with a period appended if missing                    |
| `draft`   | `false`                                                              |
| Filename  | `YYYY-MM-DD-slugified-title.md` (slug capped at ~6 words)            |
| Body      | Full note text, with a period appended if missing                    |

## File Output

Given `log "Added Flux to k3s, had to annotate existing workloads first"`, produces `src/content/logbook/2026-05-14-added-flux-to-k3s-had-to-annotate.md`:

```md
---
title: "Added Flux to k3s, had to annotate existing workloads first"
date: "2026-05-14T16:32:00"
tags: []
preview: "Added Flux to k3s, had to annotate existing workloads first."
draft: false
---

Added Flux to k3s, had to annotate existing workloads first.
```

## Slug Rules

- Lowercase, alphanumeric and hyphens only.
- Punctuation stripped, multiple hyphens collapsed.
- Capped at ~6 words to keep filenames reasonable.
- If the filename already exists, appends `-2`, `-3`, etc.

## Title in Frontmatter

Always double-quoted to safely handle colons and special characters.

## Script Location and Installation

Script lives at `scripts/log.sh` in the repo. Exports a `log` shell function.

Add to `~/.zshrc`:

```bash
source ~/workspace/github.com/canklefark/portfolio/scripts/log.sh
```

The function writes to `src/content/logbook/` using a hardcoded repo path.

## Behavior

- Does not auto-commit. Just creates the file.
- Prints the relative path on success: `→ src/content/logbook/2026-05-14-slug.md`
- Prints usage on error (no note provided).
- Works from any directory.

## Out of Scope (Future Extensions)

- Phone capture via HTTP endpoint (design the script so the core logic could be wrapped in an endpoint later).
- AI-generated tags/titles via Ollama or Claude API.
- Auto-commit or auto-push.
