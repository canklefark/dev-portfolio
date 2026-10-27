// @ts-check
// Dokploy trigger and wait (D-04) driven against a local fake Dokploy API and a fake site on 127.0.0.1: the real
// panel is never contacted.
// run: node --test scripts/dokploy-deploy.test.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { after, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { deploy, latestDeployment } from "./dokploy-deploy.mjs";
import { check } from "./smoke-test.mjs";

const SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  "dokploy-deploy.mjs",
);

/**
 * @typedef {{ method: string, pathname: string, search: string, key: string | undefined, body: string }} Logged
 * @typedef {{ status: number, json?: unknown, text?: string }} Reply
 * @typedef {(request: Logged, requests: Logged[]) => Reply} Responder
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
 * Start a fake server on a free port that logs every request; closed in after().
 * @param {Responder} respond
 * @returns {Promise<{ base: string, requests: Logged[] }>}
 */
function startServer(respond) {
  /** @type {Logged[]} */
  const requests = [];
  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const key = request.headers["x-api-key"];
      /** @type {Logged} */
      const logged = {
        method: request.method ?? "GET",
        pathname: url.pathname,
        search: url.search,
        key: Array.isArray(key) ? key[0] : key,
        body,
      };
      requests.push(logged);
      const reply = respond(logged, requests);
      response.writeHead(reply.status, { "content-type": "application/json" });
      response.end(
        reply.text ??
          (reply.json === undefined ? "" : JSON.stringify(reply.json)),
      );
    });
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
      resolve({ base: `http://127.0.0.1:${address.port}`, requests });
    });
  });
}

/**
 * A fake Dokploy API whose deployment list changes with the number of GETs seen.
 * @param {unknown[]} beforeLists lists answered before application.deploy was requested (the last repeats)
 * @param {unknown[]} afterLists lists answered after it (the last repeats)
 * @returns {Responder}
 */
function dokploy(beforeLists, afterLists) {
  return (request, requests) => {
    if (request.method === "POST") return { status: 200, json: { ok: true } };
    const posted = requests.findIndex((r) => r.method === "POST");
    if (posted < 0) {
      const seen = requests.length - 1;
      return {
        status: 200,
        json: beforeLists[Math.min(seen, beforeLists.length - 1)],
      };
    }
    const seen = requests.length - posted - 2;
    return {
      status: 200,
      json: afterLists[Math.min(seen, afterLists.length - 1)],
    };
  };
}

/**
 * Run the CLI without blocking this process's event loop, which serves the fake API. The environment holds only
 * PATH plus env, so a real DOKPLOY_* variable of the developer is never inherited.
 * @param {string[]} args
 * @param {Record<string, string>} env
 * @returns {Promise<{ status: number | null, stdout: string, stderr: string }>}
 */
