// @ts-check
// Read-only field-by-field equality report between the project markdown sources and the EmDash database.
// usage: node scripts/verify-import.mjs [--root DIR] [--report PATH]  (exit 0 only when every check matches)
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { portableTextToMarkdown } from "emdash/client";
import { TABLES } from "./lib/schema.mjs";
import { loadSourceModel } from "./lib/sources.mjs";

/**
 * @typedef {import("./lib/sources.mjs").SourceModel} SourceModel
 * @typedef {import("./lib/sources.mjs").ProjectSource} ProjectSource
 * @typedef {{ section: string, key: string, field: string, ok: boolean, expected: unknown, actual: unknown }} Check
 * @typedef {{ generatedAt: string, dbPath: string, projects: { expected: number, stored: number }, checks: Check[], differences: Check[] }} Report
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
     * @param {string} key
     * @param {string} field
     * @param {unknown} expected
     * @param {unknown} actual
     * @param {boolean} [ok]
     */
    const record = (key, field, expected, actual, ok) => {
      checks.push({
        section: "projects",
        key,
        field,
        ok: ok ?? expected === actual,
        expected,
        actual,
      });
    };

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

    return {
      generatedAt: new Date().toISOString(),
      dbPath,
      projects: { expected: model.projects.length, stored: live.length },
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
    `verify: ${total - report.differences.length}/${total} checks match, ${report.differences.length} differences (${report.projects.expected} expected, ${report.projects.stored} stored)`,
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
