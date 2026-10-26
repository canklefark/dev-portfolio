// @ts-check
// Per-route script inventory and whitespace-normalized parity compare for built HTML.
// usage: node scripts/script-inventory.mjs <command> ...  (run without arguments to list commands)
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";

/**
 * @typedef {{ kind: "inline" | "external" | "data", type: string, src: string | null, bytes: number, sha256: string | null }} ScriptRecord
 * @typedef {{ script: number, inline: number, external: number, module: number, data: number, modulepreload: number, preload: number, stylesheet: number }} RouteCounts
 * @typedef {{ file: string, scripts: ScriptRecord[], counts: RouteCounts }} RouteRecord
 * @typedef {{ routes: Record<string, RouteRecord> }} Inventory
 * @typedef {{ route: string, ok: boolean, reason: string }} RouteResult
 * @typedef {{ script: number, module: number, external: number, modulepreload: number }} AllowedCounts
 * @typedef {{ generatedFrom: string, inlineHashes: Record<string, string[]>, routes: Record<string, AllowedCounts> }} Allowlist
 * @typedef {{ usage: string, min: number, max: number, run: (args: string[]) => number | Promise<number> }} Command
 */

const JSON_LD = "application/ld+json";
// Unmatched path used to request the prerendered 404 page from a running server.
const MISSING_ROUTE = "/__parity_missing_route__/";

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
 * The parity canonicalization: exactly five rules, applied in this order and nothing else.
 *  (a) drop stylesheet links and style blocks (counted, never compared)
 *  (b) strip data-astro-cid-<hash> attributes
 *  (c) decode the entity forms the two builds disagree on (&amp; last)
 *  (d) remove whitespace between tags, collapse every other whitespace run, trim
 *  (e) sort the stage-tag spans inside each stage-tags container (tags compare as a set, D-02)
 * Scripts are compared strictly before this runs.
 * @param {string} html
 * @returns {{ text: string, stylesheets: number }}
 */
function canonical(html) {
  let stylesheets = 0;
  let text = html
    .replace(/<link\b([^>]*)>/gi, (whole, attrs) => {
      const rels = (attr(attrs, "rel") ?? "").toLowerCase().split(/\s+/);
      if (!rels.includes("stylesheet")) return whole;
      stylesheets++;
      return "";
    })
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, () => {
      stylesheets++;
      return "";
    });
  text = text.replace(/\sdata-astro-cid-[\w-]+(?:="[^"]*")?/g, "");
  text = text
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
  text = text.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
  text = text.replace(
    /(<div class="l-cluster stage-tags"[^>]*>)((?:<span class="stage-tag">[\s\S]*?<\/span>)*)(<\/div>)/g,
    (_whole, open, spans, close) =>
      open +
      (spans.match(/<span class="stage-tag">[\s\S]*?<\/span>/g) ?? [])
        .sort()
        .join("") +
      close,
  );
  return { text, stylesheets };
}

/**
 * Canonicalizing compare of two build directories (REND-04, D-02).
 * Prints PARITY-OK or PARITY-DIFF per route, CSS lines where the stylesheet delivery differs,
 * and a final "parity: N/M identical" line.
 * @param {string} baseDir
 * @param {string} candDir
 * @returns {number}
 */
function runParity(baseDir, candDir) {
  const base = loadRoutes(baseDir);
  const cand = loadRoutes(candDir);
  const routes = [...new Set([...Object.keys(base), ...Object.keys(cand)])];
  let identical = 0;
  for (const route of routes.sort()) {
    const a = base[route];
    const b = cand[route];
    if (!a || !b) {
      console.log(
        `PARITY-DIFF ${route}: route missing from ${a ? "candidate" : "baseline"}`,
      );
      continue;
    }
    const x = canonical(a.html);
    const y = canonical(b.html);
    if (x.stylesheets !== y.stylesheets) {
      console.log(
        `CSS ${route}: baseline ${x.stylesheets}, candidate ${y.stylesheets}`,
      );
    }
    const scripts = scriptDiff(a.scripts, b.scripts);
    if (scripts) {
      console.log(`PARITY-DIFF ${route}: ${scripts}`);
      continue;
    }
    if (x.text === y.text) {
      console.log(`PARITY-OK ${route}`);
      identical++;
      continue;
    }
    let i = 0;
    while (i < x.text.length && i < y.text.length && x.text[i] === y.text[i])
      i++;
    const from = Math.max(0, i - 20);
    const side = (/** @type {string} */ s) =>
      JSON.stringify(s.slice(from, from + 60));
    console.log(
      `PARITY-DIFF ${route}: canonical HTML differs at offset ${i}: baseline ${side(x.text)} vs candidate ${side(y.text)}`,
    );
  }
  console.log(`parity: ${identical}/${routes.length} identical`);
  return identical === routes.length ? 0 : 1;
}

