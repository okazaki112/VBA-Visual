/**
 * VBA 代码解析器
 * 将 VBA 代码解析为积木块实例
 */

import type { BlockInstance } from '@/types'
import { BlockType } from '@/types'
import { getBlockDefinition } from './blockDefinitions'

// 解析结果接口
export interface ParseResult {
  success: boolean
  blocks: BlockInstance[]
  connections: { sourceBlockId: string; targetBlockId: string; sourcePortId?: string; targetPortId?: string }[]
  errors: string[]
  warnings: string[]
}

// 解析后的代码块
interface ParsedBlock {
  type: string
  definitionId: string
  properties: Record<string, unknown>
  children?: ParsedBlock[]
  lineNumber: number
  // 多行结构：内部行已被 collectBodyText 消费，主循环需跳过到结束标签
  isMultiline?: boolean
  // 多行结构结束标签所在行号（解析时已确定，主循环直接跳转，无需按类型匹配结束词）
  endIndex?: number
}

/**
 * 解析 VBA 代码
 */
export function parseVBACode(code: string): ParseResult {
  const result: ParseResult = {
    success: true,
    blocks: [],
    connections: [],
    errors: [],
    warnings: []
  }

  if (!code || !code.trim()) {
    result.errors.push('代码为空')
    result.success = false
    return result
  }

  try {
    // 预处理：移除空行，规范化代码；剥离顶层 Sub/Function 包装（过程体展开为顶层积木流）
    const lines = unwrapProcedureWrappers(preprocessCode(code), result)

    // 解析代码块
    const parsedBlocks = parseLines(lines, result)

    // 转换为积木实例（扁平结构，按顺序连线）
    let order = 1
    let yOffset = 50
    let prevBlockId: string | null = null

    parsedBlocks.forEach(parsed => {
      const block = createBlockFromParsed(parsed, order, 100, yOffset)
      if (block) {
        result.blocks.push(block)
        order++

        // 创建与前一个块的连接
        if (prevBlockId) {
          result.connections.push({
            sourceBlockId: prevBlockId,
            targetBlockId: block.id,
            sourcePortId: 'bottom',
            targetPortId: 'top'
          } as { sourceBlockId: string; targetBlockId: string; sourcePortId?: string; targetPortId?: string })
        }
        prevBlockId = block.id
      }
      yOffset += 80
    })

    if (result.blocks.length === 0) {
      result.warnings.push('未能识别任何有效的 VBA 代码块')
    }

  } catch (error) {
    result.errors.push(`解析错误: ${error instanceof Error ? error.message : '未知错误'}`)
    result.success = false
  }

  return result
}

/**
 * 预处理代码
 */
function preprocessCode(code: string): string[] {
  // 移除多余的空行，保留代码结构
  const lines = code.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  return lines
}

/**
 * 剥离顶层 Sub / Function 过程包装
 * 生成器对顶层普通积木会自动包装 Sub（见 codeGenerator 的 SUB_DEFINE 处理），
 * 因此导入代码时应把过程体展开为顶层语句流拆解成积木，
 * 而不是把整段代码塞进一个 Sub 定义积木（bodyCode 原文）。
 * VBA 过程不可嵌套，遇到过程头即线性收集到对应 End Sub / End Function。
 */
function unwrapProcedureWrappers(lines: string[], result: ParseResult): string[] {
  const out: string[] = []
  let i = 0
  let unwrappedCount = 0

  while (i < lines.length) {
    const line = lines[i]
    const match = line.match(/^(?:Public|Private)?\s*(Sub|Function)\s+([\w\u4e00-\u9fff]+)/i)

    if (match) {
      const kind = match[1].toUpperCase() === 'SUB' ? 'Sub' : 'Function'
      const endTag = 'END ' + kind.toUpperCase()
      unwrappedCount++
      result.warnings.push(`已剥离 ${kind} 包装「${match[2]}」，过程体展开为积木`)
      i++ // 跳过过程头
      while (i < lines.length) {
        if (lines[i].toUpperCase().startsWith(endTag)) { i++; break }
        out.push(lines[i])
        i++
      }
      continue
    }
    out.push(line)
    i++
  }

  if (unwrappedCount > 0) {
    result.warnings.push(`共剥离 ${unwrappedCount} 个过程包装，过程体已按语句拆解为积木`)
  }
  return unwrappedCount > 0 ? out : lines
}

/**
 * 解析代码行
 */
