// @ts-check
// Tests for the content import: seed shape, source loading and (below) throwaway-database behavior.
// run: node --test scripts/import-content.test.mjs  (name the file; Node 24 treats a directory argument as a file)
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { RESERVED_COLLECTION_SLUGS, RESERVED_FIELD_SLUGS } from "emdash";
import { markdownToPortableText, portableTextToMarkdown } from "emdash/client";
import { applySeedFile, buildSeed } from "./import-content.mjs";
import {
  ABOUT_FIELD_SLUGS,
  CELL_VARIANT_OPTIONS,
  CONTACT_ICON_OPTIONS,
  NAV_MENU,
  SITE_SETTINGS,
  STACK_LEVEL_OPTIONS,
  TABLES,
  aboutCollection,
  deriveTagOptions,
  projectsCollection,
} from "./lib/schema.mjs";
import {
  loadAbout,
  loadProjects,
  loadSourceModel,
  parseProjectFile,
  validateAboutOptions,
} from "./lib/sources.mjs";
import { verify } from "./verify-import.mjs";
import * as sources from "../src/data/about.ts";

/**
 * @typedef {import("../src/data/about.ts").StackLevel} StackLevel
 * @typedef {import("../src/data/about.ts").ContactIcon} ContactIcon
 * @typedef {import("./lib/sources.mjs").SourceModel} SourceModel
 * @typedef {import("./lib/sources.mjs").ProjectSource} ProjectSource
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

const FIXTURES = join(REPO_ROOT, "scripts/fixtures");

/**
 * @param {string} name
 * @returns {ProjectSource}
 */
function fixture(name) {
  return parseProjectFile(readFileSync(join(FIXTURES, name), "utf8"), name);
}

/**
 * Run fn against a fresh throwaway root and always remove it.
 * @template T
 * @param {(root: string) => T} fn
 * @returns {T}
 */
function withRoot(fn) {
  const root = mkdtempSync(join(tmpdir(), "portfolio-test-"));
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/**
 * Apply a seed built from the model to a root without printing the CLI output.
 * @param {SourceModel} model
 * @param {string} root
 * @returns {string} the database path
 */
function applyModel(model, root) {
  applySeedFile(buildSeed(model), root, { quiet: true });
  return join(root, "data/emdash.db");
}

/**
 * Read-only query with a constant SQL text and bound values.
 * @param {string} dbPath
 * @param {string} sql
 * @param {...string} values
 * @returns {Record<string, unknown>[]}
 */
function query(dbPath, sql, ...values) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    return db.prepare(sql).all(...values);
  } finally {
    db.close();
  }
}

/**
 * @param {{ section: string, key: string, field: string }} diff
 * @returns {string}
 */
const label = (diff) => `${diff.section} ${diff.key} ${diff.field}`;

describe("converter and schema invariants", () => {
  const model = loadSourceModel(REPO_ROOT);

  it("round trips every project body and about.md byte-identical (D-02, Pitfall 9)", () => {
    const bodies = [
      ...model.projects.map((p) => ({ name: p.slug, body: p.body })),
      { name: "about.md", body: model.about.body },
    ];
    assert.equal(bodies.length, 14);
    for (const { name, body } of bodies) {
      const back = portableTextToMarkdown(markdownToPortableText(body)).trim();
      assert.equal(back, body, `${name} changed in the round trip`);
    }
  });

  it("keeps every field and collection slug out of the emdash reserved lists", () => {
    const fields = [
      ...projectsCollection(model.tagOptions).fields,
      ...aboutCollection().fields,
    ].map((field) => field.slug);
    for (const slug of fields) {
      assert.equal(
        RESERVED_FIELD_SLUGS.includes(slug),
        false,
        `field slug ${slug} is reserved`,
      );
    }
    for (const slug of ["projects", "about"]) {
      assert.equal(
        RESERVED_COLLECTION_SLUGS.includes(slug),
        false,
        `collection slug ${slug} is reserved`,
      );
    }
  });

  it("derives each distinct tag once in code-unit order and covers every project", () => {
    const derived = deriveTagOptions([
      { tags: ["b", "a"] },
      { tags: ["a", "B", "c"] },
    ]);
    assert.deepEqual(derived, ["B", "a", "b", "c"]);
    const options = new Set(model.tagOptions);
    assert.equal(options.size, model.tagOptions.length);
    assert.deepEqual(model.tagOptions, [...model.tagOptions].sort());
    for (const project of model.projects) {
      for (const tag of project.tags) {
        assert.ok(options.has(tag), `${project.slug}: ${tag} missing`);
      }
    }
  });

  it("throws naming the slug when a project tag is outside the options", () => {
    const project = { ...fixture("empty-lists.md"), tags: ["Not A Real Tag"] };
    assert.throws(
      () => buildSeed({ ...model, projects: [project] }),
      /empty-lists.*Not A Real Tag/,
    );
  });
});

