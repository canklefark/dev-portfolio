// @ts-check
// Client-side publish guard for the emdash MCP tools (D-01 amended, D-12). EmDash 1.3.1 has no publish scope
// and a token inherits its owner's admin role, so the server alone cannot keep the agent draft-only. This
// hook refuses the publish-class and taxonomy definition tools, the live-write arguments on content_update and
// a publish on content_create before the request leaves the session. Schema and settings tools are deferred so
// the server's INSUFFICIENT_SCOPE refusal (AGENT-03) is what shows.
// usage: Claude Code PreToolUse command hook. Reads the hook JSON on stdin. Exit 2 with the reason on stderr
//   blocks the call, exit 0 defers to the normal permission flow.
//   by hand: node .claude/hooks/emdash-guard.mjs < payload.json
import { readFileSync } from "node:fs";

const TOOL_PREFIX = "mcp__emdash__";

// The content_update inputs that EmDash stages as a draft revision, plus the identity and revision keys.
// Any other key writes the live row, so an allowlist refuses a key a later EmDash version adds until reviewed.
// overrideLock is deliberately absent: it overrides the editor's lock on an entry, so it is the user's call.
const UPDATE_ALLOWED_KEYS = new Set([
  "collection",
  "id",
  "locale",
  "data",
  "slug",
  "_rev",
  "migrateBlocks",
  "replaceBlocks",
]);

// Publish-class tools (D-01) and the taxonomy definition tools (AGENT-03). The deny rules in settings.json
// list the same nine names; the hook refuses them again as a second layer.
const BLOCKED_TOOLS = new Set([
  "content_publish",
  "content_unpublish",
  "content_schedule",
  "content_unschedule",
  "content_delete",
  "content_permanent_delete",
  "taxonomy_create",
  "taxonomy_update",
  "taxonomy_delete",
]);

// content_create inputs. A new entry starts as a draft and drafts answer 404 on the public site, so tagging
// one touches no live page. status is allowed here only as "draft", checked in check().
const CREATE_ALLOWED_KEYS = new Set([
  "collection",
  "data",
  "slug",
  "locale",
  "translationOf",
  "migrateBlocks",
  "replaceBlocks",
  "bylines",
  "taxonomies",
  "seo",
  "status",
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

  if (BLOCKED_TOOLS.has(tool)) {
    return tool.startsWith("taxonomy_")
      ? "taxonomy definitions are part of the content model and are changed in the admin (AGENT-03)."
      : "the user publishes, unpublishes, schedules and deletes in the admin (D-01).";
  }

  if (tool === "content_create") {
    if (!isPlainObject(toolInput)) {
      return "tool_input is not an object";
    }
    const extra = Object.keys(toolInput).filter(
      (key) => !CREATE_ALLOWED_KEYS.has(key),
    );
    if (extra.length > 0) {
      return `${extra.join(", ")} is not a key a new draft may carry.`;
    }
    if ("publishedAt" in toolInput) {
      return "publishedAt would set a publish date. New entries start as drafts and the user publishes in the admin (D-01).";
    }
    if (toolInput.status !== undefined && toolInput.status !== "draft") {
      return "status must be draft. The user publishes in the admin (D-01).";
    }
  }

  if (tool === "content_update") {
    if (!isPlainObject(toolInput)) {
      return "tool_input is not an object";
    }
    if ("overrideLock" in toolInput) {
      return "overrideLock overrides the editor's lock on the entry. Close the entry in the admin and retry instead.";
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