function parseLines(lines: string[], result: ParseResult): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 跳过结束标签（它们是结构的一部分，不单独生成积木）
    if (isEndTag(line)) {
      i++
      continue
    }

    const parsed = parseLine(line, lines, i, result)

    if (parsed) {
      blocks.push(parsed)
      // 多行结构已消费内部行，直接跳到结束标签（endIndex 在解析时已确定）
      if (parsed.isMultiline) {
        i = (parsed.endIndex !== undefined
          ? parsed.endIndex
          : skipToEndTag(lines, i, parsed.type)) + 1
        continue
      }
    }
    i++
  }

  return blocks
}

/**
 * 检查是否是结束标签
 */
function isEndTag(line: string): boolean {
  const upperLine = line.toUpperCase()
  return upperLine === 'END SUB' ||
         upperLine === 'END FUNCTION' ||
         upperLine === 'END IF' ||
         upperLine === 'END SELECT' ||
         upperLine === 'END WITH' ||
         upperLine === 'END PROPERTY' ||
         upperLine === 'NEXT' ||
         upperLine.startsWith('NEXT ') ||
         upperLine === 'LOOP' ||
         upperLine.startsWith('LOOP ') ||
         upperLine === 'WEND' ||
         upperLine === 'ELSE' ||
         upperLine.startsWith('ELSEIF ')
}

/**
 * 块类型是否匹配嵌套开始标签
 */
function matchesBlockStart(upperType: string, upperLine: string): boolean {
  switch (upperType) {
    case 'SUB': return upperLine.startsWith('SUB ') || upperLine.includes(' SUB ')
    case 'FUNCTION': return upperLine.startsWith('FUNCTION ') || upperLine.includes(' FUNCTION ')
    case 'IF-STATEMENT':
      if (!upperLine.startsWith('IF ') || !upperLine.includes(' THEN')) return false
      // 单行 If（Then 后有内容）不构成嵌套块
      {
        const thenIdx = upperLine.indexOf(' THEN')
        return upperLine.slice(thenIdx + 5).trim().length === 0
      }
    case 'FOR-LOOP':
    case 'FOR-EACH-LOOP': return upperLine.startsWith('FOR ')
    case 'DO-WHILE-LOOP': return upperLine.startsWith('DO ')
    case 'SELECT-CASE': return upperLine.startsWith('SELECT CASE ')
    case 'WITH-STATEMENT': return upperLine.startsWith('WITH ')
    default: return false
  }
}

/**
 * 块类型是否匹配结束标签
 */
function matchesBlockEnd(upperType: string, upperLine: string): boolean {
  switch (upperType) {
    case 'SUB': return upperLine === 'END SUB'
    case 'FUNCTION': return upperLine === 'END FUNCTION'
    case 'IF-STATEMENT': return upperLine === 'END IF'
    case 'FOR-LOOP':
    case 'FOR-EACH-LOOP': return upperLine === 'NEXT' || upperLine.startsWith('NEXT ')
    case 'DO-WHILE-LOOP': return upperLine === 'LOOP' || upperLine.startsWith('LOOP ') || upperLine === 'WEND'
    case 'SELECT-CASE': return upperLine === 'END SELECT'
    case 'WITH-STATEMENT': return upperLine === 'END WITH'
    default: return false
  }
}

/**
 * 跳到结束标签位置
 */
function skipToEndTag(lines: string[], startIndex: number, blockType: string): number {
  const upperType = blockType.toUpperCase()
  let depth = 1

  for (let i = startIndex + 1; i < lines.length; i++) {
    const upperLine = lines[i].toUpperCase()

    if (matchesBlockStart(upperType, upperLine)) depth++
    if (matchesBlockEnd(upperType, upperLine)) {
      depth--
      if (depth === 0) return i
    }
  }

  return lines.length - 1
}

/**
 * 收集结构头与结束标签之间的块体原文
 * （保留 Else/ElseIf/嵌套结构的原始文本，保证生成代码语法完整）
 */
