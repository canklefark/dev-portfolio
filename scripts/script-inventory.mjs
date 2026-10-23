// @ts-check
// Per-route script inventory and whitespace-normalized parity compare for built HTML.
// usage: node scripts/script-inventory.mjs <command> ...  (run without arguments to list commands)
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";

/**
 * @typedef {{ kind: "inline" | "external" | "data", type: string, src: string | null, bytes: number, sha256: string | null }} ScriptRecord
 * @typedef {{ script: number, inline: number, external: number, module: number, data: number, modulepreload: number, preload: number, stylesheet: number }} RouteCounts
 * @typedef {{ file: string, scripts: ScriptRecord[], counts: RouteCounts }} RouteRecord
 * @typedef {{ routes: Record<string, RouteRecord> }} Inventory
 * @typedef {{ route: string, ok: boolean, reason: string }} RouteResult
 * @typedef {{ usage: string, min: number, max: number, run: (args: string[]) => number }} Command
 */

const JSON_LD = "application/ld+json";

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith(".html") ? [path] : [];
  });
}

/**
 * index.html is "/", DIR/index.html is "/DIR", 404.html is "/404".
 * @param {string} rel
 * @returns {string}
 */
function routeOf(rel) {
  if (rel === "index.html") return "/";
  return "/" + rel.replace(/\/index\.html$/, "").replace(/\.html$/, "");
}

/**
 * Value of an attribute inside a tag's attribute text, or null when absent.
 * @param {string} attrs
 * @param {string} name
 * @returns {string | null}
 */
function attr(attrs, name) {
  const m = attrs.match(
    new RegExp(
      `\\s${name}(?:="([^"]*)"|='([^']*)'|=([^\\s"'>]+)|(?=[\\s>/]|$))`,
      "i",
    ),
  );
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : null;
}

/**
 * @param {string} text
 * @returns {string}
 */
function cspHash(text) {
  return "sha256-" + createHash("sha256").update(text).digest("base64");
}

/**
 * Whitespace runs between a ">" and a "<" carry no meaning for parity.
 * @param {string} html
 * @returns {string}
 */
function normalize(html) {
  return html.replace(/>\s+</g, "><").trim();
}

/**
 * @param {string} html
 * @returns {{ scripts: ScriptRecord[], counts: RouteCounts }}
 */
function parseHtml(html) {
  const scripts = [
    ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
  ].map((m) => {
    const src = attr(m[1], "src");
    const type = attr(m[1], "type") || "classic";
    /** @type {ScriptRecord["kind"]} */
    const kind =
      type.toLowerCase() === JSON_LD
        ? "data"
        : src !== null
          ? "external"
          : "inline";
    return {
      kind,
      type,
      src,
      bytes: Buffer.byteLength(m[2], "utf8"),
      sha256: kind === "external" ? null : cspHash(m[2]),
    };
  });
  const rels = [...html.matchAll(/<link\b([^>]*)>/gi)].flatMap((m) =>
    (attr(m[1], "rel") ?? "").toLowerCase().split(/\s+/),
  );
  const rel = (/** @type {string} */ name) =>
    rels.filter((r) => r === name).length;
  const executable = scripts.filter((s) => s.kind !== "data");
  return {
    scripts,
    counts: {
      script: executable.length,
      inline: scripts.filter((s) => s.kind === "inline").length,
      external: scripts.filter((s) => s.kind === "external").length,
      module: executable.filter((s) => s.type === "module").length,
      data: scripts.filter((s) => s.kind === "data").length,
      modulepreload: rel("modulepreload"),
      preload: rel("preload"),
      stylesheet: rel("stylesheet"),
    },
  };
}

/**
 * @param {string} dist
 * @returns {Record<string, RouteRecord & { html: string }>}
 */
