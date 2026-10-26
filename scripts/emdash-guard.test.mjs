// @ts-check
// Tests for the emdash MCP client config and the PreToolUse publish guard (AGENT-02, AGENT-03, AGENT-04). Every
// hook case runs the exact command registered in .claude/settings.json, so a wrong matcher, command or path fails here.
// run: node --test scripts/emdash-guard.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

// Paths come from this file's location, never from the process cwd.
const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SETTINGS_PATH = join(ROOT, ".claude", "settings.json");

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
  const settings = JSON.parse(readFileSync(SETTINGS_PATH, "utf8"));
  return settings.hooks.PreToolUse;
}

/**
 * Run one registered hook command the way Claude Code does. The cwd is a directory outside the
 * repository, so a command that relied on the working directory would fail here.
 * @param {string} command
 * @param {string} input raw stdin text
 * @param {string} projectDir value for CLAUDE_PROJECT_DIR
 * @returns {{ status: number | null, stderr: string }}
 */
function runHookCommand(command, input, projectDir) {
  const result = spawnSync(command, {
    shell: true,
    input,
    encoding: "utf8",
    cwd: tmpdir(),
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });
  return { status: result.status, stderr: result.stderr };
}

/**
 * Run every hook command that Claude Code would run for this payload. Claude Code runs all matching
 * entries and all hooks inside them, and one exit 2 blocks the call, so the first non-zero result wins.
 * The runner throws when nothing matches, so a typo in a matcher cannot make a case pass vacuously.
 * @param {Record<string, unknown> | string} payload hook JSON, or raw stdin text
 * @param {{ projectDir?: string, expectMatch?: boolean, matchAs?: string }} [options] matchAs is
 *   the tool name used to pick entries when the payload has no usable tool_name
 * @returns {{ status: number | null, stderr: string }}
 */
function runRegisteredHook(
  payload,
  { projectDir = ROOT, expectMatch = true, matchAs } = {},
) {
  const toolName =
    matchAs ??
    (typeof payload === "string"
      ? `${PREFIX}content_update`
      : String(payload.tool_name));
  const commands = registeredEntries()
    .filter((e) => new RegExp(e.matcher).test(toolName))
    .flatMap((e) => e.hooks.map((h) => h.command));
  if (commands.length === 0) {
    if (expectMatch) {
      throw new Error(`no registered hook matches ${toolName}`);
    }
    return { status: 0, stderr: "" };
  }
  const input = typeof payload === "string" ? payload : JSON.stringify(payload);
  const results = commands.map((command) =>
    runHookCommand(command, input, projectDir),
  );
  return results.find((r) => r.status !== 0) ?? results[0];
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
    const raw = readFileSync(join(ROOT, ".mcp.json"), "utf8");
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
  });

  it("registers only fail-closed guard commands, in every entry and hook", () => {
    const entries = registeredEntries();
    assert.ok(entries.length > 0);
    for (const entry of entries) {
      assert.ok(entry.hooks.length > 0, `${entry.matcher} has no hooks`);
      for (const hook of entry.hooks) {
        assert.equal(hook.type, "command", entry.matcher);
        assert.ok(
          hook.command.includes(".claude/hooks/emdash-guard.mjs"),
          hook.command,
        );
        assert.ok(hook.command.endsWith("|| exit 2"), hook.command);
      }
    }
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

  it("blocks status draft, which unpublishes a published entry", () => {
    const result = runRegisteredHook(
      call("content_update", { ...DRAFT_EDIT, status: "draft" }),
    );
    assert.equal(result.status, 2, result.stderr);
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

  it("lets slug, locale and migrateBlocks through next to data", () => {
    const result = runRegisteredHook(
      call("content_update", {
        ...DRAFT_EDIT,
        slug: "new-slug",
        locale: "en",
        migrateBlocks: false,
      }),
    );
    assert.equal(result.status, 0, result.stderr);
  });

  for (const value of [true, false]) {
    it(`blocks overrideLock ${value} with the lock explanation`, () => {
      const result = runRegisteredHook(
        call("content_update", { ...DRAFT_EDIT, overrideLock: value }),
      );
      assert.equal(result.status, 2, result.stderr);
      assert.match(result.stderr, /overrideLock overrides the editor's lock/);
    });
  }

  for (const [name, toolInput] of [
    ["an array", []],
    ["a string", "projects"],
    ["null", null],
  ]) {
    it(`blocks tool_input that is ${name}`, () => {
      const result = runRegisteredHook({
        tool_name: `${PREFIX}content_update`,
        tool_input: toolInput,
      });
      assert.equal(result.status, 2, result.stderr);
      assert.match(result.stderr, /tool_input is not an object/);
    });
  }
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

  it("names publishedAt as the refused key", () => {
    const result = runRegisteredHook(
      call("content_create", { ...base, publishedAt: "2026-01-01T00:00:00Z" }),
    );
    assert.equal(result.status, 2, result.stderr);
    assert.match(
      result.stderr,
      /publishedAt is not a key a new draft may carry/,
    );
  });

  for (const [name, toolInput] of [
    ["null", null],
    ["an array", []],
    ["a string", "projects"],
  ]) {
    it(`blocks tool_input that is ${name}`, () => {
      const result = runRegisteredHook({
        tool_name: `${PREFIX}content_create`,
        tool_input: toolInput,
      });
      assert.equal(result.status, 2, result.stderr);
      assert.match(result.stderr, /tool_input is not an object/);
    });
  }
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
    const result = runRegisteredHook(
      { tool_name: "mcp__other__content_publish", tool_input: {} },
      { expectMatch: false },
    );
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

  it("blocks a tool_name that is not a string", () => {
    const result = runRegisteredHook(
      { tool_name: 42, tool_input: {} },
      { matchAs: `${PREFIX}content_get` },
    );
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /no tool_name/);
  });

  it("blocks when the hook file is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "emdash-guard-test-"));
    try {
      const result = runRegisteredHook(call("content_get", {}), {
        projectDir: dir,
      });
      assert.equal(result.status, 2, result.stderr);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("blocks when the hook file exits 1 mid-run", () => {
    const dir = mkdtempSync(join(tmpdir(), "emdash-guard-test-"));
    try {
      mkdirSync(join(dir, ".claude", "hooks"), { recursive: true });
      writeFileSync(
        join(dir, ".claude", "hooks", "emdash-guard.mjs"),
        "process.exit(1);\n",
      );
      const result = runRegisteredHook(call("content_get", {}), {
        projectDir: dir,
      });
      assert.equal(result.status, 2, result.stderr);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("blocks malformed input in every registered hook command", () => {
    for (const entry of registeredEntries()) {
      for (const hook of entry.hooks) {
        const result = runHookCommand(hook.command, "not json", ROOT);
        assert.equal(result.status, 2, `${entry.matcher}: ${result.stderr}`);
      }
    }
  });

  it("makes the runner fail loudly when no entry matches", () => {
    assert.throws(
      () => runRegisteredHook({ tool_name: "NoSuchTool", tool_input: {} }),
      /no registered hook matches NoSuchTool/,
    );
  });
});

describe("deny rules", () => {
  /** @returns {string[]} */
  function denyList() {
    return JSON.parse(readFileSync(SETTINGS_PATH, "utf8")).permissions.deny;
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
