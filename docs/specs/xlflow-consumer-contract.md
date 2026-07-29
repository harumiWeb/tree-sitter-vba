# xlflow Consumer Contract

## Compatibility boundary

`harumiWeb/xlflow` is the supported consumer of this grammar. Raw CST shape is
allowed to change, including node names, fields, and hierarchy, when the
corresponding xlflow migration is available.

The required compatibility gate is preservation of xlflow lint behavior:
existing rule IDs, severities, source locations, structured metadata, and
push-blocking classifications must remain usable.

## CST v2 control-flow shape

Multiline `If` constructs are a flat sequence:

- `if_statement`
- zero or more `elseif_fragment`
- optional `else_fragment`
- `end_if_fragment`

The nodes may be separated by ordinary statements or conditional compilation
regions. Consumers must not expect the opening node to own branch bodies.

## Ambiguous statement calls

A `call_statement` normally exposes `callee` and optional `arguments` fields.
For whitespace-sensitive implicit-member calls and calls combining omitted
positional arguments with named arguments, it may instead be a leaf node.
Consumers must treat those fields as optional and use the node's source range
when source-level disambiguation is required.

## Ambiguous indexed-member ReDim

An indexed-member target such as `ReDim items(i).buffer(0 To size - 1)` may be
represented as a leaf `redim_statement`. Consumers must use the node's source
range if they need to inspect the target or bounds for this ambiguous form.
Ordinary `ReDim` statements retain their structured `redim_declarator` CST.

## Verification

Before a CST-breaking release:

1. Run `pnpm check` in tree-sitter-vba.
2. Confirm every imported example parses without `ERROR` or `MISSING`.
3. Test xlflow with a local replacement of its tree-sitter-vba dependency.
4. Run the complete xlflow Go test suite through `scripts/dev/go.ps1`.
5. Do not release if an established lint rule becomes unavailable or changes
   behavior unintentionally.
