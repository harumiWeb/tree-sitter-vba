Attribute VB_Name = "WinApiDeclare"
Option Explicit

#If VBA7 Then
    Private Declare PtrSafe Function GetTickCount Lib "kernel32" () As LongPtr
#Else
    Private Declare Function GetTickCount Lib "kernel32" () As Long
#End If
