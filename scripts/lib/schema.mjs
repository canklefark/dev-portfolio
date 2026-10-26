// @ts-check
// EmDash projects collection definition, option lists and table-name constants shared by the import and verify scripts.

/** @typedef {import("emdash").SeedCollection} SeedCollection */
/** @typedef {import("emdash").SeedField} SeedField */
/** @typedef {{ tags: string[] }} TaggedProject */

// D-05: today's nine categories, in this order.
export const CATEGORY_OPTIONS = Object.freeze([
  "Agency Tooling",
  "Client Work",
  "Developer Tools",
  "Homelab Infrastructure",
  "Observability",
  "Personal Projects",
  "Revenue Intelligence",
  "Self-Hosted Services",
  "Web Development",
]);

// D-06: source enum order from src/content.config.ts.
export const STATUS_VARIANT_OPTIONS = Object.freeze([
  "accent",
  "green",
  "default",
]);

export const STAT_VARIANT_OPTIONS = Object.freeze([
  "default",
  "green",
  "accent",
]);

// D-07: the exact source string, never a coerced or reformatted date.
export const DATE_PATTERN = "^\\d{4}-\\d{2}-\\d{2}$";

// Table identifiers are the only values ever interpolated into SQL; every value is bound with ?.
export const TABLES = Object.freeze({
  projects: "ec_projects",
  about: "ec_about",
  collections: "_emdash_collections",
  fields: "_emdash_fields",
  menus: "_emdash_menus",
  menuItems: "_emdash_menu_items",
  options: "options",
});

// D-09: non-reserved slugs (project_status, status_variant, time_label), in field order.
export const PROJECT_FIELD_SLUGS = Object.freeze([
  "title",
  "date",
  "category",
  "project_status",
  "status_variant",
  "surface",
  "time_label",
  "period",
  "tags",
  "summary",
  "sub",
  "stats",
  "body",
]);

/**
 * Distinct tags of all projects in plain code-unit order (no locale-aware compare), so the
 * option list is identical on every machine.
 * @param {TaggedProject[]} projects
 * @returns {string[]}
 */
export function deriveTagOptions(projects) {
  return [...new Set(projects.flatMap((project) => project.tags))].sort();
}

/**
 * The projects collection (decision Q1 = 1a: tags are a multiSelect over the derived options).
 * @param {string[]} tagOptions
 * @returns {SeedCollection}
 */
export function projectsCollection(tagOptions) {
  /** @type {SeedField[]} */
  const fields = [
    {
      slug: "title",
      label: "Title",
      type: "string",
      required: true,
      searchable: true,
    },
    {
      slug: "date",
      label: "Date",
      type: "string",
      required: true,
      indexed: true,
      validation: { pattern: DATE_PATTERN },
    },
    {
      slug: "category",
      label: "Category",
      type: "select",
      required: true,
      validation: { options: [...CATEGORY_OPTIONS] },
    },
    {
      slug: "project_status",
      label: "Status",
      type: "string",
      required: true,
    },
    {
      slug: "status_variant",
      label: "Status variant",
      type: "select",
      required: true,
      defaultValue: "default",
      validation: { options: [...STATUS_VARIANT_OPTIONS] },
    },
    { slug: "surface", label: "Surface", type: "string", required: true },
    { slug: "time_label", label: "Time label", type: "string", required: true },
    { slug: "period", label: "Period", type: "string", required: true },
    {
      slug: "tags",
      label: "Tags",
      type: "multiSelect",
      validation: { options: [...tagOptions] },
    },
    { slug: "summary", label: "Summary", type: "text", required: true },
    { slug: "sub", label: "Sub", type: "text", required: true },
    {
      slug: "stats",
      label: "Stats",
      type: "repeater",
      validation: {
        subFields: [
          { slug: "label", type: "string", label: "Label", required: true },
          { slug: "value", type: "string", label: "Value", required: true },
          {
            slug: "variant",
            type: "select",
            label: "Variant",
            required: true,
            options: [...STAT_VARIANT_OPTIONS],
          },
        ],
      },
    },
    { slug: "body", label: "Body", type: "portableText", searchable: true },
  ];
  return {
    slug: "projects",
    label: "Projects",
    labelSingular: "Project",
    supports: ["drafts", "revisions", "preview"],
    urlPattern: "/projects/{slug}",
    fields,
  };
}

