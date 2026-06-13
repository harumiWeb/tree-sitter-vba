Sub Word連携_印刷()
    Dim wdApp As Object
    Dim wdDoc As Object

    ' Wordアプリケーションの起動
    Set wdApp = CreateObject("Word.Application")
    wdApp.Visible = True ' Wordを表示

    ' 新しいドキュメントを作成
    Set wdDoc = wdApp.Documents.Add

    ' ここにWordでの操作や文書の編集を記述

    ' ドキュメントを印刷
    wdDoc.PrintOut

    ' Wordを閉じる
    wdApp.Quit
    Set wdApp = Nothing
    Set wdDoc = Nothing
End Sub

Sub Excel表をWordに貼り付け()
    Dim wdApp As Object
    Dim wdDoc As Object

    ' Wordアプリケーションの起動
    Set wdApp = CreateObject("Word.Application")
    wdApp.Visible = True ' Wordを表示

    ' 新しいドキュメントを作成
    Set wdDoc = wdApp.Documents.Add

    ' Excelの選択範囲をコピー
    Range("A1:D10").Copy

    ' Wordに貼り付け
    wdDoc.Range.Paste

    ' ここにWordでの操作や文書の編集を記述

    ' Wordを閉じる
    wdApp.Quit
    Set wdApp = Nothing
    Set wdDoc = Nothing
End Sub

Sub フォルダ内Excelデータ結合()
    Dim wbMaster As Workbook
    Dim wsMaster As Worksheet
    Dim myPath As String
    Dim myFile As String
    Dim currentFile As String

    ' マスターブックを新規作成
    Set wbMaster = Workbooks.Add
    Set wsMaster = wbMaster.Sheets(1)

    ' フォルダのパスを指定
    myPath = "C:\Your\Folder\Path\"

    ' フォルダ内の全てのExcelファイルに対して処理
    myFile = Dir(myPath & "*.xlsx")
    Do While myFile <> ""
        currentFile = myPath & myFile

        ' Excelファイルをマスターブックに追加
        Workbooks.Open currentFile
        ActiveSheet.UsedRange.Copy wsMaster.Cells(wsMaster.Rows.Count, "A").End(xlUp).Offset(1)
        Workbooks(myFile).Close SaveChanges:=False

        ' 次のファイルへ
        myFile = Dir
    Loop
End Sub

Sub 請求書PDF作成()
    Dim wsData As Worksheet
    Dim wsInvoice As Worksheet
    Dim pdfFileName As String
    Dim lastRow As Long

    ' データが格納されているシートを指定
    Set wsData = ThisWorkbook.Sheets("データ")

    ' 請求書のテンプレートが格納されているシートを指定
    Set wsInvoice = ThisWorkbook.Sheets("請求書テンプレート")

    ' データの行数を取得
    lastRow = wsData.Cells(wsData.Rows.Count, "A").End(xlUp).Row

    ' 各行ごとに請求書を作成
    For i = 2 To lastRow
        ' ここに取引先別の請求書作成処理を記述

        ' PDFファイル名の生成
        pdfFileName = "請求書_" & wsData.Cells(i, 1).Value & ".pdf"

        ' 請求書をPDFとして保存
        wsInvoice.ExportAsFixedFormat Type:=xlTypePDF, Filename:=pdfFileName
    Next i
End Sub

Sub 作業チェックリスト作成()
    Dim wsChecklist As Worksheet
    Dim checklistFileName As String

    ' 作業チェックリストが格納されているシートを指定
    Set wsChecklist = ThisWorkbook.Sheets("作業チェックリスト")

    ' ここに作業チェックリストの作成処理を記述

    ' PDFファイル名の生成
    checklistFileName = "作業チェックリスト_" & Format(Date, "yyyymmdd") & ".pdf"

    ' 作業チェックリストをPDFとして保存
    wsChecklist.ExportAsFixedFormat Type:=xlTypePDF, Filename:=checklistFileName
End Sub

Sub 折れ線グラフ作成()
    Dim wsData As Worksheet
    Dim cht As ChartObject
    Dim lastRow As Long

    ' データが格納されているシートを指定
    Set wsData = ThisWorkbook.Sheets("データ")

    ' データの行数を取得
    lastRow = wsData.Cells(wsData.Rows.Count, "A").End(xlUp).Row

    ' グラフの挿入
    Set cht = wsData.ChartObjects.Add(Left:=100, Width:=375, Top:=75, Height:=225)

    ' グラフの種類を折れ線グラフに設定
    cht.Chart.ChartType = xlLine

    ' グラフのデータ範囲を設定
    cht.Chart.SetSourceData Source:=wsData.Range("A1:B" & lastRow)

    ' グラフにタイトルを追加
    cht.Chart.HasTitle = True
    cht.Chart.ChartTitle.Text = "折れ線グラフ"

    ' 軸ラベルの追加
    cht.Chart.Axes(xlCategory, xlPrimary).HasTitle = True
    cht.Chart.Axes(xlCategory, xlPrimary).AxisTitle.Text = "X軸ラベル"

    ' 軸の最小値と最大値を設定
    cht.Chart.Axes(xlValue, xlPrimary).MinimumScale = 0
    cht.Chart.Axes(xlValue, xlPrimary).MaximumScale = 100

    ' グラフの色を設定
    cht.Chart.SeriesCollection(1).Format.Line.ForeColor.RGB = RGB(255, 0, 0)
