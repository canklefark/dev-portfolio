# Portfolio — Engineering Standards

## Stack

Astro 6 with the `@astrojs/node` standalone adapter, TypeScript strict mode. Content lives in EmDash (SQLite on a persistent volume), not in the repo. React is present only for the EmDash admin. Self-hosted on Dokploy from the repo `Dockerfile`.

## Content

Content is edited in the EmDash admin. There are no markdown content files. Claude edits content through the `emdash` MCP server in `.mcp.json` (OAuth, with the owner's admin rights) and saves drafts only; the owner publishes in the admin. This is a convention: nothing enforces it.

## Code Rules

- TypeScript strict — no `any`
- No client-side JS on public routes. Client JS runs only in the EmDash admin under `/_emdash/admin`, and never add a script, modulepreload or module tag to a public route (`npm run check:public-js` fails CI if one appears)
- No third-party EmDash plugins (`EMDASH_ENCRYPTION_KEY` stays unset because no plugin declares a secret)
- No inline styles except for CSS custom property overrides (`style="--var: value"`)
- All SQL queries parameterized, never interpolated

## Design System

Two typefaces: Satoshi (all non-code text) and IBM Plex Mono (labels, timestamps, nav, code). Both self-hosted in `public/fonts/`.

Single accent color — Pit Lane Amber (`oklch(74% 0.17 75)`). Use it for active states and CTAs only. Never decorative. See `DESIGN.md` for the full token set.

Zero border-radius throughout. No card shadows at rest.

## Deployment

Dokploy builds the `Dockerfile` (Node 24, output `dist/server/entry.mjs`). `engines` requires Node >=22.22.2. The owner clicks Deploy in Dokploy; nothing deploys automatically. A push to `main` runs CI only. After each deploy run `node scripts/smoke-test.mjs https://dev.zeikcookson.com`. dev.zeikcookson.com is behind the Cloudflare proxy (SSL/TLS Full strict), and the proxy injects one email-decode script on `/about`, an accepted exception to the no-client-JS rule that `check:public-js` cannot see because it runs on the origin build.
