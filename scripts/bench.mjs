import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const Parser = require("tree-sitter");
const VBA = require("../");

const parser = new Parser();
parser.setLanguage(VBA);

const roots = process.argv.slice(2);
const targetRoots = roots.length > 0 ? roots : ["examples"];
const ignoredSegments = new Set([".xlflow", "build", "broken"]);
const files = [];

function walk(path) {
  const stat = statSync(path);

  if (stat.isDirectory()) {
    for (const name of readdirSync(path)) {
      if (ignoredSegments.has(name)) {
        continue;
      }

      walk(join(path, name));
    }
    return;
  }

  if (/\.(bas|cls|frm)$/i.test(path)) {
    files.push(path);
  }
}

for (const root of targetRoots) {
  walk(root);
}

files.sort();

if (files.length === 0) {
  console.error("No VBA files found.");
  process.exit(1);
}

function countNodes(rootNode) {
  const cursor = rootNode.walk();
  let count = 1;

  if (!cursor.gotoFirstChild()) {
    return count;
  }

  while (true) {
    count += 1;

    if (cursor.gotoFirstChild()) {
      continue;
    }

    if (cursor.gotoNextSibling()) {
      continue;
    }

    let foundAncestorSibling = false;
    while (cursor.gotoParent()) {
      if (cursor.gotoNextSibling()) {
        foundAncestorSibling = true;
        break;
      }
    }

    if (!foundAncestorSibling) {
      break;
    }
  }

  return count;
}

const results = [];
let totalBytes = 0;
let totalTime = 0;
let totalNodes = 0;
let errorFiles = 0;
let missingFiles = 0;

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const bytes = Buffer.byteLength(source, "utf8");
  const start = performance.now();
  const tree = parser.parse(source);
  const elapsed = performance.now() - start;
  const treeText = tree.rootNode.toString();
  const errorCount = (treeText.match(/\(ERROR\b/g) ?? []).length;
  const missingCount = (treeText.match(/\(MISSING\b/g) ?? []).length;
  const nodeCount = countNodes(tree.rootNode);

  totalBytes += bytes;
  totalTime += elapsed;
  totalNodes += nodeCount;

  if (errorCount > 0) {
    errorFiles += 1;
  }
  if (missingCount > 0) {
    missingFiles += 1;
  }

  results.push({
    file,
    bytes,
    elapsed,
    nodeCount,
    errorCount,
    missingCount,
  });
}

const slowest = [...results].sort((a, b) => b.elapsed - a.elapsed).slice(0, 5);
const largest = [...results].sort((a, b) => b.bytes - a.bytes).slice(0, 5);
const recovery = results.filter((result) => result.errorCount > 0 || result.missingCount > 0);

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatMs(ms) {
  return `${ms.toFixed(2)} ms`;
}

console.log(`files: ${files.length}`);
console.log(`total bytes: ${formatBytes(totalBytes)}`);
console.log(`total parse time: ${formatMs(totalTime)}`);
console.log(`avg parse time: ${formatMs(totalTime / files.length)}/file`);
console.log(`max parse time: ${formatMs(slowest[0].elapsed)}`);
console.log(`total nodes: ${totalNodes}`);
console.log(`avg nodes: ${Math.round(totalNodes / files.length)}/file`);
console.log(`ERROR files: ${errorFiles}`);
console.log(`MISSING files: ${missingFiles}`);

console.log("\nslowest files:");
for (const result of slowest) {
  console.log(
    `- ${formatMs(result.elapsed)} ${formatBytes(result.bytes)} ${result.nodeCount} nodes ${result.file}`,
  );
}

console.log("\nlargest files:");
for (const result of largest) {
  console.log(
    `- ${formatBytes(result.bytes)} ${formatMs(result.elapsed)} ${result.nodeCount} nodes ${result.file}`,
  );
}

if (recovery.length > 0) {
  console.log("\nrecovery files:");
  for (const result of recovery) {
    console.log(`- ERROR ${result.errorCount} MISSING ${result.missingCount} ${result.file}`);
  }
}
