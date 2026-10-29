// @ts-check
// Tests for the head helpers (pageMeta, ogUrl) and the nav active-link mapping (isActiveLink).
// run: node --test src/lib/site.test.mjs  (name the file; Node 24 treats a directory argument as a file)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isActiveLink, ogUrl, pageMeta } from "./site.ts";

const SEP = " — ";
const site = {
  title: "Zeik Cookson",
  tagline: "Tag",
  titleSeparator: SEP,
  defaultOgImage: undefined,
  favicon: false,
};

describe("pageMeta", () => {
  it("appends the site title with the separator and reads the excerpt as the description", () => {
    const meta = pageMeta(
      { data: { title: "About", excerpt: "About text" } },
      site,
      { withSiteTitle: true },
    );
    assert.equal(meta.title, `About${SEP}Zeik Cookson`);
    assert.equal(meta.description, "About text");
  });

  it("leaves the title unchanged without the site suffix and falls back to the default description", () => {
    const meta = pageMeta(
      { data: { title: `Zeik Cookson${SEP}DevOps Engineer` } },
      site,
      {
        withSiteTitle: false,
        defaultDescription: "Tag",
      },
    );
    assert.equal(meta.title, `Zeik Cookson${SEP}DevOps Engineer`);
    assert.equal(meta.description, "Tag");
  });

  it("renders an SEO panel title once with the suffix and lets a panel description win", () => {
    const meta = pageMeta(
      {
        data: {
          title: "Entry title",
          excerpt: "Excerpt",
          seo: {
            title: "Panel Title",
            description: "Panel description",
            image: null,
            canonical: null,
            noIndex: false,
          },
        },
      },
      site,
      { withSiteTitle: true, defaultDescription: "Computed summary" },
    );
    assert.equal(meta.title, `Panel Title${SEP}Zeik Cookson`);
    assert.equal(meta.description, "Panel description");
  });

  it("lets defaultDescription win over the excerpt", () => {
    const meta = pageMeta({ data: { title: "T", excerpt: "Excerpt" } }, site, {
      withSiteTitle: true,
      defaultDescription: "Default",
    });
    assert.equal(meta.description, "Default");
  });

  it("falls back to the site tagline when nothing else supplies a description", () => {
    const meta = pageMeta({ data: { title: "T" } }, site, {
      withSiteTitle: true,
    });
    assert.equal(meta.description, "Tag");
  });

  it("builds the 404 head from a literal title and default description", () => {
    const meta = pageMeta({ data: { title: "404" } }, site, {
      withSiteTitle: true,
      defaultDescription: "Page not found.",
    });
    assert.equal(meta.title, `404${SEP}Zeik Cookson`);
    assert.equal(meta.description, "Page not found.");
  });

  it("uses the entry title and summary for a project page", () => {
    const meta = pageMeta({ data: { title: "Catalog CMS" } }, site, {
      withSiteTitle: true,
      defaultDescription: "One sentence summary.",
    });
    assert.equal(meta.title, `Catalog CMS${SEP}Zeik Cookson`);
    assert.equal(meta.description, "One sentence summary.");
  });

  it("returns no image, canonical or robots when neither the panel nor the site sets one", () => {
    const meta = pageMeta({ data: { title: "T" } }, site, {
      withSiteTitle: true,
    });
    assert.equal(meta.image, null);
    assert.equal(meta.canonical, null);
    assert.equal(meta.robots, null);
  });

  it("falls back to the site default share image and lets a panel image win", () => {
    const withDefault = { ...site, defaultOgImage: "/default.png" };
    const fallback = pageMeta({ data: { title: "T" } }, withDefault, {
      withSiteTitle: true,
    });
    assert.equal(fallback.image, "/default.png");
    const own = pageMeta(
      {
        data: {
          title: "T",
          seo: {
            title: null,
            description: null,
            image: "https://cdn.example/own.png",
            canonical: null,
            noIndex: false,
          },
        },
      },
      withDefault,
      { withSiteTitle: true },
    );
    assert.equal(own.image, "https://cdn.example/own.png");
  });

  it("passes a panel canonical override and noindex through", () => {
    const meta = pageMeta(
      {
        data: {
          title: "T",
          seo: {
            title: null,
            description: null,
            image: null,
            canonical: "https://example.com/elsewhere",
            noIndex: true,
          },
        },
      },
      site,
      { withSiteTitle: true },
    );
    assert.equal(meta.canonical, "https://example.com/elsewhere");
    assert.equal(meta.robots, "noindex, nofollow");
  });
});

describe("ogUrl", () => {
  const base = new URL("https://dev.zeikcookson.com");

  it("adds one trailing slash to a project path", () => {
    assert.equal(
      ogUrl("/projects/catalog-cms", base),
      "https://dev.zeikcookson.com/projects/catalog-cms/",
    );
  });

  it("returns the origin with a slash for the root", () => {
    assert.equal(ogUrl("/", base), "https://dev.zeikcookson.com/");
  });

  it("keeps exactly one slash when the path already ends with one", () => {
    assert.equal(ogUrl("/404/", base), "https://dev.zeikcookson.com/404/");
  });

  it("throws when the site is not configured", () => {
    assert.throws(() => ogUrl("/", undefined), /site/);
  });
});

describe("isActiveLink", () => {
  it("matches the projects link with or without a trailing slash", () => {
    assert.equal(isActiveLink("/projects", "projects"), true);
    assert.equal(isActiveLink("/projects/", "projects"), true);
  });

  it("does not match the root link for the projects section", () => {
    assert.equal(isActiveLink("/", "projects"), false);
  });

  it("matches the root link for home", () => {
    assert.equal(isActiveLink("/", "home"), true);
  });

  it("is never active without an activeNav", () => {
    assert.equal(isActiveLink("/", undefined), false);
    assert.equal(isActiveLink("/projects", undefined), false);
    assert.equal(isActiveLink("/about", undefined), false);
  });
});
