Attribute VB_Name = "Module1"
Option Explicit

Public Const MaxCount As Long = 10

Private Sub Main()
    Dim message As String
    message = "Hello from VBA"
    DebugPrint message
End Sub

Private Function Add(ByVal a As Long, ByVal b As Long) As Long
    Add = a + b
End Function

Public Property Get Name() As String
    Name = "Module1"
End Property