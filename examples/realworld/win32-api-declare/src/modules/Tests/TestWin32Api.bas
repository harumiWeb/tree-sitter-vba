Attribute VB_Name = "TestWin32Api"
Option Explicit

'@Tag("smoke")
Public Sub Test_String_Length_Uses_Declare()
    XlflowAssert.AssertEquals Win32Api.SampleStringLength("abc"), 3, "lstrlenA should count ASCII characters"
End Sub

'@Tag("smoke")
Public Sub Test_Process_Id_Is_Positive()
    XlflowAssert.AssertTrue Win32Api.SampleProcessId() > 0, "process id should be positive"
End Sub
