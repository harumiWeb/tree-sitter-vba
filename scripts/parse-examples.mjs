import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const root = "examples";
const files = [];
const ignoredSegments = new Set([".xlflow", "build", "broken"]);
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

for (const file of files) {
  const result = spawnSync(process.execPath, [treeSitterCli, "parse", file], {
    encoding: "utf8",
    shell: false,
    env: {
      ...process.env,
      CC: "gcc",
      CXX: "g++",
    },
    maxBuffer: 16 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const errors = output
    .split(/\r?\n/)
    .filter((line) => /\((ERROR|MISSING)\b/.test(line))
    .map((line) => line.trim());
  const successful = result.status === 0 && result.error == null && errors.length === 0;

  if (!successful) {
    failed = true;
    console.error(`Parse error in ${file}`);
    if (result.error) {
      console.error(result.error.message);
    }
    if (errors.length > 0) {
      console.error(errors.join("\n"));
    } else {
      console.error((result.stderr || result.stdout || "tree-sitter parse failed").trim());
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Parsed ${files.length} VBA example files without ERROR/MISSING nodes.`);
