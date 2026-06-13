# Microsoft VBA Language Reference

This document lists official Microsoft Learn references that are useful when implementing `tree-sitter-vba`.

Do not copy Microsoft Learn pages into this repository. Link to the official pages and record only short grammar-focused implementation notes.

## Main VBA language reference

Official page:

- https://learn.microsoft.com/en-us/office/vba/api/overview/language-reference

Microsoft describes this as the Office VBA language reference, containing conceptual overviews, programming tasks, samples, and reference information for VBA development. It is the primary entry point for VBA language documentation. :contentReference[oaicite:0]{index=0}

Use this as the starting point for:

- language concepts
- programming tasks
- reference pages
- Microsoft Forms topics
- statements, functions, operators, and objects

## Visual Basic language reference

Official page:

- https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/visual-basic-language-reference

Microsoft describes this section as documentation for the Visual Basic language, including methods, properties, statements, functions, operators, objects, data types, directives, events, keywords, and Microsoft Forms. :contentReference[oaicite:1]{index=1}

Use this for grammar coverage of:

- statements
- functions
- operators
- data types
- directives
- keywords
- events
- Microsoft Forms
- objects

## Keywords

Official page:

- https://learn.microsoft.com/en-us/office/vba/language/reference/keywords-visual-basic-for-applications

Use this to maintain the keyword list for:

- `queries/highlights.scm`
- keyword token recognition
- reserved word handling

Grammar note:

The grammar should be case-insensitive for VBA keywords.

## Function statement

Official page:

- https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/function-statement

Use this when implementing:

- `Function ... End Function`
- argument lists
- `ByVal`
- `ByRef`
- `Optional`
- `ParamArray`
- return type clauses

Microsoft notes that `ByRef` is the default in VBA. :contentReference[oaicite:2]{index=2}

Grammar-relevant examples:

```vb
Private Function Add(ByVal a As Long, ByVal b As Long) As Long
End Function
```

```vb
Public Function Foo(Optional ByVal value As Variant) As Variant
End Function
```

## 64-bit VBA overview

Official page:

- [https://learn.microsoft.com/en-us/office/vba/language/concepts/getting-started/64-bit-visual-basic-for-applications-overview](https://learn.microsoft.com/en-us/office/vba/language/concepts/getting-started/64-bit-visual-basic-for-applications-overview)

Use this when implementing:

- `Declare PtrSafe`
- `LongPtr`
- `LongLong`
- conditional compilation patterns for 32-bit and 64-bit Office

Microsoft documents `LongPtr`, `LongLong`, and `PtrSafe` as important additions for 64-bit VBA. ([Microsoft Learn][1])

Grammar-relevant examples:

```vb
Private Declare PtrSafe Function GetTickCount Lib "kernel32" () As Long
```

```vb
Private Declare PtrSafe Function FindWindow Lib "user32" Alias "FindWindowA" ( _
    ByVal lpClassName As String, _
    ByVal lpWindowName As String _
) As LongPtr
```

```vb
#If VBA7 Then
    Private Declare PtrSafe Function Foo Lib "kernel32" () As LongPtr
#Else
    Private Declare Function Foo Lib "kernel32" () As Long
#End If
```

## PtrSafe keyword

Official page:

- [https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/ptrsafe-keyword](https://learn.microsoft.com/en-us/office/vba/language/reference/user-interface-help/ptrsafe-keyword)

Use this for the `Declare` statement grammar.

Grammar note:

`PtrSafe` appears inside a `Declare` statement. The grammar should parse it syntactically but should not validate whether pointer-sized types were correctly updated. That is semantic validation and belongs outside `tree-sitter-vba`.

## Office VBA overview

Official page:

- [https://learn.microsoft.com/en-us/office/vba/api/overview/](https://learn.microsoft.com/en-us/office/vba/api/overview/)

This is a broader Office VBA reference entry point. Microsoft describes Office VBA as an event-driven programming language used to extend Office applications. ([Microsoft Learn][2])

Use this for general context only. Prefer the language reference pages for grammar work.

## Forms / UserForms

The main VBA language reference includes Microsoft Forms conceptual topics. Microsoft describes these as topics covering UserForms, controls, and how to program them with Visual Basic. ([Microsoft Learn][3])

Use this area when implementing support for exported `.frm` files and event procedure patterns.

Grammar-relevant examples:

```vb
Private Sub CommandButton1_Click()
End Sub
```

```vb
Private Sub UserForm_Initialize()
End Sub
```

## Implementation policy

When adding grammar support based on official references:

1. Add a focused corpus test first.
2. Implement the smallest grammar change needed.
3. Keep syntax parsing separate from semantic validation.
4. Avoid encoding Excel object model knowledge in the grammar.
5. Record unsupported or ambiguous syntax in `unsupported-or-ambiguous-syntax.md`.
