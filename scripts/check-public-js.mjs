// @ts-check
// Public-JS guard (GUARD-01): builds the site, seeds a throwaway database from .emdash/seed.json plus a draft
// fixture, serves the Node build from a temp directory on 127.0.0.1, asserts the HTTP status of every public
// route (project routes are crawled from /projects/), the 404 cases and the admin route, and that no public page
// links to /_emdash/ other than uploaded media. The repo data/ directory is never read or written.
// usage: node scripts/check-public-js.mjs [--skip-build] [--out DIR]
//   --skip-build  reuse the existing dist/ instead of running npm run build
//   --out DIR     write the fetched pages to DIR and keep them (default: a temp directory that is removed)
import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

/**
 * @typedef {{ skipBuild: boolean, out: string | null }} Options
 * @typedef {{ path: string, expected: number, file: string | null }} RouteCheck
 */

const HOST = "127.0.0.1";
const HEALTH_PATH = "/_emdash/api/health";
const HEALTH_TIMEOUT_MS = 30000;
const FETCH_TIMEOUT_MS = 15000;
const KILL_GRACE_MS = 5000;
const KEPT_LINES = 50;
// The one /_emdash/ path public pages may reference: uploaded media (the share image, favicon) is served from it.
const PUBLIC_MEDIA_PATH = "/_emdash/api/media/file/";
// Unmatched path that requests the 404 page from a running server.
const MISSING_ROUTE = "/__parity_missing_route__/";
// Slug no project has: must answer 404 (fetched, never written).
const MISSING_PROJECT = "/projects/__no_such_slug__/";
// Draft entry applied from the fixture seed: must answer 404 and never appear on /projects/.
const DRAFT_SLUG = "draft-fixture-project";
// Published project whose database id, wrong-case slug and extra segment must all answer 404.
const KNOWN_SLUG = "catalog-cms";
const WRONG_CASE_SLUG = "Catalog-CMS";
const ADMIN_PATH = "/_emdash/admin";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const USAGE =
  "usage: node scripts/check-public-js.mjs [--skip-build] [--out DIR]";

/**
 * @param {string[]} argv
 * @returns {Options | null} null when the arguments are invalid
 */
function parseArgs(argv) {
  /** @type {Options} */
  const options = { skipBuild: false, out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--skip-build") {
      options.skipBuild = true;
    } else if (argv[i] === "--out" && i + 1 < argv.length) {
      options.out = resolve(argv[++i]);
    } else {
      return null;
    }
  }
  return options;
}

/**
 * Fixed page routes plus one route per project slug crawled from the /projects/ body.
 * "/" is fetched at "/", "/404" through an unmatched path, every other route at "<route>/".
 * @param {string[]} slugs
 * @returns {RouteCheck[]}
 */
function pageChecks(slugs) {
  return [
    { path: "/", expected: 200, file: "index.html" },
    { path: MISSING_ROUTE, expected: 404, file: "404.html" },
    { path: "/about/", expected: 200, file: "about/index.html" },
    { path: "/projects/", expected: 200, file: "projects/index.html" },
    ...slugs.map((slug) => ({
      path: `/projects/${slug}/`,
      expected: 200,
      file: `projects/${slug}/index.html`,
    })),
  ];
}

/**
 * Paths that must answer 404: unknown, draft, database id, wrong case and an extra segment.
 * @param {string} projectId database id of the published KNOWN_SLUG entry
 * @returns {string[]}
 */
function negativePaths(projectId) {
  return [
    MISSING_PROJECT,
    `/projects/${DRAFT_SLUG}/`,
    `/projects/${projectId}/`,
    `/projects/${WRONG_CASE_SLUG}/`,
    `/projects/${KNOWN_SLUG}/extra/`,
  ];
}

/**
 * Project slugs linked from a /projects/ body, sorted and without duplicates.
 * @param {string} html
 * @returns {string[]}
 */
function crawlSlugs(html) {
  const slugs = new Set(
    [...html.matchAll(/href="\/projects\/([a-z0-9-]+)\/?"/g)].map((m) => m[1]),
  );
  return [...slugs].sort();
}

/**
 * Apply a seed file to the temp database. The path is an argument array entry, never a shell string.
 * @param {string} work temp working directory holding data/
 * @param {string} seedPath
 * @returns {boolean}
 */
