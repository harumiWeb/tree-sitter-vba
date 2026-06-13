## Call syntax whitespace

- VBA call forms such as `Foo (x)` and `Foo(x)` can be semantically different, but this grammar treats whitespace as `extras`; document that limitation whenever call syntax behavior is changed.
- When changing call, expression, or member access parsing, add neighboring corpus tests for implicit calls, `Call` calls, member calls, call expressions, and assignable indexed/member expressions before considering the change stable.
