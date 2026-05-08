---
name: Zeik Cookson Portfolio
description: DevOps portfolio — logbook format, Swiss grid, editorial type, one amber signal.
colors:
  void-black: "oklch(22% 0.005 70)"
  column-black: "oklch(23% 0.005 70)"
  surface-warm: "oklch(23% 0.005 70)"
  surface-raised: "oklch(25% 0.007 68)"
  border-dim: "oklch(28% 0.008 68)"
  border-base: "oklch(35% 0.01 66)"
  ink-primary: "oklch(93% 0.007 82)"
  ink-secondary: "oklch(62% 0.016 74)"
  ink-tertiary: "oklch(50% 0.012 70)"
  pit-lane-amber: "oklch(74% 0.17 75)"
  pit-lane-amber-wash: "oklch(74% 0.17 75 / 0.09)"
  pit-lane-amber-soft: "oklch(74% 0.17 75 / 0.55)"
  signal-green: "oklch(65% 0.14 152)"
  signal-red: "oklch(52% 0.16 26)"
css-var-map:
  void-black: "--bg-body"
  column-black: "--bg"
  surface-warm: "--bg-warm"
  surface-raised: "--bg-raised"
  border-dim: "--border"
  border-base: "--border-hi"
  ink-primary: "--text"
  ink-secondary: "--text-muted"
  ink-tertiary: "--text-dim"
  pit-lane-amber: "--accent"
  pit-lane-amber-wash: "--accent-dim"
  pit-lane-amber-soft: "--accent-soft"
  signal-green: "--green"
  signal-red: "--red"
typography:
  display:
    fontFamily: '"Neue Montreal", system-ui, sans-serif'
    fontSize: "clamp(3.5rem, 10vw, 6rem)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: '"Neue Montreal", system-ui, sans-serif'
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Neue Montreal", system-ui, sans-serif'
    fontSize: "1.4375rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: '"Neue Montreal", system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace'
    fontSize: "0.5rem"
    fontWeight: 700
    letterSpacing: "0.18em"
rounded:
  sharp: "0px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "26px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.pit-lane-amber}"
    textColor: "{colors.column-black}"
    rounded: "{rounded.sharp}"
    padding: "10px 20px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.pit-lane-amber}"
    textColor: "{colors.column-black}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sharp}"
    padding: "10px 20px"
    typography: "{typography.label}"
  button-outline-hover:
    textColor: "{colors.ink-primary}"
  chip:
    backgroundColor: "{colors.surface-warm}"
    textColor: "{colors.ink-tertiary}"
    rounded: "{rounded.sharp}"
    padding: "2.4px 7.2px"
  chip-accent:
    backgroundColor: "{colors.pit-lane-amber-wash}"
    textColor: "{colors.pit-lane-amber}"
    rounded: "{rounded.sharp}"
    padding: "2.4px 7.2px"
  chip-green:
    backgroundColor: "transparent"
    textColor: "{colors.signal-green}"
    rounded: "{rounded.sharp}"
    padding: "2.4px 7.2px"
---

# Design System: Zeik Cookson Portfolio

## 1. Overview

**Creative North Star: "The Technical Memoir"**

Every project is a chapter. The interface is the typeset book: Neue Montreal carries both editorial weight and body legibility, while IBM Plex Mono reads out the instrument data. The visual system recedes so the work can speak. Restraint here is not minimalism as aesthetic choice — it is restraint as professional signal. Decoration signals insecurity; this system signals the opposite.

The site runs on a single column bounded at 800px and ruled on both sides by a 1px border, like a logbook with a spine. A grain texture overlays the whole surface — so faint it reads subliminally, but present enough to make the screen feel material rather than rendered. The amber accent is used the way a status indicator is used: once, at the point of focus, meaning exactly what it says. Everywhere else is carbonized neutral.

This system explicitly rejects: marketing websites, SaaS landing-page patterns, gradient-heavy DevOps tool dashboards, generic dark-mode portfolios with teal accents and card grids, and heavy motorsport theming that reads as costume. Motorsport lives in this system as naming texture — stage numbers, logbook format, status labels — never in visual decoration.

