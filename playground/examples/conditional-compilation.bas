Attribute VB_Name = "ConditionalCompilation"
Option Explicit

#Const DEBUG_MODE = True

#If DEBUG_MODE Then
Public Sub ReportMode()
    Debug.Print "Debug mode"
End Sub
#Else
Public Sub ReportMode()
    Debug.Print "Release mode"
End Sub
#End If