End Sub

Sub データ処理の高速化()
    ' 以下にデータ処理のコードを追加

    ' 処理前の状態を最適化する
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False

    ' ここに処理コードを追加

    ' 処理後に元の状態に戻す
    Application.ScreenUpdating = True
    Application.Calculation = xlCalculationAutomatic
    Application.EnableEvents = True
End Sub

Sub ショートカットキーの作成()
    ' 任意のショートカットキーを設定
    Application.OnKey "^+s", "マクロの実行"
End Sub

Function カスタムSUM(rng As Range) As Double
    Dim cell As Range
    Dim total As Double
    
    ' セルごとに値を加算
    For Each cell In rng
        total = total + cell.Value
    Next cell
    
    ' 関数の戻り値として合計値を返す
    カスタムSUM = total
End Function

Private Sub Worksheet_Change(ByVal Target As Range)
    Dim rng As Range
    Dim cell As Range

    ' チェック対象のセル範囲を指定
    Set rng = Range("A1:B10")

    ' 対象セルが変更された場合の処理
    If Not Intersect(Target, rng) Is Nothing Then
        For Each cell In Intersect(Target, rng)
            ' ここに入力ミスのチェック処理を追加
            If cell.Value < 0 Then
                MsgBox "エラー: 負の値は入力できません。", vbExclamation
                cell.ClearContents ' 負の値をクリア
            End If
        Next cell
    End If
End Sub

Sub 表の自動作成()
    Dim ws As Worksheet
    Dim rng As Range
    Dim lastRow As Long
    Dim lastCol As Long

    ' 対象のシートを指定
    Set ws = ThisWorkbook.Sheets("データ")

    ' データの範囲を取得
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row
    lastCol = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column

    ' データの範囲を指定
    Set rng = ws.Range(ws.Cells(1, 1), ws.Cells(lastRow, lastCol))

    ' 表の罫線を設定
    rng.Borders.LineStyle = xlContinuous

    ' ヘッダーの背景色を変更
    rng.Rows(1).Interior.Color = RGB(200, 200, 200)
End Sub

Sub マクロの自動記録()
    ' マクロの記録を開始
    With ThisWorkbook.Sheets("Sheet1")
        .Cells.Clear
        .Cells(1, 1).Value = "データ1"
        .Cells(1, 2).Value = "データ2"
        .Cells(2, 1).Value = "データ3"
        .Cells(2, 2).Value = "データ4"
    End With

    ' ここで手動で行った操作を確認

    ' マクロの記録を終了
End Sub

Sub 不要ファイルの削除()
    Dim folderPath As String
    Dim fileName As String

    ' 削除対象のフォルダを指定
    folderPath = "C:\Users\ユーザー名\Documents\不要ファイル"

    ' フォルダ内のファイルを一括で削除
    fileName = Dir(folderPath & "\*.*")
    Do While fileName <> ""
        Kill folderPath & "\" & fileName
        fileName = Dir
    Loop
End Sub

Sub シートのデータ結合()
    Dim ws As Worksheet
    Dim combinedSheet As Worksheet
    Dim lastRow As Long

    ' 結合先のシートを指定
    Set combinedSheet = ThisWorkbook.Sheets("結合データ")

    ' すべてのシートをループ
    For Each ws In ThisWorkbook.Sheets
        ' 結合先のシートは除外
        If ws.Name <> combinedSheet.Name Then
            ' 最終行を取得
            lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row

            ' データを結合先の次の行にコピー
            ws.Range("A1").Resize(lastRow, ws.UsedRange.Columns.Count).Copy _
                combinedSheet.Cells(combinedSheet.Rows.Count, "A").End(xlUp).Offset(1)
        End If
    Next ws
End Sub

Sub 商品別売上集計()
    Dim dataSheet As Worksheet
    Dim summarySheet As Worksheet
    Dim lastRow As Long

    ' データが格納されているシートと集計結果を表示するシートを指定
    Set dataSheet = ThisWorkbook.Sheets("売上データ")
    Set summarySheet = ThisWorkbook.Sheets("商品別売上集計")

    ' 商品別に集計
    dataSheet.Range("A1:B" & dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row).Copy _
        summarySheet.Cells(1, 1)

    ' 集計データをソートしてランキングを表示
    With summarySheet.Sort
        .SortFields.Clear
        .SortFields.Add Key:=summarySheet.Range("B:B"), SortOn:=xlSortOnValues, Order:=xlDescending, DataOption:=xlSortNormal
        .SetRange summarySheet.Range("A:B")
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub

