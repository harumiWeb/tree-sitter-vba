Attribute VB_Name = "App"
Option Explicit

Public Sub RunCore(ByVal wb As Workbook)
    Dim ws As Worksheet
    Dim filePath As String

    Set ws = wb.Worksheets(1)
    ws.Name = "LegacyFileIo"

    filePath = LegacyFileIo.BuildFixturePath()

    ws.Range("A1:B5").ClearContents
    ws.Range("A1").Value2 = "Metric"
    ws.Range("B1").Value2 = "Value"
    ws.Range("A2").Value2 = "FilePath"
    ws.Range("B2").Value2 = filePath
    ws.Range("A3").Value2 = "FirstRecord"
    ws.Range("B3").Value2 = LegacyFileIo.ReadFirstRecordSummary(filePath)
    ws.Range("A4").Value2 = "AllLines"
    ws.Range("B4").Value2 = LegacyFileIo.ReadAllLinesSummary(filePath)
    ws.Range("A5").Value2 = "LineNumberResult"
    ws.Range("B5").Value2 = LegacyFileIo.ReadWithLineNumbers(filePath)
End Sub
