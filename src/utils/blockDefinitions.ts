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
  {
    id: 'block-option-explicit',
    type: BlockType.COMMENT,
    category: BlockCategory.ADVANCED,
    label: 'Option Explicit',
    description: '强制变量声明（放在代码最前面）',
    icon: 'Warning',
    color: '#ef4444',
    inputs: [],
    outputs: [{ id: 'out', name: '输出', type: 'flow', required: false, position: 'bottom' }],
    properties: [],
    codeTemplate: 'Option Explicit'
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
  }
]

// 按分类获取积木
export const getBlocksByCategory = (category: BlockCategory) => {
  return blockDefinitions.filter(b => b.category === category)
}

// 根据 ID 获取积木定义
export const getBlockDefinition = (id: string) => {
  return blockDefinitions.find(b => b.id === id) || null
}

// 根据类型获取积木定义
export const getBlockDefinitionByType = (type: BlockType) => {
  return blockDefinitions.find(b => b.type === type) || null
}