**Key Characteristics:**

- Two-voice typography: Neue Montreal (display through body), IBM Plex Mono (instrument read-out)
- Zero border-radius on every interactive element — angular throughout
- Dual-theme (dark/light) with warm-tinted OKLCH neutrals in both modes
- Grain texture overlay, opacity variable per theme (0.03 dark, 0.025 light)
- Single chromatic accent — Pit Lane Amber — used at ≤10% of any surface
- Column format: 800px max-width, vertically ruled by 1px borders

## 2. Colors: The Carbonized Palette

One chromatic voice against a field of warm near-blacks and warm near-whites.

### Primary

- **Pit Lane Amber** (`oklch(74% 0.17 75)` dark / `oklch(60% 0.16 66)` light, `--accent`): The sole accent. Applied to: active nav links, hero name `<em>` emphasis, stage card numbers, chip accents, hover-state title underlines, CTA button fill. Never used decoratively. When it appears, something is active, selected, or worth acting on. Its rarity is the point.
- **Pit Lane Amber Wash** (`oklch(74% 0.17 75 / 0.09)`, `--accent-dim`): Faint background tint on accent chips and the radial hover spotlight on stage cards. Barely perceptible at rest.
- **Pit Lane Amber Soft** (`oklch(74% 0.17 75 / 0.55)`, `--accent-soft`): Accent chip border. Semi-transparent bridge between the wash and the full amber.

### Neutral

Dark mode (canonical). CSS variable names in parens.

- **Void Black** (`oklch(22% 0.005 70)`, `--bg-body`): Body background. The outer frame behind the column. No content sits directly on this surface.
- **Column Black** (`oklch(23% 0.005 70)`, `--bg`): The main page column. Primary background surface. The ground everything else reads against.
- **Warm Surface** (`oklch(23% 0.005 70)`, `--bg-warm`): Stage cards, about grid cells, chip backgrounds. Shares value with Column Black currently; expressed as a separate semantic role for future divergence.
- **Raised Surface** (`oklch(25% 0.007 68)`, `--bg-raised`): Code blocks, stack table headers. Clearly elevated, used for contained data contexts.
- **Border Dim** (`oklch(28% 0.008 68)`, `--border`): Hairline dividers, horizontal rules, the section label extension line.
- **Border Base** (`oklch(35% 0.01 66)`, `--border-hi`): The ruled column edges, card borders, chip strokes. Visible but not loud.
- **Ink Tertiary** (`oklch(50% 0.012 70)`, `--text-dim`): Section label text, stage numbers, timestamps. Recedes intentionally.
- **Ink Secondary** (`oklch(62% 0.016 74)`, `--text-muted`): Body prose, card descriptions, nav links at rest. The main reading color.
- **Ink Primary** (`oklch(93% 0.007 82)`, `--text`): Headings, card titles, high-contrast labels. Slightly warm — never pure white.

Light mode values use the same semantic roles with sand-toned neutrals. Column surface becomes `oklch(97% 0.006 82)`, body background `oklch(91% 0.014 78)`. Amber lightness drops to `oklch(60% 0.16 66)` to maintain contrast against light grounds.

### Tertiary

- **Signal Green** (`oklch(65% 0.14 152)` dark / `oklch(47% 0.15 154)` light, `--green`): Proficiency "Daily Driver" labels, confirmed/healthy status.
- **Signal Red** (`oklch(52% 0.16 26)` dark / `oklch(44% 0.15 26)` light, `--red`): Error states, deprecated or inactive status.

### Named Rules

**The One Signal Rule.** Pit Lane Amber appears on ≤10% of any screen. It is a status indicator, not an aesthetic choice. Diluting it with color washes, section backgrounds, or decorative borders destroys its meaning. If you are using it as atmosphere, remove it.

## 3. Typography

**Display + Body Font:** Neue Montreal (system-ui, sans-serif fallback) — one sans-serif voice across all non-code text
**Label/Mono Font:** IBM Plex Mono (ui-monospace, monospace fallback)

