import { retext } from "retext";
import retextSmartypants from "retext-smartypants";
import GithubSlugger from "github-slugger";
import type { PortableTextBlock } from "emdash";

// Same engine and defaults Astro's markdown pipeline applied to the baseline.
const processor = retext().use(retextSmartypants);
const smart = (text: string): string => String(processor.processSync(text));

interface Span {
  _type: "span";
  text: string;
  marks?: string[];
}

type Block = PortableTextBlock & {
  style?: string;
  children?: Span[];
  headingId?: string;
};

const isBlock = (b: PortableTextBlock): b is Block => b._type === "block";

/**
 * Reproduces the baseline's typography on Portable Text blocks: smart punctuation on every
 * span without the code mark, and a github-slugger id on each heading. Returns new blocks.
 */
export function prepareBody(
  blocks: PortableTextBlock[] | undefined,
): PortableTextBlock[] {
  const slugger = new GithubSlugger();
  return (blocks ?? []).map((b) => {
    if (!isBlock(b) || !b.children) return b;
    const children = b.children.map((c) =>
      c._type === "span" && !(c.marks ?? []).includes("code")
        ? { ...c, text: smart(c.text) }
        : c,
    );
    const isHeading = typeof b.style === "string" && /^h[1-6]$/.test(b.style);
    const headingId = isHeading
      ? slugger.slug(b.children.map((c) => c.text).join(""))
      : undefined;
    return { ...b, children, ...(headingId ? { headingId } : {}) };
  });
}
