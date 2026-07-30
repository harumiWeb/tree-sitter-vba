Attribute VB_Name = "FileIo"
Option Explicit

Public Sub ReadFirstLine(ByVal path As String)
    Dim textLine As String
    Open path For Input As #1
    Line Input #1, textLine
    Debug.Print textLine
    Close #1
End Sub
