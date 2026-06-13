# Task1: Bootstrap `tree-sitter-vba`

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

---

# Task2: Improve VBA expression and call parsing

## Goal

Improve parsing for common VBA expressions, assignment statements, call statements, and member access.

## Scope

Update:

```text
grammar.js
test/corpus/expressions.txt
test/corpus/calls.txt
test/corpus/member_access.txt
queries/highlights.scm
```

## Required Syntax

Support these patterns:

```vb
x = 1 + 2
x = a * b + c
x = Foo(1, 2)
Foo 1, 2
Call Foo(1, 2)
Foo (x)
Debug.Print x
Set ws = ThisWorkbook.Worksheets("Sheet1")
ws.Range("A1").Value = 123
.Range("A1").Value = 123
arr(i) = value
```

## Important Ambiguities

Be especially careful with:

```vb
Foo 1, 2
Call Foo(1, 2)
x = Foo(1, 2)
Foo (x)
```

Do not fix one form by breaking the others.

## Completion Criteria

- `npm test` passes
- All listed call forms have corpus coverage
- Existing procedure and declaration parsing still works
- Member access is represented with stable node names

---

# Task3: Add practical UserForm `.frm` parsing support

## Goal

Improve support for exported VBA UserForm files.

## Background

VBE-exported `.frm` files contain both form metadata and embedded VBA code. The grammar should tolerate common `.frm` structures well enough for highlighting, folding, and symbol extraction.

## Scope

Update:

```text
grammar.js
test/corpus/forms.txt
examples/userform.frm
queries/highlights.scm
queries/folds.scm
queries/tags.scm
```

## Required Support

Support or tolerate common `.frm` constructs such as:

```vb
VERSION 5.00
Begin VB.Form UserForm1
   Caption         =   "User Form"
   ClientHeight    =   3000
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   4560
   StartUpPosition =   1
   Begin VB.CommandButton btnOK
      Caption = "OK"
      Height = 375
      Left = 120
      Top = 120
      Width = 1215
   End
End
Attribute VB_Name = "UserForm1"
Attribute VB_PredeclaredId = True
Option Explicit

Private Sub btnOK_Click()
    Unload Me
End Sub
```

## Design Notes

It is acceptable to parse form designer metadata as broad `form_property`, `form_object`, or `form_metadata` nodes.

Do not attempt to fully model every VB6/VBA form property.

The primary requirement is that exported `.frm` files do not break parsing and embedded VBA procedures are still recognized.

## Completion Criteria

- `.frm` corpus tests pass
- `examples/userform.frm` parses successfully
- Embedded event procedures are recognized by tags/folds
- Form metadata is tolerated without excessive ERROR nodes

---

# Task4: Add conditional compilation and Declare statement support

## Goal

Support common VBA conditional compilation and Windows API declarations.

## Scope

Update:

```text
grammar.js
test/corpus/preprocessor.txt
test/corpus/declare.txt
queries/highlights.scm
```

## Required Syntax

Support:

```vb
#Const DEBUG_MODE = True

#If VBA7 Then
    Private Declare PtrSafe Function GetTickCount Lib "kernel32" () As Long
#Else
    Private Declare Function GetTickCount Lib "kernel32" () As Long
#End If
```

```vb
Private Declare PtrSafe Function FindWindow Lib "user32" Alias "FindWindowA" ( _
    ByVal lpClassName As String, _
    ByVal lpWindowName As String _
) As LongPtr
```

Support these keywords:

```text
#If
#ElseIf
#Else
#End If
#Const
Declare
PtrSafe
Lib
Alias
LongPtr
LongLong
```

## Completion Criteria

- Conditional compilation corpus tests pass
- Declare statement corpus tests pass
- Line continuation inside Declare statements works
- Existing procedure/declaration tests still pass

---

# Task5: Stabilize declaration nodes for downstream LSP usage

## Goal

Review and stabilize parse node names and fields for downstream LSP usage.

## Scope

Update grammar node names and fields only where necessary.

Focus on these declarations:

```text
module attributes
option statements
variable declarations
constant declarations
type declarations
enum declarations
sub declarations
function declarations
property declarations
parameters
```

## Requirements

Use stable field names where appropriate:

```js
field("name", $.identifier)
field("parameters", $.parameter_list)
field("type", $.type_expression)
field("body", $.block)
```

Expected downstream extraction:

```text
Procedure:
  kind
  name
  visibility
  parameters
  return_type
  start_position
  end_position

Variable:
  name
  visibility
  type
  scope

Type:
  name
  fields

Enum:
  name
  members
```

## Completion Criteria

- Corpus tests updated for stable parse trees
- Query files updated
- README documents stable node names intended for downstream consumers
- `npm test` passes