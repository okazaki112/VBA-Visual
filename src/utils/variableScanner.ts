/**
 * 变量收集与引用分析引擎（B 线规则智能）
 * 纯函数实现，便于无头单测
 */
import type { BlockInstance } from '@/types'
import { getBlockDefinition } from './blockDefinitions'

export interface VariableInfo {
  name: string
  kind: 'declare' | 'const' | 'loop' | 'assign' | 'input' | 'read'
  type?: string
  sourceBlockId: string
}

export interface UndeclaredWarning {
  blockId: string
  propName: string
  identifier: string
}

// 收集变量的属性 ID（出现即视为声明/引入变量）
const VAR_PROP_IDS = ['varName', 'constName', 'counter', 'element', 'keyVar']

// VBA 关键字与内置标识符（引用检查时排除，不区分大小写）
const VBA_KEYWORDS = new Set([
  'sub', 'function', 'end', 'if', 'then', 'else', 'elseif', 'for', 'each', 'in', 'to', 'step',
  'next', 'do', 'while', 'until', 'loop', 'wend', 'select', 'case', 'with', 'dim', 'const',
  'set', 'let', 'call', 'exit', 'on', 'error', 'goto', 'resume', 'option', 'explicit', 'redim',
  'preserve', 'true', 'false', 'nothing', 'empty', 'null', 'and', 'or', 'not', 'mod', 'is',
  'msgbox', 'inputbox', 'debug', 'print', 'range', 'cells', 'worksheets', 'sheets', 'workbook',
  'workbooks', 'activesheet', 'activeworkbook', 'application', 'thisworkbook', 'rows', 'columns',
  'value', 'name', 'count', 'item', 'add', 'delete', 'clear', 'activate', 'select_',
  'string', 'integer', 'long', 'double', 'boolean', 'date', 'variant', 'object', 'worksheet',
  'abs', 'int', 'fix', 'sqr', 'sgn', 'log', 'exp', 'sin', 'cos', 'tan', 'atn', 'round', 'mid',
  'left', 'right', 'len', 'trim', 'ltrim', 'rtrim', 'replace', 'instr', 'format', 'now', 'cstr',
  'cint', 'clng', 'cdbl', 'csng', 'cbool', 'cdate', 'cvar', 'dateadd', 'datediff', 'datepart',
  'err', 'errhandler', 'xlup', 'xldown', 'vblf', 'vbcrlf', 'vbokonly', 'vbyesno', 'vbcritical',
  'vbquestion', 'vbexclamation', 'vbinformation', 'vbokcancel', 'vbyesnocancel', 'vbyes', 'vbno'
])

/**
 * 收集画布上声明的全部变量
 * 扫描来源：变量/常量声明、循环计数器、赋值左值、输入框/单元格读取、字典键变量
 */
export function collectVariables(blocks: BlockInstance[]): VariableInfo[] {
  const result: VariableInfo[] = []
  const seen = new Set<string>()

  const ordered = [...blocks].sort((a, b) => a.order - b.order)

  ordered.forEach(block => {
    const props = block.properties

    // 通用变量属性
    VAR_PROP_IDS.forEach(propId => {
      const raw = props[propId]
      if (typeof raw === 'string' && raw.trim()) {
        const name = normalizeVarName(raw)
        pushVar(result, seen, name, kindOfProp(propId), undefined, block.id)
      }
    })

    // 赋值语句左值（含 Set 前缀的对象赋值）
    if (block.definitionId === 'block-assignment') {
      const left = normalizeVarName(String(props.varName ?? ''))
      if (left) {
        pushVar(result, seen, left, 'assign', undefined, block.id)
      }
    }
  })

  return result
}

function kindOfProp(propId: string): VariableInfo['kind'] {
  switch (propId) {
    case 'varName': return 'declare'
    case 'constName': return 'const'
    case 'counter':
    case 'element':
    case 'keyVar': return 'loop'
    default: return 'assign'
  }
}

function pushVar(
  list: VariableInfo[],
  seen: Set<string>,
  name: string,
  kind: VariableInfo['kind'],
  type: string | undefined,
  blockId: string
) {
  if (!name) return
  const key = name.toLowerCase()
  if (seen.has(key)) return
  seen.add(key)
  list.push({ name, kind, type, sourceBlockId: blockId })
}

/**
 * 查找未声明引用
 * 扫描全部 expression 类型属性中的标识符（剔除字符串字面量、点号属性、函数调用、关键字），
 * 与已声明变量比对（VBA 不区分大小写）
 */
