// @ts-check
// Public-JS guard (GUARD-01): builds the site, seeds a throwaway database from .emdash/seed.json, serves the
// Node build from a temp directory on 127.0.0.1, asserts the HTTP status of every public route, then runs the
// script-inventory allowlist check on the fetched pages. The repo data/ directory is never read or written.
// usage: node scripts/check-public-js.mjs [--skip-build] [--out DIR]
//   --skip-build  reuse the existing dist/ instead of running npm run build
//   --out DIR     write the fetched pages to DIR and keep them (default: a temp directory that is removed)
import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
// Unmatched path that requests the 404 page from a running server (same as script-inventory.mjs).
const MISSING_ROUTE = "/__parity_missing_route__/";
// Slug no project has: must answer 404 (fetched, never written).
const MISSING_PROJECT = "/projects/__no_such_slug__/";

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
 * Pages to fetch, taken from the allowlist routes that name one page (no wildcard).
 * "/" is fetched at "/", "/404" through an unmatched path, every other route at "<route>/".
 * The negative route is fetched too but never written.
 * @returns {RouteCheck[]}
 */
function loadChecks() {
  const allowlist = JSON.parse(
    readFileSync(join(repo, "scripts", "script-allowlist.json"), "utf8"),
  );
  const routes = Object.keys(allowlist.routes)
    .filter((route) => !route.includes("*"))
    .sort();
  /** @type {RouteCheck[]} */
  const checks = routes.map((route) => {
    if (route === "/") return { path: "/", expected: 200, file: "index.html" };
    if (route === "/404") {
      return { path: MISSING_ROUTE, expected: 404, file: "404.html" };
    }
    return {
      path: `${route}/`,
      expected: 200,
      file: `${route.slice(1)}/index.html`,
    };
  });
  checks.push({ path: MISSING_PROJECT, expected: 404, file: null });
  return checks;
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
  // would be auto-seeded with the default collections).
  const work = mkdtempSync(join(tmpdir(), "check-public-js-"));
  tempDirs.push(work);
  mkdirSync(join(work, "data"));
  const seed = spawnSync(
    process.execPath,
    [
      join(repo, "node_modules", "emdash", "dist", "cli", "index.mjs"),
      "seed",
      join(repo, ".emdash", "seed.json"),
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
    return "seed failed";
  }

  let outDir = options.out;
  if (outDir === null) {
    outDir = mkdtempSync(join(tmpdir(), "check-public-js-out-"));
    tempDirs.push(outDir);
  } else {
    mkdirSync(outDir, { recursive: true });
  }

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

  // Assert every status before the script check: an error page carries fewer scripts and
  // would pass the allowlist.
  let unexpected = 0;
  for (const check of loadChecks()) {
    const response = await fetch(base + check.path, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    console.log(`FETCH ${check.path} ${response.status}`);
    if (response.status !== check.expected) {
      console.log(
        `UNEXPECTED ${check.path}: status ${response.status}, expected ${check.expected}`,
      );
      unexpected++;
      continue;
    }
    if (check.file === null) continue;
    const target = join(outDir, check.file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, await response.text());
  }
  if (unexpected > 0) return `${unexpected} unexpected status`;

  const inventory = spawnSync(
    process.execPath,
    [
      join(repo, "scripts", "script-inventory.mjs"),
      "check",
      join(repo, "scripts", "script-allowlist.json"),
      outDir,
    ],
    { stdio: "inherit" },
  );
  if (inventory.status !== 0) return "script allowlist check failed";
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
