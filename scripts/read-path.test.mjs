// @ts-check
// Read path guards (REND-05, T-03 XSS): reads the working tree offline, contacts nothing.
// run: node --test scripts/read-path.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));

/** @param {string} dir @returns {string[]} */
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
  );

describe("legacy content layer is gone (REND-05)", () => {
  for (const rel of ["src/content", "src/content.config.ts", "src/data"]) {
    it(`${rel} does not exist`, () => {
      assert.equal(existsSync(join(root, rel)), false);
    });
  }

  it("no src/data/about.* file exists", () => {
    const dir = join(root, "src/data");
    const found = existsSync(dir)
      ? readdirSync(dir).filter((f) => f.startsWith("about."))
      : [];
    assert.deepEqual(found, []);
  });
});

describe("entry bodies are never injected as raw HTML (T-03 XSS)", () => {
  const files = walk(join(root, "src")).filter(
    (f) => /\.(astro|ts|tsx|js|mjs|jsx)$/.test(f) && !/\.test\./.test(f),
  );

  it("scans the page, component, layout and lib sources", () => {
    for (const dir of ["pages", "components", "layouts", "lib"]) {
      assert.ok(
        files.some((f) => f.includes(`/src/${dir}/`)),
        `no files scanned under src/${dir}`,
      );
    }
  });

  it("uses no set:html, dangerouslySetInnerHTML or innerHTML under src", () => {
    const offenders = files.filter((f) =>
      /set:html|dangerouslySetInnerHTML|innerHTML/.test(
        readFileSync(f, "utf8"),
      ),
    );
    assert.deepEqual(offenders, []);
  });
});
