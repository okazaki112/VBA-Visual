// 行为测试套件（常驻仓库版）：由 scripts/behavior-tests/run.mjs 构建被测模块后执行
const path = require('node:path')
const BUNDLE_DIR = process.env.VBA_BUNDLE_DIR || '.'

const { generateCodeWithMappings } = require(require('node:path').resolve(BUNDLE_DIR, 'codeGenerator.cjs'))
let pass = 0, fail = 0
const assert = (cond, name, detail = '') => {
  if (cond) { pass++; console.log('  PASS', name) }
  else { fail++; console.log('  FAIL', name, detail) }
}

// ========== T20: v1.6.0 双体容器 ==========
console.log('[T20] If-Else 双体容器')
const blocks = [
  { id: 'sub1', definitionId: 'block-sub-define', type: 'sub_define', position: {x:0,y:0}, properties: { subName: 'Grade', parameters: '', bodyCode: '' }, order: 1 },
  { id: 'if1', definitionId: 'block-if-else-statement', type: 'if_else_statement', position: {x:0,y:100}, properties: { condition: 'score >= 60', thenCode: '', elseCode: '' }, order: 2 },
  { id: 't1', definitionId: 'block-msgbox', type: 'msgbox', position: {x:0,y:200}, properties: { message: '"pass"', buttons: 'vbOKOnly' }, order: 3, parentId: 'if1' },
  { id: 'e1', definitionId: 'block-msgbox', type: 'msgbox', position: {x:0,y:300}, properties: { message: '"fail"', buttons: 'vbOKOnly' }, order: 4, parentId: 'if1', parentSlot: 'else' },
  { id: 'm1', definitionId: 'block-msgbox', type: 'msgbox', position: {x:0,y:400}, properties: { message: '"done"', buttons: 'vbOKOnly' }, order: 5 }
]
const conns = [
  { id: 'c1', sourceBlockId: 'sub1', sourcePortId: 'bottom', targetBlockId: 'if1', targetPortId: 'top' },
  { id: 'c2', sourceBlockId: 'if1', sourcePortId: 'bottom', targetBlockId: 'm1', targetPortId: 'top' }
]
const gen = generateCodeWithMappings(blocks, conns)
console.log('--- gen ---'); console.log(gen.code); console.log('---------')
assert(!gen.code.includes('{{'), '无残留占位符', gen.code)
const lines = gen.code.split('\n')
const elseIdx = lines.findIndex(l => l.trim() === 'Else')
const passIdx = lines.findIndex(l => l.includes('"pass"'))
const failIdx = lines.findIndex(l => l.includes('"fail"'))
const doneIdx = lines.findIndex(l => l.includes('"done"'))
assert(elseIdx > 0 && passIdx > 0 && passIdx < elseIdx, 'Then 体在 Else 之前')
assert(failIdx > elseIdx, 'Else 体在 Else 之后', `elseIdx=${elseIdx} failIdx=${failIdx}`)
assert(doneIdx > lines.findIndex(l => l.trim() === 'End If'), '流程后继在 End If 之后')
// 子积木行级映射
const tMap = gen.mappings.find(m => m.blockId === 't1')
const eMap = gen.mappings.find(m => m.blockId === 'e1')
assert(tMap && lines[tMap.lineStart - 1].includes('"pass"') && tMap.lineStart - 1 < elseIdx, 'Then 子积木映射正确')
assert(eMap && lines[eMap.lineStart - 1].includes('"fail"') && eMap.lineStart - 1 > elseIdx, 'Else 子积木映射正确', JSON.stringify(eMap))

// ========== T21: 旧数据兼容——elseCode 文本回退 ==========
console.log('[T21] elseCode 文本回退')
const blocks2 = [
  { id: 'if2', definitionId: 'block-if-else-statement', type: 'if_else_statement', position: {x:0,y:0}, properties: { condition: 'a > 1', thenCode: 'b = 1', elseCode: 'b = 2' }, order: 1 }
]
const gen2 = generateCodeWithMappings(blocks2, [])
assert(gen2.code.includes('b = 1') && gen2.code.includes('Else') && gen2.code.includes('b = 2'), '文本回退完整', gen2.code)

// ========== T22: parentSlot 缺省 = then ==========
console.log('[T22] parentSlot 缺省')
const blocks3 = [
  { id: 'if3', definitionId: 'block-if-else-statement', type: 'if_else_statement', position: {x:0,y:0}, properties: { condition: 'a > 1', thenCode: '', elseCode: '' }, order: 1 },
  { id: 'c1', definitionId: 'block-msgbox', type: 'msgbox', position: {x:0,y:100}, properties: { message: '"in-then"', buttons: 'vbOKOnly' }, order: 2, parentId: 'if3' }
]
const gen3 = generateCodeWithMappings(blocks3, [])
assert(gen3.code.includes('"in-then"') && gen3.code.indexOf('"in-then"') < gen3.code.indexOf('Else'), '无 parentSlot 默认进 Then 体', gen3.code)

// ========== T23: Else 体内部连线排序 ==========
console.log('[T23] Else 体内部连线')
const blocks4 = [
  { id: 'if4', definitionId: 'block-if-else-statement', type: 'if_else_statement', position: {x:0,y:0}, properties: { condition: 'a > 1', thenCode: '', elseCode: '' }, order: 1 },
  { id: 'e1', definitionId: 'block-assignment', type: 'assignment', position: {x:0,y:100}, properties: { varName: 'b', value: '2' }, order: 2, parentId: 'if4', parentSlot: 'else' },
  { id: 'e2', definitionId: 'block-assignment', type: 'assignment', position: {x:0,y:200}, properties: { varName: 'c', value: 'b + 1' }, order: 3, parentId: 'if4', parentSlot: 'else' }
]
const conns4 = [{ id: 'ce', sourceBlockId: 'e1', sourcePortId: 'bottom', targetBlockId: 'e2', targetPortId: 'top' }]
const gen4 = generateCodeWithMappings(blocks4, conns4)
const e1Line = gen4.code.split('\n').findIndex(l => l.includes('b = 2'))
const e2Line = gen4.code.split('\n').findIndex(l => l.includes('c = b + 1'))
assert(e1Line > 0 && e2Line === e1Line + 1, 'Else 体内部按连线顺序生成', gen4.code)

console.log(`\n结果: PASS=${pass} FAIL=${fail}`)
process.exit(fail ? 1 : 0)
