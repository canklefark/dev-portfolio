import { getSeoMeta, getSiteSettings } from "emdash";

export interface SiteContext {
  title: string;
  tagline: string;
  /** From the SEO settings; getSeoMeta applies its own default when this is unset. */
  titleSeparator: string | undefined;
  /** From the SEO settings: the share image for any page whose SEO panel has none. */
  defaultOgImage: string | undefined;
  /** From the SEO settings: verification meta tag contents. */
  googleVerification: string | undefined;
  bingVerification: string | undefined;
}

/** Site-wide values read from EmDash settings (D-05). A missing title or tagline is a seed problem. */
export async function getSiteContext(): Promise<SiteContext> {
  const settings = await getSiteSettings();
  if (!settings.title)
    throw new Error(
      'EmDash setting "title" is missing; seed the General settings',
    );
  if (!settings.tagline)
    throw new Error(
      'EmDash setting "tagline" is missing; seed the General settings',
    );
  return {
    title: settings.title,
    tagline: settings.tagline,
    titleSeparator: settings.seo?.titleSeparator,
    defaultOgImage: settings.seo?.defaultOgImage?.url,
    googleVerification: settings.seo?.googleVerification,
    bingVerification: settings.seo?.bingVerification,
  };
}

type SeoInput = Parameters<typeof getSeoMeta>[0];

export interface PageMeta {
  title: string;
  description: string;
  /** The SEO panel image, else the site default; may be root-relative, the layout makes it absolute. */
  image: string | null;
  /** The SEO panel canonical override, or null to let the layout use the route's own URL. */
  canonical: string | null;
  /** "noindex, nofollow" when the SEO panel says so, else null. */
  robots: string | null;
}

/**
 * Title, description, image, canonical override and robots for one route through EmDash's getSeoMeta, so
 * an editor's SEO panel value wins and the computed value applies otherwise. The title is the full title
 * (suffix included) and is used for <title>, og:title and twitter:title alike.
 */
export function pageMeta(
  content: SeoInput,
  site: SiteContext,
  options: { withSiteTitle: boolean; defaultDescription?: string },
): PageMeta {
  const meta = getSeoMeta(content, {
    siteTitle: options.withSiteTitle ? site.title : undefined,
    titleSeparator: site.titleSeparator,
    defaultDescription: options.defaultDescription,
    defaultOgImage: site.defaultOgImage,
  });
  return {
    title: meta.title,
    description: meta.description ?? site.tagline,
    image: meta.ogImage,
    canonical: meta.canonical,
    robots: meta.robots,
  };
}

/** Absolute og:url with exactly one trailing slash, built from the configured site (never the request Host). */
export function ogUrl(pathname: string, site: URL | undefined): string {
  if (!site)
    throw new Error(
      "astro.config.mjs must set `site`; og:url is built from it",
    );
  return new URL(pathname.replace(/\/?$/, "/"), site).href;
}

export type NavId = "home" | "projects" | "about";

export const NAV_PATHS: Record<NavId, string> = {
  home: "/",
  projects: "/projects",
  about: "/about",
};

function withoutTrailingSlash(url: string): string {
  return url === "/" ? url : url.replace(/\/$/, "");
}

/** Whether a menu link is the current section; the url is compared without its trailing slash. */
export function isActiveLink(
  url: string,
  activeNav: NavId | undefined,
): boolean {
  if (!activeNav) return false;
  return withoutTrailingSlash(url) === NAV_PATHS[activeNav];
}
