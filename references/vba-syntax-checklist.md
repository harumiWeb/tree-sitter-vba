# VBA Syntax Checklist

This checklist tracks syntax areas that `tree-sitter-vba` should eventually support.

Status legend:

- `[ ]` not started
- `[~]` partial support
- `[x]` supported by corpus tests

## Module-level syntax

- [x] `Attribute VB_Name = "..."`
- [x] `Attribute VB_GlobalNameSpace = False`
- [x] `Attribute VB_PredeclaredId = True`
- [x] `Option Explicit`
- [x] `Option Private Module`
- [x] `Option Compare Binary`
- [x] `Option Compare Text`
- [x] `Option Compare Database`
- [x] `Option Base 0`
- [x] `Option Base 1`

## Procedures

- [x] `Sub ... End Sub`
- [x] `Function ... End Function`
- [x] `Property Get ... End Property`
- [x] `Property Let ... End Property`
- [x] `Property Set ... End Property`
- [x] `Public`
- [x] `Private`
- [x] `Friend`
- [x] `Static`
- [x] parameter list
- [x] `ByVal`
- [x] `ByRef`
- [x] `Optional`
- [x] `ParamArray`
- [x] return type clause

## Declarations

- [x] `Dim`
- [x] `Static`
- [x] `Private`
- [x] `Public`
- [x] `Const`
- [x] `Type ... End Type`
- [x] `Enum ... End Enum`
- [x] `WithEvents`
- [x] arrays
- [x] `ReDim`
- [x] fixed-length strings
- [x] object declarations with `As New`

## Statements

- [x] assignment
- [x] `Set`
- [x] call statement without `Call`
- [x] call statement with `Call`
- [x] `If ... Then ... End If`
- [x] single-line `If ... Then ... Else ...`
- [x] `Select Case ... End Select`
- [x] `For ... Next`
- [x] `For Each ... Next`
- [x] `Do ... Loop`
- [x] `While ... Wend`
- [x] `With ... End With`
- [x] `On Error GoTo`
- [x] `On Error Resume Next`
- [x] `GoTo`
- [x] `Exit Sub`
- [x] `Exit Function`
- [x] `Exit Property`
- [x] `Exit For`
- [x] `Exit Do`
- [x] `Resume`
- [x] labels
- [x] numeric labels and numbered statements
- [x] numbered block statements and delimiters

## Expressions

- [x] identifiers
- [x] numbers
- [x] strings
- [x] booleans
- [x] `Nothing`
- [x] `Null`
- [x] `Empty`
- [x] `New`
- [x] `AddressOf`
- [x] named arguments `:=`
- [x] omitted arguments
- [x] hex literals
- [x] type-declaration characters on identifiers
- [x] date literals
- [~] binary operators
- [x] common operator precedence
- [x] unary operators
- [~] comparison operators
- [x] logical operators
- [x] string concatenation
- [x] member access
- [x] default member-like calls
- [x] array access
- [x] parenthesized expressions

## VBA-specific source forms

- [~] line continuation `_`
- [x] colon-separated statements
- [x] apostrophe comments
- [x] `Rem` comments
- [x] conditional compilation
- [x] `#Const`
- [x] `#If`
- [x] `#ElseIf`
- [x] `#Else`
- [x] `#End If`
- [x] conditional compilation inside procedures

## 64-bit VBA

- [x] `Declare`
- [x] `Declare Function`
- [x] `Declare Sub`
- [x] `PtrSafe`
- [x] `Lib`
- [x] `Alias`
- [x] `LongPtr`
- [x] `LongLong`

## UserForm / `.frm`

- [x] `VERSION 5.00`
- [x] `Begin VB.Form ...`
- [x] nested `Begin ... End`
- [x] form properties
- [x] embedded attributes
- [x] embedded VBA procedures
- [x] GUID `Begin {C62...} ...`
- [x] `.frx` blob references such as `"Form.frx":0000`
- [x] `BeginProperty ... EndProperty`
