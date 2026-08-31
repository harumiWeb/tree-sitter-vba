# tree-sitter-vba

[![npm version](https://img.shields.io/npm/v/tree-sitter-vba.svg)](https://www.npmjs.com/package/tree-sitter-vba)
[![npm downloads](https://img.shields.io/npm/dm/tree-sitter-vba.svg)](https://www.npmjs.com/package/tree-sitter-vba)
[![CI](https://github.com/harumiWeb/tree-sitter-vba/actions/workflows/ci.yml/badge.svg)](https://github.com/harumiWeb/tree-sitter-vba/actions/workflows/ci.yml)

A Tree-sitter grammar for Visual Basic for Applications (VBA), targeting
exported Excel/VBA source files such as `.bas`, `.cls`, and `.frm`.

[Try tree-sitter-vba online](https://harumiweb.github.io/tree-sitter-vba/)

The playground runs this parser through WebAssembly entirely in your browser.
Use it to test parser compatibility, inspect synchronized concrete syntax trees,
and see the official `highlights.scm` query in action; source code is not
uploaded or sent to a parsing service.

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

This is a `v0.x` public release.

The grammar is already usable for syntax-aware tooling such as highlighting,
folding, tags, outline extraction, and initial symbol analysis. The current test
suite covers 229 focused corpus cases, generated `Select Case` stress coverage
through 500 clauses, and 478 checked-in VBA example files without `ERROR` or
`MISSING` recovery nodes.

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

## Go Usage

The Go binding is self-contained when installed through Go modules; its package
directory includes the generated C parser needed by cgo.

```go
package main

import (
	"fmt"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_vba "github.com/harumiWeb/tree-sitter-vba/bindings/go"
)

func main() {
	parser := tree_sitter.NewParser()
	defer parser.Close()

	parser.SetLanguage(tree_sitter.NewLanguage(tree_sitter_vba.Language()))

	tree := parser.Parse([]byte("Sub Hello()\nEnd Sub\n"), nil)
	defer tree.Close()

	fmt.Println(tree.RootNode().ToSexp())
}
```

Example output:

```text
(source_file
  (sub_declaration
    name: (identifier)
    (parameter_list)
    body: (block
      (call_statement
        callee: (qualified_member_expression
          receiver: (identifier)
          operator: "."
          member: (identifier))
        arguments: (unparenthesized_argument_list
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
- decimal and hexadecimal literals with common VBA type characters, including
  Currency (`@`) and LongLong (`^`), exponent notation such as `1E-3`, and
  abbreviated decimal forms such as `.5` and `1.`
- identifiers with common VBA type-declaration characters, including `@` and
  `^`
- identifiers, simple type clauses, dotted type names, and array type suffixes
- `Attribute` statements
- `Option Explicit`, `Option Private Module`, `Option Compare`, and `Option Base`
- `Implements` statements
- `Sub`, `Function`, and `Property Get/Let/Set` procedures
- `Event` declarations
- `RaiseEvent` statements
- `Dim`, `Static`, `WithEvents`, visibility-based variable declarations,
  arrays, `ReDim`, `Erase`, and `Const`
- default type declaration statements such as `DefInt` and `DefStr`
- `Type` and `Enum` declarations
- external `Declare Function` and `Declare Sub` declarations, including
  `PtrSafe`, `Lib`, and `Alias`
- simple assignments and `Set` assignments
- `Name oldPath As newPath` file rename statements
- calls, named arguments, omitted arguments, call-site `ByVal`, member access,
  bang member access, and leading-dot member access
- `Debug.Print`, unparenthesized `Print` methods, and `? expr` Debug.Print
  shorthand statements, including comma- and semicolon-separated output lists
  with trailing output-position controls
- `New` expressions and `As New` declarations
- fixed-length string declarations
- `AddressOf` expressions
- common VBA operator precedence for arithmetic, concatenation, comparison, and
  logical operators; `=`, `<>`, `<`, `<=`, `>`, `>=`, `Is`, and `Like`
  comparisons are represented as `comparison_expression`
- block `If`, including colon-separated multi-statement single-line branches;
  `Select Case`; and nested single-line `For`, `For Each`, `Do`, `While/Wend`,
  and `With`
- `Next` counter lists such as `Next i` and `Next j, i`
- `On Error`, computed `On ... GoTo`/`GoSub`, `Resume`, `GoTo`, labels,
  standalone `End`, and `Exit` statements
- common file I/O statements: `Open`, `Input #`, `Line Input #`, `Print #`,
  `Write #`, `Close`, `Get #`, `Put #`, `Lock`, `Unlock`, `Seek`, and `Reset`,
  including Print/Write output lists with trailing `;` or `,` and common
  `Access ... Shared` locking clauses
- simple runtime statements: `Stop`, `Beep`, `Load`, and `Unload`
- Access report `Line` drawing calls that use coordinate ranges such as
  `Me.Line (x, y)-(x2, y2)`
- `TypeOf ... Is ...` checks, including dotted type names such as `Access.Line`
- numeric line labels, numbered statements, and numbered control-flow delimiters
- conditional compilation with `#Const`, `#If`, `#ElseIf`, `#Else`, and
  `#End If`, including statement branches inside procedures, members inside
  `Type` and `Enum` declarations, and alternative procedure headers
- line continuations, including trailing whitespace, and colon-separated
  statements and `Enum` members
- minimal `.frm` and `.cls` export metadata, including `VERSION`,
  `Begin ... End`, `BeginProperty ... EndProperty`, GUID form blocks, and
  `.frx` blob references
- initial `highlights.scm`, `folds.scm`, and `tags.scm` queries

## Declaration node API

This release line is still pre-`1.0.0`, and declaration node shapes may change
when doing so makes syntactic metadata more directly available to downstream
tools.

Declaration consumers should prefer these structural nodes and fields over
source-text scanning:

- `property_get_declaration`, `property_let_declaration`, and
  `property_set_declaration` distinguish property accessors directly.
- `declare_sub_statement` and `declare_function_statement` distinguish external
  declaration kind directly.
- declaration headers expose stable fields such as `visibility`, `name`,
  `parameters`, `type`, `library`, `alias`, `ptrsafe_modifier`, `body`, and
  `end` where applicable. Procedure terminators are exposed through
  `end_sub_statement`, `end_function_statement`, and `end_property_statement`
  nodes.
- procedure declarations expose additional procedure modifiers through a
  `modifiers` field, separate from `visibility`.
- variable, constant, type-member, and parameter declarations expose stable
  `name`, `bounds`, `type`, `initializer`, `passing_mode`, `optional_modifier`,
  `paramarray_modifier`, and `default_value` fields where syntactically valid.
- `with_events_modifier`, `static_modifier`, `byval_modifier`, `byref_modifier`,
  `optional_modifier`, `paramarray_modifier`, and `ptrsafe_modifier` are
  explicit modifier nodes.
- `implements_statement` exposes its target as `name`, and
  `attribute_statement` exposes `name` and `value`.

## Expression node API

Member access and calls expose stable fields for analysis tools:

- `qualified_member_expression` uses `receiver`, `operator`, and `member`.
- `implicit_member_expression` uses `operator` and `member`; it has no
  `receiver`, matching leading-dot and leading-bang VBA syntax.
- `call_expression` uses `function` and `arguments`, where `arguments` is an
  `argument_list`.
- `call_statement` uses `callee` and, when arguments are present, `arguments`.
  Parenthesized arguments use `argument_list`; statement-style arguments use
  `unparenthesized_argument_list`. Unparenthesized `Print` methods are the
  Print-family exception: their `arguments` field contains an `output_list`.
- `output_list` is shared by `Debug.Print`, `?`, `Print #`, `Write #`, and
  unparenthesized `Print` methods. Output expressions use the `value` field;
  `;` and `,` output-position controls use the `position` field containing a
  `char_position` node. A position may follow the final output expression.

## Control-flow node API

- `for_statement` and `for_each_statement` expose optional terminator counters
  through `next_variables: next_variable_list`; `next_variable` is no longer
  emitted.
- `next_variable_list` always contains the ordered identifiers from `Next`,
  whether there is one counter or several.
- A colon-separated single-line `If` branch with multiple statements is an
  `inline_statement_sequence`; one-statement branches keep their direct child.
- `shared_next_for_body` represents an enclosing loop whose nested loop is
  closed by the same `Next ...` counter list.

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

After grammar changes, keep the Go module artifact in sync:

```bash
cp src/parser.c bindings/go/parser.c
pnpm check:go-parser
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

Build and test the standalone browser parser:

```bash
pnpm build:wasm
pnpm test:wasm
```

Compare the native and browser parser targets on representative corpus and
exported-module fixtures:

```bash
pnpm test:parity
```

The parity suite checks root node types, `ERROR` / `MISSING` recovery, and
normalized syntax-tree structure. It uses the standalone Wasm parser through
`web-tree-sitter`; the browser consumer smoke test separately covers loading
and parsing in Chromium.

The complete browser artifact, release, versioning, and loading contract is
documented in [docs/specs/wasm-artifact.md](docs/specs/wasm-artifact.md).
In brief, versioned releases attach `tree-sitter-vba.wasm` and its SHA-256
checksum to the matching GitHub Release. The artifact is not committed or
included in the npm package. A browser consumer uses the matching
`web-tree-sitter@0.26.9` runtime:

```js
import { Language, Parser } from "web-tree-sitter";

await Parser.init({ locateFile: () => "/assets/web-tree-sitter.wasm" });
const language = await Language.load("/assets/tree-sitter-vba.wasm");
const parser = new Parser();
parser.setLanguage(language);
const tree = parser.parse("Sub Hello()\nEnd Sub\n");
try {
  if (!tree) throw new Error("Parser did not return a syntax tree");
  console.log(tree.rootNode.toString());
} finally {
  tree?.delete();
  parser.delete();
}
```

For a complete minimal static example, including local WebAssembly runtime
assets and `ERROR` / `MISSING` reporting, see
[examples/browser-consumer](examples/browser-consumer/README.md).

## Testing

Tree-sitter grammar behavior is tested with corpus files under:

```text
test/corpus/
```

Community-reported production syntax regressions are kept permanently under
`test/corpus/regressions/`; each fixture records whether it was already
supported or required a grammar change.

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
- `0.2.x`: expanded real-world VBA coverage; tree shapes may still evolve
- `0.x.0`: notable grammar expansion or tree-shape changes
- `1.0.0`: node names and tree shapes are considered stable for downstream use

## Related projects

This grammar is intended to support practical VBA tooling, including the
[harumiWeb/xlflow](https://github.com/harumiWeb/xlflow) ecosystem for AI-assisted Excel/VBA development.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

### Third-party examples

The `examples/third_party` directory may contain third-party fixture files under
their original licenses. These files are provided for parser coverage only and
are not licensed under this repository's MIT license unless explicitly stated.
See [THIRD_PARTY_LICENSE.md](THIRD_PARTY_LICENSE.md) for the project inventory,
upstream sources, acknowledgements, and local license records.
