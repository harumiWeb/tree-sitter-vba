import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dist = join(root, "playground", "dist");
const require = createRequire(import.meta.url);
const Parser = require("web-tree-sitter");

function inspectTree(rootNode) {
  const result = { errors: [], missing: [] };
  const nodes = [rootNode];

  while (nodes.length > 0) {
    const node = nodes.pop();
    const record = {
      type: node.type,
      startIndex: node.startIndex,
      endIndex: node.endIndex,
      startPosition: node.startPosition,
      endPosition: node.endPosition,
    };

    if (node.type === "ERROR") {
      result.errors.push(record);
    }
    if (node.type === "MISSING" || node.isMissing) {
      result.missing.push(record);
    }

    for (let index = 0; index < node.childCount; index += 1) {
      nodes.push(node.child(index));
    }
  }

  return result;
}

async function createParser() {
  await Parser.init({
    locateFile: (fileName) => join(dist, "vendor", fileName),
  });
  const language = await Parser.Language.load(join(dist, "tree-sitter-vba.wasm"));
  const parser = new Parser();
  parser.setLanguage(language);
  return parser;
}

test("playground build includes its required local assets and version metadata", () => {
  for (const file of [
    "index.html",
    "app.js",
    "styles.css",
    ".nojekyll",
    "tree-sitter-vba.wasm",
    "vendor/web-tree-sitter.js",
    "vendor/web-tree-sitter.wasm",
    "examples/manifest.json",
  ]) {
    assert.equal(existsSync(join(dist, file)), true, `missing ${file}`);
  }

  const index = readFileSync(join(dist, "index.html"), "utf8");
  assert.doesNotMatch(index, /<script[^>]+https?:/i);

  const version = JSON.parse(readFileSync(join(dist, "version.json"), "utf8"));
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(version.version, packageJson.version);
  assert.match(version.commit, /^(?:[0-9a-f]{7,}|unknown)$/);
});

test("generated WebAssembly parser cleanly parses every bundled example", async () => {
  const parser = await createParser();
  const manifest = JSON.parse(readFileSync(join(dist, "examples", "manifest.json"), "utf8"));

  for (const example of manifest.examples) {
    const source = readFileSync(join(dist, "examples", example.file), "utf8");
    const tree = parser.parse(source);
    const recovery = inspectTree(tree.rootNode);
    assert.equal(recovery.errors.length, 0, `${example.id} has ERROR nodes`);
    assert.equal(recovery.missing.length, 0, `${example.id} has MISSING nodes`);
    tree.delete();
  }

  parser.delete();
});

test("generated WebAssembly parser reports ERROR and MISSING node locations", async () => {
  const parser = await createParser();
  const cases = [
    ["MISSING", "examples/broken/incomplete-call.bas", "missing"],
    ["ERROR", "examples/broken/malformed-string.bas", "errors"],
  ];

  for (const [expectedType, fixture, property] of cases) {
    const tree = parser.parse(readFileSync(join(root, fixture), "utf8"));
    const recovery = inspectTree(tree.rootNode);
    assert.ok(recovery[property].length > 0, `${fixture} should contain ${expectedType}`);

    for (const node of recovery[property]) {
      assert.equal(Number.isInteger(node.startIndex), true);
      assert.equal(Number.isInteger(node.endIndex), true);
      assert.ok(node.startIndex >= 0);
      assert.ok(node.endIndex >= node.startIndex);
      assert.ok(node.startPosition.row >= 0);
      assert.ok(node.startPosition.column >= 0);
      assert.ok(node.endPosition.row >= 0);
      assert.ok(node.endPosition.column >= 0);
    }
    tree.delete();
  }

  parser.delete();
});
