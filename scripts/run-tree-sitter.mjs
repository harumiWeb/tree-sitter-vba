import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/run-tree-sitter.mjs <tree-sitter args...>");
  process.exit(1);
}

const result = spawnSync("tree-sitter", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
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
