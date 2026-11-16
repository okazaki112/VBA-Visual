// 行为测试套件（常驻仓库版）：由 scripts/behavior-tests/run.mjs 构建被测模块后执行
const path = require('node:path')
const BUNDLE_DIR = process.env.VBA_BUNDLE_DIR || '.'

const { generateCodeWithMappings } = require(require('node:path').resolve(BUNDLE_DIR, 'codeGenerator.cjs'))
const {
  collectVariables, collectVariableDeclarations, buildOccurrenceIndex,
  findUnusedVariables, findDuplicateDeclarations, findLoopBoundWarnings,
  replaceIdentifierOccurrences
} = require(require('node:path').resolve(BUNDLE_DIR, 'variableScanner.cjs'))

let pass = 0, fail = 0
const assert = (cond, name, detail = '') => {
  if (cond) { pass++; console.log('  PASS', name) }
  else { fail++; console.log('  FAIL', name, detail) }
}

// ========== T14: F-1 子积木行级映射 ==========
console.log('[T14] 子积木行级映射')
const blocks = [
  { id: 'sub1', definitionId: 'block-sub-define', type: 'sub_define', position: {x:0,y:0}, properties: { subName: 'Demo', parameters: '', bodyCode: '' }, order: 1 },
  { id: 'for1', definitionId: 'block-for-loop', type: 'for_loop', position: {x:0,y:100}, properties: { counter: 'i', start: 1, end: 3, step: 1, loopBody: '' }, order: 2 },
  { id: 'w1', definitionId: 'block-cell-write', type: 'cell_write', position: {x:0,y:200}, properties: { refType: 'Cells', cellRef: '1, 1', value: '"a"' }, order: 3, parentId: 'for1' },
  { id: 'w2', definitionId: 'block-cell-write', type: 'cell_write', position: {x:0,y:300}, properties: { refType: 'Cells', cellRef: '2, 1', value: '"b"' }, order: 4, parentId: 'for1' }
]
const conns = [{ id: 'c1', sourceBlockId: 'sub1', sourcePortId: 'bottom', targetBlockId: 'for1', targetPortId: 'top' }]
const gen = generateCodeWithMappings(blocks, conns)
const codeLines = gen.code.split('\n')
const childMappings = gen.mappings.filter(m => m.blockId === 'w1' || m.blockId === 'w2')
assert(childMappings.length === 2, '子积木各有独立 mapping', JSON.stringify(gen.mappings))
childMappings.forEach(m => {
  const text = codeLines.slice(m.lineStart - 1, m.lineEnd).join('\n')
  const expect = m.blockId === 'w1' ? '"a"' : '"b"'
  assert(text.includes(expect) && !text.includes('"b"') || (m.blockId === 'w2' && text.includes('"b"')), `mapping 行号命中内容 (${m.blockId}: ${m.lineStart}-${m.lineEnd})`, JSON.stringify(text))
  assert(codeLines[m.lineStart - 1].startsWith('        '), 'mapping 行缩进 8 空格')
})
const forMapping = gen.mappings.find(m => m.blockId === 'for1')
assert(forMapping && forMapping.lineStart < childMappings[0].lineStart && forMapping.lineEnd >= childMappings[1].lineEnd, '容器 span 覆盖子积木', JSON.stringify(forMapping))

// ========== T15: F-2 未使用变量 ==========
console.log('[T15] 未使用变量')
const blocks2 = [
  { id: 'd1', definitionId: 'block-variable-declare', type: 'variable_declare', position: {x:0,y:0}, properties: { varName: 'usedVar', varType: 'Long' }, order: 1 },
  { id: 'd2', definitionId: 'block-variable-declare', type: 'variable_declare', position: {x:0,y:50}, properties: { varName: 'deadVar', varType: 'String' }, order: 2 },
  { id: 'a1', definitionId: 'block-assignment', type: 'assignment', position: {x:0,y:100}, properties: { varName: 'x', value: 'usedVar + 1' }, order: 3 }
]
const decls = collectVariableDeclarations(blocks2)
const occs = buildOccurrenceIndex(blocks2)
const unused = findUnusedVariables(decls, occs)
const unusedNames = unused.map(v => v.name).sort()
assert(JSON.stringify(unusedNames) === JSON.stringify(['deadVar', 'x']), 'deadVar 与死存储 x 检出为未使用', JSON.stringify(unused))

