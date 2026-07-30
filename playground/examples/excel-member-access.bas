Attribute VB_Name = "ExcelMemberAccess"
Option Explicit

Public Sub FillCells()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("Sheet1")
    ws.Range("A1").Value = "tree-sitter-vba"
    ws.Range("A2").Value = ws.Cells(1, 1).Value
End Sub