function loadRoutes(dist) {
  const files = walk(dist).sort();
  if (files.length === 0) throw new Error(`no .html files under ${dist}`);
  /** @type {Record<string, RouteRecord & { html: string }>} */
  const routes = {};
  for (const file of files) {
    const rel = relative(dist, file).split(sep).join("/");
    const html = readFileSync(file, "utf8");
    routes[routeOf(rel)] = { file: rel, html, ...parseHtml(html) };
  }
  return routes;
}

/**
 * @param {string} dist
 * @returns {Inventory}
 */
function buildInventory(dist) {
  /** @type {Record<string, RouteRecord>} */
  const routes = {};
  for (const [route, { html: _html, ...record }] of Object.entries(
    loadRoutes(dist),
  )) {
    routes[route] = record;
  }
  return { routes };
}

/**
 * @param {ScriptRecord} s
 * @returns {string}
 */
function describeScript(s) {
  return `${s.kind} ${s.type} ${s.src ?? s.sha256 ?? "none"}`;
}

/**
 * First difference between two ordered script lists, or null when equal.
 * @param {ScriptRecord[]} a
 * @param {ScriptRecord[]} b
 * @returns {string | null}
 */
function scriptDiff(a, b) {
  const key = (/** @type {ScriptRecord} */ s) =>
    JSON.stringify([s.kind, s.type, s.src, s.sha256]);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] && b[i] && key(a[i]) === key(b[i])) continue;
    const x = a[i] ? describeScript(a[i]) : "none";
    const y = b[i] ? describeScript(b[i]) : "none";
    return `script ${i} differs: baseline [${x}] vs candidate [${y}] (baseline ${a.length} scripts, candidate ${b.length})`;
  }
  return null;
}

/**
 * @param {string} baseDir
 * @param {string} candDir
 * @returns {RouteResult[]}
 */
function compareDirs(baseDir, candDir) {
  const base = loadRoutes(baseDir);
  const cand = loadRoutes(candDir);
  const routes = [...new Set([...Object.keys(base), ...Object.keys(cand)])];
  return routes.sort().map((route) => {
    const a = base[route];
    const b = cand[route];
    if (!a) return { route, ok: false, reason: "route missing from baseline" };
    if (!b) return { route, ok: false, reason: "route missing from candidate" };
    const scripts = scriptDiff(a.scripts, b.scripts);
    if (scripts) return { route, ok: false, reason: scripts };
    const x = normalize(a.html);
    const y = normalize(b.html);
    if (x === y) return { route, ok: true, reason: "" };
    let i = 0;
    while (i < x.length && i < y.length && x[i] === y[i]) i++;
    const from = Math.max(0, i - 20);
    const side = (/** @type {string} */ s) =>
      JSON.stringify(s.slice(from, from + 60));
    return {
      route,
      ok: false,
      reason: `normalized HTML differs at offset ${i}: baseline ${side(x)} vs candidate ${side(y)}`,
    };
  });
}

/**
 * @param {string} html
 * @param {string} marker
 * @param {string} text
 * @returns {string}
 */
function insertBefore(html, marker, text) {
  const i = html.lastIndexOf(marker);
  if (i === -1) throw new Error(`mutation marker ${marker} not found`);
  return html.slice(0, i) + text + html.slice(i);
}

/**
 * Prepend a ";" to the body of the first executable inline script.
 * @param {string} html
 * @returns {string}
 */
function editFirstInline(html) {
  let done = false;
  const out = html.replace(
    /(<script\b([^>]*)>)([\s\S]*?<\/script>)/gi,
    (whole, open, attrs, rest) => {
      if (done) return whole;
      if (attr(attrs, "src") !== null) return whole;
      if ((attr(attrs, "type") ?? "").toLowerCase() === JSON_LD) return whole;
      done = true;
      return `${open};${rest}`;
    },
  );
  if (!done) throw new Error("no inline script to edit");
  return out;
}

/**
 * @typedef {{ name: string, file: string | null, route: string | null, edit: (html: string) => string }} Mutation
 */

