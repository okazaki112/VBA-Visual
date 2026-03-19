// VBA 语法高亮工具

// VBA 关键字
const VBA_KEYWORDS = [
  'Sub', 'End Sub', 'Function', 'End Function', 'Private', 'Public',
  'Dim', 'Const', 'As', 'Set', 'Let', 'ReDim', 'Preserve',
  'If', 'Then', 'Else', 'ElseIf', 'End If',
  'For', 'To', 'Step', 'Next', 'For Each', 'In',
  'Do', 'Loop', 'While', 'Wend', 'Until',
  'Select Case', 'Case', 'Case Else', 'End Select',
  'Exit', 'Exit Sub', 'Exit Function', 'Exit For', 'Exit Do',
  'Call', 'On Error', 'Resume', 'GoTo', 'GoSub', 'Return',
  'With', 'End With',
  'Option Explicit', 'Option Base',
  'True', 'False', 'Nothing', 'Empty', 'Null',
  'And', 'Or', 'Not', 'Xor', 'Eqv', 'Imp', 'Is', 'Like', 'Mod'
]

// VBA 内置函数
const VBA_FUNCTIONS = [
  'MsgBox', 'InputBox', 'Print',
  'Len', 'Left', 'Right', 'Mid', 'Trim', 'LTrim', 'RTrim',
  'UCase', 'LCase', 'StrConv', 'Replace', 'InStr', 'InStrRev',
  'Split', 'Join', 'StrComp', 'StrReverse', 'Format',
  'Val', 'CStr', 'CInt', 'CLng', 'CDbl', 'CSng', 'CBool', 'CDate', 'CVar',
  'Int', 'Fix', 'Round', 'Abs', 'Sqr', 'Sgn', 'Rnd', 'Randomize',
  'Date', 'Time', 'Now', 'DateAdd', 'DateDiff', 'DatePart',
  'Year', 'Month', 'Day', 'Hour', 'Minute', 'Second',
  'Weekday', 'MonthName', 'WeekdayName',
  'Array', 'LBound', 'UBound', 'Erase',
  'IsEmpty', 'IsNull', 'IsNumeric', 'IsDate', 'IsArray', 'IsObject', 'IsError',
  'TypeName', 'VarType',
  'CreateObject', 'GetObject',
  'RGB', 'QBColor',
  'Shell', 'AppActivate', 'SendKeys',
  'DoEvents', 'Beep',
  'Environ', 'Command'
]

// Excel 对象
const EXCEL_OBJECTS = [
  'Application', 'Workbook', 'Workbooks', 'Worksheet', 'Worksheets',
  'Range', 'Cells', 'Rows', 'Columns', 'Selection',
  'ActiveWorkbook', 'ActiveSheet', 'ActiveCell',
  'Charts', 'Chart', 'Shapes', 'Shape',
  'PivotTables', 'PivotTable', 'PivotCache',
  'ListObjects', 'ListObject',
  'Names', 'Name',
  'Sheets', 'Sheet'
]

// VBA 数据类型
const VBA_TYPES = [
  'Integer', 'Long', 'Single', 'Double', 'Currency', 'Decimal',
  'String', 'Boolean', 'Date', 'Object', 'Variant', 'Byte',
  'LongLong', 'LongPtr', 'PtrSafe'
]

interface Token {
  type: 'keyword' | 'function' | 'type' | 'object' | 'string' | 'number' | 'comment' | 'operator' | 'text'
  value: string
}

