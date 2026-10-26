// @ts-check
// Read-only field-by-field equality report between the project markdown sources and the EmDash database.
// usage: node scripts/verify-import.mjs [--root DIR] [--report PATH]  (exit 0 only when every check matches)
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { portableTextToMarkdown } from "emdash/client";
import {
  ABOUT_SLUG,
  ABOUT_TITLE,
  NAV_MENU,
  SITE_SETTINGS,
  TABLES,
  aboutCollection,
  projectsCollection,
} from "./lib/schema.mjs";
import { loadSourceModel } from "./lib/sources.mjs";

/**
 * @typedef {import("./lib/sources.mjs").SourceModel} SourceModel
 * @typedef {import("./lib/sources.mjs").ProjectSource} ProjectSource
 * @typedef {{ section: string, key: string, field: string, ok: boolean, expected: unknown, actual: unknown }} Check
 * @typedef {{ generatedAt: string, dbPath: string, projects: { expected: number, stored: number }, about: { expected: number, stored: number }, menu: { items: number }, settings: { keys: string[] }, schema: { collections: string[] }, checks: Check[], differences: Check[] }} Report
 * @typedef {Record<string, unknown>} Row
 */

const USAGE =
  "usage: node scripts/verify-import.mjs [--root DIR] [--report PATH]";
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const DEFAULT_REPORT = join(
  homedir(),
  "portfolio-baseline/current/phase2/equality-report.json",
);

/**
 * JSON text with object keys sorted recursively, so deep equality ignores key order but not array order.
 * @param {unknown} value
 * @returns {string}
 */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * A list column is JSON text; a null column counts as an empty list.
 * @param {unknown} stored
 * @returns {unknown}
 */
function parseList(stored) {
  if (stored === null || stored === undefined) return [];
  if (typeof stored !== "string") return stored;
  try {
    return JSON.parse(stored);
  } catch (error) {
    return `invalid JSON: ${error instanceof Error ? error.message : error}`;
  }
}

/**
 * Stored Portable Text converted back to markdown and trimmed as a whole (D-02).
 * @param {unknown} stored
 * @returns {string}
 */
function bodyToMarkdown(stored) {
  if (stored === null || stored === undefined) return "";
  if (typeof stored !== "string")
    return `unexpected column type ${typeof stored}`;
  try {
    return portableTextToMarkdown(JSON.parse(stored)).trim();
  } catch (error) {
    return `invalid body: ${error instanceof Error ? error.message : error}`;
  }
}

/**
 * Code-unit comparison: date descending, then slug ascending.
 * @param {ProjectSource} a
 * @param {ProjectSource} b
 * @returns {number}
 */
function byDateDescSlugAsc(a, b) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  if (a.slug !== b.slug) return a.slug < b.slug ? -1 : 1;
  return 0;
}

/**
 * Compare the sources with the stored projects. Exact string equality for copy: no trimming and
 * no Unicode normalization, so en dashes, arrows and middle dots must survive byte-identical.
 * @param {SourceModel} model
 * @param {string} dbPath
 * @returns {Report}
 */
