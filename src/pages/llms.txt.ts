import type { APIRoute } from "astro";
import { buildLlmsTxt } from "../lib/llms";
import { getSortedProjects } from "../lib/projects";
import { getSiteContext } from "../lib/site";

export const GET: APIRoute = async ({ site: base }) => {
  if (!base)
    throw new Error(
      "astro.config.mjs must set `site`; llms.txt links are built from it",
    );
  const [site, projects] = await Promise.all([
    getSiteContext(),
    getSortedProjects(),
  ]);
  const body = buildLlmsTxt(
    site,
    projects.map((project) => ({
      id: project.id,
      title: project.data.title,
      summary: project.data.summary,
    })),
    base,
  );
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
