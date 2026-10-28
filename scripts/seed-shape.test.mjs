// @ts-check
// Content model shape (SCHEMA-01..05, MIGR-01, MIGR-04): reads the committed seed offline, contacts nothing.
// run: node --test scripts/seed-shape.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { RESERVED_FIELD_SLUGS, validateSeed } from "emdash";

/** @param {string} rel */
const read = (rel) =>
  readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const seed = JSON.parse(read(".emdash/seed.json"));
/** @param {string} slug */
const collection = (slug) =>
  seed.collections.find((/** @type {any} */ c) => c.slug === slug);
/** @param {string} slug */
const fieldSlugs = (slug) =>
  collection(slug).fields.map((/** @type {any} */ f) => f.slug);

test("seed passes emdash validateSeed", () => {
  const result = validateSeed(seed);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test("seed defines exactly the four collections", () => {
  assert.deepEqual(
    seed.collections.map((/** @type {any} */ c) => c.slug).sort(),
    ["about", "home", "projects", "projects_index"],
  );
});

test("no collection uses a reserved field slug", () => {
  for (const c of seed.collections) {
    for (const f of c.fields) {
      assert.ok(
        !RESERVED_FIELD_SLUGS.includes(f.slug),
        `${c.slug}.${f.slug} is reserved`,
      );
    }
  }
});

test("projects fields include project_status, status_variant, time_label", () => {
  const slugs = fieldSlugs("projects");
  for (const s of ["project_status", "status_variant", "time_label"]) {
    assert.ok(slugs.includes(s), `projects.${s} missing`);
  }
});

test("stats is a repeater of label, value, variant", () => {
  const stats = collection("projects").fields.find(
    (/** @type {any} */ f) => f.slug === "stats",
  );
  assert.equal(stats.type, "repeater");
  assert.deepEqual(
    stats.validation.subFields.map((/** @type {any} */ f) => f.slug),
    ["label", "value", "variant"],
  );
});

test("13 project entries with unique slugs and a valid status each", () => {
  const projects = seed.content.projects;
  assert.equal(projects.length, 13);
  assert.equal(
    new Set(projects.map((/** @type {any} */ p) => p.slug)).size,
    13,
  );
  for (const p of projects) {
    assert.ok(
      ["published", "draft"].includes(p.status),
      `${p.slug}: ${p.status}`,
    );
  }
});

test("project status_variant values stay within the select options", () => {
  const field = collection("projects").fields.find(
    (/** @type {any} */ f) => f.slug === "status_variant",
  );
  const allowed = field.validation.options;
  for (const p of seed.content.projects) {
    assert.ok(allowed.includes(p.data.status_variant), p.slug);
  }
});

test("one about entry, one home entry, one projects_index entry", () => {
  assert.equal(seed.content.about.length, 1);
  assert.equal(seed.content.home.length, 1);
  assert.equal(seed.content.projects_index.length, 1);
});

test("taxonomies: hierarchical category with 9 terms, flat tag with 45", () => {
  const byName = Object.fromEntries(
    seed.taxonomies.map((/** @type {any} */ t) => [t.name, t]),
  );
  assert.equal(byName.category.hierarchical, true);
  assert.equal(byName.category.terms.length, 9);
  assert.ok(!byName.tag.hierarchical);
  assert.equal(byName.tag.terms.length, 45);
});

test("primary menu lists Home, Projects, About in order", () => {
  const menu = seed.menus.find((/** @type {any} */ m) => m.name === "primary");
  assert.deepEqual(
    menu.items.map((/** @type {any} */ i) => [i.label, i.url]),
    [
      ["Home", "/"],
      ["Projects", "/projects"],
      ["About", "/about"],
    ],
  );
});

test("settings carry title, tagline and both social links", () => {
  assert.ok(seed.settings.title);
  assert.ok(seed.settings.tagline);
  assert.match(seed.settings.social.github, /^https:\/\/github\.com\//);
  assert.match(seed.settings.social.linkedin, /^https:\/\/linkedin\.com\//);
});

test("emdash-env.d.ts is committed (SCHEMA-05, the only types file required)", () => {
  assert.ok(existsSync(new URL("../emdash-env.d.ts", import.meta.url)));
});

test("about holds role, availability flag, cells, stack, contacts and body", () => {
  const slugs = fieldSlugs("about");
  for (const s of [
    "role",
    "show_availability",
    "cells",
    "stack",
    "contacts",
    "body",
  ]) {
    assert.ok(slugs.includes(s), `about.${s} missing`);
  }
});
