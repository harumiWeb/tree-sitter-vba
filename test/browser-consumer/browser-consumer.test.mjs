import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Language, Parser } from "web-tree-sitter";
import { countRecoveryNodes } from "../../examples/browser-consumer/recovery.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dist = join(root, "build", "browser-consumer");

function parseWith(parser, source) {
  const tree = parser.parse(source);
  assert.ok(tree, "parser returned no syntax tree");
  return tree;
}

test("browser consumer build is self-contained and reports recovery nodes", async () => {
  for (const file of [
    "index.html",
    "app.js",
    "recovery.mjs",
    "tree-sitter-vba.wasm",
    "vendor/web-tree-sitter.js",
    "vendor/web-tree-sitter.wasm",
  ]) {
    assert.equal(existsSync(join(dist, file)), true, `missing ${file}`);
  }

  const index = readFileSync(join(dist, "index.html"), "utf8");
  const app = readFileSync(join(dist, "app.js"), "utf8");
  assert.doesNotMatch(index, /(?:playground|node_modules|build[\\/]+wasm)/i);
  assert.doesNotMatch(app, /(?:playground|node_modules|build[\\/]wasm)/i);
  assert.doesNotMatch(app, /from\s+["']\.\/recovery\.mjs["']/);
  assert.match(app, /Parser\.init/);
  assert.match(app, /Language\.load/);
  assert.match(app, /tree\.delete\(\)/);

  await Parser.init({
    locateFile: (fileName) => join(dist, "vendor", fileName),
  });

  let parser;
  try {
    const language = await Language.load(join(dist, "tree-sitter-vba.wasm"));
    parser = new Parser();
    parser.setLanguage(language);

    const cleanTree = parseWith(
      parser,
      "Sub Example()\n    Dim value As Long\n    value = 42\nEnd Sub\n",
    );
    try {
      assert.deepEqual(countRecoveryNodes(cleanTree.rootNode), {
        errorCount: 0,
        missingCount: 0,
      });
      assert.match(cleanTree.rootNode.toString(), /^\(source_file/);
    } finally {
      cleanTree.delete();
    }

    const missingTree = parseWith(parser, "Sub Test()\n    value = Foo(\nEnd Sub\n");
    try {
      assert.equal(countRecoveryNodes(missingTree.rootNode).missingCount > 0, true);
    } finally {
      missingTree.delete();
    }

    const errorTree = parseWith(parser, 'Sub Test()\n    message = "unterminated\nEnd Sub\n');
    try {
      assert.equal(countRecoveryNodes(errorTree.rootNode).errorCount > 0, true);
    } finally {
      errorTree.delete();
    }
  } finally {
    parser?.delete();
  }
});
