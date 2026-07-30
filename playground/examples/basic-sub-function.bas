Attribute VB_Name = "Basics"
Option Explicit

Public Sub Hello()
    Debug.Print "Hello from tree-sitter-vba"
End Sub

Public Function Add(ByVal leftValue As Long, ByVal rightValue As Long) As Long
    Add = leftValue + rightValue
End Function
