# Phase 6: Live Editing and Docs - Context

**Gathered:** 2026-10-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove the live editing loop on the deployed site (draft, preview, publish, revision restore, plus one agent draft over MCP), and bring the repo docs in line with the EmDash model: rewrite README, make surgical CLAUDE.md edits, and remove the leftovers of the markdown workflow. No new features, no redesign, no new client JS.

</domain>

<decisions>
## Implementation Decisions

### Live edit exercise (ADMIN-04)

- **D-01:** Test target is an existing published project card with a throwaway tweak (a small field such as a summary sentence). Publish it, confirm the public page changes with no rebuild or git push, then restore the previous revision so the site ends exactly as it started.
- **D-02:** Both drivers. The user runs draft, preview, publish and restore in the admin. Separately Claude makes one draft edit over the OAuth MCP connection on production to confirm it lands as a pending revision (live page unchanged, Phase 4 D-02), and the user publishes it. Claude does not publish (Phase 4 D-01 guard stays).
- **D-03:** Evidence goes in a phase evidence file in the style of `05-EVIDENCE.md` (exact filename is Claude's discretion).

### Preview link (ADMIN-05)

- **D-04:** Use EmDash's built-in preview link as intended. Verify signed-out in a private window with default token expiry: the draft shows at the preview link while the public URL still shows the published copy.
- **D-05:** If the built-in link does not work on the Node/Dokploy deploy or behind the Cloudflare proxy, record it as a finding with the cause in the evidence file and stop. No custom preview route, no new client JS. Config-only fixes are not authorized either unless the user asks after seeing the finding. The user decides the follow-up. — **Reversibility:** reversible, evidence only.

### README (DOCS-02)

- **D-06:** Full replacement of the Astro starter README, kept short, no marketing copy. Sections: what this is, local dev, content editing in EmDash, deploy steps (merge to `main`, click Deploy in Dokploy, run `node scripts/smoke-test.mjs https://dev.zeikcookson.com`), rollback rule, agent access.
- **D-07:** Agent access is OAuth only: the committed `.mcp.json`, draft-first rule, and the client-side publish deny guard. Drop the Phase 4 PAT, env-var and 90-day rotation text (superseded in Phase 5 D-12). The README lacks the Agent access section Phase 4 D-09 planned, so this phase writes it fresh.
- **D-08:** Rollback rule as in DOCS-02: revert on `main` and redeploy for bad code; restore the nightly R2 volume backup for a bad migration. Link the rehearsed restore evidence (`05-EVIDENCE.md`) rather than copying the steps.
- **D-09:** README follows the project copy rules: no em dashes, first-person natural prose where it is prose.

### CLAUDE.md (DOCS-01)

- **D-10:** Surgical edits to existing sections only. The Deployment paragraph is already done (Phase 5). Add only what is missing: Node >=22.22.2 and the Node 24 image (already partly present, confirm), admin-only client JS exemption, no-plugins rule, draft-first agent rule, content edited in EmDash. Keep the file short.

### Stale workflow cleanup (DOCS-03)

- **D-11:** Delete `~/.claude/skills/portfolio-update/` (outside the repo; it writes `src/content` markdown and is obsolete). User decision: delete rather than rewrite or flag. Also remove its entry from any skill lock/index if one references it (`skills-lock.json` showed no reference on inspection).
- **D-12:** Delete `scripts/log.sh` (writes to `src/content/logbook`, which no longer exists; not referenced from package.json, CI or CLAUDE.md, not sourced from the shell rc files checked) and `docs/friend-portfolio-intake.md` (user decision; standalone questionnaire not referenced anywhere in the repo). Planner re-greps for references immediately before deleting and stops if something live points at either file.
- **D-13:** No CI guard. One-time grep sweep for `src/content`, `src/data/about` and `portfolio-update` outside `.planning/`, result recorded in the evidence file. `.emdash/seed.json` matched on "frontmatter" and is inspected, not assumed stale.

### Claude's Discretion

- Evidence file name and table layout.
- Which published card and which field is the throwaway tweak target.
- Exact wording of README and CLAUDE.md additions within the decisions above.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope
- `.planning/ROADMAP.md` (Phase 6 section) - goal and four success criteria
- `.planning/REQUIREMENTS.md` - ADMIN-04, ADMIN-05, DOCS-01, DOCS-02, DOCS-03
- `.planning/PROJECT.md` - validated decisions, constraints, Spike Findings, named gates

### Prior decisions that constrain this phase
- `.planning/phases/04-agent-access/04-CONTEXT.md` - draft-first rule (D-01, D-02, D-12), publish guard; PAT parts superseded
- `.planning/phases/05-dokploy-deploy-and-cutover/05-CONTEXT.md` - manual deploys (D-04, D-15), OAuth MCP (D-12), backups to R2 (D-13, D-14, D-17)
- `.planning/phases/05-dokploy-deploy-and-cutover/05-EVIDENCE.md` - evidence format to copy and restore rehearsal to link

### Repo files in scope
- `CLAUDE.md` - engineering standards, edited surgically
- `README.md` - still the Astro starter, replaced
- `.mcp.json` - committed OAuth MCP config documented in README
- `scripts/smoke-test.mjs` - run after each deploy
- `scripts/log.sh`, `docs/friend-portfolio-intake.md` - deleted (D-12)
- `.emdash/seed.json` - inspected for stale markdown-workflow references
- `~/.claude/skills/portfolio-update/SKILL.md` - deleted (D-11)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/smoke-test.mjs`: post-deploy check, referenced in README deploy steps
- `05-EVIDENCE.md`: template for the Phase 6 evidence file
- `.mcp.json`: the OAuth MCP server config to document

### Established Patterns
- Evidence-file-per-phase with pass/fail rows and recorded commands
- Copy rules: no em dashes, natural prose, no fabricated dates
- Never run dev servers or `git push` without being asked; owner clicks Deploy in Dokploy

### Integration Points
- Production at https://dev.zeikcookson.com behind the Cloudflare proxy: preview links and revision restore run against it
- EmDash admin at the production hostname (passkey login) and the MCP endpoint `/_emdash/api/mcp`

</code_context>

<specifics>
## Specific Ideas

- The site must end the live edit exercise exactly as it started (restore the prior revision).
- Researcher should confirm what EmDash 1.3.x provides for preview links on Node standalone and whether the Cloudflare proxy caches the preview response.

</specifics>

<deferred>
## Deferred Ideas

- Rewrite a `portfolio-update`-style workflow on top of the EmDash MCP (drafts for the user to publish). Deleted for now; revisit as its own piece of work if wanted.
- Custom preview route if the built-in link fails (D-05): only if the user asks after the finding.
- CI guard against references to removed content files: declined (D-13).

</deferred>

---

*Phase: 6-Live Editing and Docs*
*Context gathered: 2026-10-28*
