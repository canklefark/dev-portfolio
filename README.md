# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Agent access

Claude manages portfolio content through the EmDash MCP endpoint at `/_emdash/api/mcp`, authenticated with a scoped personal access token. The `emdash` CLI is the fallback for scripting, and it uses the same token. Every write the agent makes lands as a draft, and the user publishes in the admin. The token is the only credential the agent uses.

### Environment variables

| Variable         | Used by  | Local                                                                 | Deployed (after the Phase 5 move)                 |
| :--------------- | :------- | :-------------------------------------------------------------------- | :------------------------------------------------ |
| `EMDASH_TOKEN`   | MCP, CLI | Required. The scoped token.                                           | Required. A separate token for the deployed site. |
| `EMDASH_MCP_URL` | MCP      | `http://localhost:4321/_emdash/api/mcp` (also the default when unset) | `https://dev.zeikcookson.com/_emdash/api/mcp`     |
| `EMDASH_URL`     | CLI      | `http://localhost:4321`                                               | `https://dev.zeikcookson.com`                     |

`EMDASH_MCP_URL` holds the full endpoint path, while `EMDASH_URL` holds the site origin only, with no path. Claude Code reads its own process environment, so the variables are exported in the shell, a shell profile or direnv before starting `claude`, and `.env` files are not read. The committed `.mcp.json` holds only the references `${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}` and `${EMDASH_TOKEN}`, never a value.

### Create the agent token

1. Sign in to the admin and open `/_emdash/admin/settings/api-tokens`.
2. Name the token `claude-agent`.
3. Tick exactly `content:read`, `content:write`, `media:read`, `media:write`, `menus:manage` and `taxonomies:manage`, and no schema, settings, transfer, admin or `mcp:tools` scope.
4. Set the expiry to 90 days, because the form defaults to 30.
5. Copy the value once, because EmDash stores only its hash, and never paste it into a file in the repository.

Draft reading comes from the owner's role, so no draft scope exists. The `content:write` scope already implies `menus:manage` and `taxonomies:manage`, and the token lists them anyway to document the intent. The `schema:read` scope is left off on purpose, so Claude learns field names from `content_get` output or `emdash-env.d.ts`.

```bash
export EMDASH_TOKEN='ec_pat_REDACTED'
# Optional. The committed .mcp.json already defaults to the local server.
export EMDASH_MCP_URL='http://localhost:4321/_emdash/api/mcp'
```

### Connect a Claude Code session

Run these steps from the repository root, in a shell where the variables are exported.

1. Run `claude mcp list` and expect `emdash` with the status Connected. A missing-variable warning means `EMDASH_TOKEN` is not exported, and Pending approval means `claude` has not been started in this repository yet.
2. Start `claude` from the repository root, so the project settings and the guard hook load, and approve the project-scoped `emdash` server when it asks. The command `claude mcp reset-project-choices` undoes a wrong choice.
3. Run `/mcp` to confirm the server is connected.
4. Ask Claude to run `content_list` on the `projects` collection. A list of projects is the proof that the token works.

A wrong or expired token shows as Failed to connect, because the Authorization header is configured in `.mcp.json`. If Claude Code ever offers an OAuth sign-in for `emdash`, decline it, because OAuth gives the session the user's full admin rights. Fix or rotate the token instead.
