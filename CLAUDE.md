# Portfolio — Engineering Standards

## Stack

Astro 6 with the `@astrojs/node` standalone adapter, TypeScript strict mode. Content lives in EmDash (SQLite on a persistent volume), not in the repo. React is present only for the EmDash admin. Self-hosted on Dokploy from the repo `Dockerfile`.

## Content

Content is edited in the EmDash admin or by Claude through the EmDash MCP endpoint (`/_emdash/api/mcp`, scoped token). There are no markdown content files. `README.md` covers the MCP setup, environment variables, and what the agent can and cannot do.

Content edits made through `content_create` and `content_update` land as drafts. The user publishes in the admin.

## Code Rules

- TypeScript strict — no `any`
- No client-side JS unless there's no server-side alternative (`npm run check:public-js` guards this)
- No inline styles except for CSS custom property overrides (`style="--var: value"`)
- All SQL queries parameterized, never interpolated

## Design System

Two typefaces: Satoshi (all non-code text) and IBM Plex Mono (labels, timestamps, nav, code). Both self-hosted in `public/fonts/`.

Single accent color — Pit Lane Amber (`oklch(74% 0.17 75)`). Use it for active states and CTAs only. Never decorative. See `DESIGN.md` for the full token set.

Zero border-radius throughout. No card shadows at rest.

## Deployment

Dokploy builds the `Dockerfile` (Node 24, output `dist/server/entry.mjs`). `engines` requires Node >=22.22.2. Production deploys when a `v*` tag is pushed, after CI passes for the tagged commit. A push to `main` runs CI only, and docs-only pushes skip CI. The tag pipeline is built in Phase 5 (`.planning/phases/05-dokploy-deploy-and-cutover/`).
