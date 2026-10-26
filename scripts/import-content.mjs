// @ts-check
// Builds an EmDash seed from the project markdown sources and applies it with the emdash seed CLI.
// usage: node scripts/import-content.mjs [--schema-check] [--root DIR]  (DIR defaults to the repo root; the database lands in DIR/data/emdash.db)
// --schema-check writes the structure seed to DIR/.emdash/seed.json and applies one draft project (the longest body) plus About, instead of the 13 projects.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { markdownToPortableText } from "emdash/client";
import {
  ABOUT_SLUG,
  ABOUT_TITLE,
  NAV_MENU,
  SITE_SETTINGS,
  aboutCollection,
  dateToDatetime,
  projectsCollection,
} from "./lib/schema.mjs";
import { loadSourceModel } from "./lib/sources.mjs";

/**
 * @typedef {import("emdash").SeedFile} SeedFile
 * @typedef {import("emdash").SeedContentEntry} SeedContentEntry
 * @typedef {import("./lib/sources.mjs").SourceModel} SourceModel
 */

const USAGE =
  "usage: node scripts/import-content.mjs [--schema-check] [--root DIR]";
export const SCHEMA_CHECK_SLUG = "schema-check-longest-body";
const SCHEMA_CHECK_TITLE = "Schema check: longest body";
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

/**
 * Build the seed in memory. Copy fields are stored verbatim; bodies become Portable Text (D-01).
 * @param {SourceModel} model
 * @returns {SeedFile}
 */
export function buildSeed(model) {
  const allowedTags = new Set(model.tagOptions);
  /** @type {SeedContentEntry[]} */
  const projects = model.projects.map((project) => {
    for (const tag of project.tags) {
      if (!allowedTags.has(tag)) {
        throw new Error(
          `${project.slug}: tag ${JSON.stringify(tag)} is not in the tag options`,
        );
      }
    }
    return {
      id: project.slug,
      slug: project.slug,
      status: project.draft ? "draft" : "published",
      data: {
        title: project.title,
        date: dateToDatetime(project.date),
        category: project.category,
        project_status: project.status,
        status_variant: project.statusVariant,
        surface: project.surface,
        time_label: project.timeLabel,
        period: project.period,
        tags: project.tags,
        summary: project.summary,
        sub: project.sub,
        stats: project.stats.map((stat) => ({
          label: stat.label,
          value: stat.value,
          variant: stat.variant,
        })),
        body: markdownToPortableText(project.body),
      },
    };
  });
  /** @type {SeedContentEntry} */
  const about = {
    id: ABOUT_SLUG,
    slug: ABOUT_SLUG,
    status: "published",
    data: {
      title: ABOUT_TITLE,
      role: model.about.role,
      show_availability: model.about.showAvailability,
      body: markdownToPortableText(model.about.body),
      cells: model.about.cells.map((cell) => ({ ...cell })),
      stack: model.about.stack.map((item) => ({ ...item })),
      contacts: model.about.contacts.map((contact) => ({ ...contact })),
    },
  };
  return {
    version: "1",
    meta: { name: "portfolio" },
    settings: structuredClone(SITE_SETTINGS),
    collections: [projectsCollection(model.tagOptions), aboutCollection()],
    menus: [
      {
        name: NAV_MENU.name,
        label: NAV_MENU.label,
        items: NAV_MENU.items.map((item) => ({ ...item })),
      },
    ],
    content: { projects, about: [about] },
  };
}

/**
 * The project with the largest body by UTF-8 bytes; a tie goes to the lowest slug.
 * @param {SourceModel["projects"]} projects
 * @returns {{ project: SourceModel["projects"][number], bytes: number }}
 */
export function longestBodyProject(projects) {
  const sized = projects.map((project) => ({
    project,
    bytes: Buffer.byteLength(project.body, "utf8"),
  }));
  const [first, ...rest] = sized;
  if (!first) throw new Error("no projects to pick a longest body from");
  return rest.reduce(
    (best, next) =>
      next.bytes > best.bytes ||
      (next.bytes === best.bytes && next.project.slug < best.project.slug)
        ? next
        : best,
    first,
  );
}

