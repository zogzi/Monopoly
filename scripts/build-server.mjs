import { build } from "esbuild";
await build({
  entryPoints: ["apps/server/index.ts"],
  outfile: "build/server.mjs",
  platform: "node",
  target: "node22",
  format: "esm",
  bundle: true,
  packages: "external",
  sourcemap: true,
});