Sub 条件抽出()
    Dim dataSheet As Worksheet
    Dim resultSheet As Worksheet
    Dim criteria1 As String
    Dim criteria2 As String
    Dim lastRow As Long

    ' データが格納されているシートと結果を表示するシートを指定
    Set dataSheet = ThisWorkbook.Sheets("データ")
    Set resultSheet = ThisWorkbook.Sheets("抽出結果")

    ' 抽出条件を指定
    criteria1 = "条件1"
    criteria2 = "条件2"

    ' データを結果シートに抽出
    dataSheet.Range("A1:C" & dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row).AutoFilter _
        Field:=1, Criteria1:=criteria1
    dataSheet.Range("A1:C" & dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row).AutoFilter _
        Field:=2, Criteria1:=criteria2
    dataSheet.AutoFilterMode = False

    ' 抽出データを結果シートにコピー
    dataSheet.UsedRange.SpecialCells(xlCellTypeVisible).Copy resultSheet.Range("A1")
End Sub

Sub 四半期別合計()
    Dim dataSheet As Worksheet
    Dim resultSheet As Worksheet
    Dim lastRow As Long
    Dim quarter As Integer
    Dim i As Integer

    ' データが格納されているシートと結果を表示するシートを指定
    Set dataSheet = ThisWorkbook.Sheets("データ")
    Set resultSheet = ThisWorkbook.Sheets("四半期別合計")

    ' データの最終行を取得
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row

    ' 四半期ごとにデータを合計
    For i = 2 To lastRow
        quarter = Int((Month(dataSheet.Cells(i, 1)) - 1) / 3) + 1
        resultSheet.Cells(quarter, 2).Value = resultSheet.Cells(quarter, 2).Value + dataSheet.Cells(i, 2).Value
    Next i
End Sub

Sub 月別計算()
    Dim dataSheet As Worksheet
    Dim resultSheet As Worksheet
    Dim lastRow As Long
    Dim month As Integer
    Dim i As Integer

    ' データが格納されているシートと結果を表示するシートを指定
    Set dataSheet = ThisWorkbook.Sheets("データ")
    Set resultSheet = ThisWorkbook.Sheets("月別計算")

    ' データの最終行を取得
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row

    ' 月ごとにデータを合計
    For i = 2 To lastRow
        month = Month(dataSheet.Cells(i, 1))
        resultSheet.Cells(month, 2).Value = resultSheet.Cells(month, 2).Value + dataSheet.Cells(i, 2).Value
    Next i
End Sub

Sub 日別合計()
    Dim dataSheet As Worksheet
    Dim resultSheet As Worksheet
    Dim lastRow As Long
    Dim dateValue As Date
    Dim i As Integer

    ' データが格納されているシートと結果を表示するシートを指定
    Set dataSheet = ThisWorkbook.Sheets("データ")
    Set resultSheet = ThisWorkbook.Sheets("日別合計")

    ' データの最終行を取得
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row

    ' 日ごとにデータを合計
    For i = 2 To lastRow
        dateValue = dataSheet.Cells(i, 1).Value
        resultSheet.Cells(DateValue, 2).Value = resultSheet.Cells(DateValue, 2).Value + dataSheet.Cells(i, 2).Value
    Next i
End Sub

Sub 週ごと合計()
    Dim dataSheet As Worksheet
    Dim resultSheet As Worksheet
    Dim lastRow As Long
    Dim startDate As Date
    Dim endDate As Date
    Dim i As Integer

    ' データが格納されているシートと結果を表示するシートを指定
    Set dataSheet = ThisWorkbook.Sheets("データ")
    Set resultSheet = ThisWorkbook.Sheets("週ごと合計")

    ' データの最終行を取得
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row

    ' 週ごとにデータを合計
    For i = 2 To lastRow
        startDate = WorksheetFunction.WorkDay(dataSheet.Cells(i, 1).Value, -Weekday(dataSheet.Cells(i, 1).Value) + 1)
        endDate = startDate + 6

        resultSheet.Cells(startDate, 2).Value = resultSheet.Cells(startDate, 2).Value + dataSheet.Cells(i, 2).Value
    Next i
End Sub


Sub オブジェクト削除()
    Dim obj As Object

    ' 削除対象のオブジェクトを指定（例:シート上のすべての図形を削除）
    For Each obj In ActiveSheet.Shapes
        obj.Delete
    Next obj
End Sub

Sub データ転記()
    Dim dataSheet As Worksheet
    Dim lastRow As Long
    Dim i As Long
    Dim newWorkbook As Workbook

    ' データが格納されているシートを指定
    Set dataSheet = ThisWorkbook.Sheets("データ")

    ' データの最終行を取得
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row

    ' 列ごとにデータを別ファイルに転記
    For i = 1 To dataSheet.UsedRange.Columns.Count
        ' 新しいブックを作成
        Set newWorkbook = Workbooks.Add

        ' データをコピー
        dataSheet.Columns(i).Copy newWorkbook.Sheets(1).Range("A1")

        ' ブックを保存
        newWorkbook.SaveAs "転記データ_" & dataSheet.Cells(1, i).Value & ".xlsx"
        newWorkbook.Close SaveChanges:=False
    Next i
