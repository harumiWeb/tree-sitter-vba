VERSION 5.00
Begin VB.Form UserForm1
   Caption = "Example Form"
   ClientHeight = 3000
   ClientLeft = 120
   ClientTop = 465
   ClientWidth = 4560
   StartUpPosition = 1
   Begin VB.CommandButton CommandButton1
      Caption = "OK"
      Height = 375
      Left = 1200
      Top = 1200
      Width = 1215
   End
End
Attribute VB_Name = "UserForm1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Option Explicit

Private Sub CommandButton1_Click()
    Debug.Print "clicked"
End Sub