**Character:** Neue Montreal handles everything that isn't instrument data — from the 6rem hero name down to 1rem body prose. Its rational grotesque character reads precision without coldness. IBM Plex Mono handles all instrument contexts: labels, timestamps, navigation, code. Two voices, zero overlap.

### Hierarchy

- **Display** (500, `clamp(3.5rem, 10vw, 6rem)`, line-height 1.02, -0.02em): Hero name only. One instance on the homepage. The `<em>` inside is Pit Lane Amber — the only time the accent colors a headline.
- **Headline** (700, `clamp(2rem, 5vw, 3rem)`, line-height 1.08, -0.02em): Page-level headings on detail and about pages. Used once per page.
- **Title** (600, `1.4375rem`, line-height 1.25, -0.01em): Stage card titles, prose H2 headings. The primary working heading level.
- **Body** (400 Neue Montreal, `1rem`, line-height 1.65, max-width 60ch): All readable content. Never use IBM Plex Mono at body scale.
- **Label** (700 IBM Plex Mono, `0.5rem`, letter-spacing 0.18em, all-caps): Section labels, stage numbers, chip text, CTA button labels. Widest tracking in the system. The instrument register.
- **Mono Meta** (500 IBM Plex Mono, `0.5625rem`–`0.625rem`, letter-spacing 0.1–0.14em, all-caps): Hero role/handle, nav links, timestamps, contact items. Lighter weight than Label, still monospace.

### Named Rules

**The Two Voices Rule.** Every text element is set in one of two voices: Neue Montreal (any non-code element — display, heading, body) or IBM Plex Mono (instrument data: labels, timestamps, navigation, code). The voices have non-overlapping jobs. A monospace label next to a sans-serif label at the same size is a mistake, not a variation.

## 4. Elevation

This system is flat by default. No surface casts a shadow at rest. Depth is expressed through background-color steps: Void Black → Column Black → Warm Surface → Raised Surface. Each step is a deliberate OKLCH tonal shift — visible and intentional.

Shadows appear only as a response to hover state. On stage cards, `translateY(-2px)` and a diffuse shadow fire simultaneously when the user engages. The shadow signals movement — the card rose toward the viewer. It is kinetic feedback, not decoration.

### Shadow Vocabulary

- **Hover lift** (`0 8px 28px oklch(0% 0 0 / 0.14)`): Applied to `.stage-card:hover` in tandem with `translateY(-2px)`. Diffuse, low-opacity. Paired with `transition: box-shadow 0.2s ease-out`.

### Named Rules

**The Flat-Until-Hover Rule.** No static shadows. A surface casts a shadow only when it moves. If you find yourself adding `box-shadow` to a surface at rest, you are borrowing consumer app vocabulary this system does not speak.

## 5. Components

### Buttons

Monospace labels, all-caps, zero radius. The label IS the button. Shape comes from padding, not visual chrome.

- **Shape:** Sharp (0px radius) on all variants
- **Primary (`.cta-primary`):** Background Pit Lane Amber, text Column Black, padding `0.625rem 1.25rem`. Label at 0.625rem / 700 / +0.12em. Hover: `opacity: 0.85` — no translate, no border shift. Simple.
- **Outline (`.cta-outline`):** Transparent background, border Border Base (1px), text Ink Secondary. Hover: text → Ink Primary, border → Pit Lane Amber. Both at `0.15s` linear.
- **Note:** Neither button has a custom focus ring. Add `:focus-visible { outline: 2px solid pit-lane-amber; outline-offset: 2px; }` before shipping.

### Chips

Inline data labels. Three semantic variants — the type and border are the design, not the background.

- **Default (`.chip`):** Warm Surface background, Border Base stroke, Ink Tertiary text. Neutral. For tech stack, duration, category tags.
- **Accent (`.chip.accent`):** Pit Lane Amber Wash background, Pit Lane Amber Soft border, Pit Lane Amber text. For active, current, or primary classification.
- **Green (`.chip.green`):** Transparent background, Signal Green border, Signal Green text. For shipped, healthy, or "daily driver" status.

