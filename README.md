# tree-sitter-vba

[![npm version](https://img.shields.io/npm/v/tree-sitter-vba.svg)](https://www.npmjs.com/package/tree-sitter-vba)
[![npm downloads](https://img.shields.io/npm/dm/tree-sitter-vba.svg)](https://www.npmjs.com/package/tree-sitter-vba)
[![CI](https://github.com/harumiWeb/tree-sitter-vba/actions/workflows/ci.yml/badge.svg)](https://github.com/harumiWeb/tree-sitter-vba/actions/workflows/ci.yml)

Tree-sitter grammars for Visual Basic for Applications (VBA) and Visual Basic 6
(VB6), targeting exported Excel/VBA source files such as `.bas`, `.cls`, and
`.frm`, and VB6 project sources including `.frm` forms and `.ctl` user
controls. Two parsers, `vba` and `vb6`, are generated from one shared grammar
core.

[Try tree-sitter-vba online](https://harumiweb.github.io/tree-sitter-vba/)

The playground runs the `vba` parser through WebAssembly entirely in your
browser. Use it to test parser compatibility, inspect synchronized concrete
syntax trees, and see the official `highlights.scm` query in action; source
code is not uploaded or sent to a parsing service.

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

VB6 shares its statement grammar with VBA, so the `vb6` parser reuses all of
the above and adds what is VB6's own: the `.frm`/`.ctl` form header and `.cls`
class header as the VB6 IDE writes them, and the constructs that predate VBA.

## Status

This is a `v0.x` public release.

The grammar is already usable for syntax-aware tooling such as highlighting,
folding, tags, outline extraction, and initial symbol analysis. The current test
suite covers 248 focused VBA corpus cases, 44 VB6 corpus cases, generated
`Select Case` stress coverage through 500 clauses, and 481 checked-in VBA
example files without `ERROR` or `MISSING` recovery nodes. The `vb6` parser is
additionally measured against 1,436 real VB6 source files from 71 public
projects; see [Testing](#testing) for the numbers.

It is not yet a complete VBA grammar. Node names and tree shapes may still change before `v1.0.0`.

## Two parsers from one grammar

The statement grammar is written once, in `common/define-grammar.js`, as a
function of the dialect. Each dialect directory holds a one-line entry point,
its generated parser, and its corpus tests:

```text
common/define-grammar.js   the whole grammar: defineGrammar("vba" | "vb6")
vba/grammar.js             module.exports = require("../common/define-grammar")("vba")
vba/src/                   generated vba parser; node-types.json is tracked, parser.c is generated
vba/test/corpus/           248 VBA corpus cases
vb6/grammar.js             module.exports = require("../common/define-grammar")("vb6")
vb6/src/scanner.c          a four-token external scanner (see Design principles)
vb6/src/                   generated vb6 parser
vb6/test/corpus/           44 VB6 corpus cases
corpus/                    provenance of the VB6 acceptance corpus; the source files are fetched, not vendored
examples/                  481 VBA example files
```

Everything dialect-specific is an `isVB6` / `isVBA` branch inside the core;
`grep -n "isVB6\|isVBA" common/define-grammar.js` lists the complete delta.
This is the layout `tree-sitter-typescript` uses for TypeScript and TSX, and
the reason both grammars live in subdirectories: with more than one grammar in
`tree-sitter.json`, the CLI picks the grammar from the working directory.

Generated artifacts follow [ADR 0002](docs/adr/0002-generated-parser-artifacts.md):
`src/parser.c` and `src/grammar.json` are not tracked in either dialect
directory, `src/node-types.json` is, and `bindings/go/parser.c` is a tracked copy
of the `vba` parser.

## Installation

```bash
npm install tree-sitter tree-sitter-vba
```

The npm package's native addon is the `vba` parser. The `vb6` parser ships as
generated C source (`vb6/src/parser.c` and `vb6/src/scanner.c`) for the
tree-sitter CLI and for direct embedding; Node.js and Go bindings for it are
not provided yet.

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

To parse VB6 from the command line, run the CLI inside the `vb6` directory,
which is how it selects the grammar:

```bash
cd vb6 && tree-sitter parse /path/to/Form1.frm
```

`scripts/run-tree-sitter.mjs --cwd vb6 parse <file>` does the same from the
repository root.

## Go Usage

The Go binding is self-contained when installed through Go modules; its package
directory includes the generated C parser needed by cgo. It exposes the `vba`
parser.

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
  `^`; in declarations the Single character `!` (`Dim X!`, `Const Y! = 1`) is
  a `bang_identifier` because it shares its token with the bang member operator
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
- calls, named arguments, omitted arguments anywhere in an unparenthesized
  list, call-site `ByVal`, member access, bang member access, and leading-dot
  member access
- `Debug.Print`, unparenthesized `Print` methods, and `? expr` Debug.Print
  shorthand statements, including comma- and semicolon-separated output lists
  with trailing output-position controls
- `New` expressions and `As New` declarations
- fixed-length string declarations
- `AddressOf` expressions
- common VBA operator precedence for arithmetic, concatenation, comparison, and
  logical operators; `=`, `<>`, `<`, `<=`, `>`, `>=`, `Is`, and `Like`
  comparisons are represented as `comparison_expression`
- comparison expressions in `Case` clauses, including object identity forms
  such as `Case obj Is Nothing` and condition lists such as `Case x = 1, y = 2`
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

### VB6 additions

The `vb6` parser accepts everything above except the VBA7-only constructs
(`PtrSafe`, `LongPtr`, `LongLong`, `DefLngPtr`, `DefLngLng`: `PtrSafe` on a
`Declare` is an error, `LongPtr` and `LongLong` are ordinary user type names),
and adds:

- the `.frm`/`.ctl` header as the VB6 IDE writes it: `Object = "{GUID}#2.0#0"; "X.OCX"`
  component references, nested `Begin Lib.Class Name ... End` blocks to any
  depth, `BeginProperty` blocks with the OCX GUID and indexed names
  (`BeginProperty ColumnHeader(1) {...}`), property values as strings, numbers,
  negative numbers, hex literals, annotated booleans (`-1  'True`), `.frx`/`.ctx`
  resource references with hexadecimal offsets and the `$` string prefix, menu
  shortcuts (`^O`, `{F5}`, `+{DEL}`), indexed property-bag names
  (`Tab(0).Control(1) = "txt(1)"`), and Single values written with a decimal
  comma by IDEs on European locales (`FontSize = 8,25`); VB3-era
  `Begin Form Form1` headers parse too
- the `.cls` header, `VERSION 1.0 CLASS` / `BEGIN ... END`, and two-valued
  `Attribute VB_Ext_KEY = "A" ,"B"` lines written by Class Builder
- form and PictureBox graphics statements with coordinate pairs, bare or
  `obj.`-qualified: `Line (x1, y1)-(x2, y2), color, BF`, `PSet (x, y), c`,
  `Circle (x, y), r, , , , aspect`, and `Scale (0, 0)-(w, h)`, with any
  trailing argument omitted
- a comment whose line ends in ` _` continuing onto the next line, which
  compiled VB6 projects rely on
- multi-statement single-line loops, `For i = 1 To n: a = 1: b = 2: Next`
- calls whose first argument is an implicit member, `Foo .Bar, x`, read as a
  call with two arguments rather than a chain `Foo.Bar` with an omitted
  argument, through the external scanner described under Design principles
- constructs VBA also has but the base VBA grammar never accepted; most remain
  `vb6` only so that the `vba` parser's trees and parse table stay those of the
  base (see [ADR 0005](docs/adr/0005-vba-parser-stays-the-base-grammar.md)):
  `Let`, `LSet`/`RSet`, `GoSub`/`Return`, `On Local Error`, `Global`,
  `Dim WithEvents`, `ReDim x(n) As T`, octal `&O` literals,
  `AddressOf Module.Procedure`, `Name.Member` receivers, a comparison as the
  left operand of another (`a = b <> 0`, `x Is Nothing = False`), a comparison
  as the `Select Case` selector, `#If` around whole `Case` clauses, an empty
  `Else` in a single-line `If`, `::` between inline
  statements, a colon before a `For` body's line break, a `Type` member named
  `End`, and the Single `!` suffix in expression positions (`total! = 0#`,
  `rec.Percent! = 0#`)
- an indexed or property target on the left of `=` is an assignment; the base
  lets `arr(i) = x` fall to a call of `arr` with the comparison `(i) = x` as
  its argument when tree shape happens to prefer it

The VB6-only rules are gated by `isVB6` in the core and add these node types:
`frm_object_reference`, `frm_shortcut_value`, `frm_locale_number`,
`frm_property_index`, `frm_property_name`, `frm_blob_offset`, `line_statement`,
`pset_statement`, `circle_statement`, and `scale_statement`. The rest of the
additions in the list above are shared by both dialects; the `vba` tree shapes
pinned by the VBA corpus are unchanged.

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
- a name written with the Single type character is a `bang_identifier` whose
  children are the `identifier` and the `!`; the other type characters stay
  inside the `identifier` token. In `vba` the node occurs where a declaration
  names something (`Dim`, `Const`, `ReDim`, `Type` members, parameters,
  `Function` names); `vb6` also produces it in expression positions.

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
- in the `vb6` parser, `line_statement` and `scale_statement` use `start` and
  `end` (each a `coordinate_pair` with `x` and `y`), `pset_statement` uses
  `point`, `circle_statement` uses `center` and `radius`, the qualified forms
  expose the receiver through `method`, and trailing graphics arguments use
  `argument`.
- in the `vb6` parser, form header nodes expose `frm_property_statement` as
  `name` and `value`, `frm_begin_block` as `type` and `name`,
  `frm_begin_property_block` as `name`, `index`, and `guid`,
  `frm_blob_reference` as `offset`, and `frm_object_reference` as `class` and
  `file`.

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
- In the `vb6` parser, `single_line_block` owns the colon after each of its
  statements, so an inline loop may hold several statements before its `Next`,
  `Loop`, or `End With`. The `vba` parser keeps its current shape.

## Known limitations

This grammar parses VBA and VB6 syntax only.

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

For the `vb6` parser:

- Input must be UTF-8 (or UTF-16 through the C API). VB6 source is stored in the
  machine's code page, and bytes above 0x7F fed in raw never match the
  identifier class, so identifiers such as `BtnAñadir` or a Big5 library name
  in a `Begin` line are errors until the file is transcoded. Comments and
  strings survive raw bytes; identifiers do not. Nine of the 1,436 corpus files
  fail this way without transcoding.
- `Debug.Assert (a >= b And c <= d) Or e = 0`, a call statement whose single
  unparenthesized argument is a parenthesized condition followed by `Or` and a
  comparison, parses as `Debug.Assert(...) Or e` with an orphaned `= 0` and two
  `MISSING` nodes. The same shape with plain identifiers inside the parentheses
  parses correctly; the comparisons inside the parentheses tip a GLR fork. One
  corpus file, one line.
- `.vbp` project files, `.dsr` designers, and `.pag` property pages are not
  parsed; `.frx`/`.ctx` binaries are referenced, not read. VBA7 constructs are
  rejected, and `#If VBA7` blocks are left to the conditional-compilation rules.
- There are no Node.js or Go bindings for the `vb6` parser yet; the npm addon,
  the Go module, and the Wasm artifact are the `vba` parser.

## Queries

This package includes initial Tree-sitter queries for:

```text
queries/highlights.scm
queries/folds.scm
queries/tags.scm
```

These queries are intended as a starting point for editor integrations and
tooling. They may evolve as the grammar stabilizes. Both grammars in
`tree-sitter.json` point at the same query files; the VB6-only node types are
not yet highlighted.

## Development

Install dependencies:

```bash
pnpm install
```

Generate both parsers, or one of them:

```bash
pnpm generate
pnpm generate:vba
pnpm generate:vb6
```

After grammar changes, keep the Go module artifact in sync:

```bash
cp vba/src/parser.c bindings/go/parser.c
pnpm check:go-parser
```

Run corpus tests:

```bash
pnpm test
```

`pnpm test:corpus` runs the VBA corpus under the `vba` parser, the VB6 corpus
under the `vb6` parser, and then the VBA corpus under the `vb6` parser through
`scripts/test-shared-corpus.mjs`, which skips the cases whose expectations differ
between the dialects by design and prints the reason for each. `pnpm
test:corpus:vba` and `pnpm test:corpus:vb6` run one side.

The tree-sitter CLI selects the grammar from the working directory, so run it
inside `vba/` or `vb6/`; `scripts/run-tree-sitter.mjs --cwd vb6 <args>` does
that from the repository root.

Parse example files:

```bash
pnpm parse:examples
```

This recursively parses the checked-in VBA examples with the `vba` parser and
fails if any parse tree contains an `ERROR` or `MISSING` node.

Parse the VB6 acceptance corpus:

```bash
node scripts/fetch-corpus.mjs
pnpm parse:corpus -- --transcode
```

See [Testing](#testing) for what the corpus is and how it is measured.

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

Build and test the standalone browser parser (the `vba` parser):

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
vba/test/corpus/
vb6/test/corpus/
```

Community-reported production syntax regressions are kept permanently under
`vba/test/corpus/regressions/`; each fixture records whether it was already
supported or required a grammar change.

When changing `common/define-grammar.js`, always add or update focused corpus
tests in the dialect the change affects. Do not weaken existing expectations
just to make a grammar change pass. A shared change must leave the `vba` trees
unchanged; `scripts/test-shared-corpus.mjs` then runs the VBA corpus under the
`vb6` parser as well, so a `vb6` divergence shows up as a failure there and is
either fixed or recorded in the script's skip list with its reason. The 23
skips today are the VBA7 constructs, the `.frx` offset node
(`frm_blob_offset` in `vb6`, `number_literal` in `vba`), the pinned one-statement
inline-loop shape, four cases where the `vba` parser emits an opaque
`_ambiguous_call_statement` token that `vb6` parses with structure, and five
error-recovery shapes on deliberately invalid input.

A clean parse is not a stable tree. A bare call whose callee has been split
into its own `expression_statement` still has zero `ERROR` nodes, so neither
`pnpm parse:examples` nor the corpus can see that class of regression unless a
case pins the exact shape. `scripts/compare-cst.mjs` closes that gap for the
`vba` parser: it parses all 481 example files with a reference checkout and with
this checkout, strips positions, and lists every differing file by the node
types each hunk adds and removes. Point `--base` at a `main` worktree and name
the intended differences with `--allow`:

```text
git worktree add /tmp/tree-sitter-vba-main main
node scripts/compare-cst.mjs --base /tmp/tree-sitter-vba-main --allow bang_identifier
```

Run it before proposing any change to `common/define-grammar.js` that touches
calls, arguments, or precedence, and explain every remaining hunk in the pull
request.

The repository also includes real-world exported VBA examples. These examples
are parsed in CI to catch regressions against practical Excel/VBA code.

Broken or incomplete examples can be kept under:

```text
examples/broken/
```

These fixtures are intentionally excluded from `pnpm parse:examples`. Add
focused recovery expectations under `vba/test/corpus/recovery.txt` when the
surrounding tree shape should remain stable.

### VB6 acceptance corpus

The `vb6` parser is measured against 1,436 real VB6 source files (647 `.frm`,
382 `.bas`, 283 `.cls`, 124 `.ctl`) from 71 public GitHub projects, including
code from the late 1990s. The files are not vendored: `corpus/MANIFEST.md` pins
every project to a full commit SHA with its licence and file counts,
`corpus/FILES.tsv` lists every file, and `scripts/fetch-corpus.mjs` clones each
project at its pinned SHA and copies exactly those paths, so the set is
byte-identical to the one measured:

```bash
node scripts/fetch-corpus.mjs          # all 71 projects
node scripts/fetch-corpus.mjs --only <owner__repo>
pnpm parse:corpus -- --transcode
```

Files are copied as raw bytes; most are Windows-1252 with CRLF and must not be
re-encoded, so the runner transcodes at read time per `corpus/ENCODINGS.json`
(180 files via Windows-1252, 56 via GBK, 22 via Big5). Keeping the source out of
the tree also means this repository redistributes nobody else's code; five of
the 71 projects are copyleft and are marked as such in the manifest.

Measured on 2026-09-12 with tree-sitter CLI 0.26.9:

| Check | Result |
| --- | --- |
| VB6 corpus, transcoded | 1,432 of 1,436 files parse with zero `ERROR` and zero `MISSING`. Three files carry syntax errors VB6 itself rejects and are listed with the defect in `corpus/EXCLUDED.json`; the runner reports them separately. One file keeps two `MISSING` nodes on the `Debug.Assert` shape described under Known limitations |
| VB6 corpus, raw bytes | nine further files fail on non-ASCII identifiers in legacy code pages |
| VBA corpus under `vba` | 248 of 248 cases; 481 of 481 example files without `ERROR` or `MISSING` |
| VB6 corpus cases under `vb6` | 44 of 44 |
| VBA corpus under `vb6` | 225 of 225 cases run, 23 skipped by design as listed above |
| Parse time | the largest corpus file, a 2.2 MB module, parses in about 410 ms (5.4 MB/s); a 500 KB `.frm` in 97 ms |

## Design principles

This repository parses VBA and VB6 syntax only.

It does not validate whether identifiers, types, members, procedures, workbook
objects, or references are semantically valid. Those concerns belong in
downstream tools such as `xlflow`, `xlflow-lsp`, editor extensions, or other
analysis tools.

Node names should remain stable once introduced because downstream query files
and integrations may depend on them. However, because this is a `v0.x` release,
node names and tree shapes may still change before `v1.0.0`.

Over-acceptance is preferred to ambiguity: where a choice exists between
rejecting invalid code and keeping the tree unambiguous, the grammar keeps the
tree and leaves validation to downstream tools.

### Why the `vb6` parser has an external scanner

VB6 reads whitespace before a member operator at statement level: `Foo .Bar, x`
is a call to `Foo` with two arguments, `Foo.Bar , x` a call to `Foo.Bar` with an
omitted first argument. A context-free grammar never sees the space. The `vba`
parser works around one shape with whole-line regex tokens
(`_ambiguous_call_statement`), which keep the tree free of errors but hide the
statement's structure, and `token.immediate(".")` cannot share a lexer state
with a regular `"."`. The scanner in [vb6/src/scanner.c](vb6/src/scanner.c)
emits `_dot_immediate` / `_dot_spaced` / `_bang_immediate` / `_bang_spaced`:
member chains use the immediate kind only, an implicit member may start with
either, a dot after a line continuation counts as immediate (`x("y") _`
followed by `.Add(...)` is a chain), and a dot followed by a digit is left to
the internal lexer (`.5`). It carries no state. The `vba` parser has no scanner.

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

The VB6 acceptance corpus is not part of this repository; `corpus/MANIFEST.md`
records the repository, commit, and licence of every project it is fetched
from.
