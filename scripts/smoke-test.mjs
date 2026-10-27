// @ts-check
// Post-deploy smoke test (GUARD-03): "/", "/projects/" and the first project page linked from it must each
// answer 200 with no redirect. A failure only reports; nothing is rolled back or restarted (D-04).
// usage: node scripts/smoke-test.mjs BASE_URL [--attempts N] [--delay-ms MS]
//   --attempts N   tries before giving up (default 10)
//   --delay-ms MS  pause between tries, for a cold container or a certificate still being issued (default 15000)
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const FETCH_TIMEOUT_MS = 15000;
const DEFAULT_ATTEMPTS = 10;
const DEFAULT_DELAY_MS = 15000;
const USAGE =
  "usage: node scripts/smoke-test.mjs BASE_URL [--attempts N] [--delay-ms MS]";

/**
 * One request that never follows a redirect: a 3xx is a failure, not a page.
 * @param {string} base
 * @param {string} path
 * @returns {Promise<{ status: number, body: string }>}
 */
async function get(base, path) {
  const response = await fetch(new URL(path, base), {
    redirect: "manual",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  return { status: response.status, body: await response.text() };
}

/**
 * Request "/", "/projects/" and the first project page, in that order.
 * @param {string} base site origin, for example https://dev.zeikcookson.com
 * @returns {Promise<string | null>} null when healthy, otherwise the failure reason
 */
export async function check(base) {
  let path = "/";
  try {
    const home = await get(base, path);
    if (home.status !== 200) return `${path} answered ${home.status}`;

    path = "/projects/";
    const index = await get(base, path);
    if (index.status !== 200) return `${path} answered ${index.status}`;

    const link = /href="\/projects\/([a-z0-9-]+)\/?"/.exec(index.body);
    if (link === null) return "no project link on /projects/";

    path = `/projects/${link[1]}/`;
    const page = await get(base, path);
    return page.status === 200 ? null : `${path} answered ${page.status}`;
  } catch (error) {
    return `${path} request failed: ${error instanceof Error ? error.message : error}`;
  }
}

/**
 * @param {string} text
 * @returns {number | null} the value when text is a positive integer
 */
function positiveInteger(text) {
  return /^[1-9][0-9]*$/.test(text) ? Number(text) : null;
}

/**
 * @param {string[]} argv
 * @returns {{ base: string, attempts: number, delayMs: number } | null} null on bad arguments
 */
function parseArgs(argv) {
  /** @type {string | null} */
  let base = null;
  let attempts = DEFAULT_ATTEMPTS;
  let delayMs = DEFAULT_DELAY_MS;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--attempts" || arg === "--delay-ms") {
      const value = positiveInteger(argv[i + 1] ?? "");
      if (value === null) return null;
      if (arg === "--attempts") attempts = value;
      else delayMs = value;
      i += 1;
    } else if (arg.startsWith("--") || base !== null) {
      return null;
    } else {
      base = arg;
    }
  }
  if (base === null) return null;
  try {
    const { protocol } = new URL(base);
    if (protocol !== "http:" && protocol !== "https:") return null;
  } catch {
    return null;
  }
  return { base, attempts, delayMs };
}

/** @param {string[]} argv */
async function main(argv) {
  const options = parseArgs(argv);
  if (options === null) {
    console.error(USAGE);
    process.exit(2);
  }
  /** @type {string | null} */
  let failure = null;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    failure = await check(options.base);
    if (failure === null) break;
    console.log(
      `smoke-test: attempt ${attempt}/${options.attempts} failed: ${failure}`,
    );
    if (attempt < options.attempts) await sleep(options.delayMs);
  }
  console.log(
    failure === null ? "smoke-test: PASS" : `smoke-test: FAIL (${failure})`,
  );
  process.exitCode = failure === null ? 0 : 1;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main(process.argv.slice(2));
}
