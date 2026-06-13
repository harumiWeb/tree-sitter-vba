import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const root = "examples";
const queryFiles = ["queries/highlights.scm", "queries/folds.scm", "queries/tags.scm"];
const ignoredSegments = new Set([".xlflow", "build", "broken"]);
const files = [];
const require = createRequire(import.meta.url);
const treeSitterCli = require.resolve("tree-sitter-cli/cli.js");

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
files.sort();

if (files.length === 0) {
  console.error("No VBA example files found.");
  process.exit(1);
}

let failed = false;

for (const queryFile of queryFiles) {
  const result = spawnSync(process.execPath, [treeSitterCli, "query", queryFile, ...files], {
    encoding: "utf8",
    shell: false,
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.status !== 0 || result.error != null) {
    failed = true;
    console.error(`Query failed: ${queryFile}`);
    if (result.error) {
      console.error(result.error.message);
    }
    console.error((result.stderr || result.stdout || "tree-sitter query failed").trim());
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Ran ${queryFiles.length} queries against ${files.length} VBA example files.`);