// D-04: constrained About values mirror the unions in src/data/about.ts. A cell with no variant is stored as default.
export const CELL_VARIANT_OPTIONS = Object.freeze(["default", "accent", "green"]);
export const STACK_LEVEL_OPTIONS = Object.freeze([
  "DAILY",
  "PROFICIENT",
  "FAMILIAR",
  "LEARNING",
  "NEXT",
]);
export const CONTACT_ICON_OPTIONS = Object.freeze([
  "email",
  "github",
  "linkedin",
]);

// D-03: exactly one about entry. The title is an admin list label only; the page H1 stays in about.astro (Pitfall 14).
export const ABOUT_SLUG = "about";
export const ABOUT_TITLE = "About";

export const ABOUT_FIELD_SLUGS = Object.freeze([
  "title",
  "role",
  "show_availability",
  "body",
  "cells",
  "stack",
  "contacts",
]);

/**
 * The about collection (D-03, D-04): one entry that holds everything src/data/about.* provides.
 * @returns {SeedCollection}
 */
export function aboutCollection() {
  /** @type {SeedField[]} */
  const fields = [
    {
      slug: "title",
      label: "Title",
      type: "string",
      required: true,
      searchable: true,
    },
    { slug: "role", label: "Role", type: "string", required: true },
    {
      slug: "show_availability",
      label: "Show availability",
      type: "boolean",
    },
    { slug: "body", label: "Body", type: "portableText", searchable: true },
    {
      slug: "cells",
      label: "Cells",
      type: "repeater",
      validation: {
        subFields: [
          { slug: "label", type: "string", label: "Label", required: true },
          { slug: "value", type: "string", label: "Value", required: true },
          {
            slug: "variant",
            type: "select",
            label: "Variant",
            required: true,
            options: [...CELL_VARIANT_OPTIONS],
          },
        ],
      },
    },
    {
      slug: "stack",
      label: "Stack",
      type: "repeater",
      validation: {
        subFields: [
          { slug: "name", type: "string", label: "Name", required: true },
          {
            slug: "level",
            type: "select",
            label: "Level",
            required: true,
            options: [...STACK_LEVEL_OPTIONS],
          },
        ],
      },
    },
    {
      slug: "contacts",
      label: "Contacts",
      type: "repeater",
      validation: {
        subFields: [
          {
            slug: "icon",
            type: "select",
            label: "Icon",
            required: true,
            options: [...CONTACT_ICON_OPTIONS],
          },
          { slug: "label", type: "string", label: "Label", required: true },
          { slug: "href", type: "url", label: "Link", required: true },
        ],
      },
    },
  ];
  return {
    slug: ABOUT_SLUG,
    label: "About",
    labelSingular: "About",
    supports: ["drafts", "revisions", "preview"],
    urlPattern: "/about",
    fields,
  };
}

// D-14: the primary nav menu mirrors the links in src/components/Nav.astro, in the same order.
export const NAV_MENU = Object.freeze({
  name: "primary",
  label: "Primary",
  items: Object.freeze([
    Object.freeze({ type: "custom", label: "Home", url: "/" }),
    Object.freeze({ type: "custom", label: "Projects", url: "/projects" }),
    Object.freeze({ type: "custom", label: "About", url: "/about" }),
  ]),
});

// D-14 and decision Q2 = 2a: title, tagline (the Layout default description, verbatim) and two socials.
// No url key (export-seed drops it; Phase 5 sets EMDASH_SITE_URL) and no seo key (no em dash enters new copy).
export const SITE_SETTINGS = Object.freeze({
  title: "Zeik Cookson",
  tagline:
    "DevOps and platform engineering portfolio. Infrastructure work from the homelab and beyond.",
  social: Object.freeze({
    github: "https://github.com/canklefark",
    linkedin: "https://linkedin.com/in/zeikcookson",
  }),
});
