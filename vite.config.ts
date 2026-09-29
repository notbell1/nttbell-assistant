import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const contentEntry = resolve(__dirname, "src/content/index.ts");

const contentCssSource = resolve(__dirname, "src/content/ui/styles.css");

function buildContentScript() {
  return {
    name: "build-content-script",

    async closeBundle() {
      console.log("Building Nttbell content script...");

      await esbuild({
        entryPoints: [contentEntry],
        bundle: true,
        outfile: resolve(__dirname, "dist/content.js"),
        format: "iife",
        platform: "browser",
        target: "chrome120",
        minify: false,
        sourcemap: false,
        tsconfig: resolve(__dirname, "tsconfig.json"),
      });

      if (fs.existsSync(contentCssSource)) {
        fs.copyFileSync(
          contentCssSource,
          resolve(__dirname, "dist/content.css"),
        );
      }

      fs.copyFileSync(
        resolve(__dirname, "manifest.json"),
        resolve(__dirname, "dist/manifest.json"),
      );

      console.log("✓ content.js built");

      console.log("✓ content.css copied");

      console.log("✓ manifest.json copied");
    },
  };
}

export default defineConfig({
  plugins: [buildContentScript()],

  build: {
    emptyOutDir: true,

    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
      },

      output: {
        format: "es",

        entryFileNames: (chunk) => {
          if (chunk.name === "background") {
            return "background.js";
          }

          return "assets/[name].js";
        },

        chunkFileNames: "assets/[name].js",

        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
