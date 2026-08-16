import esbuild from "esbuild";
import { rm } from "node:fs/promises";

await rm("tests/dist", { recursive: true, force: true });
await esbuild.build({
  entryPoints: ["tests/i18n.test.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  outdir: "tests/dist",
  outExtension: { ".js": ".mjs" },
  alias: {
    obsidian: "./tests/stubs/obsidian.ts"
  },
  logLevel: "info"
});
