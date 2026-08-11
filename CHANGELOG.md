# Changelog

All notable changes to tree-sitter-vba will be documented in this file.

## Unreleased

## [v0.12.1] - 2026-08-11

### Added

- Add a standalone reproducible WebAssembly parser build and publish its Wasm
  artifact with a SHA-256 checksum on versioned GitHub Releases.

## [v0.12.0] - 2026-08-10

### Added

- Validate third-party fixture source and license metadata in CI.

### Changed

- Generate the parser with Tree-sitter ABI 15 for contextual reserved-word
  handling.

### Fixed

- Reject `Dim` and `ReDim` as comma-separated variable declarator names and
  expose the invalid remainder through parser recovery while preserving the
  valid declaration prefix.
- Correct three VBE-rejected stdVBA fixture statements to use colon-separated
  VBA statements.

## [v0.11.1] - 2026-08-03

### Added

- Add the MIT-licensed ROneCOne exported class as a real-world parser fixture.

### Fixed

- Parse VBE-exported procedure `Attribute` statements immediately following
  `Function`, `Sub`, and `Property` headers.
- Accept contextual procedure names such as `Load` and `Name` in exported
  attribute targets without changing ordinary identifier parsing. This prevents
  recovery nodes and spurious `Attribute` call sites in downstream consumers.

## [v0.11.0] - 2026-07-29

### Added

- Parse conditionally selected procedure headers with branch-local declarations
  and statements through `conditional_branch_body`.
- Parse `Xor`, `Eqv`, and `Imp` condition expressions, assignable `For` and
  `For Each` control variables, assignable `Next` variables, and
  colon-separated inline `Type` members.
- Add regression coverage for conditional-compilation-split `If` constructs,
  indexed-member `ReDim`, whitespace-sensitive and continued implicit-member
  calls, and calls that combine omitted positional arguments with named
  arguments.
- Expand the checked-in real-world corpus to 477 VBA source files.

### Changed

- Represent multiline `If` constructs as the flat `if_statement`,
  `elseif_fragment`, `else_fragment`, and `end_if_fragment` sequence. This is
  an intentional breaking CST change for downstream consumers.
- Allow whitespace-sensitive and omitted-then-named ambiguous calls to use a
  fieldless `call_statement`; consumers must treat `callee` and `arguments` as
  optional for these forms.
- Allow indexed-member `ReDim` targets to use a fieldless `redim_statement`
  while retaining structured declarators for ordinary forms.
- Update highlight queries for the flat `If` fragment nodes and remove
  nested-node `If` folding queries that no longer have a structural range.
- Increase focused corpus coverage from 212 to 222 cases and checked-in
  clean-parse coverage from 343 to 477 files.

### Fixed

- Cleanly parse conditional compilation that selects alternative multiline
  `If` headers while sharing the body and `End If`.
- Cleanly parse real-world implicit calls such as
  `QuickSortKeys .arrKeys, .arrItems, 0, .ub`.
- Cleanly parse omitted positional arguments followed by multiple named
  arguments without producing recovery nodes.

## [v0.10.1] - 2026-07-28

### Added

- Add regression coverage for factored expression rules and equivalent inline
  and multiline control-flow forms, including mixed shared `Next` chains.

### Changed

- Factor common expression, assignable, and control-flow grammar alternatives
  without changing the public CST or reducing the existing clean-parse range.
- Reduce the generated `parser.c` size from 66,446,096 bytes to 63,339,156
  bytes (4.68%), with 927 fewer parser states and 622 fewer large states.

## [v0.10.0] - 2026-07-27

### Added

- Parse nested colon-separated single-line `For`, `For Each`, `Do`, `While`,
  and `With` control-flow statements.
- Parse shared `Next` counter lists such as `Next inner, outer` and preserve
  their nested loop structure.
- Preserve every colon-separated statement in a single-line `If` branch through
  `inline_statement_sequence` nodes.

### Changed

- Replace the singular `next_variable` field on `For` and `For Each` with
  `next_variables: next_variable_list`. This is an intentional pre-1.0 CST
  breaking change for downstream consumers.

## [v0.9.0] - 2026-07-26

### Added