End Sub

Sub 不要シート削除()
    Dim sheet As Worksheet

    ' 削除対象のシートを指定（例: "Sheet2"と"Sheet3"を削除）
    Application.DisplayAlerts = False
    For Each sheet In ThisWorkbook.Sheets
        If sheet.Name = "Sheet2" Or sheet.Name = "Sheet3" Then
            sheet.Delete
        End If
    Next sheet
    Application.DisplayAlerts = True
End Sub

Sub データ項目別自動転記()
    Dim dataSheet As Worksheet
    Dim lastRow As Long
    Dim i As Long
    Dim targetSheet As Worksheet

    ' データが格納されているシートを指定
    Set dataSheet = ThisWorkbook.Sheets("データ")

    ' データの最終行を取得
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row

    ' 列ごとにデータを項目別に新しいシートに転記
    For i = 2 To dataSheet.UsedRange.Columns.Count
        ' 新しいシートを作成
        Set targetSheet = Sheets.Add(After:=Sheets(Sheets.Count))
        targetSheet.Name = dataSheet.Cells(1, i).Value

        ' データをコピー
        dataSheet.Columns(i).Copy targetSheet.Range("A1")
    Next i
End Sub

Sub 月別シート分け()
    Dim dataSheet As Worksheet
    Dim lastRow As Long
    Dim i As Long
    Dim targetSheet As Worksheet
    Dim currentMonth As String

    ' データが格納されているシートを指定
    Set dataSheet = ThisWorkbook.Sheets("データ")

    ' データの最終行を取得
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row

    ' 列ごとにデータを月別に新しいシートに分けて転記
    For i = 2 To lastRow
        ' 日付から月を取得
        currentMonth = Format(dataSheet.Cells(i, 1).Value, "yyyy年mm月")

        ' 月ごとに新しいシートを作成
        If WorksheetExists(currentMonth) Then
            Set targetSheet = Sheets(currentMonth)
        Else
            Set targetSheet = Sheets.Add(After:=Sheets(Sheets.Count))
            targetSheet.Name = currentMonth
        End If

        ' データをコピー
        dataSheet.Rows(i).Copy targetSheet.Cells(targetSheet.Cells(targetSheet.Rows.Count, "A").End(xlUp).Row + 1, 1)
    Next i
End Sub

Function WorksheetExists(shtName As String) As Boolean
    On Error Resume Next
    WorksheetExists = Not Worksheets(shtName) Is Nothing
    On Error GoTo 0
End Function

Sub データ比較照合()
    Dim dataSheet1 As Worksheet
    Dim dataSheet2 As Worksheet
    Dim resultSheet As Worksheet
    Dim lastRow1 As Long
    Dim lastRow2 As Long
    Dim i As Long
    Dim j As Long
    Dim matchFound As Boolean

    ' データが格納されているシートを指定
    Set dataSheet1 = ThisWorkbook.Sheets("データ1")
    Set dataSheet2 = ThisWorkbook.Sheets("データ2")
    Set resultSheet = ThisWorkbook.Sheets.Add(After:=Sheets(Sheets.Count))
    resultSheet.Name = "マッチング結果"

    ' データの最終行を取得
    lastRow1 = dataSheet1.Cells(dataSheet1.Rows.Count, "A").End(xlUp).Row
    lastRow2 = dataSheet2.Cells(dataSheet2.Rows.Count, "A").End(xlUp).Row

    ' データ1の各行をデータ2と比較して一致するものを新しいシートに転記
    For i = 2 To lastRow1
        matchFound = False
        For j = 2 To lastRow2
            If dataSheet1.Cells(i, 1).Value = dataSheet2.Cells(j, 1).Value Then
                matchFound = True
                dataSheet1.Rows(i).Copy resultSheet.Cells(resultSheet.Cells(resultSheet.Rows.Count, "A").End(xlUp).Row + 1, 1)
                Exit For
            End If
        Next j
    Next i
End Sub

Sub 色の塗りつぶし非表示()
    Dim dataSheet As Worksheet
    Dim lastRow As Long
    Dim lastCol As Long
    Dim i As Long
    Dim j As Long
    Dim rowHasFill As Boolean
    Dim colHasFill As Boolean

    ' データが格納されているシートを指定
    Set dataSheet = ThisWorkbook.Sheets("データ")

    ' データの最終行と最終列を取得
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).Row
    lastCol = dataSheet.Cells(1, dataSheet.Columns.Count).End(xlToLeft).Column

    ' 各行に色の塗りつぶしがない場合は非表示に、ある場合は表示にする
    For i = 1 To lastRow
        rowHasFill = False
        For j = 1 To lastCol
            If dataSheet.Cells(i, j).Interior.ColorIndex <> -4142 Then ' -4142は白色のColorIndex
                rowHasFill = True
                Exit For
            End If
        Next j
        dataSheet.Rows(i).Hidden = Not rowHasFill
    Next i

    ' 各列に色の塗りつぶしがない場合は非表示に、ある場合は表示にする
    For j = 1 To lastCol
        colHasFill = False
        For i = 1 To lastRow
            If dataSheet.Cells(i, j).Interior.ColorIndex <> -4142 Then
                colHasFill = True
                Exit For
            End If
        Next i
        dataSheet.Columns(j).Hidden = Not colHasFill
    Next j
