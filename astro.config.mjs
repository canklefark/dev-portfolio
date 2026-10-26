// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

// https://astro.build/config
export default defineConfig({
  site: "https://dev.zeikcookson.com",
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      // No editor toolbar or bootstrap script on public pages; editing happens only in /_emdash/admin.
      toolbar: false,
      // Baked into the server bundle at build time, relative to the process cwd.
      database: sqlite({ url: "file:./data/emdash.db" }),
      storage: local({
        directory: "./data/uploads",
        baseUrl: "/_emdash/api/media/file",
      }),
    }),
  ],
});
