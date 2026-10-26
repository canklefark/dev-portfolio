// @ts-check
// Tests for the canonicalizing `parity` command of script-inventory.mjs.
// run: node --test scripts/parity.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";

/**
 * @typedef {{ tags?: string[], word?: string, anchorSpace?: boolean, ogHost?: string, script?: boolean, cid?: boolean, entity?: boolean, tagSpaces?: boolean, extraCss?: boolean }} PageOptions
 */

/**
 * A small but complete page with the pieces the comparator cares about.
 * @param {PageOptions} [o]
 * @returns {string}
 */
function page(o = {}) {
  const {
    tags = ["Astro", "Docker"],
    word = "alpha",
    anchorSpace = false,
    ogHost = "https://dev.zeikcookson.com",
    script = false,
    cid = false,
    entity = false,
    tagSpaces = false,
    extraCss = false,
  } = o;
  const c = cid ? " data-astro-cid-abc123" : "";
  const apos = entity ? "It&#39;s" : "It's";
  const sep = tagSpaces ? "\n    " : "";
  const chips = tags
    .map((t) => `<span class="stage-tag"${c}>${t}</span>`)
    .join(sep);
  return [
    "<!DOCTYPE html>",
    `<html lang="en"><head>`,
    `<title>Home</title>`,
    `<meta property="og:url" content="${ogHost}/">`,
    `<link rel="stylesheet" href="/_astro/Layout.css">`,
    extraCss ? `<link rel="stylesheet" href="/_astro/extra.css">` : "",
    extraCss ? `<style>.x{color:red}</style>` : "",
    `</head><body>`,
    `<main>`,
    `<p${c}>${apos} a ${word} card</p>`,
    `<a href="/projects/x"${c}>${anchorSpace ? " " : ""}Read more</a>`,
    `<div class="l-cluster stage-tags" style="--space: var(--s-2)"${c}>${sep}${chips}${sep}</div>`,
    `</main>`,
    script ? `<script>window.__x=1</script>` : "",
    `</body></html>`,
  ].join(tagSpaces ? "\n" : "");
}

/**
 * Write one page per route into a baseline and a candidate directory, run parity, clean up.
 * @param {Record<string, string>} baseline route file path to html
 * @param {Record<string, string>} candidate route file path to html
 * @returns {{ status: number | null, stdout: string }}
 */
function runParity(baseline, candidate) {
  const root = mkdtempSync(join(tmpdir(), "parity-test-"));
  try {
    /** @type {[string, Record<string, string>][]} */
    const sides = [
      ["base", baseline],
      ["cand", candidate],
    ];
    for (const [side, files] of sides) {
      for (const [file, html] of Object.entries(files)) {
        const target = join(root, side, file);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, html);
      }
    }
    const result = spawnSync(
      process.execPath,
      [
        "scripts/script-inventory.mjs",
        "parity",
        join(root, "base"),
        join(root, "cand"),
      ],
      { encoding: "utf8" },
    );
    return { status: result.status, stdout: result.stdout };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/**
 * @param {PageOptions} base
 * @param {PageOptions} cand
 */
function runOne(base, cand) {
  return runParity({ "index.html": page(base) }, { "index.html": page(cand) });
}

describe("parity canonicalization", () => {
  it("passes when only the five canonicalized differences exist", () => {
    const result = runOne(
      { tags: ["Astro", "Docker"], entity: false },
      {
        tags: ["Docker", "Astro"],
        cid: true,
        entity: true,
        tagSpaces: true,
        extraCss: true,
      },
    );
    assert.equal(result.status, 0, result.stdout);
    assert.match(result.stdout, /^parity: 1\/1 identical$/m);
    assert.match(result.stdout, /^PARITY-OK \/$/m);
    assert.match(result.stdout, /^CSS \/: baseline 1, candidate 3$/m);
  });

  it("fails on a one-word copy change", () => {
    const result = runOne({ word: "alpha" }, { word: "beta" });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^PARITY-DIFF \/: /m);
    assert.match(result.stdout, /^parity: 0\/1 identical$/m);
  });

  it("fails on whitespace inside an anchor next to text", () => {
    const result = runOne({ anchorSpace: false }, { anchorSpace: true });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^PARITY-DIFF \/: /m);
  });

  it("fails on a different tag, not only a different order", () => {
    const result = runOne(
      { tags: ["Astro", "Docker"] },
      { tags: ["Astro", "Ansible"] },
    );
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^PARITY-DIFF \/: /m);
  });

  it("fails on an og:url with a different host", () => {
    const result = runOne(
      { ogHost: "https://dev.zeikcookson.com" },
      { ogHost: "http://127.0.0.1:4321" },
    );
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^PARITY-DIFF \/: /m);
  });

  it("fails on an extra inline script with the script reason", () => {
    const result = runOne({ script: false }, { script: true });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^PARITY-DIFF \/: script 0 differs/m);
  });

  it("fails on a route present on one side only", () => {
    const missingFromBaseline = runParity(
      { "index.html": page() },
      { "index.html": page(), "about/index.html": page() },
    );
    assert.equal(missingFromBaseline.status, 1);
    assert.match(
      missingFromBaseline.stdout,
      /^PARITY-DIFF \/about: route missing from baseline$/m,
    );
    const missingFromCandidate = runParity(
      { "index.html": page(), "about/index.html": page() },
      { "index.html": page() },
    );
    assert.equal(missingFromCandidate.status, 1);
    assert.match(
      missingFromCandidate.stdout,
      /^PARITY-DIFF \/about: route missing from candidate$/m,
    );
  });
});