export function findUndeclaredReferences(
  blocks: BlockInstance[],
  variables: VariableInfo[]
): UndeclaredWarning[] {
  const declared = new Set(variables.map(v => v.name.toLowerCase()))
  const warnings: UndeclaredWarning[] = []
  const reported = new Set<string>()

  blocks.forEach(block => {
    const def = getBlockDefinition(block.definitionId)
    if (!def) return

    def.properties
      .filter(prop => prop.type === 'expression')
      .forEach(prop => {
        const raw = block.properties[prop.id]
        if (typeof raw !== 'string' || !raw.trim()) return

        extractIdentifiers(raw).forEach(identifier => {
          const key = `${block.id}|${prop.id}|${identifier.toLowerCase()}`
          if (!declared.has(identifier.toLowerCase()) && !reported.has(key)) {
            reported.add(key)
            warnings.push({ blockId: block.id, propName: prop.id, identifier })
          }
        })
      })
  })

  return warnings
}

/**
 * 从表达式提取需要检查的自由标识符
 * 规则：剔除字符串字面量；剔除点号后的属性/方法；剔除后跟 "(" 的函数调用；剔除关键字
 */
function extractIdentifiers(expression: string): string[] {
  const cleaned = expression.replace(/"[^"]*"/g, ' ') // 去字符串字面量
  const found: string[] = []
  const re = /([A-Za-z_][A-Za-z0-9_]*)/g
  let match: RegExpExecArray | null

  while ((match = re.exec(cleaned)) !== null) {
    const identifier = match[1]
    const lower = identifier.toLowerCase()

    // 点号后的属性/方法引用，跳过
    const before = cleaned.slice(0, match.index).trimEnd()
    if (before.endsWith('.')) continue
    // 函数调用名，跳过
    const after = cleaned.slice(match.index + identifier.length).trimStart()
    if (after.startsWith('(')) continue
    // 关键字/内置量，跳过
    if (VBA_KEYWORDS.has(lower)) continue

    found.push(identifier)
  }

  return found
}

// ==================== v1.3.0 规则智能扩展 ====================

// 视为"变量引用/声明"的属性字段（跨模块共享）
export const VARIABLE_FIELD_IDS = ['varName', 'constName', 'counter', 'element', 'keyVar', 'dictName', 'chartName', 'pivotName', 'regexName']