### Stage Cards

The signature component. A project entry that tracks cursor position with a radial accent spotlight. At rest: flat, bordered, Warm Surface background — no depth. On hover: `translateY(-2px)`, diffuse shadow, Border Base lifts to Border Base (brighter), and a radial gradient centered on cursor coordinates (`--mx`, `--my`) fades in using Pit Lane Amber Wash.

The stage title uses a CSS underline-draw animation: `background-size` animates from `0% 1px` to `100% 1px`, drawing an amber 1px rule under the heading. This is the one moment amber directly contacts heading-level text.

The "READ FULL LOG →" label (`stage-read`) is `opacity: 0; transform: translateX(6px)` at rest, both resolving to visible/zero on hover.

### Navigation

Sticky at 56px, glazed with `backdrop-filter: blur(10px)`. Background: Column Black at 92% opacity. Logo: two-line, two-voice — logotype in Neue Montreal 700 (1rem), handle in IBM Plex Mono 500 uppercase below. Nav links: 0.5625rem IBM Plex Mono, Ink Secondary at rest, Ink Primary on hover, Pit Lane Amber when `.active`. Theme toggle: Border Base stroke at rest, Pit Lane Amber on hover.

### Section Labels

Horizontal position markers. IBM Plex Mono 700, 0.5rem, +0.18em, uppercase, Ink Tertiary. A rule extends to the right edge via `::after { flex: 1; height: 1px; background: Border Dim }`. Padding: `2.5rem 0 1.5rem`. No left rule; label stands at the left edge of the column.

### Log Entries

Typographic list with no card surface. Each entry separated by a 1px Border Dim rule. Vertical padding `1.375rem`. Title: Neue Montreal 700 / 1.1875rem; transitions to Pit Lane Amber on hover. Timestamp and chips in the meta row above. No background, no elevation — the typography is the container.

## 6. Do's and Don'ts

### Do:

- **Do** use Pit Lane Amber for exactly one semantic purpose per element: the thing that is active, selected, or actionable. Its power is its rarity.
- **Do** set body copy in Neue Montreal at 1rem / line-height 1.65. IBM Plex Mono is never used at body scale.
- **Do** use tonal background steps (Column Black → Warm Surface → Raised Surface) to express depth at rest. Background color is the only elevation tool outside of hover states.
- **Do** keep all surfaces at 0px border-radius. Every edge is angular.
- **Do** apply motorsport naming texture to new content types — stage labels, logbook entry formats, status indicators — keeping it in labels and metadata, not visual decoration.
- **Do** vary padding for rhythm. The system uses `0.375rem` micro-gaps, `1.625rem` card padding, `2rem` section wrap, `4.5rem` hero top padding. Preserve this variation; flat spacing produces monotony.

### Don't:

- **Don't** build marketing websites, SaaS landing pages, or gradient-heavy DevOps tool dashboards. This portfolio is intentionally not those things.
- **Don't** use the generic dark-mode developer portfolio formula: teal accents, card grids with icon + heading + text, gradient CTAs, glowing borders. These are named anti-references in PRODUCT.md.
- **Don't** apply heavy motorsport theming. No racing hero widgets, no giant lap-time numbers, no checkered visual patterns, no livery color palettes. Motorsport is a naming watermark — not a visual theme park.
- **Don't** use gradient text (`background-clip: text`). Headlines are solid Ink Primary or Pit Lane Amber, never blended.
- **Don't** use `border-left` greater than 1px as a colored accent stripe on cards, callouts, or list items. Rewrite with full borders, background tints, leading numbers, or nothing.
- **Don't** add static shadows to surfaces at rest. A shadow signals movement; static surfaces are flat.
- **Don't** use the same padding value throughout. Identical padding everywhere is monotony, not consistency.
- **Don't** write marketing copy. The tone is logbook: direct, specific, no filler. A sentence that could appear in a SaaS hero block does not belong here.
