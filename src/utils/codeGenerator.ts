import type { BlockInstance, Connection } from '@/types'
import { getBlockDefinition } from './blockDefinitions'

/**
 * VBA 代码生成器
 * 根据积木块和连接关系生成 VBA 代码
 * 支持嵌套结构和复杂模板语法
 */

// 特殊积木 ID 常量
const SPECIAL_BLOCKS = {
  OPTION_STATEMENT: 'block-option-statement',
  SUB_DEFINE: 'block-sub-define',
  FUNCTION_DEFINE: 'block-function-define'
}

// 代码映射接口
export interface CodeMapping {
  lineStart: number  // 起始行号（1-based）
  lineEnd: number    // 结束行号（1-based）
  blockId: string    // 积木ID
  blockLabel: string // 积木名称
}

// 代码生成结果接口
export interface GenerateResult {
  code: string
  mappings: CodeMapping[]
}

export const generateCode = (
  blocks: BlockInstance[],
  connections: Connection[]
): string => {
  const result = generateCodeWithMappings(blocks, connections)
  return result.code
}

/**
 * 生成代码并返回映射关系
 */
export const generateCodeWithMappings = (
  blocks: BlockInstance[],
  connections: Connection[]
): GenerateResult => {
  const mappings: CodeMapping[] = []
  
  if (blocks.length === 0) {
    return { code: getDefaultCode(), mappings }
  }

  // 构建连接映射
  const connectionMap = buildConnectionMap(connections)

  // 特殊积木（Option/Sub/Function）没有流程端口，来自它们的连线不参与流程入口判定
  // 注意连线里存的是积木实例 ID，需先换算出特殊积木的实例 ID 集合
  const specialDefIds = new Set([
    SPECIAL_BLOCKS.OPTION_STATEMENT,
    SPECIAL_BLOCKS.SUB_DEFINE,
    SPECIAL_BLOCKS.FUNCTION_DEFINE
  ])
  const specialInstanceIds = new Set(
    blocks.filter(b => specialDefIds.has(b.definitionId)).map(b => b.id)
  )
  const targetIds = new Set(
    connections.filter(c => !specialInstanceIds.has(c.sourceBlockId)).map(c => c.targetBlockId)
  )

  // 检查是否有连线
  const hasConnections = connections.length > 0

  // 分离特殊积木和普通积木
  const optionBlocks = blocks.filter(b => b.definitionId === SPECIAL_BLOCKS.OPTION_STATEMENT)
  const subDefineBlocks = blocks.filter(b => b.definitionId === SPECIAL_BLOCKS.SUB_DEFINE)
  const functionDefineBlocks = blocks.filter(b => b.definitionId === SPECIAL_BLOCKS.FUNCTION_DEFINE)
  const hasUserDefinedSubOrFunction = subDefineBlocks.length > 0 || functionDefineBlocks.length > 0
  
  // 普通积木（排除特殊积木与容器子积木——子积木属于容器体，不参与线性流程）
  const normalBlocks = blocks.filter(b =>
    b.definitionId !== SPECIAL_BLOCKS.OPTION_STATEMENT &&
    b.definitionId !== SPECIAL_BLOCKS.SUB_DEFINE &&
    b.definitionId !== SPECIAL_BLOCKS.FUNCTION_DEFINE &&
    !b.parentId
  )

  // 辅助函数：记录映射（Sub/Function 自定义拼装路径仍使用）
  const recordMapping = (blockId: string, startLine: number, endLine: number) => {
    const block = blocks.find(b => b.id === blockId)
    const def = block ? getBlockDefinition(block.definitionId) : null
    if (def && endLine >= startLine) {
      mappings.push({
        lineStart: startLine,
        lineEnd: endLine,
        blockId,
        blockLabel: def.label
      })
    }
  }

  // F-1：按递归结果写入行级映射（自身 span + 容器子积木 span，基线换算为绝对行号）
  const applyGeneratedSpans = (result: GeneratedBlock, baseLine: number) => {
    result.spans.forEach(sp => {
      const block = blocks.find(b => b.id === sp.blockId)
      const def = block ? getBlockDefinition(block.definitionId) : null
      mappings.push({
        lineStart: baseLine + sp.start - 1,
        lineEnd: baseLine + sp.end - 1,
        blockId: sp.blockId,
        blockLabel: def?.label || sp.blockId
      })
    })
  }

  // 生成代码
  const codeLines: string[] = []
  let currentLine = 1

  // 1. 首先输出 Option 语句（必须在最顶部）
  optionBlocks.forEach(block => {
    const result = generateBlockCodeRecursive(block, blocks, connectionMap, 0)
    if (result.code.trim()) {
      const lines = result.code.trim().split('\n')
      lines.forEach(line => codeLines.push(line))
      applyGeneratedSpans(result, currentLine)
      currentLine += lines.length
    }
  })

  // 如果有 Option 语句，添加空行
  if (optionBlocks.length > 0) {
    codeLines.push("")
    currentLine++
  }

  // 2. 输出用户定义的 Sub/Function
  if (hasUserDefinedSubOrFunction) {
    // 获取普通积木的有序列表
    let orderedNormalBlocks: BlockInstance[] = []
    if (normalBlocks.length > 0) {
      if (hasConnections) {
        const entryNodes = normalBlocks.filter(b => !targetIds.has(b.id))
        orderedNormalBlocks = getOrderedBlocksByConnections(entryNodes, normalBlocks, connectionMap)
      } else {
        orderedNormalBlocks = [...normalBlocks].sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order
          }
          return a.position.y - b.position.y
        })
      }
    }

    // 合并 Sub 和 Function 并按位置排序
    const allSubFunctions = [...subDefineBlocks, ...functionDefineBlocks].sort((a, b) => {
      return a.position.y - b.position.y
    })

    // 处理每个 Sub/Function
    allSubFunctions.forEach((block, index) => {
      const definition = getBlockDefinition(block.definitionId)
      if (!definition) return

      const subStartLine = currentLine
      const isSub = block.definitionId === SPECIAL_BLOCKS.SUB_DEFINE
      const name = isSub 
        ? (block.properties.subName || 'MyMacro')
        : (block.properties.funcName || 'MyFunction')
      const params = block.properties.parameters || ''
      const returnType = isSub ? '' : ` As ${block.properties.returnType || 'Variant'}`
      const customBodyCode = block.properties.bodyCode

      // 生成头部
      if (isSub) {
        codeLines.push(`Sub ${name}(${params})`)
      } else {
        codeLines.push(`Function ${name}(${params})${returnType}`)
      }
      currentLine++

      // 如果有自定义代码，使用自定义代码
      if (customBodyCode && typeof customBodyCode === 'string' && customBodyCode.trim()) {
        const customLines = customBodyCode.split('\n')
          .map((line: string) => '    ' + line.trim())
          .filter((line: string) => line.trim())
        customLines.forEach((line: string) => {
          codeLines.push(line)
          currentLine++
        })
      } else if (index === 0 && orderedNormalBlocks.length > 0) {
        // 第一个 Sub/Function 包含普通积木
        codeLines.push("    ' 让VBA 代码像搭积木一样简单")
        codeLines.push("    ")
        currentLine += 2
        
        orderedNormalBlocks.forEach(normalBlock => {
          const blockStartLine = currentLine
          const result = generateBlockCodeRecursive(normalBlock, blocks, connectionMap, 1)
          if (result.code.trim()) {
            result.code.split('\n').forEach(line => {
              codeLines.push(line)
              currentLine++
            })
            applyGeneratedSpans(result, blockStartLine)
          }
        })
      } else {
        // 其他 Sub/Function 添加占位注释
        codeLines.push("    ' TODO: 添加代码")
        currentLine++
      }

      // 生成尾部
      if (isSub) {
        codeLines.push("End Sub")
      } else {
        codeLines.push("End Function")
      }
      currentLine++
      
      recordMapping(block.id, subStartLine, currentLine - 1)

      // 添加空行分隔
      codeLines.push("")
      currentLine++
    })
  } else {
    // 3. 如果没有用户定义的 Sub/Function，自动生成包装的 Sub
    codeLines.push("Sub GeneratedMacro()")
    codeLines.push("    ' 让VBA 代码像搭积木一样简单")
    codeLines.push("    ")
    currentLine += 3

    // 确定生成顺序
    let orderedBlocks: BlockInstance[]
    
    if (hasConnections) {
      // 有连线：从入口节点开始按连线顺序生成
      const entryNodes = normalBlocks.filter(b => !targetIds.has(b.id))
      orderedBlocks = getOrderedBlocksByConnections(entryNodes, normalBlocks, connectionMap)
      
      // 添加孤立节点警告
      const processedIds = new Set(orderedBlocks.map(b => b.id))
      const orphanBlocks = normalBlocks.filter(b => !processedIds.has(b.id))
      if (orphanBlocks.length > 0) {
        codeLines.push("    ' ⚠️ 以下积木未连接到流程中，已忽略:")
        orphanBlocks.forEach(b => {
          const def = getBlockDefinition(b.definitionId)
          codeLines.push(`    '   - ${def?.label || b.id}`)
        })
        codeLines.push("    ")
        currentLine += orphanBlocks.length + 2
      }
    } else {
      // 无连线：按 order 字段排序
      orderedBlocks = [...normalBlocks].sort((a, b) => {
        // 如果有 order 字段，使用它
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order
        }
        // 兼容旧数据：按 Y 坐标排序
        return a.position.y - b.position.y
      })
    }

    // 生成代码
    orderedBlocks.forEach(block => {
      const blockStartLine = currentLine
      const result = generateBlockCodeRecursive(block, blocks, connectionMap, 1)
      if (result.code.trim()) {
        result.code.split('\n').forEach(line => {
          codeLines.push(line)
          currentLine++
        })
        applyGeneratedSpans(result, blockStartLine)
      }
    })

    codeLines.push("End Sub")
    currentLine++
  }

  return { code: codeLines.join("\n"), mappings }
}

