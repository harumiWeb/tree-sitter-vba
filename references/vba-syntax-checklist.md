# VBA Syntax Checklist

This checklist tracks syntax areas that `tree-sitter-vba` should eventually support.

Status legend:

- `[ ]` not started
- `[~]` partial support
- `[x]` supported by corpus tests

## Module-level syntax

- [ ] `Attribute VB_Name = "..."`
- [ ] `Attribute VB_GlobalNameSpace = False`
- [ ] `Attribute VB_PredeclaredId = True`
- [ ] `Option Explicit`
- [ ] `Option Private Module`
- [ ] `Option Compare Binary`
- [ ] `Option Compare Text`
- [ ] `Option Compare Database`
- [ ] `Option Base 0`
- [ ] `Option Base 1`

## Procedures

- [ ] `Sub ... End Sub`
- [ ] `Function ... End Function`
- [ ] `Property Get ... End Property`
- [ ] `Property Let ... End Property`
- [ ] `Property Set ... End Property`
- [ ] `Public`
- [ ] `Private`
- [ ] `Friend`
- [ ] `Static`
- [ ] parameter list
- [ ] `ByVal`
- [ ] `ByRef`
- [ ] `Optional`
- [ ] `ParamArray`
- [ ] return type clause

## Declarations

- [ ] `Dim`
- [ ] `Static`
- [ ] `Private`
- [ ] `Public`
- [ ] `Const`
- [ ] `Type ... End Type`
- [ ] `Enum ... End Enum`
- [ ] `WithEvents`
- [ ] arrays
- [ ] fixed-length strings
- [ ] object declarations

## Statements

- [ ] assignment
- [ ] `Set`
- [ ] call statement without `Call`
- [ ] call statement with `Call`
- [ ] `If ... Then ... End If`
- [ ] single-line `If ... Then ... Else ...`
- [ ] `Select Case ... End Select`
- [ ] `For ... Next`
- [ ] `For Each ... Next`
- [ ] `Do ... Loop`
- [ ] `While ... Wend`
- [ ] `With ... End With`
- [ ] `On Error GoTo`
- [ ] `On Error Resume Next`
- [ ] `GoTo`
- [ ] `Exit Sub`
- [ ] `Exit Function`
- [ ] `Exit Property`
- [ ] `Exit For`
- [ ] `Exit Do`

## Expressions

- [ ] identifiers
- [ ] numbers
- [ ] strings
- [ ] booleans
- [ ] date literals
- [ ] binary operators
- [ ] unary operators
- [ ] comparison operators
- [ ] logical operators
- [ ] string concatenation
- [ ] member access
- [ ] default member-like calls
- [ ] array access
- [ ] parenthesized expressions

## VBA-specific source forms

- [ ] line continuation `_`
- [ ] colon-separated statements
- [ ] apostrophe comments
- [ ] `Rem` comments
- [ ] conditional compilation
- [ ] `#Const`
- [ ] `#If`
- [ ] `#ElseIf`
- [ ] `#Else`
- [ ] `#End If`

## 64-bit VBA

- [ ] `Declare`
- [ ] `PtrSafe`
- [ ] `Lib`
- [ ] `Alias`
- [ ] `LongPtr`
- [ ] `LongLong`

## UserForm / `.frm`

- [ ] `VERSION 5.00`
- [ ] `Begin VB.Form ...`
- [ ] nested `Begin ... End`
- [ ] form properties
- [ ] embedded attributes
- [ ] embedded VBA procedures
