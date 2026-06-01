import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.ts"],
  format: ["esm"],
  target: "es2022",
  platform: "node",
  outDir: "dist",
  sourcemap: true,
  clean: true,
  dts: false,
  bundle: true,
  splitting: false,
});
