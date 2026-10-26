# Phase 4: EmDash agent access pass (evidence record)

Run on 2026-10-26 against the user's running dev server (`http://localhost:4321/_emdash/api/mcp`, started by the user with `npm run dev`; Claude never starts it). The executor ran E2 and runs the independent checks X1 and X2 (read-only requests and a read-only database read). The user's fresh Claude Code session, started by following README Agent access, runs E1 and E3 to E7. The user creates the token, makes both publishes and does the cleanup in the admin. Auth method: the scoped token `claude-agent`, written in this record only as `ec_pat_REDACTED`. Target: the throwaway entry `agent-access-check`, created during the pass and permanently deleted at the end. No real card is touched.

State at the time of the pass: the token carries the six scopes of D-06 amended (`content:read`, `content:write`, `media:read`, `media:write`, `menus:manage`, `taxonomies:manage`) and a 90-day expiry. The publish block is a Claude Code guard, because EmDash 1.3.1 has no publish scope (D-01 amended). AGENT-02 is verified as amended by D-03: the agent drafts, and the user publishes.

## Results

| Check                                                                                                       | Result                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1: token authenticates over MCP and the CLI (AGENT-01)                                                     | PENDING                                                                                                                                                                                                                               |
| E2: negative control, no token and a malformed token (Finding 5)                                            | No Authorization header: HTTP 401, error code NOT_AUTHENTICATED (message "Not authenticated"). Malformed bearer value: HTTP 401, error code INVALID_TOKEN (message "Invalid or expired token"). Both carry a WWW-Authenticate header. |
| E3: a data edit on a published card lands as a draft and the page keeps the old copy (AGENT-02, D-02)       | PENDING                                                                                                                                                                                                                               |
| E4: the edit reaches the page only after the user publishes (AGENT-02)                                      | PENDING                                                                                                                                                                                                                               |
| E5: schema and settings calls refused by EmDash (AGENT-03)                                                  | PENDING                                                                                                                                                                                                                               |
| E6: publish-class calls and live-write arguments refused by the Claude Code guard, client-side (D-01, D-12) | PENDING                                                                                                                                                                                                                               |
| E7: clean session set up from the README (AGENT-04, D-10)                                                   | PENDING                                                                                                                                                                                                                               |

Other live probes recorded at the same time (executor, no token): `GET /_emdash/api/health` answered 200, `GET /projects/catalog-cms/` answered 200 (a real published card renders), and `GET /projects/agent-access-check/` answered 404 (the probe slug was free before the pass).

## Procedure

Rules for every step. The session never prints or writes the token. Every page check is a `curl` without cookies, because a browser signed in to the admin can be in edit mode and see drafts. Each step writes the observed outcome (the error code and message, or the values seen) into the matching Result cell, replacing the open cell, never the token. A step that does not match its expected outcome is recorded as FAIL with what was seen, and the session stops and tells the user.

R1 (E7, user, new terminal). Export only `EMDASH_TOKEN`, and optionally `EMDASH_MCP_URL`. Change to the repository root and follow README Agent access verbatim. `claude mcp list` shows `emdash` as Connected. Start `claude`, approve the project-scoped emdash server, and `/mcp` shows it connected. Record the statuses seen, whether any OAuth prompt appeared (expected none), and any README step that had to be changed or added. Any such step makes E7 a FAIL. Write the outcome into the E7 Result cell.

R2 (E1). Call `content_list` with collection `projects` and limit 1. Expected: one item. Record the number of items and the first slug in the E1 Result cell.

R3 (E6, first half). List every available tool whose name starts with `mcp__emdash__`. Confirm that `content_publish`, `content_unpublish`, `content_schedule`, `content_unschedule`, `content_delete`, `content_permanent_delete`, `taxonomy_create`, `taxonomy_update` and `taxonomy_delete` are absent. Record which are absent and which, if any, are present, in the E6 Result cell.

