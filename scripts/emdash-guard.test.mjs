// @ts-check
// Tests for the emdash MCP client config and the PreToolUse publish guard (AGENT-02, AGENT-03, AGENT-04). Every
// hook case runs the exact command registered in .claude/settings.json, so a wrong matcher, command or path fails here.
// run: node --test scripts/emdash-guard.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

const MCP_URL = "${EMDASH_MCP_URL:-http://localhost:4321/_emdash/api/mcp}";
const MCP_AUTH = "Bearer ${EMDASH_TOKEN}";
const PREFIX = "mcp__emdash__";
const GUARDED_TOOLS = [
  "content_publish",
  "content_unpublish",
  "content_schedule",
  "content_unschedule",
  "content_delete",
  "content_permanent_delete",
  "taxonomy_create",
  "taxonomy_update",
  "taxonomy_delete",
];

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

describe("content_update live-write keys", () => {
  /** @type {[string, unknown][]} */
  const liveKeys = [
    ["status", "published"],
    ["publishedAt", "2026-01-01T00:00:00Z"],
    ["seo", { title: "x" }],
    ["bylines", []],
    ["taxonomies", { tag: ["a"] }],
    ["scheduledAt", "2026-01-01T00:00:00Z"],
  ];
  for (const [key, value] of liveKeys) {
    it(`blocks ${key} and names it`, () => {
      const result = runRegisteredHook(
        call("content_update", { ...DRAFT_EDIT, [key]: value }),
      );
      assert.equal(result.status, 2, result.stderr);
      assert.ok(result.stderr.includes(key), result.stderr);
    });
  }

  it("lets slug, locale, overrideLock and migrateBlocks through next to data", () => {
    const result = runRegisteredHook(
      call("content_update", {
        ...DRAFT_EDIT,
        slug: "new-slug",
        locale: "en",
        overrideLock: true,
        migrateBlocks: false,
      }),
    );
    assert.equal(result.status, 0, result.stderr);
  });

  it("blocks tool_input that is an array", () => {
    const result = runRegisteredHook({
      tool_name: `${PREFIX}content_update`,
      tool_input: [],
    });
    assert.equal(result.status, 2, result.stderr);
  });
});

describe("content_create", () => {
  const base = { collection: "projects", data: { title: "t" } };
  /** @type {[string, Record<string, unknown>, number][]} */
  const cases = [
    ["no status", base, 0],
    ["status draft", { ...base, status: "draft" }, 0],
    ["status published", { ...base, status: "published" }, 2],
    ["publishedAt date", { ...base, publishedAt: "2026-01-01T00:00:00Z" }, 2],
    ["publishedAt null", { ...base, publishedAt: null }, 2],
    [
      "taxonomies, seo and bylines on a draft",
      { ...base, taxonomies: { tag: ["a"] }, seo: { title: "x" }, bylines: [] },
      0,
    ],
    ["an unknown key", { ...base, scheduledAt: "2026-01-01" }, 2],
  ];
  for (const [name, input, status] of cases) {
    it(`${name} exits ${status}`, () => {
      const result = runRegisteredHook(call("content_create", input));
      assert.equal(result.status, status, result.stderr);
    });
  }

  it("blocks tool_input null", () => {
    const result = runRegisteredHook({
      tool_name: `${PREFIX}content_create`,
      tool_input: null,
    });
    assert.equal(result.status, 2, result.stderr);
  });
});

describe("guarded tools", () => {
  for (const tool of GUARDED_TOOLS) {
    it(`blocks ${tool}`, () => {
      const result = runRegisteredHook(call(tool, {}));
      assert.equal(result.status, 2, result.stderr);
      assert.match(result.stderr, /emdash-guard: blocked/);
    });
  }
});

describe("deferred tools", () => {
  const deferred = [
    "content_get",
    "content_list",
    "content_compare",
    "content_discard_draft",
    "revision_restore",
    "menu_set_items",
    "media_upload",
    "taxonomy_create_term",
    "schema_create_field",
    "settings_update",
  ];
  for (const tool of deferred) {
    it(`defers ${tool} to the server`, () => {
      const result = runRegisteredHook(call(tool, { collection: "projects" }));
      assert.equal(result.status, 0, result.stderr);
    });
  }

  it("does not route a tool outside the emdash prefix to the hook", () => {
    const result = runRegisteredHook({
      tool_name: "mcp__other__content_publish",
      tool_input: {},
    });
    assert.equal(result.status, 0, result.stderr);
  });
});

describe("fail closed", () => {
  it("blocks input that is not JSON", () => {
    const result = runRegisteredHook("not json");
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /unreadable hook input/);
  });

  it("blocks JSON without a tool_name", () => {
    const result = runRegisteredHook(
      JSON.stringify({ tool_input: { collection: "projects" } }),
    );
    assert.equal(result.status, 2, result.stderr);
  });

  it("blocks when the hook file is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "emdash-guard-test-"));
    try {
      const result = runRegisteredHook(call("content_get", {}), dir);
      assert.equal(result.status, 2, result.stderr);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("deny rules", () => {
  /** @returns {string[]} */
  function denyList() {
    return JSON.parse(readFileSync(".claude/settings.json", "utf8")).permissions
      .deny;
  }

  it("denies exactly the nine guarded tools by bare name", () => {
    const want = GUARDED_TOOLS.map((tool) => `${PREFIX}${tool}`).sort();
    assert.deepEqual([...denyList()].sort(), want);
    assert.ok(!denyList().some((rule) => rule.includes("(")));
  });

  it("also blocks every denied tool through the hook", () => {
    for (const rule of denyList()) {
      const result = runRegisteredHook({ tool_name: rule, tool_input: {} });
      assert.equal(result.status, 2, `${rule}: ${result.stderr}`);
    }
  });
});
