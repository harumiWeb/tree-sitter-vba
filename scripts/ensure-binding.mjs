import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const outputPath = join(root, "build", "Release", "tree_sitter_vba_binding.node");
const inputPaths = [
  join(root, "binding.gyp"),
  join(root, "bindings", "node", "binding.cc"),
  join(root, "src", "parser.c"),
  join(root, "src", "scanner.c"),
].filter((path) => existsSync(path));

const needsBuild =
  !existsSync(outputPath) ||
  inputPaths.some((path) => statSync(path).mtimeMs > statSync(outputPath).mtimeMs);

if (!needsBuild) {
  console.log("tree-sitter native binding is up to date.");
  process.exit(0);
}

console.log("Rebuilding tree-sitter native binding...");

const result = spawnSync("pnpm", ["exec", "node-gyp", "rebuild"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