R4 (E5, then the E1 CLI half). Call `schema_create_field` with collection `agent_access_check_none`, slug `agent_check`, label "Agent check", type `string`. Call `schema_get_collection` with slug `projects`. Call `settings_update` with title "Zeik Cookson" (the current value, so an accidental success changes nothing). Expected for the three MCP calls: INSUFFICIENT_SCOPE naming `schema:write`, `schema:read` and `settings:manage`. A NOT_FOUND, a validation error or a success on any schema or settings call is a FAIL: stop and tell the user. Then in Bash, with `EMDASH_URL=http://localhost:4321` exported and `EMDASH_TOKEN` inherited, run `npx emdash schema list` (expect a 403 or an insufficient-scope error) and `npx emdash content list projects --json` (expect a project list). Record the three MCP error codes with their messages and the CLI schema refusal in the E5 Result cell, and the CLI project list result (the number of items) in the E1 Result cell.

R5 (create). Call `content_create` with collection `projects`, slug `agent-access-check`, and data title "Agent access check", date "2000-01-01T00:00:00.000Z", project_status "CHECK", status_variant "default", surface "LOCAL", time_label "CHECK", period "CHECK", summary "Throwaway entry for the Phase 4 agent access check.", sub "Agent access check before publish", with no status key. Record the returned status (expect draft). Then run `curl -s -o /dev/null -w '%{http_code}' http://localhost:4321/projects/agent-access-check/` (expect 404, the draft is hidden). Record both values in the E3 Result cell as the starting state.

R6 (E6, second half). Call `content_get` on the entry for its `_rev`. Call `content_update` with collection `projects`, id `agent-access-check`, that `_rev` and status "published". Then call `content_update` with the same identity keys and taxonomies `{ "tag": [] }`. Expected: both are blocked with a message starting `emdash-guard: blocked`. Record both messages in the E6 Result cell and state that the refusal comes from Claude Code, not from the EmDash server. If either call reaches the server, record FAIL and stop.

R7 (user). The user publishes `agent-access-check` in the admin and closes its editor, because an entry open in the editor holds a lock that refuses agent writes. The session waits for the user to say "published".

R8. Run an anonymous `curl` of `http://localhost:4321/projects/agent-access-check/` without cookies. Expected: HTTP 200 and the text "Agent access check before publish". Record the status in the E3 Result cell.

R9 (E3). Call `content_get` for a fresh `_rev`. Call `content_update` with data `{ sub: "Agent access check after publish" }` and that `_rev`, and record the sub in the response. Call `content_get` again and record `data.sub`, `liveData.sub` and whether `draftRevisionId` is set (expected: `data.sub` is the new value, `liveData.sub` is the old value, `draftRevisionId` is set). Call `content_compare` and record whether it reports changes. Then run an anonymous `curl` of the page without cookies: "Agent access check before publish" must be present and "Agent access check after publish" must be absent. If the page already shows the new sub, record FAIL in the E3 Result cell, stop and tell the user: under D-02 the phase does not pass.

R10 (user). The user publishes the pending change in the admin and closes the editor. The session waits for the user to say "published".

R11 (E4). Run an anonymous `curl` of the page without cookies. Expected: "Agent access check after publish" present and "Agent access check before publish" absent. Retry once after a few seconds before recording a FAIL. Record what was seen in the E4 Result cell.

R12 (user cleanup). The user moves `agent-access-check` to the trash in the admin and permanently deletes it from the trash (the delete tools are denied to the agent by design). The session confirms that `curl -s -o /dev/null -w '%{http_code}' http://localhost:4321/projects/agent-access-check/` answers 404.

R13. The session checks that no Result cell from E1 to E7 is still open, that the token appears nowhere in this file, and tells the user to reply "done" to the executor.

## Not covered

The UI-only steps (the token creation form, the publish button, the trash and permanent delete) rest on the user's session and are not independently observable from the executor.
