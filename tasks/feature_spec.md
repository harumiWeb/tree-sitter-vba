# Task: Bootstrap `tree-sitter-vba`

Create the initial implementation of a Tree-sitter grammar for VBA.

## Goal

Set up a working `tree-sitter-vba` repository that can parse simple exported VBA source files and provide initial query files for highlighting and folding.

This is an MVP. Do not attempt full VBA compatibility yet.

## Scope

Create or update the following files:

```text
package.json
grammar.js
README.md
queries/highlights.scm
queries/folds.scm
queries/tags.scm
test/corpus/attributes.txt
test/corpus/options.txt
test/corpus/procedures.txt
test/corpus/declarations.txt
test/corpus/control_flow.txt
examples/basic.bas
examples/class.cls
examples/userform.frm
```

## Required Grammar Support

The initial grammar should support:

- Comments using `'`
- `Rem` comments
- String literals
- Integer and floating-point number literals
- Identifiers
- Attribute lines, for example:

```vb
Attribute VB_Name = "Module1"
Attribute VB_GlobalNameSpace = False
Attribute VB_PredeclaredId = True
```

- Option statements:

```vb
Option Explicit
Option Private Module
Option Compare Text
Option Base 1
```

- Basic procedure declarations:

```vb
Public Sub Main()
End Sub

Private Function Add(ByVal a As Long, ByVal b As Long) As Long
End Function

Public Property Get Name() As String
End Property

Public Property Let Name(ByVal value As String)
End Property

Public Property Set Item(ByVal value As Object)
End Property
```

- Basic declarations:

```vb
Dim x As Long
Private count As Long
Public Const MaxCount As Long = 10
Static cache As Object
```

- Basic control flow:

```vb
If x Then
    Debug.Print x
End If

Select Case x
    Case 1
        Debug.Print "one"
    Case Else
        Debug.Print "other"
End Select

For i = 1 To 10
    Debug.Print i
Next i

For Each item In items
    Debug.Print item
Next item

Do While x < 10
    x = x + 1
Loop

With ws
    .Range("A1").Value = 1
End With
```

## Initial Query Support

Add basic query support for:

- Keywords
- Comments
- Strings
- Numbers
- Procedure names
- Type names
- Constants
- Variables
- Folding ranges for procedures and block statements
- Tags for Sub / Function / Property declarations

## Constraints

Do not implement:

- Type checking
- Excel Object Model knowledge
- COM references
- Formatter
- LSP server
- xlflow integration
- Full expression precedence
- Full call resolution

Expression parsing can be simple at this stage. It is acceptable to use broad expression rules as long as the grammar remains stable and the corpus tests pass.

## Required Commands

After implementation, run:

```bash
npm install
npm test
npx tree-sitter parse examples/basic.bas
npx tree-sitter parse examples/class.cls
npx tree-sitter parse examples/userform.frm
```

## Completion Criteria

The task is complete when:

- `npm test` passes
- Example files parse without fatal errors
- Corpus tests cover the supported syntax
- README documents the current support level and known limitations
- Query files exist and cover the initial grammar nodes