export function verify(model, dbPath) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    /** @type {Check[]} */
    const checks = [];
    /**
     * @param {string} section
     * @param {string} key
     * @param {string} field
     * @param {unknown} expected
     * @param {unknown} actual
     * @param {boolean} [ok]
     */
    const add = (section, key, field, expected, actual, ok) => {
      checks.push({
        section,
        key,
        field,
        ok: ok ?? expected === actual,
        expected,
        actual,
      });
    };
    /**
     * @param {string} key
     * @param {string} field
     * @param {unknown} expected
     * @param {unknown} actual
     * @param {boolean} [ok]
     */
    const record = (key, field, expected, actual, ok) =>
      add("projects", key, field, expected, actual, ok);

    /** @type {Row[]} */
    const live = db
      .prepare(`SELECT * FROM ${TABLES.projects} WHERE deleted_at IS NULL`)
      .all();
    /** @type {Row[]} */
    const trashed = db
      .prepare(`SELECT * FROM ${TABLES.projects} WHERE deleted_at IS NOT NULL`)
      .all();

    /** @type {Map<string, Row[]>} */
    const bySlug = new Map();
    for (const row of live) {
      const slug = String(row.slug);
      bySlug.set(slug, [...(bySlug.get(slug) ?? []), row]);
    }
    const sourceSlugs = new Set(model.projects.map((p) => p.slug));

    for (const row of trashed) {
      record(
        String(row.slug),
        "trashed",
        "not deleted",
        `deleted_at ${row.deleted_at}`,
        false,
      );
    }
    for (const [slug, rows] of bySlug) {
      if (!sourceSlugs.has(slug)) {
        record(
          slug,
          "unexpected",
          "no such source file",
          "live row present",
          false,
        );
      }
      if (rows.length > 1) {
        record(slug, "duplicate", 1, rows.length, false);
      }
    }

    for (const project of model.projects) {
      const row = bySlug.get(project.slug)?.[0];
      if (!row) {
        record(project.slug, "row", "one live row", "missing", false);
        continue;
      }
      /** @type {[string, string][]} */
      const copy = [
        ["title", project.title],
        ["date", project.date],
        ["category", project.category],
        ["project_status", project.status],
        ["status_variant", project.statusVariant],
        ["surface", project.surface],
        ["time_label", project.timeLabel],
        ["period", project.period],
        ["summary", project.summary],
        ["sub", project.sub],
      ];
      for (const [field, expected] of copy) {
        record(project.slug, field, expected, row[field]);
      }
      const tags = parseList(row.tags);
      record(
        project.slug,
        "tags",
        project.tags,
        tags,
        canonical(project.tags) === canonical(tags),
      );
      const stats = parseList(row.stats);
      record(
        project.slug,
        "stats",
        project.stats,
        stats,
        canonical(project.stats) === canonical(stats),
      );
      record(project.slug, "body", project.body, bodyToMarkdown(row.body));
      record(
        project.slug,
        "status",
        project.draft ? "draft" : "published",
        row.status,
      );
      if (project.draft) {
        record(
          project.slug,
          "live_revision_id",
          null,
          row.live_revision_id,
          row.live_revision_id === null,
        );
        if (row.live_revision_id !== null) {
          console.error(
            `${project.slug}: draft source but the row has a live revision; delete data/ and re-run the import`,
          );
        }
      }
    }

    const expectedOrder = model.projects
      .filter((p) => !p.draft)
      .sort(byDateDescSlugAsc)
      .map((p) => p.slug);
    const storedOrder = db
      .prepare(
        `SELECT slug FROM ${TABLES.projects} WHERE deleted_at IS NULL AND status = ? ORDER BY date DESC, slug ASC`,
      )
      .all("published")
      .map((row) => String(row.slug));
    record(
      "list",
      "order",
      expectedOrder,
      storedOrder,
      canonical(expectedOrder) === canonical(storedOrder),
    );

    // about: exactly one live row with slug about (D-03).
    /** @type {Row[]} */
    const aboutLive = db
      .prepare(`SELECT * FROM ${TABLES.about} WHERE deleted_at IS NULL`)
      .all();
    /** @type {Row[]} */
    const aboutTrashed = db
      .prepare(`SELECT * FROM ${TABLES.about} WHERE deleted_at IS NOT NULL`)
      .all();
    for (const row of aboutTrashed) {
      add(
        "about",
        String(row.slug),
        "trashed",
        "not deleted",
        `deleted_at ${row.deleted_at}`,
        false,
      );
    }
    for (const row of aboutLive) {
      if (row.slug !== ABOUT_SLUG) {
        add(
          "about",
          String(row.slug),
          "unexpected",
          "only the about entry",
          "live row present",
          false,
        );
      }
    }
    const aboutRows = aboutLive.filter((row) => row.slug === ABOUT_SLUG);
    if (aboutRows.length > 1) {
      add("about", ABOUT_SLUG, "duplicate", 1, aboutRows.length, false);
    }
    const aboutRow = aboutRows[0];
    if (!aboutRow) {
      add("about", ABOUT_SLUG, "row", "one live row", "missing", false);
    } else {
      const about = model.about;
      add("about", ABOUT_SLUG, "title", ABOUT_TITLE, aboutRow.title);
      add("about", ABOUT_SLUG, "role", about.role, aboutRow.role);
      // SQLite returns 0 or 1 for a boolean column (Pitfall 8).
      add(
        "about",
        ABOUT_SLUG,
        "show_availability",
        about.showAvailability,
        Boolean(aboutRow.show_availability),
      );
      add(
        "about",
        ABOUT_SLUG,
        "body",
        about.body,
        bodyToMarkdown(aboutRow.body),
      );
      for (const field of /** @type {const} */ ([
        "cells",
        "stack",
        "contacts",
      ])) {
        const stored = parseList(aboutRow[field]);
        add(
          "about",
          ABOUT_SLUG,
          field,
          about[field],
          stored,
          canonical(about[field]) === canonical(stored),
        );
      }
      add("about", ABOUT_SLUG, "status", "published", aboutRow.status);
    }

    // menu: the primary menu and its items in position order (D-14).
    /** @type {Row | undefined} */
    const menuRow = db
      .prepare(`SELECT id, label FROM ${TABLES.menus} WHERE name = ?`)
      .get(NAV_MENU.name);
    /** @type {Row[]} */
    let menuItems = [];
    if (!menuRow) {
      add("menu", NAV_MENU.name, "row", "one menu", "missing", false);
    } else {
      add("menu", NAV_MENU.name, "label", NAV_MENU.label, menuRow.label);
      menuItems = db
        .prepare(
          `SELECT type, custom_url, label FROM ${TABLES.menuItems} WHERE menu_id = ? ORDER BY sort_order`,
        )
        .all(String(menuRow.id));
    }
    add(
      "menu",
      NAV_MENU.name,
      "count",
      NAV_MENU.items.length,
      menuItems.length,
    );
    NAV_MENU.items.forEach((item, position) => {
      const stored = menuItems[position];
      const key = `${NAV_MENU.name}[${position}]`;
      add("menu", key, "type", item.type, stored?.type);
      add("menu", key, "label", item.label, stored?.label);
      add("menu", key, "url", item.url, stored?.custom_url);
    });

    // settings: each seeded key equals its stored JSON value; the site URL is never seeded.
    const settingKeys = Object.keys(SITE_SETTINGS);
    for (const key of settingKeys) {
      /** @type {Row | undefined} */
      const stored = db
        .prepare(`SELECT value FROM ${TABLES.options} WHERE name = ?`)
        .get(`site:${key}`);
      const expected = SITE_SETTINGS[/** @type {keyof typeof SITE_SETTINGS} */ (key)];
      const actual = stored ? parseList(stored.value) : "missing";
      add(
        "settings",
        key,
        "value",
        expected,
        actual,
        canonical(expected) === canonical(actual),
      );
    }
    /** @type {Row | undefined} */
    const urlRow = db
      .prepare(`SELECT value FROM ${TABLES.options} WHERE name = ?`)
      .get("site:url");
    add(
      "settings",
      "url",
      "absent",
      "no site:url row",
      urlRow ? "site:url row present" : "no site:url row",
      urlRow === undefined,
    );

    // schema: exactly the about and projects collections, with the defined fields in order.
    const storedCollections = db
      .prepare(`SELECT slug FROM ${TABLES.collections} ORDER BY slug`)
      .all()
      .map((row) => String(row.slug));
    const definitions = [
      projectsCollection(model.tagOptions),
      aboutCollection(),
    ];
    const expectedCollections = definitions.map((d) => d.slug).sort();
    add(
      "schema",
      "collections",
      "slugs",
      expectedCollections,
      storedCollections,
      canonical(expectedCollections) === canonical(storedCollections),
    );
    for (const definition of definitions) {
      /** @type {Row[]} */
      const storedFields = db
        .prepare(
          `SELECT slug, type, required, validation FROM ${TABLES.fields} WHERE collection_id = (SELECT id FROM ${TABLES.collections} WHERE slug = ?) ORDER BY sort_order`,
        )
        .all(definition.slug);
      const expectedSlugs = definition.fields.map((f) => f.slug);
      const storedSlugs = storedFields.map((f) => String(f.slug));
      add(
        "schema",
        definition.slug,
        "fields",
        expectedSlugs,
        storedSlugs,
        canonical(expectedSlugs) === canonical(storedSlugs),
      );
      for (const field of definition.fields) {
        const stored = storedFields.find((f) => f.slug === field.slug);
        const expected = {
          type: field.type,
          required: Boolean(field.required),
          validation: field.validation ?? null,
        };
        const actual = stored
          ? {
              type: stored.type,
              required: Boolean(stored.required),
              validation: parseList(stored.validation ?? "null"),
            }
          : "missing";
        add(
          "schema",
          definition.slug,
          field.slug,
          expected,
          actual,
          canonical(expected) === canonical(actual),
        );
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      dbPath,
      projects: { expected: model.projects.length, stored: live.length },
      about: { expected: 1, stored: aboutLive.length },
      menu: { items: menuItems.length },
      settings: { keys: settingKeys },
      schema: { collections: storedCollections },
      checks,
      differences: checks.filter((check) => !check.ok),
    };
  } finally {
    db.close();
  }
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function asText(value) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