function collectBodyText(
  allLines: string[],
  startIndex: number,
  blockType: string
): { text: string; hasElse: boolean; hasElseIf: boolean; endIndex: number } {
  const upperType = blockType.toUpperCase()
  let depth = 1
  const bodyLines: string[] = []
  let hasElse = false
  let hasElseIf = false
  let endIndex = allLines.length - 1

  for (let i = startIndex + 1; i < allLines.length; i++) {
    const line = allLines[i]
    const upperLine = line.toUpperCase()

    // 记录顶层 Else / ElseIf（If 块拆分用，文本仍保留）
    if (depth === 1 && upperType === 'IF-STATEMENT') {
      if (upperLine === 'ELSE') { hasElse = true; bodyLines.push(line); continue }
      if (upperLine.startsWith('ELSEIF ')) { hasElseIf = true; bodyLines.push(line); continue }
    }

    if (matchesBlockStart(upperType, upperLine)) depth++
    if (matchesBlockEnd(upperType, upperLine)) {
      depth--
      if (depth === 0) {
        endIndex = i
        break
      }
    }
    bodyLines.push(line)
  }

  return { text: bodyLines.join('\n'), hasElse, hasElseIf, endIndex }
}

/**
 * 解析单行代码
 */
function parseLine(
  line: string,
  allLines: string[],
  currentIndex: number,
  result: ParseResult
): ParsedBlock | null {
  // 跳过空行
  if (!line.trim()) return null

  // 注释
  if (line.startsWith("'") || line.startsWith('Rem ')) {
    return parseComment(line)
  }

  // Option 语句（模块级声明）
  if (line.match(/^Option\s+/i)) {
    return parseOptionStatement(line)
  }

  // Attribute 声明（跳过，不生成积木）
  if (line.match(/^Attribute\s+/i)) {
    return null
  }

  // ReDim 语句
  if (line.match(/^ReDim\s+/i)) {
    return parseReDimStatement(line)
  }

  // 变量声明
  if (line.match(/^Dim\s+/i)) {
    return parseDimStatement(line)
  }

  // 常量声明
  if (line.match(/^Const\s+/i)) {
    return parseConstStatement(line)
  }

  // Sub 定义（必须在其他检查之前，支持 Private/Public 前缀）
  if (line.match(/^(?:Public|Private)?\s*Sub\s+/i)) {
    return parseSubDefinition(line, allLines, currentIndex)
  }

  // Function 定义（支持 Private/Public 前缀）
  if (line.match(/^(?:Public|Private)?\s*Function\s+/i)) {
    return parseFunctionDefinition(line, allLines, currentIndex)
  }

  // With 语句块
  if (line.match(/^With\s+/i)) {
    return parseWithStatement(line, allLines, currentIndex)
  }

  // With 块内的属性赋值（以 . 开头）
  if (line.match(/^\.\w+/)) {
    return parseWithPropertyAssignment(line)
  }

  // If 语句
  if (line.match(/^If\s+/i)) {
    return parseIfStatement(line, allLines, currentIndex)
  }

  // Else 语句（孤立出现时保留原文，正常应已被 If 块体捕获）
  if (line.match(/^ElseIf?\s*/i) || line.toUpperCase() === 'ELSE') {
    return parseElseStatement(line)
  }

  // For 循环
  if (line.match(/^For\s+/i)) {
    return parseForLoop(line, allLines, currentIndex)
  }

  // Do While 循环 / While 循环
  if (line.match(/^Do\s+/i) || line.match(/^While\s+/i)) {
    return parseDoWhileLoop(line, allLines, currentIndex)
  }

  // Select Case
  if (line.match(/^Select\s+Case\s+/i)) {
    return parseSelectCase(line, allLines, currentIndex)
  }

  // MsgBox
  if (line.match(/^MsgBox\s+/i)) {
    return parseMsgBox(line)
  }

  // InputBox
  if (line.match(/InputBox\s*\(/i)) {
    return parseInputBox(line)
  }

  // Debug.Print
  if (line.match(/^Debug\.Print\s+/i)) {
    return parseDebugPrint(line)
  }

  // Set 对象赋值
  if (line.match(/^Set\s+/i)) {
    return parseSetStatement(line)
  }

  // Call 调用
  if (line.match(/^Call\s+/i)) {
    return parseCallStatement(line)
  }

  // On Error
  if (line.match(/^On\s+Error\s+/i)) {
    return parseOnError(line)
  }

  // Exit 语句
  if (line.match(/^Exit\s+/i)) {
    return parseExitStatement(line)
  }

  // Application 方法调用
  if (line.match(/^Application\./i) || line.match(/Application\.Get(Open|Save)/i)) {
    return parseApplicationMethod(line)
  }

  // Range 操作 (Excel 特有)
  if (line.match(/Range\s*\(/i) || line.match(/Cells\s*\(/i)) {
    return parseRangeOperation(line)
  }

  // Worksheets/Sheets 操作
  if (line.match(/^(?:Worksheets?|Sheets)\s*\(/i)) {
    return parseWorksheetOperation(line)
  }

  // 普通赋值语句
  if (line.match(/^[a-zA-Z_\u4e00-\u9fff][a-zA-Z0-9_\u4e00-\u9fff]*\s*=/)) {
    return parseAssignment(line)
  }

  // 无 Call 的过程调用（过程名 后跟参数或单独一行）
  if (line.match(/^[a-zA-Z_\u4e00-\u9fff][a-zA-Z0-9_\u4e00-\u9fff]*\s*(?:\s+"[^"]*"|\s+\w+|\s*\([^)]*\))?$/i) &&
      !line.match(/\s*=\s*/) &&
      !line.match(/^(Dim|Const|Sub|Function|If|For|Do|While|Select|With|End|Next|Loop|Else|Exit|On|Option|ReDim|Set|Call)\s/i)) {
    return parseProcedureCall(line)
  }

  // 无法识别的语句，作为自定义代码块
  result.warnings.push(`第 ${currentIndex + 1} 行未能完全解析: ${line.substring(0, 50)}...`)
  return parseCustomCode(line)
}

/**
 * 解析注释
 */
function parseComment(line: string): ParsedBlock {
  const comment = line.replace(/^['"]/, '').replace(/^Rem\s*/i, '').trim()
  return {
    type: 'comment',
    definitionId: 'block-comment',
    properties: { comment },
    lineNumber: 0
  }
}

/**
 * 解析 Option 语句
 */
function parseOptionStatement(line: string): ParsedBlock {
  // Option Explicit, Option Base 0/1, Option Compare Text/Binary
  const match = line.match(/Option\s+(Explicit|Base\s+\d|Compare\s+\w+)/i)

  if (match) {
    return {
      type: 'option-statement',
      definitionId: 'block-option-statement',
      properties: {
        optionType: match[1].trim()
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 ReDim 语句
 */
function parseReDimStatement(line: string): ParsedBlock {
  // ReDim arr(size) As Type
  // ReDim Preserve arr(size) As Type
  const match = line.match(/ReDim\s+(Preserve\s+)?([\w\u4e00-\u9fff]+)\s*\(([^)]*)\)\s*(?:As\s+(\w+))?/i)

  if (match) {
    return {
      type: 'redim-statement',
      definitionId: 'block-redim-statement',
      properties: {
        preserve: match[1] ? 'true' : 'false',
        arrayName: match[2],
        size: match[3],
        arrayType: match[4] || 'Variant'
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Dim 语句（支持数组声明）
 */
function parseDimStatement(line: string): ParsedBlock {
  // Dim varName As Type
  // Dim arr(10) As Type - 固定大小数组
  // Dim arr() As Type - 动态数组

  // 首先检查是否是数组声明
  const arrayMatch = line.match(/Dim\s+([\w\u4e00-\u9fff]+)\s*\(([^)]*)\)\s*(?:As\s+(\w+))?/i)
  if (arrayMatch) {
    return {
      type: 'array-declare',
      definitionId: 'block-array-declare',
      properties: {
        arrayName: arrayMatch[1],
        size: arrayMatch[2] || '', // 空字符串表示动态数组
        arrayType: arrayMatch[3] || 'Variant'
      },
      lineNumber: 0
    }
  }

  // 多变量声明（Dim a As X, b As Y）无对应积木，保留原文保证不丢语义
  if (line.includes(',')) {
    return parseCustomCode(line)
  }

  // 普通变量声明
  const match = line.match(/Dim\s+([\w\u4e00-\u9fff]+)\s*(?:As\s+(\w+))?/i)

  if (match) {
    return {
      type: 'variable-declare',
      definitionId: 'block-variable-declare',
      properties: {
        varName: match[1],
        varType: match[2] || 'Variant'
      },
      lineNumber: 0
    }
  }

  return {
    type: 'variable-declare',
    definitionId: 'block-variable-declare',
    properties: { varName: 'unknownVar', varType: 'Variant' },
    lineNumber: 0
  }
}

/**
 * 解析 Const 语句
 */
function parseConstStatement(line: string): ParsedBlock {
  // Const NAME As Type = value
  // Const NAME = value
  const match = line.match(/Const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:As\s+(\w+))?\s*=\s*(.+)/i)

  if (match) {
    return {
      type: 'constant-declare',
      definitionId: 'block-constant-declare',
      properties: {
        constName: match[1],
        constType: match[2] || '',
        constValue: match[3].trim()
      },
      lineNumber: 0
    }
  }

  return {
    type: 'constant-declare',
    definitionId: 'block-constant-declare',
    properties: { constName: 'UNKNOWN', constType: '', constValue: '' },
    lineNumber: 0
  }
}

/**
 * 解析赋值语句
 */
function parseAssignment(line: string): ParsedBlock {
  const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_.()"\s]*)\s*=\s*(.+)$/)

  if (match) {
    return {
      type: 'assignment',
      definitionId: 'block-assignment',
      properties: {
        varName: match[1].trim(),
        value: match[2].trim()
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Set 语句（对象赋值，复用赋值积木，保留 Set 前缀）
 */
function parseSetStatement(line: string): ParsedBlock {
  const match = line.match(/^Set\s+([\w\u4e00-\u9fff]+)\s*=\s*(.+)/i)

  if (match) {
    return {
      type: 'assignment',
      definitionId: 'block-assignment',
      properties: {
        varName: `Set ${match[1]}`,
        value: match[2].trim()
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 MsgBox
 */
function parseMsgBox(line: string): ParsedBlock {
  // MsgBox "message", buttons, "title"
  const match = line.match(/MsgBox\s+(.+)/i)

  if (match) {
    // 简单解析，提取消息内容
    const content = match[1]
    let message = content
    const buttons = 'vbOKOnly'
    const title = ''

    // 尝试提取字符串参数
    const stringMatch = content.match(/"([^"]*)"/)
    if (stringMatch) {
      message = stringMatch[1]
    }

    return {
      type: 'msgbox',
      definitionId: 'block-msgbox',
      properties: {
        message,
        buttons,
        title
      },
      lineNumber: 0
    }
  }

  return {
    type: 'msgbox',
    definitionId: 'block-msgbox',
    properties: { message: '', buttons: 'vbOKOnly', title: '' },
    lineNumber: 0
  }
}

/**
 * 解析 InputBox（识别赋值目标变量）
 */
function parseInputBox(line: string): ParsedBlock {
  // result = InputBox("prompt", "title", "default")
  const match = line.match(/^(?:([\w\u4e00-\u9fff]+)\s*=\s*)?InputBox\s*\(([^)]+)\)/i)

  if (match) {
    const args = match[2].split(',').map(a => a.trim())
    return {
      type: 'inputbox',
      definitionId: 'block-inputbox',
      properties: {
        varName: match[1] || 'userInput',
        prompt: args[0]?.replace(/"/g, '') || '',
        title: args[1]?.replace(/"/g, '') || '',
        default: args[2]?.replace(/"/g, '') || ''
      },
      lineNumber: 0
    }
  }

  return {
    type: 'inputbox',
    definitionId: 'block-inputbox',
    properties: { varName: 'userInput', prompt: '', title: '', default: '' },
    lineNumber: 0
  }
}

/**
 * 解析 Debug.Print
 */
function parseDebugPrint(line: string): ParsedBlock {
  const match = line.match(/Debug\.Print\s+(.+)/i)

  return {
    type: 'debug-print',
    definitionId: 'block-debug-print',
    properties: {
      expression: match ? match[1].trim() : ''
    },
    lineNumber: 0
  }
}

/**
 * 解析 Call 语句（无独立积木，保留原文）
 */
function parseCallStatement(line: string): ParsedBlock {
  return parseCustomCode(line)
}

/**
 * 解析 On Error（映射到错误处理积木）
 */
function parseOnError(line: string): ParsedBlock {
  const match = line.match(/^On\s+Error\s+(Resume\s+Next|GoTo\s+\w+|GoTo\s+0)/i)

  if (match) {
    const action = match[1].trim()

    if (/^Resume\s+Next$/i.test(action)) {
      return {
        type: 'on-error',
        definitionId: 'block-error-handler',
        properties: { errorAction: 'Resume Next', label: '', errorCode: '' },
        lineNumber: 0
      }
    }

    const gotoMatch = action.match(/^GoTo\s+(\w+)/i)
    if (gotoMatch && gotoMatch[1] !== '0') {
      return {
        type: 'on-error',
        definitionId: 'block-error-handler',
        properties: { errorAction: 'GoTo', label: gotoMatch[1], errorCode: '' },
        lineNumber: 0
      }
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Exit 语句（无独立积木，保留原文）
 */
function parseExitStatement(line: string): ParsedBlock {
  return parseCustomCode(line)
}

/**
 * 解析 Sub 定义（过程体原文存入 bodyCode，保留过程名）
 */
function parseSubDefinition(
  line: string,
  allLines: string[],
  currentIndex: number
): ParsedBlock {
  // Sub Name(Params) 或 Public Sub Name(Params) 或 Private Sub Name(Params)
  // 支持中文和其他 Unicode 字符
  const match = line.match(/(?:Public|Private)?\s*Sub\s+([\w\u4e00-\u9fff]+)\s*\(([^)]*)\)?/i)

  if (match) {
    const body = collectBodyText(allLines, currentIndex, 'SUB')
    return {
      type: 'sub',
      definitionId: 'block-sub-define',
      properties: {
        subName: match[1],
        parameters: match[2] || '',
        bodyCode: body.text
      },
      lineNumber: currentIndex,
      isMultiline: true,
      endIndex: body.endIndex
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Function 定义（函数体原文存入 bodyCode）
 */
function parseFunctionDefinition(
  line: string,
  allLines: string[],
  currentIndex: number
): ParsedBlock {
  // Function Name(Params) As ReturnType
  // 支持中文和其他 Unicode 字符
  const match = line.match(/(?:Public|Private)?\s*Function\s+([\w\u4e00-\u9fff]+)\s*\(([^)]*)\)?\s*(?:As\s+(\w+))?/i)

  if (match) {
    const body = collectBodyText(allLines, currentIndex, 'FUNCTION')
    return {
      type: 'function',
      definitionId: 'block-function-define',
      properties: {
        funcName: match[1],
        parameters: match[2] || '',
        returnType: match[3] || 'Variant',
        bodyCode: body.text
      },
      lineNumber: currentIndex,
      isMultiline: true,
      endIndex: body.endIndex
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 If 语句
 * - 单行 If → thenCode 直接取行内代码
 * - 多行 If → 捕获 Then 与 End If 之间的块体；简单 Else 拆分到 If-Else 积木，
 *   含 ElseIf 的复杂分支整体保留在 thenCode 中以保证生成代码语法有效
 */
function parseIfStatement(
  line: string,
  allLines: string[],
  currentIndex: number
): ParsedBlock {
  const match = line.match(/^If\s+(.+?)\s+Then\s*(.*)$/i)

  if (match) {
    const condition = match[1].trim()
    const inlineCode = match[2].trim()

    // 单行 If：If x Then y
    if (inlineCode) {
      return {
        type: 'if-statement',
        definitionId: 'block-if-statement',
        properties: { condition, thenCode: inlineCode },
        lineNumber: currentIndex
      }
    }

    const body = collectBodyText(allLines, currentIndex, 'IF-STATEMENT')

    // 简单 Else（无 ElseIf）拆分为 If-Else 积木
    if (body.hasElse && !body.hasElseIf) {
      const bodyLines = body.text.split('\n')
      const elseIdx = bodyLines.findIndex(l => l.toUpperCase() === 'ELSE')
      const thenCode = bodyLines.slice(0, elseIdx).join('\n')
      const elseCode = bodyLines.slice(elseIdx + 1).join('\n')
      if (elseCode.trim()) {
        return {
          type: 'if-statement',
          definitionId: 'block-if-else-statement',
          properties: { condition, thenCode, elseCode },
          lineNumber: currentIndex,
          isMultiline: true,
          endIndex: body.endIndex
        }
      }
    }

    return {
      type: 'if-statement',
      definitionId: 'block-if-statement',
      properties: { condition, thenCode: body.text },
      lineNumber: currentIndex,
      isMultiline: true,
      endIndex: body.endIndex
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Else 语句（孤立出现时保留原文）
 */
function parseElseStatement(line: string): ParsedBlock {
  return parseCustomCode(line)
}

/**
 * 解析 With 语句块（块体原文存入 bodyCode）
 */
function parseWithStatement(
  line: string,
  allLines: string[],
  currentIndex: number
): ParsedBlock {
  const match = line.match(/^With\s+(.+)/i)

  if (match) {
    const body = collectBodyText(allLines, currentIndex, 'WITH-STATEMENT')
    return {
      type: 'with-statement',
      definitionId: 'block-with-statement',
      properties: {
        object: match[1].trim(),
        bodyCode: body.text
      },
      lineNumber: currentIndex,
      isMultiline: true,
      endIndex: body.endIndex
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 With 块内的属性赋值
 */
function parseWithPropertyAssignment(line: string): ParsedBlock {
  // .Property = value
  const match = line.match(/^\.(\w+)\s*=\s*(.+)$/)

  if (match) {
    return {
      type: 'with-property-assignment',
      definitionId: 'block-with-property-assignment',
      properties: {
        property: match[1],
        value: match[2].trim()
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Application 方法调用
 */
function parseApplicationMethod(line: string): ParsedBlock {
  // Application 属性赋值
  const propMatch = line.match(/^Application\.(\w+)\s*=\s*(.+)/i)
  if (propMatch) {
    return {
      type: 'application-property',
      definitionId: 'block-application-property',
      properties: {
        property: propMatch[1],
        value: propMatch[2].trim()
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析无 Call 的过程调用（无独立积木，保留原文）
 */
function parseProcedureCall(line: string): ParsedBlock {
  return parseCustomCode(line)
}

/**
 * 解析 For 循环（循环体原文存入 loopBody）
 */
function parseForLoop(
  line: string,
  allLines: string[],
  currentIndex: number
): ParsedBlock {
  // For Each item In collection
  const forEachMatch = line.match(/^For\s+Each\s+([\w\u4e00-\u9fff]+)\s+In\s+(.+)/i)

  if (forEachMatch) {
    const body = collectBodyText(allLines, currentIndex, 'FOR-EACH-LOOP')
    return {
      type: 'for-each-loop',
      definitionId: 'block-for-each-loop',
      properties: {
        element: forEachMatch[1],
        collection: forEachMatch[2].trim(),
        loopBody: body.text
      },
      lineNumber: currentIndex,
      isMultiline: true,
      endIndex: body.endIndex
    }
  }

  // For i = start To end Step n（起止支持变量表达式）
  const forMatch = line.match(/^For\s+([\w\u4e00-\u9fff]+)\s*=\s*(.+?)\s+To\s+(.+?)(?:\s+Step\s+(\S+))?$/i)

  if (forMatch) {
    const body = collectBodyText(allLines, currentIndex, 'FOR-LOOP')
    const toNum = (v: string) => /^-?\d+$/.test(v.trim()) ? parseInt(v.trim()) : v.trim()
    return {
      type: 'for-loop',
      definitionId: 'block-for-loop',
      properties: {
        counter: forMatch[1],
        start: toNum(forMatch[2]),
        end: toNum(forMatch[3]),
        step: forMatch[4] ? toNum(forMatch[4]) : 1,
        loopBody: body.text
      },
      lineNumber: currentIndex,
      isMultiline: true,
      endIndex: body.endIndex
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Do While / Do Until / While 循环（循环体原文存入 loopBody）
 */
function parseDoWhileLoop(
  line: string,
  allLines: string[],
  currentIndex: number
): ParsedBlock {
  // Do While / Do Until
  const match = line.match(/^Do\s+(While|Until)\s+(.+)/i)

  if (match) {
    const body = collectBodyText(allLines, currentIndex, 'DO-WHILE-LOOP')

    // Do Until 无对应积木，保留原文（While 条件会反转语义，不可直接映射）
    if (match[1].toUpperCase() === 'UNTIL') {
      return {
        type: 'custom-code',
        definitionId: 'block-custom-code',
        properties: {
          code: [`Do Until ${match[2].trim()}`, body.text, 'Loop'].join('\n')
        },
        lineNumber: currentIndex,
        isMultiline: true,
        endIndex: body.endIndex
      }
    }

    return {
      type: 'do-while-loop',
      definitionId: 'block-do-while-loop',
      properties: {
        condition: match[2].trim(),
        loopBody: body.text
      },
      lineNumber: currentIndex,
      isMultiline: true,
      endIndex: body.endIndex
    }
  }

  // While ... Wend（等价 Do While ... Loop）
  const whileMatch = line.match(/^While\s+(.+)/i)
  if (whileMatch) {
    const body = collectBodyText(allLines, currentIndex, 'DO-WHILE-LOOP')
    return {
      type: 'do-while-loop',
      definitionId: 'block-do-while-loop',
      properties: {
        condition: whileMatch[1].trim(),
        loopBody: body.text
      },
      lineNumber: currentIndex,
      isMultiline: true,
      endIndex: body.endIndex
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Select Case（无对应积木，整块保留原文）
 */
function parseSelectCase(
  line: string,
  allLines: string[],
  currentIndex: number
): ParsedBlock {
  const match = line.match(/^Select\s+Case\s+(.+)/i)

  if (match) {
    const body = collectBodyText(allLines, currentIndex, 'SELECT-CASE')
    return {
      type: 'custom-code',
      definitionId: 'block-custom-code',
      properties: {
        code: [line, body.text, 'End Select'].join('\n')
      },
      lineNumber: currentIndex,
      isMultiline: true,
      endIndex: body.endIndex
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Range / Cells 操作
 * 写入映射到写入单元格积木，读取映射到读取单元格积木，其余保留原文
 */
function parseRangeOperation(line: string): ParsedBlock {
  // 写入: Range("A1").Value = x / Cells(1,1).Value = x
  const writeMatch = line.match(/^(?:Range\s*\(\s*"([^"]+)"\s*\)|Cells\s*\(\s*(\d+)\s*,\s*(\d+)\s*\))\s*\.?\s*(\w*)\s*=\s*(.+)$/i)
  if (writeMatch) {
    const prop = writeMatch[4] || 'Value'
    if (prop.toUpperCase() === 'VALUE') {
      const isRange = writeMatch[1] !== undefined
      return {
        type: 'cell-write',
        definitionId: 'block-cell-write',
        properties: {
          refType: isRange ? 'Range' : 'Cells',
          cellRef: isRange ? writeMatch[1] : `${writeMatch[2]}, ${writeMatch[3]}`,
          value: writeMatch[5].trim()
        },
        lineNumber: 0
      }
    }
    return parseCustomCode(line)
  }

  // 读取: x = Range("A1").Value / x = Cells(1,1).Value
  const readMatch = line.match(/^([\w\u4e00-\u9fff]+)\s*=\s*(?:Range\s*\(\s*"([^"]+)"\s*\)|Cells\s*\(\s*(\d+)\s*,\s*(\d+)\s*\))\s*\.?\s*(\w*)\s*$/i)
  if (readMatch) {
    const prop = readMatch[5] || 'Value'
    if (prop.toUpperCase() === 'VALUE') {
      const isRange = readMatch[2] !== undefined
      return {
        type: 'cell-read',
        definitionId: 'block-cell-read',
        properties: {
          refType: isRange ? 'Range' : 'Cells',
          cellRef: isRange ? readMatch[2] : `${readMatch[3]}, ${readMatch[4]}`,
          varName: readMatch[1]
        },
        lineNumber: 0
      }
    }
    return parseCustomCode(line)
  }

  return parseCustomCode(line)
}

/**
 * 解析 Worksheet 操作（仅 Activate 映射到激活工作表积木，其余保留原文）
 */
function parseWorksheetOperation(line: string): ParsedBlock {
  const match = line.match(/^(?:Worksheets?|Sheets)\s*\(\s*"?([^")]+)"?\s*\)\s*\.?\s*(\w*)\s*$/i)

  if (match) {
    const action = match[2] || 'Activate'
    if (action === 'Activate') {
      return {
        type: 'worksheet-activate',
        definitionId: 'block-sheet-activate',
        properties: {
          sheetName: match[1]
        },
        lineNumber: 0
      }
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析自定义代码（无法识别的语句）
 */
function parseCustomCode(line: string): ParsedBlock {
  return {
    type: 'custom-code',
    definitionId: 'block-custom-code',
    properties: {
      code: line
    },
    lineNumber: 0
  }
}

/**
 * 从解析结果创建积木实例
 */
function createBlockFromParsed(
  parsed: ParsedBlock,
  order: number,
  x: number,
  y: number
): BlockInstance | null {
  const blockDef = getBlockDefinition(parsed.definitionId)

  if (!blockDef) {
    // 如果找不到定义，使用自定义代码块（保留原始文本，避免属性丢失）
    return {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      definitionId: 'block-custom-code',
      type: BlockType.COMMENT,
      position: { x, y },
      properties: {
        code: typeof parsed.properties.code === 'string'
          ? parsed.properties.code
          : JSON.stringify(parsed.properties)
      },
      order
    }
  }

  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    definitionId: parsed.definitionId,
    type: blockDef.type,
    position: { x, y },
    properties: { ...parsed.properties },
    order
  }
}
