# tree-sitter-vba

Tree-sitter grammar for Visual Basic for Applications (VBA).

This project provides a parsing foundation for exported VBA source files such as
`.bas`, `.cls`, and `.frm`. The grammar is intended for editor-facing features
such as highlighting, folding, tags, outline extraction, and future LSP work.

## Status

This project is in an MVP phase. It can parse a useful subset of exported VBA
modules and the real-world examples included in this repository, but it is not a
complete VBA grammar and is not production-ready.

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
- simple assignments, `Set` assignments, calls, named arguments, member access, and leading-dot member access
- `New` expressions and `As New` declarations
- fixed-length string declarations and date literals
- `AddressOf` expressions
- block `If`, single-line `If`, `Select Case`, `For`, `For Each`, `Do`, `While/Wend`, and `With`
- `On Error`, `Resume`, `GoTo`, labels, and `Exit` statements
- numeric line labels and numbered statements
- conditional compilation with `#Const`, `#If`, `#ElseIf`, `#Else`, and `#End If`, including statement branches inside procedures
- line continuations and colon-separated statements
- minimal `.frm` / `.cls` export metadata such as `VERSION`, `Begin ... End`, GUID form blocks, and `.frx` blob references
- initial `highlights.scm`, `folds.scm`, and `tags.scm` queries

Known limitations:

- no type checking or semantic analysis
- no Excel Object Model or COM reference knowledge
- no formatter or LSP server
- expression precedence is intentionally incomplete
- `.frm` designer metadata is parsed syntactically, not interpreted semantically
- context-sensitive statement validity is not checked; for example, invalid `Exit For` placement is left to downstream semantic validation
- omitted arguments and full VBA expression precedence are still incomplete

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
