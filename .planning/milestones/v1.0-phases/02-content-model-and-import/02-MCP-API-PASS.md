# Phase 2: EmDash MCP API pass (evidence record)

Run by the orchestrating Claude session on 2026-10-26 against the user's running throwaway dev server (`http://localhost:4321/_emdash/api/mcp`, OAuth authorized by the user). Target: the draft entry `schema-check-longest-body` in the rebuilt database. Every change was reverted afterwards. This pass supplements, and does not replace, the user's browser sessions in `02-03-SUMMARY.md`.

Schema at the time of the pass: `date` as `datetime`, `category` as a `select` field and `tags` as a `multiSelect` field. Category and tags became EmDash taxonomies afterwards, so the tag and category results below describe the superseded field schema. The taxonomy pickers were checked only in the browser by the user (reply: "pass").

| Check                                                    | Result                                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `schema_get_collection projects`: `date` type            | `datetime`, required, indexed                                                                     |
| Update status, status variant, time label                | Persisted, read back, reverted                                                                    |
| Date `2025-03-15T00:00:00.000Z`                          | Persisted unchanged (no off-by-one)                                                               |
| Date `"nope"`                                            | Rejected: `VALIDATION_ERROR date: Invalid input`                                                  |
| Date `null`                                              | Rejected: `VALIDATION_ERROR date: Invalid input`                                                  |
| Tags swapped for another listed option (old multiSelect) | Persisted                                                                                         |
| Tag outside the option list (old multiSelect)            | Rejected with the full option list                                                                |
| Stats row without a variant                              | Rejected: `stats.4.variant: Invalid option`                                                       |
| Stats row with variant `purple`                          | Rejected: `stats.1.variant: Invalid option`                                                       |
| Stats edit plus add a row with a variant                 | Persisted                                                                                         |
| Stats remove (via the revert)                            | Four original rows restored                                                                       |
| Body                                                     | Headings and inline code spans returned intact; body not rewritten through the API                |
| `menu_get primary`                                       | Home `/`, Projects `/projects`, About `/about`, in that order                                     |
| `settings_get`                                           | `title` "Zeik Cookson", `tagline`, `social.github`, `social.linkedin`; no timezone setting listed |

Not covered by this pass: the About entry fields, body edits through the API, and anything UI-only (date picker, taxonomy pickers, body editor marks, stats widget). Those rest on the user's browser sessions.
