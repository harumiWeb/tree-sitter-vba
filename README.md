# tree-sitter-vba

Tree-sitter grammar for Visual Basic for Applications (VBA).

This project provides a parsing foundation for exported VBA source files such as
`.bas`, `.cls`, and `.frm`. The grammar is intended for editor-facing features
such as highlighting, folding, tags, outline extraction, and future LSP work.

## Status

This project is in an MVP phase. It can parse a useful subset of exported VBA
modules and the real-world examples included in this repository, but it is not a
complete VBA grammar and is not production-ready.

The grammar currently parses all 77 checked-in real-world VBA examples without
`ERROR` or `MISSING` recovery nodes.

Currently supported:

- apostrophe comments and `Rem` comments
- string, integer, floating-point, boolean, `Nothing`, `Null`, and `Empty` literals
- hex literals and identifiers with common VBA type-declaration characters
- identifiers, simple type clauses, dotted type names, and array type suffixes
- `Attribute` statements
- `Option Explicit`, `Option Private Module`, `Option Compare`, and `Option Base`
- `Sub`, `Function`, and `Property Get/Let/Set` procedures
- `Dim`, `Static`, `WithEvents`, visibility-based variable declarations, arrays, `ReDim`, and `Const`
- `Type`, `Enum`, `Declare PtrSafe`, `Lib`, and `Alias`
- external `Declare Function` and `Declare Sub` declarations
- simple assignments, `Set` assignments, calls, named and omitted arguments, member access, and leading-dot member access
- `New` expressions and `As New` declarations
- fixed-length string declarations and date literals
- `AddressOf` expressions
- block `If`, single-line `If`, `Select Case`, `For`, `For Each`, `Do`, `While/Wend`, and `With`
- `On Error`, `Resume`, `GoTo`, labels, and `Exit` statements
- numeric line labels, numbered statements, and numbered control-flow delimiters
- conditional compilation with `#Const`, `#If`, `#ElseIf`, `#Else`, and `#End If`, including statement branches inside procedures
- line continuations and colon-separated statements
- minimal `.frm` / `.cls` export metadata such as `VERSION`, `Begin ... End`, `BeginProperty ... EndProperty`, GUID form blocks, and `.frx` blob references
- initial `highlights.scm`, `folds.scm`, and `tags.scm` queries

Known limitations:

- no type checking or semantic analysis
- no Excel Object Model or COM reference knowledge
- no formatter or LSP server
- common VBA operator precedence is supported, including arithmetic, concatenation, comparison, and logical operators
- `.frm` designer metadata is parsed syntactically, not interpreted semantically
- context-sensitive statement validity is not checked; for example, invalid `Exit For` placement is left to downstream semantic validation
- general expression-level `=` comparison remains context-limited to avoid ambiguity with assignment
- the expression grammar does not yet cover every VBA edge case

## Development

Install dependencies:

```bash
pnpm install
```

Generate the parser:

```bash
pnpm generate
```

Run corpus tests:

```bash
pnpm test
```

Parse example files:

```bash
pnpm parse:examples
```

This recursively parses the checked-in VBA examples and fails if any parse tree
contains an `ERROR` or `MISSING` node.

Run the full local check:

```bash
pnpm check
```

## Testing

Tree-sitter grammar behavior is tested with corpus files under:

```text
test/corpus/
```

When changing `grammar.js`, always add or update focused corpus tests. Do not
weaken existing expectations just to make a grammar change pass.

## Design Principles

This repository parses VBA syntax only. It does not validate whether identifiers,
types, members, procedures, workbook objects, or references are semantically
valid. Those concerns belong in downstream tools such as `xlflow`,
`xlflow-lsp`, or editor extensions.

Node names should remain stable once introduced because downstream query files
and integrations may depend on them.

## Node.js

Install the parser runtime and this grammar:

```bash
npm install tree-sitter tree-sitter-vba
```

Use the grammar with `tree-sitter`:

```js
const Parser = require("tree-sitter");
const VBA = require("tree-sitter-vba");

const parser = new Parser();
parser.setLanguage(VBA);

const tree = parser.parse(`
Sub Hello()
    Debug.Print "Hello"
End Sub
`);

console.log(tree.rootNode.toString());
```

The npm package currently builds its native addon from source during
installation. A supported Python installation, a C/C++ toolchain, and the
platform requirements documented by `node-gyp` are therefore required.
Prebuilt native binaries may be added in a future release.
