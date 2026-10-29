// @ts-check
// Tests for the llms.txt builder.
// run: node --test src/lib/llms.test.mjs  (name the file; Node 24 treats a directory argument as a file)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLlmsTxt } from "./llms.ts";

const base = new URL("https://dev.zeikcookson.com");
const site = { title: "Zeik Cookson", tagline: "Tag line." };

describe("buildLlmsTxt", () => {
  it("lists the site, the three pages and each project with an absolute link", () => {
    const text = buildLlmsTxt(
      site,
      [{ id: "platform-hub", title: "Hub", summary: "One sentence." }],
      base,
    );
    assert.equal(
      text,
      [
        "# Zeik Cookson",
        "",
        "> Tag line.",
        "",
        "## Pages",
        "",
        "- [Home](https://dev.zeikcookson.com/)",
        "- [Projects](https://dev.zeikcookson.com/projects/)",
        "- [About](https://dev.zeikcookson.com/about/)",
        "",
        "## Projects",
        "",
        "- [Hub](https://dev.zeikcookson.com/projects/platform-hub/): One sentence.",
        "",
      ].join("\n"),
    );
  });

  it("keeps the project order it is given", () => {
    const text = buildLlmsTxt(
      site,
      [
        { id: "b", title: "B", summary: "second" },
        { id: "a", title: "A", summary: "first" },
      ],
      base,
    );
    assert.ok(text.indexOf("[B]") < text.indexOf("[A]"));
  });
});
