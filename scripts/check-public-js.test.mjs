// @ts-check
// Committed deliberate failing case for the public-JS allowlist check (D-11): fixtures are built at
// test time, so no hash is computed by hand.
// run: node --test scripts/check-public-js.test.mjs
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
import { dirname, join } from "node:path";
import { describe, it } from "node:test";

const CLEAN_SCRIPT = '<script>console.log("ok")</script>';

/**
 * @param {string} body markup placed inside <body>
 * @returns {string}
 */
function html(body) {
  return `<!DOCTYPE html><html><head><title>t</title></head><body>${body}</body></html>`;
}

/**
 * @param {string} dir
 * @param {string} file path under dir
 * @param {string} content
 */
function put(dir, file, content) {
  const target = join(dir, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

/**
 * @param {string[]} args script-inventory.mjs command and arguments
 * @returns {{ status: number | null, stdout: string }}
 */
function inventory(args) {
  const result = spawnSync(
    process.execPath,
    ["scripts/script-inventory.mjs", ...args],
    { encoding: "utf8" },
  );
  return { status: result.status, stdout: result.stdout };
}

/**
 * Run fn with a temp directory holding clean/index.html and an allowlist derived from it.
 * @param {(dir: string, allowlist: string) => void} fn
 */
function withClean(fn) {
  const dir = mkdtempSync(join(tmpdir(), "check-public-js-test-"));
  try {
    put(dir, "clean/index.html", html(CLEAN_SCRIPT));
    const capture = inventory([
      "capture",
      join(dir, "clean"),
      join(dir, "inv.json"),
    ]);
    assert.equal(capture.status, 0, capture.stdout);
    const derive = inventory([
      "derive",
      join(dir, "inv.json"),
      join(dir, "allow.json"),
      "selftest",
    ]);
    assert.equal(derive.status, 0, derive.stdout);
    fn(dir, join(dir, "allow.json"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("allowlist check", () => {
  it("passes the clean fixture", () => {
    withClean((dir, allow) => {
      const result = inventory(["check", allow, join(dir, "clean")]);
      assert.equal(result.status, 0, result.stdout);
      assert.match(result.stdout, /^check: 1\/1 passed$/m);
    });
  });

  it("fails an injected script and a modulepreload link, naming both", () => {
    withClean((dir, allow) => {
      put(
        dir,
        "bad/index.html",
        html(
          `${CLEAN_SCRIPT}<script>window.__x=1</script><link rel="modulepreload" href="/x.js">`,
        ),
      );
      const result = inventory(["check", allow, join(dir, "bad")]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /is not allowlisted/);
      assert.match(result.stdout, /modulepreload 1 exceeds allowed 0/);
    });
  });

  it("applies the /projects/* wildcard to a new single-segment route by its counts", () => {
    withClean((dir, allow) => {
      const derived = JSON.parse(readFileSync(allow, "utf8"));
      const wildcard = join(dir, "wildcard.json");
      writeFileSync(
        wildcard,
        JSON.stringify({
          generatedFrom: "selftest",
          inlineHashes: derived.inlineHashes,
          routes: { "/projects/*": derived.routes["/"] },
        }),
      );
      put(dir, "ok/projects/new-slug/index.html", html(CLEAN_SCRIPT));
      const pass = inventory(["check", wildcard, join(dir, "ok")]);
      assert.equal(pass.status, 0, pass.stdout);
      assert.match(pass.stdout, /^PASS \/projects\/new-slug$/m);

      put(
        dir,
        "extra/projects/new-slug/index.html",
        html(`${CLEAN_SCRIPT}<script src="/x.js"></script>`),
      );
      const fail = inventory(["check", wildcard, join(dir, "extra")]);
      assert.equal(fail.status, 1);
      assert.match(fail.stdout, /FAIL \/projects\/new-slug: /);
    });
  });

  it("does not apply the /projects/* wildcard to /projects or to a deeper route", () => {
    withClean((dir, allow) => {
      const derived = JSON.parse(readFileSync(allow, "utf8"));
      const wildcard = join(dir, "wildcard.json");
      writeFileSync(
        wildcard,
        JSON.stringify({
          generatedFrom: "selftest",
          inlineHashes: derived.inlineHashes,
          routes: { "/projects/*": derived.routes["/"] },
        }),
      );
      put(dir, "shape/projects/index.html", html(CLEAN_SCRIPT));
      put(dir, "shape/projects/a/b/index.html", html(CLEAN_SCRIPT));
      const result = inventory(["check", wildcard, join(dir, "shape")]);
      assert.equal(result.status, 1);
      assert.match(result.stdout, /FAIL \/projects: route not in allowlist/);
      assert.match(
        result.stdout,
        /FAIL \/projects\/a\/b: route not in allowlist/,
      );
    });
  });
});
