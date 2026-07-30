Attribute VB_Name = "ErrorHandling"
Option Explicit

Public Sub DemonstrateErrorHandling()
    On Error GoTo Failed
    Err.Raise 5
    Exit Sub
Failed:
    Debug.Print Err.Number
End Sub
