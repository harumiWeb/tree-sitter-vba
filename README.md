# tree-sitter-vba

[![npm version](https://img.shields.io/npm/v/tree-sitter-vba.svg)](https://www.npmjs.com/package/tree-sitter-vba)
[![npm downloads](https://img.shields.io/npm/dm/tree-sitter-vba.svg)](https://www.npmjs.com/package/tree-sitter-vba)
[![CI](https://github.com/harumiWeb/tree-sitter-vba/actions/workflows/ci.yml/badge.svg)](https://github.com/harumiWeb/tree-sitter-vba/actions/workflows/ci.yml)

A Tree-sitter grammar for Visual Basic for Applications (VBA), targeting
exported Excel/VBA source files such as `.bas`, `.cls`, and `.frm`.

This grammar is designed as a parsing foundation for editor and tooling use
cases, including syntax highlighting, folding, tags, outline extraction, symbol
inspection, linting, formatting, and future LSP integrations.

## Why another VBA grammar?

Several tree-sitter grammars exist for Visual Basic-family languages, but VBA has its own syntax and practical edge cases, especially in code exported from the VBE.

This project focuses on practical Excel/VBA source compatibility:

- `.bas`, `.cls`, and `.frm` files exported from the VBE
- real-world VBA fixtures
- UserForm metadata
- conditional compilation
- error handling
- Excel-style member access and procedure calls
- editor queries for highlights, folds, and tags
- permissive MIT licensing

## Status

This is a `v0.x` initial public release.

The grammar is already usable for syntax-aware tooling such as highlighting, folding, tags, outline extraction, and initial symbol analysis. It parses the checked-in corpus and all 100 checked-in real-world VBA examples without `ERROR` or `MISSING` recovery nodes.

It is not yet a complete VBA grammar. Node names and tree shapes may still change before `v1.0.0`.

## Installation

```bash
npm install tree-sitter tree-sitter-vba
```

## Usage

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

Example output:

```text
(source_file
  (sub_declaration
    name: (identifier)
    (parameter_list)
    body: (block
      (call_statement
        callee: (member_expression
          object: (identifier)
          property: (identifier))
        (argument_list
          (string_literal))))))
```

## Node.js native build requirements

The npm package currently builds its native addon from source during
installation. Prebuilt native binaries may be added in a future release.

A supported Python installation, a C/C++ toolchain, and the platform
requirements documented by `node-gyp` are required.

On Windows, Visual Studio 2022 Build Tools with the **Desktop development with
C++** workload is recommended.

At minimum, Windows users typically need:

- Python 3.11 or later
- Visual Studio 2022 Build Tools
- MSVC C++ x64/x86 build tools
- Windows 10 SDK or Windows 11 SDK

If multiple Python installations are present, configure npm to use the intended
Python executable:

```powershell
npm config set python "C:\Users\<you>\AppData\Local\Programs\Python\Python312\python.exe"
```

For reliable native builds on Windows, run installation from:

```text
x64 Native Tools Command Prompt for VS 2022
```

## Supported syntax

The grammar currently supports:

- apostrophe comments and `Rem` comments
- string, integer, floating-point, boolean, date, `Nothing`, `Null`, and `Empty`
  literals
- hex literals
- identifiers with common VBA type-declaration characters
- identifiers, simple type clauses, dotted type names, and array type suffixes
- `Attribute` statements
- `Option Explicit`, `Option Private Module`, `Option Compare`, and `Option Base`
- `Implements` statements
- `Sub`, `Function`, and `Property Get/Let/Set` procedures
- `Dim`, `Static`, `WithEvents`, visibility-based variable declarations,
  arrays, `ReDim`, `Erase`, and `Const`
- `Type` and `Enum` declarations
- external `Declare Function` and `Declare Sub` declarations, including
  `PtrSafe`, `Lib`, and `Alias`
- simple assignments and `Set` assignments
- calls, named arguments, omitted arguments, member access, and leading-dot
  member access
- `New` expressions and `As New` declarations
- fixed-length string declarations
- `AddressOf` expressions
- common VBA operator precedence for arithmetic, concatenation, comparison, and
  logical operators
- block `If`, single-line `If`, `Select Case`, `For`, `For Each`, `Do`,
  `While/Wend`, and `With`
- `On Error`, `Resume`, `GoTo`, labels, and `Exit` statements
- common file I/O statements: `Open`, `Input #`, `Line Input #`, `Print #`,
  and `Close`
- numeric line labels, numbered statements, and numbered control-flow delimiters
- conditional compilation with `#Const`, `#If`, `#ElseIf`, `#Else`, and
  `#End If`, including statement branches inside procedures
- line continuations and colon-separated statements
- minimal `.frm` and `.cls` export metadata, including `VERSION`,
  `Begin ... End`, `BeginProperty ... EndProperty`, GUID form blocks, and
  `.frx` blob references
- initial `highlights.scm`, `folds.scm`, and `tags.scm` queries

## Known limitations

This grammar parses VBA syntax only.

It does not currently provide:

- type checking
- semantic analysis
- Excel Object Model or COM reference knowledge
- validation of identifier, member, type, procedure, workbook, or reference
  existence
- validation of context-sensitive statement placement
- a formatter
- an LSP server
- complete coverage of every VBA expression edge case
- semantic interpretation of `.frm` designer metadata

For example, invalid placement of `Exit For`, unresolved procedure calls, invalid
Excel object members, or missing workbook references are intentionally left to
downstream tools.

General expression-level `=` comparison is still context-limited to avoid
ambiguity with assignment.

## Queries

This package includes initial Tree-sitter queries for:

```text
queries/highlights.scm
queries/folds.scm
queries/tags.scm
```

These queries are intended as a starting point for editor integrations and
tooling. They may evolve as the grammar stabilizes.

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

Run queries against the example files:

```bash
pnpm query:examples
```

This validates that `highlights.scm`, `folds.scm`, and `tags.scm` can run
against the checked-in examples.

Run the coarse parser benchmark:

```bash
pnpm bench
```

This reports file counts, total bytes, parse time, node counts, and
`ERROR`/`MISSING` counts for the checked-in examples. It is intended to catch
large regressions, not to provide a strict microbenchmark.

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

The repository also includes real-world exported VBA examples. These examples
are parsed in CI to catch regressions against practical Excel/VBA code.

Broken or incomplete examples can be kept under:

```text
examples/broken/
```

These fixtures are intentionally excluded from `pnpm parse:examples`. Add
focused recovery expectations under `test/corpus/recovery.txt` when the
surrounding tree shape should remain stable.

## Design principles

This repository parses VBA syntax only.

It does not validate whether identifiers, types, members, procedures, workbook
objects, or references are semantically valid. Those concerns belong in
downstream tools such as `xlflow`, `xlflow-lsp`, editor extensions, or other
analysis tools.

Node names should remain stable once introduced because downstream query files
and integrations may depend on them. However, because this is a `v0.x` release,
node names and tree shapes may still change before `v1.0.0`.

## Versioning

Recommended interpretation of the current release line:

- `0.1.x`: parser coverage fixes, query fixes, and non-breaking improvements
- `0.x.0`: notable grammar expansion or tree-shape changes
- `1.0.0`: node names and tree shapes are considered stable for downstream use

## Related projects

This grammar is intended to support practical VBA tooling, including the
`xlflow` ecosystem for AI-assisted Excel/VBA development.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
