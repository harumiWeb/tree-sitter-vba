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

## Whitespace-sensitive call syntax

VBA has whitespace-sensitive call syntax, for example:

```vb
Foo (x)
Foo(x)
```

Current status:

- The grammar does not currently distinguish these forms syntactically.

Expected strategy:

- Tree-sitter grammars normally treat whitespace as `extras`, so whitespace is not represented in the parse tree.
- Prioritize stable editor parsing over exact VBE semantic interpretation.
- Downstream semantic layers may need access to the original source text if they need to distinguish these cases.

## Comparison expressions outside condition contexts

Equality comparison is currently supported only in selected condition contexts.

Example:

```vb
Debug.Print a = b
```

Current status:

- General expression-level equality comparison is not fully supported yet.
- Statement-level assignment remains prioritized so forms such as `a = b` parse as `assignment_statement`.

Expected strategy:

- Broaden equality comparison only after adding neighboring corpus tests that prove assignment parsing does not regress.
- Keep semantic validity out of the grammar; downstream layers can decide whether a parsed expression is meaningful VBA.

## Context-sensitive statement validity

Some VBA statements are only valid in specific semantic contexts.

Examples:

```vb
Exit For
Exit Do
Exit Function
```

Current status:

- The grammar parses these as `exit_statement` wherever statements are accepted.
- It does not validate whether `Exit For` appears inside a `For` loop or whether `Exit Function` appears inside a function procedure.

Expected strategy:

- Keep context validation out of the grammar.
- Downstream semantic layers or compiler-facing diagnostics should report invalid statement context.

## Semantic validation for Declare and conditional compilation

Declare statements and conditional compilation directives include platform- and project-specific semantics.

Examples:

```vb
Private Declare PtrSafe Function GetTickCount Lib "kernel32" () As LongPtr
#If VBA7 Then
    ' ...
#End If
```

Current status:

- The grammar parses syntax for `Declare`, `PtrSafe`, `Lib`, `Alias`, `#Const`, and `#If` blocks.
- It does not validate whether `PtrSafe` is required, whether `LongPtr` is used correctly, whether a library exists, or whether a conditional compilation symbol is defined.

Expected strategy:

- Keep these checks in downstream semantic tooling.
- Corpus tests should focus on parse stability for exported VBA syntax.

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
