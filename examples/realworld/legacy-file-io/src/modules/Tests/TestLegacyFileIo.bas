Attribute VB_Name = "TestLegacyFileIo"
Option Explicit

'@Tag("smoke")
Public Sub Test_First_Record_Can_Be_Read()
    Dim filePath As String

    filePath = LegacyFileIo.BuildFixturePath()
    XlflowAssert.AssertEquals LegacyFileIo.ReadFirstRecordSummary(filePath), "alpha:1", "first record should round-trip through Input #"
End Sub

'@Tag("smoke")
Public Sub Test_Line_Input_Collects_Both_Lines()
    Dim filePath As String
    Dim summary As String

    filePath = LegacyFileIo.BuildFixturePath()
    summary = LegacyFileIo.ReadAllLinesSummary(filePath)

    XlflowAssert.AssertTrue InStr(1, summary, """alpha"",1", vbTextCompare) > 0, "summary should include first line"
    XlflowAssert.AssertTrue InStr(1, summary, """beta"",2", vbTextCompare) > 0, "summary should include second line"
End Sub
