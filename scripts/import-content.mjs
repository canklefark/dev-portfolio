// @ts-check
// Builds an EmDash seed from the project markdown sources and applies it with the emdash seed CLI.
// usage: node scripts/import-content.mjs [--schema-check [--force-structure-seed]] [--root DIR]  (DIR defaults to the repo root; the database lands in DIR/data/emdash.db)
// --schema-check writes the structure seed to DIR/.emdash/seed.json and applies one draft project (the longest body) plus About, instead of the 13 projects.
// ME-03: the repo's committed .emdash/seed.json is the exported content seed (13 projects, 1 about). --schema-check refuses to replace any seed that has a
// content key, or that cannot be parsed, unless --force-structure-seed is given, and checks before it writes or applies anything. To rebuild the schema-check
// database use a throwaway root (--root DIR with no .emdash/seed.json) or delete the seed first; never run it against the repo root without the flag.
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { markdownToPortableText } from "emdash/client";
import {
  ABOUT_SLUG,
  ABOUT_TITLE,
  CATEGORY_OPTIONS,
  NAV_MENU,
  SITE_SETTINGS,
  STAT_VARIANT_OPTIONS,
  STATUS_VARIANT_OPTIONS,
  aboutCollection,
  dateToDatetime,
  projectsCollection,
  taxonomyDefinitions,
  termSlug,
} from "./lib/schema.mjs";
import { runAsEntry } from "./lib/entry.mjs";
import { loadSourceModel } from "./lib/sources.mjs";

/**
 * @typedef {import("emdash").SeedFile} SeedFile
 * @typedef {import("emdash").SeedContentEntry} SeedContentEntry
 * @typedef {import("./lib/sources.mjs").SourceModel} SourceModel
 */

const USAGE =
  "usage: node scripts/import-content.mjs [--schema-check [--force-structure-seed]] [--root DIR]";
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
  const allowedCategories = new Set(CATEGORY_OPTIONS);
  /** @type {SeedContentEntry[]} */
  const projects = model.projects.map((project) => {
    // A term slug the seed does not define is skipped silently by the seed CLI, so refuse it here.
    if (!allowedCategories.has(project.category)) {
      throw new Error(
        `${project.slug}: category ${JSON.stringify(project.category)} is not in the category terms`,
      );
    }
    // A select value outside its option list would reach the admin and the front end unchecked (ME-04).
    if (!STATUS_VARIANT_OPTIONS.includes(project.statusVariant)) {
      throw new Error(
        `${project.slug}.md: statusVariant ${JSON.stringify(project.statusVariant)} is not one of ${STATUS_VARIANT_OPTIONS.join(", ")}`,
      );
    }
    project.stats.forEach((stat, i) => {
      if (!STAT_VARIANT_OPTIONS.includes(stat.variant)) {
        throw new Error(
          `${project.slug}.md: stats[${i}].variant ${JSON.stringify(stat.variant)} is not one of ${STAT_VARIANT_OPTIONS.join(", ")}`,
        );
      }
    });
    for (const tag of project.tags) {
      if (!allowedTags.has(tag)) {
        throw new Error(
          `${project.slug}: tag ${JSON.stringify(tag)} is not in the tag terms`,
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
        project_status: project.status,
        status_variant: project.statusVariant,
        surface: project.surface,
        time_label: project.timeLabel,
        period: project.period,
        summary: project.summary,
        sub: project.sub,
        stats: project.stats.map((stat) => ({
          label: stat.label,
          value: stat.value,
          variant: stat.variant,
        })),
        body: markdownToPortableText(project.body),
      },
      // D-05 and D-09 as amended: terms are content, assigned by slug; the seed CLI clears and re-attaches them on update.
      taxonomies: {
        category: [termSlug(project.category)],
        tag: project.tags.map(termSlug),
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
    collections: [projectsCollection(), aboutCollection()],
    taxonomies: taxonomyDefinitions(model.tagOptions),
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
 * Structure only: no content key, so a setup flow that applies it adds the schema, taxonomies with their terms, menus and settings and no entries.
 * @param {SeedFile} seed
 * @returns {SeedFile}
 */
export function structureSeed(seed) {
  return structuredClone({
    version: seed.version,
    meta: seed.meta,
    settings: seed.settings,
    collections: seed.collections,
    taxonomies: seed.taxonomies,
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
 * Throws when writing a structure-only seed to seedPath would replace content: an existing seed with a content key,
 * or one that cannot be read as JSON (it may hold content, so it is not overwritten unseen). A missing file is fine.
 * @param {string} seedPath
 * @returns {void}
 */
export function assertStructureSeedWritable(seedPath) {
  if (!existsSync(seedPath)) return;
  /** @type {unknown} */
  let existing;
  try {
    existing = JSON.parse(readFileSync(seedPath, "utf8"));
  } catch (error) {
    throw new Error(
      `${seedPath} exists but cannot be parsed (${error instanceof Error ? error.message : error}); refusing to overwrite it with a structure-only seed. Pass --force-structure-seed to replace it.`,
    );
  }
  if (
    existing !== null &&
    typeof existing === "object" &&
    "content" in existing
  ) {
    throw new Error(
      `${seedPath} holds a content seed; --schema-check would replace it with a structure-only seed. Use a throwaway --root, or pass --force-structure-seed to replace it.`,
    );
  }
}

/**
 * @param {string[]} argv
 * @returns {number}
 */
function main(argv) {
  let root = REPO_ROOT;
  let schemaCheck = false;
  let forceStructureSeed = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--root" && i + 1 < argv.length) {
      root = argv[++i];
    } else if (argv[i] === "--schema-check") {
      schemaCheck = true;
    } else if (argv[i] === "--force-structure-seed") {
      forceStructureSeed = true;
    } else {
      console.error(USAGE);
      return 2;
    }
  }
  if (forceStructureSeed && !schemaCheck) {
    console.error(
      `--force-structure-seed only applies with --schema-check\n${USAGE}`,
    );
    return 2;
  }
  const targetRoot = resolve(root);
  const model = loadSourceModel(REPO_ROOT);
  const dbPath = join(targetRoot, "data/emdash.db");
  if (schemaCheck) {
    // Written before any server starts: the setup flows apply .emdash/seed.json, or the built-in posts and pages without it.
    const seedPath = join(targetRoot, ".emdash/seed.json");
    if (!forceStructureSeed) assertStructureSeedWritable(seedPath);
    mkdirSync(join(targetRoot, ".emdash"), { recursive: true });
    writeFileSync(
      seedPath,
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

runAsEntry(import.meta.url, main);
