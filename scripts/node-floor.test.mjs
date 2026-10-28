// @ts-check
// Runtime floor and pinned majors (FOUND-04, FOUND-01): reads the repo files, contacts nothing.
// run: node --test scripts/node-floor.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/** @param {string} rel */
const read = (rel) =>
  readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));

test("engines.node floor is >=22.22.2", () => {
  assert.equal(pkg.engines.node, ">=22.22.2");
});

test(".nvmrc pins Node 24", () => {
  assert.equal(read(".nvmrc").trim(), "24");
});

test(".npmrc enforces engine-strict", () => {
  assert.match(read(".npmrc"), /^engine-strict=true\s*$/m);
});

test("Dockerfile NODE_VERSION defaults to 24", () => {
  assert.match(read("Dockerfile"), /^ARG NODE_VERSION=24\s*$/m);
});

test("dependency ranges pin astro 6.4, emdash 1.3, node adapter, react 19", () => {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  assert.match(deps.astro, /^\^?6\.4\./);
  assert.match(deps.emdash, /^\^?1\.3\./);
  assert.ok(deps["@astrojs/node"], "@astrojs/node adapter missing");
  assert.match(deps.react, /^\^?19\./);
});

test("astro config uses the node adapter in standalone mode", () => {
  assert.match(
    read("astro.config.mjs"),
    /node\(\{\s*mode:\s*"standalone"\s*\}\)/,
  );
});
