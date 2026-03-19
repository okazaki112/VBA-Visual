import { BlockType, BlockCategory, type BlockDefinition } from '@/types'

// 积木定义库
export const blockDefinitions: BlockDefinition[] = [
  // ==================== 基础积木 ====================
  {
    id: 'block-variable-declare',
    type: BlockType.VARIABLE_DECLARE,
    category: BlockCategory.BASIC,
    label: '变量声明',
    description: '声明一个变量',
    icon: 'DataLine',
    color: '#6366f1',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '变量名', defaultValue: 'myVar', placeholder: '请输入变量名' },
      { id: 'varType', name: 'varType', type: 'select', label: '数据类型', defaultValue: 'Variant', options: [
        { label: 'Variant', value: 'Variant' },
        { label: 'Integer', value: 'Integer' },
        { label: 'Long', value: 'Long' },
        { label: 'Double', value: 'Double' },
        { label: 'String', value: 'String' },
        { label: 'Boolean', value: 'Boolean' },
        { label: 'Date', value: 'Date' },
        { label: 'Object', value: 'Object' }
      ]}
    ],
    codeTemplate: 'Dim {{varName}} As {{varType}}'
  },

  {
    id: 'block-constant-declare',
    type: BlockType.CONSTANT_DECLARE,
    category: BlockCategory.BASIC,
    label: '常量声明',
    description: '声明一个常量',
    icon: 'PriceTag',
    color: '#6366f1',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'constName', name: 'constName', type: 'text', label: '常量名', defaultValue: 'MY_CONST', placeholder: '请输入常量名' },
      { id: 'constType', name: 'constType', type: 'select', label: '数据类型', defaultValue: '', options: [
        { label: '自动推断', value: '' },
        { label: 'Integer', value: 'Integer' },
        { label: 'Long', value: 'Long' },
        { label: 'Double', value: 'Double' },
        { label: 'String', value: 'String' },
        { label: 'Boolean', value: 'Boolean' },
        { label: 'Date', value: 'Date' }
      ]},
      { id: 'constValue', name: 'constValue', type: 'text', label: '常量值', defaultValue: '', placeholder: '请输入常量值' }
    ],
    codeTemplate: 'Const {{constName}}{{#if constType}} As {{constType}}{{/if}} = {{constValue}}'
  },

  {
    id: 'block-assignment',
    type: BlockType.ASSIGNMENT,
    category: BlockCategory.BASIC,
    label: '赋值语句',
    description: '给变量赋值',
    icon: 'Right',
    color: '#6366f1',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '变量名', defaultValue: '', placeholder: '请输入变量名' },
      { id: 'value', name: 'value', type: 'expression', label: '值', defaultValue: '', placeholder: '请输入值或表达式' }
    ],
    codeTemplate: '{{varName}} = {{value}}'
  },

  {
    id: 'block-comment',
    type: BlockType.COMMENT,
    category: BlockCategory.BASIC,
    label: '注释',
    description: '添加代码注释',
    icon: 'ChatLineSquare',
    color: '#6366f1',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: false, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: false, position: 'bottom' }],
    properties: [
      { id: 'comment', name: 'comment', type: 'text', label: '注释内容', defaultValue: '', placeholder: '请输入注释内容' }
    ],
    codeTemplate: "' {{comment}}"
  },

  {
    id: 'block-debug-print',
    type: BlockType.COMMENT,
    category: BlockCategory.BASIC,
    label: 'Debug.Print',
    description: '输出调试信息到立即窗口',
    icon: 'Monitor',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: false, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: false, position: 'bottom' }],
    properties: [
      { id: 'expression', name: 'expression', type: 'expression', label: '输出内容', defaultValue: '', placeholder: '变量名或表达式' }
    ],
    codeTemplate: 'Debug.Print {{expression}}'
  },

  // ==================== 流程控制积木 ====================
  {
    id: 'block-if-statement',
    type: BlockType.IF_STATEMENT,
    category: BlockCategory.CONTROL_FLOW,
    label: 'If 条件',
    description: '条件判断语句',
    icon: 'Share',
    color: '#f59e0b',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [
      { id: 'true', name: 'True', type: 'flow', required: false, position: 'bottom' },
      { id: 'false', name: 'False', type: 'flow', required: false, position: 'bottom' }
    ],
    properties: [
      { id: 'condition', name: 'condition', type: 'expression', label: '条件表达式', defaultValue: '', placeholder: '例如: x > 10' },
      { id: 'thenCode', name: 'thenCode', type: 'code', label: 'Then 代码', defaultValue: '', placeholder: '条件为真时执行的代码（每行一条语句）' }
    ],
    codeTemplate: `If {{condition}} Then
{{thenCode}}
End If`
  },

  {
    id: 'block-if-else-statement',
    type: BlockType.IF_ELSE_STATEMENT,
    category: BlockCategory.CONTROL_FLOW,
    label: 'If-Else 条件',
    description: '双分支条件判断',
    icon: 'Share',
    color: '#f59e0b',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [
      { id: 'true', name: 'True', type: 'flow', required: false, position: 'bottom' },
      { id: 'false', name: 'False', type: 'flow', required: false, position: 'bottom' }
    ],
    properties: [
      { id: 'condition', name: 'condition', type: 'expression', label: '条件表达式', defaultValue: '', placeholder: '例如: x > 10' },
      { id: 'thenCode', name: 'thenCode', type: 'code', label: 'Then 代码', defaultValue: '', placeholder: '条件为真时执行的代码' },
      { id: 'elseCode', name: 'elseCode', type: 'code', label: 'Else 代码', defaultValue: '', placeholder: '条件为假时执行的代码' }
    ],
    codeTemplate: `If {{condition}} Then
{{thenCode}}
Else
{{elseCode}}
End If`
  },

  {
    id: 'block-for-loop',
    type: BlockType.FOR_LOOP,
    category: BlockCategory.CONTROL_FLOW,
    label: 'For 循环',
    description: '计数循环',
    icon: 'Refresh',
    color: '#f59e0b',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'counter', name: 'counter', type: 'text', label: '计数变量', defaultValue: 'i', placeholder: '例如: i' },
      { id: 'start', name: 'start', type: 'number', label: '起始值', defaultValue: 1 },
      { id: 'end', name: 'end', type: 'number', label: '结束值', defaultValue: 10 },
      { id: 'step', name: 'step', type: 'number', label: '步长', defaultValue: 1 },
      { id: 'loopBody', name: 'loopBody', type: 'code', label: '循环体代码', defaultValue: '', placeholder: '循环执行的代码（每行一条语句）' }
    ],
    codeTemplate: `For {{counter}} = {{start}} To {{end}}{{#if (neq step 1)}} Step {{step}}{{/if}}
{{loopBody}}
Next {{counter}}`
  },

  {
    id: 'block-for-each-loop',
    type: BlockType.FOR_EACH_LOOP,
    category: BlockCategory.CONTROL_FLOW,
    label: 'For Each 循环',
    description: '遍历集合',
    icon: 'List',
    color: '#f59e0b',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'element', name: 'element', type: 'text', label: '元素变量', defaultValue: 'item', placeholder: '例如: cell' },
      { id: 'collection', name: 'collection', type: 'expression', label: '集合', defaultValue: '', placeholder: '例如: Range("A1:A10")' },
      { id: 'loopBody', name: 'loopBody', type: 'code', label: '循环体代码', defaultValue: '', placeholder: '循环执行的代码（每行一条语句）' }
    ],
    codeTemplate: `For Each {{element}} In {{collection}}
{{loopBody}}
Next {{element}}`
  },

  {
    id: 'block-do-while-loop',
    type: BlockType.DO_WHILE_LOOP,
    category: BlockCategory.CONTROL_FLOW,
    label: 'Do While 循环',
    description: '条件循环',
    icon: 'RefreshRight',
    color: '#f59e0b',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'condition', name: 'condition', type: 'expression', label: '条件表达式', defaultValue: '', placeholder: '例如: x < 100' },
      { id: 'loopBody', name: 'loopBody', type: 'code', label: '循环体代码', defaultValue: '', placeholder: '循环执行的代码（每行一条语句）' }
    ],
    codeTemplate: `Do While {{condition}}
{{loopBody}}
Loop`
  },

  // ==================== Excel 操作积木 ====================
  {
    id: 'block-cell-read',
    type: BlockType.CELL_READ,
    category: BlockCategory.EXCEL,
    label: '读取单元格',
    description: '读取单元格的值',
    icon: 'Grid',
    color: '#10b981',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'refType', name: 'refType', type: 'select', label: '引用方式', defaultValue: 'Range', options: [
        { label: 'Range (如 A1)', value: 'Range' },
        { label: 'Cells (行,列)', value: 'Cells' }
      ]},
      { id: 'cellRef', name: 'cellRef', type: 'text', label: '单元格引用', defaultValue: 'A1', placeholder: 'Range方式: A1 | Cells方式: 1, 1' },
      { id: 'varName', name: 'varName', type: 'text', label: '存储变量', defaultValue: 'value', placeholder: '存储读取值的变量名' }
    ],
    codeTemplate: '{{varName}} = {{#if (eq refType "Range")}}Range("{{cellRef}}"){{else}}Cells({{cellRef}}){{/if}}.Value'
  },

  {
    id: 'block-cell-write',
    type: BlockType.CELL_WRITE,
    category: BlockCategory.EXCEL,
    label: '写入单元格',
    description: '写入值到单元格',
    icon: 'EditPen',
    color: '#10b981',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'refType', name: 'refType', type: 'select', label: '引用方式', defaultValue: 'Range', options: [
        { label: 'Range (如 A1)', value: 'Range' },
        { label: 'Cells (行,列)', value: 'Cells' }
      ]},
      { id: 'cellRef', name: 'cellRef', type: 'text', label: '单元格引用', defaultValue: 'A1', placeholder: 'Range方式: A1 | Cells方式: 1, 1' },
      { id: 'value', name: 'value', type: 'expression', label: '值', defaultValue: '', placeholder: '要写入的值或表达式' }
    ],
    codeTemplate: '{{#if (eq refType "Range")}}Range("{{cellRef}}"){{else}}Cells({{cellRef}}){{/if}}.Value = {{value}}'
  },

  {
    id: 'block-range-select',
    type: BlockType.RANGE_SELECT,
    category: BlockCategory.EXCEL,
    label: '选择区域',
    description: '选择单元格区域',
    icon: 'Select',
    color: '#10b981',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'rangeRef', name: 'rangeRef', type: 'text', label: '区域引用', defaultValue: 'A1:B10', placeholder: '例如: A1:B10' }
    ],
    codeTemplate: 'Range("{{rangeRef}}").Select'
  },

  {
    id: 'block-sheet-activate',
    type: BlockType.SHEET_ACTIVATE,
    category: BlockCategory.EXCEL,
    label: '激活工作表',
    description: '激活指定工作表',
    icon: 'Document',
    color: '#10b981',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'sheetName', name: 'sheetName', type: 'text', label: '工作表名', defaultValue: 'Sheet1', placeholder: '例如: Sheet1' }
    ],
    codeTemplate: 'Sheets("{{sheetName}}").Activate'
  },

  {
    id: 'block-formula-set',
    type: BlockType.FORMULA_SET,
    category: BlockCategory.EXCEL,
    label: '设置公式',
    description: '设置单元格公式',
    icon: 'Calculator',
    color: '#10b981',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'cellRef', name: 'cellRef', type: 'text', label: '单元格引用', defaultValue: 'A1', placeholder: '例如: A1' },
      { id: 'formula', name: 'formula', type: 'formula', label: '公式', defaultValue: '=SUM(B:B)', placeholder: '例如: =SUM(A1:A10)' }
    ],
    codeTemplate: 'Range("{{cellRef}}").Formula = "{{formula}}"'
  },

  // ==================== 图表操作积木 ====================
  {
    id: 'block-chart-create',
    type: BlockType.CHART_CREATE,
    category: BlockCategory.EXCEL,
    label: '创建图表',
    description: '创建一个新的图表',
    icon: 'TrendCharts',
    color: '#0ea5e9',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '图表变量', defaultValue: 'cht', placeholder: '存储图表对象的变量名' },
      { id: 'chartType', name: 'chartType', type: 'select', label: '图表类型', defaultValue: 'xlColumnClustered', options: [
        { label: '柱状图', value: 'xlColumnClustered' },
        { label: '条形图', value: 'xlBarClustered' },
        { label: '折线图', value: 'xlLine' },
        { label: '饼图', value: 'xlPie' },
        { label: '面积图', value: 'xlArea' },
        { label: '散点图', value: 'xlXYScatter' },
        { label: '雷达图', value: 'xlRadar' }
      ]},
      { id: 'left', name: 'left', type: 'number', label: '左边距', defaultValue: 100 },
      { id: 'top', name: 'top', type: 'number', label: '上边距', defaultValue: 100 },
      { id: 'width', name: 'width', type: 'number', label: '宽度', defaultValue: 300 },
      { id: 'height', name: 'height', type: 'number', label: '高度', defaultValue: 200 }
    ],
    codeTemplate: `Dim {{varName}} As Chart
Set {{varName}} = ActiveSheet.Shapes.AddChart({{chartType}}, {{left}}, {{top}}, {{width}}, {{height}}).Chart`
  },

  {
    id: 'block-chart-set-source',
    type: BlockType.CHART_SET_SOURCE,
    category: BlockCategory.EXCEL,
    label: '设置图表数据源',
    description: '设置图表的数据源范围',
    icon: 'DataLine',
    color: '#0ea5e9',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'chartName', name: 'chartName', type: 'expression', label: '图表变量', defaultValue: 'cht', placeholder: '图表对象变量名' },
      { id: 'sourceRange', name: 'sourceRange', type: 'text', label: '数据源范围', defaultValue: 'A1:B10', placeholder: '例如: A1:B10' },
      { id: 'plotBy', name: 'plotBy', type: 'select', label: '绘图方式', defaultValue: 'xlColumns', options: [
        { label: '按列', value: 'xlColumns' },
        { label: '按行', value: 'xlRows' }
      ]}
    ],
    codeTemplate: '{{chartName}}.SetSourceData Source:=Range("{{sourceRange}}"), PlotBy:={{plotBy}}'
  },

  {
    id: 'block-chart-set-title',
    type: BlockType.CHART_SET_TITLE,
    category: BlockCategory.EXCEL,
    label: '设置图表标题',
    description: '设置图表的标题文字',
    icon: 'Edit',
    color: '#0ea5e9',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'chartName', name: 'chartName', type: 'expression', label: '图表变量', defaultValue: 'cht', placeholder: '图表对象变量名' },
      { id: 'title', name: 'title', type: 'text', label: '标题文字', defaultValue: '图表标题', placeholder: '图表标题' },
      { id: 'showTitle', name: 'showTitle', type: 'boolean', label: '显示标题', defaultValue: true }
    ],
    codeTemplate: `{{chartName}}.HasTitle = {{showTitle}}
{{#if showTitle}}{{chartName}}.ChartTitle.Text = "{{title}}"{{/if}}`
  },

  {
    id: 'block-chart-delete',
    type: BlockType.CHART_DELETE,
    category: BlockCategory.EXCEL,
    label: '删除图表',
    description: '删除指定的图表',
    icon: 'Delete',
    color: '#0ea5e9',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'chartName', name: 'chartName', type: 'expression', label: '图表变量', defaultValue: 'cht', placeholder: '图表对象变量名' }
    ],
    codeTemplate: '{{chartName}}.Parent.Delete'
  },

  // ==================== 条件格式积木 ====================
  {
    id: 'block-conditional-format',
    type: BlockType.CONDITIONAL_FORMAT,
    category: BlockCategory.EXCEL,
    label: '条件格式',
    description: '添加条件格式规则',
    icon: 'PriceTag',
    color: '#f59e0b',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'range', name: 'range', type: 'text', label: '应用范围', defaultValue: 'A1:A10', placeholder: '例如: A1:A10' },
      { id: 'formatType', name: 'formatType', type: 'select', label: '格式类型', defaultValue: 'xlCellValue', options: [
        { label: '单元格值', value: 'xlCellValue' },
        { label: '公式', value: 'xlExpression' }
      ]},
      { id: 'operator', name: 'operator', type: 'select', label: '运算符', defaultValue: 'xlGreater', options: [
        { label: '大于', value: 'xlGreater' },
        { label: '小于', value: 'xlLess' },
        { label: '等于', value: 'xlEqual' },
        { label: '大于等于', value: 'xlGreaterEqual' },
        { label: '小于等于', value: 'xlLessEqual' },
        { label: '不等于', value: 'xlNotEqual' },
        { label: '介于', value: 'xlBetween' },
        { label: '不介于', value: 'xlNotBetween' }
      ]},
      { id: 'value1', name: 'value1', type: 'text', label: '条件值1', defaultValue: '0', placeholder: '比较值或公式' },
      { id: 'value2', name: 'value2', type: 'text', label: '条件值2', defaultValue: '', placeholder: '介于时使用' },
      { id: 'interiorColor', name: 'interiorColor', type: 'select', label: '背景色', defaultValue: 'vbYellow', options: [
        { label: '黄色', value: 'vbYellow' },
        { label: '红色', value: 'vbRed' },
        { label: '绿色', value: 'vbGreen' },
        { label: '蓝色', value: 'vbBlue' },
        { label: '橙色', value: 'vbMagenta' },
        { label: '青色', value: 'vbCyan' }
      ]}
    ],
    codeTemplate: `Range("{{range}}").FormatConditions.Add {{formatType}}, {{operator}}, "{{value1}}"{{#if value2}}, "{{value2}}"{{/if}}
Range("{{range}}").FormatConditions(1).Interior.Color = {{interiorColor}}`
  },

  {
    id: 'block-conditional-format-clear',
    type: BlockType.CONDITIONAL_FORMAT_CLEAR,
    category: BlockCategory.EXCEL,
    label: '清除条件格式',
    description: '清除指定范围的条件格式',
    icon: 'Delete',
    color: '#f59e0b',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'range', name: 'range', type: 'text', label: '清除范围', defaultValue: 'A1:A10', placeholder: '例如: A1:A10' }
    ],
    codeTemplate: 'Range("{{range}}").FormatConditions.Delete'
  },

  // ==================== 数据透视表积木 ====================
  {
    id: 'block-pivot-create',
    type: BlockType.PIVOT_CREATE,
    category: BlockCategory.EXCEL,
    label: '创建数据透视表',
    description: '创建新的数据透视表',
    icon: 'Grid',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '透视表变量', defaultValue: 'pvt', placeholder: '存储透视表的变量名' },
      { id: 'sourceRange', name: 'sourceRange', type: 'text', label: '数据源范围', defaultValue: 'A1:D100', placeholder: '例如: A1:D100' },
      { id: 'destRange', name: 'destRange', type: 'text', label: '目标位置', defaultValue: 'F1', placeholder: '透视表放置位置' },
      { id: 'tableName', name: 'tableName', type: 'text', label: '表名称', defaultValue: 'PivotTable1', placeholder: '透视表名称' }
    ],
    codeTemplate: `Dim {{varName}} As PivotTable
Dim {{varName}}Cache As PivotCache
Set {{varName}}Cache = ActiveWorkbook.PivotCaches.Create(xlDatabase, Range("{{sourceRange}}"))
Set {{varName}} = {{varName}}Cache.CreatePivotTable(Range("{{destRange}}"), "{{tableName}}")`
  },

  {
    id: 'block-pivot-add-field',
    type: BlockType.PIVOT_ADD_FIELD,
    category: BlockCategory.EXCEL,
    label: '添加透视表字段',
    description: '向数据透视表添加字段',
    icon: 'Plus',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'pivotName', name: 'pivotName', type: 'expression', label: '透视表变量', defaultValue: 'pvt', placeholder: '透视表对象变量名' },
      { id: 'fieldName', name: 'fieldName', type: 'text', label: '字段名', defaultValue: '', placeholder: '要添加的字段名' },
      { id: 'fieldType', name: 'fieldType', type: 'select', label: '字段类型', defaultValue: 'xlRowField', options: [
        { label: '行字段', value: 'xlRowField' },
        { label: '列字段', value: 'xlColumnField' },
        { label: '数据字段', value: 'xlDataField' },
        { label: '页字段', value: 'xlPageField' }
      ]},
      { id: 'position', name: 'position', type: 'number', label: '位置', defaultValue: 1 }
    ],
    codeTemplate: `With {{pivotName}}.PivotFields("{{fieldName}}")
    .Orientation = {{fieldType}}
    .Position = {{position}}
End With`
  },

  {
    id: 'block-pivot-refresh',
    type: BlockType.PIVOT_REFRESH,
    category: BlockCategory.EXCEL,
    label: '刷新数据透视表',
    description: '刷新数据透视表数据',
    icon: 'Refresh',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'pivotName', name: 'pivotName', type: 'expression', label: '透视表变量', defaultValue: 'pvt', placeholder: '透视表对象变量名' }
    ],
    codeTemplate: '{{pivotName}}.RefreshTable'
  },

  {
    id: 'block-pivot-delete',
    type: BlockType.PIVOT_DELETE,
    category: BlockCategory.EXCEL,
    label: '删除数据透视表',
    description: '删除指定的数据透视表',
    icon: 'Delete',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'pivotName', name: 'pivotName', type: 'expression', label: '透视表变量', defaultValue: 'pvt', placeholder: '透视表对象变量名' }
    ],
    codeTemplate: '{{pivotName}}.TableRange2.Clear'
  },

  // ==================== 交互积木 ====================
  {
    id: 'block-msgbox',
    type: BlockType.MSGBOX,
    category: BlockCategory.INTERACTION,
    label: '消息框',
    description: '显示消息对话框',
    icon: 'ChatDotRound',
    color: '#ec4899',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'message', name: 'message', type: 'expression', label: '消息内容', defaultValue: '"Hello World"', placeholder: '文本或变量名' },
      { id: 'buttons', name: 'buttons', type: 'select', label: '按钮类型', defaultValue: 'vbOKOnly', options: [
        { label: '确定', value: 'vbOKOnly' },
        { label: '确定/取消', value: 'vbOKCancel' },
        { label: '是/否', value: 'vbYesNo' },
        { label: '是/否/取消', value: 'vbYesNoCancel' }
      ]},
      { id: 'icon', name: 'icon', type: 'select', label: '图标类型', defaultValue: '', options: [
        { label: '无图标', value: '' },
        { label: '严重(红叉)', value: 'vbCritical' },
        { label: '问号', value: 'vbQuestion' },
        { label: '警告(黄叹号)', value: 'vbExclamation' },
        { label: '信息(蓝i)', value: 'vbInformation' }
      ]},
      { id: 'title', name: 'title', type: 'text', label: '标题', defaultValue: '', placeholder: '对话框标题' },
      { id: 'returnVar', name: 'returnVar', type: 'text', label: '返回变量', defaultValue: '', placeholder: '存储返回值的变量名(可选)' }
    ],
    codeTemplate: '{{#if returnVar}}{{returnVar}} = {{/if}}MsgBox({{message}}, {{buttons}}{{#if icon}} + {{icon}}{{/if}}{{#if title}}, "{{title}}"{{/if}})'
  },

  {
    id: 'block-inputbox',
    type: BlockType.INPUTBOX,
    category: BlockCategory.INTERACTION,
    label: '输入框',
    description: '获取用户输入',
    icon: 'Edit',
    color: '#ec4899',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'prompt', name: 'prompt', type: 'text', label: '提示文字', defaultValue: '请输入:', placeholder: '提示用户输入的文字' },
      { id: 'title', name: 'title', type: 'text', label: '标题', defaultValue: '', placeholder: '对话框标题' },
      { id: 'default', name: 'default', type: 'text', label: '默认值', defaultValue: '', placeholder: '输入框预填充的文本（可选）' },
      { id: 'varName', name: 'varName', type: 'text', label: '存储变量', defaultValue: 'userInput', placeholder: '存储输入值的变量名' }
    ],
    codeTemplate: '{{varName}} = InputBox("{{prompt}}", "{{title}}", "{{default}}" )'
  },

  // ==================== 文件操作积木 ====================
  {
    id: 'block-file-open-dialog',
    type: BlockType.FILE_OPEN_DIALOG,
    category: BlockCategory.FILE,
    label: '打开文件对话框',
    description: '显示打开文件对话框',
    icon: 'FolderOpened',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '存储变量', defaultValue: 'filePath', placeholder: '存储文件路径的变量名' },
      { id: 'filter', name: 'filter', type: 'text', label: '文件过滤器', defaultValue: 'Excel Files (*.xlsx),*.xlsx', placeholder: '文件类型过滤' },
      { id: 'title', name: 'title', type: 'text', label: '对话框标题', defaultValue: '', placeholder: '对话框标题(可选)' },
      { id: 'multiSelect', name: 'multiSelect', type: 'boolean', label: '允许多选', defaultValue: false }
    ],
    codeTemplate: '{{varName}} = Application.GetOpenFilename("{{filter}}", , {{#if title}}"{{title}}"{{else}}"打开文件"{{/if}}, , {{#if multiSelect}}True{{else}}False{{/if}})'
  },

  {
    id: 'block-file-save-dialog',
    type: BlockType.FILE_SAVE_DIALOG,
    category: BlockCategory.FILE,
    label: '保存文件对话框',
    description: '显示保存文件对话框',
    icon: 'DocumentChecked',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '存储变量', defaultValue: 'filePath', placeholder: '存储文件路径的变量名' },
      { id: 'defaultName', name: 'defaultName', type: 'text', label: '默认文件名', defaultValue: '', placeholder: '默认文件名(可选)' },
      { id: 'filter', name: 'filter', type: 'text', label: '文件过滤器', defaultValue: 'Excel Files (*.xlsx),*.xlsx', placeholder: '文件类型过滤' },
      { id: 'title', name: 'title', type: 'text', label: '对话框标题', defaultValue: '', placeholder: '对话框标题(可选)' }
    ],
    codeTemplate: '{{varName}} = Application.GetSaveAsFilename({{#if defaultName}}"{{defaultName}}"{{else}}{{/if}}, "{{filter}}", , {{#if title}}"{{title}}"{{else}}"保存文件"{{/if}})'
  },

  // ==================== 高级积木 ====================
  // Sub 过程结束
  {
    id: 'block-end-sub',
    type: BlockType.SUB_DEFINE,
    category: BlockCategory.ADVANCED,
    label: 'End Sub',
    description: 'Sub 过程结束',
    icon: 'DocumentCopy',
    color: '#ef4444',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [],
    properties: [],
    codeTemplate: 'End Sub'
  },

  // With 语句块
  {
    id: 'block-with-statement',
    type: BlockType.WITH_STATEMENT,
    category: BlockCategory.CONTROL_FLOW,
    label: 'With 语句',
    description: 'With 语句块，简化对象属性设置',
    icon: 'Connection',
    color: '#f59e0b',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'object', name: 'object', type: 'expression', label: '对象', defaultValue: '', placeholder: '例如: Range("A1")' }
    ],
    codeTemplate: `With {{object}}
End With`
  },

  // With 属性赋值
  {
    id: 'block-with-property-assignment',
    type: BlockType.ASSIGNMENT,
    category: BlockCategory.CONTROL_FLOW,
    label: 'With 属性赋值',
    description: '在 With 块内设置属性',
    icon: 'EditPen',
    color: '#f59e0b',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'property', name: 'property', type: 'text', label: '属性名', defaultValue: '', placeholder: '例如: Value, Font.Name' },
      { id: 'value', name: 'value', type: 'expression', label: '值', defaultValue: '', placeholder: '要设置的值' }
    ],
    codeTemplate: '.{{property}} = {{value}}'
  },

  // ReDim 语句
  {
    id: 'block-redim-statement',
    type: BlockType.ARRAY_DECLARE,
    category: BlockCategory.ADVANCED,
    label: 'ReDim 重定义数组',
    description: '重新定义动态数组的大小',
    icon: 'Grid',
    color: '#ef4444',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'preserve', name: 'preserve', type: 'boolean', label: 'Preserve 保留数据', defaultValue: false },
      { id: 'arrayName', name: 'arrayName', type: 'text', label: '数组名', defaultValue: 'myArray', placeholder: '动态数组名' },
      { id: 'size', name: 'size', type: 'text', label: '大小', defaultValue: '10', placeholder: '例如: 10 或 10, 20' },
      { id: 'arrayType', name: 'arrayType', type: 'select', label: '数据类型', defaultValue: 'Variant', options: [
        { label: 'Variant', value: 'Variant' },
        { label: 'Integer', value: 'Integer' },
        { label: 'Long', value: 'Long' },
        { label: 'Double', value: 'Double' },
        { label: 'String', value: 'String' }
      ]}
    ],
    codeTemplate: 'ReDim {{#if preserve}}Preserve {{/if}}{{arrayName}}({{size}}) As {{arrayType}}'
  },

  // Option 语句
  {
    id: 'block-option-statement',
    type: BlockType.COMMENT,
    category: BlockCategory.ADVANCED,
    label: 'Option 语句',
    description: '模块级选项声明',
    icon: 'Warning',
    color: '#ef4444',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: false, position: 'bottom' }],
    properties: [
      { id: 'optionType', name: 'optionType', type: 'select', label: '选项类型', defaultValue: 'Explicit', options: [
        { label: 'Option Explicit', value: 'Explicit' },
        { label: 'Option Base 0', value: 'Base 0' },
        { label: 'Option Base 1', value: 'Base 1' },
        { label: 'Option Compare Text', value: 'Compare Text' },
        { label: 'Option Compare Binary', value: 'Compare Binary' }
      ]}
    ],
    codeTemplate: 'Option {{optionType}}'
  },

  // Application 属性设置
  {
    id: 'block-application-property',
    type: BlockType.ASSIGNMENT,
    category: BlockCategory.EXCEL,
    label: 'Application 属性',
    description: '设置 Application 对象属性',
    icon: 'Setting',
    color: '#10b981',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'property', name: 'property', type: 'select', label: '属性', defaultValue: 'ScreenUpdating', options: [
        { label: 'ScreenUpdating (屏幕刷新)', value: 'ScreenUpdating' },
        { label: 'DisplayAlerts (警告提示)', value: 'DisplayAlerts' },
        { label: 'EnableEvents (事件启用)', value: 'EnableEvents' },
        { label: 'Calculation (计算模式)', value: 'Calculation' },
        { label: 'Visible (可见性)', value: 'Visible' }
      ]},
      { id: 'value', name: 'value', type: 'expression', label: '值', defaultValue: 'True', placeholder: '属性值' }
    ],
    codeTemplate: 'Application.{{property}} = {{value}}'
  },

  {
    id: 'block-sub-define',
    type: BlockType.SUB_DEFINE,
    category: BlockCategory.ADVANCED,
    label: 'Sub 过程',
    description: '定义一个 Sub 过程',
    icon: 'DocumentCopy',
    color: '#ef4444',
    inputs: [],
    outputs: [],
    properties: [
      { id: 'subName', name: 'subName', type: 'text', label: '过程名', defaultValue: 'MyMacro', placeholder: '请输入过程名' },
      { id: 'parameters', name: 'parameters', type: 'text', label: '参数列表', defaultValue: '', placeholder: '例如: x As Integer, y As String' },
      { id: 'bodyCode', name: 'bodyCode', type: 'code', label: '过程体代码', defaultValue: '', placeholder: '过程内部的代码（每行一条语句）' }
    ],
    codeTemplate: `Sub {{subName}}({{parameters}})
{{bodyCode}}
End Sub`
  },

  {
    id: 'block-function-define',
    type: BlockType.FUNCTION_DEFINE,
    category: BlockCategory.ADVANCED,
    label: 'Function 函数',
    description: '定义一个 Function 函数',
    icon: 'Operation',
    color: '#ef4444',
    inputs: [],
    outputs: [],
    properties: [
      { id: 'funcName', name: 'funcName', type: 'text', label: '函数名', defaultValue: 'MyFunction', placeholder: '请输入函数名' },
      { id: 'parameters', name: 'parameters', type: 'text', label: '参数列表', defaultValue: '', placeholder: '例如: x As Integer, y As String' },
      { id: 'returnType', name: 'returnType', type: 'select', label: '返回类型', defaultValue: 'Variant', options: [
        { label: 'Variant', value: 'Variant' },
        { label: 'Integer', value: 'Integer' },
        { label: 'Long', value: 'Long' },
        { label: 'Double', value: 'Double' },
        { label: 'String', value: 'String' },
        { label: 'Boolean', value: 'Boolean' }
      ]},
      { id: 'bodyCode', name: 'bodyCode', type: 'code', label: '函数体代码', defaultValue: '', placeholder: '函数内部的代码（每行一条语句）' }
    ],
    codeTemplate: `Function {{funcName}}({{parameters}}) As {{returnType}}
{{bodyCode}}
End Function`
  },

  {
    id: 'block-error-handler',
    type: BlockType.ERROR_HANDLER,
    category: BlockCategory.ADVANCED,
    label: '错误处理',
    description: '添加错误处理语句',
    icon: 'Warning',
    color: '#ef4444',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'errorAction', name: 'errorAction', type: 'select', label: '错误处理方式', defaultValue: 'Resume Next', options: [
        { label: '继续执行下一行', value: 'Resume Next' },
        { label: '跳转到标签', value: 'GoTo' }
      ]},
      { id: 'label', name: 'label', type: 'text', label: '错误标签', defaultValue: 'ErrorHandler', placeholder: '例如: ErrorHandler' },
      { id: 'errorCode', name: 'errorCode', type: 'code', label: '错误处理代码', defaultValue: '', placeholder: '错误处理代码（可选）' }
    ],
    codeTemplate: `On Error {{errorAction}}{{#if label}} {{label}}{{/if}}{{#if errorCode}}

{{label}}:
{{errorCode}}{{/if}}`
  },

  {
    id: 'block-array-declare',
    type: BlockType.ARRAY_DECLARE,
    category: BlockCategory.ADVANCED,
    label: '数组声明',
    description: '声明一个数组',
    icon: 'Grid',
    color: '#ef4444',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'arrName', name: 'arrName', type: 'text', label: '数组名', defaultValue: 'myArray', placeholder: '请输入数组名' },
      { id: 'arrType', name: 'arrType', type: 'select', label: '数据类型', defaultValue: 'Variant', options: [
        { label: 'Variant', value: 'Variant' },
        { label: 'Integer', value: 'Integer' },
        { label: 'Long', value: 'Long' },
        { label: 'Double', value: 'Double' },
        { label: 'String', value: 'String' }
      ]},
      { id: 'dimensions', name: 'dimensions', type: 'text', label: '维度大小', defaultValue: '10', placeholder: '一维: 10 | 二维: 10, 20 | 三维: 10, 20, 30' },
      { id: 'dynamic', name: 'dynamic', type: 'boolean', label: '动态数组', defaultValue: false }
    ],
    codeTemplate: '{{#if dynamic}}Dim {{arrName}}() As {{arrType}}{{else}}Dim {{arrName}}({{dimensions}}) As {{arrType}}{{/if}}'
  },

  // ==================== 字符串处理积木 ====================
  {
    id: 'block-string-concat',
    type: BlockType.STRING_CONCAT,
    category: BlockCategory.DATA,
    label: '字符串拼接',
    description: '连接多个字符串',
    icon: 'Connection',
    color: '#06b6d4',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'result', placeholder: '存储结果的变量名' },
      { id: 'str1', name: 'str1', type: 'expression', label: '字符串1', defaultValue: '', placeholder: '第一个字符串' },
      { id: 'str2', name: 'str2', type: 'expression', label: '字符串2', defaultValue: '', placeholder: '第二个字符串' },
      { id: 'str3', name: 'str3', type: 'expression', label: '字符串3', defaultValue: '', placeholder: '第三个字符串(可选)' }
    ],
    codeTemplate: '{{varName}} = {{str1}} & {{str2}}{{#if str3}} & {{str3}}{{/if}}'
  },

  {
    id: 'block-string-substring',
    type: BlockType.STRING_SUBSTRING,
    category: BlockCategory.DATA,
    label: '字符串截取',
    description: '截取字符串的一部分',
    icon: 'Scissors',
    color: '#06b6d4',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'result', placeholder: '存储结果的变量名' },
      { id: 'source', name: 'source', type: 'expression', label: '源字符串', defaultValue: '', placeholder: '要截取的字符串' },
      { id: 'method', name: 'method', type: 'select', label: '截取方式', defaultValue: 'Mid', options: [
        { label: 'Mid (中间)', value: 'Mid' },
        { label: 'Left (左边)', value: 'Left' },
        { label: 'Right (右边)', value: 'Right' }
      ]},
      { id: 'start', name: 'start', type: 'number', label: '起始位置', defaultValue: 1 },
      { id: 'length', name: 'length', type: 'number', label: '截取长度', defaultValue: 1 }
    ],
    codeTemplate: '{{#if (eq method "Mid")}}{{varName}} = Mid({{source}}, {{start}}, {{length}}){{/if}}{{#if (eq method "Left")}}{{varName}} = Left({{source}}, {{length}}){{/if}}{{#if (eq method "Right")}}{{varName}} = Right({{source}}, {{length}}){{/if}}'
  },

  {
    id: 'block-string-len',
    type: BlockType.STRING_SUBSTRING,
    category: BlockCategory.DATA,
    label: '字符串长度',
    description: '获取字符串长度',
    icon: 'Ruler',
    color: '#06b6d4',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'length', placeholder: '存储结果的变量名' },
      { id: 'source', name: 'source', type: 'expression', label: '字符串', defaultValue: '', placeholder: '要计算长度的字符串' }
    ],
    codeTemplate: '{{varName}} = Len({{source}})'
  },

  {
    id: 'block-string-replace',
    type: BlockType.STRING_SUBSTRING,
    category: BlockCategory.DATA,
    label: '字符串替换',
    description: '替换字符串中的内容',
    icon: 'RefreshLeft',
    color: '#06b6d4',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'result', placeholder: '存储结果的变量名' },
      { id: 'source', name: 'source', type: 'expression', label: '源字符串', defaultValue: '', placeholder: '原始字符串' },
      { id: 'find', name: 'find', type: 'text', label: '查找内容', defaultValue: '', placeholder: '要查找的内容' },
      { id: 'replace', name: 'replace', type: 'text', label: '替换为', defaultValue: '', placeholder: '替换成的内容' },
      { id: 'count', name: 'count', type: 'number', label: '替换次数', defaultValue: -1, placeholder: '-1表示全部替换' },
      { id: 'compare', name: 'compare', type: 'select', label: '比较模式', defaultValue: '', options: [
        { label: '默认', value: '' },
        { label: '区分大小写', value: 'vbBinaryCompare' },
        { label: '不区分大小写', value: 'vbTextCompare' }
      ]}
    ],
    codeTemplate: '{{varName}} = Replace({{source}}, "{{find}}", "{{replace}}"{{#if count}}, , {{count}}{{/if}}{{#if compare}}, {{compare}}{{/if}})'
  },

  {
    id: 'block-string-trim',
    type: BlockType.STRING_SUBSTRING,
    category: BlockCategory.DATA,
    label: '去除空格',
    description: '去除字符串首尾空格',
    icon: 'Crop',
    color: '#06b6d4',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'result', placeholder: '存储结果的变量名' },
      { id: 'source', name: 'source', type: 'expression', label: '字符串', defaultValue: '', placeholder: '要处理的字符串' },
      { id: 'method', name: 'method', type: 'select', label: '处理方式', defaultValue: 'Trim', options: [
        { label: 'Trim (两端)', value: 'Trim' },
        { label: 'LTrim (左边)', value: 'LTrim' },
        { label: 'RTrim (右边)', value: 'RTrim' }
      ]}
    ],
    codeTemplate: '{{varName}} = {{method}}({{source}})'
  },

  {
    id: 'block-string-instr',
    type: BlockType.STRING_SUBSTRING,
    category: BlockCategory.DATA,
    label: '查找字符串',
    description: '在字符串中查找子串位置',
    icon: 'Search',
    color: '#06b6d4',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'pos', placeholder: '存储位置的变量名' },
      { id: 'source', name: 'source', type: 'expression', label: '源字符串', defaultValue: '', placeholder: '被搜索的字符串' },
      { id: 'find', name: 'find', type: 'text', label: '查找内容', defaultValue: '', placeholder: '要查找的内容' },
      { id: 'start', name: 'start', type: 'number', label: '起始位置', defaultValue: 1 },
      { id: 'compare', name: 'compare', type: 'select', label: '比较模式', defaultValue: '', options: [
        { label: '默认', value: '' },
        { label: '区分大小写', value: 'vbBinaryCompare' },
        { label: '不区分大小写', value: 'vbTextCompare' }
      ]}
    ],
    codeTemplate: '{{varName}} = InStr({{start}}, {{source}}, "{{find}}"{{#if compare}}, {{compare}}{{/if}})'
  },

  // ==================== 日期时间积木 ====================
  {
    id: 'block-date-now',
    type: BlockType.DATE_OPERATION,
    category: BlockCategory.DATA,
    label: '当前日期时间',
    description: '获取当前日期或时间',
    icon: 'Clock',
    color: '#f97316',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'currentDate', placeholder: '存储结果的变量名' },
      { id: 'method', name: 'method', type: 'select', label: '获取类型', defaultValue: 'Now', options: [
        { label: 'Now (日期时间)', value: 'Now' },
        { label: 'Date (日期)', value: 'Date' },
        { label: 'Time (时间)', value: 'Time' }
      ]}
    ],
    codeTemplate: '{{varName}} = {{method}}'
  },

  {
    id: 'block-date-add',
    type: BlockType.DATE_OPERATION,
    category: BlockCategory.DATA,
    label: '日期加减',
    description: '对日期进行加减运算',
    icon: 'Calendar',
    color: '#f97316',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'newDate', placeholder: '存储结果的变量名' },
      { id: 'source', name: 'source', type: 'expression', label: '源日期', defaultValue: 'Now', placeholder: '原始日期' },
      { id: 'interval', name: 'interval', type: 'select', label: '间隔类型', defaultValue: 'd', options: [
        { label: '日 (d)', value: 'd' },
        { label: '月 (m)', value: 'm' },
        { label: '年 (yyyy)', value: 'yyyy' },
        { label: '时 (h)', value: 'h' },
        { label: '分 (n)', value: 'n' },
        { label: '秒 (s)', value: 's' }
      ]},
      { id: 'number', name: 'number', type: 'number', label: '数量', defaultValue: 1 }
    ],
    codeTemplate: '{{varName}} = DateAdd("{{interval}}", {{number}}, {{source}})'
  },

  {
    id: 'block-date-diff',
    type: BlockType.DATE_OPERATION,
    category: BlockCategory.DATA,
    label: '日期差值',
    description: '计算两个日期的差值',
    icon: 'Timer',
    color: '#f97316',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'diff', placeholder: '存储结果的变量名' },
      { id: 'date1', name: 'date1', type: 'expression', label: '日期1', defaultValue: '', placeholder: '第一个日期' },
      { id: 'date2', name: 'date2', type: 'expression', label: '日期2', defaultValue: 'Now', placeholder: '第二个日期' },
      { id: 'interval', name: 'interval', type: 'select', label: '间隔类型', defaultValue: 'd', options: [
        { label: '日 (d)', value: 'd' },
        { label: '月 (m)', value: 'm' },
        { label: '年 (yyyy)', value: 'yyyy' },
        { label: '时 (h)', value: 'h' },
        { label: '分 (n)', value: 'n' },
        { label: '秒 (s)', value: 's' }
      ]}
    ],
    codeTemplate: '{{varName}} = DateDiff("{{interval}}", {{date1}}, {{date2}})'
  },

  {
    id: 'block-date-part',
    type: BlockType.DATE_OPERATION,
    category: BlockCategory.DATA,
    label: '日期部分',
    description: '提取日期的某一部分',
    icon: 'Collection',
    color: '#f97316',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'part', placeholder: '存储结果的变量名' },
      { id: 'source', name: 'source', type: 'expression', label: '日期', defaultValue: 'Now', placeholder: '要提取的日期' },
      { id: 'part', name: 'part', type: 'select', label: '提取部分', defaultValue: 'yyyy', options: [
        { label: '年 (Year)', value: 'yyyy' },
        { label: '月 (Month)', value: 'm' },
        { label: '日 (Day)', value: 'd' },
        { label: '时 (Hour)', value: 'h' },
        { label: '分 (Minute)', value: 'n' },
        { label: '秒 (Second)', value: 's' },
        { label: '星期 (Weekday)', value: 'w' }
      ]}
    ],
    codeTemplate: '{{varName}} = DatePart("{{part}}", {{source}})'
  },

  {
    id: 'block-date-format',
    type: BlockType.DATE_OPERATION,
    category: BlockCategory.DATA,
    label: '日期格式化',
    description: '格式化日期显示',
    icon: 'DataAnalysis',
    color: '#f97316',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'formatted', placeholder: '存储结果的变量名' },
      { id: 'source', name: 'source', type: 'expression', label: '日期', defaultValue: 'Now', placeholder: '要格式化的日期' },
      { id: 'format', name: 'format', type: 'select', label: '格式', defaultValue: 'yyyy-mm-dd', options: [
        { label: 'yyyy-mm-dd', value: 'yyyy-mm-dd' },
        { label: 'yyyy/mm/dd', value: 'yyyy/mm/dd' },
        { label: 'mm/dd/yyyy', value: 'mm/dd/yyyy' },
        { label: 'dd/mm/yyyy', value: 'dd/mm/yyyy' },
        { label: 'yyyy年mm月dd日', value: 'yyyy年mm月dd日' },
        { label: 'hh:mm:ss', value: 'hh:mm:ss' },
        { label: 'yyyy-mm-dd hh:mm:ss', value: 'yyyy-mm-dd hh:mm:ss' }
      ]}
    ],
    codeTemplate: '{{varName}} = Format({{source}}, "{{format}}")'
  },

  // ==================== 数学运算积木 ====================
  {
    id: 'block-math-operation',
    type: BlockType.MATH_OPERATION,
    category: BlockCategory.DATA,
    label: '数学运算',
    description: '执行数学运算',
    icon: 'Aim',
    color: '#84cc16',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'result', placeholder: '存储结果的变量名' },
      { id: 'operand1', name: 'operand1', type: 'expression', label: '操作数1', defaultValue: '', placeholder: '第一个操作数' },
      { id: 'operator', name: 'operator', type: 'select', label: '运算符', defaultValue: '+', options: [
        { label: '加 (+)', value: '+' },
        { label: '减 (-)', value: '-' },
        { label: '乘 (*)', value: '*' },
        { label: '除 (/)', value: '/' },
        { label: '整除 (\\)', value: '\\' },
        { label: '取模 (Mod)', value: 'Mod' },
        { label: '幂 (^)', value: '^' }
      ]},
      { id: 'operand2', name: 'operand2', type: 'expression', label: '操作数2', defaultValue: '', placeholder: '第二个操作数' }
    ],
    codeTemplate: '{{varName}} = {{operand1}} {{operator}} {{operand2}}'
  },

  {
    id: 'block-math-function',
    type: BlockType.MATH_OPERATION,
    category: BlockCategory.DATA,
    label: '数学函数',
    description: '执行数学函数运算',
    icon: 'TrendCharts',
    color: '#84cc16',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'result', placeholder: '存储结果的变量名' },
      { id: 'func', name: 'func', type: 'select', label: '函数', defaultValue: 'Abs', options: [
        { label: 'Abs (绝对值)', value: 'Abs' },
        { label: 'Int (取整)', value: 'Int' },
        { label: 'Fix (取整)', value: 'Fix' },
        { label: 'Sqr (平方根)', value: 'Sqr' },
        { label: 'Sgn (符号)', value: 'Sgn' },
        { label: 'Log (自然对数)', value: 'Log' },
        { label: 'Exp (e的幂)', value: 'Exp' },
        { label: 'Sin (正弦)', value: 'Sin' },
        { label: 'Cos (余弦)', value: 'Cos' },
        { label: 'Tan (正切)', value: 'Tan' },
        { label: 'Atn (反正切)', value: 'Atn' }
      ]},
      { id: 'value', name: 'value', type: 'expression', label: '数值', defaultValue: '', placeholder: '要计算的数值' }
    ],
    codeTemplate: '{{varName}} = {{func}}({{value}})'
  },

  {
    id: 'block-math-round',
    type: BlockType.MATH_OPERATION,
    category: BlockCategory.DATA,
    label: 'Round 四舍五入',
    description: '四舍五入到指定小数位数',
    icon: 'Aim',
    color: '#84cc16',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'result', placeholder: '存储结果的变量名' },
      { id: 'value', name: 'value', type: 'expression', label: '数值', defaultValue: '', placeholder: '要四舍五入的数值' },
      { id: 'decimals', name: 'decimals', type: 'number', label: '小数位数', defaultValue: 0 }
    ],
    codeTemplate: '{{varName}} = Round({{value}}, {{decimals}})'
  },

  {
    id: 'block-type-convert',
    type: BlockType.TYPE_CONVERT,
    category: BlockCategory.DATA,
    label: '类型转换',
    description: '转换数据类型',
    icon: 'Switch',
    color: '#84cc16',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'result', placeholder: '存储结果的变量名' },
      { id: 'value', name: 'value', type: 'expression', label: '值', defaultValue: '', placeholder: '要转换的值' },
      { id: 'convertTo', name: 'convertTo', type: 'select', label: '转换为', defaultValue: 'CStr', options: [
        { label: 'CStr (字符串)', value: 'CStr' },
        { label: 'CInt (整数)', value: 'CInt' },
        { label: 'CLng (长整数)', value: 'CLng' },
        { label: 'CDbl (双精度)', value: 'CDbl' },
        { label: 'CSng (单精度)', value: 'CSng' },
        { label: 'CBool (布尔)', value: 'CBool' },
        { label: 'CDate (日期)', value: 'CDate' },
        { label: 'CVar (变体)', value: 'CVar' }
      ]}
    ],
    codeTemplate: '{{varName}} = {{convertTo}}({{value}})'
  },

  {
    id: 'block-random',
    type: BlockType.MATH_OPERATION,
    category: BlockCategory.DATA,
    label: '随机数',
    description: '生成随机数',
    icon: 'Refresh',
    color: '#84cc16',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'rnd', placeholder: '存储结果的变量名' },
      { id: 'useRandomize', name: 'useRandomize', type: 'boolean', label: '初始化随机种子', defaultValue: true },
      { id: 'min', name: 'min', type: 'number', label: '最小值', defaultValue: 1 },
      { id: 'max', name: 'max', type: 'number', label: '最大值', defaultValue: 100 },
      { id: 'integer', name: 'integer', type: 'boolean', label: '整数', defaultValue: true }
    ],
    codeTemplate: '{{#if useRandomize}}Randomize\n{{/if}}{{#if integer}}{{varName}} = Int(({{max}} - {{min}} + 1) * Rnd + {{min}}){{else}}{{varName}} = ({{max}} - {{min}}) * Rnd + {{min}}{{/if}}'
  },

  // ==================== 字典操作积木 ====================
  {
    id: 'block-dictionary-create',
    type: BlockType.DICTIONARY_CREATE,
    category: BlockCategory.ADVANCED,
    label: '创建字典',
    description: '创建一个字典对象',
    icon: 'Collection',
    color: '#8b5cf6',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '字典变量名', defaultValue: 'dict', placeholder: '存储字典的变量名' }
    ],
    codeTemplate: 'Dim {{varName}} As Object\nSet {{varName}} = CreateObject("Scripting.Dictionary")'
  },

  {
    id: 'block-dictionary-add',
    type: BlockType.DICTIONARY_ADD,
    category: BlockCategory.ADVANCED,
    label: '字典添加',
    description: '向字典添加键值对',
    icon: 'Plus',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'dictName', name: 'dictName', type: 'expression', label: '字典变量', defaultValue: 'dict', placeholder: '字典变量名' },
      { id: 'key', name: 'key', type: 'expression', label: '键', defaultValue: '', placeholder: '键名' },
      { id: 'value', name: 'value', type: 'expression', label: '值', defaultValue: '', placeholder: '键值' }
    ],
    codeTemplate: '{{dictName}}.Add {{key}}, {{value}}'
  },

  {
    id: 'block-dictionary-get',
    type: BlockType.DICTIONARY_GET,
    category: BlockCategory.ADVANCED,
    label: '字典取值',
    description: '从字典获取值',
    icon: 'Search',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'value', placeholder: '存储结果的变量名' },
      { id: 'dictName', name: 'dictName', type: 'expression', label: '字典变量', defaultValue: 'dict', placeholder: '字典变量名' },
      { id: 'key', name: 'key', type: 'expression', label: '键', defaultValue: '', placeholder: '键名' }
    ],
    codeTemplate: '{{varName}} = {{dictName}}({{key}})'
  },

  {
    id: 'block-dictionary-exists',
    type: BlockType.DICTIONARY_EXISTS,
    category: BlockCategory.ADVANCED,
    label: '字典键存在',
    description: '检查字典中是否存在指定键',
    icon: 'QuestionFilled',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'exists', placeholder: '存储结果的变量名' },
      { id: 'dictName', name: 'dictName', type: 'expression', label: '字典变量', defaultValue: 'dict', placeholder: '字典变量名' },
      { id: 'key', name: 'key', type: 'expression', label: '键', defaultValue: '', placeholder: '键名' }
    ],
    codeTemplate: '{{varName}} = {{dictName}}.Exists({{key}})'
  },

  {
    id: 'block-dictionary-remove',
    type: BlockType.DICTIONARY_REMOVE,
    category: BlockCategory.ADVANCED,
    label: '字典删除',
    description: '从字典删除指定键',
    icon: 'Delete',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'dictName', name: 'dictName', type: 'expression', label: '字典变量', defaultValue: 'dict', placeholder: '字典变量名' },
      { id: 'key', name: 'key', type: 'expression', label: '键', defaultValue: '', placeholder: '要删除的键名' }
    ],
    codeTemplate: '{{dictName}}.Remove {{key}}'
  },

  {
    id: 'block-dictionary-loop',
    type: BlockType.DICTIONARY_LOOP,
    category: BlockCategory.ADVANCED,
    label: '遍历字典',
    description: '遍历字典的所有键',
    icon: 'Refresh',
    color: '#8b5cf6',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'dictName', name: 'dictName', type: 'expression', label: '字典变量', defaultValue: 'dict', placeholder: '字典变量名' },
      { id: 'keyVar', name: 'keyVar', type: 'text', label: '键变量', defaultValue: 'key', placeholder: '存储当前键的变量名' },
      { id: 'loopBody', name: 'loopBody', type: 'code', label: '循环体代码', defaultValue: '', placeholder: '循环执行的代码' }
    ],
    codeTemplate: `Dim {{keyVar}} As Variant
For Each {{keyVar}} In {{dictName}}.Keys
{{loopBody}}
Next {{keyVar}}`
  },

  // ==================== 正则表达式积木 ====================
  {
    id: 'block-regex-create',
    type: BlockType.REGEX_CREATE,
    category: BlockCategory.ADVANCED,
    label: '创建正则',
    description: '创建正则表达式对象',
    icon: 'Aim',
    color: '#06b6d4',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '正则变量名', defaultValue: 'regex', placeholder: '存储正则对象的变量名' },
      { id: 'pattern', name: 'pattern', type: 'text', label: '正则模式', defaultValue: '', placeholder: '正则表达式模式' },
      { id: 'ignoreCase', name: 'ignoreCase', type: 'boolean', label: '忽略大小写', defaultValue: false },
      { id: 'global', name: 'global', type: 'boolean', label: '全局匹配', defaultValue: true }
    ],
    codeTemplate: `Dim {{varName}} As Object
Set {{varName}} = CreateObject("VBScript.RegExp")
{{varName}}.Pattern = "{{pattern}}"
{{varName}}.IgnoreCase = {{ignoreCase}}
{{varName}}.Global = {{global}}`
  },

  {
    id: 'block-regex-test',
    type: BlockType.REGEX_TEST,
    category: BlockCategory.ADVANCED,
    label: '正则测试',
    description: '测试字符串是否匹配正则',
    icon: 'Check',
    color: '#06b6d4',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'isMatch', placeholder: '存储结果的变量名' },
      { id: 'regexName', name: 'regexName', type: 'expression', label: '正则变量', defaultValue: 'regex', placeholder: '正则表达式变量名' },
      { id: 'text', name: 'text', type: 'expression', label: '测试文本', defaultValue: '', placeholder: '要测试的字符串' }
    ],
    codeTemplate: '{{varName}} = {{regexName}}.Test({{text}})'
  },

  {
    id: 'block-regex-replace',
    type: BlockType.REGEX_REPLACE,
    category: BlockCategory.ADVANCED,
    label: '正则替换',
    description: '使用正则表达式替换文本',
    icon: 'EditPen',
    color: '#06b6d4',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'result', placeholder: '存储结果的变量名' },
      { id: 'regexName', name: 'regexName', type: 'expression', label: '正则变量', defaultValue: 'regex', placeholder: '正则表达式变量名' },
      { id: 'text', name: 'text', type: 'expression', label: '源文本', defaultValue: '', placeholder: '要替换的字符串' },
      { id: 'replacement', name: 'replacement', type: 'text', label: '替换为', defaultValue: '', placeholder: '替换内容' }
    ],
    codeTemplate: '{{varName}} = {{regexName}}.Replace({{text}}, "{{replacement}}")'
  },

  {
    id: 'block-regex-execute',
    type: BlockType.REGEX_EXECUTE,
    category: BlockCategory.ADVANCED,
    label: '正则执行',
    description: '执行正则匹配获取匹配集合',
    icon: 'VideoPlay',
    color: '#06b6d4',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'varName', name: 'varName', type: 'text', label: '结果变量', defaultValue: 'matches', placeholder: '存储匹配集合的变量名' },
      { id: 'regexName', name: 'regexName', type: 'expression', label: '正则变量', defaultValue: 'regex', placeholder: '正则表达式变量名' },
      { id: 'text', name: 'text', type: 'expression', label: '源文本', defaultValue: '', placeholder: '要匹配的字符串' }
    ],
    codeTemplate: 'Set {{varName}} = {{regexName}}.Execute({{text}})'
  },

  // ==================== 自定义代码积木 ====================
  {
    id: 'block-custom-code',
    type: BlockType.COMMENT,
    category: BlockCategory.ADVANCED,
    label: '自定义代码',
    description: '无法识别的 VBA 代码块',
    icon: 'Document',
    color: '#64748b',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: false, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: false, position: 'bottom' }],
    properties: [
      { id: 'code', name: 'code', type: 'code', label: '代码', defaultValue: '', placeholder: 'VBA 代码' }
    ],
    codeTemplate: '{{code}}'
  },

  // ==================== 事件处理积木 ====================
  {
    id: 'block-event-workbook-open',
    type: BlockType.EVENT_WORKBOOK_OPEN,
    category: BlockCategory.ADVANCED,
    label: 'Workbook_Open',
    description: '工作簿打开事件',
    icon: 'FolderOpened',
    color: '#f97316',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'code', name: 'code', type: 'code', label: '事件代码', defaultValue: '', placeholder: '工作簿打开时执行的代码' }
    ],
    codeTemplate: `Private Sub Workbook_Open()
{{code}}
End Sub`
  },

  {
    id: 'block-event-workbook-close',
    type: BlockType.EVENT_WORKBOOK_CLOSE,
    category: BlockCategory.ADVANCED,
    label: 'Workbook_BeforeClose',
    description: '工作簿关闭前事件',
    icon: 'FolderRemove',
    color: '#f97316',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'code', name: 'code', type: 'code', label: '事件代码', defaultValue: '', placeholder: '工作簿关闭前执行的代码' }
    ],
    codeTemplate: `Private Sub Workbook_BeforeClose(Cancel As Boolean)
{{code}}
End Sub`
  },

  {
    id: 'block-event-workbook-save',
    type: BlockType.EVENT_WORKBOOK_SAVE,
    category: BlockCategory.ADVANCED,
    label: 'Workbook_BeforeSave',
    description: '工作簿保存前事件',
    icon: 'DocumentChecked',
    color: '#f97316',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'code', name: 'code', type: 'code', label: '事件代码', defaultValue: '', placeholder: '工作簿保存前执行的代码' }
    ],
    codeTemplate: `Private Sub Workbook_BeforeSave(ByVal SaveAsUI As Boolean, Cancel As Boolean)
{{code}}
End Sub`
  },

  {
    id: 'block-event-sheet-change',
    type: BlockType.EVENT_SHEET_CHANGE,
    category: BlockCategory.ADVANCED,
    label: 'Workbook_SheetChange',
    description: '工作表变化事件',
    icon: 'Edit',
    color: '#f97316',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'code', name: 'code', type: 'code', label: '事件代码', defaultValue: '', placeholder: '工作表变化时执行的代码' }
    ],
    codeTemplate: `Private Sub Workbook_SheetChange(ByVal Sh As Object, ByVal Target As Range)
{{code}}
End Sub`
  },

  {
    id: 'block-event-sheet-activate',
    type: BlockType.EVENT_SHEET_ACTIVATE,
    category: BlockCategory.ADVANCED,
    label: 'Workbook_SheetActivate',
    description: '工作表激活事件',
    icon: 'Monitor',
    color: '#f97316',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'code', name: 'code', type: 'code', label: '事件代码', defaultValue: '', placeholder: '工作表激活时执行的代码' }
    ],
    codeTemplate: `Private Sub Workbook_SheetActivate(ByVal Sh As Object)
{{code}}
End Sub`
  },

  {
    id: 'block-event-worksheet-change',
    type: BlockType.EVENT_WORKSHEET_CHANGE,
    category: BlockCategory.ADVANCED,
    label: 'Worksheet_Change',
    description: '单元格变化事件（工作表级）',
    icon: 'Grid',
    color: '#f97316',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'code', name: 'code', type: 'code', label: '事件代码', defaultValue: '', placeholder: '单元格变化时执行的代码' }
    ],
    codeTemplate: `Private Sub Worksheet_Change(ByVal Target As Range)
{{code}}
End Sub`
  },

  {
    id: 'block-event-selection-change',
    type: BlockType.EVENT_SELECTION_CHANGE,
    category: BlockCategory.ADVANCED,
    label: 'Worksheet_SelectionChange',
    description: '选择变化事件',
    icon: 'Pointer',
    color: '#f97316',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'code', name: 'code', type: 'code', label: '事件代码', defaultValue: '', placeholder: '选择变化时执行的代码' }
    ],
    codeTemplate: `Private Sub Worksheet_SelectionChange(ByVal Target As Range)
{{code}}
End Sub`
  },

  {
    id: 'block-event-button-click',
    type: BlockType.EVENT_BUTTON_CLICK,
    category: BlockCategory.ADVANCED,
    label: 'Button_Click',
    description: '按钮点击事件',
    icon: 'Mouse',
    color: '#f97316',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'buttonName', name: 'buttonName', type: 'text', label: '按钮名称', defaultValue: 'CommandButton1', placeholder: '按钮控件名称' },
      { id: 'code', name: 'code', type: 'code', label: '事件代码', defaultValue: '', placeholder: '按钮点击时执行的代码' }
    ],
    codeTemplate: `Private Sub {{buttonName}}_Click()
{{code}}
End Sub`
  },

  // ==================== Windows API 积木 ====================
  {
    id: 'block-winapi-declare',
    type: BlockType.WINAPI_DECLARE,
    category: BlockCategory.ADVANCED,
    label: 'Declare API',
    description: '声明 Windows API 函数',
    icon: 'Connection',
    color: '#dc2626',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: false, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: false, position: 'bottom' }],
    properties: [
      { id: 'funcName', name: 'funcName', type: 'text', label: 'VBA函数名', defaultValue: 'Sleep', placeholder: 'VBA 中使用的函数名' },
      { id: 'libName', name: 'libName', type: 'text', label: 'DLL库名', defaultValue: 'kernel32', placeholder: '例如: kernel32, user32' },
      { id: 'apiName', name: 'apiName', type: 'text', label: 'API函数名', defaultValue: 'Sleep', placeholder: 'DLL 中的函数名' },
      { id: 'params', name: 'params', type: 'text', label: '参数列表', defaultValue: 'ByVal dwMilliseconds As Long', placeholder: '例如: ByVal hWnd As Long' },
      { id: 'returnType', name: 'returnType', type: 'text', label: '返回类型', defaultValue: '', placeholder: '留空表示 Sub' },
      { id: 'isUnicode', name: 'isUnicode', type: 'boolean', label: 'Unicode版本', defaultValue: false }
    ],
    codeTemplate: `{{#if returnType}}Private Declare PtrSafe Function {{funcName}} Lib "{{libName}}" ({{params}}) As {{returnType}}{{else}}Private Declare PtrSafe Sub {{funcName}} Lib "{{libName}}" ({{params}}){{/if}}`
  },

  {
    id: 'block-winapi-call',
    type: BlockType.WINAPI_CALL,
    category: BlockCategory.ADVANCED,
    label: 'Call API',
    description: '调用 Windows API 函数',
    icon: 'CaretRight',
    color: '#dc2626',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: true, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: true, position: 'bottom' }],
    properties: [
      { id: 'resultVar', name: 'resultVar', type: 'text', label: '结果变量', defaultValue: '', placeholder: '存储返回值的变量（可选）' },
      { id: 'funcName', name: 'funcName', type: 'text', label: '函数名', defaultValue: 'Sleep', placeholder: '已声明的 API 函数名' },
      { id: 'args', name: 'args', type: 'text', label: '参数', defaultValue: '1000', placeholder: '函数参数，逗号分隔' }
    ],
    codeTemplate: `{{#if resultVar}}{{resultVar}} = {{funcName}}({{args}}){{else}}{{funcName}} {{args}}{{/if}}`
  },

  {
    id: 'block-winapi-const',
    type: BlockType.WINAPI_CONST,
    category: BlockCategory.ADVANCED,
    label: 'API 常量',
    description: '定义 Windows API 常量',
    icon: 'PriceTag',
    color: '#dc2626',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: false, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: false, position: 'bottom' }],
    properties: [
      { id: 'constName', name: 'constName', type: 'text', label: '常量名', defaultValue: 'MB_OK', placeholder: '常量名称' },
      { id: 'constValue', name: 'constValue', type: 'text', label: '常量值', defaultValue: '&H0', placeholder: '例如: &H0, 0, &HFFFF' }
    ],
    codeTemplate: 'Private Const {{constName}} = {{constValue}}'
  },

  {
    id: 'block-winapi-type',
    type: BlockType.WINAPI_TYPE,
    category: BlockCategory.ADVANCED,
    label: 'API 结构体',
    description: '定义 Windows API 结构体',
    icon: 'DataBoard',
    color: '#dc2626',
    inputs: [{ id: 'in', name: '输入', type: 'flow', required: false, position: 'top' }],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: false, position: 'bottom' }],
    properties: [
      { id: 'typeName', name: 'typeName', type: 'text', label: '结构体名', defaultValue: 'RECT', placeholder: '结构体名称' },
      { id: 'members', name: 'members', type: 'code', label: '成员定义', defaultValue: '    Left As Long\n    Top As Long\n    Right As Long\n    Bottom As Long', placeholder: '每行一个成员定义' }
    ],
    codeTemplate: `Private Type {{typeName}}
{{members}}
End Type`
  }
]

// 按分类获取积木
export const getBlocksByCategory = (category: BlockCategory) => {
  return blockDefinitions.filter(b => b.category === category)
}

// 获取所有积木
export const getAllBlocks = () => {
  return blockDefinitions
}

// 根据 ID 获取积木定义
export const getBlockDefinition = (id: string) => {
  return blockDefinitions.find(b => b.id === id) || null
}

// 根据类型获取积木定义
export const getBlockDefinitionByType = (type: BlockType) => {
  return blockDefinitions.find(b => b.type === type) || null
}