/**
 * 按连线顺序获取有序的积木块列表
 */
const getOrderedBlocksByConnections = (
  entryNodes: BlockInstance[],
  allBlocks: BlockInstance[],
  connectionMap: Map<string, Connection[]>
): BlockInstance[] => {
  const result: BlockInstance[] = []
  const visited = new Set<string>()

  const traverse = (block: BlockInstance) => {
    if (visited.has(block.id)) return
    visited.add(block.id)
    result.push(block)

    // 获取连接的下一个节点
    const conns = connectionMap.get(block.id) || []
    // 按 Y 坐标排序连接（同一层级的节点从上到下）
    const nextBlocks = conns
      .map(conn => allBlocks.find(b => b.id === conn.targetBlockId))
      .filter((b): b is BlockInstance => b !== undefined)
      .sort((a, b) => a.position.y - b.position.y)
    
    nextBlocks.forEach(traverse)
  }

  // 从入口节点开始遍历（按 Y 坐标排序）
  entryNodes.sort((a, b) => a.position.y - b.position.y).forEach(traverse)

  return result
}

/**
 * 构建连接映射
 */
const buildConnectionMap = (connections: Connection[]): Map<string, Connection[]> => {
  const map = new Map<string, Connection[]>()
  connections.forEach(conn => {
    const existing = map.get(conn.sourceBlockId) || []
    existing.push(conn)
    map.set(conn.sourceBlockId, existing)
  })
  return map
}