// 规范变量名（导出供重命名/校验复用）
export function normalizeVarName(raw: string): string {
  let name = raw.trim()
  name = name.replace(/^Set\s+/i, '')
  if (name.includes('.')) {
    name = name.split('.')[0].trim()
  }
  name = name.replace(/[()"].*$/, '').trim()
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : ''
}

export interface VariableOccurrence {
  blockId: string
  propName: string
  identifier: string
}

/**
 * 构建标识符出现索引：全部积木的 text/expression 属性中出现的标识符
 * （供未使用检测 / 重命名联动 / 变量焦点高亮反查）
 */
export function buildOccurrenceIndex(blocks: BlockInstance[]): VariableOccurrence[] {
  const occurrences: VariableOccurrence[] = []

  blocks.forEach(block => {
    const def = getBlockDefinition(block.definitionId)
    if (!def) return

    def.properties
      .filter(prop => prop.type === 'expression' || (prop.type === 'text' && VARIABLE_FIELD_IDS.includes(prop.id)))
      .forEach(prop => {
        const raw = block.properties[prop.id]
        if (typeof raw !== 'string' || !raw.trim()) return
        extractIdentifiers(raw).forEach(identifier => {
          occurrences.push({ blockId: block.id, propName: prop.id, identifier })
        })
      })
  })

  return occurrences
}

/**
 * 收集全部变量声明（不去重，供重复声明检测）
 */
export function collectVariableDeclarations(blocks: BlockInstance[]): VariableInfo[] {
  const result: VariableInfo[] = []
  const ordered = [...blocks].sort((a, b) => a.order - b.order)

  ordered.forEach(block => {
    const props = block.properties
    VAR_PROP_IDS.forEach(propId => {
      const raw = props[propId]
      if (typeof raw === 'string' && raw.trim()) {
        const name = normalizeVarName(raw)
        if (name) {
          result.push({ name, kind: kindOfProp(propId), type: undefined, sourceBlockId: block.id })
        }
      }
    })
    if (block.definitionId === 'block-assignment') {
      const left = normalizeVarName(String(props.varName ?? ''))
      if (left) {
        result.push({ name: left, kind: 'assign', type: undefined, sourceBlockId: block.id })
      }
    }
  })

  return result
}

/**
 * 未使用变量：声明后引用计数为 0（引用按大小写不敏感匹配）
 */
export function findUnusedVariables(
  declarations: VariableInfo[],
  occurrences: VariableOccurrence[]
): VariableInfo[] {
  // 变量在其自身声明块上的出现不计为引用（否则永远不会判定为未使用）
  const selfDeclFields = new Set(
    declarations.map(d => `${d.sourceBlockId}|${d.name.toLowerCase()}`)
  )
  const refCounts = new Map<string, number>()
  occurrences.forEach(o => {
    if (selfDeclFields.has(`${o.blockId}|${o.identifier.toLowerCase()}`)) return
    const key = o.identifier.toLowerCase()
    refCounts.set(key, (refCounts.get(key) || 0) + 1)
  })

  // 同名多次声明时：任一声明被引用即视为已使用；同名去重（每个未使用名字只报一条）
  const unusedNames = new Set<string>()
  declarations.forEach(d => {
    if (!(refCounts.get(d.name.toLowerCase()) || 0)) {
      unusedNames.add(d.name.toLowerCase())
    }
  })

  const seen = new Set<string>()
  return declarations.filter(d => {
    const key = d.name.toLowerCase()
    if (!unusedNames.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export interface DuplicateDeclaration {
  name: string
  blocks: string[]
}

/**
 * 重复声明：同名变量被声明多次（不同积木）
 */
export function findDuplicateDeclarations(declarations: VariableInfo[]): DuplicateDeclaration[] {
  const byName = new Map<string, string[]>()
  declarations.forEach(d => {
    const key = d.name.toLowerCase()
    const list = byName.get(key) || []
    if (!list.includes(d.sourceBlockId)) list.push(d.sourceBlockId)
    byName.set(key, list)
  })

  const duplicates: DuplicateDeclaration[] = []
  byName.forEach((blocks, key) => {
    if (blocks.length > 1) {
      duplicates.push({ name: declarations.find(d => d.name.toLowerCase() === key)!.name, blocks })
    }
  })
  return duplicates
}

export interface LoopBoundWarning {
  blockId: string
  message: string
}

/**
 * 循环边界启发式检查：数字起止与步长方向矛盾时循环体不会执行
 */
export function findLoopBoundWarnings(blocks: BlockInstance[]): LoopBoundWarning[] {
  const warnings: LoopBoundWarning[] = []

  blocks.forEach(block => {
    if (block.definitionId !== 'block-for-loop') return
    const start = Number(block.properties.start)
    const end = Number(block.properties.end)
    const stepRaw = block.properties.step
    const step = Number(stepRaw === undefined || stepRaw === '' ? 1 : stepRaw)
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step === 0) return

    if (start > end && step > 0) {
      warnings.push({
        blockId: block.id,
        message: '循环起点大于终点且步长为正，循环体不会执行（反向循环需负 Step）'
      })
    } else if (start < end && step < 0) {
      warnings.push({
        blockId: block.id,
        message: '循环起点小于终点且步长为负，循环体不会执行'
      })
    }
  })

  return warnings
}

/**
 * 重命名联动：全画布词边界替换标识符
 * 规则：跳过字符串字面量、点号后的属性、函数调用名、VBA 关键字
 * 直接修改 blocks 属性，返回被修改的属性清单（供画布节点数据同步）
 */
export function replaceIdentifierOccurrences(
  blocks: BlockInstance[],
  from: string,
  to: string,
  excludeBlockId?: string
): Array<{ blockId: string; propName: string }> {
  const changed: Array<{ blockId: string; propName: string }> = []
  const fromLower = from.toLowerCase()

  blocks.forEach(block => {
    if (excludeBlockId && block.id === excludeBlockId) return
    const def = getBlockDefinition(block.definitionId)
    if (!def) return

    def.properties
      .filter(prop => prop.type === 'expression' || prop.type === 'text')
      .forEach(prop => {
        const raw = block.properties[prop.id]
        if (typeof raw !== 'string' || !raw.trim()) return
        const replaced = replaceIdentifiersInText(raw, fromLower, to)
        if (replaced !== raw) {
          block.properties[prop.id] = replaced
          changed.push({ blockId: block.id, propName: prop.id })
        }
      })
  })

  return changed
}

// 词边界替换单个文本：保留原结构，仅替换自由出现的标识符
function replaceIdentifiersInText(text: string, fromLower: string, to: string): string {
  // 先按字符串字面量切段，段外做标识符替换
  const parts: string[] = []
  const stringRegex = /"[^"]*"/g
  let last = 0
  let m: RegExpExecArray | null

  const replaceOutside = (segment: string): string => {
    let out = ''
    const idRegex = /[A-Za-z_][A-Za-z0-9_]*/g
    let im: RegExpExecArray | null
    let pos = 0
    while ((im = idRegex.exec(segment)) !== null) {
      const identifier = im[0]
      if (identifier.toLowerCase() !== fromLower) continue
      const before = segment.slice(0, im.index).trimEnd()
      const after = segment.slice(im.index + identifier.length).trimStart()
      if (before.endsWith('.')) continue       // 点号属性
      if (after.startsWith('(')) continue      // 函数调用
      if (VBA_KEYWORDS.has(identifier.toLowerCase())) continue
      out += segment.slice(pos, im.index) + to
      pos = im.index + identifier.length
    }
    out += segment.slice(pos)
    return out
  }

  while ((m = stringRegex.exec(text)) !== null) {
    parts.push(replaceOutside(text.slice(last, m.index)))
    parts.push(m[0])
    last = m.index + m[0].length
  }
  parts.push(replaceOutside(text.slice(last)))
  return parts.join('')
}