function runCli(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      env: { PATH: process.env.PATH ?? "", ...env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

/**
 * @param {string} url
 * @returns {import("./dokploy-deploy.mjs").DeployOptions}
 */
function options(url) {
  return {
    url,
    apiKey: "test-key",
    appId: "app-test",
    intervalMs: 10,
    timeoutMs: 2000,
  };
}

const D0 = { deploymentId: "d0", status: "done" };

describe("dokploy-deploy", () => {
  it("triggers a deploy and waits for the newer deployment to finish", async () => {
    const d0 = { deploymentId: "d0", status: "done" };
    const { base, requests } = await startServer(
      dokploy(
        [[d0]],
        [
          [{ deploymentId: "d1", status: "running" }, d0],
          [{ deploymentId: "d1", status: "done" }, d0],
        ],
      ),
    );
    const reason = await deploy({
      url: base,
      apiKey: "test-key",
      appId: "app-test",
      intervalMs: 10,
      timeoutMs: 2000,
    });
    assert.equal(reason, null);
    const post = requests.find((r) => r.method === "POST");
    assert.ok(post, "application.deploy was requested");
    assert.equal(post.pathname, "/api/application.deploy");
    assert.deepEqual(JSON.parse(post.body), { applicationId: "app-test" });
    assert.equal(post.key, "test-key");
    const get = requests.find((r) => r.method === "GET");
    assert.ok(get);
    assert.equal(get.pathname, "/api/deployment.all");
    assert.equal(get.search, "?applicationId=app-test");
    assert.equal(get.key, "test-key");
  });

  it("chain: deploy then smoke against local stand-ins", async () => {
    const api = await startServer(
      dokploy(
        [[{ deploymentId: "d0", status: "done" }]],
        [[{ deploymentId: "d1", status: "done" }]],
      ),
    );
    const site = await startServer((request) =>
      request.pathname === "/projects/"
        ? { status: 200, text: '<a href="/projects/alpha/">Alpha</a>' }
        : { status: 200, text: "ok" },
    );
    assert.equal(
      await deploy({
        url: api.base,
        apiKey: "test-key",
        appId: "app-test",
        intervalMs: 10,
        timeoutMs: 2000,
      }),
      null,
    );
    assert.equal(await check(site.base), null);
  });

  it("fails when the newer deployment ends in error or cancelled", async () => {
    for (const status of ["error", "cancelled"]) {
      const { base } = await startServer(
        dokploy([[D0]], [[{ deploymentId: "d1", status }, D0]]),
      );
      const reason = await deploy(options(base));
      assert.ok(
        reason?.includes(`ended with status ${status}`),
        `reason for ${status}: ${reason}`,
      );
    }
  });

  it("fails when no newer deployment finishes before the timeout", async () => {
    const { base } = await startServer(
      dokploy([[D0]], [[{ deploymentId: "d1", status: "running" }, D0]]),
    );
    const reason = await deploy({ ...options(base), timeoutMs: 200 });
    assert.ok(
      reason?.startsWith("timed out after 200 ms"),
      `reason: ${reason}`,
    );
    assert.ok(reason?.includes("d1 running"), `reason: ${reason}`);
  });

  it("fails on a refused API key without printing it", async () => {
    const { base } = await startServer((request) =>
      request.key === "test-key"
        ? { status: 200, json: [D0] }
        : { status: 401 },
    );
    const key = "secret-test-key-123";
    const result = await runCli(
      ["--interval-ms", "10", "--timeout-ms", "500"],
      {
        DOKPLOY_URL: base,
        DOKPLOY_API_KEY: key,
        DOKPLOY_APP_ID: "app-test",
      },
    );
    assert.equal(result.status, 1);
    assert.match(
      result.stdout,
      /(application\.deploy|deployment\.all) answered 401/,
    );
    assert.ok(!result.stdout.includes(key), "key printed on stdout");
    assert.ok(!result.stderr.includes(key), "key printed on stderr");
  });

  it("does not trigger when the deployment list cannot be read", async () => {
    const { base, requests } = await startServer(() => ({ status: 500 }));
    const reason = await deploy(options(base));
    assert.equal(reason, "deployment.all answered 500");
    assert.equal(requests.filter((r) => r.method === "POST").length, 0);
  });

  it("waits for the first deployment of a new application", async () => {
    const { base } = await startServer(
      dokploy(
        [[]],
        [
          [{ deploymentId: "d1", status: "running" }],
          [{ deploymentId: "d1", status: "done" }],
        ],
      ),
    );
    assert.equal(await deploy(options(base)), null);
  });

  it("latestDeployment picks the newest item and reads both list shapes", () => {
    const oldest = {
      deploymentId: "a",
      status: "done",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const newest = {
      deploymentId: "b",
      status: "running",
      createdAt: "2026-02-01T00:00:00.000Z",
    };
    assert.deepEqual(latestDeployment([oldest, newest]), {
      id: "b",
      status: "running",
    });
    assert.deepEqual(latestDeployment({ data: [newest, oldest] }), {
      id: "b",
      status: "running",
    });
    assert.equal(latestDeployment([]), null);
    assert.equal(latestDeployment({ data: [] }), null);
    assert.equal(latestDeployment({ unrelated: true }), null);
    assert.deepEqual(latestDeployment([{ id: "x", status: "done" }]), {
      id: "x",
      status: "done",
    });
    assert.equal(
      latestDeployment([{ deploymentId: "y", status: "done" }])?.id,
      "y",
    );
  });

  it("CLI exits 2 on a missing variable or a plain http URL", async () => {
    const api = await startServer(
      dokploy([[D0]], [[{ deploymentId: "d1", status: "done" }]]),
    );
    const missing = await runCli([], {
      DOKPLOY_URL: api.base,
      DOKPLOY_API_KEY: "test-key",
    });
    assert.equal(missing.status, 2);
    assert.match(missing.stderr, /DOKPLOY_APP_ID/);

    const plain = await runCli([], {
      DOKPLOY_URL: "http://example.com",
      DOKPLOY_API_KEY: "test-key",
      DOKPLOY_APP_ID: "app-test",
    });
    assert.equal(plain.status, 2);
    assert.match(plain.stderr, /https/);
    assert.equal(plain.stdout, "", "no request was made");
    assert.equal(api.requests.length, 0);

    const local = await runCli(
      ["--interval-ms", "10", "--timeout-ms", "2000"],
      {
        DOKPLOY_URL: api.base,
        DOKPLOY_API_KEY: "test-key",
        DOKPLOY_APP_ID: "app-test",
      },
    );
    assert.equal(local.status, 0);
    assert.match(local.stdout, /dokploy-deploy: PASS/);
  });
});
