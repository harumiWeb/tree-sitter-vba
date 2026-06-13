## Call syntax whitespace

- VBA call forms such as `Foo (x)` and `Foo(x)` can be semantically different, but this grammar treats whitespace as `extras`; document that limitation whenever call syntax behavior is changed.
- When changing call, expression, or member access parsing, add neighboring corpus tests for implicit calls, `Call` calls, member calls, call expressions, and assignable indexed/member expressions before considering the change stable.

## Real-world example coverage

- `parse:examples` must walk real-world example trees, not only top-level `examples/*.bas|*.cls|*.frm`; otherwise CI can miss syntax regressions in practical VBA assets.
- Keep generated or backup-heavy directories such as `.xlflow` and `build` out of example parsing to avoid noisy, duplicate coverage.
- Do not treat `tree-sitter parse --quiet` exit status or `--json-summary` `successful: true` as proof that a tree has no recovery nodes; inspect the CST output for explicit `ERROR` and `MISSING` nodes.
