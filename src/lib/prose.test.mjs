// @ts-check
// Tests for prepareBody: render-time smart punctuation and heading ids on Portable Text blocks.
// run: node --test src/lib/prose.test.mjs  (name the file; Node 24 treats a directory argument as a file)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepareBody } from "./prose.ts";

/**
 * @param {string} style
 * @param {string} text
 * @param {string[]} [marks]
 */
function block(style, text, marks = []) {
  return {
    _type: "block",
    _key: `k-${style}-${text.length}`,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: "s1", text, marks }],
  };
}

/** @param {unknown} b */
function idOf(b) {
  return /** @type {{ headingId?: string }} */ (b).headingId;
}

/** @param {unknown} b */
function allTexts(b) {
  return /** @type {{ children: { text: string }[] }} */ (b).children.map(
    (c) => c.text,
  );
}

/** @param {unknown} b */
function firstText(b) {
  return /** @type {{ children: { text: string }[] }} */ (b).children[0].text;
}

describe("prepareBody smart punctuation", () => {
  it("turns a straight apostrophe into a curly one", () => {
    const [out] = prepareBody([block("normal", "It's a form")]);
    assert.equal(firstText(out), "It’s a form");
  });

  it("turns straight double quotes into a curly pair", () => {
    const [out] = prepareBody([block("normal", '"flag for discussion"')]);
    assert.equal(firstText(out), "“flag for discussion”");
  });

  it("leaves a span with the code mark literal", () => {
    const [out] = prepareBody([block("normal", "it's", ["code"])]);
    assert.equal(firstText(out), "it's");
  });

  it("converts a non-code span next to a code span", () => {
    const input = {
      ...block("normal", "don't "),
      children: [
        { _type: "span", _key: "a", text: "don't ", marks: [] },
        { _type: "span", _key: "b", text: "it's", marks: ["code"] },
      ],
    };
    const [out] = prepareBody([input]);
    assert.deepEqual(allTexts(out), ["don’t ", "it's"]);
  });
});

describe("prepareBody heading ids", () => {
  it("slugs h2 headings the way the baseline did", () => {
    const out = prepareBody([
      block("h2", "The Problem"),
      block("h2", "What's Next"),
    ]);
    assert.equal(idOf(out[0]), "the-problem");
    assert.equal(idOf(out[1]), "whats-next");
  });

  it("gives h3 and h4 headings ids too", () => {
    const out = prepareBody([
      block("h3", "Sub Topic"),
      block("h4", "Deeper One"),
    ]);
    assert.equal(idOf(out[0]), "sub-topic");
    assert.equal(idOf(out[1]), "deeper-one");
  });

  it("suffixes a duplicate heading with -1", () => {
    const out = prepareBody([block("h2", "Stack"), block("h2", "Stack")]);
    assert.equal(idOf(out[0]), "stack");
    assert.equal(idOf(out[1]), "stack-1");
  });

  it("gives a normal paragraph no headingId key", () => {
    const [out] = prepareBody([block("normal", "Just text")]);
    assert.equal("headingId" in out, false);
  });

  it("starts a fresh slugger on every call", () => {
    const input = [block("h2", "Stack"), block("h2", "Stack")];
    const first = prepareBody(input).map(
      (b) => idOf(b),
    );
    const second = prepareBody(input).map(
      (b) => idOf(b),
    );
    assert.deepEqual(first, ["stack", "stack-1"]);
    assert.deepEqual(second, first);
  });
});

describe("prepareBody input handling", () => {
  it("passes a non-block item through unchanged", () => {
    const image = { _type: "image", _key: "i1", asset: { _ref: "x" } };
    const [out] = prepareBody([/** @type {import("emdash").PortableTextBlock} */ (image)]);
    assert.equal(out, image);
  });

  it("does not mutate the input", () => {
    const input = [block("h2", "What's Next"), block("normal", "It's a form")];
    const snapshot = structuredClone(input);
    prepareBody(input);
    assert.deepEqual(input, snapshot);
  });

  it("returns an empty array for undefined", () => {
    assert.deepEqual(prepareBody(undefined), []);
  });
});
