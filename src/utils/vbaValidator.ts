/**
 * VBA 静态校验引擎（B 线规则智能）
 * 对生成代码做结构配对 / 括号 / 空体检查，输出带行号的错误清单
 * 纯函数实现，便于无头单测
 */

export interface ValidationError {
  line: number
  message: string
  severity: 'error' | 'warning'
}

interface OpenBlock {
  keyword: string   // Sub / Function / If / For / Do / While / Select / With
  closeWord: string // 期望的结束词
  line: number      // 起始行号（1-based）
  bodyLineCount: number
}

// 开始结构 → 期望结束词
function matchOpener(trimmed: string): { keyword: string; closeWord: string } | null {
  if (/^(?:Public\s+|Private\s+)?Sub\s+\w+/i.test(trimmed)) return { keyword: 'Sub', closeWord: 'End Sub' }
  if (/^(?:Public\s+|Private\s+)?Function\s+\w+/i.test(trimmed)) return { keyword: 'Function', closeWord: 'End Function' }
  // 多行 If：以 Then 结尾（行内 If 已排除）
  if (/^If\b.*\bThen\s*$/i.test(trimmed)) return { keyword: 'If', closeWord: 'End If' }
  if (/^For\b/i.test(trimmed)) return { keyword: 'For', closeWord: 'Next' }
  if (/^Do\b/i.test(trimmed)) return { keyword: 'Do', closeWord: 'Loop' }
  if (/^While\b/i.test(trimmed)) return { keyword: 'While', closeWord: 'Wend' }
  if (/^Select\s+Case\b/i.test(trimmed)) return { keyword: 'Select', closeWord: 'End Select' }
  if (/^With\b/i.test(trimmed)) return { keyword: 'With', closeWord: 'End With' }
  return null
}

function matchCloser(trimmed: string): string | null {
  if (/^End\s+Sub$/i.test(trimmed)) return 'Sub'
  if (/^End\s+Function$/i.test(trimmed)) return 'Function'
  if (/^End\s+If$/i.test(trimmed)) return 'If'
  if (/^End\s+Select$/i.test(trimmed)) return 'Select'
  if (/^End\s+With$/i.test(trimmed)) return 'With'
  if (/^Next\b/i.test(trimmed)) return 'For'
  if (/^Loop\b/i.test(trimmed)) return 'Do'
  if (/^Wend$/i.test(trimmed)) return 'While'
  return null
}

/**
 * 校验 VBA 代码结构
 */
export function validateVBACode(code: string): ValidationError[] {
  const errors: ValidationError[] = []
  const lines = code.split('\n')
  const stack: OpenBlock[] = []

  // 去掉字符串字面量后统计括号配平
  let parenDepth = 0
  let minParenLine = 0

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1
    let line = rawLine
    // 去掉注释与字符串字面量（"" 转义）
    const commentIdx = indexOfComment(line)
    if (commentIdx >= 0) line = line.slice(0, commentIdx)
    line = line.replace(/"[^"]*"/g, '""')

    // 括号配平
    for (const ch of line) {
      if (ch === '(') parenDepth++
      if (ch === ')') {
        parenDepth--
        if (parenDepth < 0 && minParenLine === 0) {
          minParenLine = lineNumber
        }
      }
    }

    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("'")) return

    // 结束词优先检查（同一行不会既是开始又是结束）
    const closer = matchCloser(trimmed)
    if (closer) {
      const top = stack[stack.length - 1]
      if (!top) {
        errors.push({ line: lineNumber, message: `孤立的结束语句「${trimmed}」，没有对应的开始结构`, severity: 'error' })
      } else if (top.keyword !== closer && !isCompatibleClose(top.keyword, closer)) {
        errors.push({
          line: lineNumber,
          message: `「${trimmed}」与第 ${top.line} 行的「${top.keyword}」不匹配，应为「${top.closeWord}」`,
          severity: 'error'
        })
        // 弹出到匹配层为止，尽量恢复后续检查
        stack.pop()
      } else {
        // 空体检查
        if (top.bodyLineCount === 0) {
          errors.push({
            line: top.line,
            message: `第 ${top.line} 行的「${top.keyword}」结构体内容为空`,
            severity: 'warning'
          })
        }
        stack.pop()
        // 结束结构本身计入外层结构的体行数
        if (stack.length > 0) {
          stack[stack.length - 1].bodyLineCount++
        }
      }
      return
    }

    const opener = matchOpener(trimmed)
    if (opener) {
      // 开始结构本身计入外层结构的体行数
      if (stack.length > 0) {
        stack[stack.length - 1].bodyLineCount++
      }
      stack.push({ ...opener, line: lineNumber, bodyLineCount: 0 })
      return
    }

    // 其余语句计入最近结构的体行数
    if (stack.length > 0) {
      stack[stack.length - 1].bodyLineCount++
    }
  })

  if (parenDepth !== 0) {
    errors.push({
      line: minParenLine || lines.length,
      message: parenDepth > 0 ? `括号不匹配：缺少 ${parenDepth} 个右括号` : '括号不匹配：出现多余的右括号',
      severity: 'error'
    })
  }

  // 文件结束仍有未关闭结构
  stack.forEach(item => {
    errors.push({
      line: item.line,
      message: `第 ${item.line} 行的「${item.keyword}」缺少「${item.closeWord}」`,
      severity: 'error'
    })
  })

  return errors.sort((a, b) => a.line - b.line)
}

// While...Wend 与 Do...Loop 等价结构视为可互配（编辑器统一用 Do While 生成）
function isCompatibleClose(opener: string, closer: string): boolean {
  return (opener === 'Do' && closer === 'While') || (opener === 'While' && closer === 'Do')
}

// 找注释起始位置（跳过字符串字面量内的单引号）
function indexOfComment(line: string): number {
  let inString = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      // "" 转义
      if (inString && line[i + 1] === '"') { i++; continue }
      inString = !inString
    } else if (ch === "'" && !inString) {
      return i
    }
  }
  return -1
}
