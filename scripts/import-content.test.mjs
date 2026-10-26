// @ts-check
// Tests for the content import: seed shape, source loading and (below) throwaway-database behavior.
// run: node --test scripts/import-content.test.mjs  (name the file; Node 24 treats a directory argument as a file)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { markdownToPortableText } from "emdash/client";
import { buildSeed } from "./import-content.mjs";
import {
  ABOUT_FIELD_SLUGS,
  CELL_VARIANT_OPTIONS,
  CONTACT_ICON_OPTIONS,
  NAV_MENU,
  SITE_SETTINGS,
  STACK_LEVEL_OPTIONS,
  aboutCollection,
} from "./lib/schema.mjs";
import {
  loadAbout,
  loadSourceModel,
  validateAboutOptions,
} from "./lib/sources.mjs";
import * as sources from "../src/data/about.ts";

/**
 * @typedef {import("../src/data/about.ts").StackLevel} StackLevel
 * @typedef {import("../src/data/about.ts").ContactIcon} ContactIcon
 */

/**
 * Portable Text block and span keys are random per conversion; everything else must match.
 * @param {unknown} value
 * @returns {unknown}
 */
function withoutKeys(value) {
  if (Array.isArray(value)) return value.map(withoutKeys);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "_key")
        .map(([key, inner]) => [key, withoutKeys(inner)]),
    );
  }
  return value;
}

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("about, menu and settings in the seed", () => {
  const model = loadSourceModel(REPO_ROOT);
  const seed = buildSeed(model);

  it("builds one published about entry from the real exports and about.md", () => {
    const entries = seed.content?.about;
    assert.ok(entries);
    assert.equal(entries.length, 1);
    const [entry] = entries;
    assert.equal(entry.id, "about");
    assert.equal(entry.slug, "about");
    assert.equal(entry.status, "published");
    assert.equal(entry.data.role, sources.role);
    assert.equal(entry.data.show_availability, sources.showAvailability);
    assert.deepEqual(
      entry.data.cells,
      sources.cells.map((cell) => ({
        label: cell.label,
        value: cell.value,
        variant: cell.variant ?? "default",
      })),
    );
    assert.deepEqual(entry.data.stack, sources.stack);
    assert.deepEqual(entry.data.contacts, sources.contacts);
    const body = readFileSync(join(REPO_ROOT, "src/data/about.md"), "utf8");
    assert.deepEqual(
      withoutKeys(entry.data.body),
      withoutKeys(markdownToPortableText(body.trim())),
    );
  });

  it("stores an About cell with no variant as default", () => {
    const cells = model.about.cells;
    assert.equal(cells.length, sources.cells.length);
    assert.equal(cells[0].variant, "accent");
    assert.deepEqual(
      cells.slice(1).map((cell) => cell.variant),
      ["default", "default", "default"],
    );
  });

  it("seeds exactly the primary menu with the three Nav.astro links in order", () => {
    assert.equal(seed.menus?.length, 1);
    const [menu] = seed.menus ?? [];
    assert.equal(menu.name, "primary");
    assert.equal(menu.label, "Primary");
    assert.deepEqual(menu.items, [
      { type: "custom", label: "Home", url: "/" },
      { type: "custom", label: "Projects", url: "/projects" },
      { type: "custom", label: "About", url: "/about" },
    ]);
    assert.deepEqual(
      NAV_MENU.items.map((item) => item.url),
      ["/", "/projects", "/about"],
    );
  });

  it("seeds the Q2 2a settings with no url and no seo key", () => {
    assert.deepEqual(seed.settings, SITE_SETTINGS);
    assert.equal("url" in (seed.settings ?? {}), false);
    assert.equal("seo" in (seed.settings ?? {}), false);
    const layout = readFileSync(
      join(REPO_ROOT, "src/layouts/Layout.astro"),
      "utf8",
    );
    assert.ok(layout.includes(`"${SITE_SETTINGS.tagline}"`));
  });

  it("defines the about fields in order with the select options from the unions", () => {
    const collection = aboutCollection();
    assert.deepEqual(
      collection.fields.map((field) => field.slug),
      [...ABOUT_FIELD_SLUGS],
    );
    assert.deepEqual(
      collection.fields.map((field) => field.slug),
      [
        "title",
        "role",
        "show_availability",
        "body",
        "cells",
        "stack",
        "contacts",
      ],
    );
    /** @param {string} slug @param {string} sub */
    const subOptions = (slug, sub) => {
      const field = collection.fields.find((f) => f.slug === slug);
      const subFields = /** @type {{ slug: string, options?: string[] }[]} */ (
        field?.validation?.subFields ?? []
      );
      return subFields.find((f) => f.slug === sub)?.options;
    };
    assert.deepEqual(subOptions("cells", "variant"), [...CELL_VARIANT_OPTIONS]);
    assert.deepEqual(subOptions("stack", "level"), [...STACK_LEVEL_OPTIONS]);
    assert.deepEqual(subOptions("contacts", "icon"), [...CONTACT_ICON_OPTIONS]);
  });

  it("throws naming the item when a stack level or contact icon is outside its options", () => {
    assert.doesNotThrow(() => loadAbout(REPO_ROOT));
    assert.throws(
      () =>
        validateAboutOptions(
          [{ name: "Fortran", level: /** @type {StackLevel} */ (/** @type {unknown} */ ("EXPERT")) }],
          [],
        ),
      /Fortran.*EXPERT/,
    );
    assert.throws(
      () =>
        validateAboutOptions(
          [],
          [
            {
              icon: /** @type {ContactIcon} */ (/** @type {unknown} */ ("mastodon")),
              label: "Fediverse",
              href: "https://example.com",
            },
          ],
        ),
      /Fediverse.*mastodon/,
    );
  });
});
