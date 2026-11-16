/**
 * VBA 代码编辑器纯函数工具（v1.10.0 写代码交互智能化）
 * 智能缩进 / 光标插入 / 片段结构配对——全部纯函数，可无头单测
 */

// 结构开启词（行首，触发下一行 +1 缩进；支持 Public/Private 前缀）
const OPENERS = /^(?:(?:public|private)\s+)?(?:if\b.*\bthen\s*$|for\b|do\b|with\b|select\s+case\b|sub\b|function\b)/i
// 同级关键词（Else / ElseIf / Case：不加缩进）
const SAME_LEVEL = /^(else\b|elseif\b|case\b)/i
// 结构关闭词（行首，触发 -1 缩进）
const CLOSERS = /^(end\b|next\b|loop\b|wend\b)/i

/**
 * 计算 Enter 后新行的缩进（以“光标前最近一行”的缩进与内容为依据）
 * 规则（对齐 VS Code 语义）：
 * - 上一行是结构开启（If..Then / For / Do / With / Select Case / Sub / Function）→ +1 级
 * - 上一行是 Else / ElseIf / Case → 保持同级
 * - 上一行以 End / Next / Loop / Wend 开头 → -1 级（下限 0）
 */
export function nextIndentAfter(textBefore: string, indentUnit = '    '): string {
  const lines = textBefore.split('\n')
  const prevLine = lines[lines.length - 1] ?? ''
  const trimmed = prevLine.trim()
  const currentIndentMatch = prevLine.match(/^[ \t]*/)
  const currentIndent = currentIndentMatch ? currentIndentMatch[0] : ''
  const level = Math.floor(currentIndent.length / indentUnit.length) || 0

  if (!trimmed) return currentIndent
  if (CLOSERS.test(trimmed)) {
    const nextLevel = Math.max(0, level - 1)
    return indentUnit.repeat(nextLevel)
  }
  if (SAME_LEVEL.test(trimmed)) return currentIndent
  if (OPENERS.test(trimmed)) return currentIndent + indentUnit
  return currentIndent
}

export interface EditResult {
  text: string
  caret: number
}

/**
 * Enter 智能缩进：在光标处换行并写入新行缩进
 */
export function applySmartEnter(text: string, caret: number, indentUnit = '    '): EditResult {
  const safeCaret = Math.max(0, Math.min(caret, text.length))
  const indent = nextIndentAfter(text.slice(0, safeCaret), indentUnit)
  const insert = '\n' + indent
  const next =
    text.slice(0, safeCaret) + insert + text.slice(safeCaret)
  return { text: next, caret: safeCaret + insert.length }
}

/**
 * 在选区位置插入文本（变量 chips / 骨架速插共用）
 * 若有选区则替换选区；返回新文本与光标落点（插入文本末尾）
 */
export function insertAtCursor(
  text: string,
  selStart: number,
  selEnd: number,
  insert: string
): EditResult {
  const start = Math.max(0, Math.min(selStart, text.length))
  const end = Math.max(start, Math.min(selEnd, text.length))
  const next = text.slice(0, start) + insert + text.slice(end)
  return { text: next, caret: start + insert.length }
}

/**
 * 选区整体缩进 / 反缩进（Tab / Shift+Tab 作用于多行选区）
 */
export function indentSelection(
  text: string,
  selStart: number,
  selEnd: number,
  direction: 'in' | 'out',
  indentUnit = '    '
): EditResult {
  const start = Math.max(0, Math.min(selStart, text.length))
  const end = Math.max(start, Math.min(selEnd, text.length))
  const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const head = text.slice(0, lineStart)
  const body = text.slice(lineStart, end)
  const tail = text.slice(end)

  const lines = body.split('\n')
  const adjusted = lines.map(line => {
    if (direction === 'in') return indentUnit + line
    // out：移除行首一级缩进（4 空格或 1 个 Tab）
    if (line.startsWith(indentUnit)) return line.slice(indentUnit.length)
    if (line.startsWith('\t')) return line.slice(1)
    return line
  })

  const nextText = head + adjusted.join('\n') + tail
  const delta = adjusted.join('\n').length - body.length
  return {
    text: nextText,
    caret: direction === 'in' ? end + delta : Math.max(lineStart, end + delta)
  }
}

export interface SnippetBalance {
  openCount: number
  openers: string[]
  balanced: boolean
}

// 片段级结构配对计数（片段常不完整，因此只报“未闭合”而非“错误”）
function matchOpener(trimmed: string): string | null {
  if (/^(?:public\s+|private\s+)?sub\s+\w+/i.test(trimmed)) return 'Sub'
  if (/^(?:public\s+|private\s+)?function\s+\w+/i.test(trimmed)) return 'Function'
  if (/^if\b.*\bthen\s*$/i.test(trimmed)) return 'If'
  if (/^for\b/i.test(trimmed)) return 'For'
  if (/^do\b/i.test(trimmed)) return 'Do'
  if (/^while\b/i.test(trimmed)) return 'While'
  if (/^select\s+case\b/i.test(trimmed)) return 'Select'
  if (/^with\b/i.test(trimmed)) return 'With'
  return null
}

function matchCloser(trimmed: string): string | null {
  if (/^end\s+sub$/i.test(trimmed)) return 'Sub'
  if (/^end\s+function$/i.test(trimmed)) return 'Function'
  if (/^end\s+if$/i.test(trimmed)) return 'If'
  if (/^end\s+select$/i.test(trimmed)) return 'Select'
  if (/^end\s+with$/i.test(trimmed)) return 'With'
  if (/^next\b/i.test(trimmed)) return 'For'
  if (/^loop\b/i.test(trimmed)) return 'Do'
  if (/^wend$/i.test(trimmed)) return 'While'
  return null
}

/**
 * 片段结构配对：返回未闭合结构清单（供编辑器底部实时提示）
 */
export function countOpenBlocks(text: string): SnippetBalance {
  const stack: string[] = []
  text.split('\n').forEach(rawLine => {
    const trimmed = rawLine.trim()
    if (!trimmed || trimmed.startsWith("'")) return
    const closer = matchCloser(trimmed)
    if (closer) {
      const idx = stack.lastIndexOf(closer)
      if (idx >= 0) stack.splice(idx, 1)
      return
    }
    const opener = matchOpener(trimmed)
    if (opener) stack.push(opener)
  })
  return {
    openCount: stack.length,
    openers: [...stack],
    balanced: stack.length === 0
  }
}

// 代码骨架速插（写循环体/分支体的常用起点）
export const CODE_SKELETONS: Array<{ label: string; snippet: string }> = [
  { label: 'If', snippet: 'If x > 1 Then\n    \nEnd If' },
  { label: 'If-Else', snippet: 'If x > 1 Then\n    \nElse\n    \nEnd If' },
  { label: 'For', snippet: 'For i = 1 To 10\n    \nNext i' },
  { label: 'For Each', snippet: 'For Each item In items\n    \nNext item' },
  { label: 'Do While', snippet: 'Do While x < 10\n    \nLoop' },
  { label: 'With', snippet: 'With Range("A1")\n    .Value = 1\nEnd With' },
  { label: 'Select Case', snippet: 'Select Case x\n    Case 1\n        \n    Case Else\n        \nEnd Select' }
]
