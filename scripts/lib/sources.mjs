// @ts-check
// Parses the project markdown files into one normalized source model shared by the import and verify scripts.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { DATE_PATTERN, deriveTagOptions } from "./schema.mjs";

/**
 * @typedef {{ label: string, value: string, variant: string }} StatSource
 * @typedef {{ slug: string, title: string, date: string, category: string, status: string, statusVariant: string, surface: string, timeLabel: string, period: string, tags: string[], summary: string, sub: string, stats: StatSource[], draft: boolean, body: string }} ProjectSource
 * @typedef {{ projects: ProjectSource[], tagOptions: string[] }} SourceModel
 */

export const PROJECTS_DIR = "src/content/projects";

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

/**
 * @param {Record<string, unknown>} data
 * @param {string} key
 * @param {string} file
 * @returns {string}
 */
function requireString(data, key, file) {
  const value = data[key];
  if (typeof value !== "string" || value === "") {
    throw new Error(`${file}: field ${key} must be a non-empty string`);
  }
  return value;
}

/**
 * Parse one project file. Nothing is coerced or defaulted except the documented absent values:
 * statusVariant and a stats row variant become "default", draft becomes false.
 * @param {string} raw
 * @param {string} file
 * @returns {ProjectSource}
 */
export function parseProjectFile(raw, file) {
  const match = FRONTMATTER.exec(raw);
  if (!match) throw new Error(`${file}: no frontmatter block`);
  const parsed = parse(match[1]);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${file}: frontmatter is not a mapping`);
  }
  /** @type {Record<string, unknown>} */
  const data = parsed;

  const date = data.date;
  if (typeof date !== "string" || !new RegExp(DATE_PATTERN).test(date)) {
    throw new Error(
      `${file}: date must be a YYYY-MM-DD string, got ${JSON.stringify(date)}`,
    );
  }

  const rawTags = data.tags;
  if (!Array.isArray(rawTags))
    throw new Error(`${file}: tags must be an array`);
  const tags = rawTags.map((tag, i) => {
    if (typeof tag !== "string" || tag === "") {
      throw new Error(`${file}: tags[${i}] must be a non-empty string`);
    }
    return tag;
  });

  const rawStats = data.stats;
  if (!Array.isArray(rawStats))
    throw new Error(`${file}: stats must be an array`);
  const stats = rawStats.map((row, i) => {
    if (row === null || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(`${file}: stats[${i}] must be a mapping`);
    }
    /** @type {Record<string, unknown>} */
    const stat = row;
    const variant = stat.variant ?? "default";
    if (typeof variant !== "string" || variant === "") {
      throw new Error(
        `${file}: stats[${i}].variant must be a non-empty string`,
      );
    }
    return {
      label: requireString(stat, "label", `${file} stats[${i}]`),
      value: requireString(stat, "value", `${file} stats[${i}]`),
      variant,
    };
  });

  const draft = data.draft ?? false;
  if (typeof draft !== "boolean") {
    throw new Error(`${file}: draft must be a boolean`);
  }
  const statusVariant = data.statusVariant ?? "default";
  if (typeof statusVariant !== "string" || statusVariant === "") {
    throw new Error(`${file}: statusVariant must be a non-empty string`);
  }

  return {
    slug: file.replace(/\.md$/, ""),
    title: requireString(data, "title", file),
    date,
    category: requireString(data, "category", file),
    status: requireString(data, "status", file),
    statusVariant,
    surface: requireString(data, "surface", file),
    timeLabel: requireString(data, "timeLabel", file),
    period: requireString(data, "period", file),
    tags,
    summary: requireString(data, "summary", file),
    sub: requireString(data, "sub", file),
    stats,
    draft,
    // Only the whole body is trimmed; inner whitespace is stored as written.
    body: match[2].trim(),
  };
}

/**
 * Every .md file under PROJECTS_DIR, sorted by file name; slug equals the file name without .md.
 * @param {string} repoRoot
 * @returns {ProjectSource[]}
 */
export function loadProjects(repoRoot) {
  const dir = join(repoRoot, PROJECTS_DIR);
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort();
  if (files.length === 0) throw new Error(`no .md files under ${dir}`);
  return files.map((file) =>
    parseProjectFile(readFileSync(join(dir, file), "utf8"), file),
  );
}

/**
 * @param {string} repoRoot
 * @returns {SourceModel}
 */
export function loadSourceModel(repoRoot) {
  const projects = loadProjects(repoRoot);
  return { projects, tagOptions: deriveTagOptions(projects) };
}
