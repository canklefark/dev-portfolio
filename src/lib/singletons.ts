import { getEmDashEntry } from "emdash";
import type {
  ContentEntry,
  EmDashCollections,
  PortableTextBlock,
} from "emdash";

/** A singleton is structural: a missing or unpublished entry is a loud failure, not an empty page. */
async function loadSingleton<K extends keyof EmDashCollections>(
  collection: K,
  slug: string,
): Promise<ContentEntry<EmDashCollections[K]>> {
  const { entry, error } = await getEmDashEntry<K, EmDashCollections[K]>(
    collection,
    slug,
  );
  // EmDash returns errors instead of throwing.
  if (error) throw error;
  if (!entry)
    throw new Error(
      `The EmDash entry "${collection}/${slug}" is missing or unpublished`,
    );
  return entry;
}

export const HOME_SLUG = "home";
export const ABOUT_SLUG = "about";

export function getHome() {
  return loadSingleton("home", HOME_SLUG);
}

export interface AboutCell {
  label: string;
  value: string;
  /** Absent for the default variant: the baseline renders those cells with no data-variant attribute. */
  variant?: "accent" | "green";
}

export interface AboutPage {
  /** The raw About entry, kept so an editor's SEO panel override can reach getSeoMeta. */
  source: ContentEntry<EmDashCollections["about"]>;
  role: string;
  showAvailability: boolean;
  body: PortableTextBlock[];
  cells: AboutCell[];
  stack: NonNullable<EmDashCollections["about"]["stack"]>;
  contacts: NonNullable<EmDashCollections["about"]["contacts"]>;
  heading: { line1: string; line2: string; accent: string };
}

export async function getAbout(): Promise<AboutPage> {
  const source = await loadSingleton("about", ABOUT_SLUG);
  const d = source.data;
  return {
    source,
    role: d.role,
    showAvailability: Boolean(d.show_availability),
    body: d.body ?? [],
    cells: (d.cells ?? []).map(({ label, value, variant }) =>
      variant === "default" ? { label, value } : { label, value, variant },
    ),
    stack: d.stack ?? [],
    contacts: d.contacts ?? [],
    heading: {
      line1: d.heading_line_1 ?? "",
      line2: d.heading_line_2 ?? "",
      accent: d.heading_accent ?? "",
    },
  };
}
