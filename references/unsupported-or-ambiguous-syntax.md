# Unsupported or Ambiguous VBA Syntax

This file records VBA syntax areas that are ambiguous, difficult, or intentionally unsupported.

Each entry should include:

- syntax example
- current status
- expected parse strategy
- corpus test file, if available

## Call syntax ambiguity

VBA procedure calls are ambiguous and should be tested carefully.

Examples:

```vb
Foo 1, 2
Call Foo(1, 2)
x = Foo(1, 2)
Foo (x)
```

Current status:

- Not fully supported in the initial grammar.

Expected strategy:

- Distinguish statement calls from expression calls where practical.
- Avoid breaking one call form when adding another.
- Add focused corpus tests in `test/corpus/calls.txt`.

## Single-line If

Example:

```vb
If x Then y = 1 Else y = 2
```

Current status:

- Not supported in the initial grammar.

Expected strategy:

- Treat this separately from block `If ... End If`.
- Add tests for both forms before implementation.

## Colon-separated statements

Example:

```vb
Dim x As Long: x = 1
```

Current status:

- Not supported in the initial grammar.

Expected strategy:

- Parse `:` as a statement separator.
- Ensure it works both at module level where valid and inside procedure bodies.

## Line continuation

Example:

```vb
Debug.Print _
    "hello"
```

Current status:

- Not supported in the initial grammar.

Expected strategy:

- Add line continuation support before complex statement parsing.
- Be careful with comments after `_`.

## Member access

Examples:

```vb
ws.Range("A1").Value = 1
.Range("A1").Value = 1
```

Current status:

- Not supported in the initial grammar.

Expected strategy:

- Support normal member access and leading-dot member access used inside `With` blocks.
