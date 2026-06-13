Attribute VB_Name = "Win32Api"
Option Explicit

Public Type TimerSnapshot
    TickCount As Long
    ProcessId As Long
End Type

#If VBA7 Then
    Private Declare PtrSafe Function GetTickCount Lib "kernel32" () As Long
    Private Declare PtrSafe Function GetCurrentProcessId Lib "kernel32" () As Long
    Private Declare PtrSafe Function GetComputerNameA Lib "kernel32" Alias "GetComputerNameA" ( _
        ByVal lpBuffer As String, _
        ByRef nSize As Long) As Long
    Private Declare PtrSafe Function lstrlenA Lib "kernel32" Alias "lstrlenA" ( _
        ByVal lpString As String) As Long
#Else
    Private Declare Function GetTickCount Lib "kernel32" () As Long
    Private Declare Function GetCurrentProcessId Lib "kernel32" () As Long
    Private Declare Function GetComputerNameA Lib "kernel32" Alias "GetComputerNameA" ( _
        ByVal lpBuffer As String, _
        ByRef nSize As Long) As Long
    Private Declare Function lstrlenA Lib "kernel32" Alias "lstrlenA" ( _
        ByVal lpString As String) As Long
#End If

Public Function SampleTickCount() As Long
    SampleTickCount = GetTickCount()
End Function

Public Function SampleProcessId() As Long
    SampleProcessId = GetCurrentProcessId()
End Function

Public Function SampleStringLength(ByVal value As String) As Long
    SampleStringLength = lstrlenA(value)
End Function

Public Function CaptureTimerSnapshot() As TimerSnapshot
    Dim snapshot As TimerSnapshot

    snapshot.TickCount = SampleTickCount()
    snapshot.ProcessId = SampleProcessId()
    CaptureTimerSnapshot = snapshot
End Function

Public Function DescribeTimerSnapshot() As String
    Dim snapshot As TimerSnapshot

    snapshot = CaptureTimerSnapshot()
    DescribeTimerSnapshot = "pid=" & CStr(snapshot.ProcessId) & ", ticks=" & CStr(snapshot.TickCount)
End Function

Public Function TryGetComputerName() As String
    Dim buffer As String
    Dim sizeValue As Long
    Dim apiResult As Long

    buffer = String$(260, vbNullChar)
    sizeValue = Len(buffer)
    apiResult = GetComputerNameA(buffer, sizeValue)

    If apiResult = 0 Then
        TryGetComputerName = "unknown"
        Exit Function
    End If

    TryGetComputerName = Left$(buffer, sizeValue)
End Function
