import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import article from "./schemas/article";

export default defineConfig({
  name: "nfi-report",
  title: "NFI REPORT",
  projectId: "y1uifwk2",
  dataset: "production",
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [article],
  },
});
