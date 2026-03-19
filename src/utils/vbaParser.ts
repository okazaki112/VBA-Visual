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
    // 预处理：移除空行，规范化代码
    const lines = preprocessCode(code)
    
    // 解析代码块
    const parsedBlocks = parseLines(lines, result)
    
    // 转换为积木实例
    let order = 1
    let yOffset = 50
    let prevBlockId: string | null = null
    
    // 递归处理代码块
    function processBlock(parsed: ParsedBlock, x: number, y: number) {
      // 跳过 Sub/Function 定义，直接处理内部代码
      if (parsed.type === 'sub' || parsed.type === 'function') {
        if (parsed.children && parsed.children.length > 0) {
          parsed.children.forEach(child => {
            processBlock(child, x, y)
            y += 80
          })
        }
        return
      }
      
      const block = createBlockFromParsed(parsed, order, x, y)
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
        
        // 递归处理子块
        if (parsed.children && parsed.children.length > 0) {
          let childY = y + 80
          parsed.children.forEach(child => {
            processBlock(child, x + 30, childY)
            childY += 80
          })
        }
      }
    }
    
    parsedBlocks.forEach(parsed => {
      processBlock(parsed, 100, yOffset)
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
      // 如果是多行结构，跳过已处理的行
      if (parsed.children) {
        i = skipToEndTag(lines, i, parsed.type) + 1
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
 * 跳到结束标签位置
 */
function skipToEndTag(lines: string[], startIndex: number, blockType: string): number {
  const upperType = blockType.toUpperCase()
  let depth = 1
  
  for (let i = startIndex + 1; i < lines.length; i++) {
    const upperLine = lines[i].toUpperCase()
    
    // 检查嵌套开始（支持 Private/Public 前缀）
    if (upperType === 'SUB' && (upperLine.startsWith('SUB ') || upperLine.includes(' SUB '))) depth++
    if (upperType === 'FUNCTION' && (upperLine.startsWith('FUNCTION ') || upperLine.includes(' FUNCTION '))) depth++
    if (upperType === 'IF-STATEMENT' && upperLine.startsWith('IF ') && upperLine.includes(' THEN')) depth++
    if (upperType === 'FOR-LOOP' && upperLine.startsWith('FOR ')) depth++
    if (upperType === 'DO-WHILE-LOOP' && upperLine.startsWith('DO ')) depth++
    if (upperType === 'SELECT-CASE' && upperLine.startsWith('SELECT CASE ')) depth++
    if (upperType === 'WITH-STATEMENT' && upperLine.startsWith('WITH ')) depth++
    
    // 检查结束标签
    if (upperType === 'SUB' && upperLine === 'END SUB') depth--
    if (upperType === 'FUNCTION' && upperLine === 'END FUNCTION') depth--
    if (upperType === 'IF-STATEMENT' && upperLine === 'END IF') depth--
    if (upperType === 'FOR-LOOP' && (upperLine === 'NEXT' || upperLine.startsWith('NEXT '))) depth--
    if (upperType === 'DO-WHILE-LOOP' && (upperLine === 'LOOP' || upperLine.startsWith('LOOP '))) depth--
    if (upperType === 'SELECT-CASE' && upperLine === 'END SELECT') depth--
    if (upperType === 'WITH-STATEMENT' && upperLine === 'END WITH') depth--
    
    if (depth === 0) return i
  }
  
  return lines.length - 1
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
    return parseSubDefinition(line, allLines, currentIndex, result)
  }

  // Function 定义（支持 Private/Public 前缀）
  if (line.match(/^(?:Public|Private)?\s*Function\s+/i)) {
    return parseFunctionDefinition(line, allLines, currentIndex, result)
  }

  // With 语句块
  if (line.match(/^With\s+/i)) {
    return parseWithStatement(line, allLines, currentIndex, result)
  }

  // With 块内的属性赋值（以 . 开头）
  if (line.match(/^\.\w+/)) {
    return parseWithPropertyAssignment(line)
  }

  // If 语句
  if (line.match(/^If\s+/i)) {
    return parseIfStatement(line, allLines, currentIndex, result)
  }

  // Else 语句
  if (line.match(/^ElseIf?\s*/i) || line.toUpperCase() === 'ELSE') {
    return parseElseStatement(line)
  }

  // For 循环
  if (line.match(/^For\s+/i)) {
    return parseForLoop(line, allLines, currentIndex, result)
  }

  // Do While 循环
  if (line.match(/^Do\s+/i) || line.match(/^While\s+/i)) {
    return parseDoWhileLoop(line, allLines, currentIndex, result)
  }

  // Select Case
  if (line.match(/^Select\s+Case\s+/i)) {
    return parseSelectCase(line, allLines, currentIndex, result)
  }

  // MsgBox
  if (line.match(/^MsgBox\s+/i)) {
    return parseMsgBox(line)
  }

  // InputBox
  if (line.match(/^InputBox\s*\(/i)) {
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

  // 条件格式操作
  if (line.match(/FormatConditions/i)) {
    return parseFormatConditions(line)
  }

  // Range 操作 (Excel 特有)
  if (line.match(/Range\s*\(/i) || line.match(/Cells\s*\(/i)) {
    return parseRangeOperation(line)
  }

  // Worksheets/Sheets 操作
  if (line.match(/Worksheets?\s*\(/i) || line.match(/Sheets\s*\(/i)) {
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
  const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_.\(\)"\s]*)\s*=\s*(.+)$/)
  
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
 * 解析 Set 语句
 */
function parseSetStatement(line: string): ParsedBlock {
  // Set obj = Something
  const match = line.match(/Set\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/i)
  
  if (match) {
    return {
      type: 'set-object',
      definitionId: 'block-set-object',
      properties: {
        varName: match[1],
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
    let buttons = 'vbOKOnly'
    let title = ''

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
 * 解析 InputBox
 */
function parseInputBox(line: string): ParsedBlock {
  // result = InputBox("prompt", "title", "default")
  const match = line.match(/InputBox\s*\(([^)]+)\)/i)
  
  if (match) {
    const args = match[1].split(',').map(a => a.trim())
    return {
      type: 'inputbox',
      definitionId: 'block-inputbox',
      properties: {
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
    properties: { prompt: '', title: '', default: '' },
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
 * 解析 Call 语句
 */
function parseCallStatement(line: string): ParsedBlock {
  const match = line.match(/Call\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\(([^)]*)\))?/i)
  
  if (match) {
    return {
      type: 'call-sub',
      definitionId: 'block-call-sub',
      properties: {
        subName: match[1],
        arguments: match[2] || ''
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 On Error
 */
function parseOnError(line: string): ParsedBlock {
  const match = line.match(/On\s+Error\s+(Resume\s+Next|GoTo\s+\w+|GoTo\s+0)/i)
  
  if (match) {
    return {
      type: 'on-error',
      definitionId: 'block-on-error',
      properties: {
        action: match[1]
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Exit 语句
 */
function parseExitStatement(line: string): ParsedBlock {
  const match = line.match(/Exit\s+(Sub|Function|For|Do)/i)
  
  if (match) {
    return {
      type: 'exit',
      definitionId: 'block-exit',
      properties: {
        exitType: match[1]
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Sub 定义
 */
function parseSubDefinition(
  line: string, 
  allLines: string[], 
  currentIndex: number,
  result: ParseResult
): ParsedBlock {
  // Sub Name(Params) 或 Public Sub Name(Params) 或 Private Sub Name(Params)
  // 支持中文和其他 Unicode 字符
  const match = line.match(/(?:Public|Private)?\s*Sub\s+([\w\u4e00-\u9fff]+)\s*\(([^)]*)\)?/i)
  
  if (match) {
    // 收集 Sub 内部的代码块
    const innerBlocks = collectInnerBlocks(allLines, currentIndex + 1, 'Sub', result)
    
    return {
      type: 'sub',
      definitionId: 'block-sub',
      properties: {
        subName: match[1],
        parameters: match[2] || ''
      },
      lineNumber: currentIndex,
      children: innerBlocks
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Function 定义
 */
function parseFunctionDefinition(
  line: string, 
  allLines: string[], 
  currentIndex: number,
  result: ParseResult
): ParsedBlock {
  // Function Name(Params) As ReturnType
  // 支持中文和其他 Unicode 字符
  const match = line.match(/(?:Public|Private)?\s*Function\s+([\w\u4e00-\u9fff]+)\s*\(([^)]*)\)?\s*(?:As\s+(\w+))?/i)
  
  if (match) {
    // 收集 Function 内部的代码块
    const innerBlocks = collectInnerBlocks(allLines, currentIndex + 1, 'Function', result)
    
    return {
      type: 'function',
      definitionId: 'block-function',
      properties: {
        funcName: match[1],
        parameters: match[2] || '',
        returnType: match[3] || 'Variant'
      },
      lineNumber: currentIndex,
      children: innerBlocks
    }
  }

  return parseCustomCode(line)
}

/**
 * 收集结构内部的代码块
 */
function collectInnerBlocks(
  allLines: string[], 
  startIndex: number,
  parentType: string,
  _result: ParseResult
): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  let i = startIndex
  
  const parentUpper = parentType.toUpperCase()
  
  while (i < allLines.length) {
    const line = allLines[i]
    const upperLine = line.toUpperCase()
    
    // 检查是否到达当前结构的结束标签
    if (parentUpper === 'SUB' && upperLine === 'END SUB') break
    if (parentUpper === 'FUNCTION' && upperLine === 'END FUNCTION') break
    if (parentUpper === 'IF-STATEMENT' && upperLine === 'END IF') break
    if (parentUpper === 'FOR-LOOP' && (upperLine === 'NEXT' || upperLine.startsWith('NEXT '))) break
    if (parentUpper === 'DO-WHILE-LOOP' && (upperLine === 'LOOP' || upperLine.startsWith('LOOP '))) break
    if (parentUpper === 'SELECT-CASE' && upperLine === 'END SELECT') break
    if (parentUpper === 'WITH' && upperLine === 'END WITH') break
    
    // 解析内部代码行
    const parsed = parseLine(line, allLines, i, _result)
    if (parsed) {
      blocks.push(parsed)
      // 如果是多行结构（如嵌套的 Sub/Function），跳过已处理的行
      if (parsed.children && parsed.children.length > 0) {
        i = skipToEndTag(allLines, i, parsed.type)
      }
    }
    i++
  }
  
  return blocks
}

/**
 * 解析 If 语句
 */
function parseIfStatement(
  line: string, 
  _allLines: string[], 
  currentIndex: number,
  _result: ParseResult
): ParsedBlock {
  // If condition Then
  const match = line.match(/If\s+(.+)\s+Then\s*(.*)/i)
  
  if (match) {
    return {
      type: 'if-statement',
      definitionId: 'block-if-statement',
      properties: {
        condition: match[1].trim(),
        thenCode: match[2] || ''
      },
      lineNumber: currentIndex,
      children: []
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Else 语句
 */
function parseElseStatement(line: string): ParsedBlock {
  const upperLine = line.toUpperCase()
  
  // Else
  if (upperLine === 'ELSE') {
    return {
      type: 'else-statement',
      definitionId: 'block-else-statement',
      properties: {},
      lineNumber: 0
    }
  }
  
  // ElseIf condition Then
  const match = line.match(/ElseIf\s+(.+)\s+Then/i)
  if (match) {
    return {
      type: 'elseif-statement',
      definitionId: 'block-elseif-statement',
      properties: {
        condition: match[1].trim()
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 With 语句块
 */
function parseWithStatement(
  line: string, 
  allLines: string[], 
  currentIndex: number,
  result: ParseResult
): ParsedBlock {
  // With object
  const match = line.match(/With\s+(.+)/i)
  
  if (match) {
    // 收集 With 内部的代码块
    const innerBlocks = collectInnerBlocks(allLines, currentIndex + 1, 'With', result)
    
    return {
      type: 'with-statement',
      definitionId: 'block-with-statement',
      properties: {
        object: match[1].trim()
      },
      lineNumber: currentIndex,
      children: innerBlocks
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
  // Application.GetOpenFilename(...)
  // Application.GetSaveAsFilename(...)
  // Application.ScreenUpdating = True/False
  
  const openMatch = line.match(/Application\.GetOpenFilename\s*\(([^)]*)\)/i)
  if (openMatch) {
    return {
      type: 'application-getopenfilename',
      definitionId: 'block-application-getopenfilename',
      properties: {
        fileFilter: openMatch[1] || '',
        resultVar: ''
      },
      lineNumber: 0
    }
  }
  
  const saveMatch = line.match(/Application\.GetSaveAsFilename\s*\(([^)]*)\)/i)
  if (saveMatch) {
    return {
      type: 'application-getsaveasfilename',
      definitionId: 'block-application-getsaveasfilename',
      properties: {
        initialFilename: saveMatch[1] || '',
        resultVar: ''
      },
      lineNumber: 0
    }
  }
  
  // Application 属性赋值
  const propMatch = line.match(/Application\.(\w+)\s*=\s*(.+)/i)
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
 * 解析条件格式操作
 */
function parseFormatConditions(line: string): ParsedBlock {
  // Range(...).FormatConditions.Add Type, Operator, Formula1
  // Range(...).FormatConditions.Delete
  
  const deleteMatch = line.match(/FormatConditions\.Delete/i)
  if (deleteMatch) {
    return {
      type: 'formatconditions-delete',
      definitionId: 'block-formatconditions-delete',
      properties: {},
      lineNumber: 0
    }
  }
  
  const addMatch = line.match(/FormatConditions\.Add\s+(\w+),\s*(\w+),\s*(.+)/i)
  if (addMatch) {
    return {
      type: 'formatconditions-add',
      definitionId: 'block-formatconditions-add',
      properties: {
        type: addMatch[1],
        operator: addMatch[2],
        formula: addMatch[3].trim()
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析无 Call 的过程调用
 */
function parseProcedureCall(line: string): ParsedBlock {
  // ProcedureName arg1, arg2
  // ProcedureName
  const match = line.match(/^([\w\u4e00-\u9fff]+)(?:\s+(.+))?$/)
  
  if (match) {
    return {
      type: 'call-sub',
      definitionId: 'block-call-sub',
      properties: {
        subName: match[1],
        arguments: match[2] || ''
      },
      lineNumber: 0
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 For 循环
 */
function parseForLoop(
  line: string, 
  _allLines: string[], 
  currentIndex: number,
  _result: ParseResult
): ParsedBlock {
  // For i = 1 To 10 Step 1
  // For Each item In collection
  const forEachMatch = line.match(/For\s+Each\s+(\w+)\s+In\s+(.+)/i)
  
  if (forEachMatch) {
    return {
      type: 'for-each-loop',
      definitionId: 'block-for-each-loop',
      properties: {
        element: forEachMatch[1],
        collection: forEachMatch[2].trim(),
        loopBody: ''
      },
      lineNumber: currentIndex,
      children: []
    }
  }

  const forMatch = line.match(/For\s+(\w+)\s*=\s*(\d+)\s+To\s+(\d+)(?:\s+Step\s+(\d+))?/i)
  
  if (forMatch) {
    return {
      type: 'for-loop',
      definitionId: 'block-for-loop',
      properties: {
        counter: forMatch[1],
        start: parseInt(forMatch[2]),
        end: parseInt(forMatch[3]),
        step: forMatch[4] ? parseInt(forMatch[4]) : 1,
        loopBody: ''
      },
      lineNumber: currentIndex,
      children: []
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Do While 循环
 */
function parseDoWhileLoop(
  line: string, 
  _allLines: string[], 
  currentIndex: number,
  _result: ParseResult
): ParsedBlock {
  // Do While condition
  // Do Until condition
  const match = line.match(/Do\s+(While|Until)\s+(.+)/i)
  
  if (match) {
    return {
      type: 'do-while-loop',
      definitionId: 'block-do-while-loop',
      properties: {
        condition: match[2].trim(),
        loopBody: ''
      },
      lineNumber: currentIndex,
      children: []
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Select Case
 */
function parseSelectCase(
  line: string, 
  _allLines: string[], 
  currentIndex: number,
  _result: ParseResult
): ParsedBlock {
  const match = line.match(/Select\s+Case\s+(.+)/i)
  
  if (match) {
    return {
      type: 'select-case',
      definitionId: 'block-select-case',
      properties: {
        expression: match[1].trim()
      },
      lineNumber: currentIndex,
      children: []
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Range 操作
 */
function parseRangeOperation(line: string): ParsedBlock {
  // 尝试识别常见的 Range 操作模式
  // Range("A1").Value = xxx
  // Range("A1:B10").Select
  // Cells(1, 1).Value = xxx
  
  const rangeMatch = line.match(/Range\s*\(\s*"([^"]+)"\s*\)/i)
  const cellsMatch = line.match(/Cells\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/i)
  
  if (rangeMatch) {
    // 检查是否是赋值
    const assignMatch = line.match(/Range\s*\([^)]+\)\s*\.?\s*(\w*)\s*=\s*(.+)/i)
    if (assignMatch) {
      return {
        type: 'range-set',
        definitionId: 'block-range-set',
        properties: {
          range: rangeMatch[1],
          property: assignMatch[1] || 'Value',
          value: assignMatch[2].trim()
        },
        lineNumber: 0
      }
    }
  }

  if (cellsMatch) {
    const assignMatch = line.match(/Cells\s*\([^)]+\)\s*\.?\s*(\w*)\s*=\s*(.+)/i)
    if (assignMatch) {
      return {
        type: 'range-set',
        definitionId: 'block-range-set',
        properties: {
          range: `Cells(${cellsMatch[1]}, ${cellsMatch[2]})`,
          property: assignMatch[1] || 'Value',
          value: assignMatch[2].trim()
        },
        lineNumber: 0
      }
    }
  }

  return parseCustomCode(line)
}

/**
 * 解析 Worksheet 操作
 */
function parseWorksheetOperation(line: string): ParsedBlock {
  // Worksheets("Sheet1").Select
  // Sheets(1).Activate
  
  const match = line.match(/(?:Worksheets?|Sheets)\s*\(\s*"?([^")]+)"?\s*\)\s*\.?\s*(\w*)/i)
  
  if (match) {
    return {
      type: 'worksheet-activate',
      definitionId: 'block-worksheet-activate',
      properties: {
        sheetName: match[1],
        action: match[2] || 'Activate'
      },
      lineNumber: 0
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
    // 如果找不到定义，使用自定义代码块
    return {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      definitionId: 'block-custom-code',
      type: BlockType.COMMENT,
      position: { x, y },
      properties: { code: JSON.stringify(parsed.properties) },
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

/**
 * 验证 VBA 代码语法（简单验证）
 */
export function validateVBACode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // 检查基本语法结构
  const openBraces = (code.match(/\(/g) || []).length
  const closeBraces = (code.match(/\)/g) || []).length
  
  if (openBraces !== closeBraces) {
    errors.push('括号不匹配')
  }

  // 检查 If/End If 配对
  const ifCount = (code.match(/\bIf\b/gi) || []).length
  const endIfCount = (code.match(/\bEnd\s+If\b/gi) || []).length
  if (ifCount !== endIfCount) {
    errors.push('If/End If 不匹配')
  }

  // 检查 For/Next 配对
  const forCount = (code.match(/\bFor\b/gi) || []).length
  const nextCount = (code.match(/\bNext\b/gi) || []).length
  if (forCount !== nextCount) {
    errors.push('For/Next 不匹配')
  }

  // 检查 Sub/End Sub 配对
  const subCount = (code.match(/\bSub\b/gi) || []).length
  const endSubCount = (code.match(/\bEnd\s+Sub\b/gi) || []).length
  if (subCount !== endSubCount) {
    errors.push('Sub/End Sub 不匹配')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
