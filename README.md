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

Claude manages portfolio content through the EmDash MCP endpoint at `/_emdash/api/mcp`, authenticated with a scoped personal access token. The `emdash` CLI is the fallback for scripting, and it uses the same token. Content edits made through `content_create` and `content_update` (or the CLI with `--draft`) land as drafts, and the user publishes in the admin. Menu, taxonomy term, media and byline writes are live as soon as they are made, as the section on what the agent can and cannot do explains. The token is the only credential the agent uses.

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

1. Run `claude mcp list` and expect `emdash-agent` with the status Connected. A missing-variable warning means `EMDASH_TOKEN` is not exported, and Pending approval means `claude` has not been started in this repository yet.
2. Start `claude` from the repository root, so the project settings and the guard hook load, and approve the project-scoped `emdash-agent` server when it asks. The command `claude mcp reset-project-choices` undoes a wrong choice.
3. Run `/mcp` to confirm the server is connected.
4. Ask Claude to run `content_list` on the `projects` collection. A list of projects is the proof that the token works.

A wrong or expired token shows as Failed to connect, because the Authorization header is configured in `.mcp.json`. If Claude Code ever offers an OAuth sign-in for `emdash`, decline it, because OAuth gives the session the user's full admin rights. Fix or rotate the token instead.

The server is registered as `emdash-agent` on purpose. Claude Code keys saved OAuth sign-ins by server name and prefers a saved sign-in over the `Authorization` header, so a server that was ever signed in through OAuth (for example the Phase 2 admin session under the name `emdash`) never sends the token, shows Needs authentication, and runs with the full admin rights of that OAuth client. A server name that has never been signed in uses the token. Check that the token is really in use: the admin token list shows a last used time that moves when the session connects. Revoke any old OAuth client for the endpoint in the admin, and never choose authenticate or sign in for this server.

### What the agent can and cannot do

- **Refused by EmDash for this token.** The schema tools return INSUFFICIENT_SCOPE, because they need `schema:write` or `schema:read`. The same holds for `settings_get` and `settings_update` (`settings:read`, `settings:manage`), the site export and import tools (transfer scopes), user management, and admin REST paths that no scope rule matches.
- **Blocked by the Claude Code guard.** The guard is the committed `.claude/settings.json` deny rules plus the PreToolUse hook `.claude/hooks/emdash-guard.mjs`, and it runs inside Claude Code before a request leaves the session. It blocks fourteen tools: `content_publish`, `content_unpublish`, `content_schedule`, `content_unschedule`, `content_delete`, `content_permanent_delete`, `taxonomy_create`, `taxonomy_update`, `taxonomy_delete`, `taxonomy_delete_term`, `menu_delete`, `menu_set_items`, `media_delete` and `byline_delete`. The hook also refuses any other emdash tool whose name carries publish, unpublish, schedule, unschedule or delete, outside the schema, settings and site tools that the server refuses itself. It blocks `content_update` with `status`, `publishedAt`, `seo`, `bylines` or `taxonomies`, and with any other key outside the draft-only set. It blocks `content_create` with a status other than draft or with `publishedAt`. The guard applies to any MCP server whose name contains `emdash`, so keep that word in the name of any other registration of the endpoint, such as a server for the deployed site.
- **Lands as a draft.** A `content_create` call without a status creates a draft. A `content_update` of data fields or the slug on a published card is staged as a pending draft revision, and the live page keeps the old copy until the user publishes in the admin. Review a change with `content_get`, where `data` is the draft, `liveData` is the published copy and `draftRevisionId` is the pending revision, or with `content_compare`. Drop a pending change with `content_discard_draft`. Claude always calls `content_get` first and passes its `_rev` to the update. The user closes the entry in the admin first, because an entry open in the editor holds a lock that refuses agent writes, and the guard blocks `overrideLock` so the agent cannot force a write past it.
- **Live as soon as it is written, and accepted.** This covers menu create and update, taxonomy term create and update (renaming a tag changes every card that uses it), media upload and update, and byline create and update, although this site does not render bylines. Deleting a menu, a term, a media file or a byline, and replacing menu items, are done in the admin, because none of them can be undone. Category, tags, SEO and publish dates on an existing card are changed in the admin. A brand-new draft can be tagged in its `content_create` call.

### CLI fallback

Every CLI call runs with `EMDASH_URL` (the origin) and `EMDASH_TOKEN` exported. Without `EMDASH_TOKEN` the CLI falls back to credentials saved by an earlier CLI login, which carry full admin rights, or on localhost to a dev bypass that runs as the full admin dev user. A call can therefore succeed for the wrong reason. Saved credentials can be removed with `npx emdash logout --url http://localhost:4321`.

```bash
export EMDASH_URL='http://localhost:4321'
# Authentication proof: this returns the project list when the token works.
npx emdash content list projects --json
# Note the _rev value in the output.
npx emdash content get projects SLUG --json
npx emdash content update projects SLUG --draft --rev REV --data '{"sub":"New subtitle"}'
# The live copy is unchanged.
npx emdash content get projects SLUG --published --json
```

SLUG is the project slug and REV is the `_rev` value from `content get`. The commands `emdash content create` and `emdash content update` publish automatically unless `--draft` is passed, so every CLI write carries `--draft`. The command `emdash whoami` is expected to fail for this token, because its route needs the admin scope, so the list call is the proof. The CLI publish, unpublish, schedule and delete commands and the CLI login are not part of the agent workflow.

The same hook reads every Bash command before it runs. It refuses `content publish`, `content unpublish`, `content schedule`, `content delete`, `media delete` and any other `content` subcommand that is not list, get, create, update, restore or translations. It also refuses `content create` and `content update` without `--draft`, and any `--override-lock`. The matching deny rules cover the `npx emdash` and `emdash` spellings, plus `curl` calls to `_emdash` paths. This narrows the accidental path only, as the residual risk section explains. A command that merely quotes one of these strings, such as a heredoc that documents them, can also be refused, and a file write through the Write tool avoids that.

### Rotation and recovery

The token expires after 90 days. Create a replacement with the same six scopes and a 90-day expiry, export the new value as `EMDASH_TOKEN`, restart `claude`, and then revoke the old token on the same admin page.

Tokens are deleted together with the user that owns them, so both the recovery procedure that deletes users and the Phase 5 database move remove this token. After Phase 5, create a new token in the deployed admin and set `EMDASH_MCP_URL` and `EMDASH_URL` to the deployed values. Never reuse the local token against the deployed site.

### Residual risk

The publish block is enforced by Claude Code, not by EmDash. EmDash 1.3.1 has no publish scope, and a token carries its owner's admin role narrowed only by its scopes, so this token can itself publish, unpublish and delete. The token sits in the environment of every shell Claude runs, so a `curl` call that the deny rule does not match, a command the hook cannot parse (the CLI name held in a variable, or passed through `xargs`), or a session whose settings disable hooks would bypass the guard. Deny rules stop the Edit and Write tools from changing `.claude/**` (the hook, the project settings, the local settings and the project skills) and `.mcp.json`, but a Bash command can still write those files, so the agent could in principle remove the guard. To change the guard on purpose, edit those files yourself or lift the rule for the edit. The Bash check catches the accidental CLI publish, such as a forgotten `--draft`. It is not a sandbox, and it does not stop a determined bypass. The mitigations in place are the minimal scopes, the 90-day expiry, the guard, and the user reviewing every draft before publishing.
