# Changelog

All notable changes to tree-sitter-vba will be documented in this file.

## Unreleased

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