End Sub

Sub フォルダ作成()
    Dim baseFolder As String
    Dim cellValue As Variant
    Dim folderPath As String

    ' ベースとなるフォルダを指定
    baseFolder = "C:\Users\YourUsername\Documents\"

    ' データが格納されているセルの範囲を指定
    Dim dataRange As Range
    Set dataRange = ThisWorkbook.Sheets("シート1").Range("A1:A10") ' 適切な範囲を指定

    ' セルの値で同じ階層に複数フォルダを一括作成
    For Each cell In dataRange
        If Not IsEmpty(cell.Value) Then
            cellValue = Replace(cell.Value, "/", "-") ' フォルダ名に使えない文字を変換
            folderPath = baseFolder & cellValue & "\"
            MkDir folderPath
        End If
    Next cell
End Sub

Sub 階層フォルダ作成()
    Dim baseFolder As String
    Dim folderList As Variant
    Dim folderPath As String
    Dim subFolder As Variant

    ' ベースとなるフォルダを指定
    baseFolder = "C:\Users\YourUsername\Documents\"

    ' 作成するサブフォルダのリストを指定
    folderList = Array("フォルダ1", "フォルダ2", "フォルダ3")

    ' 各サブフォルダをベースフォルダ内に一括で作成
    For Each subFolder In folderList
        folderPath = baseFolder & subFolder & "\"
        MkDir folderPath
    Next subFolder
End Sub

Sub ファイル名取得()
    Dim folderPath As String
    Dim fileName As String
    Dim fileExtension As String

    ' 対象のフォルダを指定
    folderPath = "C:\Users\YourUsername\Documents\SampleFolder\"

    ' フォルダ内のファイル名を取得
    fileName = Dir(folderPath & "*.*")

    ' ファイルが存在する限りループ
    Do While fileName <> ""
        ' ファイル名と拡張子を表示
        Debug.Print fileName
        ' 次のファイルを取得
        fileName = Dir
    Loop
End Sub

Sub ファイルとサブフォルダ取得()
    Dim folderPath As String
    Dim fileName As String
    Dim subFolderName As String
    Dim fileExtension As String
    Dim resultSheet As Worksheet
    Dim rowNumber As Long

    ' 対象のフォルダを指定
    folderPath = "C:\Users\YourUsername\Documents\SampleFolder\"

    ' フォルダ内のファイル名とサブフォルダ名を取得して一覧表示
    Set resultSheet = ThisWorkbook.Sheets.Add(After:=Sheets(Sheets.Count))
    resultSheet.Name = "ファイル一覧"

    rowNumber = 1

    ' ファイル名を取得
    fileName = Dir(folderPath & "*.*")

    Do While fileName <> ""
        ' ファイル名と拡張子を分割
        fileExtension = Right(fileName, Len(fileName) - InStrRev(fileName, "."))
        
        ' ファイル名と拡張子を表示
        resultSheet.Cells(rowNumber, 1).Value = fileName
        resultSheet.Cells(rowNumber, 2).Value = fileExtension
        
        rowNumber = rowNumber + 1

        ' 次のファイルを取得
        fileName = Dir
    Loop

    ' サブフォルダ名を取得
    subFolderName = Dir(folderPath & "*", vbDirectory)

    Do While subFolderName <> ""
        ' "." と ".." 以外のディレクトリを処理
        If subFolderName <> "." And subFolderName <> ".." Then
            ' サブフォルダ名を表示
            resultSheet.Cells(rowNumber, 1).Value = subFolderName
            resultSheet.Cells(rowNumber, 2).Value = "フォルダ"

            rowNumber = rowNumber + 1
        End If

        ' 次のサブフォルダを取得
        subFolderName = Dir
    Loop
End Sub

Sub フォルダファイルリスト出力()
    Dim folderPath As String
    Dim fileName As String
    Dim subFolderName As String
    Dim fileExtension As String
    Dim outputFilePath As String
    Dim outputText As String

    ' 対象のフォルダを指定
    folderPath = "C:\Users\YourUsername\Documents\SampleFolder\"

    ' 出力するテキストファイルのパスを指定
    outputFilePath = "C:\Users\YourUsername\Documents\FolderFileList.txt"

    ' フォルダ内のファイル名とサブフォルダ名をテキストファイルに出力
    Open outputFilePath For Output As #1

    ' ファイル名を取得
    fileName = Dir(folderPath & "*.*")

    Do While fileName <> ""
        ' ファイル名と拡張子を分割
        fileExtension = Right(fileName, Len(fileName) - InStrRev(fileName, "."))
        
        ' ファイル名と拡張子をテキストファイルに出力
        Print #1, fileName & "," & fileExtension

        ' 次のファイルを取得
        fileName = Dir
    Loop

    ' サブフォルダ名を取得
    subFolderName = Dir(folderPath & "*", vbDirectory)

    Do While subFolderName <> ""
        ' "." と ".." 以外のディレクトリを処理
        If subFolderName <> "." And subFolderName <> ".." Then
            ' サブフォルダ名をテキストファイルに出力
            Print #1, subFolderName & ",フォルダ"
        End If

        ' 次のサブフォルダを取得
        subFolderName = Dir
    Loop

    Close #1
