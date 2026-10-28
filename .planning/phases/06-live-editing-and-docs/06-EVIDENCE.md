# Phase 6: Live editing and docs (evidence record)

Baseline taken on 2026-10-28 against production, https://dev.zeikcookson.com, behind the Cloudflare proxy, entry catalog-cms (project page /projects/catalog-cms/). The owner drives the admin with the one passkey and a private window. A Claude Code session in this repo with the emdash MCP server connected runs the anonymous checks and the MCP calls by following the Procedure below, and fills the Result cells. The executor recorded E1 and runs the final independent checks. No server is started and nothing is pushed. Preview addresses, OAuth values and tokens are never written here; a preview address is always written REDACTED.

## Decisions applied

- D-01: the target is the published project catalog-cms and the field is sub. The owner marker is LIVE EDIT CHECK, appended after a space. The site must end as it started.
- D-02: one agent change over the OAuth MCP server in .mcp.json appends AGENT DRAFT CHECK to sub, using the tools content_get and content_update only, with no status and no overrideLock. The owner publishes. The Phase 4 client guard was removed in commit 882521a, so draft-first is a convention the session follows and nothing refuses a publish.
- D-03: this file is the evidence record, in the style of 05-EVIDENCE.md.
- D-04: the built-in Preview button with the default one-hour token, checked in a signed-out private window.
- D-05: if the preview link fails, the cause is recorded as a FINDING, no route, config or client JS is added, and the owner decides.
- Open Question 6 (06-01 Task 1): restore-then-publish. Restore writes a draft only, so a second Publish is what returns the live page, and the proof is the page hash equal to H0, not the revision count. Selected automatically under auto mode from the plan's auto_select default (the Task 1 gate is blocking, not blocking-human).

## Results

