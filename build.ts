import { rm } from "node:fs/promises";
import type { CompileBuildOptions } from "bun";

await rm("./dist", { recursive: true });

const platforms: CompileBuildOptions[] = [
  { target: "bun-windows-x64", outfile: "cfmp-windows-x64" },
  { target: "bun-linux-x64", outfile: "cfmp-linux-x64" },
  { target: "bun-darwin-arm64", outfile: "cfmp-darwin-arm64" },
];

for (const platform of platforms) {
  await Bun.build({
    entrypoints: ["./src/index.ts"],
    outdir: "./dist",
    compile: platform,
    minify: true,
    bytecode: true,
  });
}
