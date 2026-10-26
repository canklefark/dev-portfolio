// @ts-check
// Parses the project markdown files into one normalized source model shared by the import and verify scripts.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  CONTACT_ICON_OPTIONS,
  DATE_PATTERN,
  STACK_LEVEL_OPTIONS,
  deriveTagOptions,
} from "./schema.mjs";
// MIGR-02: the real exports are read through Node type stripping, so no About value is copied here.
import {
  cells,
  contacts,
  role,
  showAvailability,
  stack,
} from "../../src/data/about.ts";

/**
 * @typedef {import("../../src/data/about.ts").Contact} Contact
 * @typedef {import("../../src/data/about.ts").StackItem} StackItem
 * @typedef {{ label: string, value: string, variant: string }} CellSource
 * @typedef {{ role: string, showAvailability: boolean, cells: CellSource[], stack: StackItem[], contacts: Contact[], body: string }} AboutSource
 * @typedef {{ label: string, value: string, variant: string }} StatSource
 * @typedef {{ slug: string, title: string, date: string, category: string, status: string, statusVariant: string, surface: string, timeLabel: string, period: string, tags: string[], summary: string, sub: string, stats: StatSource[], draft: boolean, body: string }} ProjectSource
 * @typedef {{ projects: ProjectSource[], tagOptions: string[], about: AboutSource }} SourceModel
 */

export const PROJECTS_DIR = "src/content/projects";
export const ABOUT_BODY_FILE = "src/data/about.md";

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
 * Throws naming the item when a stack level or contact icon is outside its option list.
 * @param {StackItem[]} stackItems
 * @param {Contact[]} contactItems
 * @returns {void}
 */
export function validateAboutOptions(stackItems, contactItems) {
  for (const item of stackItems) {
    if (!STACK_LEVEL_OPTIONS.includes(item.level)) {
      throw new Error(
        `about stack item ${JSON.stringify(item.name)}: level ${JSON.stringify(item.level)} is not one of ${STACK_LEVEL_OPTIONS.join(", ")}`,
      );
    }
  }
  for (const contact of contactItems) {
    if (!CONTACT_ICON_OPTIONS.includes(contact.icon)) {
      throw new Error(
        `about contact ${JSON.stringify(contact.label)}: icon ${JSON.stringify(contact.icon)} is not one of ${CONTACT_ICON_OPTIONS.join(", ")}`,
      );
    }
  }
}

/**
 * The About source: the real exports of src/data/about.ts plus the body from about.md. A cell with no
 * variant becomes "default" (Pitfall 13); a stack level or contact icon outside its option list throws.
 * @param {string} repoRoot
 * @returns {AboutSource}
 */
export function loadAbout(repoRoot) {
  validateAboutOptions(stack, contacts);
  return {
    role,
    showAvailability,
    cells: cells.map((cell) => ({
      label: cell.label,
      value: cell.value,
      variant: cell.variant ?? "default",
    })),
    stack: stack.map((item) => ({ name: item.name, level: item.level })),
    contacts: contacts.map((contact) => ({
      icon: contact.icon,
      label: contact.label,
      href: contact.href,
    })),
    body: readFileSync(join(repoRoot, ABOUT_BODY_FILE), "utf8").trim(),
  };
}

/**
 * @param {string} repoRoot
 * @returns {SourceModel}
 */
export function loadSourceModel(repoRoot) {
  const projects = loadProjects(repoRoot);
  return {
    projects,
    tagOptions: deriveTagOptions(projects),
    about: loadAbout(repoRoot),
  };
}