/** @type {Mutation[]} */
const MUTATIONS = [
  { name: "unchanged", file: null, route: null, edit: (html) => html },
  {
    name: "inline-classic",
    file: "about/index.html",
    route: "/about",
    edit: (html) =>
      insertBefore(html, "</body>", "<script>window.__parity=1</script>"),
  },
  {
    name: "modulepreload",
    file: "index.html",
    route: "/",
    edit: (html) =>
      insertBefore(
        html,
        "</head>",
        '<link rel="modulepreload" href="/_astro/injected.js">',
      ),
  },
  {
    name: "external-module",
    file: "projects/index.html",
    route: "/projects",
    edit: (html) =>
      insertBefore(
        html,
        "</body>",
        '<script type="module" src="/_astro/injected.js"></script>',
      ),
  },
  {
    name: "edited-inline",
    file: "404.html",
    route: "/404",
    edit: editFirstInline,
  },
  {
    name: "json-ld",
    file: "about/index.html",
    route: "/about",
    edit: (html) =>
      insertBefore(
        html,
        "</head>",
        '<script type="application/ld+json">{}</script>',
      ),
  },
];

/**
 * Apply each mutation to a temporary copy of the baseline and confirm the compare notices it.
 * @param {string} baseDir
 * @returns {number}
 */
function runSelftest(baseDir) {
  let detected = 0;
  for (const mutation of MUTATIONS) {
    const tmp = mkdtempSync(join(tmpdir(), "script-inventory-"));
    try {
      cpSync(baseDir, tmp, { recursive: true });
      if (mutation.file) {
        const path = join(tmp, mutation.file);
        writeFileSync(path, mutation.edit(readFileSync(path, "utf8")));
      }
      const differing = compareDirs(baseDir, tmp)
        .filter((r) => !r.ok)
        .map((r) => r.route);
      const expected = mutation.route ? [mutation.route] : [];
      const held =
        differing.length === expected.length &&
        differing.every((route, i) => route === expected[i]);
      console.log(
        `${held ? "DETECTED" : "MISSED"} ${mutation.name}: differing routes [${differing.join(", ")}], expected [${expected.join(", ")}]`,
      );
      if (held) detected++;
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  console.log(`selftest: ${detected}/${MUTATIONS.length} detected`);
  return detected === MUTATIONS.length ? 0 : 1;
}

/** @type {Record<string, Command>} */
const COMMANDS = {
  capture: {
    usage: "capture DIST_DIR OUT_JSON",
    min: 2,
    max: 2,
    run: ([dist, out]) => {
      const inventory = buildInventory(dist);
      writeFileSync(out, JSON.stringify(inventory, null, 2) + "\n");
      console.log(
        `captured ${Object.keys(inventory.routes).length} routes to ${out}`,
      );
      return 0;
    },
  },
  compare: {
    usage: "compare BASELINE_DIST_DIR CANDIDATE_DIST_DIR",
    min: 2,
    max: 2,
    run: ([baseline, candidate]) => {
      const results = compareDirs(baseline, candidate);
      for (const r of results) {
        console.log(r.ok ? `OK ${r.route}` : `DIFF ${r.route}: ${r.reason}`);
      }
      const identical = results.filter((r) => r.ok).length;
      console.log(`compare: ${identical}/${results.length} identical`);
      return identical === results.length ? 0 : 1;
    },
  },
  selftest: {
    usage: "selftest BASELINE_DIST_DIR",
    min: 1,
    max: 1,
    run: ([baseline]) => runSelftest(baseline),
  },
};

/**
 * @param {string[]} lines
 * @returns {never}
 */
function usageExit(lines) {
  for (const line of lines) {
    console.error(`usage: node scripts/script-inventory.mjs ${line}`);
  }
  process.exit(2);
}

const [name, ...args] = process.argv.slice(2);
if (!name || !Object.hasOwn(COMMANDS, name)) {
  usageExit(Object.values(COMMANDS).map((c) => c.usage));
}
const command = COMMANDS[name];
if (args.length < command.min || args.length > command.max) {
  usageExit([command.usage]);
}
try {
  process.exitCode = command.run(args);
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
