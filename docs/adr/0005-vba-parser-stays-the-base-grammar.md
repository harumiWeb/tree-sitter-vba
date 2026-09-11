# ADR 0005: The vba Parser Stays the Base Grammar

## Status

Accepted

## Context

`common/define-grammar.js` generates two parsers. While the VB6 dialect was
built against a corpus of 1,436 real files, the shared core picked up
constructs that VB6 needed and VBA also accepts: `Let`, `LSet`/`RSet`,
`GoSub`/`Return`, `On Local Error`, `Global`, `Dim WithEvents`,
`ReDim x(n) As T`, octal literals, `AddressOf Module.Procedure`, `Name.Member`
receivers, chained comparisons, `#If` around `Case` clauses, and the Single `!`
suffix in expression positions. None was gated, so all of them reached the
`vba` parser.

Three things followed.

The `vba` parse table grew from 15,236 to 21,921 states and the browser
artifact from 7.47 MB to 11.28 MB. Chromium refuses to instantiate a module
larger than 8 MiB synchronously on the main thread, and `web-tree-sitter`'s
`Language.load(url)` takes that path, so the artifact stopped loading in a
standard browser. The single largest cost was `#If` inside `Select Case`, at
3,247 states and 11.9 MB of `parser.c`; the Single suffix in expression
positions cost about 1,200 states; the five added statements cost 3.3 MB of
`parser.c` because every statement list carries them. The base already used
89% of the 8 MiB budget before any of this, so there was never room for more
than a small delta.

Two of the additions changed trees the `vba` parser had produced for years. A
per-item dynamic precedence on omitted-argument lists rewarded the reading that
splits `CallByName a, b, c, d` into an expression statement and a call to `a`;
131 of the 481 example files changed, every one still free of `ERROR` nodes.
Chained comparisons made `arr(i) = x > 0` readable as a call to `arr` with the
argument `(i) = x > 0`, and that reading won the tie against the assignment.

The acceptance tests could not see either. `pnpm parse:examples` and the VB6
acceptance corpus count `ERROR` and `MISSING` nodes; a wrong callee has neither.

## Decision

The `vba` grammar is the base grammar plus two documented changes: the
`bang_identifier` node where a declaration names something, and
omitted-argument lists that stay under one callee. Everything else the VB6
corpus needed is behind `isVB6`, including constructs VBA also accepts.

Un-gating one of them for `vba` is a one-line change and is welcome, but it is
its own change with its own measurement: the parse-table delta from
`tree-sitter generate`, the browser artifact size against the gate, and the
tree diff over the 481 examples from `scripts/compare-cst.mjs` with every hunk
explained. The `vb6` parser has no consumers to keep stable and takes the
correct reading where the two conflict, so `arr(i) = x` is an assignment there.

Structural regressions get structural tests. A change to calls, arguments or
precedence adds corpus cases that pin the callee and the argument list, and the
pull request carries the `compare-cst.mjs` result.

## Consequences

- `vba` trees for the 481 examples differ from the base in six files, all
  omitted-argument or comma-led continuation lists the base had split at a
  comma. No example uses the Single suffix, so `bang_identifier` changes none of
  them.
- The `vba` table is 15,317 states and the browser artifact 7.57 MB. The base
  is 15,236 states and 7.47 MB on the same toolchain, so the remaining headroom
  under the 7.5 MiB gate is about 290 KB and any `vba` addition has to be
  measured.
- `vb6` keeps every construct it had; its `grammar.json` is byte-identical
  before and after the gating, apart from the assignment precedence.
- `scripts/test-shared-corpus.mjs` skips two more cases: the VB6 assignment
  precedence reshapes error recovery on an unterminated string, isolating the
  damage to the broken line where the base folds the next line into it. Both
  trees contain `ERROR`.
- The alternative of loading the artifact asynchronously exists in the pinned
  runtime: `Language.load` accepts a `Uint8Array` and then instantiates through
  `WebAssembly.instantiate`, which has no size limit. The URL form compiles
  through `compileStreaming` and then instantiates the resulting module
  synchronously inside the runtime's dynamic-library loader, which this
  repository does not control. The browser consumer and the documented loading
  contract use the URL form, so size stays the constraint until they change.
