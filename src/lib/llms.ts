export interface LlmsProject {
  id: string;
  title: string;
  summary: string;
}

/** The llms.txt body: site name and tagline, the three pages, then one line per project. Links are absolute. */
export function buildLlmsTxt(
  site: { title: string; tagline: string },
  projects: LlmsProject[],
  base: URL,
): string {
  const url = (path: string) => new URL(path, base).href;
  const lines = [
    `# ${site.title}`,
    "",
    `> ${site.tagline}`,
    "",
    "## Pages",
    "",
    `- [Home](${url("/")})`,
    `- [Projects](${url("/projects/")})`,
    `- [About](${url("/about/")})`,
    "",
    "## Projects",
    "",
    ...projects.map(
      (project) =>
        `- [${project.title}](${url(`/projects/${project.id}/`)}): ${project.summary}`,
    ),
    "",
  ];
  return lines.join("\n");
}
