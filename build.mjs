import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";

const watch = process.argv.includes("--watch");

const codeBuild = {
  entryPoints: ["src/code.ts"],
  bundle: true,
  outfile: "dist/code.js",
  target: "es2017",
  format: "iife",
};

async function buildUI() {
  const html = fs.readFileSync(path.resolve("src/ui.html"), "utf-8");
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync(path.resolve("dist/ui.html"), html);
}

async function main() {
  if (watch) {
    const ctx = await esbuild.context(codeBuild);
    await ctx.watch();
    await buildUI();
    console.log("Watching Agent Source Exporter…");
    fs.watchFile(path.resolve("src/ui.html"), () => {
      buildUI();
      console.log("UI rebuilt");
    });
    return;
  }

  await esbuild.build(codeBuild);
  await buildUI();
  console.log("Agent Source Exporter build complete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