function applySeed(work, seedPath) {
  const seed = spawnSync(
    process.execPath,
    [
      join(repo, "node_modules", "emdash", "dist", "cli", "index.mjs"),
      "seed",
      seedPath,
      "-d",
      "./data/emdash.db",
      "--cwd",
      work,
      "--skip-media",
    ],
    { cwd: work, encoding: "utf8" },
  );
  if (seed.status !== 0) {
    console.log(`${seed.stdout ?? ""}${seed.stderr ?? ""}`.trimEnd());
    return false;
  }
  return true;
}

/**
 * Database id of a published project, read from the temp database (never the repo data/).
 * @param {string} work temp working directory holding data/
 * @param {string} slug
 * @returns {string | null}
 */
function projectId(work, slug) {
  const db = new DatabaseSync(join(work, "data", "emdash.db"), {
    readOnly: true,
  });
  try {
    const row = db
      .prepare(
        "SELECT id FROM ec_projects WHERE slug = ? AND deleted_at IS NULL",
      )
      .get(slug);
    return typeof row?.id === "string" ? row.id : null;
  } finally {
    db.close();
  }
}

/** @returns {Promise<number>} a free port on the loopback interface */
function freePort() {
  return new Promise((done, fail) => {
    const probe = createServer();
    probe.once("error", fail);
    probe.listen(0, HOST, () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => done(port));
    });
  });
}

/** @param {number} ms */
function sleep(ms) {
  return new Promise((done) => setTimeout(done, ms));
}

/**
 * Poll the health endpoint until it answers 200 or the child exits or the limit passes.
 * @param {string} base
 * @param {() => boolean} serverExited
 * @returns {Promise<boolean>}
 */
async function waitForHealth(base, serverExited) {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  while (Date.now() < deadline && !serverExited()) {
    try {
      const response = await fetch(base + HEALTH_PATH, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.status === 200) return true;
    } catch {
      // not listening yet
    }
    await sleep(250);
  }
  return false;
}

/**
 * The admin answers under /_emdash/ only: 200 directly, or a redirect to a same-origin /_emdash/
 * path that answers 200 (ADMIN-01).
 * @param {string} base
 * @returns {Promise<boolean>}
 */
async function checkAdmin(base) {
  let path = ADMIN_PATH;
  for (let hop = 0; hop < 3; hop++) {
    const response = await fetch(base + path, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    console.log(`ADMIN ${path} ${response.status}`);
    if (response.status === 200) return true;
    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || location === null) {
      break;
    }
    const target = new URL(location, base);
    if (target.origin !== base || !target.pathname.startsWith("/_emdash/")) {
      break;
    }
    path = target.pathname + target.search;
  }
  console.log(`UNEXPECTED ${ADMIN_PATH}: no 200 answer under /_emdash/`);
  return false;
}

/** @type {import("node:child_process").ChildProcess | null} */
let server = null;
/** @type {string[]} */
const serverOutput = [];
/** @type {string[]} */
const tempDirs = [];

/** @param {Buffer | string} chunk */
function keepOutput(chunk) {
  for (const line of String(chunk).split("\n")) {
    if (line.trim() !== "") serverOutput.push(line);
  }
  while (serverOutput.length > KEPT_LINES) serverOutput.shift();
}

/** SIGTERM the child server, SIGKILL it if it is still alive after the grace period. */
async function stopServer() {
  const child = server;
  server = null;
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((done) => child.once("exit", done));
  child.kill("SIGTERM");
  const timer = setTimeout(() => child.kill("SIGKILL"), KILL_GRACE_MS);
  await exited;
  clearTimeout(timer);
}

