import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = "examples";
const files = [];
const ignoredSegments = new Set([".xlflow", "build"]);

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (ignoredSegments.has(name)) {
      continue;
    }

    const path = join(dir, name);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      walk(path);
    } else if (/\.(bas|cls|frm)$/i.test(path)) {
      files.push(path);
    }
  }
}

walk(root);

if (files.length === 0) {
  console.error("No VBA example files found.");
  process.exit(1);
}

const result = spawnSync("tree-sitter", ["parse", "--quiet", ...files], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
