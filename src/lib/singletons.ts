import { getEmDashEntry } from "emdash";
import type { ContentEntry, EmDashCollections } from "emdash";

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

export const PROJECTS_INDEX_SLUG = "projects-index";

export function getProjectsIndex() {
  return loadSingleton("projects_index", PROJECTS_INDEX_SLUG);
}
