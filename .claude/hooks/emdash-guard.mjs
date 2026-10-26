// @ts-check
// Client-side publish guard for the emdash MCP tools (D-01 amended, D-12). EmDash 1.3.1 has no publish scope
// and a token inherits its owner's admin role, so the server alone cannot keep the agent draft-only. This
// hook refuses the live-write arguments on content_update before the request leaves the session.
// usage: Claude Code PreToolUse command hook. Reads the hook JSON on stdin. Exit 2 with the reason on stderr
//   blocks the call, exit 0 defers to the normal permission flow.
//   by hand: node .claude/hooks/emdash-guard.mjs < payload.json
import { readFileSync } from "node:fs";

const TOOL_PREFIX = "mcp__emdash__";

// The content_update inputs that EmDash stages as a draft revision, plus the identity, revision and lock keys.
// Any other key writes the live row, so an allowlist refuses a key a later EmDash version adds until reviewed.
const UPDATE_ALLOWED_KEYS = new Set([
  "collection",
  "id",
  "locale",
  "data",
  "slug",
  "_rev",
  "overrideLock",
  "migrateBlocks",
  "replaceBlocks",
]);

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Decide whether an emdash tool call may proceed.
 * @param {string} toolName full tool name as Claude Code reports it
 * @param {unknown} toolInput the tool arguments
 * @returns {string | null} a block reason, or null to defer to the normal permission flow
 */
function check(toolName, toolInput) {
  if (!toolName.startsWith(TOOL_PREFIX)) return null;
  const tool = toolName.slice(TOOL_PREFIX.length);

  if (tool === "content_update") {
    if (!isPlainObject(toolInput)) {
      return "tool_input is not an object";
    }
    const extra = Object.keys(toolInput).filter(
      (key) => !UPDATE_ALLOWED_KEYS.has(key),
    );
    if (extra.length > 0) {
      return `${extra.join(", ")} would write the live entry. Only data and slug edits stage as a draft. Status, publish dates, SEO, bylines, category and tags are changed in the admin (D-12).`;
    }
  }

  return null;
}

// Fail closed: any problem reading or checking the input blocks the call.
try {
  const parsed = JSON.parse(readFileSync(0, "utf8"));
  if (!isPlainObject(parsed) || typeof parsed.tool_name !== "string") {
    throw new Error("hook input has no tool_name");
  }
  const reason = check(parsed.tool_name, parsed.tool_input);
  if (reason === null) {
    process.exitCode = 0;
  } else {
    process.stderr.write(
      `emdash-guard: blocked ${parsed.tool_name}: ${reason}\n`,
    );
    process.exitCode = 2;
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `emdash-guard: unreadable hook input, blocking: ${message}\n`,
  );
  process.exitCode = 2;
}
