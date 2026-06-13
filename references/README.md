# References

This directory contains reference notes for implementing `tree-sitter-vba`.

The files in this directory should not duplicate Microsoft Learn pages verbatim.
Instead, they should link to official documentation and summarize the grammar-relevant points needed by maintainers and coding agents.

## Primary sources

- Microsoft Learn: Visual Basic for Applications language reference
- Microsoft Learn: Visual Basic language reference
- Microsoft Learn: 64-bit Visual Basic for Applications overview
- Microsoft Learn: VBA statement/function/operator reference pages

## Usage rules for agents

When implementing grammar support:

1. Prefer official Microsoft Learn documentation when available.
2. Add or update corpus tests for every grammar change.
3. Do not copy large sections of official documentation into this repository.
4. Record grammar-relevant findings as short implementation notes.
5. If the official documentation is incomplete or ambiguous, add real VBA corpus examples.