/**
 * The full seed with one draft project in place of the 13: the longest source body under a test slug and title,
 * every other field from that project. Settings, collections, menus and About are unchanged (decision Q4 4a).
 * @param {SourceModel} model
 * @returns {SeedFile}
 */
export function buildSchemaCheckSeed(model) {
  const full = buildSeed(model);
  const { project } = longestBodyProject(model.projects);
  const source = full.content?.projects.find(
    (entry) => entry.slug === project.slug,
  );
  if (!source) throw new Error(`${project.slug}: missing from the seed`);
  /** @type {SeedContentEntry} */
  const check = {
    ...source,
    id: SCHEMA_CHECK_SLUG,
    slug: SCHEMA_CHECK_SLUG,
    status: "draft",
    data: { ...source.data, title: SCHEMA_CHECK_TITLE },
  };
  return { ...full, content: { ...full.content, projects: [check] } };
}

/**
 * Structure only: no content key, so a setup flow that applies it adds the schema, menus and settings and no entries.
 * @param {SeedFile} seed
 * @returns {SeedFile}
 */
export function structureSeed(seed) {
  return structuredClone({
    version: seed.version,
    meta: seed.meta,
    settings: seed.settings,
    collections: seed.collections,
    menus: seed.menus,
  });
}

/**
 * Validate and apply the seed through the emdash seed CLI, never through SQLite directly (D-10).
 * @param {SeedFile} seed
 * @param {string} targetRoot
 * @param {{ quiet?: boolean }} [options] quiet captures the CLI output (a failure still throws with it attached)
 * @returns {void}
 */
export function applySeedFile(seed, targetRoot, { quiet = false } = {}) {
  const stdio = quiet ? "pipe" : "inherit";
  const cli = fileURLToPath(import.meta.resolve("emdash/cli"));
  // The CLI does not create data/ and fails with SQLite error 14 when it is missing.
  mkdirSync(join(targetRoot, "data"), { recursive: true });
  const dir = mkdtempSync(join(tmpdir(), "portfolio-seed-"));
  try {
    const seedPath = join(dir, "seed.json");
    writeFileSync(seedPath, JSON.stringify(seed));
    execFileSync(process.execPath, [cli, "seed", seedPath, "--validate"], {
      stdio,
    });
    execFileSync(
      process.execPath,
      [
        cli,
        "seed",
        seedPath,
        "-d",
        "./data/emdash.db",
        "--cwd",
        targetRoot,
        "--on-conflict",
        "update",
        "--skip-media",
      ],
      { stdio },
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * @param {string[]} argv
 * @returns {number}
 */
function main(argv) {
  let root = REPO_ROOT;
  let schemaCheck = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--root" && i + 1 < argv.length) {
      root = argv[++i];
    } else if (argv[i] === "--schema-check") {
      schemaCheck = true;
    } else {
      console.error(USAGE);
      return 2;
    }
  }
  const targetRoot = resolve(root);
  const model = loadSourceModel(REPO_ROOT);
  const dbPath = join(targetRoot, "data/emdash.db");
  if (schemaCheck) {
    // Written before any server starts: the setup flows apply .emdash/seed.json, or the built-in posts and pages without it.
    mkdirSync(join(targetRoot, ".emdash"), { recursive: true });
    writeFileSync(
      join(targetRoot, ".emdash/seed.json"),
      `${JSON.stringify(structureSeed(buildSeed(model)), null, 2)}\n`,
    );
    applySeedFile(buildSchemaCheckSeed(model), targetRoot);
    const { project, bytes } = longestBodyProject(model.projects);
    console.log(
      `import: schema-check entry ${SCHEMA_CHECK_SLUG} (body from ${project.slug}, ${bytes} bytes) and 1 about applied to ${dbPath}`,
    );
    return 0;
  }
  applySeedFile(buildSeed(model), targetRoot);
  console.log(
    `import: ${model.projects.length} projects and 1 about applied to ${dbPath}`,
  );
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
