Attribute VB_Name = "FileIo"
Option Explicit

Public Sub ReadFirstLine(ByVal path As String)
    Dim fileNumber As Integer
    Dim textLine As String
    fileNumber = FreeFile
    Open path For Input As #fileNumber
    Line Input #fileNumber, textLine
    Debug.Print textLine
    Close #fileNumber
End Sub