/**
 * 获取默认代码模板
 */
const getDefaultCode = (): string => {
  return `' 在画布上添加积木块
' 代码将自动生成在这里

Sub MyMacro()
    ' TODO: 添加你的代码

End Sub`
}

/**
 * 生成单个积木块的实际代码（用于编辑器显示）
 * @param block 积木实例
 * @param indentLevel 缩进级别，默认为 0
 * @returns 生成的代码字符串
 */
export const generateBlockCode = (
  block: BlockInstance,
  indentLevel: number = 0
): string => {
  const definition = getBlockDefinition(block.definitionId)
  if (!definition) return ''

  const indent = '    '.repeat(indentLevel)
  
  // 如果有自定义代码，优先使用
  if (block.properties._customCode) {
    const customCode = String(block.properties._customCode)
    if (indentLevel > 0) {
      return customCode.split('\n').map(line => indent + line).join('\n')
    }
    return customCode
  }

  let code = definition.codeTemplate

  // 替换属性占位符
  definition.properties.forEach(prop => {
    const value = block.properties[prop.id] ?? prop.defaultValue
    const placeholder = `{{${prop.id}}}`

    let formattedValue: string
    if (prop.type === 'code') {
      // code 类型：固定补一级缩进（叠加外层整体缩进后正好是块体缩进，F-1 双重缩进修复）
      const codeIndent = '    '
      formattedValue = String(value)
        .split('\n')
        .map(line => line.trim() ? codeIndent + line.trim() : '')
        .join('\n')
    } else if (prop.type === 'formula') {
      // formula 类型：转义双引号（VBA 中用 "" 表示一个双引号）
      formattedValue = String(value).replace(/"/g, '""')
    } else if (prop.type === 'text' || prop.type === 'expression') {
      formattedValue = String(value)
    } else if (prop.type === 'number') {
      formattedValue = String(value)
    } else if (prop.type === 'select') {
      formattedValue = String(value)
    } else if (prop.type === 'boolean') {
      formattedValue = value ? 'True' : 'False'
    } else {
      formattedValue = String(value)
    }

    code = code.replace(new RegExp(placeholder, 'g'), formattedValue)
  })

  // 处理条件占位符
  code = processConditionals(code, block.properties)

  // 移除子节点占位符（单个积木不处理子节点）
  code = code.replace(/\{\{#children\}\}[\s\S]*?\{\{\/children\}\}/g, '')

  // 添加缩进
  if (indentLevel > 0) {
    const lines = code.split('\n').map(line => indent + line).join('\n')
    return lines
  }
  
  return code
}

/**
 * 生成结果：代码 + 行级映射片段（1-based，相对本段代码）
 * F-1 子积木行级映射：容器体内的子积木各自携带 span，父级换算绝对行号
 */
interface GeneratedBlock {
  code: string
  spans: Array<{ blockId: string; start: number; end: number }>
}

/**
 * 递归生成积木块代码
 */
const generateBlockCodeRecursive = (
  block: BlockInstance,
  allBlocks: BlockInstance[],
  connectionMap: Map<string, Connection[]>,
  indentLevel: number
): GeneratedBlock => {
  const definition = getBlockDefinition(block.definitionId)
  if (!definition) return { code: '', spans: [] }

  const indent = '    '.repeat(indentLevel)

  // 如果有自定义代码，优先使用
  if (block.properties._customCode) {
    const customCode = String(block.properties._customCode)
    const codeText = indentLevel > 0
      ? customCode.split('\n').map(line => indent + line).join('\n')
      : customCode
    const lineCount = codeText.split('\n').length
    return { code: codeText, spans: [{ blockId: block.id, start: 1, end: lineCount }] }
  }

  let code = definition.codeTemplate

  // 容器子积木：来自父子关系（拖入容器自动嵌入），流程连线只表达容器之间的先后
  // v1.6.0 双体容器：If-Else 模板含 {{#elseChildren}} 槽位，parentSlot='else' 的子积木进 Else 体
  const isContainer = definition.nestingType === 'container'
  const childBlocks = isContainer
    ? allBlocks.filter(b => b.parentId === block.id)
    : []
  const hasElseSlot = isContainer && code.includes('{{#elseChildren}}')
  const thenChildren = childBlocks.filter(c => c.parentSlot !== 'else')
  const elseChildren = hasElseSlot ? childBlocks.filter(c => c.parentSlot === 'else') : []
  const orderedChildren = isContainer && thenChildren.length > 0
    ? orderChildren(thenChildren, connectionMap)
    : []
  const orderedElseChildren = elseChildren.length > 0
    ? orderChildren(elseChildren, connectionMap)
    : []

  // 替换属性占位符
  definition.properties.forEach(prop => {
    const value = block.properties[prop.id] ?? prop.defaultValue
    const placeholder = `{{${prop.id}}}`

    let formattedValue: string
    if (prop.type === 'code') {
      // 容器有子积木时：子积木优先，对应文本属性占位清空（避免双重内容）
      const thenTaken = orderedChildren.length > 0 && prop.id !== 'elseCode'
      const elseTaken = orderedElseChildren.length > 0 && prop.id === 'elseCode'
      if (isContainer && (thenTaken || elseTaken)) {
        formattedValue = ''
      } else {
        // code 类型：固定补一级缩进（叠加外层整体缩进后正好是块体缩进，F-1 双重缩进修复）
        const codeIndent = '    '
        formattedValue = String(value)
          .split('\n')
          .map(line => line.trim() ? codeIndent + line.trim() : '')
          .join('\n')
      }
    } else if (prop.type === 'text' || prop.type === 'expression') {
      formattedValue = String(value)
    } else if (prop.type === 'number') {
      formattedValue = String(value)
    } else if (prop.type === 'select') {
      formattedValue = String(value)
    } else if (prop.type === 'boolean') {
      formattedValue = value ? 'True' : 'False'
    } else {
      formattedValue = String(value)
    }

    code = code.replace(new RegExp(placeholder, 'g'), formattedValue)
  })

  // 处理条件占位符 {{#if ...}} 和 {{#if (eq ...)}}
  code = processConditionals(code, block.properties)

  // 处理子节点占位符（F-1 行级映射；v1.6.0 双体容器支持 {{#children}}/{{#elseChildren}} 双槽位，
  // 从后往前替换保证行号偏移正确）
  const childSpans: GeneratedBlock['spans'] = []
  const childIndentLevel = indentLevel === 0 ? 1 : indentLevel + 1

  const buildSlotLines = (children: BlockInstance[]): {
    lines: string[]
    spans: GeneratedBlock['spans']
  } => {
    const outLines: string[] = []
    const outSpans: GeneratedBlock['spans'] = []
    orderChildren(children, connectionMap)
      .map(child => generateBlockCodeRecursive(child, allBlocks, connectionMap, childIndentLevel))
      .filter(r => r.code.trim())
      .forEach(result => {
        result.spans.forEach(sp => {
          // 相对本槽代码 1-based（buildSlotLines 内部行号 +1），绝对值由调用方加槽位行偏移
          outSpans.push({
            blockId: sp.blockId,
            start: outLines.length + sp.start,
            end: outLines.length + sp.end
          })
        })
        outLines.push(...result.code.split('\n'))
      })
    return { lines: outLines, spans: outSpans }
  }

  // 槽位从后往前处理（elseChildren 槽行号靠后，先替换不影响 children 槽偏移）
  const slots: Array<{ marker: string; children: BlockInstance[] }> = [
    { marker: '{{#elseChildren}}', children: orderedElseChildren },
    { marker: '{{#children}}', children: orderedChildren }
  ]

  slots.forEach(({ marker, children }) => {
    if (!code.includes(marker)) return

    if (children.length === 0) {
      // 无该槽子积木：移除占位符（体内容回退到文本属性，兼容旧数据）
      // 占位符是双大括号，整体按 marker 转义（\{\{#children\}\}）
      const escMarker = marker.replace(/[{}]/g, ch => '\\' + ch)
      const slotRegex = new RegExp(escMarker + '[\\s\\S]*?' + escMarker.replace('#', '/'), 'g')
      code = code.replace(slotRegex, '')
      return
    }

    const slot = buildSlotLines(children)
    const lines = code.split('\n')
    const slotLineIdx = lines.findIndex(line => line.includes(marker))

    if (slotLineIdx >= 0) {
      // 子积木 span 相对本槽代码 1-based，换算为相对本块代码：槽位行(0-based) + 相对行
      slot.spans.forEach(sp => {
        childSpans.push({
          blockId: sp.blockId,
          start: slotLineIdx + sp.start,
          end: slotLineIdx + sp.end
        })
      })
      lines.splice(slotLineIdx, 1, ...slot.lines)
      code = lines.join('\n')
    } else {
      // 模板未单独占行的兜底：仅做字符串替换（子积木 span 退化并入本块）
      const childCode = slot.lines.join('\n')
      const escMarker = marker.replace(/[{}]/g, ch => '\\' + ch)
      const slotRegex = new RegExp(escMarker + '[\\s\\S]*?' + escMarker.replace('#', '/'), 'g')
      code = code.replace(slotRegex, childCode)
    }
  })

  const lineCount = code.split('\n').length
  // 自身 span 在前、子积木 span 在后（行查找时后写入者胜出=更深层积木）
  const spans: GeneratedBlock['spans'] = [
    { blockId: block.id, start: 1, end: lineCount },
    ...childSpans
  ]

  // 添加缩进（indentLevel 为 0 时不添加缩进，用于顶层代码）
  if (indentLevel > 0) {
    const lines = code.split('\n').map(line => indent + line).join('\n')
    return { code: lines, spans }
  }

  return { code, spans }
}

/**
 * 容器内子积木排序：子积木之间有连线时按连线流（从子入口遍历），
 * 无连线/孤立子积木按 Y 坐标
 */
const orderChildren = (
  children: BlockInstance[],
  connectionMap: Map<string, Connection[]>
): BlockInstance[] => {
  if (children.length <= 1) return children

  const childIds = new Set(children.map(c => c.id))
  const internalTargets = new Set(
    children.flatMap(c => (connectionMap.get(c.id) || []))
      .filter(conn => childIds.has(conn.targetBlockId))
      .map(conn => conn.targetBlockId)
  )

  if (internalTargets.size === 0) {
    return [...children].sort((a, b) => a.position.y - b.position.y)
  }

  // 有内部连线：从子入口（未被其他子积木指向）开始按连线遍历，孤立子积木按 Y 追加
  const entries = children
    .filter(c => !internalTargets.has(c.id))
    .sort((a, b) => a.position.y - b.position.y)
  const result: BlockInstance[] = []
  const visited = new Set<string>()

  const traverse = (block: BlockInstance) => {
    if (visited.has(block.id)) return
    visited.add(block.id)
    result.push(block)
    const nextIds = (connectionMap.get(block.id) || [])
      .filter(conn => childIds.has(conn.targetBlockId))
      .map(conn => conn.targetBlockId)
    nextIds
      .map(id => children.find(c => c.id === id))
      .filter((b): b is BlockInstance => b !== undefined)
      .sort((a, b) => a.position.y - b.position.y)
      .forEach(traverse)
  }

  entries.forEach(traverse)
  children
    .filter(c => !visited.has(c.id))
    .sort((a, b) => a.position.y - b.position.y)
    .forEach(traverse)

  return result
}

/**
 * 处理条件占位符
 * 支持: {{#if prop}}, {{#if prop}}...{{else}}...{{/if}}
 * 支持: {{#if (eq prop "value")}}, {{#if (neq prop value)}}
 */
const processConditionals = (
  template: string,
  properties: Record<string, unknown>
): string => {
  // 处理 neq 条件 (不等于): {{#if (neq prop value)}}...{{else}}...{{/if}} 或 {{#if (neq prop value)}}...{{/if}}
  const neqRegex = /\{\{#if\s+\(neq\s+(\w+)\s+(\w+)\)\}\}(.*?)(?:\{\{else\}\}(.*?))?\{\{\/if\}\}/gs
  template = template.replace(neqRegex, (_, propName, compareValue, trueContent, falseContent = '') => {
    const value = properties[propName]
    const compare = properties[compareValue] ?? compareValue
    // 数值比较
    if (typeof value === 'number' && !isNaN(Number(compare))) {
      return value !== Number(compare) ? trueContent : falseContent
    }
    return String(value) !== String(compare) ? trueContent : falseContent
  })

  // 处理 eq 条件: {{#if (eq prop "value")}}...{{else}}...{{/if}} 或 {{#if (eq prop "value")}}...{{/if}}
  const eqRegex = /\{\{#if\s+\(eq\s+(\w+)\s+"([^"]+)"\)\}\}(.*?)(?:\{\{else\}\}(.*?))?\{\{\/if\}\}/gs
  template = template.replace(eqRegex, (_, propName, compareValue, trueContent, falseContent = '') => {
    const value = String(properties[propName] ?? '')
    return value === compareValue ? trueContent : falseContent
  })

  // 处理简单条件: {{#if prop}}...{{else}}...{{/if}} 或 {{#if prop}}...{{/if}}
  const ifRegex = /\{\{#if\s+(\w+)\}\}(.*?)(?:\{\{else\}\}(.*?))?\{\{\/if\}\}/gs
  template = template.replace(ifRegex, (_, propName, trueContent, falseContent = '') => {
    const value = properties[propName]
    // 对于布尔值，检查是否为 true
    // 对于其他值，检查是否非空
    if (typeof value === 'boolean') {
      return value ? trueContent : falseContent
    }
    return value ? trueContent : falseContent
  })

  return template
}
