const assert = require("node:assert");
const { test } = require("node:test");
const Parser = require("tree-sitter");

test("can load and parse VBA", () => {
  const parser = new Parser();
  const VBA = require(".");

  assert.doesNotThrow(() => parser.setLanguage(VBA));

  const tree = parser.parse(`
Sub Hello()
    Debug.Print "Hello"
End Sub
`);

  assert.equal(tree.rootNode.type, "source_file");
  assert.equal(tree.rootNode.hasError, false);
});

test("binding parses file io statements", () => {
  const parser = new Parser();
  const VBA = require(".");

  parser.setLanguage(VBA);

  const tree = parser.parse(`
Sub Test()
    Open path For Input As #fileNumber
    Print #fileNumber, "value"
    Close #fileNumber
End Sub
`);

  assert.equal(tree.rootNode.hasError, false);
});
