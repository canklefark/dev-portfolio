// @ts-check
// Docs and cleanup (DOCS-01, DOCS-02, DOCS-03): README, CLAUDE.md and stale-reference sweep.
// Reads the repo and runs `git grep`, contacts nothing.
// run: node --test scripts/docs.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
/** @param {string} rel */
const read = (rel) => readFileSync(new URL(rel, root), "utf8");
const readme = read("README.md");
const claude = read("CLAUDE.md");

// Needles are built from parts so this file does not match its own sweep.
const STARTER = "Astro " + "Starter";
const EM_DASH = String.fromCharCode(0x2014);
const SWEEP = [
  "src/" + "content",
  "src/data/" + "about",
  "portfolio-" + "update",
  "scripts/" + "log\\.sh",
  "friend-portfolio-" + "intake",
];

test("README is not the Astro starter template", () => {
  assert.equal(readme.includes(STARTER), false);
});

test("README contains no em dash", () => {
  assert.equal(readme.includes(EM_DASH), false);
});

test("README documents the post-deploy smoke test command", () => {
  assert.ok(
    readme.includes("node scripts/smoke-test.mjs https://dev.zeikcookson.com"),
  );
});

for (const heading of [
  "Local development",
  "Editing content",
  "Deploying",
  "Rolling back",
  "Agent access",
]) {
  test(`README has a "${heading}" heading`, () => {
    const re = new RegExp(`^#{1,6}\\s+${heading}\\s*$`, "m");
    assert.match(readme, re);
  });
}

test("CLAUDE.md states the plugin, draft, Node floor and CI-only rules", () => {
  assert.match(claude, /plugins/i);
  assert.match(claude, /drafts?/i);
  assert.ok(claude.includes(">=22.22.2"));
  assert.match(claude, /push to `main` runs CI only/);
  assert.match(claude, /clicks Deploy/);
});

test("removed log script and friend-portfolio intake doc are gone", () => {
  assert.equal(existsSync(new URL("scripts/log.sh", root)), false);
  assert.equal(
    existsSync(new URL("docs/friend-portfolio-intake.md", root)),
    false,
  );
});

test("no tracked file references removed content paths, skill, script or doc", () => {
  const args = ["grep", "-n", "-I"];
  for (const s of SWEEP) args.push("-e", s);
  args.push(
    "--",
    ".",
    ":!.planning",
    ":!package-lock.json",
    ":!scripts/docs.test.mjs",
    // Recorded exception: read-path.test.mjs names these paths only to assert they are absent.
    ":!scripts/read-path.test.mjs",
  );
  const res = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  assert.equal(res.status, 1, `stale references found:\n${res.stdout}`);
});