- Add permanent community regression fixtures for hexadecimal `ChrW` arguments,
  large `Select Case` blocks, inline `ElseIf` branches, and `Mid`/`Mid$`
  assignment and expression forms.
- Add generated `Select Case` parser stress coverage for 10, 50, 100, and 500
  clauses. The test checks recovery nodes and expected tree structure and runs
  as part of `pnpm test`.

### Fixed

- Parse inline statement bodies on `ElseIf` branches within block `If`
  statements.

## [v0.8.1] - 2026-06-19

- Upgrade for cache refresh

## [v0.8.0] - 2026-06-19

### Changed

- Stabilize downstream-facing AST fields for editor and LSP integrations:
  procedure declarations now expose named `end` terminator nodes, procedure
  static modifiers use the `modifiers` field, member access uses
  `receiver`/`member`, and calls expose arguments through an `arguments` field.
- Split statement-style call arguments into `unparenthesized_argument_list`
  while keeping parenthesized call-expression arguments under `argument_list`.
  This is a breaking tree-shape change for consumers that relied on positional
  call argument traversal or the previous `object`/`property` member fields.
- Stop tracking generated `src/parser.c` and `src/grammar.json` in Git. They
  are ignored locally, generated in CI, and generated during npm `prepack` so
  package tarballs still include the parser artifacts.
- Keep a Go-specific generated parser copy under `bindings/go/parser.c` so Go
  module consumers can build the Go binding from Git tags without relying on
  npm packaging artifacts.
- Skip the native binding install build when generated parser artifacts are not
  present in a development checkout; explicit test and package flows generate
  the parser before building.

## [v0.7.0] - 2026-06-19

### Added

- Add parser support for legacy numeric line labels on comment-only and empty
  statement lines, including numbered top-level procedure declarations.
- Add parser support for colon-separated single-line `Do ... Loop`,
  `For ... Next`, `For Each ... Next`, and `With ... End With` blocks.
- Add regression coverage for single-line `If ... Then _` statements continued
  across physical lines.

## [v0.6.0] - 2026-06-18

### Changed

- Split property declarations into `property_get_declaration`,
  `property_let_declaration`, and `property_set_declaration` nodes.
- Split external declarations into `declare_sub_statement` and
  `declare_function_statement` nodes.
- Add structural declaration fields and modifier nodes for downstream symbol
  extraction, including visibility, static, `WithEvents`, `PtrSafe`,
  parameter passing mode, optional/default parameter metadata, type clauses,
  and initializers.
- Expose `Implements` targets through a stable `name` field.
- Update bundled highlight, fold, and tag queries for the new declaration node
  shapes.
- Configure the Tree-sitter corpus test npm script to run with `CC=gcc` and
  `CXX=g++`, avoiding Windows parser compilation failures from the wrong
  compiler selection.

## [v0.5.1] - 2026-06-15

### Added

- Add `comparison_operator` nodes and `left`, `operator`, and `right` fields
  to `comparison_expression` for easier downstream inspection.
- Add corpus coverage for implicit member call expressions such as `.Method()`,
  `.Factory.Create()`, and leading-bang member chains inside `With` blocks.

### Changed

- Highlight `?` Debug.Print shorthand statements as keywords and highlight
  comparison operators through the dedicated `comparison_operator` node.

## [v0.5.0] - 2026-06-15

### Added

- Add parser support for `? expr` Debug.Print shorthand statements, including
  comma- and semicolon-separated output arguments, comparison expressions,
  numbered statements, single-line `If` branches, and colon-separated
  statements.

### Changed

- Split visible member access trees into `qualified_member_expression` for
  explicit object access and `implicit_member_expression` for leading-dot or
  leading-bang access, with an `operator` field for `.` and `!`.
- Normalize VBA comparison operators `=`, `<>`, `<`, `<=`, `>`, `>=`, `Is`,
  and `Like` under `comparison_expression` while preserving assignment,
  `TypeOf ... Is ...`, and `Case Is ...` parsing behavior.

## [0.4.0] - 2026-06-14

### Added

- Add dedicated statement nodes for `RaiseEvent` and `Name oldPath As newPath`.
- Add dedicated statement nodes for classic file I/O statements: `Get #`,
  `Put #`, `Lock`, `Unlock`, `Seek`, and `Reset`.