/**
 * Request every baseline route from a running server and write each body to the route's
 * relative file path under outDir, so the result compares like a build directory.
 * "/404" is requested through an unmatched path and must answer 404; all others must answer 200.
 * @param {string} baseUrl
 * @param {string} baselineDir
 * @param {string} outDir
 * @returns {Promise<number>}
 */
async function fetchRoutes(baseUrl, baselineDir, outDir) {
  const base = baseUrl.replace(/\/+$/, "");
  const routes = loadRoutes(baselineDir);
  let unexpected = 0;
  for (const route of Object.keys(routes).sort()) {
    const is404 = route === "/404";
    const path = is404
      ? MISSING_ROUTE
      : route === "/"
        ? "/"
        : `${route.replace(/\/+$/, "")}/`;
    const expected = is404 ? 404 : 200;
    const response = await fetch(base + path, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    console.log(`FETCH ${route} ${response.status}`);
    if (response.status !== expected) {
      console.log(
        `UNEXPECTED ${route}: status ${response.status}, expected ${expected}`,
      );
      unexpected++;
      continue;
    }
    const target = join(outDir, routes[route].file);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, await response.text());
  }
  if (unexpected > 0) {
    console.log(`fetch: ${unexpected} unexpected status`);
    return 1;
  }
  return runCompare(baselineDir, outDir);
}

/**
 * @param {string} baseline
 * @param {string} candidate
 * @returns {number}
 */
function runCompare(baseline, candidate) {
  const results = compareDirs(baseline, candidate);
  for (const r of results) {
    console.log(r.ok ? `OK ${r.route}` : `DIFF ${r.route}: ${r.reason}`);
  }
  const identical = results.filter((r) => r.ok).length;
  console.log(`compare: ${identical}/${results.length} identical`);
  return identical === results.length ? 0 : 1;
}

/** @type {(keyof AllowedCounts)[]} */
const COUNT_KEYS = ["script", "module", "external", "modulepreload"];

/**
 * Allowlist from an inventory: per-route counts plus the set of inline executable hashes per type.
 * Data scripts (JSON-LD) are never executable and stay out of both.
 * @param {Inventory} inventory
 * @param {string} generatedFrom
 * @returns {Allowlist}
 */
function deriveAllowlist(inventory, generatedFrom) {
  /** @type {Record<string, Set<string>>} */
  const hashes = { classic: new Set(), module: new Set() };
  /** @type {Record<string, AllowedCounts>} */
  const routes = {};
  for (const route of Object.keys(inventory.routes).sort()) {
    const { scripts, counts } = inventory.routes[route];
    for (const s of scripts) {
      if (s.kind !== "inline" || s.sha256 === null) continue;
      (hashes[s.type] ??= new Set()).add(s.sha256);
    }
    routes[route] = {
      script: counts.script,
      module: counts.module,
      external: counts.external,
      modulepreload: counts.modulepreload,
    };
  }
  /** @type {Record<string, string[]>} */
  const inlineHashes = {};
  for (const type of Object.keys(hashes).sort()) {
    inlineHashes[type] = [...hashes[type]].sort();
  }
  return { generatedFrom, inlineHashes, routes };
}

/**
 * @param {string} path
 * @returns {Allowlist}
 */
function readAllowlist(path) {
  const allowlist = JSON.parse(readFileSync(path, "utf8"));
  if (!allowlist.routes || !allowlist.inlineHashes) {
    throw new Error(
      `${path} is not an allowlist (routes or inlineHashes missing)`,
    );
  }
  return allowlist;
}

/**
 * Check built HTML against an allowlist: counts may not exceed it and every inline
 * executable script must hash to a listed value for its type.
 * @param {Allowlist} allowlist
 * @param {string} dist
 * @returns {RouteResult[]}
 */
