Attribute VB_Name = "Module1"
Option Explicit

Public Const MaxCount As Long = 10
Private count As Long

Public Sub Main()
    Dim message As String
    Dim i As Long

    message = "Hello from VBA"
    Debug.Print message

    If count < MaxCount Then
        Debug.Print count
    End If

    Select Case count
        Case 1
            Debug.Print "one"
        Case Else
            Debug.Print "other"
    End Select

    For i = 1 To 10
        Debug.Print i
    Next i
End Sub

Private Function Add(ByVal a As Long, ByVal b As Long) As Long
    Add = a + b
End Function