| Check                                                                                                                              | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1: baseline before any edit, executor (ADMIN-04, D-01)                                                                            | PASS: H0 0f23a5617458a21237c3604793edf5cb8ba73705 (two anonymous GETs of /projects/catalog-cms/ gave the same sha1). p.detail-sub reads: SvelteKit 2 app backed by SQLite, deployed in Docker on a Dokploy VPS, with async product/FAQ sync to a WordPress REST + ACF backend. LIVE EDIT CHECK count 0 and AGENT DRAFT CHECK count 0. curl -sI answered HTTP/2 200 with cf-cache-status DYNAMIC and no cache-control header. Origin main commit d38f5c98b61d7e30bc2466c069a9a8d01db1bc92 (git ls-remote origin refs/heads/main). smoke-test: PASS |
| E2: the owner saves the tweak as a draft and the public page is unchanged (ADMIN-04)                                               | PASS: after the owner saved the draft, the anonymous page hash is 0f23a5617458a21237c3604793edf5cb8ba73705, equal to H0, with LIVE EDIT CHECK count 0 and AGENT DRAFT CHECK count 0. Revisions panel listed 1 revision before the edit (11:57AM the day before, current version, published). |
| E3: the preview link opens the draft signed out while the public page shows the published copy (ADMIN-05, D-04, D-05)              | PASS: in the signed-out private window the owner saw LIVE EDIT CHECK in the Sub on the preview link, and the public /projects/catalog-cms/ page ended with "ACF backend." with no marker. curl -sI on the preview address (REDACTED) gave HTTP/2 200, cache-control private, no-store, cf-cache-status DYNAMIC. curl -s of it showed LIVE EDIT CHECK count 1. Path shape is /projects/catalog-cms (the slug, not an id). |
| E4: the owner publishes and the next anonymous request shows the change with no rebuild, push or deploy (ADMIN-04, D-01)           | PASS: after the owner published, the next anonymous GET of /projects/catalog-cms/ gave sha1 403c220d58643ef27d8af715f01cc7d7bd480279 (different from H0) with LIVE EDIT CHECK count 1. git ls-remote origin refs/heads/main still returns d38f5c98b61d7e30bc2466c069a9a8d01db1bc92, equal to E1. The owner confirmed no Deploy was clicked in Dokploy. |
| E5: Claude drafts a change over the OAuth MCP connection and it lands as a pending revision (D-02)                                 | PASS: tools called were mcp__emdash__content_get, mcp__emdash__content_update (data with only sub, the _rev from the read, no status, no overrideLock) and mcp__emdash__content_get again. No ENTRY_LOCKED. After the write, data.sub ends with AGENT DRAFT CHECK, liveData.sub ends with LIVE EDIT CHECK (trailing space, no AGENT DRAFT CHECK), item status stays published and draftRevisionId is set. Note: the owner-saved Sub had a trailing space after LIVE EDIT CHECK, so the agent text follows a double space, which HTML collapses. |
| E6: the public page is unchanged after the agent draft (D-02)                                                                      | PASS: anonymous GET of /projects/catalog-cms/ after the agent draft gave sha1 403c220d58643ef27d8af715f01cc7d7bd480279, the same as after the E4 publish, with AGENT DRAFT CHECK count 0 and LIVE EDIT CHECK count 1. |
| E7: the owner publishes the agent draft and the public page shows it (D-02)                                                        | PASS: after the owner published the agent draft, the anonymous GET of /projects/catalog-cms/ gave sha1 c83d6548811346bd828c1f50516839a158b5cdce with AGENT DRAFT CHECK count 1 and LIVE EDIT CHECK count 1. |
| E8: Restore makes the original revision a draft only and the public page is unchanged (ADMIN-04, Open Question 6)                  | PASS: after the owner restored the oldest revision, the anonymous GET of /projects/catalog-cms/ gave sha1 c83d6548811346bd828c1f50516839a158b5cdce, equal to the E7 hash, with AGENT DRAFT CHECK count 1 and LIVE EDIT CHECK count 1. Restore wrote a draft only. |
| E9: the owner publishes the restored revision, the page hash equals H0 and the smoke test passes (ADMIN-04, D-01, Open Question 6) | PASS: after the owner published the restored revision, the anonymous GET of /projects/catalog-cms/ gave sha1 0f23a5617458a21237c3604793edf5cb8ba73705, equal to H0 (0f23a5617458a21237c3604793edf5cb8ba73705), with LIVE EDIT CHECK count 0 and AGENT DRAFT CHECK count 0. node scripts/smoke-test.mjs https://dev.zeikcookson.com printed smoke-test: PASS. git ls-remote origin refs/heads/main still returns d38f5c98b61d7e30bc2466c069a9a8d01db1bc92, equal to E1. |

## Procedure

Definition: the anonymous page check is `curl -s https://dev.zeikcookson.com/projects/catalog-cms/` with no cookie, piped to `shasum` for the hash and to `grep -c` for each marker (LIVE EDIT CHECK and AGENT DRAFT CHECK). H0 is the hash in row E1. Every session step writes the observed values into the named row, starting with PASS, FAIL or FINDING, and replaces the open Result cell. Never write a preview address, a token or an OAuth value into this file.

P0 (session): confirm /mcp lists emdash as connected and that the mcp__emdash__content_get tool is available. If not, ask the owner to authenticate with /mcp and wait. Run the anonymous page check and confirm the hash equals H0 from E1. If it does not, stop and tell the owner the card changed since the baseline. Optional owner pre-check (research Pitfall 2), read-only, in the Dokploy Docker terminal of the portfolio app: `cd /app`, then
`node -e 'const {DatabaseSync}=require("node:sqlite");const db=new DatabaseSync("data/emdash.db",{readOnly:true});console.log(db.prepare("select slug, url_pattern from _emdash_collections where slug = ?").get("projects"))'`
and expect url_pattern /projects/{slug}. If skipped, the path shape seen in P4 stands for it.

P1 (owner): open catalog-cms in the admin, open its Revisions panel and tell the session how many revisions it lists. Append a space and LIVE EDIT CHECK to the Sub field, change nothing else, Save, do not publish, and say "saved".

P2 (session): run the anonymous page check. Expect the LIVE EDIT CHECK count 0 and the hash equal to H0. Fill E2 with both values and the revision count.

