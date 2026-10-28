// @ts-check
// Agent access config (AGENT-04): OAuth via committed .mcp.json, no token, no guard hook.
// Reads the repo and runs `git grep`, contacts nothing.
// run: node --test scripts/mcp-config.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
/** @param {string} rel */
const read = (rel) => readFileSync(new URL(rel, root), "utf8");
const mcp = JSON.parse(read(".mcp.json"));

// Needles are built from parts so this file does not match its own grep.
const TOKEN_PREFIX = "ec_pat" + "_";
const GUARD = "emdash" + "-guard";

/** @param {string} needle */
const gitGrep = (needle) => {
  try {
    return execFileSync(
      "git",
      [
        "grep",
        "-n",
        "-i",
        "-e",
        needle,
        "--",
        ".",
        ":!.planning",
        ":!node_modules",
      ],
      { cwd: root, encoding: "utf8" },
    );
  } catch (err) {
    // git grep exits 1 when nothing matches
    if (/** @type {{status?: number}} */ (err).status === 1) return "";
    throw err;
  }
};

test(".mcp.json declares exactly one server, emdash", () => {
  assert.deepEqual(Object.keys(mcp), ["mcpServers"]);
  assert.deepEqual(Object.keys(mcp.mcpServers), ["emdash"]);
});

test("emdash server is an https URL ending /_emdash/api/mcp", () => {
  const url = new URL(mcp.mcpServers.emdash.url);
  assert.equal(url.protocol, "https:");
  assert.ok(
    url.pathname.endsWith("/_emdash/api/mcp"),
    `unexpected path ${url.pathname}`,
  );
});

test("emdash server carries no env, headers, command or token fields", () => {
  const server = mcp.mcpServers.emdash;
  for (const key of ["env", "headers", "command", "args", "token", "apiKey"]) {
    assert.equal(key in server, false, `${key} must not be present`);
  }
  assert.deepEqual(Object.keys(server).sort(), ["type", "url"]);
});

test("no tracked file outside .planning contains a PAT-prefixed secret", () => {
  assert.equal(gitGrep(TOKEN_PREFIX), "");
});

test("no .claude/hooks directory exists", () => {
  assert.equal(existsSync(new URL(".claude/hooks", root)), false);
});

test("guard hook is not referenced by package.json, CI, README or CLAUDE.md", () => {
  const files = [
    "package.json",
    "README.md",
    "CLAUDE.md",
    ".github/workflows/ci.yml",
  ];
  for (const f of files) {
    assert.equal(
      read(f).toLowerCase().includes(GUARD),
      false,
      `${f} references the removed guard`,
    );
  }
});
