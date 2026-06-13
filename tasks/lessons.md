## Call syntax whitespace

- VBA call forms such as `Foo (x)` and `Foo(x)` can be semantically different, but this grammar treats whitespace as `extras`; document that limitation whenever call syntax behavior is changed.
- When changing call, expression, or member access parsing, add neighboring corpus tests for implicit calls, `Call` calls, member calls, call expressions, and assignable indexed/member expressions before considering the change stable.

## Real-world example coverage

- `parse:examples` must walk real-world example trees, not only top-level `examples/*.bas|*.cls|*.frm`; otherwise CI can miss syntax regressions in practical VBA assets.
- Keep generated or backup-heavy directories such as `.xlflow` and `build` out of example parsing to avoid noisy, duplicate coverage.
- Do not treat `tree-sitter parse --quiet` exit status or `--json-summary` `successful: true` as proof that a tree has no recovery nodes; inspect the CST output for explicit `ERROR` and `MISSING` nodes.

## Overlapping numeric tokens

- Do not give a dedicated line-number token higher lexical precedence than `number_literal`; the contextual lexer may then reinterpret numeric call arguments such as `Foo 1` as line numbers.
- Reuse `number_literal` and alias it at line-number grammar sites when a distinct CST node is required.
- Numbered block delimiters compete with numbered body statements and numeric labels. Use an explicit `line_number_prefix` plus dynamic precedence, and verify the generated CST attaches the number to `Else`, `Case`, `Next`, `Loop`, and `End` delimiters rather than merely checking for the absence of `ERROR` nodes.

## String literals

- VBA string tokens must exclude `\r` and `\n`; otherwise an unterminated quote can consume later source lines and hide malformed input.

## Third-party fixtures

- When a third-party example contains an obvious source typo or incomplete construct and is not intentionally an error fixture, fix the vendored example instead of weakening the grammar to accept invalid VBA.
- Before adding permissive grammar for a real-world parse failure, check the surrounding source for misspelled keywords, mismatched procedure terminators, invalid return clauses, and missing block delimiters.
