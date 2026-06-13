Attribute VB_Name = "LegacyFileIo"
Option Explicit

Public Function BuildFixturePath() As String
    BuildFixturePath = Environ$("TEMP") & "\xlflow_legacy_file_io_fixture.txt"
End Function

Public Sub WriteFixtureFile(ByVal filePath As String)
    Dim fileNumber As Integer

    fileNumber = FreeFile
    Open filePath For Output As #fileNumber
    Print #fileNumber, """alpha"",1"
    Print #fileNumber, """beta"",2"
    Close #fileNumber
End Sub

Public Function ReadFirstRecordSummary(ByVal filePath As String) As String
    Dim fileNumber As Integer
    Dim itemName As String
    Dim itemValue As Long

    WriteFixtureFile filePath

    fileNumber = FreeFile
    Open filePath For Input As #fileNumber
    Input #fileNumber, itemName, itemValue
    Close #fileNumber

    ReadFirstRecordSummary = itemName & ":" & CStr(itemValue)
End Function

Public Function ReadAllLinesSummary(ByVal filePath As String) As String
    Dim fileNumber As Integer
    Dim lineValue As String
    Dim lines() As String
    Dim lineCount As Long
    Dim resultText As String

    WriteFixtureFile filePath

    fileNumber = FreeFile
    Open filePath For Input As #fileNumber
    Do While Not EOF(fileNumber)
        Line Input #fileNumber, lineValue
        lineCount = lineCount + 1
        ReDim Preserve lines(1 To lineCount)
        lines(lineCount) = lineValue
    Loop
    Close #fileNumber

    resultText = Join(lines, "|")
    Erase lines
    ReadAllLinesSummary = resultText
End Function

Public Function ReadWithLineNumbers(ByVal filePath As String) As String
10  On Error GoTo ErrHandler
    WriteFixtureFile filePath
20  ReadWithLineNumbers = ReadFirstRecordSummary(filePath)
30  Exit Function
100 ErrHandler:
    ReadWithLineNumbers = "error@" & CStr(Erl) & ":" & Err.Description
End Function
