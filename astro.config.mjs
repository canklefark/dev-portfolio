// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

// https://astro.build/config
export default defineConfig({
  site: "https://dev.zeikcookson.com",
  // Phase 3 switches to server rendering; static keeps every existing page prerendered.
  output: "static",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      // Baked into the server bundle at build time, relative to the process cwd.
      database: sqlite({ url: "file:./data/emdash.db" }),
      storage: local({
        directory: "./data/uploads",
        baseUrl: "/_emdash/api/media/file",
      }),
    }),
  ],
});
