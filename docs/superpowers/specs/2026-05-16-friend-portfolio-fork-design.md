# Friend Portfolio Fork Design

## Purpose

Fork this Astro portfolio into a one-off portfolio for a friend who works in IT and is about to start a WGU bachelor's program. The new site should preserve the useful content architecture from this repo, but it should not look or read like a copy. The friend will fill out an intake/profile document, return it with supporting material, and Zeik will use that material to build the fork before handing over a deployable repo.

## Approved Direction

Use a one-off fork with a shared content engine, a new identity layer, and an Obsidian publishing workflow.

Keep:

- Astro 6, strict TypeScript, and Markdown content collections.
- Project cards and project detail pages backed by typed frontmatter.
- An about page that combines structured data with prose.
- A notes/journal-style content area for school and IT learning documentation.
- Git-based deployment through Cloudflare Pages or an equivalent static host.

Replace:

- All Zeik-specific homepage copy, about copy, contact information, metadata, console text, favicon/logo assumptions, and design language.
- The current motorsport/logbook framing unless the friend independently wants a comparable personal texture.
- `PRODUCT.md`, `DESIGN.md`, and authoring guidance with friend-specific versions derived from the returned intake document.

Avoid turning this into a reusable template. This fork is for one person, so the implementation can make direct choices from his answers.

## Site Architecture

The fork should keep the existing high-level route shape:

- `/` for the homepage.
- `/projects` and `/projects/[slug]` for portfolio case studies.
- `/about` for background, contact, stack, and current direction.
- A renamed journal section for learning/work notes. Candidate names include `notes`, `field-notes`, or `learning-log`; choose after reviewing the friend's voice and preferences.

The main architectural boundary is:

- Obsidian is the private thinking and drafting space.
- Astro is the public publishing surface.

The site should not publish directly from the vault. Published content should be copied or generated into the Astro repo so builds are deterministic and reviewable.

## Friend Intake Document

Create a Markdown intake/profile document that Zeik can send to the friend. The friend fills it out and sends it back with any relevant assets. The document is not primarily for the friend to operate the repo; it is the source of truth Zeik will use to build the site.

The intake document should ask for raw material, not polished marketing copy.

Required sections:

1. Identity and goals
   - Name, preferred display name, location preference, current IT background, WGU program, target roles, audience, availability, and constraints.
   - What success looks like for the portfolio: interview callbacks, internship applications, documentation habit, credibility during school, or another goal.

2. Career and credibility context
   - Current role, previous roles, tools used, responsibilities, troubleshooting stories, certifications, degree progress, and areas of focus.
   - What he wants hiring managers or technical reviewers to understand quickly.

3. Content inventory
   - Current work examples that can be discussed safely.
   - WGU projects, labs, assignments, or study artifacts that may become notes or case studies.
   - Home IT projects, scripts, lab environments, hardware, networking work, cloud work, automation, documentation, and screenshots.
   - For each candidate item: what problem it solved, what he did, what tools were used, what changed, what can be public, and what should stay private.

4. Voice and personality
   - Desired tone: direct, warm, formal, technical, plainspoken, playful, or other.
   - Phrases or styles to avoid.
   - Writing examples he likes.
   - Personal interests or texture that may influence labels and copy, without becoming a gimmick.

5. Visual system input
   - Sites, apps, portfolios, or brands he likes and dislikes.
   - Color preferences, typography preferences, density preferences, motion tolerance, and accessibility needs.
   - Whether the site should feel conservative, sharp, friendly, technical, experimental, academic, practical, or another direction.
   - Explicit permission for the resulting visual system to diverge from this portfolio.

6. Obsidian workflow
   - Vault location, relevant folder names, current note style, whether notes already use frontmatter, and whether attachments/screenshots should be considered.
   - Desired publish marker, publish states, private fields, and whether exported notes should default to draft.
   - Whether publishable content should appear as a short learning note, mature into a project case study, or both.

7. Assets and accounts checklist
   - Resume, LinkedIn, GitHub, email/contact preference, domain preference, headshot/avatar preference, screenshots, diagrams, Obsidian folder examples, and any existing notes he is comfortable sharing.

8. Public/private review
   - A place to mark content as public, private, anonymize first, or ask before publishing.

Include a helper prompt for Zeik to use after receiving the filled document. The prompt should instruct an LLM to synthesize the friend's answers into site positioning, first-pass copy, a visual design brief, project drafts, note taxonomy, and Obsidian sync configuration.

## Obsidian Sync Design

Design a small repo script that imports only explicitly approved notes from the friend's separate Obsidian vault. Do not require the vault to live inside the repo.

A note should sync only when it has explicit frontmatter similar to:

```yaml
portfolio:
  publish: true
  type: note # note | project
  slug: networking-lab-dns
  title: "Networking Lab: DNS Troubleshooting"
  date: "2026-06-04"
```

Rules:

- `portfolio.publish: true` is required. Notes without it are skipped.
- `portfolio.type: note` writes to the renamed journal collection.
- `portfolio.type: project` writes to `src/content/projects/` and must satisfy the project schema.
- Imported content should default to `draft: true` unless the note explicitly opts into publication.
- The script should strip private fields, normalize frontmatter to the Astro schema, preserve Markdown body content, and report what it imported or skipped.
- The first version should support a dry run, clear skipped-note messages, collision protection, and one-way sync only.

The sync script should make accidental publishing hard. Private school notes stay private unless the friend marks them for portfolio export.

## Fork Implementation Scope

Implementation should:

- Rename or reframe the existing logbook area into the approved journal concept.
- Remove all current author-specific content and metadata.
- Generate friend-specific `PRODUCT.md` and `DESIGN.md` from the returned intake.
- Update homepage, about page, project examples, navigation, metadata, favicon/logo treatment, and console text.
- Create or update content authoring guidance so future additions follow the friend's schemas and tone.
- Keep styling architecture only where it remains useful; redesign the visual system from the friend's intake rather than recoloring this one by default.

Implementation should not:

- Build a generic theme/template system.
- Publish directly from Obsidian.
- Preserve the existing motorsport/logbook language unless the friend independently chooses it.
- Ship sample content that still points to Zeik, his email, his location, or his projects.

## Validation

Before considering the fork ready:

- `npm run build` passes.
- Sample project and note content validate against Astro content schemas.
- The Obsidian sync dry run shows exactly which notes would import and why other notes are skipped.
- The intake document contains no placeholders that require Zeik to guess later.
- The finished fork contains no Zeik-specific copy, emails, metadata, favicon assumptions, console text, project content, or design-language leftovers.
- The final repo includes clear deployment handoff instructions for Cloudflare Pages or the chosen static host.

## Open Decisions For Implementation

These should be decided after the friend returns the intake document:

- Final name for the renamed journal section.
- Visual system direction, accent color, typography, logo/favicon treatment, and motion level.
- Initial project and note inventory.
- Exact Obsidian vault path, publish marker, and frontmatter fields.
- Deployment host, domain, and account ownership.
