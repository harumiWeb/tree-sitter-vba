# Changelog

All notable changes to tree-sitter-vba will be documented in this file.

## Unreleased

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
