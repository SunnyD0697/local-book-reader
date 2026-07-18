import esbuild from "esbuild";
import process from "process";
import { copyFile } from "node:fs/promises";

const production = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js"
});

if (production) {
  await context.rebuild();
  await context.dispose();
  await copyFile("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", "pdf.worker.min.mjs");
} else {
  await copyFile("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", "pdf.worker.min.mjs");
  await context.watch();
}
