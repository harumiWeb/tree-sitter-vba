# Changelog

All notable changes to tree-sitter-vba will be documented in this file.

## Unreleased

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