/**
 * Show where two values first differ: 60 characters from 20 before the difference.
 * @param {Check} check
 * @returns {string}
 */
function firstDifference(check) {
  const x = asText(check.expected);
  const y = asText(check.actual);
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  const from = Math.max(0, i - 20);
  const side = (/** @type {string} */ s) =>
    JSON.stringify(s.slice(from, from + 60));
  return `differs at offset ${i}: expected ${side(x)} vs actual ${side(y)}`;
}

/**
 * @param {string[]} argv
 * @returns {number}
 */
function main(argv) {
  let root = REPO_ROOT;
  let reportPath = DEFAULT_REPORT;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--root" && i + 1 < argv.length) {
      root = argv[++i];
    } else if (argv[i] === "--report" && i + 1 < argv.length) {
      reportPath = argv[++i];
    } else {
      console.error(USAGE);
      return 2;
    }
  }
  const dbPath = join(resolve(root), "data/emdash.db");
  if (!existsSync(dbPath)) {
    throw new Error(
      `no database at ${dbPath}, run scripts/import-content.mjs first`,
    );
  }
  const report = verify(loadSourceModel(REPO_ROOT), dbPath);
  mkdirSync(dirname(resolve(reportPath)), { recursive: true });
  writeFileSync(resolve(reportPath), JSON.stringify(report, null, 2) + "\n");
  for (const diff of report.differences) {
    console.log(
      `DIFF ${diff.section} ${diff.key}.${diff.field}: ${firstDifference(diff)}`,
    );
  }
  const total = report.checks.length;
  console.log(
    `verify: ${total - report.differences.length}/${total} checks match, ${report.differences.length} differences (${report.projects.expected} projects expected, ${report.projects.stored} stored; ${report.about.stored} about; ${report.menu.items} menu items)`,
  );
  return report.differences.length === 0 ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
