import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    assetsDir: "assets",
    outDir: "dist",
    target: "es2020",
  },
});