function checkDir(allowlist, dist) {
  const found = loadRoutes(dist);
  return Object.keys(found)
    .sort()
    .map((route) => {
      const allowed = allowlist.routes[route];
      if (!allowed)
        return { route, ok: false, reason: "route not in allowlist" };
      const problems = COUNT_KEYS.filter(
        (key) => found[route].counts[key] > allowed[key],
      ).map(
        (key) =>
          `${key} ${found[route].counts[key]} exceeds allowed ${allowed[key]}`,
      );
      for (const s of found[route].scripts) {
        if (s.kind !== "inline" || s.sha256 === null) continue;
        if (!(allowlist.inlineHashes[s.type] ?? []).includes(s.sha256)) {
          problems.push(
            `inline ${s.type} script ${s.sha256} is not allowlisted`,
          );
        }
      }
      return { route, ok: problems.length === 0, reason: problems.join("; ") };
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
 * @typedef {{ name: string, file: string | null, route: string | null, executable: boolean, edit: (html: string) => string }} Mutation
 */

/**
 * `executable` marks mutations that add or change something a browser would run, so an
 * allowlist check must fail them. The compare must notice every mutation either way.
 * @type {Mutation[]}
 */
const MUTATIONS = [
  {
    name: "unchanged",
    file: null,
    route: null,
    executable: false,
    edit: (html) => html,
  },
  {
    name: "inline-classic",
    file: "about/index.html",
    route: "/about",
    executable: true,
    edit: (html) =>
      insertBefore(html, "</body>", "<script>window.__parity=1</script>"),
  },
  {
    name: "modulepreload",
    file: "index.html",
    route: "/",
    executable: true,
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
    executable: true,
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
    executable: true,
    edit: editFirstInline,
  },
  {
    name: "json-ld",
    file: "about/index.html",
    route: "/about",
    executable: false,
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
 * With an allowlist, also confirm the check fails executable mutations and passes the rest.
 * @param {string} baseDir
 * @param {string} [allowlistPath]
 * @returns {number}
 */
function runSelftest(baseDir, allowlistPath) {
  const allowlist = allowlistPath ? readAllowlist(allowlistPath) : null;
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
      let held =
        differing.length === expected.length &&
        differing.every((route, i) => route === expected[i]);
      let detail = `differing routes [${differing.join(", ")}], expected [${expected.join(", ")}]`;
      if (allowlist) {
        const failing = checkDir(allowlist, tmp)
          .filter((r) => !r.ok)
          .map((r) => r.route);
        const expectedFailing = mutation.executable ? expected : [];
        held &&=
          failing.length === expectedFailing.length &&
          failing.every((route, i) => route === expectedFailing[i]);
        detail += `; check failing [${failing.join(", ")}], expected [${expectedFailing.join(", ")}]`;
      }
      console.log(
        `${held ? "DETECTED" : "MISSED"} ${mutation.name}: ${detail}`,
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
    run: ([baseline, candidate]) => runCompare(baseline, candidate),
  },
  parity: {
    usage: "parity BASELINE_DIST_DIR CANDIDATE_DIR",
    min: 2,
    max: 2,
    run: ([baseline, candidate]) => runParity(baseline, candidate),
  },
  fetch: {
    usage: "fetch BASE_URL BASELINE_DIST_DIR OUT_DIR",
    min: 3,
    max: 3,
    run: ([baseUrl, baseline, outDir]) =>
      fetchRoutes(baseUrl, baseline, outDir),
  },
  derive: {
    usage: "derive INVENTORY_JSON ALLOWLIST_JSON GENERATED_FROM",
    min: 3,
    max: 3,
    run: ([inventoryPath, allowlistPath, generatedFrom]) => {
      /** @type {Inventory} */
      const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
      const allowlist = deriveAllowlist(inventory, generatedFrom);
      writeFileSync(allowlistPath, JSON.stringify(allowlist, null, 2) + "\n");
      console.log(
        `derived ${Object.keys(allowlist.routes).length} routes to ${allowlistPath}`,
      );
      return 0;
    },
  },
  check: {
    usage: "check ALLOWLIST_JSON DIST_DIR",
    min: 2,
    max: 2,
    run: ([allowlistPath, dist]) => {
      const results = checkDir(readAllowlist(allowlistPath), dist);
      for (const r of results) {
        console.log(r.ok ? `PASS ${r.route}` : `FAIL ${r.route}: ${r.reason}`);
      }
      const passed = results.filter((r) => r.ok).length;
      console.log(`check: ${passed}/${results.length} passed`);
      return passed === results.length ? 0 : 1;
    },
  },
  selftest: {
    usage: "selftest BASELINE_DIST_DIR [ALLOWLIST_JSON]",
    min: 1,
    max: 2,
    run: ([baseline, allowlistPath]) => runSelftest(baseline, allowlistPath),
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
  process.exitCode = await command.run(args);
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
