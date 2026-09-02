import { defineCollection } from "astro:content";
import { z } from "zod";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string(),
    category: z.string(),
    status: z.string(),
    statusVariant: z.enum(["accent", "green", "default"]).default("default"),
    surface: z.string(),
    timeLabel: z.string(),
    period: z.string(),
    tags: z.array(z.string()),
    summary: z.string(),
    sub: z.string(),
    stats: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
        variant: z.enum(["default", "green", "accent"]).default("default"),
      }),
    ),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
