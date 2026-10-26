// @ts-check
// Tests for the EmDash project mapping (toProject) and the UTC-pinned project date formatter.
// run: node --test src/lib/projects.test.mjs  (name the file; Node 24 treats a directory argument as a file)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatProjectDate } from "./format.ts";
import { toProject } from "./projects.ts";

/** @typedef {import("emdash").ContentEntry<import("../../emdash-env").Project>} ProjectContentEntry */

/**
 * A plain fixture shaped like the EmDash entry; the cast is the only place the loose shape is claimed.
 * @param {Record<string, unknown>} [overrides]
 * @returns {ProjectContentEntry}
 */
function fixtureEntry(overrides = {}) {
  return /** @type {ProjectContentEntry} */ (/** @type {unknown} */ ({
    id: "catalog-cms",
    data: {
      id: "01JABC",
      slug: "catalog-cms",
      status: "published",
      title: "Catalog CMS",
      date: "2026-08-27T00:00:00.000Z",
      project_status: "SHIPPED",
      status_variant: "green",
      surface: "WORDPRESS",
      time_label: "LIVE",
      period: "Q3 2026",
      summary: "A summary.",
      sub: "A sub line.",
      stats: [
        { label: "Sites", value: "3", variant: "default" },
        { label: "Uptime", value: "99%", variant: "green" },
      ],
      body: [{ _type: "block", _key: "a", children: [] }],
      terms: {
        category: [
          { id: "c1", name: "category", slug: "client", label: "Client Work" },
        ],
        tag: [
          { id: "t1", name: "tag", slug: "b", label: "B" },
          { id: "t2", name: "tag", slug: "a", label: "A" },
        ],
      },
      ...overrides,
    },
  }));
}

describe("toProject", () => {
  it("maps a full entry to the card shape with EmDash term order kept", () => {
    const project = toProject(fixtureEntry());
    assert.equal(project.id, "catalog-cms");
    assert.equal(project.data.title, "Catalog CMS");
    assert.equal(project.data.category, "Client Work");
    assert.deepEqual(project.data.tags, ["B", "A"]);
    assert.equal(project.data.status, "SHIPPED");
    assert.equal(project.data.statusVariant, "green");
    assert.equal(project.data.surface, "WORDPRESS");
    assert.equal(project.data.timeLabel, "LIVE");
    assert.equal(project.data.period, "Q3 2026");
    assert.equal(project.data.summary, "A summary.");
    assert.equal(project.data.sub, "A sub line.");
    assert.equal(project.data.stats.length, 2);
    assert.deepEqual(project.data.stats[1], {
      label: "Uptime",
      value: "99%",
      variant: "green",
    });
    assert.equal(project.body.length, 1);
  });

  it("maps an entry with no terms, stats or body to empty values", () => {
    const project = toProject(
      fixtureEntry({ terms: undefined, stats: undefined, body: undefined }),
    );
    assert.equal(project.data.category, "");
    assert.deepEqual(project.data.tags, []);
    assert.deepEqual(project.data.stats, []);
    assert.deepEqual(project.body, []);
  });

  it("turns the ISO date into the same instant", () => {
    const project = toProject(fixtureEntry());
    assert.equal(project.data.date.toISOString(), "2026-08-27T00:00:00.000Z");
  });
});

describe("formatProjectDate", () => {
  it("formats UTC midnight as YYYY-MM-DD in a zone behind UTC", () => {
    const previous = process.env.TZ;
    process.env.TZ = "Pacific/Honolulu";
    try {
      assert.equal(
        formatProjectDate("2026-08-27T00:00:00.000Z"),
        "2026-08-27",
      );
      assert.equal(
        formatProjectDate(new Date("2026-08-27T00:00:00.000Z")),
        "2026-08-27",
      );
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
});
