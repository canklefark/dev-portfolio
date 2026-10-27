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

Claude manages portfolio content through the EmDash MCP endpoint at `/_emdash/api/mcp`, signed in through OAuth. Content edits made through `content_create` and `content_update` land as drafts, and the user publishes in the admin. Menu, taxonomy term, media and byline writes are live as soon as they are made, as the section on what the agent can and cannot do explains.

### Connect a Claude Code session

The committed `.mcp.json` registers the server as `emdash-agent` with only a URL, no token and no headers. It reads `EMDASH_MCP_URL` and defaults to `http://localhost:4321/_emdash/api/mcp`, so export `EMDASH_MCP_URL='https://dev.zeikcookson.com/_emdash/api/mcp'` in the shell before starting `claude` to use the deployed site.

1. Start `claude` from the repository root, so the project settings and the guard hook load, and approve the project-scoped `emdash-agent` server when it asks.
2. Run `/mcp`, choose `emdash-agent` and pick Authenticate. A browser opens the EmDash consent page. Sign in and approve.
3. Ask Claude to run `content_list` on the `projects` collection. A list of projects is the proof that the sign-in works.

The OAuth session carries the signed-in user's full admin rights, which is a deliberate choice (it replaces the scoped personal access token of earlier phases). The Claude Code guard described below still applies, because it matches the server name, so keep `emdash` in the name of any registration of the endpoint. Saved sign-ins are keyed by server name. To revoke access, remove the OAuth client in the admin and run `/mcp` to clear the sign-in.

### What the agent can and cannot do

- **Not refused by EmDash.** The OAuth session has the user's full admin rights, so EmDash itself refuses nothing, including schema, settings, site export and import, and user management tools. The guard below is what keeps the agent to content work.
- **Blocked by the Claude Code guard.** The guard is the committed `.claude/settings.json` deny rules plus the PreToolUse hook `.claude/hooks/emdash-guard.mjs`, and it runs inside Claude Code before a request leaves the session. It blocks fourteen tools: `content_publish`, `content_unpublish`, `content_schedule`, `content_unschedule`, `content_delete`, `content_permanent_delete`, `taxonomy_create`, `taxonomy_update`, `taxonomy_delete`, `taxonomy_delete_term`, `menu_delete`, `menu_set_items`, `media_delete` and `byline_delete`. The hook also refuses any other emdash tool whose name carries publish, unpublish, schedule, unschedule or delete, outside the schema, settings and site tools that the server refuses itself. It blocks `content_update` with `status`, `publishedAt`, `seo`, `bylines` or `taxonomies`, and with any other key outside the draft-only set. It blocks `content_create` with a status other than draft or with `publishedAt`. The guard applies to any MCP server whose name contains `emdash`, so keep that word in the name of any other registration of the endpoint, such as a server for the deployed site.
- **Lands as a draft.** A `content_create` call without a status creates a draft. A `content_update` of data fields or the slug on a published card is staged as a pending draft revision, and the live page keeps the old copy until the user publishes in the admin. Review a change with `content_get`, where `data` is the draft, `liveData` is the published copy and `draftRevisionId` is the pending revision, or with `content_compare`. Drop a pending change with `content_discard_draft`. Claude always calls `content_get` first and passes its `_rev` to the update. The user closes the entry in the admin first, because an entry open in the editor holds a lock that refuses agent writes, and the guard blocks `overrideLock` so the agent cannot force a write past it.
- **Live as soon as it is written, and accepted.** This covers menu create and update, taxonomy term create and update (renaming a tag changes every card that uses it), media upload and update, and byline create and update, although this site does not render bylines. Deleting a menu, a term, a media file or a byline, and replacing menu items, are done in the admin, because none of them can be undone. Category, tags, SEO and publish dates on an existing card are changed in the admin. A brand-new draft can be tagged in its `content_create` call.

### CLI fallback

Every CLI call runs with `EMDASH_URL` (the origin) and `EMDASH_TOKEN` exported. Without `EMDASH_TOKEN` the CLI falls back to credentials saved by an earlier CLI login, which carry full admin rights, or on localhost to a dev bypass that runs as the full admin dev user. A call can therefore succeed for the wrong reason, and the scoped token the CLI expects is no longer created, so use `npx emdash login` for the CLI or create a token in the admin. Saved credentials can be removed with `npx emdash logout --url http://localhost:4321`.

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

There is no token to rotate. To cut off access, revoke the OAuth client in the admin. OAuth clients and sessions are deleted together with the user that owns them, so both the recovery procedure that deletes users and a database move end the sign-in. Authenticate again after either.

### Residual risk

The publish block is enforced by Claude Code, not by EmDash, and the OAuth session has full admin rights, so nothing on the server side limits what the session can do. A session whose settings disable hooks, or a command the hook cannot parse (the CLI name held in a variable, or passed through `xargs`), would bypass the guard. Deny rules stop the Edit and Write tools from changing `.claude/**` (the hook, the project settings, the local settings and the project skills) and `.mcp.json`, but a Bash command can still write those files, so the agent could in principle remove the guard. To change the guard on purpose, edit those files yourself or lift the rule for the edit. The guard is not a sandbox, and it does not stop a determined bypass. The mitigations in place are the guard and the user reviewing every draft before publishing.
