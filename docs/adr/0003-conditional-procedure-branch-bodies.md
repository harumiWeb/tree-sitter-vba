# ADR 0003: Preserve Conditional Procedure Branch Bodies

## Status

Accepted

## Context

VBA conditional compilation can select more than a procedure signature. A
branch may contain the selected procedure header followed by declarations or
statements that are valid only for that signature, while the remainder of the
procedure body and its terminator are shared after `#End If`.

For example, a VBA7 branch can declare a `LongPtr` return type and local
variable while the fallback branch uses `Long`. Treating the conditional region
as headers only produces an error at the first branch-local statement and can
cause the rest of a large module to be recovered as one `ERROR` node.

Flattening these statements into the shared procedure `body` would lose their
conditional ownership. Allowing arbitrary incomplete preprocessor fragments in
every block would also weaken the grammar and interfere with ordinary complete
control-flow statements.

## Decision

Conditional sub, function, and property header branches may contain an optional
`conditional_branch_body` after their selected header.

The containing conditional declaration exposes the first branch through the
`consequence_body` field and later `#ElseIf` or `#Else` branches through
`alternative_body`. The existing `body` field continues to represent only the
shared procedure body after `#End If`.

`conditional_branch_body` accepts the same syntactic statements as a procedure
block but must begin with a statement. This keeps directive boundaries
unambiguous and avoids consuming blank separators that belong to the
surrounding conditional-header structure.

## Consequences

Downstream tools can distinguish branch-local declarations and statements from
the shared procedure body without preprocessing the source or inferring
ownership from byte ranges.

This adds a public CST node and two optional fields to conditional procedure
declarations. Consumers that enumerate every possible child or field must
account for `conditional_branch_body`, `consequence_body`, and
`alternative_body`.

The grammar remains syntactic. It does not evaluate compilation constants,
choose an active branch, or verify that branch-local statements are compatible
with the selected signature.

Conditional compilation that splits an `If` statement across directive
boundaries remains a separate problem and is not generalized by this decision.
