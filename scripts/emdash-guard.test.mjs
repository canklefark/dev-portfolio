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
  "taxonomy_delete_term",
  "menu_delete",
  "menu_set_items",
  "media_delete",
  "byline_delete",
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

  it("registers the hook for the Bash tool", () => {
    const entry = registeredEntries().find((e) =>
      new RegExp(e.matcher).test("Bash"),
    );
    assert.ok(entry, "a PreToolUse entry matches Bash");
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

  // The backstop: a tool name the list does not carry, but with a publish-class or delete word in it.
  for (const tool of [
    "content_archive_delete",
    "media_bulk_delete",
    "collection_publish_all",
    "delete_everything",
  ]) {
    it(`blocks the unlisted destructive-looking tool ${tool}`, () => {
      const result = runRegisteredHook(call(tool, {}));
      assert.equal(result.status, 2, result.stderr);
      assert.match(result.stderr, /emdash-guard: blocked/);
    });
  }
});

/**
 * @param {string} command
 * @returns {{ tool_name: string, tool_input: { command: string } }}
 */
function bash(command) {
  return { tool_name: "Bash", tool_input: { command } };
}

describe("Bash and the emdash CLI", () => {
  const draftUpdate =
    'npx emdash content update projects SLUG --draft --rev REV --data \'{"sub":"x"}\'';

  /** @type {[string, string][]} */
  const blocked = [
    ["publish", "npx emdash content publish projects SLUG"],
    ["unpublish", "npx emdash content unpublish projects SLUG"],
    ["schedule", "npx emdash content schedule projects SLUG --at 2027-01-01"],
    ["delete", "npx emdash content delete projects SLUG"],
    ["media delete", "npx emdash media delete MEDIA_ID"],
    ["a bare emdash bin", "emdash content publish projects SLUG"],
    ["the em alias", "em content publish projects SLUG"],
    ["a versioned bin", "npx -y emdash@latest content delete projects SLUG"],
    [
      "the dist entry",
      "node node_modules/emdash/dist/cli/index.mjs content publish projects SLUG",
    ],
    [
      "env variables first",
      "EMDASH_URL=http://x npx emdash content publish p s",
    ],
    ["a flag before the subcommand", "npx emdash content --json publish p s"],
    [
      "create without --draft",
      "npx emdash content create projects --data '{}'",
    ],
    [
      "update without --draft",
      "npx emdash content update projects SLUG --rev REV --data '{}'",
    ],
    [
      "--draft only in a comment",
      "npx emdash content update p s --rev r # --draft",
    ],
    [
      "--draft in a different command",
      "npx emdash content update p s --rev r; echo --draft",
    ],
    ["--override-lock", `${draftUpdate} --override-lock`],
    ["a chained command", "ls && npx emdash content publish projects SLUG"],
    [
      "a command substitution",
      "echo $(npx emdash content publish projects SLUG)",
    ],
    ["bash -c", 'bash -c "npx emdash content publish projects SLUG"'],
    ["bash -lc", "bash -lc 'npx emdash content delete projects SLUG'"],
    ["eval", 'eval "npx emdash content publish projects SLUG"'],
    ["an unknown content subcommand", "npx emdash content purge projects SLUG"],
  ];
  for (const [name, command] of blocked) {
    it(`blocks ${name}`, () => {
      const result = runRegisteredHook(bash(command));
      assert.equal(result.status, 2, `${command}: ${result.stderr}`);
      assert.match(result.stderr, /emdash-guard: blocked Bash/);
    });
  }

  /** @type {[string, string][]} */
  const allowed = [
    ["content list", "npx emdash content list projects --json"],
    ["content get", "npx emdash content get projects SLUG --published --json"],
    ["a draft update", draftUpdate],
    [
      "a draft create",
      'npx emdash content create projects --draft --data \'{"title":"t"}\'',
    ],
    [
      "a draft update across lines",
      "npx emdash content update p s \\\n  --rev r --draft",
    ],
    [
      "a draft update with a semicolon inside the data",
      'npx emdash content update p s --rev r --data \'{"a":"x; y"}\' --draft',
    ],
    ["content restore", "npx emdash content restore projects SLUG"],
    ["media list", "npx emdash media list --json"],
    ["a taxonomy term", "npx emdash taxonomy add-term tag --name x"],
    ["whoami", "npx emdash whoami"],
    ["an unrelated command", "ls -la && git status"],
    ["the guard's own test", "node --test scripts/emdash-guard.test.mjs"],
    [
      "a commit message that names a publish command",
      'git commit -m "docs: npx emdash content publish is blocked"',
    ],
  ];
  for (const [name, command] of allowed) {
    it(`lets ${name} through`, () => {
      const result = runRegisteredHook(bash(command));
      assert.equal(result.status, 0, `${command}: ${result.stderr}`);
    });
  }

  for (const [name, toolInput] of [
    ["no command", {}],
    ["a command that is not a string", { command: 42 }],
    ["tool_input that is null", null],
    ["tool_input that is an array", []],
  ]) {
    it(`blocks Bash with ${name}`, () => {
      const result = runRegisteredHook({
        tool_name: "Bash",
        tool_input: toolInput,
      });
      assert.equal(result.status, 2, result.stderr);
      assert.match(result.stderr, /Bash tool_input has no command string/);
    });
  }
});