describe("source edge cases", () => {
  it("parses the draft fixture with default variants and seeds it as a draft", () => {
    const draft = fixture("draft-project.md");
    assert.equal(draft.slug, "draft-project");
    assert.equal(draft.draft, true);
    assert.equal(draft.statusVariant, "default");
    assert.deepEqual(
      draft.stats.map((stat) => stat.variant),
      ["default"],
    );
    const model = loadSourceModel(REPO_ROOT);
    const seed = buildSeed({ ...model, projects: [draft] });
    assert.equal(seed.content?.projects[0].status, "draft");
  });

  it("rejects a date that is not YYYY-MM-DD and names the file and field", () => {
    assert.throws(() => fixture("bad-date.md"), /bad-date\.md.*date/);
  });

  it("throws before any seed call when a projects directory has no .md files", () => {
    withRoot((root) => {
      mkdirSync(join(root, "src/content/projects"), { recursive: true });
      assert.throws(() => loadProjects(root), /no \.md files/);
    });
  });
});

describe("throwaway databases", () => {
  const real = loadSourceModel(REPO_ROOT);

  it("keeps a draft source a draft and round trips empty lists", () => {
    const draft = fixture("draft-project.md");
    const empty = fixture("empty-lists.md");
    const model = { ...real, projects: [draft, empty] };
    withRoot((root) => {
      const dbPath = applyModel(model, root);
      const [row] = query(
        dbPath,
        `SELECT status, published_at, live_revision_id FROM ${TABLES.projects} WHERE slug = ?`,
        draft.slug,
      );
      assert.equal(row.status, "draft");
      assert.equal(row.published_at, null);
      assert.equal(row.live_revision_id, null);
      const report = verify(model, dbPath);
      assert.deepEqual(report.differences, []);
      for (const field of ["tags", "stats"]) {
        const check = report.checks.find(
          (c) => c.key === empty.slug && c.field === field,
        );
        assert.ok(check?.ok, `${field} check missing or failing`);
        assert.deepEqual(check.expected, []);
        assert.deepEqual(check.actual, []);
      }
    });
  });

  it("converges after two applies: 13 projects, 1 about, no duplicate slug, 0 differences", () => {
    withRoot((root) => {
      applyModel(real, root);
      const dbPath = applyModel(real, root);
      const live = query(
        dbPath,
        `SELECT slug FROM ${TABLES.projects} WHERE deleted_at IS NULL`,
      );
      assert.equal(live.length, 13);
      const about = query(
        dbPath,
        `SELECT slug FROM ${TABLES.about} WHERE deleted_at IS NULL`,
      );
      assert.equal(about.length, 1);
      const duplicated = query(
        dbPath,
        `SELECT slug FROM ${TABLES.projects} WHERE deleted_at IS NULL GROUP BY slug HAVING COUNT(*) > 1`,
      );
      assert.equal(duplicated.length, 0);
      assert.deepEqual(verify(real, dbPath).differences, []);
    });
  });

  it("reports exactly the three mutations and exits 1 from the CLI", () => {
    const mutated = structuredClone(real);
    const catalog = mutated.projects.find((p) => p.slug === "catalog-cms");
    assert.ok(catalog);
    catalog.summary =
      (catalog.summary[0] === "X" ? "Y" : "X") + catalog.summary.slice(1);
    const bold = mutated.projects.find(
      (p) => p.slug !== "catalog-cms" && /\*\*(.+?)\*\*/.test(p.body),
    );
    assert.ok(bold, "no project body has a bold mark");
    bold.body = bold.body.replace(/\*\*(.+?)\*\*/, "$1");
    mutated.about.cells.reverse();

    withRoot((root) => {
      const dbPath = applyModel(mutated, root);
      const report = verify(real, dbPath);
      assert.deepEqual(
        report.differences.map(label).sort(),
        [
          "about about cells",
          `projects ${bold.slug} body`,
          "projects catalog-cms summary",
        ].sort(),
      );
      const run = spawnSync(
        process.execPath,
        [
          "scripts/verify-import.mjs",
          "--root",
          root,
          "--report",
          join(root, "report.json"),
        ],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
      assert.equal(run.status, 1, run.stderr);
      assert.match(run.stdout, /DIFF about about\.cells/);
    });
  });

  it("flags a stored project that has no source file as unexpected", () => {
    const stray = { ...fixture("empty-lists.md"), slug: "stray-project" };
    const model = { ...real, projects: [...real.projects, stray] };
    withRoot((root) => {
      const dbPath = applyModel(model, root);
      const report = verify(real, dbPath);
      const unexpected = report.differences.find(
        (d) => d.key === "stray-project" && d.field === "unexpected",
      );
      assert.ok(unexpected, "no unexpected difference for stray-project");
      assert.equal(unexpected.ok, false);
    });
  });
});
