import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { buildWasm } from "./build-wasm.mjs";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "examples", "browser-consumer");
const distRoot = join(root, "build", "browser-consumer");
const vendorRoot = join(distRoot, "vendor");

for (const file of ["index.html", "app.js", "recovery.mjs"]) {
  if (!existsSync(join(sourceRoot, file))) {
    throw new Error(`Missing browser consumer source file: ${join(sourceRoot, file)}`);
  }
}

rmSync(distRoot, { recursive: true, force: true });
mkdirSync(vendorRoot, { recursive: true });

cpSync(join(sourceRoot, "index.html"), join(distRoot, "index.html"));
cpSync(join(sourceRoot, "recovery.mjs"), join(distRoot, "recovery.mjs"));

await build({
  entryPoints: [join(sourceRoot, "app.js")],
  outfile: join(distRoot, "app.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  external: ["./vendor/web-tree-sitter.js"],
});

const webTreeSitterRoot = dirname(require.resolve("web-tree-sitter"));
cpSync(join(webTreeSitterRoot, "web-tree-sitter.js"), join(vendorRoot, "web-tree-sitter.js"));
cpSync(
  require.resolve("web-tree-sitter/web-tree-sitter.wasm"),
  join(vendorRoot, "web-tree-sitter.wasm"),
);

buildWasm(join(distRoot, "tree-sitter-vba.wasm"));
console.log(`Built browser consumer assets in ${distRoot}`);
