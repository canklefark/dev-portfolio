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
