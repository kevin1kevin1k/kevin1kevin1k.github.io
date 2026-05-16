import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://kevin1kevin1k.github.io",
  integrations: [mdx()],
  trailingSlash: "always",
});