End Sub

Sub フォルダファイル名一括変更()
    Dim folderPath As String
    Dim newFolderName As String
    Dim newFileName As String
    Dim oldPath As String
    Dim newPath As String

    ' 対象のフォルダを指定
    folderPath = "C:\Users\YourUsername\Documents\SampleFolder\"

    ' 変更後のフォルダ名とファイル名を指定
    newFolderName = "新しいフォルダ名"
    newFileName = "新しいファイル名"

    ' フォルダ内のフォルダ名を一括変更
    Name folderPath & "*" & "\", folderPath & newFolderName & "\"

    ' フォルダ内のファイル名を一括変更
    Dim fileName As String
    fileName = Dir(folderPath & "*.*")

    Do While fileName <> ""
        oldPath = folderPath & fileName
        newPath = folderPath & newFileName & "." & Right(fileName, Len(fileName) - InStrRev(fileName, "."))
        Name oldPath As newPath
        fileName = Dir
    Loop
End Sub

Sub フォルダを最前面で開く()
    Dim folderPath As String

    ' 開く対象のフォルダを指定
    folderPath = "C:\Users\YourUsername\Documents\SampleFolder\"

    ' フォルダを最前面で開く
    Shell "explorer.exe /select," & folderPath, vbNormalFocus
End Sub

Sub フォルダ選択してファイル名取得()
    Dim folderPath As String
    Dim fileName As String
    Dim fileNames As String
    Dim selectedFolder As Variant
    Dim resultSheet As Worksheet
    Dim rowNumber As Long

    ' ダイアログからフォルダを選択
    With Application.FileDialog(msoFileDialogFolderPicker)
        If .Show = -1 Then
            selectedFolder = .SelectedItems(1)
        Else
            Exit Sub
        End If
    End With

    ' 選択されたフォルダ内のファイル名を取得して一覧表示
    Set resultSheet = ThisWorkbook.Sheets.Add(After:=Sheets(Sheets.Count))
    resultSheet.Name = "選択フォルダファイル一覧"

    rowNumber = 1

    ' ファイル名を取得
    fileName = Dir(selectedFolder & "\*.*")

    Do While fileName <> ""
        ' ファイル名を表示
        resultSheet.Cells(rowNumber, 1).Value = fileName
        rowNumber = rowNumber + 1

        ' 次のファイルを取得
        fileName = Dir
    Loop
End Sub

Sub Excelファイル処理()
    Dim folderPath As String
    Dim fileName As String
    Dim wb As Workbook

    ' 対象のフォルダを指定
    folderPath = "C:\Users\YourUsername\Documents\ExcelFiles\"

    ' フォルダ内のExcelファイルを処理
    fileName = Dir(folderPath & "*.xlsx")

    Do While fileName <> ""
        ' Excelファイルを開く
        Set wb = Workbooks.Open(folderPath & fileName)

        ' ここにExcelファイルに対する処理を追加

        ' 例：シート1のA1セルに値を表示
        wb.Sheets(1).Range("A1").Value = "Hello, Excel!"

        ' Excelファイルを保存して閉じる
        wb.Close SaveChanges:=True

        ' 次のExcelファイルを取得
        fileName = Dir
    Loop
End Sub

