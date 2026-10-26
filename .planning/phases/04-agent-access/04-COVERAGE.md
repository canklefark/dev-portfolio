# API Coverage: Phase 4 Agent Access

No external API integration: Claude Code connects to this site's own EmDash MCP endpoint and CLI, served by the same Astro server; no third-party service, SDK or vendor key is integrated.

EmDash runs inside this Astro server on the same origin against the local SQLite database, and the plan-time detector did not fire on the phase scope. The agent's view of the EmDash tool surface is still recorded, as a decision rather than a coverage matrix: what EmDash refuses for the scoped token, what the Claude Code guard withholds, what lands as a draft and what is live by design is documented in README.md under Agent access (plan 04-02) and proven in 04-AGENT-ACCESS-PASS.md (plan 04-03).
