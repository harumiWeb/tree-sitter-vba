## Clean parses hide structural regressions

- `ERROR = 0` and `MISSING = 0` say nothing about which node is the callee. A bare call split into an expression statement plus a call to its first argument parses clean; 131 of 481 example files regressed that way and every acceptance check passed. Before changing calls, arguments or precedence in `common/define-grammar.js`, run `scripts/compare-cst.mjs` against a `main` worktree and account for every hunk.
- Never put `prec.dynamic` on a repeated item. GLR sums it once per repetition, so the reading that consumes more repetitions wins whatever it does to the rest of the tree; a bonus meant to keep `Foo a, , 10` in one list handed every three-argument call to the split reading.
- A construct that is valid in both dialects still belongs behind `isVB6` if the base `vba` grammar never accepted it. Widening `vba` changes trees downstream consumers already handle and costs parse states, and the browser artifact sits at 89% of Chromium's 8 MiB synchronous-instantiation limit before any addition. Measure the state delta and the artifact size before un-gating anything.
- When a corpus test expectation looks wrong, check the test before the grammar: the split call was baked into a `vb6` expectation and `tree-sitter test` was green.

## Call syntax whitespace

- VBA call forms such as `Foo (x)` and `Foo(x)` can be semantically different, but this grammar treats whitespace as `extras`; document that limitation whenever call syntax behavior is changed.
- When changing call, expression, or member access parsing, add neighboring corpus tests for implicit calls, `Call` calls, member calls, call expressions, and assignable indexed/member expressions before considering the change stable.
- When xlflow can migrate with the parser, preserve lint behavior rather than raw CST shape. A field-optional syntax node plus an xlflow source-range fallback is preferable to leaving valid VBA in parser recovery solely for third-party CST compatibility.

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

## Browser parser UI

- Treat `web-tree-sitter` parse results as nullable and release every returned `Tree` in a `finally` block, so a rendering failure cannot retain Wasm memory across debounced parses.
- Keep a shared UTF-8 byte-offset to UTF-16 code-unit index for each browser parse, and cover offset zero and leading-newline positions in tests.

## Third-party fixtures

- When a third-party example contains an obvious source typo or incomplete construct and is not intentionally an error fixture, fix the vendored example instead of weakening the grammar to accept invalid VBA.
- Before adding permissive grammar for a real-world parse failure, check the surrounding source for misspelled keywords, mismatched procedure terminators, invalid return clauses, and missing block delimiters.
