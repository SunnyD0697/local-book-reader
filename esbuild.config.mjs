import esbuild from "esbuild";
import process from "process";
import { readFile } from "node:fs/promises";

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
  plugins: [
    {
      name: "inline-pdf-worker",
      setup(build) {
        build.onResolve({ filter: /^pdfjs-dist\/legacy\/build\/pdf\.worker\.min\.mjs$/ }, () => ({
          path: "pdf.worker.min.mjs",
          namespace: "local-book-reader-pdf-worker"
        }));
        build.onLoad({ filter: /.*/, namespace: "local-book-reader-pdf-worker" }, async () => ({
          contents: await readFile("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", "utf8"),
          loader: "text"
        }));
      }
    }
  ],
  outfile: "main.js"
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