P3 (owner): click Preview in the editor. A new tab opens on the signed preview link. Copy that tab's address. In the private window open it and confirm the Sub shows LIVE EDIT CHECK. In the same private window open https://dev.zeikcookson.com/projects/catalog-cms/ and confirm the Sub ends with "ACF backend." without the marker. Paste the preview address to the session in chat only.

P4 (session): with that address, run `curl -sI` on it and note the status (expect 200), cache-control (expect private, no-store) and cf-cache-status (expect anything but HIT). Run `curl -s` on it and count LIVE EDIT CHECK (expect at least 1). Note whether its path is /projects/catalog-cms (the slug) or an id. Fill E3 with the owner's two private-window observations, the three header values, the marker count and the path shape, and write the address as REDACTED. If the link answers 404, opens an id-shaped path, lacks private, no-store, or does not show the draft, start E3 with FINDING and the cause (D-05), change no code or config, and continue with P5 so the site still returns to its start state.

P5 (owner): click Publish, then close the editor tab. An open editor holds a lock that refuses the agent write in P7.

P6 (session): run the anonymous page check. Expect the LIVE EDIT CHECK count at least 1 and a hash different from H0. Run `git ls-remote origin refs/heads/main` and confirm it equals the commit in E1. Ask the owner to confirm no Deploy was clicked in Dokploy. Fill E4.

P7 (session, D-02): call mcp__emdash__content_get with collection projects and id catalog-cms. Note _rev and data.sub (it ends with LIVE EDIT CHECK). Then call mcp__emdash__content_update with collection projects, id catalog-cms, that _rev, and data containing only sub, set to that data.sub plus a space and AGENT DRAFT CHECK. Pass no status, no overrideLock and no other key. Then call content_get again: data.sub ends with AGENT DRAFT CHECK, liveData.sub does not, and draftRevisionId is set. If the write fails with ENTRY_LOCKED, ask the owner to close the editor and retry. Never set overrideLock. Never call a publish, unpublish, schedule or delete tool. Fill E5 with the tool names called, the data.sub and liveData.sub endings and that draftRevisionId is set, with no token.

P8 (session): run the anonymous page check. Expect the AGENT DRAFT CHECK count 0 and the LIVE EDIT CHECK count at least 1. Fill E6. If AGENT DRAFT CHECK is on the page, start E6 with FAIL and stop: the agent change went live without a publish.

P9 (owner): open catalog-cms in the admin, which shows the unpublished change. Publish it and close the editor.

P10 (session): run the anonymous page check. Expect the AGENT DRAFT CHECK count at least 1. Fill E7.

P11 (owner): open the Revisions panel of catalog-cms and Restore the oldest revision, the one whose Sub ends with "ACF backend." and carries neither marker. The admin says it is now your draft. Do not publish yet.

P12 (session): run the anonymous page check. Expect the AGENT DRAFT CHECK count still at least 1, because Restore writes a draft only (research Pitfall 1). Fill E8.

P13 (owner): click Publish and close the editor.

P14 (session): run the anonymous page check. Expect both marker counts 0 and the hash equal to H0. Run `node scripts/smoke-test.mjs https://dev.zeikcookson.com` and expect smoke-test: PASS. Run `git ls-remote origin refs/heads/main` and confirm it still equals E1's commit. Fill E9 with H0 written out again. Then check that no Result cell is still open, that no preview address or token appears in the file, and that the file has no em or en dash. Tell the owner to reply "done" to the executor.

## Not covered

- catalog-cms keeps the extra revisions and a newer updated time, so "exactly as it started" is proven by the page hash and the smoke test, not by the revision count (research Pitfall 8).
- Preview expiry past one hour and a token for another entry were not tested (D-04 keeps the default).
- Draft-first is a convention because the OAuth session holds the owner's admin rights and nothing refuses a publish (D-02, research Open Question 1).
- "No rebuild" rests on the owner's report that no Deploy was clicked and on origin main being unchanged.
- The url_pattern pre-check in P0 is optional.
- Cloudflare behavior is read from response headers only.
