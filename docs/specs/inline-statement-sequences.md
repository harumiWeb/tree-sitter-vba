# Inline Statement Sequences

## Purpose

The grammar accepts VBA's colon-separated statements in procedure bodies and
models their control-flow ownership. This includes nested single-line loop
forms, multi-counter `Next` terminators, and multi-statement single-line `If`
branches.

## Supported forms

- `For`, `For Each`, `Do`, `While/Wend`, `With`, and single-line `If` can occur
  inside a colon-separated inline body.
- Procedure statements already valid inline, including declarations, calls,
  assignments, and runtime statements, remain valid in those bodies.
- `Next i` and `Next j, i` are represented by
  `next_variables: next_variable_list`.
- When one `Next` closes a nested loop chain, `shared_next_for_body` keeps the
  outer loop structurally connected to the terminated inner loop.
- A single-line `If` emits `inline_statement_sequence` for each branch that
  contains two or more colon-separated statements.

## Exclusions

Block `If`, `Select Case`, conditional-compilation directives, labels, and line
numbers are not admitted as inline statements by this feature. Their placement
rules remain governed by their existing newline-sensitive grammar rules.

## Non-goals

The grammar does not validate that `Next` counters correspond to enclosing
loops, are in the correct order, or are otherwise semantically valid. That
validation belongs to VBE-compatible tooling or downstream analysis.
