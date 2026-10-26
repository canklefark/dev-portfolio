import { getCollection, type CollectionEntry } from "astro:content";
import { getEmDashEntry } from "emdash";
import type { ContentEntry, PortableTextBlock } from "emdash";
import type { Project } from "../../emdash-env";

export interface ProjectEntry {
  /** The slug, which is also the public URL segment. */
  id: string;
  data: {
    title: string;
    category: string;
    status: string;
    statusVariant: "accent" | "green" | "default";
    surface: string;
    timeLabel: string;
    period: string;
    tags: string[];
    summary: string;
    sub: string;
    stats: {
      label: string;
      value: string;
      variant: "default" | "green" | "accent";
    }[];
    /** UTC midnight. Display goes through `formatProjectDate` (IN-01). */
    date: Date;
  };
  body: PortableTextBlock[];
}

export interface ProjectDetail extends ProjectEntry {
  /** The raw EmDash entry, kept so an editor's SEO panel override can reach getSeoMeta. */
  source: ContentEntry<Project>;
}

export function toProject(entry: ContentEntry<Project>): ProjectEntry {
  const d = entry.data;
  return {
    id: entry.id,
    data: {
      title: d.title,
      category: d.terms?.category?.[0]?.label ?? "",
      status: d.project_status,
      statusVariant: d.status_variant,
      surface: d.surface,
      timeLabel: d.time_label,
      period: d.period,
      tags: (d.terms?.tag ?? []).map((term) => term.label),
      summary: d.summary,
      sub: d.sub,
      stats: d.stats ?? [],
      date: new Date(d.date),
    },
    body: d.body ?? [],
  };
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  const { entry, error } = await getEmDashEntry("projects", slug);
  // EmDash returns errors instead of throwing.
  if (error) throw error;
  // getEmDashEntry also resolves database ids; each project has one public URL, its slug.
  if (!entry || entry.id !== slug) return null;
  return { ...toProject(entry), source: entry };
}

export async function getSortedProjects(): Promise<
  CollectionEntry<"projects">[]
> {
  return (await getCollection("projects", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}
