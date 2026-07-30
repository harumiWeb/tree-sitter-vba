import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Language, Parser, Query } from "web-tree-sitter";
import {
  buildHighlightRanges,
  buildTreeModel,
  collectNodeKeys,
  collectRecoveryNodes,
  findSmallestContainingNode,
  formatSExpression,
  formatTreeText,
  initialExpandedNodeKeys,
} from "../../playground/site/parser-presentation.mjs";
import {
  byteOffsetToCodeUnitIndex,
  createSourcePositionIndex,
  textPositionFromByteOffset,
} from "../../playground/site/source-positions.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dist = join(root, "playground", "dist");

async function createParserAndQuery() {
  await Parser.init({
    locateFile: (fileName) => join(dist, "vendor", fileName),
  });
  const language = await Language.load(join(dist, "tree-sitter-vba.wasm"));
  const parser = new Parser();
  parser.setLanguage(language);
  const query = new Query(language, readFileSync(join(dist, "queries", "highlights.scm"), "utf8"));
  return { parser, query };
}

function findFirstByType(node, type) {
  if (node.type === type) return node;
  for (const child of node.children) {
    const match = findFirstByType(child, type);
    if (match) return match;
  }
  return null;
}

test("playground build includes its local bundle, Wasm assets, query, examples, and version metadata", () => {
  for (const file of [
    "index.html",
    "app.js",
    "styles.css",
    ".nojekyll",
    "tree-sitter-vba.wasm",
    "vendor/web-tree-sitter.js",
    "vendor/web-tree-sitter.wasm",
    "queries/highlights.scm",
    "examples/manifest.json",
  ]) {
    assert.equal(existsSync(join(dist, file)), true, `missing ${file}`);
  }

  const index = readFileSync(join(dist, "index.html"), "utf8");
  const bundle = readFileSync(join(dist, "app.js"), "utf8");
  assert.doesNotMatch(index, /<script[^>]+https?:/i);
  assert.doesNotMatch(bundle, /from\s+["']https?:/i);
  assert.equal(existsSync(join(dist, "parser-presentation.mjs")), false);
  assert.equal(existsSync(join(dist, "source-positions.mjs")), false);

  const version = JSON.parse(readFileSync(join(dist, "version.json"), "utf8"));
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(version.version, packageJson.version);
  assert.match(version.commit, /^(?:[0-9a-f]{7,}|unknown)$/);
});

test("source position conversion maps UTF-8 parser offsets to CodeMirror indices", () => {
  const source = "' あ😀\nSub Test()\n";
  const positions = createSourcePositionIndex(source);
  assert.equal(byteOffsetToCodeUnitIndex(source, 0), 0);
  assert.deepEqual(textPositionFromByteOffset(source, 0), { index: 0, row: 0, column: 0 });
  assert.deepEqual(textPositionFromByteOffset("\nSub", 0), { index: 0, row: 0, column: 0 });
  assert.equal(byteOffsetToCodeUnitIndex(source, 5), 3);
  assert.deepEqual(textPositionFromByteOffset(source, 5), { index: 3, row: 0, column: 3 });
  assert.equal(byteOffsetToCodeUnitIndex("😀", 4), 2);
  assert.equal(positions.byteOffsetToCodeUnitIndex(5), 3);
  assert.deepEqual(positions.textPositionFromByteOffset(5), { index: 3, row: 0, column: 3 });
});

test("generated WebAssembly parser cleanly parses every bundled example", async () => {
  const { parser, query } = await createParserAndQuery();
  const manifest = JSON.parse(readFileSync(join(dist, "examples", "manifest.json"), "utf8"));

  for (const example of manifest.examples) {
    const source = readFileSync(join(dist, "examples", example.file), "utf8");
    const tree = parser.parse(source);
    const model = buildTreeModel(tree.rootNode, source);
    const recovery = collectRecoveryNodes(model);
    assert.equal(
      recovery.filter((node) => node.recovery === "ERROR").length,
      0,
      `${example.id} has ERROR nodes`,
    );
    assert.equal(
      recovery.filter((node) => node.recovery === "MISSING").length,
      0,
      `${example.id} has MISSING nodes`,
    );
    assert.ok(
      buildHighlightRanges(query, tree.rootNode, source).length > 0,
      `${example.id} has no highlights`,
    );
    tree.delete();
  }

  query.delete();
  parser.delete();
});

test("official highlight query produces representative captures at UTF-16-safe ranges", async () => {
  const { parser, query } = await createParserAndQuery();
  const source = [
    "Option Explicit",
    "' 日本語😀 comment",
    "Public Sub HighlightFixture()",
    "    Dim count As Long",
    '    Debug.Print "hello", count',
    "End Sub",
  ].join("\n");
  const tree = parser.parse(source);
  const highlights = buildHighlightRanges(query, tree.rootNode, source);
  const captures = new Set(highlights.map((highlight) => highlight.capture));

  for (const capture of ["keyword", "comment", "string", "type", "function.method.call"]) {
    assert.equal(captures.has(capture), true, `missing ${capture} highlight`);
  }
  for (const highlight of highlights) {
    assert.ok(highlight.from >= 0);
    assert.ok(highlight.to > highlight.from);
    assert.ok(highlight.to <= source.length);
  }

  tree.delete();
  query.delete();
  parser.delete();
});

test("tree presentation keeps field names, source ranges, selection lookup, and collapse defaults", async () => {
  const { parser, query } = await createParserAndQuery();
  const source = "Public Sub Demo(ByVal message As String)\n    Debug.Print message\nEnd Sub\n";
  const tree = parser.parse(source);
  const model = buildTreeModel(tree.rootNode, source);
  const rendered = formatSExpression(model);
  const plainTree = formatTreeText(model).join("\n");
  const identifier = findFirstByType(model, "identifier");

  assert.match(rendered, /name: \(identifier\)/);
  assert.match(plainTree, /source_file/);
  assert.ok(identifier);
  assert.equal(
    findSmallestContainingNode(model, identifier.startIndex, identifier.endIndex)?.key,
    identifier.key,
  );
  assert.deepEqual(
    [...initialExpandedNodeKeys(model)],
    [model.key, ...model.children.map((child) => child.key)],
  );
  assert.equal(collectNodeKeys(model).length > model.children.length, true);

  tree.delete();
  query.delete();
  parser.delete();
});

test("generated WebAssembly parser reports ERROR and MISSING presentation ranges", async () => {
  const { parser, query } = await createParserAndQuery();
  const cases = [
    ["MISSING", "examples/broken/incomplete-call.bas"],
    ["ERROR", "examples/broken/malformed-string.bas"],
  ];

  for (const [expectedType, fixture] of cases) {
    const source = readFileSync(join(root, fixture), "utf8");
    const tree = parser.parse(source);
    const model = buildTreeModel(tree.rootNode, source);
    const recovery = collectRecoveryNodes(model).filter((node) => node.recovery === expectedType);
    assert.ok(recovery.length > 0, `${fixture} should contain ${expectedType}`);

    for (const node of recovery) {
      assert.ok(node.startIndex >= 0);
      assert.ok(node.endIndex >= node.startIndex);
      assert.ok(node.start.row >= 0);
      assert.ok(node.end.row >= 0);
    }
    if (expectedType === "MISSING") {
      const missing = recovery.find((node) => node.startIndex === node.endIndex);
      assert.ok(missing, "incomplete call should expose a zero-length MISSING node");
      assert.equal(
        findSmallestContainingNode(model, missing.startIndex, missing.endIndex)?.key,
        missing.key,
        "a MISSING insertion point must remain selected instead of a sibling token",
      );
    }
    tree.delete();
  }

  query.delete();
  parser.delete();
});
