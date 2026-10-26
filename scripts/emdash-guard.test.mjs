// @ts-check
// Tests for the emdash MCP client config and the PreToolUse publish guard (AGENT-02, AGENT-03, AGENT-04). Every
// hook case runs the exact command registered in .claude/settings.json, so a wrong matcher, command or path fails here.
// run: node --test scripts/emdash-guard.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const MCP_URL = "${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}";
const MCP_AUTH = "Bearer ${EMDASH_TOKEN}";
const PREFIX = "mcp__emdash__";

/** @typedef {{ matcher: string, hooks: { type: string, command: string }[] }} HookEntry */

/** @returns {HookEntry[]} */
function registeredEntries() {
  const settings = JSON.parse(readFileSync(".claude/settings.json", "utf8"));
  return settings.hooks.PreToolUse;
}

/**
 * Run the command that Claude Code would run for this payload.
 * @param {Record<string, unknown> | string} payload hook JSON, or raw stdin text
 * @param {string} [projectDir] value for CLAUDE_PROJECT_DIR
 * @returns {{ status: number | null, stderr: string }}
 */
function runRegisteredHook(payload, projectDir = process.cwd()) {
  const toolName =
    typeof payload === "string"
      ? `${PREFIX}content_update`
      : String(payload.tool_name);
  const entry = registeredEntries().find((e) =>
    new RegExp(e.matcher).test(toolName),
  );
  if (!entry) return { status: 0, stderr: "" };
  const result = spawnSync(entry.hooks[0].command, {
    shell: true,
    input: typeof payload === "string" ? payload : JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });
  return { status: result.status, stderr: result.stderr };
}

/**
 * @param {string} tool EmDash tool name without the prefix
 * @param {Record<string, unknown>} toolInput
 * @returns {{ tool_name: string, tool_input: Record<string, unknown> }}
 */
function call(tool, toolInput) {
  return { tool_name: `${PREFIX}${tool}`, tool_input: toolInput };
}

const DRAFT_EDIT = {
  collection: "projects",
  id: "agent-access-check",
  _rev: "r1",
  data: { sub: "x" },
};

describe("client config", () => {
  it("defines one emdash HTTP server with env references and no token", () => {
    const raw = readFileSync(".mcp.json", "utf8");
    const servers = JSON.parse(raw).mcpServers;
    assert.deepEqual(Object.keys(servers), ["emdash"]);
    assert.equal(servers.emdash.type, "http");
    assert.equal(servers.emdash.url, MCP_URL);
    assert.equal(servers.emdash.headers.Authorization, MCP_AUTH);
    assert.ok(!raw.includes("ec_pat_"), "no token value in .mcp.json");
  });

  it("registers the fail-closed hook for every emdash tool", () => {
    const entry = registeredEntries().find((e) =>
      new RegExp(e.matcher).test(`${PREFIX}content_update`),
    );
    assert.ok(entry, "a PreToolUse entry matches mcp__emdash__content_update");
    const command = entry.hooks[0].command;
    assert.ok(command.includes(".claude/hooks/emdash-guard.mjs"), command);
    assert.ok(command.endsWith("|| exit 2"), command);
  });
});

describe("content_update", () => {
  it("lets a data-only edit through", () => {
    const result = runRegisteredHook(call("content_update", DRAFT_EDIT));
    assert.equal(result.status, 0, result.stderr);
  });

  it("blocks a status change and names the key", () => {
    const result = runRegisteredHook(
      call("content_update", { ...DRAFT_EDIT, status: "published" }),
    );
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /emdash-guard: blocked/);
    assert.match(result.stderr, /status/);
  });
});
