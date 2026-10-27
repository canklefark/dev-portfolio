// @ts-check
// Smoke test (GUARD-03) driven against a local node:http site on 127.0.0.1: nothing outside the machine is contacted.
// run: node --test scripts/smoke-test.test.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { check } from "./smoke-test.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "smoke-test.mjs");

/**
 * @typedef {{ status: number, body?: string, location?: string }} Reply
 * @typedef {(path: string, hit: number) => Reply} Routes answers a path; hit counts that path's requests from 1
 */

/** @type {import("node:http").Server[]} */
const servers = [];

after(async () => {
  await Promise.all(servers.map(closeServer));
});

/**
 * @param {import("node:http").Server} server
 * @returns {Promise<void>}
 */
function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
  });
}

/**
 * Start a site on a free port; the server is closed in after().
 * @param {Routes} routes
 * @returns {Promise<{ base: string, server: import("node:http").Server }>}
 */
function startSite(routes) {
  /** @type {Map<string, number>} */
  const hits = new Map();
  const server = createServer((request, response) => {
    const path = request.url ?? "/";
    const hit = (hits.get(path) ?? 0) + 1;
    hits.set(path, hit);
    const reply = routes(path, hit);
    response.writeHead(
      reply.status,
      reply.location === undefined ? {} : { location: reply.location },
    );
    response.end(reply.body ?? "");
  });
  servers.push(server);
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        reject(new Error("server has no port"));
        return;
      }
      resolve({ base: `http://127.0.0.1:${address.port}`, server });
    });
  });
}

/** A site where every checked path answers 200 and /projects/ links /projects/alpha/. */
const healthy = /** @type {Routes} */ (
  (path) =>
    path === "/projects/"
      ? { status: 200, body: '<a href="/projects/alpha/">Alpha</a>' }
      : { status: 200, body: "ok" }
);

/**
 * Run the CLI without blocking this process's event loop, which serves the fake site.
 * @param {string[]} args
 * @returns {Promise<{ status: number | null, stdout: string, stderr: string }>}
 */
function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      env: { PATH: process.env.PATH ?? "" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

describe("smoke-test", () => {
  it("passes when /, /projects/ and the first project page answer 200", async () => {
    const { base } = await startSite(healthy);
    assert.equal(await check(base), null);
  });

  it("CLI prints smoke-test: PASS and exits 0 against a healthy site", async () => {
    const { base } = await startSite(healthy);
    const result = await runCli([base, "--attempts", "1"]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim().split("\n").at(-1), "smoke-test: PASS");
  });
});
