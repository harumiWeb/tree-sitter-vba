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

test("rejects declaration keywords after a comma", () => {
  const parser = new Parser();
  const VBA = require(".");

  parser.setLanguage(VBA);

  const malformed = parser.parse(`
Sub Test()
    Dim x As Double, Dim i As Long
    Dim b() As Byte, rEdIm b(10)
End Sub
`);
  const declarators = malformed.rootNode.descendantsOfType("variable_declarator");

  assert.equal(malformed.rootNode.hasError, true);
  assert.equal(
    declarators.some((node) => /^(dim|redim)$/i.test(node.childForFieldName("name").text)),
    false,
  );

  const valid = parser.parse(`
Sub Test()
    Dim x As Double, i As Long
    Dim b() As Byte: ReDim b(10)
End Sub
  `);
  assert.equal(valid.rootNode.hasError, false);
  const validDeclarators = valid.rootNode.descendantsOfType("variable_declarator");
  assert.deepEqual(
    validDeclarators.map((node) => node.childForFieldName("name").text),
    ["x", "i", "b"],
  );
  assert.equal(valid.rootNode.descendantsOfType("redim_statement").length, 1);
});
