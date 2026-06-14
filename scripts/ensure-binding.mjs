import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const treeSitterRuntimeRoot = join(root, "node_modules", "tree-sitter");

function isStale(outputPath, inputPaths) {
  return (
    !existsSync(outputPath) ||
    inputPaths.some((path) => statSync(path).mtimeMs > statSync(outputPath).mtimeMs)
  );
}

function rebuildWithNodeGyp(cwd, label) {
  console.log(`Rebuilding ${label}...`);

  const result = spawnSync("pnpm", ["exec", "node-gyp", "rebuild"], {
    cwd,
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const packageBindingOutputPath = join(root, "build", "Release", "tree_sitter_vba_binding.node");
const packageBindingInputs = [
  join(root, "binding.gyp"),
  join(root, "bindings", "node", "binding.cc"),
  join(root, "src", "parser.c"),
  join(root, "src", "scanner.c"),
].filter((path) => existsSync(path));

if (isStale(packageBindingOutputPath, packageBindingInputs)) {
  rebuildWithNodeGyp(root, "tree-sitter-vba native binding");
} else {
  console.log("tree-sitter-vba native binding is up to date.");
}

if (existsSync(treeSitterRuntimeRoot)) {
  const runtimeOutputPath = join(
    treeSitterRuntimeRoot,
    "build",
    "Release",
    "tree_sitter_runtime_binding.node",
  );
  const runtimeInputs = [
    join(treeSitterRuntimeRoot, "binding.gyp"),
    join(treeSitterRuntimeRoot, "src", "binding.cc"),
    join(treeSitterRuntimeRoot, "src", "parser.cc"),
  ].filter((path) => existsSync(path));

  if (isStale(runtimeOutputPath, runtimeInputs)) {
    rebuildWithNodeGyp(treeSitterRuntimeRoot, "tree-sitter runtime binding");
  } else {
    console.log("tree-sitter runtime binding is up to date.");
  }
}
