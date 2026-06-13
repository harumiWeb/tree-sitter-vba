Attribute VB_Name = "App"
Option Explicit

Public Sub RunCore(ByVal wb As Workbook)
    Dim ws As Worksheet

    Set ws = wb.Worksheets(1)
    ws.Name = "ApiFixture"

    ws.Range("A1:B6").ClearContents
    ws.Range("A1").Value2 = "Metric"
    ws.Range("B1").Value2 = "Value"
    ws.Range("A2").Value2 = "TickCount"
    ws.Range("B2").Value2 = Win32Api.SampleTickCount()
    ws.Range("A3").Value2 = "ProcessId"
    ws.Range("B3").Value2 = Win32Api.SampleProcessId()
    ws.Range("A4").Value2 = "StringLength"
    ws.Range("B4").Value2 = Win32Api.SampleStringLength("fixture")
    ws.Range("A5").Value2 = "ComputerNameApi"
    ws.Range("B5").Value2 = Win32Api.TryGetComputerName()
    ws.Range("A6").Value2 = "TimerSnapshot"
    ws.Range("B6").Value2 = Win32Api.DescribeTimerSnapshot()
End Sub