function removeTempDirs() {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** @param {number} code */
function interrupted(code) {
  return () => {
    stopServer().finally(() => {
      removeTempDirs();
      process.exit(code);
    });
  };
}

/**
 * @param {Options} options
 * @returns {Promise<string | null>} null on success, otherwise the failure reason
 */
async function run(options) {
  const entry = join(repo, "dist", "server", "entry.mjs");
  if (!options.skipBuild) {
    const build = spawnSync("npm", ["run", "build"], {
      cwd: repo,
      stdio: "inherit",
    });
    if (build.status !== 0) return "build failed";
  }
  if (!existsSync(entry)) return `${entry} not found`;

  // Fresh working directory: the server reads ./data/emdash.db relative to its cwd, so the
  // repo database is never opened. Seed before the first start (an unseeded database
  // would be auto-seeded with the default collections). The draft fixture goes in second.
  const work = mkdtempSync(join(tmpdir(), "check-public-js-"));
  tempDirs.push(work);
  mkdirSync(join(work, "data"));
  if (!applySeed(work, join(repo, ".emdash", "seed.json"))) {
    return "seed failed";
  }
  if (
    !applySeed(
      work,
      join(repo, "scripts", "fixtures", "draft-project.seed.json"),
    )
  ) {
    return "draft fixture seed failed";
  }
  const knownId = projectId(work, KNOWN_SLUG);
  if (knownId === null) return `no published project with slug ${KNOWN_SLUG}`;

  let outDir = options.out;
  if (outDir === null) {
    outDir = mkdtempSync(join(tmpdir(), "check-public-js-out-"));
    tempDirs.push(outDir);
  } else {
    mkdirSync(outDir, { recursive: true });
  }
  const outputDir = outDir;

  const port = await freePort();
  const base = `http://${HOST}:${port}`;
  const child = spawn(process.execPath, [entry], {
    cwd: work,
    env: {
      ...process.env,
      HOST,
      PORT: String(port),
      EMDASH_SITE_URL: base,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server = child;
  child.stdout?.on("data", keepOutput);
  child.stderr?.on("data", keepOutput);
  const exited = () => child.exitCode !== null || child.signalCode !== null;

  if (!(await waitForHealth(base, exited))) {
    console.log(serverOutput.join("\n"));
    return exited()
      ? "server exited before it was ready"
      : `server not ready within ${HEALTH_TIMEOUT_MS / 1000}s`;
  }

  let unexpected = 0;
  /** @type {string[]} */
  const adminRefs = [];

  /**
   * @param {string} label
   * @param {string} path
   * @param {number} expected
   * @param {string | null} file where to write the body, null to discard it
   * @returns {Promise<string | null>} the body when the status matched
   */
  async function visit(label, path, expected, file) {
    const response = await fetch(base + path, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    console.log(`${label} ${path} ${response.status}`);
    const body = await response.text();
    if (response.status !== expected) {
      console.log(
        `UNEXPECTED ${path}: status ${response.status}, expected ${expected}`,
      );
      unexpected++;
      return null;
    }
    if (body.replaceAll(PUBLIC_MEDIA_PATH, "").includes("/_emdash/")) {
      console.log(`ADMIN-REF ${path}`);
      adminRefs.push(path);
    }
    if (file !== null) {
      const target = join(outputDir, file);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, body);
    }
    return body;
  }

  // Routes come from content: crawl the project links on /projects/ so a new project cannot escape.
  const index = await visit("FETCH", "/projects/", 200, "projects/index.html");
  if (index === null) return "1 unexpected status";
  const slugs = crawlSlugs(index);
  if (slugs.length === 0) return "no project links found on /projects/";
  if (slugs.includes(DRAFT_SLUG) || index.includes(DRAFT_SLUG)) {
    console.log(`UNEXPECTED /projects/: lists draft ${DRAFT_SLUG}`);
    return "draft project listed on /projects/";
  }
  for (const check of pageChecks(slugs)) {
    if (check.path === "/projects/") continue;
    await visit("FETCH", check.path, check.expected, check.file);
  }
  for (const path of negativePaths(knownId)) {
    await visit("NEGATIVE", path, 404, null);
  }
  if (!(await checkAdmin(base))) unexpected++;
  if (unexpected > 0) return `${unexpected} unexpected status`;
  if (adminRefs.length > 0) {
    return `${adminRefs.length} public pages reference /_emdash/`;
  }
  return null;
}

const options = parseArgs(process.argv.slice(2));
if (options === null) {
  console.error(USAGE);
  process.exit(2);
}
process.on("SIGINT", interrupted(130));
process.on("SIGTERM", interrupted(143));

/** @type {string | null} */
let failure = null;
try {
  failure = await run(options);
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : error}`);
  failure = "unexpected error";
} finally {
  await stopServer();
  removeTempDirs();
}
console.log(
  failure === null
    ? "check-public-js: PASS"
    : `check-public-js: FAIL (${failure})`,
);
process.exitCode = failure === null ? 0 : 1;
