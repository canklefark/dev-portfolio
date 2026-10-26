import type { PortableTextBlock } from "emdash";

// RED-phase stub: returns the blocks untouched so the tests fail on their assertions.
export function prepareBody(
  blocks: PortableTextBlock[] | undefined,
): PortableTextBlock[] {
  return blocks ?? [];
}