// 词法分析
function tokenize(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  
  while (i < code.length) {
    const char = code[i]
    
    // 注释
    if (char === "'") {
      let comment = char
      i++
      while (i < code.length && code[i] !== '\n') {
        comment += code[i]
        i++
      }
      tokens.push({ type: 'comment', value: comment })
      continue
    }
    
    // 字符串
    if (char === '"') {
      let str = char
      i++
      while (i < code.length && code[i] !== '"') {
        str += code[i]
        i++
      }
      if (i < code.length) {
        str += code[i]
        i++
      }
      tokens.push({ type: 'string', value: str })
      continue
    }
    
    // 数字
    if (/[0-9]/.test(char)) {
      let num = char
      i++
      while (i < code.length && /[0-9.]/.test(code[i])) {
        num += code[i]
        i++
      }
      tokens.push({ type: 'number', value: num })
      continue
    }
    
    // 标识符和关键字
    if (/[a-zA-Z_]/.test(char)) {
      let word = char
      i++
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
        word += code[i]
        i++
      }
      
      // 检查是否为关键字
      if (VBA_KEYWORDS.some(kw => kw.toLowerCase() === word.toLowerCase())) {
        tokens.push({ type: 'keyword', value: word })
      }
      // 检查是否为函数
      else if (VBA_FUNCTIONS.some(fn => fn.toLowerCase() === word.toLowerCase())) {
        tokens.push({ type: 'function', value: word })
      }
      // 检查是否为类型
      else if (VBA_TYPES.some(t => t.toLowerCase() === word.toLowerCase())) {
        tokens.push({ type: 'type', value: word })
      }
      // 检查是否为 Excel 对象
      else if (EXCEL_OBJECTS.some(obj => obj.toLowerCase() === word.toLowerCase())) {
        tokens.push({ type: 'object', value: word })
      }
      else {
        tokens.push({ type: 'text', value: word })
      }
      continue
    }
    
    // 运算符
    if (/[+\-*/<>=&]/.test(char)) {
      let op = char
      i++
      // 检查多字符运算符
      if (i < code.length && /[<>=&]/.test(code[i])) {
        op += code[i]
        i++
      }
      tokens.push({ type: 'operator', value: op })
      continue
    }
    
    // 其他字符（包括空白）
    tokens.push({ type: 'text', value: char })
    i++
  }
  
  return tokens
}

// 转义 HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 高亮代码
export function highlightVBA(code: string): string {
  const tokens = tokenize(code)
  let html = ''
  
  for (const token of tokens) {
    const escaped = escapeHtml(token.value)
    
    switch (token.type) {
      case 'keyword':
        html += `<span class="vba-keyword">${escaped}</span>`
        break
      case 'function':
        html += `<span class="vba-function">${escaped}</span>`
        break
      case 'type':
        html += `<span class="vba-type">${escaped}</span>`
        break
      case 'object':
        html += `<span class="vba-object">${escaped}</span>`
        break
      case 'string':
        html += `<span class="vba-string">${escaped}</span>`
        break
      case 'number':
        html += `<span class="vba-number">${escaped}</span>`
        break
      case 'comment':
        html += `<span class="vba-comment">${escaped}</span>`
        break
      case 'operator':
        html += `<span class="vba-operator">${escaped}</span>`
        break
      default:
        html += escaped
    }
  }
  
  return html
}

// 生成高亮样式 CSS
export function getVBASyntaxStyles(): string {
  return `
.vba-keyword {
  color: #c586c0;
  font-weight: 500;
}

.vba-function {
  color: #dcdcaa;
}

.vba-type {
  color: #4ec9b0;
}

.vba-object {
  color: #4fc1ff;
}

.vba-string {
  color: #ce9178;
}

.vba-number {
  color: #b5cea8;
}

.vba-comment {
  color: #6a9955;
  font-style: italic;
}

.vba-operator {
  color: #d4d4d4;
}

/* 浅色主题 */
[data-theme='light'] .vba-keyword {
  color: #af00db;
}

[data-theme='light'] .vba-function {
  color: #795e26;
}

[data-theme='light'] .vba-type {
  color: #267f99;
}

[data-theme='light'] .vba-object {
  color: #0070c1;
}

[data-theme='light'] .vba-string {
  color: #a31515;
}

[data-theme='light'] .vba-number {
  color: #098658;
}

[data-theme='light'] .vba-comment {
  color: #008000;
}

[data-theme='light'] .vba-operator {
  color: #000000;
}
`
}

