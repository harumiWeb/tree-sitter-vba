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

Colon-separated VBA can nest inline control statements, and one `Next` can
name multiple loop counters. The former single-line statement rule could not
retain every branch statement beneath a single-line `If`; the former
`next_variable` field could not represent the latter syntax. The regression
coverage in `test/corpus/regressions/community-inline-multi-statement.txt`
defines the required CST ownership.

VBA Print-family statements use `;` and `,` as output-position controls. They
can occur between output expressions or after the final expression, so they
are not ordinary procedure-call argument separators. The previous expression
sequence required an expression after every separator and consequently put
valid trailing controls such as `Debug.Print "foo";` into parser recovery.
`Print #` and `Write #` share this output-list syntax, as do unparenthesized
`Print` methods and the `?` shorthand.

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

`For` and `For Each` terminators expose their counters through
`next_variables`, whose value is a `next_variable_list`. This replaces the
singular `next_variable` field so that `Next i` and `Next j, i` have one
consistent representation. When one `Next` closes a nested inline loop chain,
the enclosing loop body uses `shared_next_for_body` to preserve the nesting
while the terminating nested loop owns the syntactic counter list.

Single-line `If` branches retain their direct statement child for one statement
and use `inline_statement_sequence` when a colon-separated branch has multiple
statements. This keeps all branch statements structurally owned by the `If`.

Print-family output lists use one shared `output_list` node. Each output
expression is exposed through its `value` field, and each output-position
control is exposed through its `position` field containing a named
`char_position` node for `;` or `,`. A `char_position` may separate two values
or trail the final value. The output list is optional on the `output` field of
`debug_print_statement`, `print_statement`, and `write_statement`, preserving
empty forms such as `Print #1,` and `Write #1,`.

Unparenthesized `Print` methods, including `Debug.Print`, `object.Print`,
leading-dot `.Print`, and unqualified `Print`, remain `call_statement` nodes
with the existing `callee` field. Their `arguments` field may contain an
`output_list`; ordinary calls continue to use their existing argument-list
forms. `Write #` is represented by a dedicated `write_statement` node.

## Consequences

Downstream tools can use field-based traversal for common LSP operations such as
hover, references, completion, rename ranges, call extraction, and symbol
indexing.

This intentionally breaks consumers that depended on the previous
`object`/`property` member fields, positional call argument children, or
procedure declarations without named terminator nodes.

This also intentionally breaks consumers of `for_statement` and
`for_each_statement` that read `next_variable`; they must read
`next_variables` and traverse its `next_variable_list` children instead.

Consumers that inspect Print-family calls must handle the `output_list`
argument shape and read its named `value` and `position` fields instead of
assuming that `;` and `,` always precede another expression. The punctuation
remains scoped to Print-family output lists; it is not accepted as a general
VBA statement separator, and ordinary procedure calls retain their existing
argument contracts.

The grammar remains syntactic only. Type inference, semantic validation, object
model knowledge, loop-counter matching, and formatter policy remain downstream
responsibilities.
