Attribute VB_Name = "InlineNumbered"
Option Explicit

Public Sub InlineAndNumbered(ByVal ready As Boolean)
10  If ready Then first = 1: second = 2 Else first = 3: second = 4
20  For i = 1 To 2: Debug.Print i: Next i
30  Exit Sub
End Sub
