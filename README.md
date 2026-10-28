# Portfolio

This is my portfolio site, live at https://dev.zeikcookson.com. I edit its content in an admin on the site itself, and I deploy it by hand from Dokploy.

## What this is

The site is an Astro 6 server build on the `@astrojs/node` standalone adapter, written in TypeScript strict mode. The content (project cards, About, navigation and site settings) lives in EmDash, in SQLite on a persistent volume, and not in this repo. Public pages ship no client JS. The EmDash admin at `/_emdash/admin` is the only part that runs any. The site is self-hosted on Dokploy from the repo `Dockerfile`, behind the Cloudflare proxy.

Engineering rules are in [CLAUDE.md](CLAUDE.md). The design system is in [DESIGN.md](DESIGN.md) and [PRODUCT.md](PRODUCT.md).

## Local development

I use Node 24, which `.nvmrc` pins. The `engines` field requires Node 22.22.2 or newer and `engine-strict` is on, so an older Node fails at install.

```sh
npm ci
mkdir -p data
npm run dev
```

EmDash cannot open its SQLite file until `data/` exists, so `mkdir -p data` has to run before the first `npm run dev`. The folder is gitignored.

Then open http://localhost:4321/_emdash/admin. On an empty database it runs the setup wizard. I choose Sample content, which loads the committed `.emdash/seed.json`, and enroll a passkey for localhost. The local database is separate from production, so editing one never changes the other, git or the seed.

Two checks run before a change is done:

```sh
npm test
npm run check:public-js
```

`npm test` runs the Node test files in `scripts/` and `src/lib/`. `npm run check:public-js` builds the site, serves it against a throwaway database and fails if a public route gains a script.

## Editing content

I edit content in the admin at https://dev.zeikcookson.com/_emdash/admin, signed in with my one passkey. If that device is lost, the way back is the "Admin recovery procedure" section of [.planning/PROJECT.md](.planning/PROJECT.md).

Saving a published entry stages a draft, and the live page keeps showing the published copy. Preview opens a signed link to the draft that works in a signed-out browser for an hour, so I can share it. Publish makes the change live on the next request, with no rebuild, push or deploy. Restore in the Revisions panel turns an older version into the draft, and the live page only changes when I publish again. [06-EVIDENCE.md](.planning/phases/06-live-editing-and-docs/06-EVIDENCE.md) records this loop rehearsed on production.

## Deploying

1. Merge to `main` and push. A push runs CI only, and Auto Deploy is off, so a push never deploys.
2. In Dokploy, click Deploy on the portfolio application and wait for the deployment to show done.
3. Run the smoke test, which checks that `/`, `/projects/` and one project page answer 200:

```sh
node scripts/smoke-test.mjs https://dev.zeikcookson.com
```

EmDash applies pending migrations on the first request after the container starts, so before I deploy a change to `.emdash/migrations.json` (an EmDash upgrade) I take a volume backup first.

## Rolling back

For bad code, I revert the commit on `main`, push, click Deploy and run the smoke test. I have not rehearsed this route yet.

A code rollback does not undo a migration that already ran. After a bad migration I restore the nightly volume backup from the private R2 bucket with Dokploy's Restore Volume, picking the `.tar` object and not the app-name folder. That restore was rehearsed into a scratch app, and the record is in [05-EVIDENCE.md](.planning/phases/05-dokploy-deploy-and-cutover/05-EVIDENCE.md) (rows B1 to B3).

## Agent access

The repo commits `.mcp.json` with one MCP server, `emdash`, at https://dev.zeikcookson.com/_emdash/api/mcp. It is named by URL only. In Claude Code at the repo root I approve the project server and run `/mcp`, and the first connection opens an OAuth sign-in with my admin passkey. No token lives in the repo or the environment. The session then acts with my admin rights.

The rule is draft-first. The agent reads an entry with `content_get`, writes with `content_update` and no status so the change stays a draft, and I publish in the admin. This is a convention, and nothing enforces it. An entry open in the admin editor refuses agent writes with `ENTRY_LOCKED`, so I close the editor first.
