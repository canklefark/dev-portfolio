import { getCollection, type CollectionEntry } from "astro:content";

export async function getSortedProjects(): Promise<
  CollectionEntry<"projects">[]
> {
  return (await getCollection("projects", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}
