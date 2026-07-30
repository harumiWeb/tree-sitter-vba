VERSION 1.0 CLASS
Attribute VB_Name = "ExampleClass"
Option Explicit

Private mName As String
Private mItem As Object

Public Property Get Name() As String
    Name = mName
End Property

Public Property Let Name(ByVal value As String)
    mName = value
End Property

Public Property Set Item(ByVal value As Object)
    Set mItem = value
End Property
