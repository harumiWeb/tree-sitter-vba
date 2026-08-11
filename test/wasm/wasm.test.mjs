import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Language, Parser } from "web-tree-sitter";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const wasmPath = join(root, "build", "wasm", "tree-sitter-vba.wasm");
const webTreeSitterRoot = dirname(require.resolve("web-tree-sitter"));

function collectRecoveryNodes(node, recovery = []) {
  if (node.type === "ERROR") {
    recovery.push("ERROR");
  }
  if (node.isMissing) {
    recovery.push("MISSING");
  }
  for (const child of node.children) {
    collectRecoveryNodes(child, recovery);
  }
  return recovery;
}

function readFixture(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

test("standalone WebAssembly artifact loads in web-tree-sitter", async () => {
  assert.equal(existsSync(wasmPath), true, `missing ${wasmPath}`);

  await Parser.init({
    locateFile: (fileName) => join(webTreeSitterRoot, fileName),
  });

  let language;
  let parser;
  try {
    language = await Language.load(wasmPath);
    parser = new Parser();
    parser.setLanguage(language);

    for (const fixture of ["examples/basic.bas", "examples/class.cls", "examples/userform.frm"]) {
      const tree = parser.parse(readFixture(fixture));
      assert.ok(tree, `${fixture} returned no parse tree`);
      try {
        assert.deepEqual(collectRecoveryNodes(tree.rootNode), [], `${fixture} has recovery nodes`);
      } finally {
        tree.delete();
      }
    }
  } finally {
    parser?.delete();
  }
});

test("standalone WebAssembly artifact preserves recovery nodes", async () => {
  await Parser.init({
    locateFile: (fileName) => join(webTreeSitterRoot, fileName),
  });

  let language;
  let parser;
  try {
    language = await Language.load(wasmPath);
    parser = new Parser();
    parser.setLanguage(language);

    const cases = [
      ["examples/broken/incomplete-call.bas", "MISSING"],
      ["examples/broken/malformed-string.bas", "ERROR"],
    ];

    for (const [fixture, expectedRecovery] of cases) {
      const tree = parser.parse(readFixture(fixture));
      assert.ok(tree, `${fixture} returned no parse tree`);
      try {
        const recovery = collectRecoveryNodes(tree.rootNode);
        assert.equal(
          recovery.includes(expectedRecovery),
          true,
          `${fixture} has no ${expectedRecovery}`,
        );
      } finally {
        tree.delete();
      }
    }
  } finally {
    parser?.delete();
  }
});
