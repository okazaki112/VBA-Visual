Attribute VB_Name = "TestAllBlocks"
' ============================================
' VBA 可视化编辑器 - 所有积木类型测试代码
' ============================================

Option Explicit

' ==================== 主测试过程 ====================
Sub TestAllBlocks()
    ' ========== 基础积木 ==========
    
    ' 变量声明
    Dim myVar As Variant
    Dim intVar As Integer
    Dim strVar As String
    Dim dblVar As Double
    Dim boolVar As Boolean
    Dim objVar As Object
    
    ' 常量声明
    Const MY_CONST As String = "Hello"
    Const MAX_VALUE As Integer = 100
    Const PI As Double = 3.14159
    
    ' 赋值语句
    myVar = "Test Value"
    intVar = 42
    dblVar = 3.14
    boolVar = True
    
    ' 注释
    ' 这是一个单行注释
    
    ' Debug.Print
    Debug.Print "Debug output: " & myVar
    Debug.Print intVar
    
    ' ========== 流程控制积木 ==========
    
    ' If 条件语句
    If intVar > 10 Then
        strVar = "Greater than 10"
    End If
    
    ' If-Else 条件语句
    If intVar > 50 Then
        strVar = "Large"
    Else
        strVar = "Small"
    End If
    
    ' For 循环
    Dim i As Integer
    For i = 1 To 10 Step 1
        Debug.Print "Loop iteration: " & i
    Next i
    
    ' For Each 循环
    Dim cell As Range
    For Each cell In Range("A1:A5")
        cell.Value = "Test"
    Next cell
    
    ' Do While 循环
    Dim counter As Integer
    counter = 0
    Do While counter < 5
        counter = counter + 1
    Loop
    
    ' ========== Excel 操作积木 ==========
    
    ' 读取单元格
    Dim cellValue As Variant
    cellValue = Range("A1").Value
    cellValue = Cells(1, 1).Value
    
    ' 写入单元格
    Range("B1").Value = "Hello World"
    Cells(2, 2).Value = 123
    
    ' 选择区域
    Range("A1:B10").Select
    
    ' 激活工作表
    Sheets("Sheet1").Activate
    
    ' 设置公式
    Range("C1").Formula = "=SUM(A1:A10)"
    
    ' ========== 交互积木 ==========
    
    ' 消息框
    MsgBox "Operation completed!", vbInformation, "Status"
    Dim result As VbMsgBoxResult
    result = MsgBox("Continue?", vbYesNo + vbQuestion, "Confirm")
    
    ' 输入框
    Dim userInput As String
    userInput = InputBox("Please enter a value:", "Input", "default")
    
    ' ========== 文件操作积木 ==========
    
    ' 打开文件对话框
    Dim filePath As Variant
    filePath = Application.GetOpenFilename("Excel Files (*.xlsx),*.xlsx", , "Select File", , False)
    
    ' 保存文件对话框
    Dim savePath As Variant
    savePath = Application.GetSaveAsFilename("Report.xlsx", "Excel Files (*.xlsx),*.xlsx", , "Save File")
    
    ' ========== 错误处理积木 ==========
    
    On Error Resume Next
    ' 可能出错的代码
    On Error GoTo 0
    
    ' ========== 数组积木 ==========
    
    ' 数组声明
    Dim myArray(10) As Variant
    Dim dynamicArray() As String
    ReDim dynamicArray(5)
    
    ' ========== 字符串处理积木 ==========
    
    ' 字符串拼接
    Dim fullName As String
    fullName = "John" & " " & "Doe"
    
    ' 字符串截取
    Dim subStr As String
    subStr = Mid("Hello World", 1, 5)
    subStr = Left("Hello World", 5)
    subStr = Right("Hello World", 5)
    
    ' 字符串长度
    Dim strLen As Integer
    strLen = Len("Hello World")
    
    ' 字符串替换
    Dim replaced As String
    replaced = Replace("Hello World", "World", "VBA")
    
    ' 去除空格
    Dim trimmed As String
    trimmed = Trim("  Hello  ")
    trimmed = LTrim("  Hello  ")
    trimmed = RTrim("  Hello  ")
    
    ' ========== Set 对象赋值 ==========
    
    Dim ws As Worksheet
    Set ws = ActiveSheet
    
    Dim rng As Range
    Set rng = Range("A1:B10")
    
    ' ========== Call 调用 ==========
    
    Call HelperSub
    HelperSub
    
    ' ========== Exit 语句 ==========
    
    ' Exit Sub
    ' Exit Function
    ' Exit For
    ' Exit Do
    
    ' ========== 条件格式 ==========
    
    Range("A1:A10").FormatConditions.Add xlCellValue, xlGreater, "50"
    Range("A1:A10").FormatConditions(1).Interior.Color = vbYellow
    
    ' 清除条件格式
    Range("A1:A10").FormatConditions.Delete
    
    MsgBox "All tests completed!", vbInformation
    
End Sub

' ==================== 辅助过程 ====================
Private Sub HelperSub()
    Debug.Print "Helper sub called"
End Sub

' ==================== 私有函数 ====================
Private Function CalculateSum(a As Integer, b As Integer) As Integer
    CalculateSum = a + b
End Function

' ==================== 带参数的函数 ====================
Public Function GetGreeting(name As String) As String
    GetGreeting = "Hello, " & name & "!"
End Function

' ==================== 图表操作示例 ====================
Sub CreateChartExample()
    Dim cht As Chart
    Set cht = ActiveSheet.Shapes.AddChart(xlColumnClustered, 100, 100, 300, 200).Chart
    cht.SetSourceData Source:=Range("A1:B10"), PlotBy:=xlColumns
    cht.HasTitle = True
    cht.ChartTitle.Text = "Sample Chart"
End Sub

' ==================== 数据透视表示例 ====================
Sub CreatePivotTableExample()
    Dim pvt As PivotTable
    Dim pvtCache As PivotCache
    Set pvtCache = ActiveWorkbook.PivotCaches.Create(xlDatabase, Range("A1:D100"))
    Set pvt = pvtCache.CreatePivotTable(Range("F1"), "PivotTable1")
    
    With pvt.PivotFields("Category")
        .Orientation = xlRowField
        .Position = 1
    End With
    
    pvt.RefreshTable
End Sub
