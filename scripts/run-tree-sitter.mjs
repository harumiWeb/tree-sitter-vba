import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Usage: node scripts/run-tree-sitter.mjs [--cwd <dir>] <tree-sitter args...>
//
// The repository holds two grammars (vba/, vb6/) under one tree-sitter.json.
// `tree-sitter test` and `tree-sitter parse` pick the grammar from the working
// directory, so `--cwd vb6` selects the VB6 parser; the default is the repo root
// (fine for `generate`, wrong for `test`, which needs a dialect directory).

const require = createRequire(import.meta.url);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

let cwd = repoRoot;
if (args[0] === "--cwd") {
  cwd = join(repoRoot, args[1]);
  args.splice(0, 2);
}

if (args.length === 0) {
  console.error("Usage: node scripts/run-tree-sitter.mjs [--cwd <dir>] <tree-sitter args...>");
  process.exit(1);
}

const cli = require.resolve("tree-sitter-cli/cli.js");
const result = spawnSync(process.execPath, [cli, ...args], {
  cwd,
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    CC: "gcc",
    CXX: "g++",
  },
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
