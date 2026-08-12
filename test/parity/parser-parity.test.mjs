import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Language, Parser as WebParser } from "web-tree-sitter";
import { parityFixtures } from "./fixtures.mjs";

const require = createRequire(import.meta.url);
const NativeParser = require("tree-sitter");
const VBA = require("../../bindings/node");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const wasmPath = join(root, "build", "wasm", "tree-sitter-vba.wasm");
const webTreeSitterRoot = dirname(require.resolve("web-tree-sitter"));

function parseCorpusCases(source) {
  const pattern =
    /^(?<separator>=+)\r?\n(?<name>[^\r\n]*)\r?\n\k<separator>\r?\n(?<source>[\s\S]*?)\r?\n---\r?\n/gm;
  return [...source.matchAll(pattern)].map((match) => ({
    name: match.groups.name,
    source: match.groups.source,
  }));
}

function readFixture(fixture) {
  const fixturePath = join(root, fixture.path);
  const source = readFileSync(fixturePath, "utf8");

  if (fixture.kind !== "corpus") {
    return source;
  }

  const cases = parseCorpusCases(source).filter(({ name }) => name === fixture.caseName);
  assert.equal(
    cases.length,
    1,
    `${fixture.id}: expected exactly one corpus case, found ${cases.length}`,
  );
  return cases[0].source;
}

function normalizeNode(node) {
  return {
    type: node.type,
    named: node.isNamed,
    missing: node.isMissing,
    children: node.children.map((child, index) => ({
      // Native tree-sitter returns undefined while web-tree-sitter returns null
      // when a child has no field; neither value represents a CST difference.
      field: node.fieldNameForChild(index) ?? null,
      node: normalizeNode(child),
    })),
  };
}

function recoverySummary(rootNode) {
  const summary = { errorCount: 0, missingCount: 0 };

  function visit(node) {
    if (node.type === "ERROR") summary.errorCount += 1;
    if (node.isMissing) summary.missingCount += 1;
    for (const child of node.children) visit(child);
  }

  visit(rootNode);
  return summary;
}

function inspectTree(tree) {
  const rootNode = tree.rootNode;
  return {
    rootType: rootNode.type,
    recovery: recoverySummary(rootNode),
    structure: normalizeNode(rootNode),
  };
}

function assertParity(fixture, nativeResult, browserResult) {
  assert.equal(nativeResult.rootType, fixture.expectedRootType, `${fixture.id}: native root type`);
  assert.equal(
    browserResult.rootType,
    fixture.expectedRootType,
    `${fixture.id}: browser root type`,
  );
  assert.deepEqual(
    nativeResult.recovery,
    fixture.expectedRecovery,
    `${fixture.id}: native recovery`,
  );
  assert.deepEqual(
    browserResult.recovery,
    fixture.expectedRecovery,
    `${fixture.id}: browser recovery`,
  );
  assert.deepEqual(browserResult.recovery, nativeResult.recovery, `${fixture.id}: recovery parity`);
  assert.deepEqual(browserResult.structure, nativeResult.structure, `${fixture.id}: CST parity`);
}

test("native and browser parsers preserve parity for representative fixtures", async (t) => {
  await WebParser.init({
    locateFile: (fileName) => join(webTreeSitterRoot, fileName),
  });

  const language = await Language.load(wasmPath);
  const nativeParser = new NativeParser();
  nativeParser.setLanguage(VBA);
  const browserParser = new WebParser();
  browserParser.setLanguage(language);

  try {
    for (const fixture of parityFixtures) {
      await t.test(`${fixture.category}: ${fixture.id}`, () => {
        const source = readFixture(fixture);
        const nativeTree = nativeParser.parse(source);
        assert.ok(nativeTree, `${fixture.id}: native parser returned no tree`);
        const browserTree = browserParser.parse(source);
        assert.ok(browserTree, `${fixture.id}: browser parser returned no tree`);

        try {
          assertParity(fixture, inspectTree(nativeTree), inspectTree(browserTree));
        } finally {
          browserTree.delete();
        }
      });
    }
  } finally {
    browserParser.delete();
  }
});
