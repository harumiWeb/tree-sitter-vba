# tree-sitter-vba

Tree-sitter grammar for Visual Basic for Applications (VBA).

This project provides a parsing foundation for exported VBA source files such as
`.bas`, `.cls`, and `.frm`. The grammar is intended for editor-facing features
such as highlighting, folding, tags, outline extraction, and future LSP work.

## Status

This project is in an early MVP phase. It is useful for simple exported modules,
but it is not a complete VBA grammar and is not production-ready.

Currently supported:

- apostrophe comments and `Rem` comments
- string, integer, floating-point, and boolean literals
- identifiers and simple type clauses
- `Attribute` statements
- `Option Explicit`, `Option Private Module`, `Option Compare`, and `Option Base`
- `Sub`, `Function`, and `Property Get/Let/Set` procedures
- `Dim`, `Static`, visibility-based variable declarations, and `Const`
- simple assignments, `Set` assignments, calls, member access, and leading-dot member access
- block `If`, `Select Case`, `For`, `For Each`, `Do`, and `With`
- minimal `.frm` / `.cls` export metadata such as `VERSION` and `Begin ... End`
- initial `highlights.scm`, `folds.scm`, and `tags.scm` queries

Known limitations:

- no type checking or semantic analysis
- no Excel Object Model or COM reference knowledge
- no formatter or LSP server
- expression precedence is intentionally incomplete
- `.frm` designer metadata is parsed syntactically, not interpreted semantically
- no line continuation, colon-separated statements, conditional compilation, `Declare`, `Type`, or `Enum` support yet
- single-line `If ... Then ... Else ...` is not supported yet

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
