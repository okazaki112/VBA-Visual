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
  const targetIds = new Set(connections.map(c => c.targetBlockId))

  // 检查是否有连线
  const hasConnections = connections.length > 0

  // 分离特殊积木和普通积木
  const optionBlocks = blocks.filter(b => b.definitionId === SPECIAL_BLOCKS.OPTION_STATEMENT)
  const subDefineBlocks = blocks.filter(b => b.definitionId === SPECIAL_BLOCKS.SUB_DEFINE)
  const functionDefineBlocks = blocks.filter(b => b.definitionId === SPECIAL_BLOCKS.FUNCTION_DEFINE)
  const hasUserDefinedSubOrFunction = subDefineBlocks.length > 0 || functionDefineBlocks.length > 0
  
  // 普通积木（排除特殊积木）
  const normalBlocks = blocks.filter(b => 
    b.definitionId !== SPECIAL_BLOCKS.OPTION_STATEMENT &&
    b.definitionId !== SPECIAL_BLOCKS.SUB_DEFINE &&
    b.definitionId !== SPECIAL_BLOCKS.FUNCTION_DEFINE
  )

  // 辅助函数：记录映射
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

  // 生成代码
  const codeLines: string[] = []
  let currentLine = 1

  // 1. 首先输出 Option 语句（必须在最顶部）
  optionBlocks.forEach(block => {
    const startLine = currentLine
    const code = generateBlockCodeRecursive(block, blocks, connectionMap, 0)
    if (code) {
      const lines = code.trim().split('\n')
      lines.forEach(line => codeLines.push(line))
      currentLine += lines.length
      recordMapping(block.id, startLine, currentLine - 1)
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
          const code = generateBlockCodeRecursive(normalBlock, blocks, connectionMap, 1)
          if (code) {
            const lines = code.split('\n')
            lines.forEach(line => {
              codeLines.push(line)
              currentLine++
            })
            recordMapping(normalBlock.id, blockStartLine, currentLine - 1)
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
      const code = generateBlockCodeRecursive(block, blocks, connectionMap, 1)
      if (code) {
        const lines = code.split('\n')
        lines.forEach(line => {
          codeLines.push(line)
          currentLine++
        })
        recordMapping(block.id, blockStartLine, currentLine - 1)
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
 * 查找入口节点
 */
const findEntryNodes = (
  blocks: BlockInstance[],
  connections: Connection[]
): BlockInstance[] => {
  const targetIds = new Set(connections.map(c => c.targetBlockId))
  return blocks.filter(b => !targetIds.has(b.id))
}

// 导出函数供外部使用
export { findEntryNodes }

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
      // code 类型：每行添加一级缩进（容器内部）
      const codeIndent = '    '.repeat(indentLevel + 1)
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
 * 递归生成积木块代码
 */
const generateBlockCodeRecursive = (
  block: BlockInstance,
  allBlocks: BlockInstance[],
  connectionMap: Map<string, Connection[]>,
  indentLevel: number
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

  // 获取子节点（用于容器类型积木）
  const childConnections = connectionMap.get(block.id) || []
  const childBlocks = childConnections
    .map(conn => allBlocks.find(b => b.id === conn.targetBlockId))
    .filter((b): b is BlockInstance => b !== undefined)

  // 替换属性占位符
  definition.properties.forEach(prop => {
    const value = block.properties[prop.id] ?? prop.defaultValue
    const placeholder = `{{${prop.id}}}`

    let formattedValue: string
    if (prop.type === 'code') {
      // code 类型：每行添加一级缩进（容器内部）
      const codeIndent = '    '.repeat(indentLevel + 1)
      formattedValue = String(value)
        .split('\n')
        .map(line => line.trim() ? codeIndent + line.trim() : '')
        .join('\n')
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

  // 处理子节点占位符 {{#children}}...{{/children}}
  if (definition.nestingType === 'container' && childBlocks.length > 0) {
    // 对于 Sub/Function 容器，子节点缩进从 1 开始
    const childIndentLevel = indentLevel === 0 ? 1 : indentLevel + 1
    const childCode = childBlocks
      .map(child => generateBlockCodeRecursive(child, allBlocks, connectionMap, childIndentLevel))
      .filter(c => c)
      .join('\n')
    code = code.replace(/\{\{#children\}\}[\s\S]*?\{\{\/children\}\}/g, childCode)
  } else if (definition.nestingType === 'container') {
    // 容器没有子节点时，移除占位符
    code = code.replace(/\{\{#children\}\}[\s\S]*?\{\{\/children\}\}/g, '')
  }

  // 添加缩进（indentLevel 为 0 时不添加缩进，用于顶层代码）
  if (indentLevel > 0) {
    const lines = code.split('\n').map(line => indent + line).join('\n')
    return lines
  }
  
  return code
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

/**
 * 格式化 VBA 代码
 */
export const formatVBACode = (code: string): string => {
  // 简单的代码格式化
  const lines = code.split('\n')
  const formatted: string[] = []
  let indentLevel = 0

  lines.forEach(line => {
    const trimmed = line.trim()

    // 减少缩进的关键字
    if (/^(End|Next|Loop|Wend)/i.test(trimmed)) {
      indentLevel = Math.max(0, indentLevel - 1)
    }

    formatted.push('    '.repeat(indentLevel) + trimmed)

    // 增加缩进的关键字
    if (/(Then|Do|For|While|Sub|Function|If)$/i.test(trimmed) &&
        !/End\s+/i.test(trimmed)) {
      indentLevel++
    }
  })

  return formatted.join('\n')
}

/**
 * 验证 VBA 代码语法（简单检查）
 */
export const validateVBACode = (code: string): {
  valid: boolean
  errors: Array<{ line: number; message: string }>
} => {
  const errors: Array<{ line: number; message: string }> = []
  const lines = code.split('\n')

  // 检查基本的块匹配
  const blockStack: string[] = []

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // 检查开始块
    if (/^Sub\s+/i.test(trimmed)) blockStack.push('Sub')
    if (/^Function\s+/i.test(trimmed)) blockStack.push('Function')
    if (/^If\s+.*\s+Then$/i.test(trimmed)) blockStack.push('If')
    if (/^For\s+/i.test(trimmed)) blockStack.push('For')
    if (/^Do\s+/i.test(trimmed)) blockStack.push('Do')
    if (/^While\s+/i.test(trimmed)) blockStack.push('While')

    // 检查结束块
    if (/^End\s+Sub$/i.test(trimmed) && blockStack[blockStack.length - 1] !== 'Sub') {
      errors.push({ line: index + 1, message: 'Sub 块未正确关闭' })
    }
    if (/^End\s+Function$/i.test(trimmed) && blockStack[blockStack.length - 1] !== 'Function') {
      errors.push({ line: index + 1, message: 'Function 块未正确关闭' })
    }
    if (/^End\s+If$/i.test(trimmed) && blockStack[blockStack.length - 1] !== 'If') {
      errors.push({ line: index + 1, message: 'If 块未正确关闭' })
    }
    if (/^Next$/i.test(trimmed) && blockStack[blockStack.length - 1] !== 'For') {
      errors.push({ line: index + 1, message: 'For 块未正确关闭' })
    }
    if (/^Loop$/i.test(trimmed) && blockStack[blockStack.length - 1] !== 'Do') {
      errors.push({ line: index + 1, message: 'Do 块未正确关闭' })
    }
    if (/^Wend$/i.test(trimmed) && blockStack[blockStack.length - 1] !== 'While') {
      errors.push({ line: index + 1, message: 'While 块未正确关闭' })
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}
