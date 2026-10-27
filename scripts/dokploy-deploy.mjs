// @ts-check
// Dokploy trigger and wait (D-04): records the newest deployment, asks Dokploy to deploy the application, then
// waits until a newer deployment reaches done. error or cancelled, and a wait that outlasts the timeout, are
// failures. Only reads and one deploy request are made: nothing is rolled back or restarted.
// usage: DOKPLOY_URL=... DOKPLOY_API_KEY=... DOKPLOY_APP_ID=... node scripts/dokploy-deploy.mjs [--interval-ms N] [--timeout-ms N]
//   --interval-ms N  pause between status reads (default 10000)
//   --timeout-ms N   longest wait for the new deployment (default 900000)
// The key goes out only in the x-api-key header; headers, the key and response bodies are never printed.
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";

/**
 * @typedef {{ id: string, status: string }} Deployment
 * @typedef {{ url: string, apiKey: string, appId: string, intervalMs: number, timeoutMs: number }} DeployOptions
 */

const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_INTERVAL_MS = 10000;
const DEFAULT_TIMEOUT_MS = 900000;
const REQUIRED_VARIABLES = ["DOKPLOY_URL", "DOKPLOY_API_KEY", "DOKPLOY_APP_ID"];
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const USAGE =
  "usage: DOKPLOY_URL=... DOKPLOY_API_KEY=... DOKPLOY_APP_ID=... node scripts/dokploy-deploy.mjs [--interval-ms N] [--timeout-ms N]";

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {string} the text, or "" when value is neither a string nor a number
 */
function asText(value) {
  if (typeof value === "string") return value;
  return typeof value === "number" ? String(value) : "";
}

/**
 * @param {unknown} body
 * @returns {Deployment | null | undefined} the newest deployment, null for an empty list, undefined when body is not a readable list
 */
function readLatest(body) {
  const list = Array.isArray(body)
    ? body
    : isRecord(body) && Array.isArray(body.data)
      ? body.data
      : null;
  if (list === null) return undefined;
  if (list.length === 0) return null;
  if (!list.every(isRecord)) return undefined;
  const times = list.map((item) => Date.parse(asText(item.createdAt)));
  const newest = times.every((time) => !Number.isNaN(time))
    ? times.indexOf(Math.max(...times))
    : 0;
  const item = list[newest];
  const id = asText(item.deploymentId) || asText(item.id);
  if (id === "") return undefined;
  return { id, status: asText(item.status) || "unknown" };
}

/**
 * The newest deployment in a deployment.all answer.
 * @param {unknown} body an array, or an object whose data is an array
 * @returns {{ id: string, status: string } | null} null for an empty list or any other shape
 */
export function latestDeployment(body) {
  return readLatest(body) ?? null;
}

/**
 * @param {string} listUrl
 * @param {Record<string, string>} headers
 * @returns {Promise<{ reason: string } | { latest: Deployment | null }>}
 */
async function readList(listUrl, headers) {
  const response = await fetch(listUrl, {
    headers,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok)
    return { reason: `deployment.all answered ${response.status}` };
  /** @type {unknown} */
  let body;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  const latest = readLatest(body);
  if (latest === undefined) {
    return { reason: "deployment.all did not return a deployment list" };
  }
  return { latest };
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Trigger a deploy and wait for a newer deployment to finish.
 * @param {DeployOptions} options url has no trailing slash
 * @returns {Promise<string | null>} null once a newer deployment is done, otherwise the failure reason
 */
export async function deploy(options) {
  const { url, apiKey, appId, intervalMs, timeoutMs } = options;
  const listUrl = `${url}/api/deployment.all?${new URLSearchParams({ applicationId: appId })}`;
  const headers = { accept: "application/json", "x-api-key": apiKey };

  /** @type {Awaited<ReturnType<typeof readList>>} */
  let first;
  try {
    first = await readList(listUrl, headers);
  } catch (error) {
    return `deployment.all request failed: ${messageOf(error)}`;
  }
  if ("reason" in first) return first.reason;
  const before = first.latest?.id ?? null;
  console.log(
    `dokploy-deploy: newest deployment before the trigger: ${before ?? "none"}`,
  );

  try {
    const response = await fetch(`${url}/api/application.deploy`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ applicationId: appId }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return `application.deploy answered ${response.status}`;
  } catch (error) {
    return `application.deploy request failed: ${messageOf(error)}`;
  }
  console.log("dokploy-deploy: deploy requested");

  const deadline = Date.now() + timeoutMs;
  /** @type {Deployment | null} */
  let seen = null;
  for (;;) {
    try {
      const polled = await readList(listUrl, headers);
      if ("reason" in polled) return polled.reason;
      const latest = polled.latest;
      if (latest !== null && latest.id !== before) {
        if (seen?.id !== latest.id || seen.status !== latest.status) {
          console.log(
            `dokploy-deploy: deployment ${latest.id} is ${latest.status}`,
          );
        }
        seen = latest;
        if (latest.status === "done") return null;
        if (latest.status === "error" || latest.status === "cancelled") {
          return `deployment ${latest.id} ended with status ${latest.status}`;
        }
      }
    } catch (error) {
      console.log(
        `dokploy-deploy: deployment.all request failed: ${messageOf(error)}`,
      );
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(intervalMs, remaining));
  }
  return `timed out after ${timeoutMs} ms waiting for a new deployment${
    seen === null ? "" : ` (last seen: ${seen.id} ${seen.status})`
  }`;
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
 * @returns {{ intervalMs: number, timeoutMs: number } | null} null on bad arguments
 */
function parseArgs(argv) {
  let intervalMs = DEFAULT_INTERVAL_MS;
  let timeoutMs = DEFAULT_TIMEOUT_MS;
  for (let i = 0; i < argv.length; i += 2) {
    const arg = argv[i];
    const value = positiveInteger(argv[i + 1] ?? "");
    if (value === null) return null;
    if (arg === "--interval-ms") intervalMs = value;
    else if (arg === "--timeout-ms") timeoutMs = value;
    else return null;
  }
  return { intervalMs, timeoutMs };
}

/** @param {string[]} argv */
async function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed === null) {
    console.error(USAGE);
    process.exit(2);
  }
  const missing = REQUIRED_VARIABLES.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`dokploy-deploy: missing ${missing.join(", ")}`);
    process.exit(2);
  }
  const url = (process.env.DOKPLOY_URL ?? "").replace(/\/+$/, "");
  /** @type {URL} */
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    console.error("dokploy-deploy: DOKPLOY_URL is not a valid URL");
    process.exit(2);
  }
  const secure =
    parsedUrl.protocol === "https:" ||
    (parsedUrl.protocol === "http:" && LOCAL_HOSTS.has(parsedUrl.hostname));
  if (!secure) {
    console.error("dokploy-deploy: DOKPLOY_URL must use https");
    process.exit(2);
  }

  /** @type {string | null} */
  let failure = null;
  try {
    failure = await deploy({
      url,
      apiKey: process.env.DOKPLOY_API_KEY ?? "",
      appId: process.env.DOKPLOY_APP_ID ?? "",
      ...parsed,
    });
  } catch (error) {
    console.error(`error: ${messageOf(error)}`);
    failure = "unexpected error";
  }
  console.log(
    failure === null
      ? "dokploy-deploy: PASS"
      : `dokploy-deploy: FAIL (${failure})`,
  );
  process.exitCode = failure === null ? 0 : 1;
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main(process.argv.slice(2));
}
