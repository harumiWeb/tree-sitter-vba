VERSION 1.0 CLASS
Attribute VB_Name = "ExampleClass"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = False
Option Explicit

Private mName As String

Public Property Get Name() As String
    Name = mName
End Property

Public Property Let Name(ByVal value As String)
    mName = value
End Property

Public Property Set Item(ByVal value As Object)
    Set mItem = value
End Property