- Add dedicated statement nodes for `Stop`, `Beep`, `Load`, and `Unload`.
- Add parser support for exponent and abbreviated decimal numeric literals such
  as `1E-3`, `.5`, and `1.`.
- Add identifier type-declaration character support for Currency (`@`) and
  LongLong (`^`).
- Add parser support for old default type declaration statements such as
  `DefInt` and `DefStr`.
- Add Go binding support under `bindings/go`.

### Fixed

- Fix an obvious malformed `Name` rename example in a real-world fixture so
  example parsing continues to validate valid VBA syntax.

## [0.3.0] - 2026-06-14

### Added

- Add parser support for Access bang member access such as `rst!Field` and
  mixed dot/bang member chains.
- Add parser support for `Debug.Print`-style semicolon-separated implicit call
  arguments.
- Add parser support for Access report `Line` drawing statements that use
  coordinate ranges such as `Me.Line (x, y)-(x2, y2)`.
- Add support for bare `Shared` file locks in `Open ... For ... Access ...
Shared As ...` statements.
- Add support for dotted `TypeOf ... Is ...` type names whose final segment is
  `Line`, such as `TypeOf ctl Is Access.Line`.
- Add Access-examples, better-access-charts, IguanaTex, and related
  newly bundled third-party parser fixtures with source and license
  attribution.

### Changed

- Expand real-world validation from 262 examples to 343 VBA files.
- Treat `Line` as a valid member/property name in expression chains while
  preserving existing `Line Input #` parsing.

### Fixed

- Fix parse errors in Access and Excel real-world fixtures involving `.Line`
  member chains, bang access, shared file locks, and report drawing syntax.
- Fix an obvious damaged whitespace byte in a non-error third-party fixture
  instead of making the grammar accept invalid source encoding artifacts.

## [0.2.0] - 2026-06-13

### Added

- Add parser support for `Event` declarations.
- Add conditional compilation inside `Type` and `Enum` declarations.
- Add conditional procedure headers whose parameter or return types differ
  between `#If`, `#ElseIf`, and `#Else` branches.
- Add computed `On expression GoTo` and `On expression GoSub` statements.
- Add standalone `End`, call-site `ByVal` arguments, and logical comparison
  chains used as values and call arguments.
- Add Currency (`@`) and LongLong (`^`) literal type characters, including
  type characters on hexadecimal literals.
- Add support for colon-separated `Enum` members, single-line empty
  `While ... Wend` loops, and line continuations with trailing whitespace.
- Add VBA-Dictionary, VBA-JSON, VBA-Web, and stdVBA as MIT-licensed real-world
  parser fixtures, with source and license attribution.

### Changed

- Expand real-world validation from 100 examples to 262 VBA files.
- Allow `Erase` targets to use indexed and member expressions.
- Allow comparison expressions in `#Const` values and parenthesized logical
  comparisons in value expressions.
- Fix obvious syntax mistakes in non-error third-party fixtures instead of
  making the grammar accept invalid VBA.

### Fixed

- Fix parsing of nested conditional compilation around procedure declarations.
- Fix parsing of long logical comparison chains in assignments and arguments.
- Fix parsing of large hexadecimal LongLong constants.

## [0.1.1] - 2026-06-13

### Added

- Add `pnpm bench` for coarse parser coverage and performance reporting across
  checked-in VBA examples.
- Add `pnpm query:examples` and include it in `pnpm check` to validate bundled
  highlight, fold, and tag queries against real-world examples.
- Add recovery corpus coverage and broken example fixtures for incomplete calls
  and malformed in-progress code.
- Add parsing support for `Implements`, `Erase`, and common VBA file I/O
  statements: `Open`, `Input #`, `Line Input #`, `Print #`, and `Close`.
- Add tag query captures for labels, numeric labels, and numbered statements.

### Changed

- Exclude intentionally broken examples from normal example parsing and
  benchmarking unless they are passed explicitly.
- Document the benchmark, query validation, and broken fixture workflows.

## [0.1.0] - 2026-06-13

Subsequent changes will be documented in CHANGELOG.md.

- I have implemented the MVP.
- I have published it as an npm package.
