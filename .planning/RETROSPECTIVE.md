# Retrospective

## Milestone: v1.0 EmDash Migration

**Shipped:** 2026-10-28
**Phases:** 6 | **Plans:** 27 | **Tasks:** 46

### What Was Built

- A measured baseline of the old site, then the EmDash schema and a zero-difference import of 13 projects, About, nav and settings.
- Public pages rendered from EmDash on the Node standalone adapter, identical to the baseline, with a CI guard against new public JavaScript.
- A Dokploy Node container with SQLite on a persistent volume behind the Cloudflare proxy, nightly R2 backups and a restore drill.
- Agent access over OAuth MCP, a live edit/preview/publish/restore loop, and README and CLAUDE.md rewritten for the new workflow.

### What Worked

- Capturing the baseline before changing anything made every later parity claim checkable (17/17 pages).
- Tracer-first plans caught platform surprises early (Node floor raised to 22.22.2, taxonomies over multiSelect).
- Writing owner decisions and overrides into the VERIFICATION and EVIDENCE files kept the record honest.

### What Was Inefficient

- The plan was revised several times mid-flight (Cloudflare Pages dropped, deploy pipeline built then deleted, agent token built then replaced by OAuth). Phase 4 and parts of Phase 5 were largely reworked or removed.
- Phase VALIDATION.md files stayed `draft` until the milestone close, and several named commands (import and verify scripts, guard hook) had been deleted by then, so rows had to be rewritten as superseded.
- VERIFICATION digests went stale as later phases edited shared files.

### Patterns Established

- Owner-attested checks are labelled as such and never marked independently verified.
- Public-JS allowlist plus `check:public-js` as the guard for the no-new-client-JS rule.
- Static `node:test` checks over repo state (seed shape, MCP config, docs claims, Node floor) run in `npm test`.

### Key Lessons

- Settle the deploy and agent-access model before building pipeline code around it.
- Run validate-phase at phase close, not at milestone close.
- Record why a requirement text was superseded at the time, so later audits do not re-flag it.

### Cost Observations

- Not recorded.
