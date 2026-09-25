# Issue #68: colon-separated For/For Each body ending in single-line If

- [x] Reproduce all four reduced cases and identify the ownership conflict.
- [x] Add VBA corpus coverage for `For` and `For Each`, including the reported Japanese procedure.
- [x] Preserve `body: block` while admitting a colon-prefixed first-line sequence.
- [x] Regenerate and test VBA, VB6, and the shared corpus; run the stress suite through a short Windows drive path.
- [x] Synchronize `bindings/go/parser.c` and pass the generated Go parser check.
- [x] Parse all 481 examples and compare their CSTs with `main` (0 differences).
- [x] Review generated parser impact: VBA states 15,318 -> 15,899; VB6 states 22,387 -> 22,569.
