import { getCollection, type CollectionEntry } from "astro:content";

export async function getSortedLogbook(): Promise<
  CollectionEntry<"logbook">[]
> {
  return (await getCollection("logbook", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}
