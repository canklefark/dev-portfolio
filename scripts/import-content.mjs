// @ts-check
// Builds an EmDash seed from the project markdown sources and applies it with the emdash seed CLI.
// usage: node scripts/import-content.mjs [--root DIR]  (DIR defaults to the repo root; the database lands in DIR/data/emdash.db)
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
  projectsCollection,
} from "./lib/schema.mjs";
import { loadSourceModel } from "./lib/sources.mjs";

/**
 * @typedef {import("emdash").SeedFile} SeedFile
 * @typedef {import("emdash").SeedContentEntry} SeedContentEntry
 * @typedef {import("./lib/sources.mjs").SourceModel} SourceModel
 */

const USAGE = "usage: node scripts/import-content.mjs [--root DIR]";
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
        date: project.date,
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
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--root" && i + 1 < argv.length) {
      root = argv[++i];
    } else {
      console.error(USAGE);
      return 2;
    }
  }
  const targetRoot = resolve(root);
  const model = loadSourceModel(REPO_ROOT);
  applySeedFile(buildSeed(model), targetRoot);
  console.log(
    `import: ${model.projects.length} projects and 1 about applied to ${join(targetRoot, "data/emdash.db")}`,
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