Sub テキスト置換変換()
    Dim filePath As String
    Dim text As String
    Dim newText As String
    Dim fileContent As String

    ' 対象のテキストファイルを指定
    filePath = "C:\Users\YourUsername\Documents\TextFile.txt"

    ' 置換前の文字列と置換後の文字列を指定
    text = "置換前の文字列"
    newText = "置換後の文字列"

    ' テキストファイルを読み込む
    Open filePath For Input As #1
    fileContent = Input$(LOF(1), #1)
    Close #1

    ' 文字列を置換
    fileContent = Replace(fileContent, text, newText)

    ' 置換後の内容をテキストファイルに書き込む
    Open filePath For Output As #1
    Print #1, fileContent
    Close #1
End Sub

Sub フォルダ統計情報()
    Dim folderPath As String
    Dim fileCount As Long
    Dim folderCount As Long

    ' 対象のフォルダを指定
    folderPath = "C:\Users\YourUsername\Documents\SampleFolder\"

    ' フォルダ内のファイル数とフォルダ数をカウント
    fileCount = GetFileCount(folderPath)
    folderCount = GetFolderCount(folderPath)

    ' カウント結果をExcelに出力
    ThisWorkbook.Sheets("Sheet1").Range("A1").Value = "ファイル数"
    ThisWorkbook.Sheets("Sheet1").Range("B1").Value = fileCount
    ThisWorkbook.Sheets("Sheet1").Range("A2").Value = "フォルダ数"
    ThisWorkbook.Sheets("Sheet1").Range("B2").Value = folderCount
End Sub

Function GetFileCount(folderPath As String) As Long
    Dim file As String
    Dim fileCount As Long

    file = Dir(folderPath & "*.*")
    Do While file <> ""
        If (GetAttr(folderPath & file) And vbDirectory) = 0 Then
            fileCount = fileCount + 1
        End If
        file = Dir
    Loop

    GetFileCount = fileCount
End Function

Function GetFolderCount(folderPath As String) As Long
    Dim subFolder As String
    Dim folderCount As Long

    subFolder = Dir(folderPath & "*", vbDirectory)
    Do While subFolder <> ""
        If subFolder <> "." And subFolder <> ".." Then
            folderCount = folderCount + 1
        End If
        subFolder = Dir
    Loop

    GetFolderCount = folderCount
End Function

Sub フォルダ内ファイルコピー()
    Dim sourceFolderPath As String
    Dim destinationFolderPath As String
    Dim file As String

    ' コピー元のフォルダを指定
    sourceFolderPath = "C:\Users\YourUsername\Documents\SourceFolder\"

    ' コピー先のフォルダを指定
    destinationFolderPath = "C:\Users\YourUsername\Documents\DestinationFolder\"

    ' コピー元フォルダ内のファイルをコピー先に一括コピー
    file = Dir(sourceFolderPath & "*.*")
    Do While file <> ""
        FileCopy sourceFolderPath & file, destinationFolderPath & file
        file = Dir
    Loop
End Sub

Sub フォルダセットコピー()
    Dim sourceBaseFolderPath As String
    Dim destinationBaseFolderPath As String
    Dim folder As String
    Dim sourceFolderPath As String
    Dim destinationFolderPath As String

    ' コピー元の基準フォルダを指定
    sourceBaseFolderPath = "C:\Users\YourUsername\Documents\SourceBaseFolder\"

    ' コピー先の基準フォルダを指定
    destinationBaseFolderPath = "C:\Users\YourUsername\Documents\DestinationBaseFolder\"

    ' コピー元フォルダのセットを指定
    folder = "Folder1" ' 適切なフォルダ名を指定
    sourceFolderPath = sourceBaseFolderPath & folder & "\"

    ' コピー先フォルダのセットを指定
    destinationFolderPath = destinationBaseFolderPath & folder & "\"

    ' コピー元フォルダ内のファイルをコピー先に一括コピー
    FileCopy sourceFolderPath & "*.*", destinationFolderPath
End Sub

Sub 資料送付状作成印刷()
    Dim wordApp As Object
    Dim wordDoc As Object
    Dim ws As Worksheet
    Dim customerName As String
    Dim documentPath As String

    ' Wordアプリケーションの新規作成
    Set wordApp = CreateObject("Word.Application")
    wordApp.Visible = True ' Wordを表示

    ' シートと Word ドキュメントの関連付け
    Set ws = ThisWorkbook.Sheets("Sheet1") ' 適切なシート名を指定
    customerName = ws.Range("A1").Value ' 取引先の顧客名が A1 セルにあると仮定

    ' Word ドキュメントを作成
    Set wordDoc = wordApp.Documents.Add

    ' Word ドキュメントに内容を追加（例：「資料送付状」）
    wordDoc.Content.Text = "尊敬する" & customerName & "様" & vbCrLf & _
                           "お世話になっております。" & vbCrLf & _
                           "資料をお送りいたします。" & vbCrLf & vbCrLf & _
                           "敬具" & vbCrLf & _
                           "（差出人）"

    ' Word ドキュメントを保存
    documentPath = "C:\Users\YourUsername\Documents\送付状_" & customerName & ".docx"
    wordDoc.SaveAs documentPath

    ' Word ドキュメントを印刷
    wordDoc.PrintOut

    ' Word アプリケーションを終了
    wordApp.Quit

    ' 解放
    Set wordDoc = Nothing
    Set wordApp = Nothing
End Sub

Sub 議事録メモ作成()
    Dim wordApp As Object
    Dim wordDoc As Object
    Dim memoText As String
    Dim memoPath As String
    Dim destinationPath As String
    Dim ws As Worksheet
    Dim lastRow As Long

    ' Wordアプリケーションの新規作成
    Set wordApp = CreateObject("Word.Application")
    wordApp.Visible = True ' Wordを表示

    ' シートと Word ドキュメントの関連付け
    Set ws = ThisWorkbook.Sheets("Sheet1") ' 適切なシート名を指定
    lastRow = ws.Cells(ws.Rows.Count, "A").End(xlUp).Row ' データが入力されている最終行を取得

    ' Word ドキュメントを作成
    Set wordDoc = wordApp.Documents.Add

    ' メモ内容を取得
    memoText = ""
    For i = 1 To lastRow
        memoText = memoText & ws.Cells(i, 1).Value & vbCrLf
    Next i

    ' Word ドキュメントに内容を追加
    wordDoc.Content.Text = "議事録メモ" & vbCrLf & vbCrLf & memoText

    ' Word ドキュメントを保存
    memoPath = "C:\Users\YourUsername\Documents\議事録メモ.docx"
    wordDoc.SaveAs memoPath

    ' Word ドキュメントを最前面に表示
    wordApp.Activate

    ' Word アプリケーションを終了
    wordApp.Quit

    ' 解放
    Set wordDoc = Nothing
    Set wordApp = Nothing
End Sub

Sub Word連携_差し込み印刷()
    Dim wordApp As Object
    Dim wordDoc As Object
    Dim ws As Worksheet
    Dim dataSourcePath As String
    Dim letterPath As String

    ' Wordアプリケーションの新規作成
    Set wordApp = CreateObject("Word.Application")
    wordApp.Visible = True ' Wordを表示

    ' シートと Word ドキュメントの関連付け
    Set ws = ThisWorkbook.Sheets("Sheet1") ' 適切なシート名を指定

    ' メールマージのデータソースのパス
    dataSourcePath = "C:\Users\YourUsername\Documents\DataSource.xlsx" ' データソースのExcelファイルを指定

    ' ワード文書のテンプレートパス
    letterPath = "C:\Users\YourUsername\Documents\LetterTemplate.docx" ' ワード文書のテンプレートを指定

    ' メールマージ実行
    Set wordDoc = wordApp.Documents.Add(dataSourcePath)
    wordDoc.MailMerge.OpenDataSource Name:=dataSourcePath, ConfirmConversions:=False, ReadOnly:=False, LinkToSource:=True, _
        AddToRecentFiles:=False, PasswordDocument:=vbNullString, PasswordTemplate:=vbNullString, WritePasswordDocument:=vbNullString, _
        WritePasswordTemplate:=vbNullString, Revert:=False, Format:=wdOpenFormatAuto, Connection:=vbNullString, SQLStatement:=vbNullString, _
        SQLStatement1:=vbNullString, SubType:=wdMergeSubTypeAccess
    wordDoc.MailMerge.MainDocumentType = wdFormLetters
    wordDoc.MailMerge.OpenHeaderSource Name:=letterPath, LinkToSource:=True, Connection:=vbNullString, SQLStatement:=vbNullString, _
        SubType:=wdMergeSubTypeAccess

    ' 差し込み印刷
    wordDoc.MailMerge.Execute

    ' Word アプリケーションを終了
    wordApp.Quit

    ' 解放
    Set wordDoc = Nothing
    Set wordApp = Nothing
End Sub

Sub フォルダ作成()
    Dim folderPath As String
    Dim folderName As String
    Dim newFolderPath As String
    Dim fso As Object

    ' フォルダのパスと作成するフォルダ名を指定
    folderPath = "C:\Users\YourUsername\Documents"
    folderName = "NewFolder" ' 適切なフォルダ名を指定

    ' FSO (ファイルシステムオブジェクト) を作成
    Set fso = CreateObject("Scripting.FileSystemObject")

    ' 新しいフォルダのパスを作成
    newFolderPath = folderPath & "\" & folderName

    ' フォルダが存在するかチェック
    If Not fso.FolderExists(newFolderPath) Then
        ' フォルダを作成
        fso.CreateFolder newFolderPath
        MsgBox "フォルダが作成されました。"
    Else
        MsgBox "フォルダは既に存在します。"
    End If

    ' FSO を解放
    Set fso = Nothing
End Sub

Sub フォルダ内容取得()
    Dim folderPath As String
    Dim fso As Object
    Dim folder As Object
    Dim subFolder As Object
    Dim file As Object
    Dim ws As Worksheet
    Dim i As Integer

    ' フォルダのパスを指定
    folderPath = "C:\Users\YourUsername\Documents\FolderContent" ' 適切なフォルダパスを指定

    ' FSO (ファイルシステムオブジェクト) を作成
    Set fso = CreateObject("Scripting.FileSystemObject")

    ' 新しいワークシートを作成
    Set ws = Worksheets.Add

    ' フォルダ内の各要素に対して処理
    Set folder = fso.GetFolder(folderPath)

    ' ファイルのリストをワークシートに出力
    ws.Range("A1").Value = "ファイル名"
    i = 2
    For Each file In folder.Files
        ws.Range("A" & i).Value = file.Name
        i = i + 1
    Next file

    ' 特定のサブフォルダのリストをワークシートに出力
    ws.Range("B1").Value = "サブフォルダ名"
    i = 2
    For Each subFolder In folder.SubFolders
        ws.Range("B" & i).Value = subFolder.Name
        i = i + 1
    Next subFolder

    ' FSO を解放
    Set fso = Nothing
End Sub