// ========== T16: F-3 重复声明 ==========
console.log('[T16] 重复声明')
const blocks3 = [
  { id: 'd1', definitionId: 'block-variable-declare', type: 'variable_declare', position: {x:0,y:0}, properties: { varName: 'dup', varType: 'Long' }, order: 1 },
  { id: 'd2', definitionId: 'block-variable-declare', type: 'variable_declare', position: {x:0,y:50}, properties: { varName: 'DUP', varType: 'String' }, order: 2 }
]
const dups = findDuplicateDeclarations(collectVariableDeclarations(blocks3))
assert(dups.length === 1 && dups[0].name === 'dup' && dups[0].blocks.length === 2, '大小写不敏感的重复声明检出', JSON.stringify(dups))

// ========== T17: F-4 循环边界 ==========
console.log('[T17] 循环边界')
const loopWarn = findLoopBoundWarnings([
  { id: 'f1', definitionId: 'block-for-loop', type: 'for_loop', position: {x:0,y:0}, properties: { counter: 'i', start: 10, end: 1, step: 1 }, order: 1 },
  { id: 'f2', definitionId: 'block-for-loop', type: 'for_loop', position: {x:0,y:50}, properties: { counter: 'j', start: 1, end: 5, step: 1 }, order: 2 }
])
assert(loopWarn.length === 1 && loopWarn[0].blockId === 'f1', '正向 step 且 start>end 检出', JSON.stringify(loopWarn))

// ========== T18: R-1 重命名联动 ==========
console.log('[T18] 重命名联动')
const rb = [
  { id: 'decl', definitionId: 'block-variable-declare', type: 'variable_declare', position: {x:0,y:0}, properties: { varName: 'total', varType: 'Long' }, order: 1 },
  { id: 'cond', definitionId: 'block-if-statement', type: 'if_statement', position: {x:0,y:50}, properties: { condition: 'total >= 60 And total <> 0', thenCode: '' }, order: 2 },
  { id: 'assign', definitionId: 'block-assignment', type: 'assignment', position: {x:0,y:100}, properties: { varName: 'Set total', value: 'total & "件" + obj.total' }, order: 3 }
]
const changes = replaceIdentifierOccurrences(rb, 'total', 'grandTotal', 'decl')
const condAfter = rb[1].properties.condition
const assignAfter = rb[2].properties
assert(condAfter === 'grandTotal >= 60 And grandTotal <> 0', '条件表达式两处替换', condAfter)
assert(assignAfter.varName === 'Set grandTotal', 'Set 前缀左值替换', assignAfter.varName)
assert(assignAfter.value === 'grandTotal & "件" + obj.total', '字符串不替换/点号属性不替换', assignAfter.value)
assert(!changes.some(c => c.blockId === 'decl'), '排除自身声明块')

// 幂等：再替换一次 total → 无变化（已不存在）
rb[0].properties.varName = 'grandTotal'  // 模拟调用方对声明块自身的更新
const changes2 = replaceIdentifierOccurrences(rb, 'total', 'grandTotal')
assert(changes2.length === 0, '重命名幂等（旧名已不存在）', JSON.stringify(changes2))

// ========== T19: R-2 依赖基础——声明落位所需原语存在 ==========
console.log('[T19] 组合冒烟：生成代码 VBE 结构校验')
const { validateVBACode } = require(require('node:path').resolve(BUNDLE_DIR, 'vbaValidator.cjs'))
const errs = validateVBACode(gen.code)
assert(errs.filter(e => e.severity === 'error').length === 0, '容器生成代码结构校验零错误', JSON.stringify(errs))

console.log(`\n结果: PASS=${pass} FAIL=${fail}`)
process.exit(fail ? 1 : 0)