describe("server name", () => {
  for (const server of ["claude_ai_EmDash", "plugin_emdash_emdash", "EMDASH"]) {
    it(`guards ${server} like emdash`, () => {
      const blocked = runRegisteredHook({
        tool_name: `mcp__${server}__content_publish`,
        tool_input: {},
      });
      assert.equal(blocked.status, 2, blocked.stderr);
      const live = runRegisteredHook({
        tool_name: `mcp__${server}__content_update`,
        tool_input: { ...DRAFT_EDIT, status: "published" },
      });
      assert.equal(live.status, 2, live.stderr);
      const draft = runRegisteredHook({
        tool_name: `mcp__${server}__content_update`,
        tool_input: DRAFT_EDIT,
      });
      assert.equal(draft.status, 0, draft.stderr);
    });
  }

  it("defers a server without emdash in its name, even if the hook is run on it", () => {
    const [command] = registeredEntries().flatMap((e) =>
      e.hooks.map((h) => h.command),
    );
    const result = runHookCommand(
      command,
      JSON.stringify({
        tool_name: "mcp__other__content_publish",
        tool_input: {},
      }),
      ROOT,
    );
    assert.equal(result.status, 0, result.stderr);
  });
});

describe("deferred tools", () => {
  const deferred = [
    "content_get",
    "content_list",
    "content_compare",
    "content_discard_draft",
    "content_restore",
    "content_duplicate",
    "revision_restore",
    "menu_create",
    "menu_update",
    "media_upload",
    "media_get",
    "taxonomy_create_term",
    "taxonomy_update_term",
    "byline_create",
    "schema_create_field",
    "schema_delete_collection",
    "settings_update",
    "site_import_start",
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

  const mcpRules = () => denyList().filter((rule) => rule.startsWith("mcp__"));
  const bashRules = () => denyList().filter((rule) => rule.startsWith("Bash("));

  it("denies exactly the guarded tools by bare name", () => {
    const want = GUARDED_TOOLS.map((tool) => `${PREFIX}${tool}`).sort();
    assert.deepEqual([...mcpRules()].sort(), want);
    assert.ok(!mcpRules().some((rule) => rule.includes("(")));
  });

  it("also blocks every denied tool through the hook", () => {
    for (const rule of mcpRules()) {
      const result = runRegisteredHook({ tool_name: rule, tool_input: {} });
      assert.equal(result.status, 2, `${rule}: ${result.stderr}`);
    }
  });

  it("denies the publish-class CLI commands in both bin spellings", () => {
    for (const bin of ["npx emdash", "emdash"]) {
      for (const sub of ["publish", "unpublish", "schedule", "delete"]) {
        assert.ok(
          bashRules().includes(`Bash(${bin} content ${sub} *)`),
          `${bin} content ${sub}`,
        );
      }
      assert.ok(bashRules().includes(`Bash(${bin} media delete *)`));
    }
    assert.ok(bashRules().includes("Bash(curl *_emdash*)"));
  });

  it("denies Edit and Write on the guard, the project settings and .mcp.json", () => {
    // /.claude/** covers .claude/hooks/emdash-guard.mjs, .claude/settings.json and settings.local.json.
    for (const tool of ["Edit", "Write"]) {
      for (const path of ["/.claude/**", "/.mcp.json"]) {
        assert.ok(denyList().includes(`${tool}(${path})`), `${tool}(${path})`);
      }
    }
  });

  it("also blocks every denied CLI command through the hook", () => {
    for (const rule of bashRules().filter((r) => !r.startsWith("Bash(curl"))) {
      const command = rule
        .slice("Bash(".length, -")".length)
        .replace(/ \*$/, " projects SLUG");
      const result = runRegisteredHook(bash(command));
      assert.equal(result.status, 2, `${rule}: ${result.stderr}`);
    }
  });
});
