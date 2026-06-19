# ADR 0001: Stable AST Field Contract For VBA Tooling

## Status

Accepted

## Context

`tree-sitter-vba` is used by downstream analysis, formatting, symbol, call, and
LSP tooling. Those consumers need to identify declaration names, procedure
bodies, member chains, calls, arguments, and exact identifier ranges without
positional child traversal or source-text fallback.

The project is still pre-`1.0.0`, so a breaking tree-shape cleanup is preferable
to preserving ambiguous field names that would become harder to change later.

## Decision

Declaration nodes expose stable syntactic fields where the syntax provides
them: `visibility`, `modifiers`, `name`, `parameters`, `type`, `initializer`,
`body`, and `end`. Procedure declarations expose named terminator nodes through
the `end` field.

Member access uses `receiver` and `member` fields. Explicit access is represented
by `qualified_member_expression`; leading-dot and leading-bang access is
represented by `implicit_member_expression` without a `receiver`.

Calls use `function` and `arguments` fields. Parenthesized call expressions use
`argument_list`; statement-style calls with whitespace-separated arguments use
`unparenthesized_argument_list`.

## Consequences

Downstream tools can use field-based traversal for common LSP operations such as
hover, references, completion, rename ranges, call extraction, and symbol
indexing.

This intentionally breaks consumers that depended on the previous
`object`/`property` member fields, positional call argument children, or
procedure declarations without named terminator nodes.

The grammar remains syntactic only. Type inference, semantic validation, object
model knowledge, and formatter policy remain downstream responsibilities.
