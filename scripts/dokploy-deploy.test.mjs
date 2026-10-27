// @ts-check
// Dokploy trigger and wait (D-04) driven against a local fake Dokploy API and a fake site on 127.0.0.1: the real
// panel is never contacted.
// run: node --test scripts/dokploy-deploy.test.mjs
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, describe, it } from "node:test";
import { deploy } from "./dokploy-deploy.mjs";
import { check } from "./smoke-test.mjs";

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
        reply.text ?? (reply.json === undefined ? "" : JSON.stringify(reply.json)),
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
 * A fake Dokploy API whose deployment list changes with the number of GETs seen after the POST.
 * @param {unknown[][]} before lists answered before application.deploy was requested (the last repeats)
 * @param {unknown[][]} after lists answered after it (the last repeats)
 * @returns {Responder}
 */
function dokploy(before, after) {
  return (request, requests) => {
    if (request.method === "POST") return { status: 200, json: { ok: true } };
    const posted = requests.findIndex((r) => r.method === "POST");
    if (posted < 0) {
      const seen = requests.length - 1;
      return { status: 200, json: before[Math.min(seen, before.length - 1)] };
    }
    const seen = requests.slice(posted + 1).length - 1;
    return { status: 200, json: after[Math.min(seen, after.length - 1)] };
  };
}

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
});
