# ADR 0004: Evolve the CST Against the xlflow Lint Contract

## Status

Accepted

## Context

This grammar is developed as the VBA parser used by `harumiWeb/xlflow`.
Preserving raw CST compatibility for unknown third-party consumers prevents
the grammar from representing valid VBA that crosses ordinary syntactic
boundaries, especially conditional compilation that selects alternative
multiline `If` headers.

VBA statement calls also use whitespace semantically. Because whitespace is a
Tree-sitter extra in this grammar, `QuickSortKeys .arrKeys, ...` is ambiguous
with qualified member access after tokenization. Preserving the previous CST at
all costs leaves valid real-world source in recovery.

The compatibility requirement that matters is that an xlflow upgrade must not
remove or silently change its established lint rules.

## Decision

Raw CST compatibility is not a release constraint. Breaking CST changes are
allowed when xlflow can migrate in the same development cycle.

The stable cross-repository contract is xlflow lint behavior:

- existing rule IDs remain available;
- severity and push-blocking behavior remain stable unless intentionally
  changed;
- diagnostics retain useful source locations and metadata;
- parser recovery rule VB014 continues to detect unclosed or mismatched blocks.

Multiline `If` syntax is represented as a flat statement sequence:

- `if_statement` represents the opening header;
- `elseif_fragment` represents an `ElseIf` header;
- `else_fragment` represents `Else`;
- `end_if_fragment` represents `End If`.

This representation permits conditional compilation branches to contain
alternative headers while sharing a body and closer after `#End If`.

Whitespace-sensitive call shapes covered by the real-world corpus are accepted
as leaf `call_statement` nodes when the tokenized grammar cannot reliably
expose `callee` and `arguments` fields. Indexed-member `ReDim` targets may
similarly be accepted as leaf `redim_statement` nodes. Consumers must tolerate
these fieldless nodes and may inspect their source ranges when they need the
ambiguous details; ordinary forms retain their structured CST.

xlflow reconstructs block-sensitive behavior where necessary. In particular,
its formatter pairs flat `If` fragments for indentation, and VB014 uses its
lexical block scanner even when the accepting CST has no recovery node.

## Consequences

Existing CST consumers must migrate from `elseif_clause` and `else_clause` to
the flat fragment nodes. Multiline `if_statement` no longer owns consequence,
alternative, or closing nodes.

Tree-sitter folding cannot infer a multiline `If` range from a single nested
CST node, so the generic query no longer advertises `If` folding. xlflow lint
and formatting remain supported.

Parser changes that affect xlflow must be tested in both repositories. The
tree-sitter-vba corpus and imported examples prove syntactic acceptance;
xlflow's full Go test suite is the compatibility gate for lint behavior and
shared parser consumers.

ADR 0003 remains applicable to conditionally selected procedure headers and
their branch-local bodies. This decision resolves the separate
directive-split `If` problem left open there.
